/* =====================================================================
   Startkortet på det tomme bord.

   Uden det møder eleven et tomt gitter og fireogtyve knapper, og den
   eneste vejledning står i statuslinjen nederst på skærmen — langt fra
   der hvor øjet lander. Kortet står midt på bordet og siger de tre trin
   der skal til for at danne den første binding.

   Reglen er den samme hele vejen: er der ingen molekyler på bordet, og
   er opgavepanelet lukket, så er der ikke noget at se på — og så står
   kortet der. Det forsvinder af sig selv i samme øjeblik der ligger en
   byggesten, og kommer igen efter "Ryd bordet". Derfor er der ingen
   "vis ikke igen" at holde styr på: kortet er en egenskab ved det tomme
   bord, ikke ved det første besøg.

   Hvad der står på det, kommer fra modulets `start` — motoren ved ikke
   at glukose har et C1.
   ===================================================================== */

import { state } from './state.js';
import { mod } from './modules/index.js';
import { svgSpace } from './dom.js';
import { UNIT_W } from './units.js';
import { spawn } from './board.js';

const box = document.getElementById('welcome');

/* Demoen lægger byggestenene ud med et mellemrum der er for stort til at
   de binder af sig selv (større end SNAP), men lille nok til at det er
   nærliggende at trække. Eleven skal stadig selv lave bindingen — ellers
   er der ikke noget at forstå.

   Trappen nedad er der for at hver byggesten kan have sin egen
   navnetekst og sin egen note uden at de skriver oven i hinanden. */
const DEMO_GAP  = 150;
const DEMO_DROP = 74;

function layDemoOut(names) {
    const area  = svgSpace.getBoundingClientRect();
    const total = names.length * UNIT_W + (names.length - 1) * DEMO_GAP;
    const x0    = Math.max(30, (area.width - total) / 2);
    const y0    = Math.max(90, (area.height - (names.length - 1) * DEMO_DROP) / 2 - 60);
    names.forEach((n, i) => spawn(n, { x: x0 + i * (UNIT_W + DEMO_GAP),
                                       y: y0 + i * DEMO_DROP }));
}

export function syncWelcome() {
    const show = state.molecules.length === 0 && !state.taskMode;
    box.classList.toggle('hidden', !show);
    if (!show) return;

    const s = mod().start;
    if (!s) { box.classList.add('hidden'); return; }

    box.innerHTML =
        `<p class="wc-title">${s.title}</p>
         <ol class="wc-steps">${s.steps.map(t => `<li>${t}</li>`).join('')}</ol>
         <div class="wc-actions">
           <button class="wc-btn" id="wc-demo">Læg dem ud for mig</button>
           <button class="wc-btn grey" id="wc-tasks">🎯 Gå til opgaverne</button>
         </div>`;

    document.getElementById('wc-demo')
        .addEventListener('click', () => layDemoOut(s.demo));
    document.getElementById('wc-tasks')
        .addEventListener('click', () => document.getElementById('btn-tasks').click());
}
