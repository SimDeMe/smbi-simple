/* =====================================================================
   Min log — det eleven kan tage med hjem

   Appen kunne ikke aflevere noget. Man byggede en cellulosekæde, fandt
   ud af at amylase ikke bider på den, lukkede fanen — og så var timen
   væk. Et skærmbillede ville vise molekylet, men ikke hvad der skete
   eller hvad man svarede.

   Loggen skriver sig selv undervejs: hvad der blev bygget, hvad der blev
   klippet, hvilke enzymer der sagde nej og hvorfor, og hvad der blev
   gættet i opgaverne. Nederst står tre spørgsmål eleven selv skal svare
   på. Det er dét der gør loggen mere værd end et billede — man kan ikke
   kopiere sin egen begrundelse ud af skærmen, man skal genkalde sig den.

   To valg:

   - **Det samme skrives kun én gang.** Bygger man maltose fem gange,
     står der én linje. Loggen er hvad der er sket, ikke hvor mange
     gange man klikkede.
   - **"Ryd bordet" rører den ikke.** Bordet er det man arbejder på;
     loggen er det man har lavet. Kun "Ryd loggen" tømmer den, og den
     knap spørger en gang til.

   Loggen ligger i hukommelsen som alt andet i appen — ingen
   localStorage. Derfor står der også i panelet at den forsvinder, når
   fanen lukkes, så eleven kopierer inden.
   ===================================================================== */

import { state } from './state.js';
import { MODULES } from './modules/index.js';

const modal  = document.getElementById('log-modal');
const bodyEl = document.getElementById('log-body');
const subEl  = document.getElementById('log-sub');
const btnLog = document.getElementById('btn-log');

/* De spørgsmål eleven selv skal svare på. De er motorens og ikke
   modulets: de handler alle tre om det der er fælles for stofgrupperne,
   og et svar der kun passer på kulhydrater, er ikke svar nok. */
const QUESTIONS = [
    'Hvad sker der med vand, når to byggesten bindes sammen — og når bindingen klippes igen?',
    'Nævn ét sted hvor et enzym ikke ville klippe. Hvorfor ikke?',
    'Hvad tog du fejl af undervejs, og hvad ved du nu?'
];

/* Overskrifterne i panelet og i den kopierede tekst */
const KINDS = {
    build:  'Bygget',
    split:  'Spaltet',
    enzyme: 'Enzymer',
    body:   'Kroppen',
    task:   'Opgaver'
};

/* ---------- At skrive i loggen ---------- */

/* Kaldes fra de steder hvor der faktisk sker noget: en binding dannes
   eller klippes, et enzym siger ja eller nej, en opgave løses. At lægge
   en byggesten på bordet er ikke en hændelse — det er en forberedelse. */
export function logEvent(kind, text) {
    if (state.log.some(e => e.mod === state.modId && e.text === text)) return;
    state.log.push({ mod: state.modId, kind, text });
    syncButton();
}

export function syncButton() {
    if (!btnLog) return;
    const n = state.log.length;
    btnLog.textContent = n ? `📋 Min log (${n})` : '📋 Min log';
    btnLog.classList.toggle('active', n > 0);
}

/* ---------- Panelet ---------- */

function entries(modId) {
    return state.log.filter(e => e.mod === modId);
}

/* Linjerne samles under modulet og derefter under hvad de er: det er den
   rækkefølge en rapport skal skrives i, ikke den rækkefølge man tilfældigt
   kom til at gøre tingene i. */
function grouped(modId) {
    const rows = entries(modId);
    return Object.keys(KINDS)
        .map(k => ({ kind: k, list: rows.filter(e => e.kind === k) }))
        .filter(g => g.list.length);
}

function tally() {
    const parts = [];
    const add = (kind, one, many) => {
        const n = state.log.filter(e => e.kind === kind).length;
        if (n) parts.push(`${n} ${n === 1 ? one : many}`);
    };
    add('build',  'molekyle bygget',   'molekyler bygget');
    add('split',  'binding spaltet',   'bindinger spaltet');
    add('enzyme', 'enzym prøvet',      'enzymer prøvet');
    add('task',   'opgave løst',       'opgaver løst');
    return parts.join(' · ');
}

function bodyHtml() {
    if (!state.log.length)
        return `<p class="log-empty">Loggen er tom endnu. Byg et molekyle, prøv et enzym eller løs
                en opgave — så skriver den sig selv.</p>`;

    const modules = MODULES.filter(m => entries(m.id).length).map(m =>
        `<h3 class="log-h">${m.da}</h3>` +
        grouped(m.id).map(g =>
            `<p class="log-kind">${KINDS[g.kind]}</p>
             <ul class="log-list">${g.list.map(e => `<li>${e.text}</li>`).join('')}</ul>`).join('')
    ).join('');

    const notes = QUESTIONS.map((q, i) =>
        `<label class="log-q">${q}
           <textarea class="log-note" data-i="${i}" rows="2"
                     placeholder="Skriv med dine egne ord …">${state.logNotes[i] || ''}</textarea>
         </label>`).join('');

    return `<p class="log-tally">${tally()}</p>${modules}
            <h3 class="log-h">Mine egne ord</h3>
            <p class="log-hint">De tre svar kommer med, når du kopierer. Det er dem læreren kan se
               om du har forstået — resten har appen skrevet for dig.</p>
            ${notes}`;
}

function renderLog() {
    subEl.textContent = new Date().toLocaleDateString('da-DK',
        { day: 'numeric', month: 'long', year: 'numeric' });
    bodyEl.innerHTML = bodyHtml();

    // Svarene skal overleve at ruden lukkes, men panelet må ikke tegnes
    // om mens man skriver — så mister feltet fokus midt i en sætning
    bodyEl.querySelectorAll('.log-note').forEach(t =>
        t.addEventListener('input', () => { state.logNotes[t.dataset.i] = t.value; }));
}

/* ---------- Til rapporten ---------- */

/* Ren tekst uden opmærkning: den skal kunne sættes ind i Word, i Google
   Docs og i et afleveringsfelt uden at slæbe et layout med sig. */
function asText() {
    const date = new Date().toLocaleDateString('da-DK',
        { day: 'numeric', month: 'long', year: 'numeric' });
    const lines = ['Bio-Blocks — min log', date, ''];

    if (tally()) lines.push(tally(), '');

    MODULES.filter(m => entries(m.id).length).forEach(m => {
        lines.push(m.da.toUpperCase());
        grouped(m.id).forEach(g => {
            lines.push(`  ${KINDS[g.kind]}:`);
            g.list.forEach(e => lines.push(`  - ${e.text}`));
        });
        lines.push('');
    });

    lines.push('MINE EGNE ORD');
    QUESTIONS.forEach((q, i) => {
        lines.push(q, (state.logNotes[i] || '').trim() || '(ikke besvaret)', '');
    });

    return lines.join('\n');
}

/* Udklipsholderen kan finde på hverken at svare ja eller nej, hvis siden
   ikke har fokus. Uden en frist ville knappen bare se død ud. */
const patient = p => Promise.race([
    p, new Promise((_, no) => setTimeout(() => no(new Error('for længe')), 1200))
]);

async function copyReport(btn) {
    const txt = asText();
    let ok = true;
    try {
        await patient(navigator.clipboard.writeText(txt));
    } catch {
        // Udklipsholderen kræver en sikker kontekst; åbnes appen som en
        // fil fra skrivebordet, er der ikke nogen. Så gør vi det gammeldags.
        const ta = document.createElement('textarea');
        ta.value = txt;
        ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        try { ok = document.execCommand('copy'); } catch { ok = false; }
        ta.remove();
    }
    btn.textContent = ok ? '✔ Kopieret' : '✘ Kunne ikke kopiere';
    setTimeout(() => { btn.textContent = '📋 Kopier til rapport'; }, 2000);
}

/* ---------- Åbn, luk, ryd ---------- */

export function openLog() {
    renderLog();
    modal.classList.remove('hidden');
}

export function closeLog() {
    if (modal.classList.contains('hidden')) return false;
    disarm();                      // "Sikker?" gælder kun så længe ruden står åben
    modal.classList.add('hidden');
    return true;
}

/* At rydde loggen er den eneste handling i appen der ikke kan gøres om,
   så knappen spørger en gang til i stedet for at bruge en dialogboks */
let armed = false;

function clearBtn() { return document.getElementById('log-clear'); }

function disarm() {
    armed = false;
    clearBtn().textContent = 'Ryd loggen';
    clearBtn().classList.remove('armed');
}

document.getElementById('log-copy')
    .addEventListener('click', e => copyReport(e.currentTarget));

clearBtn().addEventListener('click', () => {
    if (!armed) {
        armed = true;
        clearBtn().textContent = 'Sikker? Tryk igen';
        clearBtn().classList.add('armed');
        return;
    }
    state.log = [];
    state.logNotes = {};
    disarm();
    syncButton();
    renderLog();
});

document.getElementById('btn-log').addEventListener('click', openLog);
document.getElementById('log-close').addEventListener('click', closeLog);
modal.addEventListener('click', e => { if (e.target === modal) closeLog(); });

syncButton();
