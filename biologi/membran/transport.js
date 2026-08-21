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

   `tilstand` er sidens model, ikke mekanismens egen. Hvert stof
   har sin egen gradient — glukose og ioner udligner sig ikke i
   takt med ilten:

     tilstand.o2      {ude, inde}   mmol/L
     tilstand.k       {ude, inde}
     tilstand.na      {ude, inde}
     tilstand.glukose {ude, inde}
     tilstand.fast    holder cellen forskellene ved lige?

   Tallene og skydernes spænd står i molekyler.js sammen med
   resten af fagdataene. En mekanisme må gerne skrive i `ude` og
   `inde` — det er netop det, den gør ved at flytte molekyler. Er
   `fast` sat, sørger cellen for gradienten, og mekanismen skal
   lade koncentrationerne være.

   Flere mekanismer må gerne røre det samme stof: kanalen lader
   kalium løbe ud, mens pumpen henter det ind igen. De deler
   koncentrationen i `tilstand`, men tegner hver sine molekyler
   omkring hver sit protein — så slipper de for at sende ioner
   frem og tilbage mellem sig.
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
