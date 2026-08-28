/* ═══════════════════════════════════════════════════════════
   Osmose gennem aquaporin — cellens vandkanal.

   Vand siver godt nok selv gennem lipidlaget, men langsomt.
   Aquaporinen er en pore, der er så snæver, at vandmolekylerne må
   gå i én række, og som lukker ioner ude. Gennem den går det tusind
   gange hurtigere, og det er den vej, osmosen reelt løber.

   Modellen: vand trækkes mod den side, hvor der er flest opløste
   partikler. Strømmen ind er derfor koncentrationen **inde** gange
   en fast rate, og strømmen ud er koncentrationen **ude** gange
   den samme rate — begge veje hele tiden, med nettostrømmen mod
   det mest koncentrerede. Det er osmose sagt med to tal.

   Og så den vigtige konsekvens: det opløste stof bliver, hvor det
   er. Når vandet flytter sig, ændrer rumfanget sig, og dermed
   koncentrationen — n/V, ikke andet. Derfor svulmer cellen i
   hypotonisk væske og skrumper i hypertonisk, og derfor ender
   begge sider med den samme koncentration af sig selv.
   ═══════════════════════════════════════════════════════════ */
import {registrer, strømmåler, rejse, frem, sker} from './transport.js';
import {Y, tegnMembranprotein, tegnMærkat}        from './struktur.js';
import {find, tegnStof}                           from './molekyler.js';

const RATE   = 0.012;   // vandmolekyler pr. sekund pr. mmol/L opløst stof
/* Rumfanget, ét vandmolekyle flytter. Det skal være lille: er det
   stort, svinger en isotonisk celle flere procent op og ned af den
   rene tilfældighed, og så ser det ud, som om der sker noget, når
   der ikke gør. Med 0,0035 er udsvinget under 5 %, og en celle i
   rent vand er svulmet færdig på et halvt minut. */
const dV     = 0.0061;
const V_UDE  = 4.0;     // væsken uden for cellen er fire gange så stor
const IGENNEM = 0.55;   // sekunder gennem poren

const FARVE = '#9BD8F0';

/* Rumfang og stofmængde. Koncentrationen er n/V — ikke et tal, der
   sættes, men et der følger af, hvor vandet er. */
const rum = {vInde:1, vUde:V_UDE};

const rejser = [];
const nabo   = [];      // vandmolekyler, der venter ved mundingerne
const måler  = {ind:strømmåler(), ud:strømmåler()};
let vist = {ude:-1, inde:-1};

const H2O = find('h2o');

function porensX(ctx){ return ctx.omr.midte; }

/** Sæt rumfangene, så de passer til de koncentrationer, eleven har
    valgt på skyderne. Stofmængden er det, der bliver husket. */
function fraKoncentration(ctx){
  const k = ctx.tilstand.konc.oplost;
  if(k.ude === vist.ude && k.inde === vist.inde) return;
  vist = {...k};
  rum.vInde = 1; rum.vUde = V_UDE;
}

function nInde(ctx){ return ctx.tilstand.konc.oplost.inde * rum.vInde; }
function nUde(ctx){  return ctx.tilstand.konc.oplost.ude  * rum.vUde;  }

function flytVand(ctx, retning){
  /* retning +1: ind i cellen. Stofmængderne står fast; det er
     rumfangene, der ændrer sig, og koncentrationen følger med. */
  if(ctx.tilstand.fast) return;
  const nI = nInde(ctx), nU = nUde(ctx);
  rum.vInde = Math.max(0.35, Math.min(2.2, rum.vInde + retning * dV));
  rum.vUde  = Math.max(0.5,  rum.vUde  - retning * dV);
  const k = ctx.tilstand.konc.oplost;
  k.inde = nI / rum.vInde;
  k.ude  = nU / rum.vUde;
  vist = {...k};
}

function start(ctx, retning, t){
  const x = porensX(ctx) + (Math.random() - 0.5) * 8;
  const fra = retning > 0 ? Y.ud - 40 : Y.ind + 40;
  const til = retning > 0 ? Y.ind + 40 : Y.ud - 40;
  const p = {x, y:fra, vinkel:Math.random() * 6.3};
  rejser.push({p, retning, r:rejse(p, [[x, fra], [x, Y.midte], [x, til]], IGENNEM)});
  måler[retning > 0 ? 'ind' : 'ud'].tæl(t);
}

export default registrer({
  id:'osmose',
  navn:'Osmose gennem aquaporin',
  slags:'passiv',
  energi:'Ingen',
  protein:'Aquaporin (AQP)',
  molekyler:['h2o', 'oplost'],
  beskrivelse:'Aquaporinen er en pore, der kun lukker vand igennem — så snæver, at molekylerne må gå i én række, og med en ladning midtvejs, der vender vandmolekylet og dermed spærrer for ioner. Vandet går begge veje hele tiden, men nettostrømmen går mod den side, hvor der er flest opløste partikler. Det opløste stof bliver, hvor det er; det er vandet, der flytter sig, og derfor svulmer eller skrumper cellen.',

  bredde:170, proteinBredde:70, zoomHøjde:300,

  byg(ctx){
    rejser.length = 0; nabo.length = 0;
    const x = porensX(ctx);
    for(let i = 0; i < 12; i++){
      nabo.push({
        /* De ventende vandmolekyler holder sig fra selve poren, så
           de ikke lægger sig oven i den række, der er på vej igennem. */
        x0:x + (Math.random() < 0.5 ? -1 : 1) * (34 + Math.random() * 62),
        y0:(i < 6 ? Y.ud - 26 - Math.random() * 54 : Y.ind + 26 + Math.random() * 54),
        fase:Math.random() * 6.3, fart:0.7 + Math.random(),
      });
    }
    vist = {...ctx.tilstand.konc.oplost};
    rum.vInde = 1; rum.vUde = V_UDE;
    måler.ind.nulstil(); måler.ud.nulstil();
  },

  opdater(t, dt, ctx){
    fraKoncentration(ctx);
    const k = ctx.tilstand.konc.oplost;
    if(sker(RATE * k.inde, dt)) start(ctx,  1, t);   // trækkes ind mod det inderste
    if(sker(RATE * k.ude,  dt)) start(ctx, -1, t);

    for(let i = rejser.length - 1; i >= 0; i--){
      if(frem(rejser[i].r, dt)){
        flytVand(ctx, rejser[i].retning);
        rejser.splice(i, 1);
      }
    }
  },

  tegn(g, ctx, dæmp = 1){
    const x = porensX(ctx);
    g.save(); g.globalAlpha = dæmp;
    tegnMembranprotein(g, x, {b:70, farve:FARVE, åbenUd:30, åbenInd:30, talje:13});
    /* Timeglasset: den snævre talje er selve pointen, så den får
       sin egen streg, man kan se. */
    g.beginPath();
    g.moveTo(x - 13, Y.midte); g.lineTo(x + 13, Y.midte);
    g.lineWidth = 3; g.strokeStyle = 'rgba(23,33,31,0.45)';
    g.setLineDash([4, 4]); g.stroke(); g.setLineDash([]);
    tegnMærkat(g, 'aquaporin', x, Y.ind + 44, {størrelse:15});
    g.restore();

    const t = ctx.t;
    for(const n of nabo){
      tegnStof(g, H2O, n.x0 + Math.sin(t * n.fart + n.fase) * 7,
                       n.y0 + Math.cos(t * n.fart * 0.8 + n.fase) * 6,
               {vinkel:n.fase + t * 0.3, dæmp:dæmp * 0.85});
    }
    for(const {p} of rejser) tegnStof(g, H2O, p.x, p.y, {vinkel:p.vinkel, dæmp});
  },

  aflaes(ctx){
    const t = ctx.t;
    const k = ctx.tilstand.konc.oplost;
    const netto = måler.ind.rate(t) - måler.ud.rate(t);
    return [
      {mærkat:'Opløst uden for', værdi:Math.round(k.ude),  enhed:'mmol/L'},
      {mærkat:'Opløst inde i',   værdi:Math.round(k.inde), enhed:'mmol/L'},
      {mærkat:'Netto vand ind',  værdi:netto.toFixed(1).replace('.', ','), enhed:'molekyler/s'},
      {mærkat:'Cellens rumfang', værdi:Math.round(rum.vInde * 100),        enhed:'%'},
    ];
  },

  skydere(ctx){
    const k = ctx.tilstand.konc.oplost;
    return [
      {id:'op-ude',  mærkat:'Opløst stof uden for cellen', enhed:'mmol/L', min:0, max:600, trin:10,
       farve:'#0FA593', hent:() => k.ude,  sæt:v => { k.ude = v;  rum.vUde = V_UDE; vist = {...k}; }},
      {id:'op-inde', mærkat:'Opløst stof inde i cellen',   enhed:'mmol/L', min:0, max:600, trin:10,
       farve:'#0FA593', hent:() => k.inde, sæt:v => { k.inde = v; rum.vInde = 1;    vist = {...k}; }},
    ];
  },
});
