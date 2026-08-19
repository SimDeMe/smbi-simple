/* ═══════════════════════════════════════════════════════════
   Simpel diffusion — trin 6 fylder mekanikken ud.
   Foreløbig kun beskrivelsen, så vælgeren og instrumenterne
   har noget rigtigt at vise.
   ═══════════════════════════════════════════════════════════ */
import {registrer} from './transport.js';

export default registrer({
  id:'diffusion',
  navn:'Simpel diffusion',
  slags:'passiv',
  energi:'Ingen',
  protein:null,
  /* Et stykke rent dobbeltlag uden proteiner — det er netop
     pointen, at der ikke skal noget protein til. */
  sted:{x:-1.0, z:0.0},
  kamera:{el:0.44, dist:13},
  molekyler:['o2','co2','steroid'],
  beskrivelse:'Små upolære molekyler glider tværs gennem lipidlaget uden hjælp fra noget protein. De bevæger sig begge veje hele tiden, men nettostrømmen går fra høj mod lav koncentration — og standser, når der er lige meget på begge sider.',

  byg(){},
  opdater(){},
  aflaes(){ return null; },
  ryd(){},
});
