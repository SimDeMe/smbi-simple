/* =====================================================================
   Opgavemode

   En opgave er et spørgsmål til bordet: enten en tilstand molekylerne kan
   have (byg laktose), eller noget der er sket undervejs (et enzym har
   klippet). Efter hver handling får den aktuelle opgave bordet at se, og
   når den er løst, kommer forklaringen — pointen står bagefter, ikke før.
   ===================================================================== */

import { state } from './state.js';
import { setStatus, clampIntoView } from './board.js';

export const taskEvents = new Set();
let taskIndex = 0;
let taskDone  = [];
let taskJustSolved = false;

/* Bindingens type, uden hensyn til hvilke sukkerarter der sidder i den */
const bondSig = m => `${m.bonds[0].anomer}-1,${m.bonds[0].site}`;

const TASKS = [
    {
        title: 'Byg maltose',
        goal: 'Læg to α-glukoser på bordet og træk den enes C1 (højre hjørne) hen til den andens C4 (venstre hjørne).',
        why: 'Kondensation: to monomerer bindes sammen, og der fraspaltes ét molekyle vand. ' +
             'Maltose har α-1,4-bindingen — den samme som i stivelse. Læg mærke til vandtælleren.',
        check: b => b.mols.some(m => m.info.key === 'maltose')
    },
    {
        title: 'Byg laktose',
        goal: 'Laktose = galaktose + glukose med en β-1,4-binding. Vælg β øverst, læg en galaktose og en glukose ud, ' +
              'og træk galaktosens C1 hen til glukosens C4.',
        why: 'Rækkefølgen betyder noget: det er galaktosen der binder med sit C1, og glukosen der modtager på sit C4. ' +
             'Bytter man om, får man et andet molekyle. Netop derfor er enzymet laktase en β-galaktosidase.',
        check: b => b.mols.some(m => m.info.key === 'lactose')
    },
    {
        title: 'Lav 4 vandmolekyler ved kondensation',
        goal: 'Få vandtælleren op på 4. Hver ny binding fraspalter ét vandmolekyle, så du skal danne 4 bindinger — ' +
              'fx en kæde på 5 monomerer.',
        why: 'En kæde på n monomerer holdes sammen af n − 1 bindinger og har afgivet n − 1 vandmolekyler. ' +
             'Omvendt kræver det lige så mange vandmolekyler at hydrolysere kæden igen — derfor er fordøjelse hydrolyse.',
        check: b => b.water >= 4
    },
    {
        title: 'To disakkarider med samme sumformel',
        goal: 'Byg to forskellige disakkarider der ligger på bordet samtidig — fx maltose (α-1,4) og cellobiose (β-1,4). ' +
              'Skift til visningen "Formel" undervejs.',
        why: 'Begge er C₁₂H₂₂O₁₁: samme sumformel, forskellig struktur — de er isomerer. ' +
             'Sumformlen siger altså ikke hvad et molekyle kan. Forskellen mellem maltose og cellobiose er alene bindingens ' +
             'geometri, og den er nok til at vi kan fordøje den ene og ikke den anden.',
        check: b => {
            const di = b.mols.filter(m => m.nodes.length === 2);
            return di.some((x, i) => di.slice(i + 1).some(y =>
                x.info.formula === y.info.formula && bondSig(x) !== bondSig(y)));
        }
    },
    {
        title: 'Byg en kæde vi ikke kan fordøje',
        goal: 'Byg en kæde på mindst 4 glukoser hvor alle bindinger er β-1,4. Vælg β før du bygger — ' +
              'eller brug Hurtigbyg → Cellulose. Prøv derefter amylase på den.',
        why: 'Det er cellulose. Vi har amylase, som kun klipper α-1,4, men ingen cellulase til β-1,4. ' +
             'Kæden er kemisk fuld af energi; vi kan bare ikke komme til den, og den passerer som kostfiber. ' +
             'Læg mærke til at hver anden ring er vendt om — det er β-bindingen der tvinger den lige, stive kæde.',
        check: b => b.mols.some(m => m.nodes.length >= 4 &&
                                     m.nodes.every(x => x.name === 'glucose') &&
                                     m.bonds.every(x => x.site === 4 && x.anomer === 'b'))
    },
    {
        title: 'Byg et forgrenet polysakkarid',
        goal: 'Byg en kæde på mindst 6 α-glukoser, og sæt en sidekæde på en af ringenes C6 (den lille 6-knop over ringen). ' +
              'Hurtigbyg → Glykogen gør det for dig.',
        why: 'Glykogen og amylopektin: α-1,4 i kæden, α-1,6 i grenpunkterne. ' +
             'Grenene giver mange frie ender, så mange enzymmolekyler kan arbejde samtidig — derfor kan leveren frigive ' +
             'glukose til blodet i løbet af minutter. En ugrenet kæde ville kun kunne klippes fra én ende.',
        check: b => b.mols.some(m => m.nodes.length >= 6 &&
                                     m.bonds.some(x => x.site === 6) &&
                                     m.bonds.some(x => x.site === 4))
    },
    {
        title: 'Fordøj stivelsen hele vejen',
        goal: 'Byg (eller hurtigbyg) en amylosekæde. Træk amylase hen på en binding inde i kæden, og træk derefter ' +
              'maltase hen på en maltose.',
        why: 'To enzymer, to opgaver: amylase i spyt og bugspyt klipper inde i den lange kæde, mens maltase i ' +
             'tyndtarmens børstesøm tager det sidste trin fra maltose til glukose. Først som fri glukose kan sukkeret ' +
             'optages i blodet.',
        check: b => b.ev.has('cut:amylase') && b.ev.has('cut:maltase')
    },
    {
        title: 'Vis hvad laktoseintolerans er',
        goal: 'Slå 🥛 Laktoseintolerans til, byg en laktose, og prøv at klippe den med laktase.',
        why: 'Laktoseintolerans er ikke en allergi, men et manglende enzym. Uden laktase bliver laktosen ikke spaltet, ' +
             'kan ikke optages i tyndtarmen, og fortsætter til tyktarmen: bakterierne laver gas, og sukkeret trækker ' +
             'osmotisk vand ud i tarmen. Enzymet er hele forskellen.',
        check: b => b.ev.has('gas')
    }
];

const taskPanel  = document.getElementById('task-panel');
const taskList   = document.getElementById('task-list');
const taskDetail = document.getElementById('task-detail');

function board() {
    return { mols: state.molecules.map(m => m._model), water: state.waterCount, ev: taskEvents };
}

/* Kun den aktuelle opgave tjekkes — så er det tydeligt hvad der bliver kigget på */
export function taskTick() {
    if (!state.taskMode) return;
    const t = TASKS[taskIndex];
    if (t && !taskDone[taskIndex] && t.check(board())) {
        taskDone[taskIndex] = true;
        taskJustSolved = true;
    }
    renderTasks();
}

function nextTask() {
    taskJustSolved = false;
    const next = TASKS.findIndex((t, i) => !taskDone[i]);
    taskIndex = next === -1 ? TASKS.length : next;
    renderTasks();
}

function renderTasks() {
    const all = taskDone.filter(Boolean).length === TASKS.length;

    taskList.innerHTML = TASKS.map((t, i) => {
        const cls  = taskDone[i] ? 'done' : i === taskIndex ? 'now' : 'lock';
        const mark = taskDone[i] ? '✔' : i === taskIndex ? '▶' : '🔒';
        return `<li class="${cls}"><span class="tp-mark">${mark}</span><span>${i + 1}. ${t.title}</span></li>`;
    }).join('');

    if (all) {
        taskDetail.innerHTML =
            `<p class="tp-title">🎓 Opsamling</p>
             <p class="tp-goal">Alle ${TASKS.length} opgaver er løst. Det er de samme fire ting hele vejen igennem:</p>
             <ul class="tp-sum">
               <li><b>Kondensation</b> binder monomerer sammen og fraspalter vand; <b>hydrolyse</b> gør det modsatte.
                   Vandtælleren står nu på ${state.waterCount}.</li>
               <li><b>Bindingen</b> — α eller β, 1,4 eller 1,6 — bestemmer molekylets form: spiral, lige kæde eller forgrenet net.</li>
               <li><b>Samme sumformel</b> kan betyde vidt forskellige molekyler. Stivelse og cellulose er begge (C₆H₁₀O₅)ₙ.</li>
               <li><b>Enzymer er specifikke</b>, og det er derfor cellulose er kostfiber, bønner giver luft i maven,
                   og nogle mennesker ikke kan tåle mælk.</li>
             </ul>
             <button class="tp-btn grey" id="task-restart">Start opgaverne forfra</button>`;
        document.getElementById('task-restart').addEventListener('click', () => {
            taskDone = []; taskIndex = 0; taskEvents.clear(); taskJustSolved = false;
            renderTasks();
        });
        return;
    }

    const t = TASKS[taskIndex];
    const solved = taskDone[taskIndex];

    taskDetail.innerHTML =
        `<p class="tp-title">${taskIndex + 1}. ${t.title}</p>` +
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
