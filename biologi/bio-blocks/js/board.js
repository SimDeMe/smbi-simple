/* =====================================================================
   Bordet: at lægge molekyler ud, holde dem inde i billedet, tælle vand
   og skrive statuslinjen.
   ===================================================================== */

import { state } from './state.js';
import { svgSpace, fxLayer, pvLayer, statusBar, waterOut } from './dom.js';
import { SVG_NS, text } from './svg.js';
import { MOL } from './data.js';
import { residue, greek } from './model.js';
import { makeMolecule } from './render.js';
import { taskTick } from './tasks.js';

export function spawn(name) {
    const area = svgSpace.getBoundingClientRect();
    const x = 40 + Math.random() * Math.max(40, area.width - 300);
    const y = 80 + Math.random() * Math.max(40, area.height - 340);
    const mol = makeMolecule(residue(name), Math.round(x), Math.round(y));
    clampIntoView(mol);
    setStatus(`${greek(state.currentAnomer)}-${MOL[name].da} lagt på bordet.`, 'info');
    taskTick();
}

export function quickBuild(kind) {
    const glc = a => residue('glucose', a);
    const form = kind === 'cellulose' ? 'b' : 'a';
    const len  = kind === 'glycogen' ? 8 : 6;

    // Build from the reducing end outwards
    const root = glc(form);
    const all  = [root];
    let t = root;
    for (let i = 1; i < len; i++) { t.at4 = glc(form); t = t.at4; all.push(t); }
    let n = len;

    if (kind === 'glycogen') {
        // Real branch points sit several residues apart, which also keeps the
        // two side chains from crowding each other on the row above
        [2, 6].forEach(idx => {
            const h = glc('a'); h.at4 = glc('a'); h.at4.at4 = glc('a');
            all[idx].at6 = h;
            n += 3;
        });
    }

    const mol = makeMolecule(root, 60, 200);
    clampIntoView(mol);
    addWater(n - 1);
    setStatus(`${mol._model.info.name} bygget af ${n} glukoseenheder — det har krævet ${n - 1} kondensationer og fraspaltet ${n - 1} vandmolekyler.`, 'ok');
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
    // The task panel covers the right-hand edge of the table while it is open
    const inset = state.taskMode ? Math.min(322, area.width * 0.45) : 0;
    const minY = 8 + b.up;
    const maxY = Math.max(minY, area.height - b.down - 64);
    const minX = 10 + b.pad;                       // the caption is wider than the rings
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

export function resetGame() {
    state.molecules.forEach(m => m.remove());
    state.molecules = [];
    state.enzymes.forEach(e => e.remove());
    state.enzymes = [];
    fxLayer.textContent = '';
    pvLayer.textContent = '';
    state.waterCount = 0;
    waterOut.textContent = '0';
    setStatus('Bordet er ryddet. Vælg α eller β, og byg videre. Klik på et O i en binding for at hydrolysere netop den — eller lad et enzym gøre arbejdet.', '');
    taskTick();
}

/* Rebuild every molecule in place — used when the C-number toggle changes */
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
