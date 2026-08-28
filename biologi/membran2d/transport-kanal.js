/* ═══════════════════════════════════════════════════════════
   Ionkanal — kaliumkanalen, der åbner og lukker.

   To ting skal kunne ses her. Den ene er, at kanalen ikke står
   åben hele tiden: en port i den indre ende svinger op og i, og
   der går kun ioner igennem, mens den er åben. Den anden er
   selektiviteten. Kaliumkanalen slipper kalium igennem, men ikke
   natrium — og natrium er den *mindste* af de to. Forklaringen
   ligger i vandkappen: filteret passer til den nøgne kaliumion,
   som derfor kan smide sin kappe og glide igennem, mens natrium
   holder alt for hårdt på sit vand til at slippe det.

   Derfor tegnes ionerne med kappe i vandet og uden kappe inde i
   poren — og natriumionen bliver vist bort ved filteret, hvor man
   kan se, at kappen er for stor.

   Modellen: strømmen den ene vej er koncentrationen på den side
   gange en fast rate, mens porten er åben. Nettostrømmen følger
   derfor gradienten og standser af sig selv.
   ═══════════════════════════════════════════════════════════ */
import {registrer, strømmåler, rejse, frem, sker, vent} from './transport.js';
import {Y, tegnMembranprotein, tegnMærkat, flade}       from './struktur.js';
import {find, tegnStof}                                 from './molekyler.js';

const RATE   = 0.05;    // ioner pr. sekund pr. mmol/L, når porten er åben
const AFVIST = 0.9;     // natriumioner pr. sekund, der prøver forgæves
const SØG    = 340;
const TUR    = 1.15;    // sekunder gennem kanalen

const FARVE  = '#C9A9F0';
const FILTER = Y.ud + 30;   // selektivitetsfilteret sidder yderst i poren

const port   = {åben:true, ur:1.4, grad:1};
const rejser = [];
const måler  = {ind:strømmåler(), ud:strømmåler()};
let afviste  = 0;

const K  = find('k');
const NA = find('na');

const modsat = s => s === 'ude' ? 'inde' : 'ude';

function start(ctx, fra, t){
  const {vand, omr} = ctx;
  const x = omr.midte;
  const yMund = fra === 'ude' ? Y.ud - 30 : Y.ind + 30;
  const p = vand.hent('k', fra, x, yMund, SØG);
  if(!p) return;
  const til = modsat(fra);
  const punkter = fra === 'ude'
    ? [[p.x, p.y], [x, Y.ud - 26], [x, FILTER], [x, Y.midte], [x, Y.ind + 40]]
    : [[p.x, p.y], [x, Y.ind + 26], [x, Y.midte], [x, FILTER], [x, Y.ud - 40]];
  rejser.push({p, til, slags:'igennem', r:rejse(p, punkter, TUR)});
  måler[fra === 'ude' ? 'ind' : 'ud'].tæl(t);
}

/** En natriumion prøver — og bliver vist bort ved filteret. */
function prøvNatrium(ctx){
  const {vand, omr} = ctx;
  const x = omr.midte;
  const p = vand.hent('na', 'ude', x, Y.ud - 40, SØG);
  if(!p) return;
  rejser.push({
    p, til:'ude', slags:'afvist',
    r:rejse(p, [[p.x, p.y], [x, Y.ud - 20], [x, FILTER - 12],
                [x, Y.ud - 34], [x + (Math.random() - 0.5) * 90, Y.ud - 78]], 1.5),
  });
  afviste++;
}

export default registrer({
  id:'kanal',
  navn:'Ionkanal',
  slags:'passiv',
  energi:'Ingen',
  protein:'Kaliumkanal',
  molekyler:['k', 'na'],
  beskrivelse:'En kanal er et hul med en pore fyldt med vand — ioner falder igennem den ned ad deres gradient, uden at proteinet skifter form og uden at det koster energi. To ting gør kanalen til andet end et hul: den har en port, der åbner og lukker, og den har et selektivitetsfilter. Filteret passer til den nøgne kaliumion, som derfor kan slippe sin vandkappe og glide igennem. Natrium er mindre, men holder hårdere på sit vand — og bliver derfor vist bort.',

  bredde:186, proteinBredde:72, zoomHøjde:290,

  byg(){
    rejser.length = 0; afviste = 0;
    port.åben = true; port.ur = 1.4; port.grad = 1;
    måler.ind.nulstil(); måler.ud.nulstil();
  },

  opdater(t, dt, ctx){
    /* Porten: ca. 70 % af tiden åben. */
    port.ur -= dt;
    if(port.ur <= 0){
      port.åben = !port.åben;
      port.ur = vent(port.åben ? 1.6 : 0.7);
    }
    const mål = port.åben ? 1 : 0;
    port.grad += (mål - port.grad) * Math.min(1, dt * 12);

    const k = ctx.tilstand.konc.k;
    if(port.åben){
      if(sker(RATE * k.ude,  dt)) start(ctx, 'ude',  t);
      if(sker(RATE * k.inde, dt)) start(ctx, 'inde', t);
    }
    if(sker(AFVIST, dt)) prøvNatrium(ctx);

    for(let i = rejser.length - 1; i >= 0; i--){
      if(frem(rejser[i].r, dt)){
        const {p, til} = rejser[i];
        ctx.vand.frigiv(p, til, p.x, p.y);
        rejser.splice(i, 1);
      }
    }
  },

  tegn(g, ctx, dæmp = 1){
    const x = ctx.omr.midte;
    g.save(); g.globalAlpha = dæmp;
    tegnMembranprotein(g, x, {
      b:72, farve:FARVE, åbenUd:30, talje:24,
      åbenInd:4 + 28 * port.grad,
    });
    /* Selektivitetsfilteret — to tunger, der lader 18 enheder stå
       åbent. En nøgen kaliumion er 22 enheder bred, en natriumion
       med kappe er 30. */
    for(const s of [-1, 1]){
      flade(g, c => {
        c.moveTo(x + s * 16, FILTER - 15);
        c.lineTo(x + s * 9,  FILTER);
        c.lineTo(x + s * 16, FILTER + 15);
        c.closePath();
      }, '#8C6BC4', 2.2);
    }
    tegnMærkat(g, port.åben ? 'porten er åben' : 'porten er lukket',
               x, Y.ind + 44, {størrelse:14});
    tegnMærkat(g, 'filter', x + 58, FILTER, {størrelse:13});
    g.restore();

    for(const {p, slags, r} of rejser){
      /* Inde i poren har kaliumionen smidt vandkappen. */
      const iPoren = p.y > Y.ud - 10 && p.y < Y.ind + 10;
      tegnStof(g, slags === 'afvist' ? NA : K, p.x, p.y,
               {vinkel:p.vinkel, dæmp, kappe:!(slags === 'igennem' && iPoren)});
      if(slags === 'afvist' && r.gået > 0.55 && r.gået < 1.0){
        g.save(); g.globalAlpha = dæmp;
        tegnMærkat(g, 'for stor kappe', p.x + 74, p.y, {størrelse:13, plade:'rgba(232,51,109,0.9)'});
        g.restore();
      }
    }
  },

  aflaes(ctx){
    const t = ctx.t;
    const k = ctx.tilstand.konc.k;
    const netto = måler.ud.rate(t) - måler.ind.rate(t);
    return [
      {mærkat:'Kalium uden for', værdi:Math.round(k.ude),  enhed:'mmol/L'},
      {mærkat:'Kalium inde i',   værdi:Math.round(k.inde), enhed:'mmol/L'},
      {mærkat:'Netto K⁺ ud',     værdi:netto.toFixed(1).replace('.', ','), enhed:'ioner/s'},
      {mærkat:'Afviste Na⁺',     værdi:afviste,            enhed:'i alt'},
    ];
  },

  skydere(ctx){
    const k = ctx.tilstand.konc.k;
    return [
      {id:'k-ude',  mærkat:'Kalium uden for cellen', enhed:'mmol/L', min:0, max:160, trin:2,
       farve:'#C9A9F0', hent:() => k.ude,  sæt:v => { k.ude = v; }},
      {id:'k-inde', mærkat:'Kalium inde i cellen',   enhed:'mmol/L', min:0, max:160, trin:2,
       farve:'#C9A9F0', hent:() => k.inde, sæt:v => { k.inde = v; }},
    ];
  },
});
