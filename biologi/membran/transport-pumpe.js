/* ═══════════════════════════════════════════════════════════
   Aktiv transport: Na⁺/K⁺-pumpen.

   Én omgang: 3 Na⁺ bindes på cytosolsiden, ATP spaltes og driver
   et formskift, der slipper dem ud på ydersiden — så bindes 2 K⁺
   på ydersiden, og et formskift tilbage slipper dem ind i cellen.
   Begge dele går imod deres egen gradient: Na⁺ er der mest af
   udenfor i forvejen, K⁺ mest af indenfor. Det er præcis derfor,
   det kræver energi, og præcis derfor, det er aktiv transport.

   Pumpen kører hele tiden, uafhængigt af knappen **Fast
   koncentration** — den knap gælder kun ilt, glukose og vand, som
   ikke har noget aktivt modstykke i denne model. Kalium- og natrium-
   gradienten holdes udelukkende oppe af balancen mellem denne
   pumpe og kanalens passive lækage (transport-kanal.js): to
   modsatrettede strømme om den samme delte tilstand,
   ctx.tilstand.stof.k og .na, uden noget "hold værdien"-hak.

   Farten afhænger af, hvor meget der er at pumpe: ligesom et
   virkeligt enzym er pumpen praktisk talt mættet ved de
   koncentrationer, en hvilende celle har, og den bremser først op,
   når natrium indeni for alvor slipper op.

   ── Hvorfor natrium har sin egen, usynlige lækage ────────────
   Kanalen ved siden af er kaliumselektiv og viser natrium bort —
   det er netop dens pointe. Uden en eneste vej ind for natrium
   ville pumpen simpelthen tømme cellen for natrium på nogle få
   sekunder, og så ville den selv gå i stå: mættet, aktiv transport
   der stopper, fordi der intet er tilbage at pumpe. Det ville ikke
   vise noget forkert, men det ville se ud som om simuleringen gik i
   stykker. En rigtig celle har flere andre natriumveje end den ene
   kanal, denne model viser — bl.a. de transportproteiner, der
   bærer aminosyrer og glukose ind sammen med natrium (se
   `molekyler.js`, `aminosyre`). De er ikke bygget som egne
   mekanismer her, men deres samlede virkning er en lille, umærket
   sivning tilbage — nok til at pumpen aldrig løber tør, ikke nok
   til at den kan læne sig tilbage. Se PLAN.md for tallene.
   ═══════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import {registrer}             from './transport.js';
import {MÅL}                   from './struktur.js';
import {find as findMolekyle}  from './molekyler.js';

/* ── Modellens tal ─────────────────────────────────────── */
const KM_NA = 0.6;   // mmol/L Na⁺ indeni — halvt mættet her
const KM_K  = 0.3;   // mmol/L K⁺ udenfor — halvt mættet her

const T_UD  = 0.35, T_VEND1 = 0.15;   // Na⁺ ud, så formskift
const T_IND = 0.35, T_VEND2 = 0.15;   // K⁺ ind, så formskift tilbage
const T_CYKLUS = T_UD + T_VEND1 + T_IND + T_VEND2;
const VMAX = 1 / T_CYKLUS;            // omgange/s ved fuld mætning

const ENHED_NA = 1.0, ENHED_K = 1.0;   // mmol/L, én ions bidrag pr. omgang

const NA_SIVNING = 0.025;   // mmol/L/s pr. mmol/L forskel — se hoved-kommentaren

const OVER = MÅL.tykkelse / 2 + MÅL.hoved * 0.85;
const DOCK = 1.6;    // nm — hvor langt fra membranens midte ionerne bindes

/* Kerne og vandkappe, samme mål som i kanalen — genkendeligt er
   pointen: det er de samme to ioner, bare en anden vej igennem. */
const KUGLER = {
  na:{kerne:0.14, kappe:0.38},
  k: {kerne:0.18, kappe:0.33},
};

/* ── Faser ─────────────────────────────────────────────── */
const NA_UD = 0, VEND1 = 1, K_IND = 2, VEND2 = 3;

let fase = NA_UD, u = 0;
let nyFase = true;   // sand i det første billede efter et faseskift
let atpAlder = 0;    // 0 = intet ATP bundet, 1 = lige bundet

let pumpe = null, pumpeX = 0, pumpeZ = 0;
let naStof = null, kStof = null;

/* Positionerne for de 3 Na⁺ og 2 K⁺, der bæres igennem lige nu. */
const naX = new Float32Array(3), naY = new Float32Array(3), naZ = new Float32Array(3);
const kX  = new Float32Array(2), kY  = new Float32Array(2), kZ  = new Float32Array(2);

let naKerne = null, naKappe = null, kKerne = null, kKappe = null, atpKugle = null;
let materialer = [];
let gruppe = null;

const _m = new THREE.Matrix4();
const SKJULT = new THREE.Matrix4().makeScale(0, 0, 0);

/* ── Små hjælpere ──────────────────────────────────────── */
const mellem = (a, b) => a + Math.random() * (b - a);
const blødt  = v => v * v * (3 - 2 * v);

/** Et spredt punkt omkring dockingstedet på den ene side — så de
    3 (eller 2) ioner ikke falder oven i hinanden. */
function spredt(i, n, r){
  const a = (i / n) * Math.PI * 2 + mellem(-0.3, 0.3);
  return [Math.cos(a) * r, Math.sin(a) * r];
}

/* ═══════════════════════════════════════════════════════════ */
export default registrer({
  id:'pumpe',
  navn:'Na⁺/K⁺-pumpen',
  slags:'aktiv',
  energi:'1 ATP pr. omgang',
  protein:'pumpe',
  molekyler:['na','k'],
  beskrivelse:'Pumpen flytter 3 Na⁺ ud og 2 K⁺ ind — begge dele mod koncentrationsgradienten. Det kan kun lade sig gøre, fordi den spalter ATP, og derfor er det aktiv transport. Resultatet er den forskel i ladning og koncentration over membranen, som nervecellerne bruger til at sende signaler.',

  byg(ctx){
    naStof = ctx.tilstand.stof.na;
    kStof  = ctx.tilstand.stof.k;

    pumpe = ctx.membran.findProtein('pumpe');
    pumpeX = pumpe.objekt.position.x;
    pumpeZ = pumpe.objekt.position.z;

    gruppe = new THREE.Group();
    ctx.membran.gruppe.add(gruppe);

    for(const [id, R] of [['na', KUGLER.na], ['k', KUGLER.k]]){
      const M = findMolekyle(id);
      const kerneMat = new THREE.MeshStandardMaterial({
        color:M.farve, roughness:0.26, metalness:0.10,
        emissive:M.farve, emissiveIntensity:0.32});
      const kappeMat = new THREE.MeshStandardMaterial({
        color:0x9FD8F5, roughness:0.10, metalness:0.00,
        transparent:true, opacity:0.20, depthWrite:false});
      const n = id === 'na' ? 3 : 2;

      const kerne = new THREE.InstancedMesh(new THREE.SphereGeometry(R.kerne, 10, 8), kerneMat, n);
      const kappe = new THREE.InstancedMesh(new THREE.SphereGeometry(R.kappe, 10, 8), kappeMat, n);
      kerne.frustumCulled = kappe.frustumCulled = false;
      kappe.renderOrder = 2;

      const g = new THREE.Group();
      g.userData.delId = `stof:${id}`;
      g.add(kerne, kappe);
      gruppe.add(g);
      ctx.membran.tilfoejDel(`stof:${id}`, [kappeMat]);
      materialer.push(kerneMat, kappeMat);
      if(id === 'na'){ naKerne = kerne; naKappe = kappe; }
      else            { kKerne = kerne; kKappe = kappe; }
    }

    /* ATP'et — en lille gul klump, der vokser frem, når det binder,
       og forsvinder i det øjeblik, pumpen bruger det. */
    const atpMat = new THREE.MeshStandardMaterial({
      color:0xFFE066, roughness:0.3, metalness:0.05,
      emissive:0xFFB300, emissiveIntensity:0.35});
    atpKugle = new THREE.Mesh(new THREE.SphereGeometry(0.30, 12, 9), atpMat);
    atpKugle.userData.delId = 'pumpe';   // en del af pumpens egen udpegning
    gruppe.add(atpKugle);
    ctx.membran.tilfoejDel('pumpe', [atpMat]);
    materialer.push(atpMat);

    fase = NA_UD; u = 0; nyFase = true; atpAlder = 0;
    tegn();
  },

  opdater(t, dt, ctx){
    pumpeX = pumpe.objekt.position.x;
    pumpeZ = pumpe.objekt.position.z;
    /* Et lille pust i pumpens egen skala markerer formskiftet, uden
       at pumpen behøver at kende til, at der findes transport. */
    const flex = (fase === VEND1 || fase === VEND2)
      ? 1 + 0.05 * Math.sin(Math.min(1, u / (fase === VEND1 ? T_VEND1 : T_VEND2)) * Math.PI)
      : 1;
    pumpe.objekt.scale.setScalar(flex);

    /* Den usynlige natriumsivning — se hoved-kommentaren. Uafhængig
       af pumpens egen fase; den går, hele tiden, lidt den anden vej. */
    if(dt > 0){
      const sivning = NA_SIVNING * (naStof.ude - naStof.inde) * dt;
      naStof.inde += sivning;
      naStof.ude  -= sivning;
    }

    if(dt > 0){
      /* Mætningen sætter farten på hele cyklussen, ikke kun hvor tit
         den starter forfra — så billedet og aflaes() regner på
         nøjagtig samme tal. Slipper naStof.inde op, går pumpen i
         slowmotion og går i stå, den forsvinder ikke bare fra
         instrumenterne. */
      const sat = (naStof.inde / (KM_NA + naStof.inde)) * (kStof.ude / (KM_K + kStof.ude));
      const du = dt * sat;
      u += du;

      if(fase === NA_UD){
        const k = blødt(Math.min(1, u / T_UD));
        for(let i = 0; i < 3; i++){
          const [ox, oz] = spredt(i, 3, DOCK * 0.5);
          naX[i] = pumpeX + ox * k; naZ[i] = pumpeZ + oz * k;
          naY[i] = -(OVER + 0.3) + k * (2 * (OVER + 0.3));   // fra inde til ude
        }
        atpAlder = Math.min(1, u / T_UD);
        if(u >= T_UD){ u = 0; fase = VEND1; nyFase = true; }

      } else if(fase === VEND1){
        /* Ionerne er sluppet — natrium tælles med udenfor nu. Kun i
           det allerførste billede i denne fase: går pumpen i stå her
           (mætningen ramte 0 midt i et faseskift), skal det ikke
           gentages billede efter billede. */
        if(nyFase){
          /* Aldrig mere, end der rent faktisk er at flytte — ellers
             opstår natrium ud af ingenting, når inde nærmer sig 0. */
          const flyt = Math.min(ENHED_NA * 3, naStof.inde);
          naStof.inde -= flyt;
          naStof.ude  += flyt;
          nyFase = false;
        }
        atpAlder = Math.max(0, 1 - u / T_VEND1);
        if(u >= T_VEND1){ u = 0; fase = K_IND; nyFase = true; }

      } else if(fase === K_IND){
        const k = blødt(Math.min(1, u / T_IND));
        for(let i = 0; i < 2; i++){
          const [ox, oz] = spredt(i, 2, DOCK * 0.5);
          kX[i] = pumpeX + ox * k; kZ[i] = pumpeZ + oz * k;
          kY[i] = (OVER + 0.3) - k * (2 * (OVER + 0.3));   // fra ude til inde
        }
        if(u >= T_IND){ u = 0; fase = VEND2; nyFase = true; }

      } else if(fase === VEND2){
        if(nyFase){
          const flyt = Math.min(ENHED_K * 2, kStof.ude);
          kStof.ude  -= flyt;
          kStof.inde += flyt;
          nyFase = false;
        }
        if(u >= T_VEND2){ u = 0; fase = NA_UD; nyFase = true; }
      }
    }

    tegn();
  },

  aflaes(){
    /* Hastigheden er Michaelis-Menten i begge substrater på én gang
       — pumpen skal have fat i både Na⁺ indeni og K⁺ udenfor for at
       fuldføre en omgang. Se hoved-kommentaren. */
    const sat = (naStof.inde / (KM_NA + naStof.inde)) * (kStof.ude / (KM_K + kStof.ude));
    const omgangeS = VMAX * sat;
    const en = (v, d) => v.toFixed(d).replace('.', ',');

    return [
      {mærkat:'Na⁺ ud af cellen', værdi:en(omgangeS * 3, 2), enhed:'ioner/s'},
      {mærkat:'K⁺ ind i cellen',  værdi:en(omgangeS * 2, 2), enhed:'ioner/s'},
      {mærkat:'ATP forbrugt',     værdi:en(omgangeS, 2),     enhed:'molekyler/s'},
    ];
  },

  ryd(ctx){
    if(!gruppe) return;
    pumpe.objekt.scale.setScalar(1);
    ctx.membran.gruppe.remove(gruppe);
    naKerne.geometry.dispose(); naKappe.geometry.dispose();
    kKerne.geometry.dispose();  kKappe.geometry.dispose();
    atpKugle.geometry.dispose();
    for(const m of materialer) m.dispose();
    materialer = [];
    gruppe = naKerne = naKappe = kKerne = kKappe = atpKugle = null;
  },
});

function skriv(kerne, kappe, n, X, Y, Z){
  for(let i = 0; i < n; i++){
    _m.setPosition(X[i], Y[i], Z[i]);
    kerne.setMatrixAt(i, _m);
    kappe.setMatrixAt(i, _m);
  }
  kerne.instanceMatrix.needsUpdate = true;
  kappe.instanceMatrix.needsUpdate = true;
}

function tegn(){
  const naVis = fase === NA_UD || fase === VEND1;
  const kVis  = fase === K_IND || fase === VEND2;

  if(naVis) skriv(naKerne, naKappe, 3, naX, naY, naZ);
  else      for(let i = 0; i < 3; i++){ naKerne.setMatrixAt(i, SKJULT); naKappe.setMatrixAt(i, SKJULT); }
  naKerne.instanceMatrix.needsUpdate = naKappe.instanceMatrix.needsUpdate = true;

  if(kVis) skriv(kKerne, kKappe, 2, kX, kY, kZ);
  else     for(let i = 0; i < 2; i++){ kKerne.setMatrixAt(i, SKJULT); kKappe.setMatrixAt(i, SKJULT); }
  kKerne.instanceMatrix.needsUpdate = kKappe.instanceMatrix.needsUpdate = true;

  const s = blødt(atpAlder);
  if(s <= 0.001){
    atpKugle.scale.setScalar(0);
  } else {
    atpKugle.scale.setScalar(s);
    atpKugle.position.set(pumpeX + 0.9, -(OVER + 2.6), pumpeZ + 0.3);
  }
}
