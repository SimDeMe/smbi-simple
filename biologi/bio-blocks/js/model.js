/* =====================================================================
   Molekylemodellen — træet, kemien og layoutet. Ingen DOM-kald, og intet
   kendskab til hvilket stofområde der er valgt.

   Et molekyle er et træ af enheder med rod i den ende der ikke er bundet
   videre. Hvert felt på en enhed holder den enhed, der donerer sin
   "hale" ind i netop den plads:

       kulhydrat   at4 / at6 / at2   1,4-kæden, 1,6-grenen, sakkarosens 1,2
       protein     atN               peptidbindingen ind i aminogruppen
       fedt        a1 / a2 / a3      glycerolens tre OH-grupper

   Hvilke felter der findes, står i modulets `links`. Fælles for dem alle
   er, at en enhed er bundet til sin forælder gennem sin egen donorplads,
   så hver enhed har højst én forælder, og roden er den eneste med en fri
   donorplads. At klippe en kant frigiver derfor præcis ét fragment og
   skaber præcis én ny fri ende — nøjagtigt hvad hydrolyse gør.
   ===================================================================== */

import { state } from './state.js';
import { mod } from './modules/index.js';
import { SUB, STEP, ROW_H, UNIT_W, UNIT_H } from './units.js';

export function residue(name, variant) {
    const m = mod();
    const n = { name };
    if (m.variant) n[m.variant.field] = variant || variantOf(name);
    Object.values(m.links).forEach(link => { n[link.field] = null; });
    return n;
}

/* Formen (α/β) hører til den enkelte byggesten og ikke til modulet: en
   glukose lægges ud som α og en galaktose som β, fordi det er de former
   de har i maltose og laktose. Kataloget holder udgangspunktet, og
   `state.variants` holder det eleven har vendt om på. */
export function defaultVariant(name) {
    const m = mod();
    if (!m.variant) return null;
    return m.mon[name].variant || m.variant.options[0].id;
}

export function variantOf(name) {
    return state.variants[name] || defaultVariant(name);
}

/* Tilbage til udgangspunktet — ved modulskift, og når niveauet falder til
   C, hvor kontakterne ikke er fremme til at vende dem tilbage med. */
export function resetVariants() {
    const m = mod();
    state.variants = {};
    if (!m.variant) return;
    Object.keys(m.mon).forEach(name => { state.variants[name] = defaultVariant(name); });
}

export function shapeOf(node) {
    const m = mod();
    return m.shapes[m.mon[node.name].shape];
}

/* Enheden længere ude ad selve kæden — den plads modulet har givet
   dRow 0, altså den der bliver i samme række. */
function mainChild(n) {
    const m = mod();
    for (const kind of m.mon[n.name].accepts || []) {
        const link = m.links[kind];
        if (!link.dRow && n[link.field]) return n[link.field];
    }
    return null;
}

function chainLength(node) {
    let n = node, c = 0;
    while (n) { c++; n = mainChild(n); }
    return c;
}

/* Alle enheder, alle bindinger. Bindingen bærer alt hvad resten af appen
   skal bruge, så intet om en binding gemmes to steder. */
export function analyse(root) {
    const m = mod(), nodes = [], bonds = [];
    (function walk(n) {
        nodes.push(n);
        (m.mon[n.name].accepts || []).forEach(kind => {
            const link  = m.links[kind];
            const donor = n[link.field];
            if (!donor) return;
            const bond = { donor, acceptor: n, kind, field: link.field,
                           site: link.site, branch: !!link.dRow };
            if (m.variant) bond[m.variant.field] = donor[m.variant.field];
            bonds.push(bond);
            walk(donor);
        });
    })(root);
    return { nodes, bonds };
}

/* De frie pladser. `canDonate` er sandt for den ene plads der kan hægte
   molekylet på et andet — der er aldrig mere end én, fordi enhver enhed
   er bundet opad gennem netop den plads. */
export function freeSites(nodes, bonds) {
    const m = mod();
    const used  = new Set(bonds.map(b => b.donor));
    const sites = [];

    nodes.forEach(n => {
        const cfg     = m.mon[n.name];
        const accepts = cfg.accepts || [];

        accepts.forEach(kind => {
            const link = m.links[kind];
            if (n[link.field]) return;                     // pladsen er optaget
            sites.push({ node: n, kind, link,
                         canDonate: !!cfg.donor && kind === m.donorKind && !used.has(n) });
        });

        // Donorpladsen, når den ikke samtidig er en modtagerplads på denne
        // enhed (fruktoses C2 er begge dele og er derfor allerede med)
        if (cfg.donor && !used.has(n) && !accepts.includes(m.donorKind))
            sites.push({ node: n, kind: m.donorKind, link: null, canDonate: true });
    });
    return sites;
}

/* =====================================================================
   Sumformel — lagt sammen, ikke slået op.

   Hver monomer har sin egen atomoptælling i modulets katalog, og hver
   binding koster ét vandmolekyle. Det er hele reglen, og den er den
   samme for stivelse, protein og fedt.
   ===================================================================== */

const sub = x => String(x).split('').map(d => SUB[+d]).join('');

function addAtoms(into, atoms, times) {
    Object.entries(atoms).forEach(([el, n]) => {
        into[el] = (into[el] || 0) + n * times;
    });
    return into;
}

export function sumAtoms(nodes) {
    const m = mod(), f = {};
    nodes.forEach(n => addAtoms(f, m.mon[n.name].atoms, 1));
    return f;
}

export function formulaOf(nodes, bonds) {
    return addAtoms(sumAtoms(nodes), { H: 2, O: 1 }, -bonds.length);
}

/* Hill-notation: C først, så H, og resten alfabetisk */
export function formulaText(f) {
    const rest = Object.keys(f).filter(el => el !== 'C' && el !== 'H').sort();
    return ['C', 'H', ...rest]
        .filter(el => f[el])
        .map(el => el + (f[el] === 1 ? '' : sub(f[el])))
        .join('');
}

export function monoFormula(node) {
    return formulaText(mod().mon[node.name].atoms);
}

/* =====================================================================
   Navngivning — hvad har eleverne egentlig bygget?

   Navne, noter og SDF-stier står i modulets `names`: en liste af regler,
   der *beskriver* molekylet i stedet for at teste det. Den første regel
   der passer, vinder, så de snævre står først. Her står kun opslaget.
   ===================================================================== */

const oneOf = (v, x) => Array.isArray(v) ? v.includes(x) : v === x;

function bondFits(match, b) {
    return Object.entries(match).every(([f, v]) => {
        const val = f === 'donor'    ? b.donor.name
                  : f === 'acceptor' ? b.acceptor.name
                  : b[f];
        return oneOf(v, val);
    });
}

/* Feltene i en regel: size / upTo / from (antal enheder), residues (alle
   enheder skal være denne), branched (kræver eller forbyder grene) og
   bonds (alle bindinger skal matche; en liste betyder "en af"). */
function fits(rule, nodes, bonds) {
    const n = nodes.length;
    if (rule.size !== undefined && n !== rule.size) return false;
    if (rule.upTo && n > rule.upTo) return false;
    if (rule.from && n < rule.from) return false;
    if (rule.residues && !nodes.every(x => oneOf(rule.residues, x.name))) return false;
    if (rule.branched !== undefined && bonds.some(b => b.branch) !== rule.branched) return false;
    if (rule.bonds && !bonds.every(b => bondFits(rule.bonds, b))) return false;
    return true;
}

export function classify(nodes, bonds) {
    const m = mod();
    const formula = formulaText(formulaOf(nodes, bonds));

    if (nodes.length === 1) {
        const cfg = m.mon[nodes[0].name];
        return { name: m.monomerName(nodes[0]), formula, key: nodes[0].name,
                 note: cfg.note, sdf: cfg.sdf || null, sdfNote: cfg.sdfNote || '' };
    }

    const rule = m.names.find(r => fits(r, nodes, bonds)) ||
                 { da: 'Molekyle', key: null, note: '' };
    return { name: rule.da, formula, key: rule.key, note: rule.note,
             sdf: rule.sdf || null, sdfNote: rule.sdfNote || '' };
}

export function bondLabel(bond) { return mod().bondLabel(bond); }

/* =====================================================================
   Layout — gitterpositioner til hver enhed
   ===================================================================== */

/* Roden sidder yderst til højre, så kæder vokser mod venstre: den
   reducerende ende i et sukker, C-enden i et peptid. En binding kan
   vende donoren 180° (β-1,4), og det skiftevise mønster er cellulosens
   visuelle signatur — modulet afgør hvornår. */
export function layout(root) {
    const m     = mod();
    const step  = m.step || STEP;
    const rowH  = m.rowH || ROW_H;
    const pos   = new Map();
    const used  = new Map();          // række → Set af optagne kolonner

    const take = (row, col) => {
        if (!used.has(row)) used.set(row, new Set());
        used.get(row).add(col);
    };
    const rowFree = (row, from, to) => {
        const set = used.get(row);
        if (!set) return true;
        for (let c = from; c <= to; c++) if (set.has(c)) return false;
        return true;
    };

    (function place(head, col, row, flip) {
        let n = head, c = col, f = flip;
        while (n) {
            pos.set(n, { col: c, row, flip: f, mirrorX: !!m.mon[n.name].mirror });
            take(row, c);

            (m.mon[n.name].accepts || []).forEach(kind => {
                const link = m.links[kind];
                if (!link.dRow) return;                   // kæden selv, ikke en gren
                const donor = n[link.field];
                if (!donor) return;
                // Grenen går en række op eller ned og til venstre. Én kolonne
                // luft i hver ende, så to nabogrene ikke smelter sammen til
                // noget der ligner én lang kæde.
                const len = chainLength(donor);
                let end = c - 1;
                while (!rowFree(row + link.dRow, end - len, end + 1)) end--;
                place(donor, end, row + link.dRow, false);
            });

            const next = mainChild(n);
            if (next && m.flips(next, fieldOf(n, next))) f = !f;
            n = next;
            c--;
        }
    })(root, 0, 0, false);

    let minCol = Infinity, maxCol = -Infinity, minRow = Infinity, maxRow = -Infinity;
    pos.forEach(p => {
        minCol = Math.min(minCol, p.col); maxCol = Math.max(maxCol, p.col);
        minRow = Math.min(minRow, p.row); maxRow = Math.max(maxRow, p.row);
    });
    pos.forEach(p => {
        p.x = (p.col - minCol) * step;
        p.y = (p.row - minRow) * rowH;
    });

    return {
        pos,
        gridW: (maxCol - minCol) * step + UNIT_W,
        gridH: (maxRow - minRow) * rowH + UNIT_H
    };
}

/* Hvilket felt på forælderen holder barnet? */
function fieldOf(parent, child) {
    const m = mod();
    for (const kind of m.mon[parent.name].accepts || []) {
        const link = m.links[kind];
        if (parent[link.field] === child) return link.field;
    }
    return null;
}

/* Lokale koordinater for et bindingssted, spejlinger og vendinger med.
   Alle repræsentationer bruger de samme punkter — kun visningen der
   flytter et sted (Haworths C6) siger noget andet. */
export function sitePoint(node, kind, p) {
    const sh     = shapeOf(node);
    const byRepr = sh.sitesByRepr && sh.sitesByRepr[state.repr];
    const pt     = (byRepr && byRepr[kind]) || sh.sites[kind];
    let [lx, ly] = pt;

    if (p.mirrorX) lx = UNIT_W - lx;
    if (p.flip)    ly = UNIT_H - ly;
    return { x: p.x + lx, y: p.y + ly };
}
