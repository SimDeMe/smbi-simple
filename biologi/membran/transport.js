/* ═══════════════════════════════════════════════════════════
   transport.js — registret over sidens transportmekanismer.

   Hver mekanisme ligger i sin egen fil, `transport-<id>.js`, og
   registrerer sig selv, når filen indlæses. side.js importerer
   filerne og læser MEKANISMER — så er en ny mekanisme én ny fil
   plus én importlinje.

   Alle registrerede mekanismer kører **samtidig**. Der er ingen
   vælger: membranen er levende, og eleven skruer på gradienten
   frem for at slå mekanismer til og fra.

   ── Kontrakten ────────────────────────────────────────────
   registrer({
     id, navn, slags,        // slags: 'passiv' | 'aktiv'
     energi,                 // fx 'Ingen' eller '1 ATP pr. omgang'
     protein,                // id på proteinet i struktur.js, eller null
     molekyler,              // id'er fra molekyler.js
     beskrivelse,            // teksten i forklaringsruden
     byg(ctx),               // laver mekanismens dele én gang
     opdater(t, dt, ctx),    // flytter dem ét billede frem
     aflaes(ctx),            // [{mærkat, værdi, enhed}] til .gauges
     ryd(ctx),               // fjerner delene igen
   })

   ctx = {scene, membran, tilstand}

   `tilstand` er sidens model, ikke mekanismens egen: {ude, inde}
   er koncentrationerne i mmol/L på hver side af membranen, og
   `fast` fortæller, om de holdes ved lige (cellen forbruger og
   tilfører), eller om transporten må udligne dem. En mekanisme
   må gerne skrive i `ude`/`inde` — det er netop det, den gør ved
   at flytte molekyler.
   ═══════════════════════════════════════════════════════════ */

export const MEKANISMER = [];

export function registrer(mekanisme){
  if(MEKANISMER.some(m => m.id === mekanisme.id)){
    throw new Error(`Transportmekanismen "${mekanisme.id}" er registreret to gange.`);
  }
  MEKANISMER.push(mekanisme);
  return mekanisme;
}

export const find = id => MEKANISMER.find(m => m.id === id);
