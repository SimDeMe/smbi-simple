/* ═══════════════════════════════════════════════════════════
   molekyler.js — stofferne, der skal igennem membranen.

   Fagdata plus den ene ting, der er rent grafisk: hvordan et
   molekyle ser ud, når det tegnes. De to hører sammen her, fordi
   formen *er* fagligt indhold — en ion med vandkappe skal kunne
   kendes fra en glukose, uden at man læser en signaturforklaring.

   `start` er de virkelige koncentrationer i mmol/L på hver side af
   en dyrecelles membran, og `maksKonc` er, hvor langt sidens skyder
   må gå. `maks` er, hvor mange kugler der højst tegnes på én side —
   figuren viser et udsnit, instrumenterne viser koncentrationen
   (se vand.js).

   `perKryds` er derimod fagligt: hvor meget koncentrationen ændrer
   sig, når ét molekyle går igennem. Den er sat, så et lukket system
   udligner sig på det halve minut, en time i klassen kan holde til
   — og den har ikke noget med, hvor mange kugler der tegnes, at
   gøre.

   Kun stoffer med `start` lægges ud i vandrummene (se vand.js).
   ═══════════════════════════════════════════════════════════ */

export const MOLEKYLER = [
  {
    id:'o2', navn:'Ilt', formel:'O₂',
    størrelse:'meget lille', polaritet:'upolær', ladning:'uladet',
    farve:'#FF5A36', form:'dobbelt', r:7,
    start:{ude:0.26, inde:0.05}, perKryds:0.0020, maks:26, maksKonc:0.30,
    hvorfor:'Lille og upolær, så den glider direkte gennem de hydrofobe haler. Intet protein, ingen energi.',
  },
  {
    id:'co2', navn:'Kuldioxid', formel:'CO₂',
    størrelse:'meget lille', polaritet:'upolær', ladning:'uladet',
    farve:'#9B7FD4', form:'tredobbelt', r:6,
    start:{ude:1.2, inde:2.4}, perKryds:0.015, maks:22, maksKonc:3.0,
    hvorfor:'Samme historie som ilt, bare den anden vej: cellen danner den, så gradienten peger ud, og affaldsstoffet forsvinder af sig selv.',
  },
  {
    id:'h2o', navn:'Vand', formel:'H₂O',
    størrelse:'lille', polaritet:'polær', ladning:'uladet',
    farve:'#7EC8E8', form:'vand', r:7,
    hvorfor:'Lille nok til at snige sig igennem hist og her, men polær. Gennem en aquaporin går det tusind gange hurtigere — det er den vej, osmosen reelt løber.',
  },
  {
    id:'oplost', navn:'Opløst stof', formel:'ioner og sukker',
    størrelse:'blandet', polaritet:'polær', ladning:'blandet',
    farve:'#0FA593', form:'kugle', r:6,
    start:{ude:300, inde:300}, perKryds:0, maks:18, maksKonc:600,
    hvorfor:'Alt det opløste under ét. Det er summen af partikler — ikke hvad de er — der bestemmer, hvilken vej vandet trækkes.',
  },
  {
    id:'na', navn:'Natriumion', formel:'Na⁺',
    størrelse:'lille kerne, stor vandkappe', polaritet:'ladet', ladning:'+1',
    farve:'#FFB300', form:'ion', r:8, kappe:15, mærke:'Na',
    start:{ude:145, inde:12}, perKryds:0.25, maks:20, maksKonc:160,
    hvorfor:'Ladet, så lipidlaget er lukket land. Kernen er lille, men vandkappen er den største af de to ioner — derfor bliver den vist bort ved kaliumkanalens filter.',
  },
  {
    id:'k', navn:'Kaliumion', formel:'K⁺',
    størrelse:'stor kerne, lille vandkappe', polaritet:'ladet', ladning:'+1',
    farve:'#C9A9F0', form:'ion', r:11, kappe:14, mærke:'K',
    start:{ude:4, inde:140}, perKryds:0.25, maks:20, maksKonc:160,
    hvorfor:'Også ladet, men kernen er større og vandkappen mindre. Kaliumkanalens filter passer præcis til den nøgne kalium — og det er dét, selektiviteten er.',
  },
  {
    id:'cl', navn:'Chloridion', formel:'Cl⁻',
    størrelse:'lille', polaritet:'ladet', ladning:'−1',
    farve:'#5FB030', form:'ion', r:10, kappe:14, mærke:'Cl',
    hvorfor:'Negativt ladet og omgivet af vand. Den skal gennem en kanal — fx CFTR, det protein der er defekt ved cystisk fibrose.',
  },
  {
    id:'glukose', navn:'Glukose', formel:'C₆H₁₂O₆',
    størrelse:'stor', polaritet:'polær', ladning:'uladet',
    farve:'#FF8A4C', form:'sekskant', r:13,
    start:{ude:5.5, inde:1.0}, perKryds:0.12, maks:16, maksKonc:12,
    hvorfor:'For stor og for polær til lipidlaget. Den skal bindes af et protein, der skifter form — med gradienten koster det ingenting, mod gradienten koster det en natriumgradient.',
  },
  {
    id:'insulin', navn:'Insulin', formel:'protein',
    størrelse:'meget stor', polaritet:'polær', ladning:'blandet',
    farve:'#0E86C8', form:'klump', r:12,
    hvorfor:'Et helt protein kommer aldrig igennem membranen. Det pakkes i en vesikel indeni og hældes ud, når vesiklen smelter sammen med membranen.',
  },
  {
    id:'ldl', navn:'LDL-partikel', formel:'kolesterol + protein',
    størrelse:'kæmpestor', polaritet:'blandet', ladning:'blandet',
    farve:'#F2C14E', form:'klump', r:19,
    hvorfor:'Den er tusind gange for stor til et transportprotein. Cellen bugter membranen indad om den og snører en vesikel af — receptorstyret endocytose.',
  },
  {
    id:'atp', navn:'ATP', formel:'adenosintrifosfat',
    størrelse:'mellem', polaritet:'polær', ladning:'−4',
    farve:'#E8336D', form:'atp', r:11,
    hvorfor:'Cellens energivaluta. Når den yderste fosfatgruppe spaltes fra, sætter den pumpen i stand til at flytte ioner mod gradienten.',
  },
];

export const find = id => MOLEKYLER.find(m => m.id === id);

/* Kun de stoffer, der driver rundt i vandet på hver side. */
export const PULJEDE = MOLEKYLER.filter(m => m.start);

/* ── Tegning ───────────────────────────────────────────────
   Alt tegnes i lærredets egne enheder (1 enhed ≈ 0,04 nm, se
   struktur.js), så et molekyle har samme størrelse, uanset hvor
   meget kameraet er zoomet ind.                                */

const BLÆK = '#17211F';

function kant(g, w = 2){
  g.lineWidth = w; g.strokeStyle = BLÆK; g.stroke();
}

function kugle(g, x, y, r, farve, streg = 2){
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = farve; g.fill(); kant(g, streg);
}

/** Mærkat inde i en ion — farve må aldrig være eneste signal. */
function mærkat(g, tekst, x, y, størrelse){
  g.font = `700 ${størrelse}px Archivo, system-ui, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = BLÆK;
  g.fillText(tekst, x, y);
}

/**
 * Tegn ét molekyle med sin midte i (x, y).
 * `dæmp` mellem 0 og 1 gør det gennemsigtigt, når en anden
 * transportvej er valgt, så den valgte står frem.
 */
export function tegnStof(g, stof, x, y, {vinkel = 0, dæmp = 1, kappe = true} = {}){
  const r = stof.r;
  g.save();
  g.globalAlpha = dæmp;
  g.translate(x, y);
  g.rotate(vinkel);

  switch(stof.form){
    case 'dobbelt':                       // O₂ — to atomer
      kugle(g, -r * 0.62, 0, r, stof.farve);
      kugle(g,  r * 0.62, 0, r, stof.farve);
      break;

    case 'tredobbelt':                    // CO₂ — O=C=O
      kugle(g, -r * 1.45, 0, r * 0.92, stof.farve);
      kugle(g,  r * 1.45, 0, r * 0.92, stof.farve);
      kugle(g, 0, 0, r * 1.12, '#5E4B8B');
      break;

    case 'vand':                          // H₂O — ilt med to brint
      kugle(g, -r * 0.82, -r * 0.72, r * 0.5, '#FFFFFF', 1.6);
      kugle(g,  r * 0.82, -r * 0.72, r * 0.5, '#FFFFFF', 1.6);
      kugle(g, 0, 0, r, stof.farve);
      break;

    case 'ion':                           // kerne + vandkappe
      if(kappe && stof.kappe){
        g.beginPath(); g.arc(0, 0, stof.kappe, 0, Math.PI * 2);
        g.fillStyle = 'rgba(126,200,232,0.30)'; g.fill();
        g.setLineDash([4, 4]); g.lineWidth = 1.6;
        g.strokeStyle = 'rgba(23,33,31,0.55)'; g.stroke();
        g.setLineDash([]);
      }
      kugle(g, 0, 0, r, stof.farve);
      mærkat(g, stof.mærke, 0, 0.5, r * 1.15);
      break;

    case 'sekskant':{                     // glukose — ringen
      g.beginPath();
      for(let i = 0; i < 6; i++){
        const a = -Math.PI / 2 + i * Math.PI / 3;
        g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r);
      }
      g.closePath();
      g.fillStyle = stof.farve; g.fill(); kant(g, 2.2);
      g.beginPath(); g.arc(0, 0, r * 0.34, 0, Math.PI * 2);
      g.fillStyle = 'rgba(255,255,255,0.75)'; g.fill();
      break;
    }

    case 'klump':{                        // proteiner og partikler
      /* En blød, uregelmæssig klump — et sammenfoldet protein er
         hverken en kugle eller en stjerne. Punkterne bindes sammen
         med kurver, så kanten bliver rund. */
      const n = 11, pkt = [];
      for(let i = 0; i < n; i++){
        const a = i / n * Math.PI * 2;
        const rr = r * (0.86 + 0.14 * Math.sin(i * 1.9 + 1.3));
        pkt.push([Math.cos(a) * rr, Math.sin(a) * rr]);
      }
      g.beginPath();
      const midt = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      let m = midt(pkt[n - 1], pkt[0]);
      g.moveTo(m[0], m[1]);
      for(let i = 0; i < n; i++){
        const næste = midt(pkt[i], pkt[(i + 1) % n]);
        g.quadraticCurveTo(pkt[i][0], pkt[i][1], næste[0], næste[1]);
      }
      g.closePath();
      g.fillStyle = stof.farve; g.fill(); kant(g, 2.2);
      break;
    }

    case 'atp':{                          // adenosin + tre fosfater
      kugle(g, -r * 0.85, 0, r * 0.72, '#FFD9C9');
      for(let i = 0; i < 3; i++) kugle(g, r * (0.1 + i * 0.6), 0, r * 0.4, stof.farve, 1.6);
      break;
    }

    default:
      kugle(g, 0, 0, r, stof.farve);
  }
  g.restore();
}

/** ADP + fri fosfat — det ATP bliver til, når pumpen har brugt den. */
export function tegnADP(g, x, y, dæmp = 1){
  const atp = find('atp');
  g.save(); g.globalAlpha = dæmp;
  kugle(g, x - atp.r * 0.85, y, atp.r * 0.72, '#FFD9C9');
  kugle(g, x + atp.r * 0.1,  y, atp.r * 0.4,  atp.farve, 1.6);
  kugle(g, x + atp.r * 0.7,  y, atp.r * 0.4,  atp.farve, 1.6);
  g.restore();
}
