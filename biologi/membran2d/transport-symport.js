/* ═══════════════════════════════════════════════════════════
   Sekundær aktiv transport: symporten SGLT1.

   To natriumioner og ét glukosemolekyle kommer ind sammen — det er
   dét, ordet symport betyder. Natrium falder ned ad sin gradient,
   og turen betaler for, at glukosen kan komme med, også når der
   allerede er mere glukose inde i cellen end udenfor.

   Det er den eneste mekanisme på siden, der ikke kan forstås for
   sig selv. Energien kommer ikke herfra: den kommer fra
   natriumgradienten, og den holdes oppe af Na⁺/K⁺-pumpen længere
   henne i membranen. Derfor deler de to den samme pulje natrium på
   siden — skruer man pumpens ATP ned, falder gradienten, og
   symporten går i stå af sig selv. Sekundær aktiv transport, vist
   som det den er: aktiv transport på anden hånd.

   Farten følger natriumgradienten og glukosen udenfor, hver med sin
   mætningskurve. SGLT1 har høj affinitet for glukose — halvmætning
   omkring 0,5 mmol/L — og kan derfor tømme tarmen for de sidste
   rester, hvor GLUT1 for længst ville have givet op.
   ═══════════════════════════════════════════════════════════ */
import {registrer, strømmåler, glid, sker}         from './transport.js';
import {Y, tegnMembranprotein, tegnMærkat, tegnSæde} from './struktur.js';
import {find, tegnStof}                            from './molekyler.js';

const VMAX   = 0.60;    // omgange pr. sekund ved fuld drivkraft
const KM_GLU = 0.5;     // mmol/L glukose uden for cellen
const GRAD_0 = 130;     // mmol/L — den gradient, der regnes som fuld drivkraft
const SØG    = 420;

const FARVE = '#7FE3D0';

const TRIN = [
  {navn:'binder',  tid:0.28},
  {navn:'lukker',  tid:0.24},
  {navn:'vender',  tid:0.22},
  {navn:'åbner',   tid:0.24},
  {navn:'slipper', tid:0.14},
  {navn:'retur',   tid:0.38},
];
const OMGANG = TRIN.reduce((s, t) => s + t.tid, 0);

const s = {fase:'venter', ur:0, na:[], glukose:null};
const måler = {glu:strømmåler(), na:strømmåler()};

const NA = find('na'), GLU = find('glukose');

function trinNu(){
  let t = s.ur;
  for(const x of TRIN){
    if(t < x.tid) return {navn:x.navn, del:t / x.tid};
    t -= x.tid;
  }
  return {navn:'retur', del:1};
}

function åbninger(){
  if(s.fase === 'venter') return {ud:40, ind:4};
  const {navn, del} = trinNu();
  const ud = {ud:40, ind:4}, ind = {ud:4, ind:40}, luk = {ud:4, ind:4};
  const bland = (a, b, f) => ({ud:a.ud + (b.ud - a.ud) * f, ind:a.ind + (b.ind - a.ind) * f});
  switch(navn){
    case 'binder': return ud;
    case 'lukker': return bland(ud, luk, glid(del));
    case 'vender': return luk;
    case 'åbner':  return bland(luk, ind, glid(del));
    case 'slipper': return ind;
    default: return bland(ind, ud, glid(del));   // tom vej tilbage
  }
}

function fragtY(){
  const {navn, del} = trinNu();
  const ude = Y.ud + 28, inde = Y.ind - 28;
  if(navn === 'binder') return ude;
  if(navn === 'lukker') return ude + (Y.midte - ude) * glid(del);
  if(navn === 'vender') return Y.midte;
  if(navn === 'åbner')  return Y.midte + (inde - Y.midte) * glid(del);
  return inde;
}

/** Drivkraften: hvor stor er natriumgradienten i forhold til den,
    en hvilende celle har? Er den væk, standser symporten. */
function drivkraft(ctx){
  const k = ctx.tilstand.konc.na;
  return Math.max(0, Math.min(1, (k.ude - k.inde) / GRAD_0));
}

export default registrer({
  id:'symport',
  navn:'Symport — sekundær aktiv transport',
  slags:'aktiv',
  energi:'Natriumgradienten (som pumpen holder oppe)',
  protein:'SGLT1 — natrium-glukose-symport',
  molekyler:['na', 'glukose'],
  beskrivelse:'Symporten tager to natriumioner og ét glukosemolekyle ind på samme tur. Natrium falder ned ad sin gradient, og den tur betaler for, at glukosen kan komme med — også op mod sin egen gradient. Der bruges ingen ATP her; energien er lagt i natriumgradienten på forhånd, og den holdes oppe af Na⁺/K⁺-pumpen. Derfor kaldes det sekundær aktiv transport: skru ned for pumpens ATP, og symporten går i stå kort efter.',

  bredde:214, proteinBredde:94, zoomHøjde:280,

  byg(){
    Object.assign(s, {fase:'venter', ur:0, na:[], glukose:null});
    måler.glu.nulstil(); måler.na.nulstil();
  },

  opdater(t, dt, ctx){
    const {vand, omr, tilstand} = ctx;
    const x = omr.midte;
    const gu = tilstand.konc.glukose.ude;

    if(s.fase === 'venter'){
      const fart = VMAX * drivkraft(ctx) * (gu / (KM_GLU + gu));
      if(sker(fart, dt)){
        const na = [0, 1].map(() => vand.hent('na', 'ude', x, Y.ud - 32, SØG)).filter(Boolean);
        const gl = vand.hent('glukose', 'ude', x, Y.ud - 32, SØG);
        if(na.length === 2 && gl){
          s.na = na; s.glukose = gl; s.fase = 'omgang'; s.ur = 0;
        } else {
          for(const q of na) vand.frigiv(q, 'ude');
          if(gl) vand.frigiv(gl, 'ude');
        }
      }
      return;
    }

    const før = trinNu().navn;
    s.ur += dt;
    const nu = trinNu().navn;
    const y = fragtY();

    s.na.forEach((q, i) => { q.x = x + (i === 0 ? -30 : 30); q.y = y; });
    if(s.glukose){ s.glukose.x = x; s.glukose.y = y; }

    if(før !== 'slipper' && nu === 'slipper'){
      for(const q of s.na){
        vand.frigiv(q, 'inde', q.x, Y.ind + 36 + Math.random() * 24);
        måler.na.tæl(t);
      }
      s.na = [];
      if(s.glukose){
        vand.frigiv(s.glukose, 'inde', x, Y.ind + 44);
        måler.glu.tæl(t);
        s.glukose = null;
      }
    }

    if(s.ur >= OMGANG){ s.fase = 'venter'; s.ur = 0; }
  },

  tegn(g, ctx, dæmp = 1){
    const x = ctx.omr.midte;
    const å = åbninger();
    g.save(); g.globalAlpha = dæmp;
    tegnMembranprotein(g, x, {b:94, farve:FARVE, åbenUd:å.ud, åbenInd:å.ind, talje:40});
    if(s.fase === 'venter'){
      tegnSæde(g, x - 30, Y.ud + 28, 11);
      tegnSæde(g, x + 30, Y.ud + 28, 11);
      tegnSæde(g, x,      Y.ud + 28, 15);
    }
    tegnMærkat(g, 'SGLT1', x, Y.ind + 44, {størrelse:15});
    tegnMærkat(g, '2 Na⁺ + glukose ind', x, Y.ud - 62, {størrelse:13});
    g.restore();

    for(const q of s.na) tegnStof(g, NA, q.x, q.y, {vinkel:q.vinkel, dæmp, kappe:false});
    if(s.glukose) tegnStof(g, GLU, s.glukose.x, s.glukose.y, {vinkel:s.glukose.vinkel, dæmp});
  },

  aflaes(ctx){
    const t = ctx.t;
    const k = ctx.tilstand.konc.na;
    return [
      {mærkat:'Glukose ind',     værdi:måler.glu.rate(t).toFixed(1).replace('.', ','), enhed:'molekyler/s'},
      {mærkat:'Na⁺ ind',         værdi:måler.na.rate(t).toFixed(1).replace('.', ','),  enhed:'ioner/s'},
      {mærkat:'Na⁺-gradient',    værdi:Math.round(k.ude - k.inde),                     enhed:'mmol/L'},
      {mærkat:'Drivkraft',       værdi:Math.round(drivkraft(ctx) * 100),               enhed:'%'},
    ];
  },

  skydere(ctx){
    const kNa = ctx.tilstand.konc.na, kG = ctx.tilstand.konc.glukose;
    return [
      {id:'sy-na-ude',  mærkat:'Natrium uden for cellen', enhed:'mmol/L', min:0, max:160, trin:2,
       farve:'#FFB300', hent:() => kNa.ude,  sæt:v => { kNa.ude = v; }},
      {id:'sy-na-inde', mærkat:'Natrium inde i cellen',   enhed:'mmol/L', min:0, max:60,  trin:1,
       farve:'#FFB300', hent:() => kNa.inde, sæt:v => { kNa.inde = v; }},
      {id:'sy-glu-ude', mærkat:'Glukose uden for cellen', enhed:'mmol/L', min:0, max:12, trin:0.5,
       farve:'#FF8A4C', hent:() => kG.ude,  sæt:v => { kG.ude = v; }},
      {id:'sy-glu-inde', mærkat:'Glukose inde i cellen',  enhed:'mmol/L', min:0, max:12, trin:0.5,
       farve:'#FF8A4C', hent:() => kG.inde, sæt:v => { kG.inde = v; }},
    ];
  },
});
