/* ═══════════════════════════════════════════════════════════
   Aktiv transport: Na⁺/K⁺-pumpen.

   Tre natriumioner ud, to kaliumioner ind, én ATP. Begge veje går
   **mod** koncentrationsgradienten, og det er netop dét, der gør
   det til aktiv transport: det kan kun lade sig gøre, fordi ATP
   spaltes undervejs. Derfor er ATP-molekylet med i figuren — man
   skal kunne se det blive brugt, ikke bare læse det.

   Omgangen er ATPasens egen: pumpen står åben indad (E1), binder
   tre natrium, fosforyleres af ATP, vender sig udad (E2) og
   slipper dem, binder to kalium, defosforyleres og vender tilbage.

   Farten er ikke fast. Den følger, hvor meget natrium der er inde
   i cellen, hvor meget kalium der er udenfor, og hvor meget ATP
   der er — hver med sin mætningskurve. Så pumpen standser af sig
   selv, når der ikke er mere at pumpe, og skruer man ATP'en ned,
   går den i stå. Det er den mest direkte måde at vise, hvorfor
   aktiv transport koster.
   ═══════════════════════════════════════════════════════════ */
import {registrer, strømmåler, glid, sker}         from './transport.js';
import {Y, tegnMembranprotein, tegnMærkat, tegnSæde, flade} from './struktur.js';
import {find, tegnStof, tegnADP}                   from './molekyler.js';

const VMAX   = 0.69;    // omgange pr. sekund, når alt er til stede
const KM_NA  = 10;      // mmol/L natrium inde i cellen
const KM_K   = 1.0;     // mmol/L kalium uden for cellen
const SØG    = 420;

const FARVE  = '#FF7FA8';
const KROP   = 104;

/* Omgangen. Summen er 1,74 s, og den sætter loftet over farten. */
const TRIN = [
  {navn:'binderNa',  tid:0.30},
  {navn:'atp',       tid:0.24},
  {navn:'vendUd',    tid:0.30},
  {navn:'slipperNa', tid:0.22},
  {navn:'binderK',   tid:0.26},
  {navn:'vendInd',   tid:0.28},
  {navn:'slipperK',  tid:0.14},
];
const OMGANG = TRIN.reduce((s, t) => s + t.tid, 0);

const atp    = {andel:1};
const p      = {fase:'venter', ur:0, na:[], k:[], atpVist:0, adp:0};
const måler  = {na:strømmåler(), k:strømmåler()};
let omgange  = 0;
const rundeUr = strømmåler(12);

const NA = find('na'), K = find('k'), ATP = find('atp');

function trinNu(){
  let t = p.ur;
  for(const s of TRIN){
    if(t < s.tid) return {navn:s.navn, del:t / s.tid};
    t -= s.tid;
  }
  return {navn:'slipperK', del:1};
}

/** Hvor åben er pumpen mod hver side i det trin, vi er i? */
function åbninger(){
  if(p.fase === 'venter') return {ud:4, ind:46};
  const {navn, del} = trinNu();
  const ind = {ud:4, ind:46}, ud = {ud:46, ind:4}, luk = {ud:4, ind:4};
  const bland = (a, b, f) => ({ud:a.ud + (b.ud - a.ud) * f, ind:a.ind + (b.ind - a.ind) * f});
  switch(navn){
    case 'binderNa': case 'atp': return ind;
    case 'vendUd':   return del < 0.5 ? bland(ind, luk, glid(del * 2)) : bland(luk, ud, glid(del * 2 - 1));
    case 'slipperNa': case 'binderK': return ud;
    case 'vendInd':  return del < 0.5 ? bland(ud, luk, glid(del * 2)) : bland(luk, ind, glid(del * 2 - 1));
    default: return ind;
  }
}

/** Sæderne midt i proteinet, hvor ionerne sidder undervejs. */
function sæde(x, i, antal, y){
  const spred = antal === 3 ? 25 : 19;
  return {x:x + (i - (antal - 1) / 2) * spred, y};
}

function ioneY(){
  const {navn, del} = trinNu();
  const inde = Y.ind - 30, midt = Y.midte, ude = Y.ud + 30;
  switch(navn){
    case 'binderNa': return inde;
    case 'atp':      return inde;
    case 'vendUd':   return inde + (ude - inde) * glid(del);
    case 'slipperNa': return ude;
    case 'binderK':  return ude;
    case 'vendInd':  return ude + (inde - ude) * glid(del);
    default: return inde;
  }
}

export default registrer({
  id:'pumpe',
  navn:'Na⁺/K⁺-pumpen',
  slags:'aktiv',
  energi:'1 ATP pr. omgang',
  protein:'Na⁺/K⁺-ATPase',
  molekyler:['na', 'k', 'atp'],
  beskrivelse:'Pumpen flytter 3 Na⁺ ud og 2 K⁺ ind på hver omgang — begge dele mod koncentrationsgradienten. Det kan kun lade sig gøre, fordi den spalter én ATP, og derfor er det aktiv transport. Fordi der ryger tre positive ladninger ud og kun to ind, bliver indersiden også en anelse mere negativ. Resultatet er den forskel i koncentration og ladning over membranen, som nerveceller bruger til at sende signaler — og som symporten ved siden af lever af.',

  bredde:230, proteinBredde:112, zoomHøjde:340,

  byg(){
    Object.assign(p, {fase:'venter', ur:0, na:[], k:[], atpVist:0, adp:0});
    atp.andel = 1; omgange = 0;
    måler.na.nulstil(); måler.k.nulstil(); rundeUr.nulstil();
  },

  opdater(t, dt, ctx){
    const {vand, omr, tilstand} = ctx;
    const x = omr.midte;
    const kNa = tilstand.konc.na, kK = tilstand.konc.k;

    if(p.fase === 'venter'){
      const fart = VMAX
        * (kNa.inde / (KM_NA + kNa.inde))
        * (kK.ude  / (KM_K  + kK.ude))
        * atp.andel;
      if(sker(fart, dt)){
        p.na = [0, 1, 2].map(() => vand.hent('na', 'inde', x, Y.ind + 34, SØG)).filter(Boolean);
        if(p.na.length === 3){ p.fase = 'omgang'; p.ur = 0; p.atpVist = 1; p.adp = 0; }
        else { for(const q of p.na) vand.frigiv(q, 'inde'); p.na = []; }
      }
      return;
    }

    const før = trinNu().navn;
    p.ur += dt;
    const nu = trinNu().navn;
    const y = ioneY();

    p.na.forEach((q, i) => { const s = sæde(x, i, 3, y); q.x = s.x; q.y = s.y; });
    p.k .forEach((q, i) => { const s = sæde(x, i, 2, y); q.x = s.x; q.y = s.y; });

    if(før !== 'atp' && nu === 'atp'){ p.atpVist = 1; p.adp = 0; }
    if(nu === 'atp'){ p.adp = trinNu().del; }

    if(før !== 'slipperNa' && nu === 'slipperNa'){
      for(const q of p.na) vand.frigiv(q, 'ude', q.x, Y.ud - 34 - Math.random() * 26);
      måler.na.tæl(t); måler.na.tæl(t); måler.na.tæl(t);
      p.na = [];
    }
    if(før !== 'binderK' && nu === 'binderK'){
      p.k = [0, 1].map(() => vand.hent('k', 'ude', x, Y.ud - 34, SØG)).filter(Boolean);
    }
    if(før !== 'slipperK' && nu === 'slipperK'){
      for(const q of p.k) vand.frigiv(q, 'inde', q.x, Y.ind + 34 + Math.random() * 26);
      måler.k.tæl(t); måler.k.tæl(t);
      p.k = [];
    }

    if(p.ur >= OMGANG){
      p.fase = 'venter'; p.ur = 0; p.atpVist = 0; p.adp = 0;
      omgange++; rundeUr.tæl(t);
    }
  },

  tegn(g, ctx, dæmp = 1){
    const x = ctx.omr.midte;
    const å = åbninger();
    g.save(); g.globalAlpha = dæmp;

    /* Cytosoldomænet, hvor ATP'en bindes og spaltes. */
    flade(g, c => { c.roundRect(x - 46, Y.ind + 16, 92, 54, 16); }, '#F7A6C2', 2.6);
    tegnMembranprotein(g, x, {b:KROP, farve:FARVE, åbenUd:å.ud, åbenInd:å.ind, talje:44});

    if(p.fase === 'venter'){
      for(let i = 0; i < 3; i++){
        const s = sæde(x, i, 3, Y.ind - 30);
        tegnSæde(g, s.x, s.y, 11);
      }
    }

    /* ATP → ADP + fosfat, mens fosforyleringen sker. */
    const yATP = Y.ind + 43;
    if(p.atpVist && p.adp < 0.55) tegnStof(g, ATP, x, yATP, {dæmp});
    else if(p.atpVist)            tegnADP(g, x, yATP, dæmp);
    else                          tegnSæde(g, x, yATP, 15);

    tegnMærkat(g, 'Na⁺/K⁺-ATPase', x, Y.ind + 92, {størrelse:15});
    tegnMærkat(g, '3 Na⁺ ud · 2 K⁺ ind · 1 ATP', x, Y.ud - 62, {størrelse:13});
    g.restore();

    for(const q of p.na) tegnStof(g, NA, q.x, q.y, {vinkel:q.vinkel, dæmp, kappe:false});
    for(const q of p.k)  tegnStof(g, K,  q.x, q.y, {vinkel:q.vinkel, dæmp, kappe:false});
  },

  aflaes(ctx){
    const t = ctx.t;
    return [
      {mærkat:'Na⁺ pumpet ud',  værdi:måler.na.rate(t).toFixed(1).replace('.', ','), enhed:'ioner/s'},
      {mærkat:'K⁺ pumpet ind',  værdi:måler.k.rate(t).toFixed(1).replace('.', ','),  enhed:'ioner/s'},
      {mærkat:'Omgange',        værdi:Math.round(rundeUr.rate(t) * 60),               enhed:'pr. minut'},
      {mærkat:'ATP forbrugt',   værdi:omgange,                                        enhed:'i alt'},
    ];
  },

  skydere(ctx){
    const kNa = ctx.tilstand.konc.na, kK = ctx.tilstand.konc.k;
    return [
      {id:'na-inde', mærkat:'Natrium inde i cellen', enhed:'mmol/L', min:0, max:60, trin:1,
       farve:'#FFB300', hent:() => kNa.inde, sæt:v => { kNa.inde = v; }},
      {id:'na-ude',  mærkat:'Natrium uden for cellen', enhed:'mmol/L', min:0, max:160, trin:2,
       farve:'#FFB300', hent:() => kNa.ude,  sæt:v => { kNa.ude = v; }},
      {id:'k-ude2',  mærkat:'Kalium uden for cellen', enhed:'mmol/L', min:0, max:20, trin:0.5,
       farve:'#C9A9F0', hent:() => kK.ude,   sæt:v => { kK.ude = v; }},
      {id:'atp',     mærkat:'ATP til rådighed', enhed:'%', min:0, max:100, trin:5,
       farve:'#E8336D', hent:() => atp.andel * 100, sæt:v => { atp.andel = v / 100; }},
    ];
  },
});
