/* =====================================================================
   Bordet: at lægge molekyler ud, holde dem inde i billedet, tælle vand
   og skrive statuslinjen.
   ===================================================================== */

import { state } from './state.js';
import { mod } from './modules/index.js';
import { svgSpace, fxLayer, pvLayer, statusBar, waterOut } from './dom.js';
import { SVG_NS, text } from './svg.js';
import { residue } from './model.js';
import { makeMolecule } from './render.js';
import { taskTick, taskEvents } from './tasks.js';
import { syncWelcome } from './welcome.js';

/* `at` bruges af startkortets demo, der lægger to byggesten side om side
   i stedet for tilfældigt — ellers ligger de sjældent så de indbyder til
   at blive trukket sammen. */
export function spawn(name, at) {
    const area = svgSpace.getBoundingClientRect();
    const x = at ? at.x : 40 + Math.random() * Math.max(40, area.width - 300);
    const y = at ? at.y : 80 + Math.random() * Math.max(40, area.height - 340);
    const mol = makeMolecule(residue(name), Math.round(x), Math.round(y));
    clampIntoView(mol);
    setStatus(`${mol._model.info.name} lagt på bordet.`, 'info');
    syncWelcome();
    taskTick();
    return mol;
}

/* Hurtigbyg: modulet leverer selve træet, så bordet kun skal placere det
   og gøre vandregnskabet op. */
export function quickBuild(id) {
    const build = mod().builds.find(b => b.id === id);
    if (!build) return;

    const mol = makeMolecule(build.make(residue), 60, 200);
    clampIntoView(mol);

    const { nodes, bonds, info } = mol._model;
    addWater(bonds.length);
    setStatus(build.say(info.name, nodes.length), 'ok');
    syncWelcome();
    taskTick();
}

export function getPos(el) { return { x: +el.dataset.x, y: +el.dataset.y }; }

export function setPos(el, x, y) {
    el.dataset.x = x;
    el.dataset.y = y;
    el.setAttribute('transform', `translate(${x}, ${y}) scale(${el._scale})`);
}

export function clampIntoView(mol) {
    const area = svgSpace.getBoundingClientRect();
    const b = mol._box;
    // Opgavepanelet dækker bordets højre kant så længe det er åbent
    const inset = state.taskMode ? Math.min(322, area.width * 0.45) : 0;
    const minY = 8 + b.up;
    const maxY = Math.max(minY, area.height - b.down - 64);
    const minX = 10 + b.pad;                       // teksten er bredere end ringene
    const maxX = Math.max(minX, area.width - inset - b.w - 10 - b.pad);
    const p = getPos(mol);
    setPos(mol,
        Math.round(Math.min(Math.max(p.x, minX), maxX)),
        Math.round(Math.min(Math.max(p.y, minY), maxY)));
}

export function removeMolecule(mol) {
    state.molecules = state.molecules.filter(m => m !== mol);
    mol.remove();
}

export function centreOf(mol) {
    const p = getPos(mol), b = mol._box;
    return { x: p.x + b.w / 2, y: p.y + (b.down - b.up) / 2 };
}

export function addWater(delta) {
    state.waterCount = Math.max(0, state.waterCount + delta);
    waterOut.textContent = state.waterCount;
}

export function waterFx(x, y, mode, label) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', `fx-water fx-${mode}`);
    g.setAttribute('transform', `translate(${x}, ${y})`);

    const inner = document.createElementNS(SVG_NS, 'g');
    inner.setAttribute('class', 'fx-anim');
    inner.appendChild(text(label || (mode === 'out' ? '💧 + H₂O' : '💧 − H₂O'), 0, 0, ''));
    g.appendChild(inner);

    fxLayer.appendChild(g);
    inner.addEventListener('animationend', () => g.remove());
}

export function setStatus(msg, kind) {
    statusBar.textContent = msg;
    statusBar.className = kind || '';
}

export function clearTable() {
    state.molecules.forEach(m => m.remove());
    state.molecules = [];
    state.enzymes.forEach(e => e.remove());
    state.enzymes = [];
    fxLayer.textContent = '';
    pvLayer.textContent = '';
    state.waterCount = 0;
    waterOut.textContent = '0';
    // Klippene er også noget der stod på bordet — ellers ville en opgave, der
    // spørger til et enzymklip, blive ved med at være løst på et tomt bord
    taskEvents.clear();
    syncWelcome();
}

export function resetGame() {
    clearTable();
    setStatus('Bordet er ryddet. ' + mod().intro, '');
    taskTick();
}

/* Tegn hvert molekyle om, hvor det står — bruges når visningen skiftes */
export function rerenderAll() {
    const snapshot = state.molecules.map(m => ({ root: m._model.root, ...getPos(m) }));
    state.molecules.forEach(m => m.remove());
    state.molecules = [];
    snapshot.forEach(s => {
        const m = makeMolecule(s.root, s.x, s.y);
        m.classList.remove('appear');
        clampIntoView(m);
    });
}
