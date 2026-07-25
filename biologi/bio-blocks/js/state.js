/* =====================================================================
   Delt, muterbar tilstand

   Alt der ændrer sig mens appen kører, ligger i ét objekt. Et ES-modul
   kan ikke skrive til en anden fils `let`, så et objekt er den enkleste
   måde at have tilstanden ét sted og stadig kunne ændre den derfra hvor
   handlingen sker.
   ===================================================================== */

export const state = {
    molecules: [],            // <g class="molecule"> på bordet
    enzymes: [],              // <g class="enzyme"> på bordet
    waterCount: 0,
    currentAnomer: 'a',       // a | b — den form nye monomerer får
    showNumbers: true,
    lactoseIntolerant: false,
    catalystHintShown: false,
    repr: 'blocks',           // blocks | haworth | formula
    taskMode: false
};
