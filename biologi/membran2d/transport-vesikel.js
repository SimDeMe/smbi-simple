/* ═══════════════════════════════════════════════════════════
   Vesikeltransport — exocytose og endocytose.

   Den sidste udvej. Et helt protein som insulin, eller en
   LDL-partikel med kolesterol, er tusind gange for stort til selv
   det bredeste transportprotein. Så flytter cellen ikke molekylet
   gennem membranen — den flytter membranen om molekylet.

   Derfor er det også den eneste mekanisme på siden, hvor
   dobbeltlaget selv laver om på sig: det bugter sig, snører sig
   sammen og smelter igen. Modulet tegner derfor sit eget stykke
   membran i stedet for at låne det flade fra struktur.js — de
   samme fosfolipider, bare lagt langs en kurve, der kan bevæge sig.

   Begge veje koster energi (ATP til at forme membranen og til
   motorproteinerne), og der flyttes ikke ét molekyle ad gangen,
   men en hel portion. Det er forskellen på en dråbetæller og en
   spand.
   ═══════════════════════════════════════════════════════════ */
import {registrer, strømmåler, glid}                          from './transport.js';
import {Y, MÅL, HALVTYK, tegnLipidPar, tegnMærkat} from './struktur.js';
import {find, tegnStof}                                       from './molekyler.js';

const INSULIN = find('insulin');
const LDL     = find('ldl');

/* Omgangen: først en tur ud, så en tur ind. Tiderne skaleres af
   skyderen, så en klasse kan se det i slowmotion eller få farten
   op, når pointen er forstået. */
const UD = [
  {navn:'stiger',  tid:2.0},
  {navn:'smelter', tid:1.0},
  {navn:'tømmer',  tid:1.4},
  {navn:'lukker',  tid:0.9},
];
const IND = [
  {navn:'lander',  tid:1.5},
  {navn:'bugter',  tid:2.0},
  {navn:'snører',  tid:1.0},
  {navn:'synker',  tid:1.8},
];

const tid = a => a.reduce((s, x) => s + x.tid, 0);

/* Vesiklens radius, målt til midten mellem de to lag. Ydersiden
   ligger VR + HALVTYK fra midten — det er den afstand, den skal
   holde til membranen for lige at røre den.

   Og så den ting, der skal gøres rigtigt: de to lag har ikke plads
   til lige mange fosfolipider. Det ydre lag ligger på en cirkel,
   der er dobbelt så lang som det indres, så tegner man lige mange
   begge steder, mødes de indre hoveder i midten, og vesiklen
   bliver en stjerne i stedet for en blære. Hvert lag får derfor
   sit eget antal, sat efter sin egen omkreds. (En vesikel i
   virkeligheden er 40-100 nm — tegnet i samme målestok som
   membranen ville den fylde hele figuren, så den her er mindre.) */
const VR   = 78;
const YDER = VR + HALVTYK;
const N_UD  = Math.round(2 * Math.PI * (VR + HALVTYK) / MÅL.afstand);
const N_IND = Math.max(6, Math.round(2 * Math.PI * (VR - HALVTYK) / MÅL.afstand));

const v = {vej:'ud', ur:0, fragt:[], ldl:null};
const ude = [];                       // insulin, der er hældt ud i vandet
const måler = {exo:strømmåler(20), endo:strømmåler(20)};
let udFragt = 0, indFragt = 0;
const fart = {gange:1};

function trinNu(){
  const liste = v.vej === 'ud' ? UD : IND;
  let t = v.ur;
  for(const x of liste){
    if(t < x.tid) return {navn:x.navn, del:t / x.tid};
    t -= x.tid;
  }
  return {navn:liste[liste.length - 1].navn, del:1};
}

/* ── Membranens form i mekanismens eget stykke ──────────── *
 * `bule` er, hvor langt centerlinjen er trukket væk fra sin plads
 * på stedet x. Positiv er indad i cellen.                        */
function form(ctx){
  const xc = ctx.omr.midte;
  const {navn, del} = trinNu();
  let bule = 0, bredde = 112, pore = 0;

  if(v.vej === 'ud'){
    if(navn === 'smelter') bule = -34 * glid(del);
    if(navn === 'tømmer'){ bule = -34; pore = 34; }
    if(navn === 'lukker'){ bule = -34 * (1 - glid(del)); pore = 34 * (1 - glid(del)); }
  } else {
    if(navn === 'bugter'){ bule = DYBDE * glid(del); bredde = 128; }
    if(navn === 'snører'){ bule = DYBDE * (1 - glid(del)); bredde = 128; pore = 52 * glid(del); }
  }
  return {xc, bule, bredde, pore};
}

const gauss = (x, xc, b) => Math.exp(-(((x - xc) / b) ** 2));

/* Hvor dybt membranen bugter sig ind, og hvor vesiklen ligger, når
   den lige er snøret af eller lige skal smelte sammen. */
const DYBDE = 150;
const VED_MEMBRAN = Y.ind + YDER;      // vesiklens midte, når den rører
const NEDE        = Y.ind + YDER + 96; // helt inde i cytosolen

/** Vesiklens plads og størrelse — eller null, når der ingen er. */
function vesikel(ctx){
  const xc = ctx.omr.midte;
  const {navn, del} = trinNu();
  const r = VR;
  if(v.vej === 'ud'){
    if(navn === 'stiger') return {x:xc, y:NEDE - (NEDE - VED_MEMBRAN) * glid(del), r};
    return null;                       // smeltet sammen med membranen
  }
  if(navn === 'snører') return {x:xc, y:Y.midte + DYBDE + (VED_MEMBRAN - Y.midte - DYBDE) * glid(del), r};
  if(navn === 'synker') return {x:xc, y:VED_MEMBRAN + (NEDE - VED_MEMBRAN) * glid(del), r};
  return null;
}

function nyFragt(ctx){
  const xc = ctx.omr.midte;
  v.fragt = [];
  for(let i = 0; i < 5; i++){
    const a = Math.random() * 6.3, d = Math.random() * 40;
    v.fragt.push({dx:Math.cos(a) * d, dy:Math.sin(a) * d, x:xc, y:0, ude:false,
                  vx:0, vy:0, liv:1});
  }
}

export default registrer({
  id:'vesikel',
  navn:'Vesikeltransport',
  slags:'aktiv',
  energi:'ATP til at forme membranen',
  protein:null,
  molekyler:['insulin', 'ldl'],
  beskrivelse:'Store ting kommer hverken gennem lipidlaget eller gennem et transportprotein. Ved exocytose smelter en vesikel indefra sammen med membranen og hælder sit indhold ud — sådan kommer insulin og signalstoffer ud af cellen. Ved endocytose bugter membranen sig indad om noget udenfor og snører en vesikel af — sådan kommer LDL-kolesterol og hele bakterier ind. Begge veje koster ATP, og der flyttes en hel portion ad gangen, ikke ét molekyle.',

  bredde:250, proteinBredde:236, zoomHøjde:560, zoomMidte:Y.midte + 92,

  byg(ctx){
    Object.assign(v, {vej:'ud', ur:0, fragt:[], ldl:null});
    ude.length = 0; udFragt = 0; indFragt = 0; fart.gange = 1;
    måler.exo.nulstil(); måler.endo.nulstil();
    nyFragt(ctx);
  },

  opdater(t, dt, ctx){
    const xc = ctx.omr.midte;
    const før = trinNu().navn;
    v.ur += dt * fart.gange;
    const nu = trinNu().navn;

    /* Fragten inde i vesiklen følger den, indtil den hældes ud. */
    const ves = vesikel(ctx);
    if(v.vej === 'ud'){
      for(const f of v.fragt){
        if(f.ude){
          f.x += f.vx * dt; f.y += f.vy * dt;
          f.liv -= dt * 0.32;
        } else if(ves){
          f.x = ves.x + f.dx; f.y = ves.y + f.dy;
        } else {
          f.x = xc + f.dx * 0.5; f.y = Y.midte - 20 + f.dy * 0.4;
        }
      }
      if(før !== 'tømmer' && nu === 'tømmer'){
        for(const f of v.fragt){
          f.ude = true;
          const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
          f.vx = Math.cos(a) * 92; f.vy = Math.sin(a) * 92;
        }
        udFragt += v.fragt.length;
        måler.exo.tæl(t);
      }
    } else {
      if(!v.ldl) v.ldl = {x:xc + (Math.random() - 0.5) * 140, y:Y.ud - 130};
      const {navn, del} = trinNu();
      if(navn === 'lander'){
        v.ldl.x += (xc - v.ldl.x) * Math.min(1, dt * 2.4);
        v.ldl.y += (Y.ud - 34 - v.ldl.y) * Math.min(1, dt * 2.4);
      } else if(navn === 'bugter'){
        /* Partiklen følger med ned i gruben, lige uden for de
           hoveder, membranen vender ud mod den. */
        v.ldl.x = xc;
        const bund = Y.midte + DYBDE * glid(del);
        v.ldl.y = Math.max(Y.ud - 34, bund - 62);
      } else if(ves){
        v.ldl.x = ves.x; v.ldl.y = ves.y;
      }
      if(før !== 'synker' && nu === 'synker'){ indFragt++; måler.endo.tæl(t); }
    }

    for(let i = ude.length - 1; i >= 0; i--) if(ude[i].liv <= 0) ude.splice(i, 1);

    if(v.ur >= tid(v.vej === 'ud' ? UD : IND)){
      if(v.vej === 'ud'){ v.vej = 'ind'; v.ldl = null; }
      else { v.vej = 'ud'; nyFragt(ctx); }
      v.ur = 0;
    }
  },

  tegn(g, ctx, dæmp = 1){
    const {xc, bule, bredde, pore} = form(ctx);
    const x0 = ctx.omr.x0 + 6, x1 = ctx.omr.x1 - 6;

    g.save(); g.globalAlpha = dæmp;

    /* Mekanismens eget stykke dobbeltlag, lagt langs en kurve. */
    const d = x => bule * gauss(x, xc, bredde);
    for(let x = x0; x <= x1; x += MÅL.afstand * 0.86){
      if(pore > 0 && Math.abs(x - xc) < pore) continue;
      const h = 0.9;
      const hæld = Math.atan2(d(x + h) - d(x - h), 2 * h);
      tegnLipidPar(g, x, Y.midte + d(x), hæld);
    }

    /* Vesiklen: de samme fosfolipider, lagt i en ring — ét lag ad
       gangen, hvert med det antal der er plads til på dets egen
       cirkel. */
    const ves = vesikel(ctx);
    if(ves){
      for(const [antal, kun] of [[N_UD, 'kunUdad'], [N_IND, 'kunIndad']]){
        for(let i = 0; i < antal; i++){
          const a = (i + (kun === 'kunIndad' ? 0.5 : 0)) / antal * Math.PI * 2;
          tegnLipidPar(g, ves.x + Math.cos(a) * ves.r, ves.y + Math.sin(a) * ves.r,
                       a + Math.PI / 2, {[kun]:true});
        }
      }
    }

    tegnMærkat(g, v.vej === 'ud' ? 'exocytose · insulin ud' : 'endocytose · LDL ind',
               xc, Y.ud - 108, {størrelse:15});
    g.restore();

    if(v.vej === 'ud'){
      for(const f of v.fragt){
        if(f.liv <= 0) continue;
        tegnStof(g, INSULIN, f.x, f.y, {dæmp:dæmp * Math.min(1, f.liv)});
      }
    } else if(v.ldl){
      tegnStof(g, LDL, v.ldl.x, v.ldl.y, {dæmp});
    }
  },

  aflaes(ctx){
    const t = ctx.t;
    return [
      {mærkat:'Exocytose',   værdi:(måler.exo.rate(t) * 60).toFixed(0),  enhed:'vesikler/min'},
      {mærkat:'Endocytose',  værdi:(måler.endo.rate(t) * 60).toFixed(0), enhed:'vesikler/min'},
      {mærkat:'Fragt ud',    værdi:udFragt,  enhed:'molekyler i alt'},
      {mærkat:'Fragt ind',   værdi:indFragt, enhed:'partikler i alt'},
    ];
  },

  skydere(){
    return [
      {id:'ves-fart', mærkat:'Vesiklernes fart', enhed:'× normal', min:0.3, max:3, trin:0.1,
       farve:'#FFB300', hent:() => fart.gange, sæt:x => { fart.gange = x; }},
    ];
  },
});
