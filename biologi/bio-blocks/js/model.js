/* =====================================================================
   Molekylemodellen — træet, kemien og layoutet. Ingen DOM-kald.

   Et molekyle er et træ af residuer med rod i den reducerende ende:
       { name, anomer, at4, at6, at2 }
   Hvert felt holder det residue der donerer sit anomere C-atom ind i
   dette residues C4, C6 eller C2:
       at4 — den almindelige 1,4-kæde i stivelse og cellulose
       at6 — α-1,6-grenpunktet i glykogen og amylopektin
       at2 — kun fruktose: 1,2-bindingen i sakkarose

   Et residue er bundet til sin forælder gennem sit eget anomere C-atom,
   så hvert residue har højst én forælder, og roden er den eneste med et
   frit anomert C-atom — den reducerende ende. At klippe en kant frigiver
   derfor præcis ét fragment og skaber præcis én ny reducerende ende,
   hvilket er nøjagtigt hvad hydrolyse gør.
   ===================================================================== */

import { state } from './state.js';
import { MOL, DISACC, DISACC_OTHER, POLY, SUB, STEP, ROW_H,
         UNIT_W, UNIT_H, UNIT_CY, HW_C6_X } from './data.js';

export const SITE_FIELD = { 2: 'at2', 4: 'at4', 6: 'at6' };

export function residue(name, anomer) {
    return { name, anomer: anomer || state.currentAnomer, at4: null, at6: null, at2: null };
}

/* The residue further from the reducing end along the main chain */
function upstream(n) { return n.at4 || n.at2; }

function chainLength(node) {
    let n = node, c = 0;
    while (n) { c++; n = upstream(n); }
    return c;
}

/* Every residue, every glycosidic bond. Bonds carry everything the rest
   of the app needs, so nothing about a bond is ever stored twice. */
export function analyse(root) {
    const nodes = [], bonds = [];
    (function walk(n) {
        nodes.push(n);
        [4, 2, 6].forEach(site => {
            const donor = n[SITE_FIELD[site]];
            if (!donor) return;
            bonds.push({ donor, acceptor: n, site, anomer: donor.anomer });
            walk(donor);
        });
    })(root);
    return { nodes, bonds };
}

/* The free binding sites of a molecule. There is never more than one free
   anomeric carbon — that is the reducing end, and it is the root. */
export function freeSites(nodes, bonds) {
    const donors = new Set(bonds.map(b => b.donor));
    const sites  = [];

    nodes.forEach(n => {
        const fru = n.name === 'fructose';
        // Fructose's anomeric carbon is C2, and it can act as donor or acceptor
        if (!donors.has(n) && !(fru && n.at2)) sites.push({ node: n, kind: 'anomeric' });
        if (!fru) {
            if (!n.at4) sites.push({ node: n, kind: 'c4' });
            if (!n.at6) sites.push({ node: n, kind: 'c6' });
        }
    });
    return sites;
}

export function hexFormula(n) {
    const s = x => String(x).split('').map(d => SUB[+d]).join('');
    return `C${s(6 * n)}H${s(10 * n + 2)}O${s(5 * n + 1)}`;
}

export function greek(a) { return a === 'a' ? 'α' : 'β'; }

export function bondLabel(bond) {
    if (bond.site === 2) return 'α-1,β-2';
    return `${greek(bond.anomer)}-1,${bond.site}`;
}

/* =====================================================================
   Naming — what have the students actually built?

   Every name, note and SDF path lives in the catalogue in data.js: MOL for
   the monomers, DISACC for the disaccharides, POLY for everything longer.
   What is left here is only the lookup — one table per size — so a protein
   or fat module needs a new data.js and nothing else.
   ===================================================================== */

/* The catalogue entry as the rest of the app wants it. `over` is for the
   one thing an entry cannot know about itself: the monomer's α/β form. */
function described(cfg, formula, over) {
    return { name: cfg.da, formula, key: cfg.key, note: cfg.note,
             sdf: cfg.sdf || null, sdfNote: cfg.sdfNote || '', ...over };
}

const oneOf = (v, x) => Array.isArray(v) ? v.includes(x) : v === x;

/* Does the chain fit the rule? See POLY in data.js for the fields. */
function fits(rule, nodes, bonds) {
    if (rule.upTo && nodes.length > rule.upTo) return false;
    if (rule.residues && !nodes.every(x => x.name === rule.residues)) return false;
    if (rule.branched !== undefined &&
        bonds.some(b => b.site === 6) !== rule.branched) return false;
    if (rule.bonds && !bonds.every(b =>
        Object.entries(rule.bonds).every(([f, v]) => oneOf(v, b[f])))) return false;
    return true;
}

export function classify(nodes, bonds) {
    const n = nodes.length;
    const formula = hexFormula(n);

    if (n === 1) {
        const cfg = MOL[nodes[0].name];
        return described(cfg, formula, { key: nodes[0].name,
                                         name: `${greek(nodes[0].anomer)}-${cfg.da}` });
    }

    if (n === 2) {
        const b = bonds[0];
        const hit = DISACC[`${b.donor.name}|${b.anomer}|${b.site}|${b.acceptor.name}`];
        return described(hit || DISACC_OTHER, formula);
    }

    return described(POLY.find(r => fits(r, nodes, bonds)), formula);
}

/* =====================================================================
   Layout — grid positions for every residue
   ===================================================================== */

/* The reducing end sits furthest right, so chains grow leftwards — the way
   carbohydrates are conventionally drawn. A β-1,4 bond flips the donor ring
   180°; that alternating pattern is the visual signature of cellulose. */
export function layout(root) {
    const pos  = new Map();
    const used = new Map();          // row → Set of occupied columns

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
            pos.set(n, { col: c, row, flip: f, mirrorX: n.name === 'fructose' });
            take(row, c);

            if (n.at6) {
                // The branch donates into this residue's C6, which sits at the
                // ring's top left — so the branch goes one row up and to the left.
                // One spare column on each side so neighbouring branches do
                // not merge into what looks like a single long chain
                const len = chainLength(n.at6);
                let end = c - 1;
                while (!rowFree(row - 1, end - len, end + 1)) end--;
                place(n.at6, end, row - 1, false);
            }

            if (n.at4 && n.at4.anomer === 'b') f = !f;
            n = upstream(n);
            c--;
        }
    })(root, 0, 0, false);

    let minCol = Infinity, maxCol = -Infinity, minRow = Infinity, maxRow = -Infinity;
    pos.forEach(p => {
        minCol = Math.min(minCol, p.col); maxCol = Math.max(maxCol, p.col);
        minRow = Math.min(minRow, p.row); maxRow = Math.max(maxRow, p.row);
    });
    pos.forEach(p => {
        p.x = (p.col - minCol) * STEP;
        p.y = (p.row - minRow) * ROW_H;
    });

    return {
        pos,
        gridW: (maxCol - minCol) * STEP + UNIT_W,
        gridH: (maxRow - minRow) * ROW_H + UNIT_H
    };
}

/* Local coordinates of a binding site, flips included */
export function sitePoint(node, kind, p) {
    const pent = MOL[node.name].shape === 'pent';
    let lx, ly;

    if (kind === 'anomeric') {
        if (pent) { lx = 104.5; ly = 36; }        // fructose: C2 at the right vertex
        else      { lx = UNIT_W; ly = UNIT_CY; }  // pyranose: C1 at the right vertex
    } else if (kind === 'c4') {
        lx = 0; ly = UNIT_CY;
    } else {                                       // c6 — the stub above the ring
        lx = state.repr === 'haworth' ? HW_C6_X : 27.5; ly = -26;
    }

    if (p.mirrorX) lx = UNIT_W - lx;
    if (p.flip)    ly = UNIT_H - ly;
    return { x: p.x + lx, y: p.y + ly };
}
