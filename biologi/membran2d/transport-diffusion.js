/* ═══════════════════════════════════════════════════════════
   Simpel diffusion — ilt ind og kuldioxid ud, tværs gennem
   lipidlaget uden hjælp fra noget protein.

   Pointen, eleven skal kunne se: molekylerne går **begge veje**
   hele tiden. Ingen af dem vælger en retning; de støder tilfældigt
   rundt, og engang imellem rammer et af dem membranen og glider
   igennem. Fordi der er flere af dem på den side, hvor
   koncentrationen er høj, sker det oftere derfra — og
   nettostrømmen følger derfor gradienten helt af sig selv.

   Modellen er tilsvarende enkel: strømmen den ene vej er
   koncentrationen på den side gange en fast rate. Det er Ficks
   lov, uden at der er regnet på den ét eneste sted. Instrumenterne
   tæller de krydsninger, der faktisk sker, så tallene viser det,
   man kan se ske.

   Ilt og kuldioxid er valgt, fordi de peger hver sin vej: cellen
   forbruger ilt og danner kuldioxid, så den ene gradient trækker
   ind og den anden ud. Tallene er de virkelige: vand i ligevægt
   med atmosfærisk luft har ca. 0,26 mmol/L ilt.
   ═══════════════════════════════════════════════════════════ */
import {registrer, strømmåler, rejse, frem, sker} from './transport.js';
import {Y, tegnMærkat, tegnPil}                   from './struktur.js';
import {find, tegnStof}                           from './molekyler.js';

/* Krydsninger pr. sekund pr. mmol/L på afgangssiden. */
const RATE = {o2:15.4, co2:2.1};

const SØG     = 340;    // hvor langt væk et molekyle må hentes fra
const ANKOMST = 0.55;   // sekunder om at drive hen til krydsningsstedet
const IGENNEM = 0.95;   // sekunder om at komme gennem lipidlaget

const rejser = [];
const måler  = {
  o2:{ind:strømmåler(), ud:strømmåler()},
  co2:{ind:strømmåler(), ud:strømmåler()},
};

const modsat = s => s === 'ude' ? 'inde' : 'ude';

function start(stofId, fra, t, ctx){
  const {vand, omr} = ctx;
  const midt = omr.midte;
  const p = vand.hent(stofId, fra, midt, fra === 'ude' ? Y.ud : Y.ind, SØG);
  if(!p) return false;
  /* Krydsningen sker dér, hvor molekylet allerede er — ikke ét
     bestemt sted. Ellers ville de alle sammen søge ind mod den
     samme lodrette stribe, og det ville se ud, som om der var en
     usynlig kanal i lipidlaget. */
  const x = Math.max(omr.x0 + 26, Math.min(omr.x1 - 26, p.x));
  const til = modsat(fra);
  const yInd = fra === 'ude' ? Y.ud : Y.ind;
  const yUd  = fra === 'ude' ? Y.ind : Y.ud;
  const yFri = fra === 'ude' ? Y.ind + 34 : Y.ud - 34;
  rejser.push({
    stofId, fra, til,
    r: rejse(p, [[p.x, p.y], [x, yInd], [x, yUd], [x, yFri]], ANKOMST + IGENNEM),
  });
  måler[stofId][fra === 'ude' ? 'ind' : 'ud'].tæl(t);
  return true;
}

export default registrer({
  id:'diffusion',
  navn:'Simpel diffusion',
  slags:'passiv',
  energi:'Ingen',
  protein:null,
  molekyler:['o2', 'co2'],
  beskrivelse:'Ilt og kuldioxid er små og upolære, og de glider derfor lige gennem de hydrofobe haler midt i membranen. Der er intet protein og ingen energi indblandet. Molekylerne går begge veje hele tiden — men der er flest på den side, hvor koncentrationen er højest, så nettostrømmen følger gradienten af sig selv og standser, når forskellen er væk.',

  bredde:196, proteinBredde:0, zoomHøjde:330,

  byg(){
    rejser.length = 0;
    for(const m of Object.values(måler)){ m.ind.nulstil(); m.ud.nulstil(); }
  },

  opdater(t, dt, ctx){
    const {tilstand} = ctx;
    for(const stofId of ['o2', 'co2']){
      const k = tilstand.konc[stofId];
      if(sker(RATE[stofId] * k.ude,  dt)) start(stofId, 'ude',  t, ctx);
      if(sker(RATE[stofId] * k.inde, dt)) start(stofId, 'inde', t, ctx);
    }
    for(let i = rejser.length - 1; i >= 0; i--){
      if(frem(rejser[i].r, dt)){
        const {r, til} = rejser[i];
        ctx.vand.frigiv(r.p, til, r.p.x, r.p.y);
        rejser.splice(i, 1);
      }
    }
  },

  tegn(g, ctx, dæmp = 1){
    const {omr} = ctx;
    /* Der er ikke noget protein at pege på — så pilene og mærkatet
       er det, der viser, at det er her, det sker. */
    g.save(); g.globalAlpha = dæmp;
    tegnPil(g, omr.x0 + 24, Y.ud - 64, Y.ind + 64, '#FF5A36', {bred:8});
    tegnPil(g, omr.x1 - 24, Y.ind + 64, Y.ud - 64, '#9B7FD4', {bred:8, stiplet:true});
    tegnMærkat(g, 'lipidlaget selv', omr.midte, Y.ind + 44, {størrelse:15});
    g.restore();

    for(const {r, stofId} of rejser){
      tegnStof(g, find(stofId), r.p.x, r.p.y, {vinkel:r.p.vinkel, dæmp});
    }
  },

  aflaes(ctx){
    const t = ctx.t;
    const k = ctx.tilstand.konc;
    const nettoO2  = måler.o2.ind.rate(t)  - måler.o2.ud.rate(t);
    const nettoCO2 = måler.co2.ud.rate(t)  - måler.co2.ind.rate(t);
    return [
      {mærkat:'Ilt uden for',    værdi:k.o2.ude.toFixed(2).replace('.', ','),  enhed:'mmol/L'},
      {mærkat:'Ilt inde i',      værdi:k.o2.inde.toFixed(2).replace('.', ','), enhed:'mmol/L'},
      {mærkat:'Netto ilt ind',   værdi:nettoO2.toFixed(1).replace('.', ','),   enhed:'molekyler/s'},
      {mærkat:'Netto CO₂ ud',    værdi:nettoCO2.toFixed(1).replace('.', ','),  enhed:'molekyler/s'},
    ];
  },

  skydere(ctx){
    const k = ctx.tilstand.konc;
    return [
      {id:'o2-ude',  mærkat:'Ilt uden for cellen', enhed:'mmol/L', min:0, max:0.30, trin:0.01,
       farve:'#FF5A36', hent:() => k.o2.ude,  sæt:v => { k.o2.ude = v; }},
      {id:'o2-inde', mærkat:'Ilt inde i cellen',   enhed:'mmol/L', min:0, max:0.30, trin:0.01,
       farve:'#FF5A36', hent:() => k.o2.inde, sæt:v => { k.o2.inde = v; }},
      {id:'co2-ude',  mærkat:'Kuldioxid uden for', enhed:'mmol/L', min:0, max:3, trin:0.1,
       farve:'#9B7FD4', hent:() => k.co2.ude,  sæt:v => { k.co2.ude = v; }},
      {id:'co2-inde', mærkat:'Kuldioxid inde i',   enhed:'mmol/L', min:0, max:3, trin:0.1,
       farve:'#9B7FD4', hent:() => k.co2.inde, sæt:v => { k.co2.inde = v; }},
    ];
  },
});
