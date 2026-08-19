/* ═══════════════════════════════════════════════════════════
   Aktiv transport: Na⁺/K⁺-pumpen
   — trin 9 fylder mekanikken ud: 3 Na⁺ ud, 2 K⁺ ind, 1 ATP.
   ═══════════════════════════════════════════════════════════ */
import {registrer} from './transport.js';

export default registrer({
  id:'pumpe',
  navn:'Na⁺/K⁺-pumpen',
  slags:'aktiv',
  energi:'1 ATP pr. omgang',
  protein:'pumpe',
  /* Pumpen har et domæne, der hænger ned i cytosol, så kameraet
     kigger lidt lavere end ved de andre. */
  kamera:{el:0.38, dist:15, y:-0.6},
  molekyler:['na','k'],
  beskrivelse:'Pumpen flytter 3 Na⁺ ud og 2 K⁺ ind — begge dele mod koncentrationsgradienten. Det kan kun lade sig gøre, fordi den spalter ATP, og derfor er det aktiv transport. Resultatet er den forskel i ladning og koncentration over membranen, som nervecellerne bruger til at sende signaler.',

  byg(){},
  opdater(){},
  aflaes(){ return null; },
  ryd(){},
});
