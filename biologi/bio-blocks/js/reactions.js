/* =====================================================================
   Kemien — hvilke pladser må reagere, og hvad sker der når de gør det
   ===================================================================== */

import { state } from './state.js';
import { pvLayer } from './dom.js';
import { SVG_NS, text, line, rect } from './svg.js';
import { SNAP, MOL } from './data.js';
import { SITE_FIELD, sitePoint, greek } from './model.js';
import { getPos, setPos, clampIntoView, removeMolecule, centreOf,
         addWater, waterFx, setStatus } from './board.js';
import { makeMolecule } from './render.js';
import { taskTick } from './tasks.js';

/* Absolute position of a free site, molecule scale included */
function absSite(mol, site) {
    const p = getPos(mol), s = mol._model.scale;
    const local = sitePoint(site.node, site.kind, mol._model.pos.get(site.node));
    return { x: p.x + local.x * s, y: p.y + local.y * s };
}

function verdictFor(donorNode, accNode, site) {
    if (donorNode.name === 'fructose')
        return { ok: false, msg: 'Fruktose kan ikke være donor her — den binder kun med sit C2 til α-glukosens C1 i sakkarose.',
                 short: 'Fruktose kan ikke donere' };

    if (site === 2) {
        if (donorNode.name !== 'glucose')
            return { ok: false, msg: 'Kun glukose kan binde til fruktose. Sammen danner de sakkarose.',
                     short: 'Kræver glukose' };
        if (donorNode.anomer !== 'a')
            return { ok: false, msg: 'Sakkarose kræver α-glukose. Klik α⇄β på glukosen og prøv igen.',
                     short: 'Kræver α-glukose' };
    }
    return { ok: true };
}

/* The pair of free sites that would react if the user let go now */
export function bestPair(mol) {
    let best = null, bestDist = SNAP;

    state.molecules.forEach(other => {
        if (other === mol) return;

        [[mol, other], [other, mol]].forEach(([dMol, aMol]) => {
            const donor = dMol._model.sites.find(s => s.kind === 'anomeric');
            if (!donor) return;
            const dp = absSite(dMol, donor);

            aMol._model.sites.forEach(acc => {
                let site = null;
                if (acc.kind === 'c4') site = 4;
                else if (acc.kind === 'c6') site = 6;
                else if (acc.kind === 'anomeric' && acc.node.name === 'fructose') site = 2;
                if (!site) return;

                const ap = absSite(aMol, acc);
                const d = Math.hypot(dp.x - ap.x, dp.y - ap.y);
                if (d >= bestDist) return;

                bestDist = d;
                best = {
                    donorMol: dMol, accMol: aMol, donor, acc, site,
                    dp, ap,
                    verdict: verdictFor(donor.node, acc.node, site),
                    label: site === 2 ? 'α-1,β-2' : `${greek(donor.node.anomer)}-1,${site}`
                };
            });
        });
    });

    return best;
}

export function showPreview(pair) {
    pvLayer.textContent = '';
    if (!pair) return;

    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', pair.verdict.ok ? 'pv-ok' : 'pv-no');
    pvLayer.appendChild(g);

    g.appendChild(line(pair.dp.x, pair.dp.y, pair.ap.x, pair.ap.y, 'pv-line'));
    [pair.dp, pair.ap].forEach(p => {
        const c = document.createElementNS(SVG_NS, 'circle');
        c.setAttribute('cx', p.x); c.setAttribute('cy', p.y);
        c.setAttribute('r', 9);
        c.setAttribute('class', 'pv-dot');
        g.appendChild(c);
    });

    const mx = (pair.dp.x + pair.ap.x) / 2;
    const my = (pair.dp.y + pair.ap.y) / 2 - 20;
    const t = text(pair.verdict.ok ? pair.label : pair.verdict.short, mx, my, 'pv-text');
    g.appendChild(t);
    const w = t.getComputedTextLength() + 14;
    const bg = rect(mx - w / 2, my - 13, w, 18, null);
    bg.setAttribute('class', 'pv-bg');
    bg.setAttribute('rx', 5);
    g.insertBefore(bg, t);
}

export function condense(pair) {
    const { donorMol, accMol, acc, site } = pair;

    // Where the finished molecule should appear
    const cd = centreOf(donorMol), ca = centreOf(accMol);
    const mid = { x: (cd.x + ca.x) / 2, y: (cd.y + ca.y) / 2 };

    // The donor hangs off the acceptor's site; the reducing end never moves,
    // so the acceptor molecule's root stays the root of the product.
    acc.node[SITE_FIELD[site]] = donorMol._model.root;
    const root = accMol._model.root;

    removeMolecule(donorMol);
    removeMolecule(accMol);

    const mol = makeMolecule(root, 0, 0);
    setPos(mol,
        Math.round(mid.x - mol._box.w / 2),
        Math.round(mid.y - (mol._box.down - mol._box.up) / 2));
    clampIntoView(mol);

    const p = getPos(mol);
    waterFx(p.x + mol._box.w / 2, p.y - mol._box.up + 10, 'out');
    addWater(1);

    const i = mol._model.info;
    setStatus(`Kondensation: ${i.name} (${i.formula}) dannet via en ${pair.label}-binding — der fraspaltes ét molekyle vand.`, 'ok');
    taskTick();
}

/* Splits one glycosidic bond. Returns the names involved so an enzyme can
   phrase the story its own way instead of the generic message. */
export function hydrolyse(mol, bond, silent) {
    const p = getPos(mol);
    const oldName = mol._model.info.name;
    const root = mol._model.root;

    // Cutting the edge releases the donor's whole subtree, and its anomeric
    // carbon becomes the new fragment's reducing end
    bond.acceptor[SITE_FIELD[bond.site]] = null;
    const freed = bond.donor;

    removeMolecule(mol);

    const a = makeMolecule(root, p.x, p.y);
    const b = makeMolecule(freed, 0, 0);
    setPos(b, Math.round(p.x - b._box.w - 50), Math.round(p.y + 40));
    clampIntoView(a);
    clampIntoView(b);

    waterFx(p.x + a._box.w / 2, p.y - a._box.up + 10, 'in');
    addWater(-1);

    const names = { from: oldName, a: a._model.info.name, b: b._model.info.name };
    if (!silent)
        setStatus(`Hydrolyse: ${names.from} spaltet til ${names.a} + ${names.b} — det kræver ét molekyle vand.`, 'ok');
    taskTick();
    return names;
}

export function fullHydrolysis(mol) {
    const p = getPos(mol);
    const { nodes } = mol._model;
    const oldName = mol._model.info.name;
    const count = nodes.length;

    // Snapshot the residues, then cut every bond at once
    const parts = nodes.slice();
    parts.forEach(n => { n.at4 = null; n.at6 = null; n.at2 = null; });
    removeMolecule(mol);

    parts.forEach((node, i) => {
        const m = makeMolecule(node, p.x + i * 130, p.y + (i % 2) * 30);
        clampIntoView(m);
    });

    waterFx(p.x + 60, p.y - 40, 'in');
    addWater(-(count - 1));
    setStatus(`Fuld hydrolyse: ${oldName} spaltet til ${count} monomerer — det har krævet ${count - 1} vandmolekyler.`, 'ok');
    taskTick();
}

export function flipAnomer(mol) {
    const node = mol._model.root;
    node.anomer = node.anomer === 'a' ? 'b' : 'a';
    const p = getPos(mol);
    removeMolecule(mol);
    const m = makeMolecule(node, p.x, p.y);
    clampIntoView(m);
    setStatus(`Skiftet til ${greek(node.anomer)}-${MOL[node.name].da}. ` +
        (node.anomer === 'a'
            ? 'α-formen giver α-1,4-bindinger — stivelse og glykogen.'
            : 'β-formen giver β-1,4-bindinger — cellulose.'), 'info');
    taskTick();
}
