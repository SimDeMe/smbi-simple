/* =====================================================================
   Deling og tavle.

   To ting, der begge handler om adressen i browseren og ikke om
   molekylerne: hvilket modul og hvilket niveau siden åbner i, og om
   sidens krom skal væk, fordi den står på en projektor.

   Adressen er den eneste hukommelse appen har — der er ingen
   localStorage nogen steder, se levels.js. Til gengæld kan en lærer
   sende ét link, der åbner præcis det bord, timen handler om:

       …/bio-blocks/#modul=protein&niveau=B
       …/bio-blocks/?modul=fedt&projektor=1

   Modulet kan skrives som id ('carbs', 'protein', 'lipid') eller på
   dansk ('kulhydrater', 'proteiner', 'fedt').

   Hash og query læses ens; hash er den, appen selv skriver, så et
   modulskift kan deles ved at kopiere adresselinjen.
   ===================================================================== */

import { state } from './state.js';
import { MODULES } from './modules/index.js';
import { LEVELS } from './levels.js';

/* Både `#a=1&b=2` og `?a=1&b=2` — query først, så en hash sat af appen
   selv vinder over det, linket kom med */
function params() {
    const p = new URLSearchParams(location.search);
    new URLSearchParams(location.hash.replace(/^#/, '')).forEach((v, k) => p.set(k, v));
    return p;
}

/* Læses før topbjælken bygges, så der ikke bygges to gange */
export function laesAdresse() {
    const p = params();

    // Både `modul=lipid` og `modul=fedt`: id'et er det appen selv skriver,
    // men et link skrevet i hånden er på dansk som resten af siden
    const modul = (p.get('modul') || '').toLowerCase();
    const valgt = MODULES.find(m => m.id === modul || m.da.toLowerCase() === modul);
    if (valgt) state.modId = valgt.id;

    const niveau = (p.get('niveau') || '').toUpperCase();
    if (LEVELS.some(l => l.id === niveau)) state.level = niveau;

    if (p.get('projektor') === '1' || p.get('mode') === 'teach') saetProjektor(true);
}

/* Adressen skrives om, når modul eller niveau skifter. `replaceState`
   frem for `location.hash = …`: et modulskift er ikke et nyt sted at
   være, og tilbageknappen skal føre ud af appen, ikke gennem hvert
   klik på bjælken. */
export function skrivAdresse() {
    const h = `#modul=${state.modId}&niveau=${state.level}` +
              (document.body.dataset.projektor === '1' ? '&projektor=1' : '');
    history.replaceState(null, '', location.pathname + location.search + h);
}

export function saetProjektor(til) {
    document.body.dataset.projektor = til ? '1' : '0';
    const b = document.getElementById('btn-projektor');
    if (b) b.setAttribute('aria-pressed', String(!!til));
}

/* Bordet skifter højde med projektortilstanden, så den der kalder, får
   lov at rydde op bagefter — motoren her kender ikke molekylerne. */
export function bindProjektor(efter) {
    const b = document.getElementById('btn-projektor');
    b.addEventListener('click', () => {
        saetProjektor(b.getAttribute('aria-pressed') !== 'true');
        skrivAdresse();
        if (efter) efter();
    });
}
