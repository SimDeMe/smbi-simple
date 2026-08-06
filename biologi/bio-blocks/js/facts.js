/* =====================================================================
   Faktakort — konteksten omkring molekylet.

   Indholdet står i modulet: tabellen `facts` og funktionen `factRows`,
   der bestemmer hvilke rækker der giver mening for netop den stofgruppe
   (sødme og reducerende sukker for kulhydrater, sidekæder for proteiner,
   mættet/umættet for fedt). Her står kun ruden.
   ===================================================================== */

import { mod } from './modules/index.js';
import { markTerms } from './glossary.js';

const factModal = document.getElementById('fact-modal');

export function openFacts(model) {
    const m = mod();
    const { info, nodes } = model;
    const n = nodes.length;
    const f = m.facts[info.key] || {};

    document.getElementById('fact-top').style.background =
        m.factColour(info, n) || '#34495e';
    document.getElementById('fact-name').textContent = info.name;
    document.getElementById('fact-formula').textContent =
        `${info.formula} · ${n} ${m.nouns.unit[n === 1 ? 0 : 1]}`;

    document.getElementById('fact-rows').innerHTML = m.factRows(model, f)
        .filter(row => row && row[2])
        // Fagordene i rækken gøres klikbare — det er her de fleste af dem
        // står, og faktakortet er netop dér man er gået hen for at forstå
        .map(([ico, lab, val]) =>
            `<div class="f-row"><div class="f-ico">${ico}</div>
             <div><div class="f-lab">${lab}</div><div class="f-val">${markTerms(val)}</div></div></div>`)
        .join('');

    factModal.classList.remove('hidden');
}

export function closeFacts() { factModal.classList.add('hidden'); }

document.getElementById('fact-close').addEventListener('click', closeFacts);
factModal.addEventListener('click', e => { if (e.target === factModal) closeFacts(); });
