/* =====================================================================
   Opgavemode

   En opgave er et spørgsmål til bordet: enten en tilstand molekylerne kan
   have (byg laktose), eller noget der er sket undervejs (et enzym har
   klippet). Efter hver handling får den aktuelle opgave bordet at se, og
   når den er løst, kommer forklaringen — pointen står bagefter, ikke før.

   Selve opgaverne står i modulet, og hvert modul har sin egen fremgang.
   ===================================================================== */

import { state } from './state.js';
import { mod } from './modules/index.js';
import { setStatus, clampIntoView, resetGame } from './board.js';

export const taskEvents = new Set();

/* Fremgangen huskes pr. modul, så et skifte til proteinerne ikke smider
   det man har lavet med kulhydraterne */
const progress = {};

function prog() {
    if (!progress[state.modId]) progress[state.modId] = { index: 0, done: [], justSolved: false };
    return progress[state.modId];
}

const taskPanel  = document.getElementById('task-panel');
const taskList   = document.getElementById('task-list');
const taskDetail = document.getElementById('task-detail');

function board() {
    return { mols: state.molecules.map(m => m._model), water: state.waterCount, ev: taskEvents };
}

/* Kun den aktuelle opgave tjekkes — så er det tydeligt hvad der bliver kigget på */
export function taskTick() {
    if (!state.taskMode) return;
    const p = prog();
    const t = mod().tasks[p.index];
    if (t && !p.done[p.index] && t.check(board())) {
        p.done[p.index] = true;
        p.justSolved = true;
    }
    renderTasks();
}

/* Nyt spørgsmål, nyt bord: resterne fra den forrige opgave ville ellers
   kunne løse den næste af sig selv, og så er det ikke til at se hvad der
   bliver tjekket. resetGame() nulstiller også vandtælleren og klippene. */
function nextTask() {
    const p = prog(), tasks = mod().tasks;
    p.justSolved = false;
    const next = tasks.findIndex((t, i) => !p.done[i]);
    p.index = next === -1 ? tasks.length : next;
    resetGame();
    renderTasks();
    if (p.index < tasks.length)
        setStatus(`Bordet er ryddet til opgave ${p.index + 1}: ${tasks[p.index].title}.`, 'info');
}

export function renderTasks() {
    const tasks = mod().tasks;
    const p     = prog();
    const all   = p.done.filter(Boolean).length === tasks.length;

    taskList.innerHTML = tasks.map((t, i) => {
        const cls  = p.done[i] ? 'done' : i === p.index ? 'now' : 'lock';
        const mark = p.done[i] ? '✔' : i === p.index ? '▶' : '🔒';
        return `<li class="${cls}"><span class="tp-mark">${mark}</span><span>${i + 1}. ${t.title}</span></li>`;
    }).join('');

    if (all) {
        taskDetail.innerHTML =
            `<p class="tp-title">🎓 Opsamling</p>${mod().summary(state.waterCount)}
             <button class="tp-btn grey" id="task-restart">Start opgaverne forfra</button>`;
        document.getElementById('task-restart').addEventListener('click', () => {
            progress[state.modId] = { index: 0, done: [], justSolved: false };
            resetGame();               // rydder også bordet, vandet og klippene
            renderTasks();
        });
        return;
    }

    const t = tasks[p.index];
    const solved = p.done[p.index];

    taskDetail.innerHTML =
        `<p class="tp-title">${p.index + 1}. ${t.title}</p>` +
        (solved
            ? `<p class="tp-solved">✔ Løst!</p><div class="tp-why">${t.why}</div>
               <button class="tp-btn" id="task-next">Næste opgave →</button>`
            : `<p class="tp-goal">${t.goal}</p>
               <p class="tp-tip">Opgaven tjekkes automatisk, så snart bordet ser rigtigt ud.</p>`);

    if (solved) document.getElementById('task-next').addEventListener('click', nextTask);
}

function toggleTasks() {
    state.taskMode = !state.taskMode;
    taskPanel.classList.toggle('hidden', !state.taskMode);
    document.getElementById('btn-tasks').classList.toggle('active', state.taskMode);
    if (state.taskMode) {
        renderTasks();
        taskTick();
        setStatus('Opgavemode: løs opgaverne i panelet til højre. Bordet tjekkes automatisk efter hver handling.', 'info');
    } else {
        setStatus('Opgavepanelet er lukket — fri leg. Din fremgang er husket.', 'info');
    }
    state.molecules.forEach(clampIntoView);
    state.enzymes.forEach(clampIntoView);
}

document.getElementById('btn-tasks').addEventListener('click', toggleTasks);
document.getElementById('task-close').addEventListener('click', toggleTasks);
