/* ═══════════════════════════════════════════════════════════
   Aktiv transport: Na⁺/K⁺-pumpen.

   3 Na⁺ ud, 2 K⁺ ind, 1 ATP — og begge veje går **mod**
   koncentrationsgradienten. Det er dét, der gør transporten
   aktiv, og det er dét, eleven skal kunne se: der er i forvejen
   mest natrium udenfor, og pumpen sender alligevel mere ud.

   ── Hvorfor pumpen aldrig holder op ────────────────────────
   Natrium siver hele tiden tilbage ind i cellen — gennem
   utætheder og gennem de transportproteiner, der trækker
   natrium med ind, når de henter noget andet. Den lækage er
   regnet med her (`LÆK`), for uden den ville pumpen tømme
   cellen for natrium på et kvart minut og så gå i stå.

   Sammen med kaliumkanalen ved siden af giver det den hvilende
   celles rigtige tilstand: en **ligevægt, der koster energi**.
   Kanalen lader kalium løbe ud, pumpen henter det ind igen, og
   tallene bliver stående på 4/140 og 145/12, så længe der er
   ATP. Slå **Fast koncentration** fra og træk i skyderne —
   pumpen trækker dem tilbage på plads igen. Det er præcis det,
   der sker i en nervecelle mellem to signaler.

   ── Cyklussen ──────────────────────────────────────────────
   Formen skifter mellem E1 (åben ind mod cytosolen) og E2
   (åben ud). Pumpen står aldrig åben til begge sider på én
   gang — ellers var den en kanal, og så ville ionerne bare
   løbe den forkerte vej:

     BIND_NA    3 Na⁺ fra cytosolen ind i pumpen
     ATP_BIND   ATP lægger sig i kløften ved N-domænet
     SPALT      ATP spaltes: fosfatgruppen flyver over på
                P-domænet, og dét er det, der driver formskiftet
     VEND_UD    E1 → E2, natriummet føres op
     SLIP_NA    3 Na⁺ slippes uden for cellen
     BIND_K     2 K⁺ udefra ind i pumpen
     DEFOSFO    fosfatgruppen slipper P-domænet igen
     VEND_IND   E2 → E1, kaliummet føres ned
     SLIP_K     2 K⁺ slippes inde i cellen

   Molarmængden pr. omgang fordeles jævnt ud over hele
   cyklussen i stedet for at komme i ryk ved SLIP. Så flytter
   skyderne sig blødt, og det er stadig de samme 3 : 2 pr. ATP.

   ── Ionerne omkring pumpen ─────────────────────────────────
   Pumpen tegner sine egne ioner i en cirkel omkring sig selv,
   og kanalen sine i en cirkel omkring sin. De deler
   koncentrationen i `tilstand`, ikke kuglerne — så slipper de
   to moduler for at sende ioner frem og tilbage mellem sig, og
   en ny mekanisme er stadig én ny fil.
   ═══════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import {registrer}             from './transport.js';
import {MÅL}                   from './struktur.js';
import {find as findMolekyle}  from './molekyler.js';

/* ── Cyklussens trin og deres varighed i sekunder ──────── */
const TRIN = [
  ['BIND_NA',  0.75],
  ['ATP_BIND', 0.45],
  ['SPALT',    0.30],
  ['VEND_UD',  0.70],
  ['SLIP_NA',  0.45],
  ['BIND_K',   0.65],
  ['DEFOSFO',  0.25],
  ['VEND_IND', 0.70],
  ['SLIP_K',   0.45],
];
const VARIGHED = Object.fromEntries(TRIN);
const T_CYKLUS = TRIN.reduce((s, [, v]) => s + v, 0);   // 4,70 s

/* ── Modellens tal ─────────────────────────────────────── *
 * DELTA er, hvor meget koncentrationen flytter sig pr. ion i et
 * lukket system. Tallet er sat, så pumpen netop kan holde stand
 * mod kaliumkanalens udsivning ved 4/140 — det er dér, en
 * hvilende celle ligger, og så bliver hvilen noget, man kan se
 * blive holdt ved lige, ikke noget der bare står stille.       */
const DELTA = 16.5;                        // mmol/L pr. ion
const NA_PR = 3, K_PR = 2;                 // ioner pr. omgang
const RATE_NA = NA_PR * DELTA / T_CYKLUS;  // mmol/L pr. sekund ud
const RATE_K  = K_PR  * DELTA / T_CYKLUS;  // mmol/L pr. sekund ind

/* Natriumlækagen ind i cellen. Sat, så den netop opvejer pumpen
   ved 145/12 — ellers ville cellen blive tømt for natrium. */
const LÆK = RATE_NA / (145 - 12);          // pr. sekund pr. mmol/L

/* Pumpen kan ikke arbejde med tomme hænder. Grænserne er sat lavt:
   kalium uden for cellen er et lille tal, der holdes på plads af to
   store modsatrettede strømme, så det svinger en del — og pumpen
   skal ikke gå i stå, hver gang det dykker. */
const NOK_NA = 3, NOK_K = 0.5;             // mmol/L, før den går i gang

const TEGN  = 0.9;    // tegnede ioner på en side = TEGN·√c
const MAKS  = 11;     // … men aldrig flere end så mange pr. side
const N_ION = 26;     // plads i hvert instansmesh

const VAND  = 6.0;    // nm vand tegnet på hver side
const FART  = 2.6;    // nm/s
const LIV   = 3.2;    // 1/s — ioner tones ind og ud
const REVIR = 4.2;    // nm — ionerne holder sig i en cirkel om pumpen
const FRIRUM = 2.4;   // nm — helst ikke oven i selve pumpen

const OVER = MÅL.tykkelse / 2 + MÅL.hoved * 0.85;
const MUND = OVER + 0.70;      // hvor ionerne går ind og ud af pumpen

/* Kerne og vandkappe i nm — samme mål som ved kanalen, så en
   natriumion ser ens ud, uanset hvilket protein den er ved. */
const KUGLER = {
  k: {kerne:0.18, kappe:0.33},
  na:{kerne:0.14, kappe:0.38},
};

/* Formskiftets udslag. */
const SVING = 0.16, TVIST = 0.13, KLØFT = 0.55, A_DREJ = 0.42;

/* ── Faser for én ion ──────────────────────────────────── *
 * PAA_VEJ dækker hele turen inde i pumpen: ionen føres af
 * cyklussen og skal ikke røres af den almindelige vandring.   */
const VANDRER = 0, PAA_VEJ = 1, UD = 2;

/* ── Ionerne ───────────────────────────────────────────── */
function pulje(n){
  return {
    n,
    px:new Float32Array(n),   py:new Float32Array(n),   pz:new Float32Array(n),
    vx:new Float32Array(n),   vy:new Float32Array(n),   vz:new Float32Array(n),
    fraX:new Float32Array(n), fraY:new Float32Array(n), fraZ:new Float32Array(n),
    tilX:new Float32Array(n), tilY:new Float32Array(n), tilZ:new Float32Array(n),
    off:new Float32Array(n * 2),
    side:new Int8Array(n),    fase:new Uint8Array(n),   u:new Float32Array(n),
    aktiv:new Uint8Array(n),  doer:new Uint8Array(n),   liv:new Float32Array(n),
    kerne:null, kappe:null,
  };
}

const NA = pulje(N_ION);
const K  = pulje(N_ION);

let koncNa = null, koncK = null, loftNa = 0, loftK = 0;

let gruppeNa = null, gruppeK = null, atpGruppe = null;
let materialer = [];
let pumpe = null;                  // proteinet
let stave = [], domæner = {};      // pumpens dele, som formskiftet flytter
let atpDele = null;                // {krop:[], fosfat}
let atpSted = null, pSted = null;
let midtX = 0, midtZ = 0, pumpX = 0, pumpZ = 0;

/* Pumpens egen tilstand. */
let trin = 'BIND_NA', ur = 0, form = -1, fosfo = 0, kløft = 0;
let atpTal = 0, kører = false;
let holdt = [];                    // ionerne, pumpen har fat i lige nu

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _akse = new THREE.Vector3();
const SKJULT = new THREE.Matrix4().makeScale(0, 0, 0);

/* ── Små hjælpere ──────────────────────────────────────── */
const mellem = (a, b) => a + Math.random() * (b - a);
const blødt  = u => u * u * (3 - 2 * u);
const målAntal = c => Math.max(0, Math.min(MAKS, Math.round(TEGN * Math.sqrt(Math.max(0, c)))));

function nyFart(P, i){
  const a = Math.random() * Math.PI * 2, h = mellem(-1, 1);
  const c = Math.sqrt(1 - h * h);
  P.vx[i] = Math.cos(a) * c * FART; P.vy[i] = h * FART; P.vz[i] = Math.sin(a) * c * FART;
}

function saetUd(P, i, s){
  let x = 0, z = 0;
  for(let forsøg = 0; forsøg < 8; forsøg++){
    const a = Math.random() * Math.PI * 2;
    const r = REVIR * Math.sqrt(Math.random());
    x = midtX + Math.cos(a) * r; z = midtZ + Math.sin(a) * r;
    if(Math.hypot(x - pumpX, z - pumpZ) > FRIRUM) break;
  }
  P.px[i] = x; P.pz[i] = z;
  P.py[i] = s * mellem(OVER + 0.6, OVER + VAND);
  nyFart(P, i);
  P.side[i] = s; P.fase[i] = VANDRER; P.u[i] = 0;
}

function tælSide(P, s){
  let n = 0;
  for(let i = 0; i < P.n; i++) if(P.aktiv[i] && !P.doer[i] && P.side[i] === s) n++;
  return n;
}

function slukEt(P, s){
  let bedst = -1, længst = -1;
  for(let i = 0; i < P.n; i++){
    if(!P.aktiv[i] || P.doer[i] || P.side[i] !== s || P.fase[i] !== VANDRER) continue;
    const d = Math.hypot(P.px[i] - pumpX, P.pz[i] - pumpZ) + Math.abs(P.py[i]);
    if(d > længst){ længst = d; bedst = i; }
  }
  if(bedst < 0) return false;
  P.doer[bedst] = 1;
  return true;
}

function tændEt(P, s){
  for(let i = 0; i < P.n; i++){
    if(P.aktiv[i]) continue;
    saetUd(P, i, s);
    P.aktiv[i] = 1; P.doer[i] = 0; P.liv[i] = 0;
    return true;
  }
  return false;
}

function justér(P, s, ønsket, straks){
  let t = straks ? P.n : 1;
  let n = tælSide(P, s);
  while(n > ønsket && t-- > 0 && slukEt(P, s)) n--;
  while(n < ønsket && t-- > 0 && tændEt(P, s)) n++;
}

function nærmeste(P, s){
  let bedst = -1, kortest = Infinity;
  for(let i = 0; i < P.n; i++){
    if(!P.aktiv[i] || P.doer[i] || P.fase[i] !== VANDRER || P.side[i] !== s) continue;
    const d = (P.px[i] - pumpX) ** 2 + (P.pz[i] - pumpZ) ** 2
            + (Math.abs(P.py[i]) - MUND) ** 2;
    if(d < kortest){ kortest = d; bedst = i; }
  }
  return bedst;
}

/** Tag fat i indtil `antal` ioner fra siden `s` og før dem ind i
    pumpen. Hver får sin egen lille plads, så de ikke ligger oven
    i hinanden inde i proteinet. */
function grib(P, s, antal){
  holdt = [];
  for(let k = 0; k < antal; k++){
    const i = nærmeste(P, s);
    if(i < 0) break;
    const a = k / antal * Math.PI * 2;
    P.off[i * 2]     = Math.cos(a) * 0.24;
    P.off[i * 2 + 1] = Math.sin(a) * 0.24;
    P.fraX[i] = P.px[i]; P.fraY[i] = P.py[i]; P.fraZ[i] = P.pz[i];
    P.fase[i] = PAA_VEJ; P.u[i] = 0;
    holdt.push({P, i, k});
  }
  return holdt.length;
}

/** Slip dem fri igen på siden `s`. */
function slip(s){
  for(const H of holdt){
    const {P, i} = H;
    P.side[i] = s;
    P.fraX[i] = P.px[i]; P.fraY[i] = P.py[i]; P.fraZ[i] = P.pz[i];
    const a = Math.random() * Math.PI * 2, r = mellem(1.7, 3.1);
    P.tilX[i] = pumpX + Math.cos(a) * r;
    P.tilZ[i] = pumpZ + Math.sin(a) * r;
    P.tilY[i] = s * mellem(OVER + 1.0, OVER + 2.8);
    P.fase[i] = UD; P.u[i] = 0;
  }
}

function vandr(P, i, dt, drej){
  P.vx[i] += ((Math.random() * 2 - 1) * FART - P.vx[i]) * drej;
  P.vy[i] += ((Math.random() * 2 - 1) * FART - P.vy[i]) * drej;
  P.vz[i] += ((Math.random() * 2 - 1) * FART - P.vz[i]) * drej;
  const f = FART / (Math.hypot(P.vx[i], P.vy[i], P.vz[i]) || 1);
  P.vx[i] *= f; P.vy[i] *= f; P.vz[i] *= f;

  P.px[i] += P.vx[i] * dt; P.py[i] += P.vy[i] * dt; P.pz[i] += P.vz[i] * dt;

  const dx = P.px[i] - midtX, dz = P.pz[i] - midtZ;
  const d = Math.hypot(dx, dz);
  if(d > REVIR){
    const nx = dx / d, nz = dz / d;
    P.px[i] = midtX + nx * REVIR; P.pz[i] = midtZ + nz * REVIR;
    const ind = P.vx[i] * nx + P.vz[i] * nz;
    if(ind > 0){ P.vx[i] -= 2 * ind * nx; P.vz[i] -= 2 * ind * nz; }
  }

  const s = P.side[i];
  const nær = s * (OVER + 0.5), fjern = s * (OVER + VAND);
  if(s * P.py[i] < s * nær)  { P.py[i] = nær;   P.vy[i] =  s * Math.abs(P.vy[i]); }
  if(s * P.py[i] > s * fjern){ P.py[i] = fjern; P.vy[i] = -s * Math.abs(P.vy[i]); }
}

/** Ionerne, pumpen har fat i, sidder på deres plads inde i den. */
function førHoldte(y){
  for(const H of holdt){
    const {P, i} = H;
    P.px[i] = pumpX + P.off[i * 2];
    P.pz[i] = pumpZ + P.off[i * 2 + 1];
    P.py[i] = y;
  }
}

/* ── Pumpens form ──────────────────────────────────────── *
 * `form` går fra −1 (E1, åben ind mod cytosolen) til +1 (E2,
 * åben ud). Stavene i bundtet vippes om ringens tangent oven i
 * den hældning, struktur.js allerede gav dem — så beholder
 * pumpen sin egen skæve facon. `kløft` lukker N-domænet ind mod
 * P om ATP'et, og A-domænet drejer med formskiftet: det er
 * netop dét, A-domænet gør i virkeligheden.                   */
function sætForm(){
  for(const S of stave){
    _akse.set(-Math.sin(S.vinkel), 0, Math.cos(S.vinkel));
    _q.setFromAxisAngle(_akse, form * SVING);
    S.mesh.quaternion.multiplyQuaternions(_q, S.grundQ);
    const a = S.vinkel + form * TVIST;
    S.mesh.position.set(Math.cos(a) * S.radius, S.y, Math.sin(a) * S.radius);
  }
  if(domæner.N){
    domæner.N.position.lerpVectors(domæner.N.userData.grund, pSted, kløft * KLØFT / 2);
  }
  if(domæner.A){
    domæner.A.rotation.y = domæner.A.userData.grundDrej + form * A_DREJ;
  }
}

/* ── ATP-molekylet ─────────────────────────────────────── *
 * Adenosin som én kugle og tre fosfatgrupper på række. Den
 * yderste er den, der flyver over på P-domænet, når ATP'et
 * spaltes — resten er ADP og toner ud. Molekylet hænger i
 * pumpens egen gruppe, så det følger med, når proteinet driver
 * rundt og drejer.                                            */
function byggATP(materiale, fosfatMat){
  const g = new THREE.Group();
  g.userData.delId = 'stof:atp';

  const krop = [];
  const adenosin = new THREE.Mesh(new THREE.SphereGeometry(0.30, 10, 8), materiale);
  adenosin.position.set(-0.42, 0, 0);
  g.add(adenosin); krop.push(adenosin);

  const fGeo = new THREE.SphereGeometry(0.17, 9, 7);
  for(let j = 0; j < 2; j++){
    const m = new THREE.Mesh(fGeo, fosfatMat);
    m.position.set(-0.05 + j * 0.30, 0, 0);
    g.add(m); krop.push(m);
  }
  /* γ-fosfatgruppen: den, der bliver hængende på P-domænet. */
  const fosfat = new THREE.Mesh(fGeo, fosfatMat);
  fosfat.position.set(0.55, 0, 0);
  g.add(fosfat);

  return {gruppe:g, krop, fosfat};
}

/** Hvor synligt er ATP'et? 0 = væk, 1 = fremme. */
function visATP(krop, fosfat){
  for(const m of atpDele.krop) m.scale.setScalar(Math.max(1e-3, krop));
  atpDele.fosfat.scale.setScalar(Math.max(1e-3, fosfat));
  atpGruppe.visible = krop > 0.01 || fosfat > 0.01;
}

/** Fosfatgruppen på vej fra ATP'et over på P-domænet. */
function førFosfat(k){
  atpDele.fosfat.position.set(
    0.55 + (pSted.x - atpSted.x - 0.55) * k,
    (pSted.y - atpSted.y) * k,
    (pSted.z - atpSted.z) * k);
}

/* ═══════════════════════════════════════════════════════════ */
export default registrer({
  id:'pumpe',
  navn:'Na⁺/K⁺-pumpen',
  slags:'aktiv',
  energi:'1 ATP pr. omgang',
  protein:'pumpe',
  molekyler:['na','k','atp'],
  beskrivelse:'Pumpen flytter 3 Na⁺ ud og 2 K⁺ ind — begge dele mod koncentrationsgradienten. Der er i forvejen mest natrium udenfor, og pumpen sender alligevel mere ud; det kan kun lade sig gøre, fordi den spalter ATP, og derfor er det aktiv transport. Se fosfatgruppen flyve over på P-domænet: det er dér, energien går hen, og det er den, der vender pumpen. Natrium siver hele tiden tilbage ind, og kalium siver ud gennem kanalen ved siden af — så pumpen holder aldrig op. Slå Fast koncentration fra og træk i skyderne: pumpen trækker dem på plads igen.',

  byg(ctx){
    koncNa = ctx.tilstand.na; koncK = ctx.tilstand.k;
    loftNa = findMolekyle('na').gradient.maks;
    loftK  = findMolekyle('k').gradient.maks;

    pumpe = ctx.membran.findProtein('pumpe');
    midtX = pumpX = pumpe.x; midtZ = pumpZ = pumpe.z;
    atpSted = pumpe.objekt.userData.atpSted;
    pSted   = pumpe.objekt.userData.pSted;

    /* Pumpens dele: stavene gennem membranen og de tre domæner
       nede i cytosolen. struktur.js har mærket dem, så den ikke
       selv behøver vide, at der findes transport. */
    stave = []; domæner = {};
    pumpe.objekt.traverse(o => {
      if(o.userData.pumpeStav !== undefined){
        stave.push({
          mesh:o, vinkel:o.userData.pumpeStav, y:o.position.y,
          radius:Math.hypot(o.position.x, o.position.z),
          grundQ:o.quaternion.clone(),
        });
      }
      if(o.userData.pumpeDomæne){
        o.userData.grund = o.position.clone();
        o.userData.grundDrej = o.rotation.y;
        domæner[o.userData.pumpeDomæne] = o;
      }
    });

    /* ── Ionerne ─────────────────────────────────────── */
    for(const [id, P] of [['na', NA], ['k', K]]){
      const M = findMolekyle(id), R = KUGLER[id];
      const kerneMat = new THREE.MeshStandardMaterial({
        color:M.farve, roughness:0.26, metalness:0.10,
        emissive:M.farve, emissiveIntensity:0.32});
      const kappeMat = new THREE.MeshStandardMaterial({
        color:0x9FD8F5, roughness:0.10, metalness:0.00,
        transparent:true, opacity:0.20, depthWrite:false});

      P.kerne = new THREE.InstancedMesh(new THREE.SphereGeometry(R.kerne, 10, 8), kerneMat, P.n);
      P.kappe = new THREE.InstancedMesh(new THREE.SphereGeometry(R.kappe, 10, 8), kappeMat, P.n);
      P.kerne.frustumCulled = P.kappe.frustumCulled = false;
      P.kappe.renderOrder = 2;

      const g = new THREE.Group();
      g.userData.delId = `stof:${id}`;
      g.add(P.kerne, P.kappe);
      ctx.membran.gruppe.add(g);
      materialer.push(kerneMat, kappeMat);
      if(id === 'na') gruppeNa = g; else gruppeK = g;
    }

    /* ── ATP ─────────────────────────────────────────── *
     * Egne farver: energien skal ikke kunne forveksles med de
     * ioner, den flytter. Begge lyser svagt af sig selv, så de
     * kan ses mod de mørke domæner.                          */
    const atpMat = new THREE.MeshStandardMaterial({
      color:0xEAF0FF, roughness:0.24, metalness:0.08,
      emissive:0xEAF0FF, emissiveIntensity:0.22});
    const fosfatMat = new THREE.MeshStandardMaterial({
      color:0xFFD166, roughness:0.20, metalness:0.10,
      emissive:0xFFD166, emissiveIntensity:0.45});
    atpDele = byggATP(atpMat, fosfatMat);
    atpGruppe = atpDele.gruppe;
    atpGruppe.position.copy(atpSted);
    pumpe.objekt.add(atpGruppe);
    ctx.membran.tilfoejDel('stof:atp', [atpMat, fosfatMat]);
    materialer.push(atpMat, fosfatMat);

    for(let i = 0; i < N_ION; i++){
      saetUd(NA, i, i % 2 ? 1 : -1); NA.aktiv[i] = 0;
      saetUd(K,  i, i % 2 ? 1 : -1); K.aktiv[i]  = 0;
    }
    justér(NA,  1, målAntal(koncNa.ude),  true);
    justér(NA, -1, målAntal(koncNa.inde), true);
    justér(K,   1, målAntal(koncK.ude),   true);
    justér(K,  -1, målAntal(koncK.inde),  true);
    for(const P of [NA, K]) for(let i = 0; i < P.n; i++) if(P.aktiv[i]) P.liv[i] = 1;

    trin = 'BIND_NA'; ur = 0; form = -1; fosfo = 0; kløft = 0;
    atpTal = 0; kører = false; holdt = [];
    sætForm();
    visATP(0, 0);
    tegn(NA); tegn(K);
  },

  opdater(t, dt, ctx){
    const fast = ctx.tilstand.fast;
    pumpX = pumpe.objekt.position.x;
    pumpZ = pumpe.objekt.position.z;

    if(dt > 0){
      /* ── Har pumpen noget at arbejde med? ──────────── *
       * Er cellen tømt for natrium, eller er der intet kalium
       * udenfor, står pumpen stille i E1 og venter. Det er ikke
       * pynt: uden natrium indeni er der ikke noget at pumpe ud,
       * og så koster den heller ikke ATP.                      */
      kører = koncNa.inde >= NOK_NA && koncK.ude >= NOK_K;

      if(kører){
        ur += dt;
        const længde = VARIGHED[trin];
        const u = Math.min(1, ur / længde), k = blødt(u);

        switch(trin){

          case 'BIND_NA':
            if(ur <= dt) grib(NA, -1, NA_PR);
            for(const H of holdt){
              const {P, i} = H;
              P.px[i] = P.fraX[i] + (pumpX + P.off[i * 2]     - P.fraX[i]) * k;
              P.pz[i] = P.fraZ[i] + (pumpZ + P.off[i * 2 + 1] - P.fraZ[i]) * k;
              P.py[i] = P.fraY[i] + (-MUND * 0.55 - P.fraY[i]) * k;
            }
            break;

          /* ATP toner frem i kløften, og N-domænet lukker sig om det. */
          case 'ATP_BIND':
            visATP(k, k);
            førFosfat(0);
            kløft = k;
            førHoldte(-MUND * 0.55);
            break;

          /* Spaltningen. Fosfatgruppen flyver over på P-domænet,
             og ADP'en toner ud — energien er nu i proteinet. */
          case 'SPALT':
            visATP(1 - k, 1);
            førFosfat(k);
            fosfo = k;
            if(ur <= dt) atpTal++;
            førHoldte(-MUND * 0.55);
            break;

          case 'VEND_UD':
            form = -1 + 2 * k;
            visATP(0, 1);
            kløft = 1 - k;
            førHoldte(-MUND * 0.55 + k * (MUND * 1.10));
            break;

          case 'SLIP_NA':
            if(ur <= dt) slip(1);
            break;

          case 'BIND_K':
            if(ur <= dt) grib(K, 1, K_PR);
            for(const H of holdt){
              const {P, i} = H;
              P.px[i] = P.fraX[i] + (pumpX + P.off[i * 2]     - P.fraX[i]) * k;
              P.pz[i] = P.fraZ[i] + (pumpZ + P.off[i * 2 + 1] - P.fraZ[i]) * k;
              P.py[i] = P.fraY[i] + (MUND * 0.55 - P.fraY[i]) * k;
            }
            break;

          /* Fosfatgruppen slipper igen — og så kan pumpen vende hjem. */
          case 'DEFOSFO':
            visATP(0, 1 - k);
            fosfo = 1 - k;
            førHoldte(MUND * 0.55);
            break;

          case 'VEND_IND':
            form = 1 - 2 * k;
            visATP(0, 0);
            førHoldte(MUND * 0.55 - k * (MUND * 1.10));
            break;

          case 'SLIP_K':
            if(ur <= dt) slip(-1);
            break;
        }

        if(ur >= længde){
          const nu = TRIN.findIndex(([navn]) => navn === trin);
          trin = TRIN[(nu + 1) % TRIN.length][0];
          ur = 0;
        }

        /* ── Koncentrationerne ───────────────────────── *
         * Molarmængden pr. omgang fordeles jævnt ud over hele
         * cyklussen, så skyderne flytter sig blødt i stedet for
         * i ryk. Det er stadig 3 Na⁺ ud og 2 K⁺ ind pr. ATP.  */
        if(!fast){
          flyt(koncNa, 'inde', 'ude',  RATE_NA * dt, loftNa);
          flyt(koncK,  'ude',  'inde', RATE_K  * dt, loftK);
        }
      } else {
        /* Står pumpen stille, falder den tilbage i E1 og slipper
           det, den havde fat i — så kan man se, at den er gået i stå. */
        form  += (-1 - form) * Math.min(1, dt * 3);
        kløft += (0 - kløft) * Math.min(1, dt * 3);
        fosfo += (0 - fosfo) * Math.min(1, dt * 3);
        visATP(0, fosfo);
        if(holdt.length){ slip(form < -0.5 ? -1 : 1); }
        trin = 'BIND_NA'; ur = 0;
      }

      sætForm();

      /* ── Natriumlækagen ──────────────────────────────── *
       * Den vej natrium hele tiden siver tilbage ind i cellen.
       * Uden den ville pumpen tømme cellen for natrium og gå i
       * stå — og så ville hele siden vise noget forkert.       */
      if(!fast){
        /* Lækagen er diffusion og følger derfor gradienten — også
           hvis eleven har vendt den om med skyderne. */
        const læk = LÆK * (koncNa.ude - koncNa.inde) * dt;
        if(læk >= 0) flyt(koncNa, 'ude', 'inde',  læk, loftNa);
        else         flyt(koncNa, 'inde', 'ude', -læk, loftNa);
      }

      /* ── Ionerne ─────────────────────────────────────── */
      const drej = Math.min(1, dt * 4.5);
      for(const P of [NA, K]){
        for(let i = 0; i < P.n; i++){
          if(!P.aktiv[i]) continue;
          if(P.fase[i] === VANDRER) vandr(P, i, dt, drej);
          else if(P.fase[i] === UD){
            P.u[i] += dt;
            const k = blødt(Math.min(1, P.u[i] / 0.35));
            P.px[i] = P.fraX[i] + (P.tilX[i] - P.fraX[i]) * k;
            P.py[i] = P.fraY[i] + (P.tilY[i] - P.fraY[i]) * k;
            P.pz[i] = P.fraZ[i] + (P.tilZ[i] - P.fraZ[i]) * k;
            if(P.u[i] >= 0.35){ P.fase[i] = VANDRER; nyFart(P, i); }
          }
          P.liv[i] += (P.doer[i] ? -LIV : LIV) * dt;
          if(P.liv[i] >= 1) P.liv[i] = 1;
          if(P.liv[i] <= 0 && P.doer[i]){ P.liv[i] = 0; P.aktiv[i] = 0; P.doer[i] = 0; }
        }
      }
    }

    justér(NA,  1, målAntal(koncNa.ude),  false);
    justér(NA, -1, målAntal(koncNa.inde), false);
    justér(K,   1, målAntal(koncK.ude),   false);
    justér(K,  -1, målAntal(koncK.inde),  false);

    tegn(NA); tegn(K);
  },

  aflaes(){
    return [
      kører
        ? {mærkat:'Na⁺ ud · pumpen', værdi:(NA_PR / T_CYKLUS).toFixed(1).replace('.', ','),
           enhed:'ioner/s mod gradienten'}
        : {mærkat:'Na⁺ ud · pumpen', værdi:'0', enhed:'pumpen står stille'},
      {mærkat:'ATP brugt', værdi:atpTal, enhed:'stk'},
    ];
  },

  ryd(ctx){
    if(!gruppeNa) return;
    form = -1; kløft = 0; sætForm();
    if(atpGruppe) pumpe.objekt.remove(atpGruppe);
    for(const g of [gruppeNa, gruppeK]) ctx.membran.gruppe.remove(g);
    for(const P of [NA, K]){ P.kerne.geometry.dispose(); P.kappe.geometry.dispose(); }
    for(const m of materialer) m.dispose();
    materialer = []; stave = []; domæner = {}; holdt = [];
    gruppeNa = gruppeK = atpGruppe = null;
  },
});

/** Flyt `mængde` mmol/L fra den ene side til den anden — aldrig
    mere, end der er, og aldrig mere, end der er plads til, så de
    to sider tilsammen holder regnskabet. */
function flyt(konc, fra, til, mængde, loft){
  const kan = Math.min(mængde, konc[fra], loft - konc[til]);
  if(kan <= 0) return;
  konc[fra] -= kan;
  konc[til] += kan;
}

/** Skriver ionernes plads over i instansmatricerne. */
function tegn(P){
  for(let i = 0; i < P.n; i++){
    if(!P.aktiv[i]){
      P.kerne.setMatrixAt(i, SKJULT);
      P.kappe.setMatrixAt(i, SKJULT);
      continue;
    }
    const s = blødt(P.liv[i]);
    _m.makeScale(s, s, s);
    _m.setPosition(P.px[i], P.py[i], P.pz[i]);
    P.kerne.setMatrixAt(i, _m);
    P.kappe.setMatrixAt(i, _m);
  }
  P.kerne.instanceMatrix.needsUpdate = true;
  P.kappe.instanceMatrix.needsUpdate = true;
}
