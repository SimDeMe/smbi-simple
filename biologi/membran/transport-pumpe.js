/* ═══════════════════════════════════════════════════════════
   Aktiv transport: Na⁺/K⁺-pumpen.

   Endnu ikke importeret i side.js. Trin 9 fylder mekanikken ud:
   3 Na⁺ ud, 2 K⁺ ind, 1 ATP.
   ═══════════════════════════════════════════════════════════ */
import {registrer} from './transport.js';

export default registrer({
  id:'pumpe',
  navn:'Na⁺/K⁺-pumpen',
  slags:'aktiv',
  energi:'1 ATP pr. omgang',
  protein:'pumpe',
  molekyler:['na','k'],
  beskrivelse:'Pumpen flytter 3 Na⁺ ud og 2 K⁺ ind — begge dele mod koncentrationsgradienten. Det kan kun lade sig gøre, fordi den spalter ATP, og derfor er det aktiv transport. Resultatet er den forskel i ladning og koncentration over membranen, som nervecellerne bruger til at sende signaler.',

  byg(){},
  opdater(){},
  aflaes(){ return null; },
  ryd(){},
});
