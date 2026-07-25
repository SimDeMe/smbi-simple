/* =====================================================================
   Opstart: knapperne i topbjælken kobles til de moduler der gør arbejdet.

   Markup'en holder ingen logik — hver knap bærer kun et data-attribut
   eller et id, og koblingen står her, så det er ét sted man kigger efter
   "hvad sker der når man trykker".
   ===================================================================== */

import { state } from './state.js';
import { spawn, quickBuild, resetGame, rerenderAll,
         clampIntoView, setStatus } from './board.js';
import { spawnEnzyme, syncEnzymeButtons, rerenderEnzymes } from './enzymes.js';
import { openViewer, closeViewer } from './viewer3d.js';
import { closeFacts } from './facts.js';

/* ---------- Topbjælkens knapper ---------- */

document.querySelectorAll('[data-spawn]').forEach(btn => {
    btn.addEventListener('click', () => spawn(btn.dataset.spawn));
});

document.querySelectorAll('[data-build]').forEach(btn => {
    btn.addEventListener('click', () => quickBuild(btn.dataset.build));
});

document.querySelectorAll('[data-enzyme]').forEach(btn => {
    btn.addEventListener('click', () => spawnEnzyme(btn.dataset.enzyme));
});

document.getElementById('btn-reset').addEventListener('click', resetGame);

document.querySelectorAll('#anomer-seg button').forEach(btn => {
    btn.addEventListener('click', () => {
        state.currentAnomer = btn.dataset.anomer;
        document.querySelectorAll('#anomer-seg button')
            .forEach(b => b.classList.toggle('active', b === btn));
        setStatus(state.currentAnomer === 'a'
            ? 'α-form valgt: OH-gruppen på C1 peger nedad. Giver α-1,4 — stivelse og glykogen.'
            : 'β-form valgt: OH-gruppen på C1 peger opad. Giver β-1,4 — cellulose, hvor hver anden ring er vendt om.', 'info');
    });
});

document.getElementById('btn-numbers').addEventListener('click', e => {
    state.showNumbers = !state.showNumbers;
    e.currentTarget.classList.toggle('active', state.showNumbers);
    rerenderAll();
});

document.getElementById('btn-lactose-intolerance').addEventListener('click', e => {
    state.lactoseIntolerant = !state.lactoseIntolerant;
    e.currentTarget.classList.toggle('active', state.lactoseIntolerant);
    syncEnzymeButtons();
    rerenderEnzymes();
    setStatus(state.lactoseIntolerant
        ? 'Laktoseintolerans slået til: kroppen producerer ikke længere laktase. Byg en laktose (galaktose + glukose, β-1,4) og prøv at fordøje den.'
        : 'Laktaseproduktionen er tilbage: laktosen kan igen spaltes til galaktose + glukose og optages i tyndtarmen.',
        state.lactoseIntolerant ? 'error' : 'info');
});

window.addEventListener('resize', () => {
    state.molecules.forEach(clampIntoView);
    state.enzymes.forEach(clampIntoView);
});

/* ---------- Repræsentationsskift ---------- */

const REPR_MSG = {
    blocks:  'Blokke: formen viser ringstørrelsen (seksring eller femring) og farven viser sukkerarten.',
    haworth: 'Haworth-formel: samme molekyle, nu med OH-grupperne. Om den anomere OH peger op eller ned ER forskellen ' +
             'mellem β og α. H-atomerne er udeladt, og den glykosidiske binding tegnes vandret, så kæden kan læses.',
    formula: 'Molekylformel: hver monomer er C₆H₁₂O₆ — glukose, fruktose og galaktose har alle samme sumformel. ' +
             'Regnestykket under molekylet viser hvor meget vand der er fraspaltet.'
};

document.querySelectorAll('#repr-seg button').forEach(btn => {
    btn.addEventListener('click', () => {
        state.repr = btn.dataset.repr;
        document.querySelectorAll('#repr-seg button')
            .forEach(b => b.classList.toggle('active', b === btn));
        rerenderAll();
        setStatus(REPR_MSG[state.repr], 'info');
    });
});

/* Den fjerde repræsentation ligger i sin egen rude, så knappen leder
   derhen — er der kun ét molekyle med en 3D-struktur, åbnes det direkte. */
document.getElementById('btn-3d').addEventListener('click', () => {
    const withSdf = state.molecules.filter(m => m._model.info.sdf);
    if (withSdf.length === 1) openViewer(withSdf[0]._model.info);
    else if (withSdf.length === 0)
        setStatus('Der er ingen molekyler på bordet med en 3D-struktur endnu. Læg fx en glukose ud, og prøv igen.', 'error');
    else
        setStatus(`${withSdf.length} molekyler kan vises i 3D — klik 👁 under det du vil se.`, 'info');
});

/* Escape lukker de ruder der måtte være åbne */
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    closeViewer();
    closeFacts();
});
