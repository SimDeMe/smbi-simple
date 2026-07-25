/* =====================================================================
   Tegning: fra model til SVG.

   Alle tre repræsentationer bruger den samme boks og de samme
   bindingspunkter, så eleverne kan skifte visning og se det samme
   molekyle.
   ===================================================================== */

import { state } from './state.js';
import { molLayer } from './dom.js';
import { SVG_NS, sub, text, line, rect, badge } from './svg.js';
import { MOL, SHAPES, CARBONS, HW, HW_C6_X,
         UNIT_W, UNIT_H, UNIT_CX, ARM } from './data.js';
import { analyse, layout, classify, freeSites, sitePoint,
         greek, hexFormula, bondLabel } from './model.js';
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

    // Invisible hit area so the whole molecule — gaps included — can be grabbed
    const hit = rect(0, 0, gridW, gridH, 'transparent');
    hit.setAttribute('pointer-events', 'all');
    gUnits.appendChild(hit);

    // A residue bonded through its own anomeric carbon is a donor — it has
    // no free OH there, which the Haworth drawing has to know about
    const donors = new Set(bonds.map(b => b.donor));

    if (state.repr !== 'haworth') drawArms(gArms, nodes, bonds, pos);
    bonds.forEach(b => drawBond(gBonds, gDecor, b, pos));
    nodes.forEach(node => drawUnit(gUnits, node, pos.get(node), donors.has(node), gCards));

    const extent = drawChrome(gChrome, info, bonds, gridW, gridH, n, scale);

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

/* One residue, drawn in whichever representation is switched on. Every
   representation uses the same box and the same binding-site coordinates,
   so the students can flip between them and see the same molecule. */
function drawUnit(parent, node, p, isDonor, cards) {
    if (state.repr === 'haworth') return drawHaworth(parent, node, p, isDonor, cards);
    if (state.repr === 'formula') return drawFormula(parent, node, p);
    drawBlock(parent, node, p);
}

/* The group a residue is drawn in — mirrored for fructose, flipped 180°
   when a β-1,4 bond turns the ring over. */
function unitGroup(parent, p) {
    const unit = document.createElementNS(SVG_NS, 'g');
    let t = `translate(${p.x}, ${p.y})`;
    if (p.mirrorX) t += ` translate(${UNIT_W},0) scale(-1,1)`;
    if (p.flip)    t += ` translate(0,${UNIT_H}) scale(1,-1)`;
    unit.setAttribute('transform', t);
    parent.appendChild(unit);
    return unit;
}

/* Text inside a mirrored or flipped residue: the mirror is undone on the
   glyphs themselves, so labels always read left to right. */
function placedText(unit, p, str, x, y, cls) {
    const tg = document.createElementNS(SVG_NS, 'g');
    let t = `translate(${x}, ${y})`;
    if (p.mirrorX) t += ' scale(-1,1)';
    if (p.flip)    t += ' scale(1,-1)';
    tg.setAttribute('transform', t);
    tg.appendChild(text(str, 0, 0, cls));
    unit.appendChild(tg);
    return tg;
}

function drawBlock(parent, node, p) {
    const cfg  = MOL[node.name];
    const pent = cfg.shape === 'pent';
    const unit = unitGroup(parent, p);

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', SHAPES[cfg.shape]);
    path.setAttribute('fill', `url(#grad-${node.name})`);
    path.setAttribute('class', 'shape-body');
    unit.appendChild(path);

    if (state.showNumbers) {
        CARBONS[cfg.shape].forEach(([label, cx, cy, extra]) => {
            placedText(unit, p, label, cx, cy + 3.5, 'c-num' + (extra ? ' ' + extra : ''));
        });
    }

    // Labels are drawn in an un-mirrored group so they always read left to right
    const lab = document.createElementNS(SVG_NS, 'g');
    lab.setAttribute('transform', `translate(${p.x}, ${p.y})`);
    parent.appendChild(lab);

    const baseY = pent ? 56 : 50;
    lab.appendChild(text(cfg.abbr, UNIT_CX, baseY, 'label-abbr'));
    lab.appendChild(text(`${greek(node.anomer)}-${cfg.da}`, UNIT_CX, baseY + 16, 'label-name'));
}

/* =====================================================================
   Haworth projection

   Which way an OH points is not decoration — it is the configuration.
   For a D-sugar in this orientation: a group that sits on the right in the
   Fischer projection points down, one on the left points up. That gives
   glucose OH down-up-down on C2-C3-C4, galactose OH up on C4, and the
   anomeric OH down for α and up for β.
   ===================================================================== */

const SUPER = { 1: '¹', 6: '⁶' };

/* Exocyclic groups get their carbon number in front: ⁶CH₂OH. The ring
   carbons are numbered inside the ring instead. */
function hwLabel(label, num) {
    return state.showNumbers && num ? SUPER[num] + label : label;
}

function haworthSubs(node, isDonor) {
    const ano  = node.anomer === 'b' ? 'up' : 'down';   // the α/β signature
    const anti = ano === 'up' ? 'down' : 'up';
    const S = [];

    if (node.name === 'fructose') {
        // C2 is the anomeric carbon and it carries C1 as a side group
        if (!isDonor && !node.at2) S.push({ at: 'C2', dir: ano, label: 'OH' });
        S.push({ at: 'C2', dir: anti, label: 'CH₂OH', num: '1' });
        S.push({ at: 'C3', dir: 'up',   label: 'OH', dx: -12 });
        S.push({ at: 'C4', dir: 'down', label: 'OH' });
        S.push({ at: 'C5', dir: 'up',   label: 'CH₂OH', num: '6', dx: 12 });
        return S;
    }

    if (!isDonor) S.push({ at: 'C1', dir: ano, label: 'OH' });
    S.push({ at: 'C2', dir: 'down', label: 'OH' });
    S.push({ at: 'C3', dir: 'up',   label: 'OH', dx: 6 });
    // Galactose differs from glucose in exactly one OH — this one
    if (!node.at4) S.push({ at: 'C4', dir: node.name === 'galactose' ? 'up' : 'down',
                            label: 'OH' });
    return S;
}

function drawHaworth(parent, node, p, isDonor, cards) {
    const cfg  = MOL[node.name];
    const G    = HW[cfg.shape];
    const unit = unitGroup(parent, p);
    const A    = a => G.at[a];

    // A white card keeps the line drawing readable over the dotted background.
    // It goes in its own layer underneath the bonds, and reaches a little
    // further out on a furanose, where C1 hangs off the anomeric carbon.
    const wide = cfg.shape === 'pent' ? 10 : 0;
    const card = rect(-6, -20, UNIT_W + 12 + wide, UNIT_H + 24, null);
    card.setAttribute('class', 'hw-card');
    card.setAttribute('rx', 10);
    unitGroup(cards, p).appendChild(card);

    // Ring interior in the monomer's own colour, so identity survives the switch
    const poly = document.createElementNS(SVG_NS, 'polygon');
    poly.setAttribute('points', G.ring.map(([a]) => A(a).join(',')).join(' '));
    poly.setAttribute('fill', `url(#grad-${node.name})`);
    poly.setAttribute('fill-opacity', 0.18);
    unit.appendChild(poly);

    G.ring.forEach(([a, b, front]) => {
        const [x1, y1] = A(a), [x2, y2] = A(b);
        unit.appendChild(line(x1, y1, x2, y2, 'hw-bond' + (front ? ' front' : '')));
    });

    // The ring oxygen sits on its vertex, masking the bonds behind it
    const og = document.createElementNS(SVG_NS, 'g');
    og.setAttribute('class', 'hw-o');
    const oc = document.createElementNS(SVG_NS, 'circle');
    oc.setAttribute('cx', A('O')[0]); oc.setAttribute('cy', A('O')[1]);
    oc.setAttribute('r', 8.5);
    og.appendChild(oc);
    unit.appendChild(og);
    placedText(og, p, 'O', A('O')[0], A('O')[1] + 4, null);

    // Substituents: a stick into the lane, then the label. The carbon number
    // rides along as a superscript, which is how a chemist writes it anyway.
    haworthSubs(node, isDonor).forEach(s => {
        const [ax, ay] = A(s.at);
        const lane = G[s.dir];
        const dx   = s.dx || 0;
        unit.appendChild(line(ax, ay, ax + dx, lane.line, 'hw-stick'));
        placedText(unit, p, hwLabel(s.label, s.num), ax + dx, lane.text, 'hw-sub');
    });

    // C6 on a pyranose: the branch point, drawn out of C5 as in a textbook
    if (cfg.shape === 'hex') {
        const [cx, cy] = A('C5');
        const branched = !!node.at6;
        unit.appendChild(line(cx, cy, HW_C6_X, branched ? -26 : 6, 'hw-stick'));
        placedText(unit, p, hwLabel(branched ? 'CH₂' : 'CH₂OH', '6'),
                   branched ? HW_C6_X - 7 : HW_C6_X, -3,
                   'hw-sub' + (branched ? ' end' : ''));
    }

    // Numbers inside the ring, or the abbreviation when numbering is off
    if (state.showNumbers) {
        Object.keys(G.num).forEach(a => {
            const [nx, ny] = G.num[a];
            placedText(unit, p, a.slice(1), nx, ny, 'hw-num');
        });
    } else {
        placedText(unit, p, cfg.abbr, G.centre[0], G.centre[1], 'hw-abbr');
    }
}

/* =====================================================================
   Molecule formula — every residue as its own sum formula. All three
   monosaccharides are C₆H₁₂O₆: same formula, different molecule.
   ===================================================================== */

function drawFormula(parent, node, p) {
    const cfg  = MOL[node.name];
    const unit = unitGroup(parent, p);

    const box = rect(2, 0, UNIT_W - 4, UNIT_H, null);
    box.setAttribute('fill', `url(#grad-${node.name})`);
    box.setAttribute('class', 'fm-box');
    box.setAttribute('rx', 14);
    unit.appendChild(box);

    const lab = document.createElementNS(SVG_NS, 'g');
    lab.setAttribute('transform', `translate(${p.x}, ${p.y})`);
    parent.appendChild(lab);

    lab.appendChild(text(hexFormula(1), UNIT_CX, 46, 'fm-formula'));
    lab.appendChild(text(`${greek(node.anomer)}-${cfg.da}`, UNIT_CX, 64, 'fm-name'));
}

/* The C6 stub: drawn for every residue when numbering is on, and always
   for residues that actually carry a branch. */
function drawArms(parent, nodes, bonds, pos) {
    const branched = new Set(bonds.filter(b => b.site === 6).map(b => b.acceptor));

    nodes.forEach(node => {
        if (MOL[node.name].shape !== 'hex') return;
        if (!branched.has(node) && !(state.showNumbers && state.repr === 'blocks')) return;

        const p = pos.get(node);
        const baseY = p.flip ? p.y + UNIT_H : p.y;
        const dir   = p.flip ? 1 : -1;
        const bx    = p.x + 27.5;

        parent.appendChild(line(bx, baseY, bx, baseY + dir * 18, 'arm-line'));

        const c = document.createElementNS(SVG_NS, 'circle');
        c.setAttribute('cx', bx);
        c.setAttribute('cy', baseY + dir * 26);
        c.setAttribute('r', 9);
        c.setAttribute('class', 'arm-dot');
        parent.appendChild(c);
        parent.appendChild(text('6', bx, baseY + dir * 26 + 3.5, 'arm-text'));
    });
}

function drawBond(lineLayer, decorLayer, bond, pos) {
    const a = sitePoint(bond.donor, 'anomeric', pos.get(bond.donor));
    const b = sitePoint(bond.acceptor,
                        bond.site === 6 ? 'c6' : bond.site === 2 ? 'anomeric' : 'c4',
                        pos.get(bond.acceptor));
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    bond.mid = mid;                       // the state.enzymes' drop zone

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
    hit.appendChild(text('O', mid.x, mid.y + 4.5, 'bond-atom-text'));

    const title = document.createElementNS(SVG_NS, 'title');
    title.textContent = `${bondLabel(bond)} — klik for at hydrolysere netop denne binding`;
    hit.appendChild(title);

    // Sideways for the diagonal branch bond, above the line for the rest
    const off = bond.site === 6 ? { x: 30, y: -4 } : { x: 0, y: -19 };
    decorLayer.appendChild(text(bondLabel(bond), mid.x + off.x, mid.y + off.y, 'bond-note'));
}

/* Name pill on top, summary lines and action buttons below.

   The chrome is counter-scaled, so the name and the summary stay the same
   size no matter how much a long chain has been shrunk. Coordinates are
   therefore given in on-screen pixels rather than grid units.

   Returns the molecule's extent: how far it reaches above and below the
   grid, and how far the text sticks out past the rings on either side. */
function drawChrome(parent, info, bonds, gridW, gridH, n, scale) {
    parent.setAttribute('transform', `scale(${1 / scale})`);

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
        say(`${n} monomerer · ${b} glykosidbinding${b === 1 ? '' : 'er'} · ${b} H₂O fraspaltet`,
            y, 'info-line');
        y += 16;
        // Formula mode makes the water accounting explicit
        if (state.repr === 'formula') {
            say(`${n} × ${hexFormula(1)} − ${b} H₂O = ${info.formula}`, y, 'info-eq');
            y += 17;
        }
    }
    say(info.note, y, 'info-note');
    y += 26;

    const buttons = [['ℹ', 'badge-info', 'facts', 'Faktakort: hvor findes det, sødme, fordøjelighed']];
    if (info.sdf) buttons.push(['👁', 'badge-3d', 'view', 'Se molekylet i 3D']);
    if (n === 1)  buttons.push(['α⇄β', 'badge-flip', 'flip', 'Skift mellem α- og β-form']);
    if (n > 1)    buttons.push(['✂', 'badge-cut', 'cut', 'Fuld hydrolyse til monomerer']);

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
