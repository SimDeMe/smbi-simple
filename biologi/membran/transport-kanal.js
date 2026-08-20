/* ═══════════════════════════════════════════════════════════
   Faciliteret diffusion gennem en kaliumkanal.

   Pointen, eleven skal kunne se, er tre ting på én gang:

     passiv   Kanalen bruger ingen energi. Ionerne falder ned ad
              deres egen gradient, og strømmen den ene vej er
              simpelthen proportional med, hvor mange ioner der
              er på den side — præcis som ved simpel diffusion.
              Nettostrømmen kan derfor aldrig vende mod
              gradienten, og den standser af sig selv, når
              forskellen er væk.
     hurtig   En ion er gennem poren på et øjeblik, hvor et
              iltmolekyle bruger næsten et sekund på at ose
              gennem halelaget. Der står kø ved mundingen.
     selektiv Natrium bliver vist bort. Ionen er mindre end
              kalium — men den holder fastere på sin vandkappe,
              og med kappen på er den for stor til filteret.
              Derfor tegnes begge ioner med kappe: den blå
              kugle om natrium er den største af de to.

   Kanalen åbner og lukker af sig selv. Det er ikke pynt: en
   kanal står ikke åben hele tiden, og mens den er lukket, går
   der ingen ioner igennem — heller ikke med gradienten.

   ── Kaliums egen gradient ──────────────────────────────────
   Modulet har sine egne koncentrationer og rører ikke sidens
   iltskydere. En hvilende celle har ca. 140 mmol/L kalium
   indeni og 4 udenfor, og de tal kan ikke presses ned i
   iltskydernes 0-0,30 mmol/L. Delte man dem, ville kaliummet
   desuden løbe *ind* i cellen, så snart der er mest ilt
   udenfor — stik imod virkeligheden og imod pumpen i trin 9.
   Knappen **Fast koncentration** gælder til gengæld også her:
   slås den fra, er systemet lukket, og kaliumgradienten
   udlignes af sig selv. Trin 10 løfter `konc` op i `tilstand`
   og giver den sine egne skydere.

   De tegnede ioner er et udsnit — der er ikke plads til 140
   mmol/L på skærmen. Antallet følger √c, så forskellen kan ses
   uden at inderside n bliver et tæppe, og chancen for at krydse
   regnes derfor ud fra koncentrationen, ikke ud fra hvor mange
   kugler der tilfældigvis er tegnet.
   ═══════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import {registrer}             from './transport.js';
import {MÅL}                   from './struktur.js';
import {find as findMolekyle}  from './molekyler.js';

/* ── Modellens tal ─────────────────────────────────────── */
const K_START  = {ude:4, inde:140};   // mmol/L — kalium i en hvilende celle
const NA_ANTAL = {ude:12, inde:4};    // tegnede natriumioner

const RATE  = 0.06;   // krydsninger pr. sekund pr. mmol/L på siden
const DELTA = 1.2;    // mmol/L, ét ions bidrag, når systemet er lukket
const TEGN  = 2.4;    // tegnede ioner på en side = TEGN·√c
const N_K   = 46;     // plads i instansmeshet
const N_NA  = NA_ANTAL.ude + NA_ANTAL.inde;

/* Låget: hvor længe kanalen står åben og lukket ad gangen. */
const ÅBEN = [0.9, 2.2], LUKKET = [0.35, 0.95];
const midt = ([a, b]) => (a + b) / 2;
const ÅBENDEL = midt(ÅBEN) / (midt(ÅBEN) + midt(LUKKET));

const ÅBEN_R = 0.90, LUKKET_R = 0.46, DREJ = 0.42;   // lågets bevægelse

/* Tider i sekunder for én tur gennem kanalen — og for en
   natriumion, der skal helt hen til filteret for at blive afvist. */
const T_IND = 0.28, T_PORE = 0.16, T_UD = 0.18;
const T_HOLD = 0.12, T_TILBAGE = 0.32;
const AFVIS_RATE = 0.8;               // afviste natriumioner pr. sekund

const VAND = 6.0;    // nm vand tegnet på hver side
const FART = 2.6;    // nm/s — ionerne er tungere end ilt og går lidt langsommere
const LIV  = 3.2;    // 1/s — ioner tones ind og ud i stedet for at blinke

const OVER = MÅL.tykkelse / 2 + MÅL.hoved * 0.85;   // membranens overflade
const KANT = MÅL.bredde / 2 - 0.6;
const MUND = OVER + 0.62;                           // porens munding

/* Kerne og vandkappe i nm. Natrium har den mindste kerne og den
   største kappe — hele forklaringen på, hvorfor den bliver afvist
   af en kanal, kalium slipper igennem. Kernerne er tegnet lidt
   større end virkeligheden (Na⁺ 0,10 og K⁺ 0,14 nm), ellers
   forsvinder de inde i kappen; forholdet mellem dem er beholdt. */
const KUGLER = {
  k: {kerne:0.18, kappe:0.33},
  na:{kerne:0.14, kappe:0.38},
};

/* ── Faser ─────────────────────────────────────────────── */
const VANDRER = 0, TIL_MUND = 1, I_POREN = 2, FRA_MUND = 3,
      AFVIS_IND = 4, AFVIS_HOLD = 5, AFVIS_UD = 6;

/* ── Ionerne ───────────────────────────────────────────── */
function pulje(n){
  return {
    n,
    px:new Float32Array(n),   py:new Float32Array(n),   pz:new Float32Array(n),
    vx:new Float32Array(n),   vy:new Float32Array(n),   vz:new Float32Array(n),
    fraX:new Float32Array(n), fraY:new Float32Array(n), fraZ:new Float32Array(n),
    tilX:new Float32Array(n), tilY:new Float32Array(n), tilZ:new Float32Array(n),
    side:new Int8Array(n),    fase:new Uint8Array(n),   u:new Float32Array(n),
    aktiv:new Uint8Array(n),  doer:new Uint8Array(n),   liv:new Float32Array(n),
    kerne:null, kappe:null,
  };
}

const K  = pulje(N_K);
const NA = pulje(N_NA);

const konc = {ude:K_START.ude, inde:K_START.inde};   // mmol/L kalium
const akk  = {ude:0, inde:0};                        // opsparede krydsninger

let gruppeK = null, gruppeNa = null;
let materialer = [];
let spærret = [];
let helixer = [];                  // kanalproteinets stave — de er selve låget
let kanal = null;                  // proteinet, ionerne søger hen til
let poreX = 0, poreZ = 0;

let åben = true, gateTid = 0, lukning = 0;
let afvisAkk = 0;

const _m = new THREE.Matrix4();
const SKJULT = new THREE.Matrix4().makeScale(0, 0, 0);

/* ── Små hjælpere ──────────────────────────────────────── */
const mellem = (a, b) => a + Math.random() * (b - a);
const blødt  = u => u * u * (3 - 2 * u);
const målAntal = c => Math.max(1, Math.min(30, Math.round(TEGN * Math.sqrt(Math.max(0, c)))));

/** Et tilfældigt sted i vandet på den ene side, helst væk fra kanalen,
    så en ion ikke toner frem midt i det, man kigger på. */
function saetUd(P, i, s){
  let x = 0, z = 0;
  for(let forsøg = 0; forsøg < 6; forsøg++){
    x = mellem(-KANT, KANT); z = mellem(-KANT, KANT);
    if(Math.hypot(x - poreX, z - poreZ) > 5) break;
  }
  P.px[i] = x; P.pz[i] = z;
  P.py[i] = s * mellem(OVER + 0.5, OVER + VAND);
  nyFart(P, i);
  P.side[i] = s; P.fase[i] = VANDRER; P.u[i] = 0;
}

function nyFart(P, i){
  const a = Math.random() * Math.PI * 2, h = mellem(-1, 1);
  const c = Math.sqrt(1 - h * h);
  P.vx[i] = Math.cos(a) * c * FART; P.vy[i] = h * FART; P.vz[i] = Math.sin(a) * c * FART;
}

/** Ioner, der tæller med: tegnet, ikke på vej ud af billedet. */
function tælSide(P, s){
  let n = 0;
  for(let i = 0; i < P.n; i++) if(P.aktiv[i] && !P.doer[i] && P.side[i] === s) n++;
  return n;
}

/** Ton én ion ud — den fjerneste fra kanalen, så det ikke ses. */
function slukEt(P, s){
  let bedst = -1, længst = -1;
  for(let i = 0; i < P.n; i++){
    if(!P.aktiv[i] || P.doer[i] || P.side[i] !== s || P.fase[i] !== VANDRER) continue;
    const d = Math.hypot(P.px[i] - poreX, P.pz[i] - poreZ) + Math.abs(P.py[i]);
    if(d > længst){ længst = d; bedst = i; }
  }
  if(bedst < 0) return false;
  P.doer[bedst] = 1;
  return true;
}

/** Ton én ion ind på siden. */
function tændEt(P, s){
  for(let i = 0; i < P.n; i++){
    if(P.aktiv[i]) continue;
    saetUd(P, i, s);
    P.aktiv[i] = 1; P.doer[i] = 0; P.liv[i] = 0;
    return true;
  }
  return false;
}

/** Bring antallet på siden nærmere det, koncentrationen svarer til. */
function justér(P, s, ønsket, straks){
  let trin = straks ? P.n : 1;
  let n = tælSide(P, s);
  while(n > ønsket && trin-- > 0 && slukEt(P, s)) n--;
  while(n < ønsket && trin-- > 0 && tændEt(P, s)) n++;
}

/** Ionen, der er tættest på porens munding på den side — det er
    den, der finder vejen ind, ligesom i virkeligheden. */
function nærmeste(P, s){
  let bedst = -1, kortest = Infinity;
  for(let i = 0; i < P.n; i++){
    if(!P.aktiv[i] || P.doer[i] || P.fase[i] !== VANDRER || P.side[i] !== s) continue;
    const d = (P.px[i] - poreX) ** 2 + (P.pz[i] - poreZ) ** 2
            + (Math.abs(P.py[i]) - MUND) ** 2;
    if(d < kortest){ kortest = d; bedst = i; }
  }
  return bedst;
}

function begynd(P, i, fase){
  P.fraX[i] = P.px[i]; P.fraY[i] = P.py[i]; P.fraZ[i] = P.pz[i];
  P.fase[i] = fase; P.u[i] = 0;
}

/** En kaliumion fra siden `s` går ind i poren. */
function startKryds(s){
  const i = nærmeste(K, s);
  if(i < 0) return false;
  begynd(K, i, TIL_MUND);
  return true;
}

/** En natriumion prøver — og bliver vist bort ved filteret. */
function startAfvis(){
  const først = Math.random() < NA_ANTAL.ude / N_NA ? 1 : -1;
  for(const s of [først, -først]){
    const i = nærmeste(NA, s);
    if(i >= 0){ begynd(NA, i, AFVIS_IND); return true; }
  }
  return false;
}

/** Ionerne kan ikke komme forbi de hydrofobe haler, og de går
    heller ikke tværs gennem et protein — de skubbes udenom. */
function skubFri(P, i){
  if(Math.abs(P.py[i]) > OVER + 1.5) return;
  for(const p of spærret){
    const cx = p.objekt.position.x, cz = p.objekt.position.z;
    const dx = P.px[i] - cx, dz = P.pz[i] - cz;
    const d = Math.hypot(dx, dz), r = p.r + 0.5;
    if(d < r){
      if(d < 1e-3){ P.px[i] = cx + r; P.pz[i] = cz; }
      else        { P.px[i] = cx + dx / d * r; P.pz[i] = cz + dz / d * r; }
    }
  }
}

/** Tilfældig vandring i vandet på den ene side. */
function vandr(P, i, dt, drej){
  P.vx[i] += ((Math.random() * 2 - 1) * FART - P.vx[i]) * drej;
  P.vy[i] += ((Math.random() * 2 - 1) * FART - P.vy[i]) * drej;
  P.vz[i] += ((Math.random() * 2 - 1) * FART - P.vz[i]) * drej;
  const f = FART / (Math.hypot(P.vx[i], P.vy[i], P.vz[i]) || 1);
  P.vx[i] *= f; P.vy[i] *= f; P.vz[i] *= f;

  P.px[i] += P.vx[i] * dt; P.py[i] += P.vy[i] * dt; P.pz[i] += P.vz[i] * dt;

  if(P.px[i] < -KANT){ P.px[i] = -KANT; P.vx[i] =  Math.abs(P.vx[i]); }
  if(P.px[i] >  KANT){ P.px[i] =  KANT; P.vx[i] = -Math.abs(P.vx[i]); }
  if(P.pz[i] < -KANT){ P.pz[i] = -KANT; P.vz[i] =  Math.abs(P.vz[i]); }
  if(P.pz[i] >  KANT){ P.pz[i] =  KANT; P.vz[i] = -Math.abs(P.vz[i]); }

  const s = P.side[i];
  const nær = s * (OVER + 0.4), fjern = s * (OVER + VAND);
  if(s * P.py[i] < s * nær)  { P.py[i] = nær;   P.vy[i] =  s * Math.abs(P.vy[i]); }
  if(s * P.py[i] > s * fjern){ P.py[i] = fjern; P.vy[i] = -s * Math.abs(P.vy[i]); }

  skubFri(P, i);
}

/** Glid fra det sted, turen begyndte, hen mod et mål. */
function glid(P, i, k, x, y, z){
  P.px[i] = P.fraX[i] + (x - P.fraX[i]) * k;
  P.py[i] = P.fraY[i] + (y - P.fraY[i]) * k;
  P.pz[i] = P.fraZ[i] + (z - P.fraZ[i]) * k;
}

/** Et sted at slippe ionen fri igen, et stykke fra mundingen. */
function slipPunkt(P, i, s){
  const a = Math.random() * Math.PI * 2, r = mellem(1.6, 3.4);
  P.tilX[i] = Math.max(-KANT, Math.min(KANT, poreX + Math.cos(a) * r));
  P.tilZ[i] = Math.max(-KANT, Math.min(KANT, poreZ + Math.sin(a) * r));
  P.tilY[i] = s * mellem(OVER + 0.8, OVER + 2.6);
}

/* ── Ét billede frem for én ion ────────────────────────── */
function frem(P, i, dt, drej, fast){
  switch(P.fase[i]){

    case VANDRER:
      vandr(P, i, dt, drej);
      break;

    /* På vej ned i tragten over poren. */
    case TIL_MUND: {
      P.u[i] += dt;
      const k = blødt(Math.min(1, P.u[i] / T_IND));
      glid(P, i, k, poreX, P.side[i] * MUND, poreZ);
      if(P.u[i] >= T_IND) begynd(P, i, I_POREN);
      break;
    }

    /* Gennem poren — hurtigt, og altid ét ion ad gangen i filteret. */
    case I_POREN: {
      P.u[i] += dt;
      const u = Math.min(1, P.u[i] / T_PORE), s = P.side[i];
      P.px[i] = poreX + Math.sin(u * 26) * 0.05;
      P.pz[i] = poreZ + Math.cos(u * 21) * 0.05;
      P.py[i] = s * MUND - s * 2 * MUND * u;
      if(P.u[i] >= T_PORE){
        P.side[i] = -s;
        if(!fast){
          const fra = s === 1 ? 'ude' : 'inde', til = s === 1 ? 'inde' : 'ude';
          konc[fra] = Math.max(0, konc[fra] - DELTA);
          konc[til] += DELTA;
        }
        begynd(P, i, FRA_MUND);
        slipPunkt(P, i, -s);
      }
      break;
    }

    case FRA_MUND: {
      P.u[i] += dt;
      const k = blødt(Math.min(1, P.u[i] / T_UD));
      glid(P, i, k, P.tilX[i], P.tilY[i], P.tilZ[i]);
      if(P.u[i] >= T_UD){ P.fase[i] = VANDRER; nyFart(P, i); }
      break;
    }

    /* Natrium: helt hen til filteret, et øjeblik — og ud igen. */
    case AFVIS_IND: {
      P.u[i] += dt;
      const k = blødt(Math.min(1, P.u[i] / T_IND));
      glid(P, i, k, poreX, P.side[i] * (MUND + 0.30), poreZ);
      if(P.u[i] >= T_IND){ P.fase[i] = AFVIS_HOLD; P.u[i] = 0; }
      break;
    }

    case AFVIS_HOLD: {
      P.u[i] += dt;
      /* Den sitrer mod filteret uden at komme længere. */
      P.px[i] = poreX + Math.sin(P.u[i] * 60) * 0.06;
      P.py[i] = P.side[i] * (MUND + 0.30 - Math.sin(P.u[i] / T_HOLD * Math.PI) * 0.14);
      P.pz[i] = poreZ;
      if(P.u[i] >= T_HOLD){ begynd(P, i, AFVIS_UD); slipPunkt(P, i, P.side[i]); }
      break;
    }

    case AFVIS_UD: {
      P.u[i] += dt;
      const k = blødt(Math.min(1, P.u[i] / T_TILBAGE));
      glid(P, i, k, P.tilX[i], P.tilY[i], P.tilZ[i]);
      if(P.u[i] >= T_TILBAGE){ P.fase[i] = VANDRER; nyFart(P, i); }
      break;
    }
  }
}

/* ── Låget ─────────────────────────────────────────────── *
 * Kanalproteinet er bygget som en ring af stave i struktur.js, og
 * hver stav husker sin vinkel i ringen (`grundvinkel`). Ved at
 * trække dem ind mod midten og dreje ringen en anelse lukker
 * ringen sig som en blænder — uden at struktur.js behøver at vide,
 * at der findes transport.                                       */
function sætLukning(l){
  for(const H of helixer){
    const a = H.vinkel + DREJ * l;
    const r = ÅBEN_R + (LUKKET_R - ÅBEN_R) * l;
    H.mesh.position.set(Math.cos(a) * r, H.grund.y, Math.sin(a) * r);
  }
}

/* ═══════════════════════════════════════════════════════════ */
export default registrer({
  id:'kanal',
  navn:'Kanalprotein',
  slags:'passiv',
  energi:'Ingen',
  protein:'kanal',
  molekyler:['k','na','cl'],
  beskrivelse:'Ioner kan ikke komme forbi de hydrofobe haler, men en kanal giver dem en vandfyldt vej igennem. Kanalen åbner og lukker, og mens den er åben, falder kaliumionerne ud af cellen med deres egen gradient — hurtigt, og uden at det koster energi. Natrium bliver vist bort ved filteret: den er den mindste af de to ioner, men holder fastere på sin vandkappe og er med den for stor til at slippe igennem.',

  byg(ctx){
    kanal = ctx.membran.findProtein('kanal');
    poreX = kanal.objekt.position.x;
    poreZ = kanal.objekt.position.z;
    spærret = ctx.membran.proteiner.filter(p => p.r > 0);

    /* Stavene i ringen — dem, der skal åbne og lukke. */
    helixer = [];
    kanal.objekt.traverse(o => {
      if(o.userData.grundvinkel !== undefined){
        helixer.push({mesh:o, vinkel:o.userData.grundvinkel, grund:o.position.clone()});
      }
    });

    for(const [id, P] of [['k', K], ['na', NA]]){
      const M = findMolekyle(id), R = KUGLER[id];

      /* Kernen lyser svagt af sig selv, så en ion kan ses inde i
         det lyse protein. Den melder sig derfor ikke som udpegelig
         del — så ville fremhævningen slukke lyset igen. Kappen er
         den, der lyser op, når ionen vælges: den ligger yderst og
         giver alligevel den pæneste glorie. */
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
      ctx.membran.tilfoejDel(`stof:${id}`, [kappeMat]);
      materialer.push(kerneMat, kappeMat);
      if(id === 'k') gruppeK = g; else gruppeNa = g;
    }

    for(let i = 0; i < N_K; i++){ saetUd(K, i, i % 2 ? 1 : -1); K.aktiv[i] = 0; }
    for(let i = 0; i < N_NA; i++){ saetUd(NA, i, 1); NA.aktiv[i] = 0; }

    justér(K,   1, målAntal(konc.ude),  true);
    justér(K,  -1, målAntal(konc.inde), true);
    justér(NA,  1, NA_ANTAL.ude,  true);
    justér(NA, -1, NA_ANTAL.inde, true);
    for(const P of [K, NA]) for(let i = 0; i < P.n; i++) if(P.aktiv[i]) P.liv[i] = 1;

    gateTid = mellem(...ÅBEN);
    sætLukning(0);
    tegn(K); tegn(NA);
  },

  opdater(t, dt, ctx){
    const fast = ctx.tilstand.fast;
    poreX = kanal.objekt.position.x;
    poreZ = kanal.objekt.position.z;

    /* ── Låget ───────────────────────────────────────── */
    if(dt > 0){
      gateTid -= dt;
      if(gateTid <= 0){ åben = !åben; gateTid = mellem(...(åben ? ÅBEN : LUKKET)); }
      lukning += ((åben ? 0 : 1) - lukning) * Math.min(1, dt * 9);
      sætLukning(lukning);
    }

    /* ── Nye krydsninger ─────────────────────────────── *
     * Chancen pr. sekund er koncentrationen gange en fast rate —
     * derfor følger nettostrømmen gradienten helt af sig selv, og
     * derfor standser den, når forskellen er udlignet. Er kanalen
     * lukket, sker der ingenting: heller ikke med gradienten.   */
    if(dt > 0 && åben){
      for(const [navn, s] of [['ude', 1], ['inde', -1]]){
        akk[navn] += RATE * konc[navn] * dt;
        while(akk[navn] >= 1){
          akk[navn] -= mellem(0.6, 1.4);      // spred krydsningerne ud i tiden
          if(!startKryds(s)) break;
        }
      }
      afvisAkk += AFVIS_RATE * dt;
      while(afvisAkk >= 1){
        afvisAkk -= mellem(0.5, 1.5);
        if(!startAfvis()) break;
      }
    }

    /* ── Ionerne ─────────────────────────────────────── */
    if(dt > 0){
      const drej = Math.min(1, dt * 4.5);
      for(const P of [K, NA]){
        for(let i = 0; i < P.n; i++){
          if(!P.aktiv[i]) continue;
          frem(P, i, dt, drej, fast);
          P.liv[i] += (P.doer[i] ? -LIV : LIV) * dt;
          if(P.liv[i] >= 1) P.liv[i] = 1;
          if(P.liv[i] <= 0 && P.doer[i]){ P.liv[i] = 0; P.aktiv[i] = 0; P.doer[i] = 0; }
        }
      }
    }

    /* ── Koncentrationerne ───────────────────────────── *
     * Holdes de fast, sørger cellen for gradienten — det er jo
     * netop dét, pumpen bruger sin ATP på. Ellers er systemet
     * lukket, og hver krydsning har allerede flyttet lidt.      */
    if(fast && dt > 0){
      const k = Math.min(1, dt * 0.6);
      konc.ude  += (K_START.ude  - konc.ude ) * k;
      konc.inde += (K_START.inde - konc.inde) * k;
    }
    justér(K,  1, målAntal(konc.ude),  false);
    justér(K, -1, målAntal(konc.inde), false);

    tegn(K); tegn(NA);
  },

  aflaes(){
    /* Tallene regnes på samme model, billedet kører efter: strømmen
       den ene vej er koncentrationen gange raten, og kanalen står
       kun åben en del af tiden. */
    const udad  = RATE * konc.inde * ÅBENDEL;
    const indad = RATE * konc.ude  * ÅBENDEL;
    const netto = udad - indad;
    const en  = (v, d) => v.toFixed(d).replace('.', ',');
    const mmol = v => v >= 10 ? en(v, 0) : en(v, 1);

    return [
      {mærkat:'K⁺ uden for cellen', værdi:mmol(konc.ude),  enhed:'mmol/L'},
      {mærkat:'K⁺ inde i cellen',   værdi:mmol(konc.inde), enhed:'mmol/L'},
      Math.abs(netto) < 0.05
        ? {mærkat:'Nettostrøm K⁺', værdi:'0', enhed:'ligevægt'}
        : {mærkat:'Nettostrøm K⁺', værdi:en(Math.abs(netto), 1),
           enhed:netto > 0 ? 'ioner/s ud af cellen' : 'ioner/s ind i cellen'},
    ];
  },

  ryd(ctx){
    if(!gruppeK) return;
    sætLukning(0);
    for(const H of helixer) H.mesh.position.copy(H.grund);
    for(const g of [gruppeK, gruppeNa]) ctx.membran.gruppe.remove(g);
    for(const P of [K, NA]){ P.kerne.geometry.dispose(); P.kappe.geometry.dispose(); }
    for(const m of materialer) m.dispose();
    materialer = []; helixer = [];
    gruppeK = gruppeNa = null;
  },
});

/** Skriver ionernes plads over i de to instansmatricer. Kernen og
    vandkappen deler midte, så de altid følges ad. */
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
