/* ═══════════════════════════════════════════════════════════
   Faciliteret diffusion gennem transportprotein (bærer)
   — trin 8 fylder mekanikken ud som en tilstandsmaskine:
   bind → luk → åbn på den anden side → slip.
   ═══════════════════════════════════════════════════════════ */
import {registrer} from './transport.js';

export default registrer({
  id:'baerer',
  navn:'Transportprotein',
  slags:'passiv',
  energi:'Ingen',
  protein:'baerer',
  kamera:{el:0.44, dist:12},
  molekyler:['glukose','aminosyre'],
  beskrivelse:'Glukose er både for stor og for polær til lipidlaget. Et transportprotein binder ét molekyle ad gangen og skifter form, så molekylet slippes ud på den anden side. Stadig passivt — men langsommere end en kanal, og det kan mættes, når alle proteinerne er optaget.',

  byg(){},
  opdater(){},
  aflaes(){ return null; },
  ryd(){},
});
