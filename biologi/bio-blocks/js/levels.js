/* =====================================================================
   Niveauvalg — C, B eller A

   Topbjælken viste alt på én gang: 24 knapper i tre grupperækker, 140 px
   høj ved 1358 px bredde og 225 px ved 768 px. På en tablet i portræt åd
   den 30 % af skærmen, og en elev der lige var begyndt, mødte fem enzymer
   og en laktoseintolerans-kontakt før den første glukose var lagt ud.

   Niveauet fjerner knapper — det tilføjer ikke indhold:

     C   modul, byggesten, blokvisning, opgaver. Nok til kondensation og
         hydrolyse, som er det C-niveau skal kunne.
     B   + form (α/β), hurtigbyg, enzymer og strukturformlen (Haworth).
     A   + molekylformlen med vandregnskabet og 3D-visningen.

   Motoren er den samme hele vejen: samme molekyler, samme regler, samme
   opgaver — kun betjeningen er kortere. Det der er skjult, er altså ikke
   slået fra, og derfor kan man skifte niveau midt i det hele uden at
   miste det man har bygget.

   Niveauet huskes ikke mellem to besøg. Appen bruger ingen localStorage
   noget sted, og en lærer der åbner den på en fremmed maskine, skal ikke
   først finde ud af hvorfor knapperne mangler: friske øjne, frisk C.
   ===================================================================== */

import { state } from './state.js';

export const LEVELS = [
    { id: 'C', label: 'C',
      title: 'C-niveau: byggesten, blokke og opgaver',
      msg: 'C-niveau: byggesten, blokvisning og opgaver. Det er nok til kondensation og hydrolyse — resten kan hentes frem med B og A.' },
    { id: 'B', label: 'B',
      title: 'B-niveau: også form (α/β), enzymer og strukturformel',
      msg: 'B-niveau: nu kan du også vælge form (α/β), bygge færdigt med det samme, bruge enzymerne og se strukturformlen.' },
    { id: 'A', label: 'A',
      title: 'A-niveau: alt med — også molekylformel og 3D',
      msg: 'A-niveau: alt er med. Molekylformlen viser regnestykket med det fraspaltede vand, og 3D viser rigtige koordinater fra PubChem.' }
];

const RANK = { C: 0, B: 1, A: 2 };

/* Er vi på det niveau eller højere? Uden argument (eller med et niveau
   der ikke findes) er svaret ja — så er C-niveau det, man får som
   standard, og et modul skal kun mærke det op, der skal skjules. */
export function atLeast(level) {
    return RANK[state.level] >= (RANK[level] || 0);
}

export function levelInfo(id) {
    return LEVELS.find(l => l.id === id) || LEVELS[0];
}
