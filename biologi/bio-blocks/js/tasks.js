/* =====================================================================
   Opgavemode

   En opgave er et spørgsmål til bordet: enten en tilstand molekylerne kan
   have (byg laktose), eller noget der er sket undervejs (et enzym har
   klippet). Efter hver handling får den aktuelle opgave bordet at se, og
   når den er løst, kommer forklaringen — pointen står bagefter, ikke før.

   Gæt → gør → forklar: en opgave med et `predict`-felt spørger først, og
   den viser ikke hvad man skal gøre, før der er gættet. Det er selve
   pointen — `goal` fortæller så præcist hvad man skal gøre, at opgaven
   ellers kan følges bogstaveligt uden at forstå noget. Gættet bliver ikke
   bedømt med det samme: facit står i forklaringen, når bordet har afgjort
   sagen. Sådan er det handlingen og ikke panelet, der retter.

   Selve opgaverne står i modulet, og hvert modul har sin egen fremgang.
   ===================================================================== */

import { state } from './state.js';
import { mod } from './modules/index.js';
import { setStatus, clampIntoView, resetGame } from './board.js';
import { syncWelcome } from './welcome.js';

export const taskEvents = new Set();

/* Fremgangen huskes pr. modul, så et skifte til proteinerne ikke smider
   det man har lavet med kulhydraterne */
const progress = {};

function fresh() {
    return { index: 0, done: [], justSolved: false, guess: {} };
}

function prog() {
    if (!progress[state.modId]) progress[state.modId] = fresh();
    return progress[state.modId];
}

const taskPanel  = document.getElementById('task-panel');
const taskList   = document.getElementById('task-list');
const taskDetail = document.getElementById('task-detail');

function board() {
    return { mols: state.molecules.map(m => m._model), water: state.waterCount, ev: taskEvents };
}

/* Har eleven gættet, hvis opgaven spørger? Er der ikke svaret, bliver
   bordet heller ikke tjekket: ellers kunne en opgave blive løst — og
   forklaringen givet — mens spørgsmålet stadig stod og ventede. */
function guessed(t, p) {
    return !t.predict || p.guess[p.index] !== undefined;
}

/* Kun den aktuelle opgave tjekkes — så er det tydeligt hvad der bliver kigget på */
export function taskTick() {
    if (!state.taskMode) return;
    const p = prog();
    const t = mod().tasks[p.index];
    if (t && !p.done[p.index] && guessed(t, p) && t.check(board())) {
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

/* Gættet noteres, men bedømmes ikke her: eleven skal bygge for at få svar */
function guessPanel(t, p, n) {
    const opts = t.predict.options.map((o, i) =>
        `<button class="tp-opt" data-i="${i}">${o}</button>`).join('');

    taskDetail.innerHTML =
        `<p class="tp-title">${n}. ${t.title}</p>
         <p class="tp-predict">${t.predict.q}</p>
         <div class="tp-opts">${opts}</div>
         <p class="tp-tip">Gæt først. Du får at vide om det passer, når du har bygget det.</p>`;

    taskDetail.querySelectorAll('.tp-opt').forEach(b =>
        b.addEventListener('click', () => {
            p.guess[p.index] = +b.dataset.i;
            taskTick();          // bordet kan allerede se rigtigt ud
            setStatus('Gættet er noteret. Byg det nu — bordet afgør sagen.', 'info');
        }));
}

/* Facit efter handlingen: både det rigtige svar og det eleven troede */
function guessVerdict(t, guess) {
    const right = guess === t.predict.correct;
    const said  = t.predict.options[guess];
    const truth = t.predict.options[t.predict.correct];
    return `<p class="tp-verdict ${right ? 'ok' : 'miss'}">` +
           (right ? `✔ Du gættede rigtigt: ${said}`
                  : `✘ Du gættede "${said}" — det rigtige er "${truth}"`) +
           `</p>`;
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
            `<p class="tp-title">🎓 Opsamling</p>${guessScore(tasks, p)}${mod().summary(state.waterCount)}
             <button class="tp-btn grey" id="task-restart">Start opgaverne forfra</button>`;
        document.getElementById('task-restart').addEventListener('click', () => {
            progress[state.modId] = fresh();
            resetGame();               // rydder også bordet, vandet og klippene
            renderTasks();
        });
        return;
    }

    const t      = tasks[p.index];
    const solved = p.done[p.index];
    const guess  = p.guess[p.index];

    // Spørgsmålet står alene: kan man se hvad man skal gøre, er det ikke
    // længere et gæt. Har bordet allerede løst opgaven, er toget kørt.
    if (t.predict && guess === undefined && !solved) return guessPanel(t, p, p.index + 1);

    const facit = t.predict && guess !== undefined && solved ? guessVerdict(t, guess) : '';
    const noteret = t.predict && guess !== undefined && !solved
        ? `<p class="tp-guessed">Dit gæt: ${t.predict.options[guess]}</p>` : '';

    taskDetail.innerHTML =
        `<p class="tp-title">${p.index + 1}. ${t.title}</p>` +
        (solved
            ? `<p class="tp-solved">✔ Løst!</p>${facit}<div class="tp-why">${t.why}</div>
               <button class="tp-btn" id="task-next">Næste opgave →</button>`
            : `<p class="tp-goal">${t.goal}</p>${noteret}
               <p class="tp-tip">Opgaven tjekkes automatisk, så snart bordet ser rigtigt ud.</p>`);

    if (solved) document.getElementById('task-next').addEventListener('click', nextTask);
}

/* Hvor mange af gættene holdt? Kun de opgaver der havde et spørgsmål, og
   kun dem der blev gættet på — ellers ville tallet straffe den der løste en
   opgave uden at have set spørgsmålet. */
function guessScore(tasks, p) {
    const asked = tasks.filter((t, i) => t.predict && p.guess[i] !== undefined);
    if (!asked.length) return '';
    const right = tasks.filter((t, i) => t.predict && p.guess[i] === t.predict.correct).length;
    return `<p class="tp-goal">🔮 Du gættede rigtigt i <b>${right} ud af ${asked.length}</b> ` +
           `af de spørgsmål du svarede på — det interessante er dem du tog fejl af.</p>`;
}

function toggleTasks() {
    state.taskMode = !state.taskMode;
    taskPanel.classList.toggle('hidden', !state.taskMode);
    document.getElementById('btn-tasks').classList.toggle('active', state.taskMode);
    syncWelcome();      // startkortet hører til det tomme bord i fri leg
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
