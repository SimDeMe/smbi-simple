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

   `tilstand` er sidens model, ikke mekanismens egen. Hvert stof har
   sin egen gradient i `tilstand.stof`:

     tilstand.stof.o2      = {ude, inde, min, maks, trin, decimaler, enhed, navn}
     tilstand.stof.k       = { … samme felter … }
     tilstand.stof.na      = { … }
     tilstand.stof.glukose = { … }
     tilstand.stof.h2o     = { … }

   `ude`/`inde` er koncentrationerne (mmol/L, undtagen h2o der er en
   relativ vandandel i %). En mekanisme må gerne skrive i dem — det
   er netop det, den gør ved at flytte molekyler. De øvrige felter
   styrer skyderne i `.knobs` og læses kun af side.js.

   `tilstand.fast` fortæller, om ilt og glukose holdes ved lige
   (cellen forbruger og tilfører), eller om diffusionen og bæreren
   må udligne dem. Natrium og kalium har intet med `fast` at gøre:
   det er pumpen (trin 9), der aktivt holder deres forskel ved lige,
   uanset om systemet ellers er lukket.
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
