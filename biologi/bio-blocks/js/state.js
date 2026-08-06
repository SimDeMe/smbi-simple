/* =====================================================================
   Delt, muterbar tilstand

   Alt der ændrer sig mens appen kører, ligger i ét objekt. Et ES-modul
   kan ikke skrive til en anden fils `let`, så et objekt er den enkleste
   måde at have tilstanden ét sted og stadig kunne ændre den derfra hvor
   handlingen sker.
   ===================================================================== */

export const state = {
    modId: 'carbs',           // kulhydrater | proteiner | fedt — se modules/
    molecules: [],            // <g class="molecule"> på bordet
    enzymes: [],              // <g class="enzyme"> på bordet
    waterCount: 0,
    variant: null,            // modulets formvalg, fx α/β på et sukker
    showNumbers: true,
    toggleOn: false,          // modulets kontakt: laktoseintolerans, galde …
    catalystHintShown: false,
    bondLog: [],              // de bindinger man selv har dannet, ældst først — se fortryd i reactions.js
    repr: 'blocks',           // hvilken af modulets repræsentationer der vises
    level: 'C',               // C | B | A — hvor mange knapper der er fremme, se levels.js
    taskMode: false,

    // Min log: det der er sket i timen, og elevens egne svar. Hører til
    // besøget og ikke til bordet — "Ryd bordet" rører den ikke. Se log.js
    log: [],
    logNotes: {}
};
