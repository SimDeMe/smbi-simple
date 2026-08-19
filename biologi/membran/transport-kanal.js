/* ═══════════════════════════════════════════════════════════
   Faciliteret diffusion gennem kanalprotein.

   Endnu ikke importeret i side.js: filen registrerer sig først,
   når trin 7 fylder mekanikken ud efter kontrakten i transport.js.
   ═══════════════════════════════════════════════════════════ */
import {registrer} from './transport.js';

export default registrer({
  id:'kanal',
  navn:'Kanalprotein',
  slags:'passiv',
  energi:'Ingen',
  protein:'kanal',
  molekyler:['na','k','cl'],
  beskrivelse:'Ioner kan ikke komme forbi de hydrofobe haler, men en kanal giver dem en vandfyldt vej igennem. Det er stadig passiv transport: de falder med koncentrationsgradienten, og kanalen kan hverken tvinge dem den anden vej eller bruge energi på det.',

  byg(){},
  opdater(){},
  aflaes(){ return null; },
  ryd(){},
});
