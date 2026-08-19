/* ═══════════════════════════════════════════════════════════
   transport.js — registret over sidens transportmekanismer.

   Hver mekanisme ligger i sin egen fil, `transport-<id>.js`, og
   registrerer sig selv, når filen indlæses. side.js importerer
   filerne og læser MEKANISMER — så er en ny mekanisme én ny fil
   plus én importlinje.

   ── Kontrakten ────────────────────────────────────────────
   registrer({
     id, navn, slags,        // slags: 'passiv' | 'aktiv'
     protein,                // id på proteinet i struktur.js, eller null
     molekyler,              // id'er fra molekyler.js
     byg(ctx),               // laver mekanismens dele én gang
     opdater(t, dt, ctx),    // flytter dem ét billede frem
     aflaes(ctx),            // {mærkat: værdi} til .gauges
     ryd(ctx),               // kaldes, når mekanismen fravælges
   })

   ctx indeholder: {scene, membran, mat, tilstand}
   ── Endnu ingen mekanismer registreret. Se PLAN.md, trin 5-8.
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
