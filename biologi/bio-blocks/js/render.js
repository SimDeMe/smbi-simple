/* =====================================================================
   Tegning: fra model til SVG.

   Alle repræsentationer bruger den samme kasse og de samme
   bindingspunkter, så eleverne kan skifte visning og se det samme
   molekyle. Hvad der står inde i kassen, bestemmer modulet: en
   Haworth-ring, en aminosyrerygrad eller en fedtsyrekæde.
   ===================================================================== */

import { state } from './state.js';
import { mod } from './modules/index.js';
import { atLeast } from './levels.js';
import { molLayer, svgDefs } from './dom.js';
import { SVG_NS, sub, text, line, rect, badge } from './svg.js';
import { unitGroup, placedText } from './draw.js';
import { UNIT_W, UNIT_H, UNIT_CX, ARM } from './units.js';
import { analyse, layout, classify, freeSites, sitePoint, shapeOf,
         monoFormula, sumAtoms, formulaText, bondLabel } from './model.js';
import { startDrag } from './drag.js';

export function makeMolecule(root, x, y) {
    const { nodes, bonds } = analyse(root);
    const { pos, gridW, gridH } = layout(root);
    const info  = classify(nodes, bonds);
    const sites = freeSites(nodes, bonds);
    const n     = nodes.length;
    const scale = n <= 2 ? 1 : n <= 4 ? 0.82 : n <= 6 ? 0.7 : 0.58;

    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'molecule appear');
    g.setAttribute('filter', 'url(#soft-shadow)');
    molLayer.appendChild(g);

    const inner = document.createElementNS(SVG_NS, 'g');
    inner.setAttribute('class', 'mol-inner');
    g.appendChild(inner);

    const gCards = sub(inner), gBonds = sub(inner), gArms = sub(inner),
          gUnits = sub(inner), gDecor = sub(inner), gChrome = sub(inner);

    // Usynligt gribeareal, så hele molekylet — også hullerne — kan tages
    const hit = rect(0, 0, gridW, gridH, 'transparent');
    hit.setAttribute('pointer-events', 'all');
    gUnits.appendChild(hit);

    // En enhed der er bundet gennem sin egen donorplads, har ingen fri
    // gruppe dér — det skal strukturformlen vide
    const donors = new Set(bonds.map(b => b.donor));

    if (state.repr !== 'struct') drawArms(gArms, nodes, pos);
    bonds.forEach(b => drawBond(gBonds, gDecor, b, pos));
    nodes.forEach(node => drawUnit(gUnits, node, pos.get(node), donors.has(node), gCards));

    const extent = drawChrome(gChrome, info, nodes, bonds, gridW, gridH, scale);

    g.setAttribute('transform', `translate(${x}, ${y}) scale(${scale})`);
    g._scale = scale;
    g._model = { root, nodes, bonds, pos, sites, info, scale };
    g._box   = { w: gridW * scale, ...extent };
    Object.assign(g.dataset, { x, y });

    g.addEventListener('pointerdown', startDrag);
    g.addEventListener('animationend', () => g.classList.remove('appear', 'shake'));

    state.molecules.push(g);
    return g;
}

/* Én enhed, tegnet i den visning der er slået til. Strukturformlen er
   modulets egen; blokken og sumformlen er fælles. */
function drawUnit(parent, node, p, isDonor, cards) {
    if (state.repr === 'struct')
        return mod().struct(parent, node, p, { isDonor, cards, numbers: state.showNumbers });
    if (state.repr === 'formula') return drawFormula(parent, node, p);
    drawBlock(parent, node, p);
}

function drawBlock(parent, node, p) {
    const m    = mod();
    const cfg  = m.mon[node.name];
    const sh   = shapeOf(node);
    const unit = unitGroup(parent, p);

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', sh.path);
    path.setAttribute('fill', `url(#grad-${node.name})`);
    path.setAttribute('class', 'shape-body');
    unit.appendChild(path);

    if (state.showNumbers && sh.atoms) {
        sh.atoms.forEach(([label, cx, cy, extra]) => {
            placedText(unit, p, label, cx, cy + 3.5, 'c-num' + (extra ? ' ' + extra : ''));
        });
    }

    if (m.decorate) m.decorate(unit, node, p);

    // Etiketterne tegnes i en uspejlet gruppe, så de altid læses forfra
    const lab = document.createElementNS(SVG_NS, 'g');
    lab.setAttribute('transform', `translate(${p.x}, ${p.y})`);
    parent.appendChild(lab);
    m.blockLabels(node).forEach(l => lab.appendChild(text(l.text, UNIT_CX, l.y, l.cls)));
}

/* Sumformel — hver enhed med sin egen formel. For sukrene er de alle ens
   (C₆H₁₂O₆); for aminosyrer og fedtsyrer er de ikke, og det er lige så
   meget en pointe. */
function drawFormula(parent, node, p) {
    const unit = unitGroup(parent, p);

    const box = rect(2, 0, UNIT_W - 4, UNIT_H, null);
    box.setAttribute('fill', `url(#grad-${node.name})`);
    box.setAttribute('class', 'fm-box');
    box.setAttribute('rx', 14);
    unit.appendChild(box);

    const lab = document.createElementNS(SVG_NS, 'g');
    lab.setAttribute('transform', `translate(${p.x}, ${p.y})`);
    parent.appendChild(lab);

    lab.appendChild(text(monoFormula(node), UNIT_CX, 46, 'fm-formula'));
    lab.appendChild(text(mod().monomerName(node), UNIT_CX, 64, 'fm-name'));
}

/* Stubben ud til en grenplads: tegnes for alle enheder der har en, når
   nummereringen er slået til, og altid når grenen faktisk sidder der. */
function drawArms(parent, nodes, pos) {
    const m = mod();

    nodes.forEach(node => {
        const p = pos.get(node);
        (m.mon[node.name].accepts || []).forEach(kind => {
            const link = m.links[kind];
            if (!link.stub) return;
            if (!node[link.field] && !(state.showNumbers && state.repr === 'blocks')) return;

            const pt    = sitePoint(node, kind, p);
            const baseY = p.flip ? p.y + UNIT_H : p.y;
            const dir   = p.flip ? 1 : -1;

            parent.appendChild(line(pt.x, baseY, pt.x, baseY + dir * 18, 'arm-line'));

            const c = document.createElementNS(SVG_NS, 'circle');
            c.setAttribute('cx', pt.x);
            c.setAttribute('cy', pt.y);
            c.setAttribute('r', 9);
            c.setAttribute('class', 'arm-dot');
            parent.appendChild(c);
            parent.appendChild(text(link.stub.label, pt.x, pt.y + 3.5, 'arm-text'));
        });
    });
}

function drawBond(lineLayer, decorLayer, bond, pos) {
    const m = mod();
    const a = sitePoint(bond.donor, m.donorKind, pos.get(bond.donor));
    const b = sitePoint(bond.acceptor, bond.kind, pos.get(bond.acceptor));
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    bond.mid = mid;                       // enzymernes drop-zone

    lineLayer.appendChild(line(a.x, a.y, b.x, b.y, 'bond-line'));

    const hit = document.createElementNS(SVG_NS, 'g');
    hit.setAttribute('class', 'bond-hit');
    hit.dataset.bond = '1';
    hit._bond = bond;
    decorLayer.appendChild(hit);

    const c = document.createElementNS(SVG_NS, 'circle');
    c.setAttribute('cx', mid.x); c.setAttribute('cy', mid.y);
    c.setAttribute('r', 12);
    c.setAttribute('class', 'bond-atom');
    hit.appendChild(c);
    hit.appendChild(text(m.bondAtom(bond), mid.x, mid.y + 4.5, 'bond-atom-text'));

    const title = document.createElementNS(SVG_NS, 'title');
    title.textContent = `${bondLabel(bond)} — klik for at hydrolysere netop denne binding`;
    hit.appendChild(title);

    // Ved siden af den skrå grenbinding, over stregen ved resten. Et modul
    // kan sige noget andet — fedtets tre estere sidder tættere sammen.
    const off = m.bondNote ? m.bondNote(bond)
              : bond.branch ? { x: 34, y: -4 } : { x: 0, y: -19 };
    decorLayer.appendChild(text(bondLabel(bond), mid.x + off.x, mid.y + off.y, 'bond-note'));
}

/* Regnestykket i formelvisningen: bygger kæden af ens enheder, kan det
   skrives som et gangestykke — ellers lægges de sammen. Vandet trækkes
   fra i begge tilfælde, og det er hele pointen. */
function waterEquation(nodes, bonds, total) {
    const n    = nodes.length;
    const same = nodes.every(x => x.name === nodes[0].name);
    const left = same ? `${n} × ${monoFormula(nodes[0])}`
                      : formulaText(sumAtoms(nodes));
    return `${left} − ${bonds.length} H₂O = ${total}`;
}

/* Navneskilt øverst, opsummering og knapper nedenunder.

   Teksten skaleres modsat molekylet, så navnet og opsummeringen har
   samme størrelse uanset hvor meget en lang kæde er skrumpet.
   Koordinaterne er derfor skærmpixels og ikke gitterenheder.

   Returnerer molekylets udstrækning: hvor langt det når over og under
   gitteret, og hvor langt teksten stikker ud til siderne. */
function drawChrome(parent, info, nodes, bonds, gridW, gridH, scale) {
    parent.setAttribute('transform', `scale(${1 / scale})`);

    const m   = mod();
    const n   = nodes.length;
    const cx  = gridW / 2 * scale;
    const arm = ARM * scale;
    const top = -(arm + 30);
    let widest = 0;

    const say = (str, y, cls) => {
        const t = text(str, cx, y, cls);
        parent.appendChild(t);
        widest = Math.max(widest, t.getComputedTextLength());
        return t;
    };

    const label = say(`${info.name} · ${info.formula}`, top + 18, 'product-label');
    const w = label.getComputedTextLength() + 26;
    const bg = rect(cx - w / 2, top, w, 26, null);
    bg.setAttribute('class', 'product-bg');
    bg.setAttribute('rx', 8);
    parent.insertBefore(bg, label);

    let y = gridH * scale + arm + 18;
    if (n > 1) {
        const b = bonds.length;
        const unit = m.nouns.unit[n === 1 ? 0 : 1];
        const bnd  = m.nouns.bond[b === 1 ? 0 : 1];
        say(`${n} ${unit} · ${b} ${bnd} · ${b} H₂O fraspaltet`, y, 'info-line');
        y += 16;
        if (state.repr === 'formula') {
            say(waterEquation(nodes, bonds, info.formula), y, 'info-eq');
            y += 17;
        }
    }
    say(info.note, y, 'info-note');
    y += 26;

    // Knapperne under molekylet følger niveauet ligesom topbjælken: 3D
    // hører til A og formskiftet til B, mens faktakortet og den fulde
    // hydrolyse er med hele vejen
    const buttons = [['ℹ', 'badge-info', 'facts', 'Faktakort: hvor findes det, rolle og fordøjelighed']];
    if (info.sdf && atLeast('A'))             buttons.push(['👁', 'badge-3d', 'view', 'Se molekylet i 3D']);
    if (n === 1 && m.variant && atLeast('B')) buttons.push(['α⇄β', 'badge-flip', 'flip', m.variant.flipTip]);
    if (n > 1)                buttons.push(['✂', 'badge-cut', 'cut', 'Fuld hydrolyse til byggesten']);

    buttons.forEach(([glyph, cls, action, tip], i) => {
        const bx = cx + (i - (buttons.length - 1) / 2) * 44;
        parent.appendChild(badge(bx, y + 4, glyph, cls, action, tip));
    });

    return {
        up:   -top + 4,
        down: y + 24,
        pad:  Math.max(0, (widest + 20 - gridW * scale) / 2)
    };
}

/* Farverne hører til kataloget, så gradienterne bygges når modulet
   skiftes — ellers skulle hver ny stofgruppe også redigeres ind i
   markup'en. */
export function syncGradients() {
    svgDefs.querySelectorAll('linearGradient').forEach(g => g.remove());
    Object.entries(mod().mon).forEach(([name, cfg]) => {
        const g = document.createElementNS(SVG_NS, 'linearGradient');
        g.id = 'grad-' + name;
        g.setAttribute('x1', 0); g.setAttribute('y1', 0);
        g.setAttribute('x2', 0); g.setAttribute('y2', 1);
        cfg.colour.forEach((c, i) => {
            const s = document.createElementNS(SVG_NS, 'stop');
            s.setAttribute('offset', i ? '100%' : '0%');
            s.setAttribute('stop-color', c);
            g.appendChild(s);
        });
        svgDefs.appendChild(g);
    });
}
