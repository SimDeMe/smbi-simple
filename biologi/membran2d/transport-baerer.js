/* ═══════════════════════════════════════════════════════════
   Faciliteret diffusion gennem et bærerprotein — GLUT1.

   Kontrasten til kanalen er hele pointen. Kanalen er et hul, og
   ionerne falder igennem. Bæreren binder ét molekyle ad gangen,
   lukker sig om det, vender sig og slipper det på den anden side.
   Derfor er den langsommere — og derfor kan den **mættes**: når
   der er rigeligt med glukose, er det ikke længere koncentrationen,
   der sætter farten, men hvor hurtigt proteinet kan nå at vende.

   Mætningen er ikke regnet ind; den kommer af sig selv. Proteinet
   binder med en chance, der følger koncentrationen, og hver omgang
   tager sin faste tid — og så *er* der en Michaelis-Menten-kurve,
   uden at nogen har skrevet den. Med tallene herunder bliver
   halvmætningen 1,5 mmol/L, netop GLUT1's egen K_m, og
   blodsukkeret ligger omkring 5 mmol/L. Derfor kører transportøren
   i røde blodlegemer og i hjernen næsten for fuld kraft hele tiden.

   Retningen bestemmer ingen. Bæreren står skiftevis åben mod den
   ene og den anden side, og der bindes oftest fra den side, hvor
   der er flest molekyler — så nettostrømmen følger gradienten.
   ═══════════════════════════════════════════════════════════ */
import {registrer, strømmåler, glid, sker} from './transport.js';
import {Y, tegnMembranprotein, tegnMærkat, tegnSæde} from './struktur.js';
import {find, tegnStof}                    from './molekyler.js';

const KON  = 0.85;   // bindinger pr. sekund pr. mmol/L
const SØG  = 340;
/* Halvmætningen er ikke sat; den følger af de to tal ovenfor og
   nedenfor: K_m = 1 / (KON · OMGANG) = 1 / (0,85 · 0,78) = 1,5
   mmol/L, og V_maks = 1 / OMGANG = 1,28 molekyler pr. sekund.
   Efterprøvet med målte krydsninger, se PLAN.md. */
const KM   = 1 / (KON * 0.78);

const FARVE = '#FFAE8A';

/* Omgangen, ét trin ad gangen. Summen er 0,78 s, og det er den,
   der sætter loftet over, hvor hurtigt bæreren kan arbejde. */
const TRIN = [
  {navn:'binder',  tid:0.14},
  {navn:'lukker',  tid:0.20},
  {navn:'vender',  tid:0.16},
  {navn:'åbner',   tid:0.20},
  {navn:'slipper', tid:0.08},
];
const OMGANG = TRIN.reduce((s, t) => s + t.tid, 0);

const b = {side:'ude', fase:'venter', ur:0, glukose:null};
const måler = {ind:strømmåler(), ud:strømmåler()};

const GLU = find('glukose');
const modsat = s => s === 'ude' ? 'inde' : 'ude';

/** Hvor langt inde i omgangen er vi, og i hvilket trin? */
function trinNu(){
  let t = b.ur;
  for(const s of TRIN){
    if(t < s.tid) return {navn:s.navn, del:t / s.tid};
    t -= s.tid;
  }
  return {navn:'slipper', del:1};
}

/** Åbningen mod hver side, mens omgangen kører. Når bæreren
    venter, står den halvt åben mod den side, den sidst vendte —
    og drejer sig først, når der er noget at binde. */
function åbninger(){
  if(b.fase === 'venter'){
    return b.side === 'ude' ? {ud:30, ind:4} : {ud:4, ind:30};
  }
  const {navn, del} = trinNu();
  const fra = b.side, lukket = {ud:4, ind:4};
  const åben = s => s === 'ude' ? {ud:38, ind:4} : {ud:4, ind:38};
  switch(navn){
    case 'binder': return åben(fra);
    case 'lukker': {
      const a = åben(fra), f = glid(del);
      return {ud:a.ud + (lukket.ud - a.ud) * f, ind:a.ind + (lukket.ind - a.ind) * f};
    }
    case 'vender': return lukket;
    case 'åbner': {
      const a = åben(modsat(fra)), f = glid(del);
      return {ud:lukket.ud + (a.ud - lukket.ud) * f, ind:lukket.ind + (a.ind - lukket.ind) * f};
    }
    default: return åben(modsat(fra));
  }
}

/** Hvor sidder molekylet i hulrummet lige nu? */
function sædeY(){
  const fra = b.side;
  const yFra = fra === 'ude' ? Y.ud + 26 : Y.ind - 26;
  const yTil = fra === 'ude' ? Y.ind - 26 : Y.ud + 26;
  const {navn, del} = trinNu();
  if(navn === 'binder') return yFra;
  if(navn === 'lukker') return yFra + (Y.midte - yFra) * glid(del);
  if(navn === 'vender') return Y.midte;
  if(navn === 'åbner')  return Y.midte + (yTil - Y.midte) * glid(del);
  return yTil;
}

export default registrer({
  id:'baerer',
  navn:'Bærerprotein',
  slags:'passiv',
  energi:'Ingen',
  protein:'GLUT1 — glukosetransportør',
  molekyler:['glukose'],
  beskrivelse:'Glukose er både for stor og for polær til at komme gennem lipidlaget. Et bærerprotein binder ét molekyle ad gangen, lukker sig om det, vender sig og slipper det på den anden side. Det er stadig passiv transport — molekylet går ned ad sin gradient, og det koster ingen ATP. Men i modsætning til kanalen kan bæreren mættes: når koncentrationen er høj nok, er det proteinets egen omgangstid, der sætter farten.',

  bredde:196, proteinBredde:84, zoomHøjde:280,

  byg(){
    Object.assign(b, {side:'ude', fase:'venter', ur:0, glukose:null});
    måler.ind.nulstil(); måler.ud.nulstil();
  },

  opdater(t, dt, ctx){
    const {vand, omr, tilstand} = ctx;
    const x = omr.midte;

    if(b.fase === 'venter'){
      /* Der bindes fra begge sider, hver med en chance der følger
         koncentrationen dér. Det er hele forklaringen på, at
         nettostrømmen følger gradienten: ingen retning er valgt
         på forhånd, der er bare oftest et molekyle klar på den
         side, hvor der er flest. */
      for(const side of ['ude', 'inde']){
        if(!sker(KON * tilstand.konc.glukose[side], dt)) continue;
        const yMund = side === 'ude' ? Y.ud - 26 : Y.ind + 26;
        const p = vand.hent('glukose', side, x, yMund, SØG);
        if(!p) continue;
        b.side = side; b.glukose = p; b.fase = 'omgang'; b.ur = 0;
        break;
      }
      return;
    }

    const før = trinNu().navn;
    b.ur += dt;
    const nu = trinNu().navn;

    if(b.glukose){
      b.glukose.x = x + Math.sin(t * 2) * 1.5;
      b.glukose.y = sædeY();
      if(før !== 'slipper' && nu === 'slipper'){
        const til = modsat(b.side);
        const yFri = til === 'ude' ? Y.ud - 40 : Y.ind + 40;
        vand.frigiv(b.glukose, til, x, yFri);
        måler[til === 'inde' ? 'ind' : 'ud'].tæl(t);
        b.glukose = null;
      }
    }

    if(b.ur >= OMGANG){
      b.side = modsat(b.side);
      b.fase = 'venter'; b.ur = 0;
    }
  },

  tegn(g, ctx, dæmp = 1){
    const x = ctx.omr.midte;
    const å = åbninger();
    g.save(); g.globalAlpha = dæmp;
    tegnMembranprotein(g, x, {b:84, farve:FARVE, åbenUd:å.ud, åbenInd:å.ind, talje:34});
    if(!b.glukose) tegnSæde(g, x, b.fase === 'venter'
      ? (b.side === 'ude' ? Y.ud + 26 : Y.ind - 26) : sædeY(), 15);
    tegnMærkat(g, 'GLUT1', x, Y.ind + 44, {størrelse:15});
    g.restore();

    if(b.glukose) tegnStof(g, GLU, b.glukose.x, b.glukose.y, {vinkel:b.glukose.vinkel, dæmp});
  },

  aflaes(ctx){
    const t = ctx.t;
    const k = ctx.tilstand.konc.glukose;
    const netto = måler.ind.rate(t) - måler.ud.rate(t);
    const mætning = k.ude / (KM + k.ude) * 100;
    return [
      {mærkat:'Glukose uden for', værdi:k.ude.toFixed(1).replace('.', ','),  enhed:'mmol/L'},
      {mærkat:'Glukose inde i',   værdi:k.inde.toFixed(1).replace('.', ','), enhed:'mmol/L'},
      {mærkat:'Netto ind',        værdi:netto.toFixed(1).replace('.', ','),  enhed:'molekyler/s'},
      {mærkat:'Mætning udadtil',  værdi:Math.round(mætning),                 enhed:'%'},
    ];
  },

  skydere(ctx){
    const k = ctx.tilstand.konc.glukose;
    return [
      {id:'glu-ude',  mærkat:'Glukose uden for cellen', enhed:'mmol/L', min:0, max:12, trin:0.5,
       farve:'#FF8A4C', hent:() => k.ude,  sæt:v => { k.ude = v; }},
      {id:'glu-inde', mærkat:'Glukose inde i cellen',   enhed:'mmol/L', min:0, max:12, trin:0.5,
       farve:'#FF8A4C', hent:() => k.inde, sæt:v => { k.inde = v; }},
    ];
  },
});
