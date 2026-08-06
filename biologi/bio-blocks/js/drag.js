/* =====================================================================
   Træk-og-slip. Badges og bindings-ilt er knapper, ikke greb — så
   pointerdown deler sig her, og handlingen udføres af det modul der
   ejer den.
   ===================================================================== */

import { svgSpace, molLayer, enzLayer, pvLayer } from './dom.js';
import { SNAP } from './units.js';
import { getPos, setPos, clampIntoView, centreOf, setStatus } from './board.js';
import { bestPair, showPreview, clearPreview, condense, hydrolyse,
         fullHydrolysis, flipVariant } from './reactions.js';
import { bestBond, showEnzymePreview, dropEnzyme, removeEnzyme } from './enzymes.js';
import { openFacts } from './facts.js';
import { openViewer } from './viewer3d.js';

let dragged = null;
let dragOffset = { x: 0, y: 0 };
let activePointer = null;

export function startDrag(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const mol = e.currentTarget;

    // Badges and bond oxygens are buttons, not drag handles
    const hitBadge = e.target.closest ? e.target.closest('.badge') : null;
    if (hitBadge) {
        e.preventDefault();
        const a = hitBadge.dataset.action;
        if (a === 'view') openViewer(mol._model.info);
        else if (a === 'facts') openFacts(mol._model);
        else if (a === 'cut') fullHydrolysis(mol);
        else if (a === 'flip') flipVariant(mol);
        else if (a === 'remove') removeEnzyme(mol);
        return;
    }
    const hitBond = e.target.closest ? e.target.closest('.bond-hit') : null;
    if (hitBond) {
        e.preventDefault();
        hydrolyse(mol, hitBond._bond);
        return;
    }

    e.preventDefault();
    dragged = mol;
    activePointer = e.pointerId;
    mol.classList.add('dragging');
    // Bindingspladserne lyser op så længe der trækkes i et molekyle —
    // enzymer binder til bindinger og ikke til pladser, så ikke for dem
    if (!mol._enzyme) svgSpace.classList.add('linking');
    (mol._enzyme ? enzLayer : molLayer).appendChild(mol);   // bring to front

    const pt = toSvgPoint(e);
    const pos = getPos(mol);
    dragOffset.x = pt.x - pos.x;
    dragOffset.y = pt.y - pos.y;

    window.addEventListener('pointermove', doDrag);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
}

function doDrag(e) {
    if (!dragged || e.pointerId !== activePointer) return;
    e.preventDefault();
    const pt = toSvgPoint(e);
    setPos(dragged, pt.x - dragOffset.x, pt.y - dragOffset.y);
    if (dragged._enzyme) showEnzymePreview(dragged, bestBond(dragged));
    else                 showPreview(bestPair(dragged));
}

function endDrag(e) {
    if (!dragged || (e.pointerId !== undefined && e.pointerId !== activePointer)) return;

    const mol = dragged;
    dragged = null;
    activePointer = null;
    mol.classList.remove('dragging');
    window.removeEventListener('pointermove', doDrag);
    window.removeEventListener('pointerup', endDrag);
    window.removeEventListener('pointercancel', endDrag);

    svgSpace.classList.remove('linking');
    clearPreview();
    clampIntoView(mol);

    if (mol._enzyme) { dropEnzyme(mol, bestBond(mol)); return; }

    const pair = bestPair(mol);
    if (!pair) return;
    if (pair.verdict.ok) {
        condense(pair);
    } else {
        setStatus(pair.verdict.msg, 'error');
        mol.classList.add('shake');
        nudgeApart(mol, pair.donorMol === mol ? pair.accMol : pair.donorMol);
    }
}

function toSvgPoint(evt) {
    const pt = svgSpace.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    return pt.matrixTransform(svgSpace.getScreenCTM().inverse());
}

function nudgeApart(mol, other) {
    const c = centreOf(mol), o = centreOf(other);
    let dx = c.x - o.x, dy = c.y - o.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d < 1) { dx = 1; dy = 0; }
    const push = (SNAP + 40 - d) / d;
    const p = getPos(mol);
    setPos(mol, Math.round(p.x + dx * push), Math.round(p.y + dy * push));
    clampIntoView(mol);
}
