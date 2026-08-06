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

   Niveauet bestemmer hvilke opgaver der er med: en opgave, der kræver
   knapper C-niveau ikke har (α/β, enzymerne, formelvisningen), er mærket
   med `level` og vises først derfra. Fremgangen huskes derimod altid på
   modulets fulde liste, så et niveauskifte midt i det hele ikke flytter
   rundt på hvad der er løst.

   Og man kan altid komme videre: "Spring over" tager den næste opgave
   uden at markere denne som løst — den kommer igen til sidst. Uden den
   endte den, der gik i stå på opgave 4, aldrig ved 7 og 8, som er de mest
   konkrete og biologisk vedkommende.

   Selve opgaverne står i modulet, og hvert modul har sin egen fremgang.
   ===================================================================== */

import { state } from './state.js';
import { mod } from './modules/index.js';
import { atLeast } from './levels.js';
import { setStatus, clampIntoView, resetGame, clearTable } from './board.js';
import { syncWelcome } from './welcome.js';
import { markTerms } from './glossary.js';
import { logEvent } from './log.js';

export const taskEvents = new Set();

/* Fremgangen huskes pr. modul, så et skifte til proteinerne ikke smider
   det man har lavet med kulhydraterne */
const progress = {};

function fresh() {
    return { index: 0, done: [], justSolved: false, guess: {}, skipped: {} };
}

function prog() {
    if (!progress[state.modId]) progress[state.modId] = fresh();
    return progress[state.modId];
}

/* Opgaverne på det aktuelle niveau, hver med sin plads i modulets fulde
   liste. Nummeret eleven ser, er pladsen i den synlige række; alt der
   huskes, gemmes på den fulde. */
function visible() {
    return mod().tasks
        .map((t, i) => ({ t, i }))
        .filter(x => atLeast(x.t.level));
}

function shownNumber(index) {
    return visible().findIndex(x => x.i === index) + 1;
}

/* Peger vi på en opgave der ikke er med på dette niveau — fx fordi
   niveauet lige er faldet — så flyt til den næste der mangler.

   Kun dét: en løst opgave bliver stående, til man selv trykker "Næste
   opgave". Ellers ville forklaringen forsvinde i samme øjeblik den blev
   fortjent. */
function syncIndex(p) {
    const vis = visible();
    if (!vis.length || vis.some(x => x.i === p.index)) return;
    const next = pickNext(p, vis);
    p.index = next ? next.i : mod().tasks.length;
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
        logSolved(t, p);
    }
    renderTasks();
}

/* Til loggen: opgaven og gættet — men ikke `why`.

   Forklaringen er appens ord, og en rapport der er klippet sammen af
   dem, har eleven ikke lært noget af. Det der skal med hjem, er hvad man
   selv troede, og om det holdt. */
function logSolved(t, p) {
    const g = p.guess[p.index];
    const said = t.predict && g !== undefined
        ? ` Jeg gættede "${t.predict.options[g]}" — ` +
          (g === t.predict.correct
              ? 'og det passede.'
              : `det rigtige var "${t.predict.options[t.predict.correct]}".`)
        : '';
    logEvent('task', `Opgave ${shownNumber(p.index)}: ${t.title} — løst.${said}`);
}

/* Nyt spørgsmål, nyt bord: resterne fra den forrige opgave ville ellers
   kunne løse den næste af sig selv, og så er det ikke til at se hvad der
   bliver tjekket. resetGame() nulstiller også vandtælleren og klippene.

   En sprunget opgave er ikke tabt: den springes kun over, så længe der er
   andre tilbage, og kommer igen når rækken er kørt igennem. */
/* Den næste i rækken efter den aktuelle, hele vejen rundt. Rotationen er
   det der gør "spring over" til en vej udenom og ikke bare en knap: uden
   den ville en liste, hvor alt tilbage var sprunget over, altid pege på
   den første — altså den man lige stod på. Usprungne kommer først. */
function pickNext(p, vis) {
    const cur   = vis.findIndex(x => x.i === p.index);
    const order = cur === -1 ? vis : [...vis.slice(cur + 1), ...vis.slice(0, cur + 1)];
    return order.find(x => !p.done[x.i] && !p.skipped[x.i])
        || order.find(x => !p.done[x.i]);
}

function nextTask() {
    const p = prog(), vis = visible();
    p.justSolved = false;

    const next = pickNext(p, vis);
    p.index = next ? next.i : mod().tasks.length;
    // Den man lander på, er ikke længere sprunget over — ellers ville
    // "spring over" stå stille, når alt tilbage var sprunget over én gang
    if (next) delete p.skipped[next.i];

    resetGame();
    renderTasks();
    if (next)
        setStatus(`Bordet er ryddet til opgave ${shownNumber(next.i)}: ${next.t.title}.`, 'info');
}

/* Vejen udenom. Opgave 4–6 i kulhydraterne er mærkbart sværere end 1–2,
   og den der gik i stå dér, nåede aldrig til fordøjelsen og
   laktoseintolerancen til sidst. */
function skipTask() {
    const p = prog();
    p.skipped[p.index] = true;
    setStatus('Sprunget over — den kommer igen, når du har været hele vejen rundt.', 'info');
    nextTask();
}

/* Gættet noteres, men bedømmes ikke her: eleven skal bygge for at få svar */
function guessPanel(t, p, n) {
    const opts = t.predict.options.map((o, i) =>
        `<button class="tp-opt" data-i="${i}">${o}</button>`).join('');

    // Vejen udenom skal også være der, før man har gættet: den der er gået
    // i stå, skal ikke først tvinges til at svare
    const flere = visible().some(x => x.i !== p.index && !p.done[x.i]);

    taskDetail.innerHTML =
        `<p class="tp-title">${n}. ${t.title}</p>
         <p class="tp-predict">${markTerms(t.predict.q)}</p>
         <div class="tp-opts">${opts}</div>
         <p class="tp-tip">Gæt først. Du får at vide om det passer, når du har bygget det.</p>` +
        (flere ? `<button class="tp-btn grey small" id="task-skip">Spring over →</button>` : '');

    taskDetail.querySelectorAll('.tp-opt').forEach(b =>
        b.addEventListener('click', () => {
            p.guess[p.index] = +b.dataset.i;
            taskTick();          // bordet kan allerede se rigtigt ud
            setStatus('Gættet er noteret. Byg det nu — bordet afgør sagen.', 'info');
        }));

    const skip = document.getElementById('task-skip');
    if (skip) skip.addEventListener('click', skipTask);
}

/* Forklaringerne er 4–6 linjer, og fire linjer bliver ikke læst af den
   der lige har fået et ✔. Første sætning er pointen — resten er hvorfor
   den gælder, og den kommer frem på et klik.

   Delingen sker her og ikke i modulerne: teksterne er skrevet med
   pointen forrest i forvejen, så et `short`-felt ville være den samme
   sætning skrevet to gange og dermed to steder at glemme at rette. */
const WHY_HEAD = 60;           // en sætning på under det er ikke en pointe, kun en optakt

function splitWhy(why) {
    const parts = why.split(/(?<=[.!?])\s+(?=[A-ZÆØÅ])/);
    let head = '', i = 0;
    // "Det er cellulose." siger ingenting alene — så kommer næste sætning med
    while (i < parts.length && head.length < WHY_HEAD) head += (head ? ' ' : '') + parts[i++];
    return [head, parts.slice(i).join(' ')];
}

/* Pointen og resten mærkes op hver for sig: står "hydrolyse" begge
   steder, skal ordet også kunne forklares begge steder — den ene halvdel
   er skjult bag "Læs mere", til man beder om den. */
function whyBlock(why) {
    const [first, rest] = splitWhy(why);
    if (!rest) return `<div class="tp-why">${markTerms(first)}</div>`;
    return `<div class="tp-why">${markTerms(first)}
              <button class="tp-more" id="why-more">Læs mere ▾</button>
              <span class="tp-rest hidden" id="why-rest">${markTerms(rest)}</span>
            </div>`;
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
    const p   = prog();
    syncIndex(p);
    const vis = visible();
    // `justSolved` holder opsamlingen tilbage, til man har set forklaringen
    // på den sidste opgave — ellers var den eneste, hvis why aldrig blev læst
    const all = vis.every(x => p.done[x.i]) && !p.justSolved;

    taskList.innerHTML = vis.map(({ t, i }, n) => {
        const cls  = p.done[i] ? 'done' : i === p.index ? 'now' : p.skipped[i] ? 'skip' : 'lock';
        const mark = p.done[i] ? '✔' : i === p.index ? '▶' : p.skipped[i] ? '↷' : '🔒';
        return `<li class="${cls}"><span class="tp-mark">${mark}</span><span>${n + 1}. ${t.title}</span></li>`;
    }).join('');

    if (all) {
        taskDetail.innerHTML =
            `<p class="tp-title">🎓 Opsamling</p>${guessScore(p, vis)}${markTerms(mod().summary(state.waterCount))}
             <button class="tp-btn grey" id="task-restart">Start opgaverne forfra</button>`;
        document.getElementById('task-restart').addEventListener('click', () => {
            progress[state.modId] = fresh();
            resetGame();               // rydder også bordet, vandet og klippene
            renderTasks();
        });
        return;
    }

    const t      = mod().tasks[p.index];
    const solved = p.done[p.index];
    const guess  = p.guess[p.index];
    const nr     = shownNumber(p.index);

    // Spørgsmålet står alene: kan man se hvad man skal gøre, er det ikke
    // længere et gæt. Har bordet allerede løst opgaven, er toget kørt.
    if (t.predict && guess === undefined && !solved) return guessPanel(t, p, nr);

    const facit = t.predict && guess !== undefined && solved ? guessVerdict(t, guess) : '';
    const noteret = t.predict && guess !== undefined && !solved
        ? `<p class="tp-guessed">Dit gæt: ${t.predict.options[guess]}</p>` : '';

    // Der er kun en vej udenom at tilbyde, hvis der er andet at gå til
    const flere = visible().some(x => x.i !== p.index && !p.done[x.i]);

    taskDetail.innerHTML =
        `<p class="tp-title">${nr}. ${t.title}</p>` +
        (solved
            ? `<p class="tp-solved">✔ Løst!</p>${facit}${whyBlock(t.why)}
               <button class="tp-btn" id="task-next">${
                   visible().every(x => p.done[x.i]) ? 'Se opsamlingen →' : 'Næste opgave →'}</button>`
            : `<p class="tp-goal">${markTerms(t.goal)}</p>${noteret}
               <p class="tp-tip">Opgaven tjekkes automatisk, så snart bordet ser rigtigt ud.</p>` +
              (flere ? `<button class="tp-btn grey small" id="task-skip">Spring over →</button>` : ''));

    if (solved) document.getElementById('task-next').addEventListener('click', nextTask);
    const skip = document.getElementById('task-skip');
    if (skip) skip.addEventListener('click', skipTask);

    const more = document.getElementById('why-more');
    if (more) more.addEventListener('click', () => {
        document.getElementById('why-rest').classList.remove('hidden');
        more.remove();
    });
}

/* Hvor mange af gættene holdt? Kun de opgaver der havde et spørgsmål, og
   kun dem der blev gættet på — ellers ville tallet straffe den der løste en
   opgave uden at have set spørgsmålet. */
function guessScore(p, vis) {
    const asked = vis.filter(x => x.t.predict && p.guess[x.i] !== undefined);
    if (!asked.length) return '';
    const right = asked.filter(x => p.guess[x.i] === x.t.predict.correct).length;
    return `<p class="tp-goal">🔮 Du gættede rigtigt i <b>${right} ud af ${asked.length}</b> ` +
           `af de spørgsmål du svarede på — det interessante er dem du tog fejl af.</p>`;
}

function toggleTasks() {
    state.taskMode = !state.taskMode;
    taskPanel.classList.toggle('hidden', !state.taskMode);
    document.getElementById('btn-tasks').classList.toggle('active', state.taskMode);

    // Ind i opgavemode med et tomt bord, ligesom "Næste opgave" gør det.
    // Lå maltosen der fra fri leg, blev opgave 1 kvitteret med et ✔ og en
    // forklaring på noget eleven ikke bevidst havde gjort.
    if (state.taskMode) clearTable();
    syncWelcome();      // startkortet hører til det tomme bord i fri leg

    if (state.taskMode) {
        renderTasks();
        taskTick();
        setStatus('Opgavemode: bordet er ryddet, så hver opgave starter forfra. Løs opgaverne i panelet til højre.', 'info');
    } else {
        setStatus('Opgavepanelet er lukket — fri leg. Din fremgang er husket.', 'info');
    }
    state.molecules.forEach(clampIntoView);
    state.enzymes.forEach(clampIntoView);
}

document.getElementById('btn-tasks').addEventListener('click', toggleTasks);
document.getElementById('task-close').addEventListener('click', toggleTasks);
