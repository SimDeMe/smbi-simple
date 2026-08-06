/* =====================================================================
   Kemien — hvilke pladser må reagere, og hvad sker der når de gør det.

   Reglen er den samme uanset stofgruppe: en fri donorplads møder en fri
   modtagerplads, der fraspaltes vand, og molekylerne bliver til ét.
   Hvilke pladser der findes, og hvilke kombinationer der er tilladt,
   kommer fra modulet.
   ===================================================================== */

import { state } from './state.js';
import { mod } from './modules/index.js';
import { pvLayer, fxLayer } from './dom.js';
import { SVG_NS, text, line, rect } from './svg.js';
import { SNAP } from './units.js';
import { sitePoint } from './model.js';
import { getPos, setPos, clampIntoView, removeMolecule, centreOf,
         addWater, waterFx, setStatus } from './board.js';
import { makeMolecule } from './render.js';
import { taskTick } from './tasks.js';

/* Et bindingssteds absolutte position, molekylets skalering iberegnet */
function absSite(mol, site) {
    const p = getPos(mol), s = mol._model.scale;
    const local = sitePoint(site.node, site.kind, mol._model.pos.get(site.node));
    return { x: p.x + local.x * s, y: p.y + local.y * s };
}

/* Den binding der ville blive dannet — beskrevet som en rigtig binding,
   så modulet kan sætte navn på den med den samme funktion som ellers */
function previewBond(donorNode, acc) {
    const m = mod();
    const b = { donor: donorNode, acceptor: acc.node, kind: acc.kind,
                field: acc.link.field, site: acc.link.site, branch: !!acc.link.dRow };
    if (m.variant) b[m.variant.field] = donorNode[m.variant.field];
    return b;
}

/* De to frie pladser der ville reagere, hvis brugeren slap nu */
export function bestPair(mol) {
    let best = null, bestDist = SNAP;

    state.molecules.forEach(other => {
        if (other === mol) return;

        [[mol, other], [other, mol]].forEach(([dMol, aMol]) => {
            dMol._model.sites.filter(s => s.canDonate).forEach(donor => {
                const dp = absSite(dMol, donor);

                aMol._model.sites.forEach(acc => {
                    if (!acc.link) return;               // ren donorplads, kan ikke modtage
                    const ap = absSite(aMol, acc);
                    const d  = Math.hypot(dp.x - ap.x, dp.y - ap.y);
                    if (d >= bestDist) return;

                    const bond = previewBond(donor.node, acc);
                    bestDist = d;
                    best = {
                        donorMol: dMol, accMol: aMol, donor, acc,
                        site: acc.link.site, dp, ap, bond,
                        verdict: mod().verdict(donor.node, acc.node, acc.link.site),
                        label: mod().bondLabel(bond)
                    };
                });
            });
        });
    });

    return best;
}

/* De to markører der lige nu peger på hinanden. De holdes uden for
   pvLayer, fordi de hører til molekylerne og ikke til forhåndsvisningen —
   derfor skal de også have deres klasse fjernet igen med håndkraft. */
let hot = [];

function setHot(pair) {
    hot.forEach(el => el.classList.remove('hot', 'ok', 'no'));
    hot = [];
    if (!pair) return;
    const kind = pair.verdict.ok ? 'ok' : 'no';
    [pair.donor.el, pair.acc.el].forEach(el => {
        if (!el) return;                       // markører findes kun i blokvisningen
        el.classList.add('hot', kind);
        hot.push(el);
    });
}

/* Slut på trækket: både stregen og de fremhævede markører ryddes */
export function clearPreview() {
    pvLayer.textContent = '';
    setHot(null);
}

export function showPreview(pair) {
    pvLayer.textContent = '';
    setHot(pair);
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

/* Afvisningen bliver stående ved molekylet.

   Handlingen sker midt på bordet, men beskeden kom kun i statuslinjen
   nederst på skærmen — langt fra der hvor øjet er. I praksis så eleven
   rystet og skubbet fra hinanden og tænkte "det virkede ikke" i stedet
   for "α kan ikke binde dér". Nu bliver den korte grund hængende et par
   sekunder dér hvor forsøget blev gjort; den lange forklaring står som
   før i statuslinjen. */
export function rejectFx(pair) {
    const x = (pair.dp.x + pair.ap.x) / 2;
    const y = (pair.dp.y + pair.ap.y) / 2 - 26;

    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'fx-reject');
    fxLayer.appendChild(g);

    const inner = document.createElementNS(SVG_NS, 'g');
    inner.setAttribute('class', 'fx-anim');
    g.appendChild(inner);

    const t = text(`✘ ${pair.verdict.short}`, x, y, 'fx-reject-text');
    inner.appendChild(t);
    const w = t.getComputedTextLength() + 20;
    const bg = rect(x - w / 2, y - 15, w, 22, null);
    bg.setAttribute('class', 'fx-reject-bg');
    bg.setAttribute('rx', 6);
    inner.insertBefore(bg, t);

    inner.addEventListener('animationend', () => g.remove());
}

export function condense(pair) {
    const { donorMol, accMol, acc } = pair;

    // Hvor det færdige molekyle skal dukke op
    const cd = centreOf(donorMol), ca = centreOf(accMol);
    const mid = { x: (cd.x + ca.x) / 2, y: (cd.y + ca.y) / 2 };

    // Donoren hænger i acceptorens plads; den frie ende flytter sig ikke,
    // så acceptormolekylets rod bliver også produktets rod.
    acc.node[acc.link.field] = donorMol._model.root;
    const root = accMol._model.root;

    // Loggen skal opdateres før molekylet tegnes, ellers sætter render.js
    // sit fortryd-✕ på den forrige binding
    state.bondLog.push({ donor: pair.donor.node, acceptor: acc.node });

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

/* Bindingen findes stadig på bordet — hvor sidder den? */
function locate(entry) {
    for (const mol of state.molecules) {
        const bond = mol._model.bonds.find(b => b.donor === entry.donor && b.acceptor === entry.acceptor);
        if (bond) return { mol, bond };
    }
    return null;
}

function forget(bond) {
    state.bondLog = state.bondLog.filter(e => !(e.donor === bond.donor && e.acceptor === bond.acceptor));
}

/* Fortryd: hydrolysér den binding man senest har dannet selv.

   Uden den var eneste vej tilbage at klikke på bindingens O, og det er
   ikke selvopdagende — tooltip'et var eneste kilde. Kun egne bindinger
   ligger i loggen: har et enzym klippet undervejs, er den binding væk,
   og så tages den næste i rækken. */
export function undoLast() {
    while (state.bondLog.length) {
        const hit = locate(state.bondLog[state.bondLog.length - 1]);
        if (!hit) { state.bondLog.pop(); continue; }      // klippet af et enzym i mellemtiden
        hydrolyse(hit.mol, hit.bond);
        return true;
    }
    // Ærligt formuleret: hurtigbyg og enzymklip står ikke i loggen, så
    // "ingenting" ville lyde forkert lige efter man har trykket på noget
    setStatus('Der er ikke noget at fortryde — Ctrl+Z tager de bindinger du selv har dannet.', 'info');
    return false;
}

/* Den nyeste binding, som render.js sætter sit ✕ på */
export function newestBond() {
    return state.bondLog[state.bondLog.length - 1] || null;
}

/* Klipper én binding. Returnerer navnene, så et enzym kan fortælle
   historien på sin egen måde i stedet for den generiske besked. */
export function hydrolyse(mol, bond, silent) {
    const p = getPos(mol);
    const oldName = mol._model.info.name;
    const root = mol._model.root;

    // At klippe kanten frigiver hele donorens undertræ, og dens egen
    // donorplads bliver fragmentets nye frie ende
    bond.acceptor[bond.field] = null;
    const freed = bond.donor;
    forget(bond);                     // den er ikke længere til at fortryde

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
    const fields = Object.values(mod().links).map(l => l.field);

    // Tag et øjebliksbillede af enhederne, og klip så alle bindinger på én gang
    const parts = nodes.slice();
    state.bondLog = state.bondLog.filter(e => !parts.includes(e.donor));
    parts.forEach(n => fields.forEach(f => { n[f] = null; }));
    removeMolecule(mol);

    parts.forEach((node, i) => {
        const m = makeMolecule(node, p.x + i * 130, p.y + (i % 2) * 30);
        clampIntoView(m);
    });

    waterFx(p.x + 60, p.y - 40, 'in');
    addWater(-(count - 1));
    setStatus(`Fuld hydrolyse: ${oldName} spaltet til ${count} ${mod().nouns.unit[1]} — det har krævet ${count - 1} vandmolekyler.`, 'ok');
    taskTick();
}

/* Skifter monomerens form — kun moduler med et formvalg (α/β) har den */
export function flipVariant(mol) {
    const m = mod();
    if (!m.variant) return;

    const node = mol._model.root;
    const opts = m.variant.options;
    const i    = opts.findIndex(o => o.id === node[m.variant.field]);
    const next = opts[(i + 1) % opts.length];
    node[m.variant.field] = next.id;

    const p = getPos(mol);
    removeMolecule(mol);
    const fresh = makeMolecule(node, p.x, p.y);
    clampIntoView(fresh);
    setStatus(`Skiftet til ${m.monomerName(node)}. ${next.flip || ''}`.trim(), 'info');
    taskTick();
}
