/* ═══════════════════════════════════════════════════════════
   Faciliteret diffusion gennem kanalprotein
   — trin 7 fylder mekanikken ud.
   ═══════════════════════════════════════════════════════════ */
import {registrer} from './transport.js';

export default registrer({
  id:'kanal',
  navn:'Kanalprotein',
  slags:'passiv',
  energi:'Ingen',
  protein:'kanal',
  kamera:{el:0.44, dist:12},
  molekyler:['na','k','cl'],
  beskrivelse:'Ioner kan ikke komme forbi de hydrofobe haler, men en kanal giver dem en vandfyldt vej igennem. Det er stadig passiv transport: de falder med koncentrationsgradienten, og kanalen kan hverken tvinge dem den anden vej eller bruge energi på det.',

  byg(){},
  opdater(){},
  aflaes(){ return null; },
  ryd(){},
});
