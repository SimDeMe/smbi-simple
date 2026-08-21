/* ═══════════════════════════════════════════════════════════
   Faciliteret diffusion gennem et transportprotein (bærer).

   Kontrasten til kanalen ved siden af er hele pointen:

     stadig    Bæreren bruger ingen energi. Glukosen falder ned ad
     passiv    sin egen gradient, og nettostrømmen standser af sig
               selv, når der er lige meget på begge sider. Vender
               man gradienten om, vender strømmen med.
     langsom   Kanalen lader ioner strømme igennem i tusindvis;
               bæreren tager ét molekyle ad gangen og skal skifte
               form hele vejen rundt for hvert eneste. Sammenlign
               instrumenterne: kanalen tæller i ioner pr. sekund,
               bæreren i ét molekyle hvert par sekunder.
     mættelig  Og det er den afgørende forskel. Der er kun så
               mange transportproteiner. Skruer man glukosen op,
               stiger strømmen — men kun indtil proteinet er
               optaget hele tiden. Så kan det ikke mere.

   ── Tilstandsmaskinen ──────────────────────────────────────
   Proteinet er ét af to steder ad gangen, aldrig åbent til
   begge sider på én gang:

     VENTER   tomt, formen slapper af i midterstillingen
     BIND     et glukosemolekyle glider ind i mundingen, og
              proteinet åbner sig mod netop den side
     VEND     formskiftet: proteinet svinger over, molekylet
              føres tværs igennem, og midtvejs er det lukket
              til begge sider
     SLIP     molekylet slippes fri på den anden side

   ── Mætningen er regnet, ikke påstået ──────────────────────
   Mens proteinet er tomt, venter det på et molekyle. Ventetiden
   er tilfældig, men jo mere glukose der er, jo kortere er den —
   og hver tur tager den samme faste tid, T_TUR. Det giver helt
   af sig selv Michaelis-Menten:

     andel optaget = c / (c + K_M)          c = c_ude + c_inde
     ture pr. sekund = andel / T_TUR        og loftet er 1/T_TUR

   K_M er sat til 5 mmol/L, som for GLUT1, og blodsukkeret ligger
   omkring 5 mmol/L — så eleven starter lige dér, hvor kurven
   begynder at bøje af. Skyderen når op til 20 mmol/L, hvor
   proteinet er optaget 80 % af tiden og næsten ikke kan mere.
   ═══════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import {registrer}             from './transport.js';
import {MÅL}                   from './struktur.js';
import {find as findMolekyle}  from './molekyler.js';

/* ── Modellens tal ─────────────────────────────────────── */
const K_M   = 5.0;    // mmol/L — halv mætning, som for GLUT1
const T_TUR = 1.5;    // s pr. tur gennem proteinet: loftet er 1/1,5 pr. s
const DELTA = 0.35;   // mmol/L, ét molekyles bidrag i et lukket system

const T_BIND = 0.45, T_VEND = 0.80, T_SLIP = 0.25;   // T_TUR fordelt ud

const TEGN  = 2.6;    // tegnede molekyler på en side = TEGN·√c
const MAKS  = 12;     // … men aldrig flere end så mange pr. side
const N     = 28;     // plads i instansmeshet

const VAND  = 6.0;    // nm vand tegnet på hver side
const FART  = 1.9;    // nm/s — glukose er tungere end ilt og ionerne
const LIV   = 3.2;    // 1/s — molekyler tones ind og ud
const REVIR = 4.4;    // nm — molekylerne holder sig i en cirkel om bæreren
const FRIRUM = 1.8;   // nm — helst ikke lige oven i mundingen

const OVER = MÅL.tykkelse / 2 + MÅL.hoved * 0.85;   // membranens overflade
const MUND = OVER + 0.55;                           // mundingens højde

const G_LOFT = findMolekyle('glukose').gradient.maks;

/* Glukose tegnes som sin ring: seks kugler i en sekskant. Formen
   er signalet — ilt er en håndvægt, ionerne kugler med vandkappe,
   og glukosen den eneste ring. Så kan de skelnes uden farve. */
const RING_R = 0.26, ATOM_R = 0.135;

/* Proteinets bevægelse: hvor meget stavene vipper, og hvor meget
   hele bundtet drejer, mellem de to former. */
const SVING = 0.30, TVIST = 0.20;

/* ── Faser ─────────────────────────────────────────────── */
const FRI = 0, PAA_VEJ = 1, INDE = 2, UD = 3;

/* ── Molekylerne ───────────────────────────────────────── */
const px = new Float32Array(N), py = new Float32Array(N), pz = new Float32Array(N);
const vx = new Float32Array(N), vy = new Float32Array(N), vz = new Float32Array(N);
const fraX = new Float32Array(N), fraY = new Float32Array(N), fraZ = new Float32Array(N);
const tilX = new Float32Array(N), tilY = new Float32Array(N), tilZ = new Float32Array(N);
const side  = new Int8Array(N),   fase = new Uint8Array(N);
const aktiv = new Uint8Array(N),  doer = new Uint8Array(N), liv = new Float32Array(N);
const dreje = new Float32Array(N), hælde = new Float32Array(N), spin = new Float32Array(N);

let konc = null;                   // tilstand.glukose
let ringe = [];                    // seks instansmeshes, én pr. plads i ringen
let gruppe = null, materiale = null;
let baerer = null, helixer = [];
let midtX = 0, midtZ = 0, mundX = 0, mundZ = 0;

/* Proteinets egen tilstand. `form` er −1 (åben ind mod cytosolen),
   0 (lukket til begge sider) og +1 (åben ud mod omgivelserne). */
let trin = 'VENTER', ur = 0, form = 0, fører = -1, fraSide = 1;
let venteAkk = 0, venteMål = 0;

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _akse = new THREE.Vector3();
const SKJULT = new THREE.Matrix4().makeScale(0, 0, 0);

/* Ringens seks pladser, målt i molekylets eget koordinatsystem. */
const RING = [];
for(let j = 0; j < 6; j++){
  const a = j / 6 * Math.PI * 2;
  RING.push(new THREE.Vector3(Math.cos(a) * RING_R, 0, Math.sin(a) * RING_R));
}

/* ── Små hjælpere ──────────────────────────────────────── */
const mellem = (a, b) => a + Math.random() * (b - a);
const blødt  = u => u * u * (3 - 2 * u);
const målAntal = c => Math.max(0, Math.min(MAKS, Math.round(TEGN * Math.sqrt(Math.max(0, c)))));

/** Et nyt, tilfældigt tidspunkt at få fat i et molekyle. Trækkes
    som en ægte eksponentialfordeling, så ventetiden i gennemsnit
    bliver 1/(raten) — det er dét, der gør mætningskurven rigtig. */
function nyVentetid(){
  venteAkk = 0;
  venteMål = -Math.log(1 - Math.random());
}

function nyFart(i){
  const a = Math.random() * Math.PI * 2, h = mellem(-1, 1);
  const c = Math.sqrt(1 - h * h);
  vx[i] = Math.cos(a) * c * FART; vy[i] = h * FART; vz[i] = Math.sin(a) * c * FART;
}

/** Et tilfældigt sted i vandet på den ene side, inden for bærerens
    revir og helst ikke lige oven i mundingen. */
function saetUd(i, s){
  let x = 0, z = 0;
  for(let forsøg = 0; forsøg < 8; forsøg++){
    const a = Math.random() * Math.PI * 2;
    const r = REVIR * Math.sqrt(Math.random());
    x = midtX + Math.cos(a) * r; z = midtZ + Math.sin(a) * r;
    if(Math.hypot(x - mundX, z - mundZ) > FRIRUM) break;
  }
  px[i] = x; pz[i] = z;
  py[i] = s * mellem(OVER + 0.6, OVER + VAND);
  nyFart(i);
  side[i] = s; fase[i] = FRI;
  dreje[i] = Math.random() * Math.PI * 2;
  hælde[i] = mellem(-1, 1);
  spin[i]  = mellem(-1.1, 1.1);
}

function tælSide(s){
  let n = 0;
  for(let i = 0; i < N; i++) if(aktiv[i] && !doer[i] && side[i] === s) n++;
  return n;
}

/** Ton ét molekyle ud — det fjerneste fra mundingen, så det ikke ses. */
function slukEt(s){
  let bedst = -1, længst = -1;
  for(let i = 0; i < N; i++){
    if(!aktiv[i] || doer[i] || side[i] !== s || fase[i] !== FRI) continue;
    const d = Math.hypot(px[i] - mundX, pz[i] - mundZ) + Math.abs(py[i]);
    if(d > længst){ længst = d; bedst = i; }
  }
  if(bedst < 0) return false;
  doer[bedst] = 1;
  return true;
}

function tændEt(s){
  for(let i = 0; i < N; i++){
    if(aktiv[i]) continue;
    saetUd(i, s);
    aktiv[i] = 1; doer[i] = 0; liv[i] = 0;
    return true;
  }
  return false;
}

function justér(s, ønsket, straks){
  let t = straks ? N : 1;
  let n = tælSide(s);
  while(n > ønsket && t-- > 0 && slukEt(s)) n--;
  while(n < ønsket && t-- > 0 && tændEt(s)) n++;
}

/** Molekylet, der er tættest på mundingen på den side — det er det,
    proteinet får fat i. */
function nærmeste(s){
  let bedst = -1, kortest = Infinity;
  for(let i = 0; i < N; i++){
    if(!aktiv[i] || doer[i] || fase[i] !== FRI || side[i] !== s) continue;
    const d = (px[i] - mundX) ** 2 + (pz[i] - mundZ) ** 2
            + (Math.abs(py[i]) - MUND) ** 2;
    if(d < kortest){ kortest = d; bedst = i; }
  }
  return bedst;
}

function begynd(i, f){
  fraX[i] = px[i]; fraY[i] = py[i]; fraZ[i] = pz[i];
  fase[i] = f;
}

/** Tilfældig vandring i vandet på den ene side, inden for reviret. */
function vandr(i, dt, drej){
  vx[i] += ((Math.random() * 2 - 1) * FART - vx[i]) * drej;
  vy[i] += ((Math.random() * 2 - 1) * FART - vy[i]) * drej;
  vz[i] += ((Math.random() * 2 - 1) * FART - vz[i]) * drej;
  const f = FART / (Math.hypot(vx[i], vy[i], vz[i]) || 1);
  vx[i] *= f; vy[i] *= f; vz[i] *= f;

  px[i] += vx[i] * dt; py[i] += vy[i] * dt; pz[i] += vz[i] * dt;

  const dx = px[i] - midtX, dz = pz[i] - midtZ;
  const d = Math.hypot(dx, dz);
  if(d > REVIR){
    const nx = dx / d, nz = dz / d;
    px[i] = midtX + nx * REVIR; pz[i] = midtZ + nz * REVIR;
    const ind = vx[i] * nx + vz[i] * nz;
    if(ind > 0){ vx[i] -= 2 * ind * nx; vz[i] -= 2 * ind * nz; }
  }

  const s = side[i];
  const nær = s * (OVER + 0.5), fjern = s * (OVER + VAND);
  if(s * py[i] < s * nær)  { py[i] = nær;   vy[i] =  s * Math.abs(vy[i]); }
  if(s * py[i] > s * fjern){ py[i] = fjern; vy[i] = -s * Math.abs(vy[i]); }
}

function glid(i, k, x, y, z){
  px[i] = fraX[i] + (x - fraX[i]) * k;
  py[i] = fraY[i] + (y - fraY[i]) * k;
  pz[i] = fraZ[i] + (z - fraZ[i]) * k;
}

/* ── Proteinets form ───────────────────────────────────── *
 * Stavene i bundtet vippes om ringens tangent. Vipper de den ene
 * vej, spiler toppen sig ud og bunden knibes sammen; vipper de
 * den anden vej, er det omvendt. Derfor kan proteinet aldrig stå
 * åbent til begge sider på én gang — og dét er netop forskellen
 * på en bærer og en kanal.                                     */
function sætForm(f){
  for(const H of helixer){
    _akse.set(-Math.sin(H.vinkel), 0, Math.cos(H.vinkel));
    _q.setFromAxisAngle(_akse, H.grundTilt + f * SVING);
    H.mesh.quaternion.copy(_q);
    H.mesh.position.set(
      Math.cos(H.vinkel + f * TVIST) * H.radius,
      H.y,
      Math.sin(H.vinkel + f * TVIST) * H.radius);
  }
}

/* ═══════════════════════════════════════════════════════════ */
export default registrer({
  id:'baerer',
  navn:'Transportprotein',
  slags:'passiv',
  energi:'Ingen',
  protein:'baerer',
  molekyler:['glukose','aminosyre'],
  beskrivelse:'Glukose er både for stor og for polær til lipidlaget. Et transportprotein binder ét molekyle ad gangen, lukker sig om det og åbner på den anden side. Stadig passivt — molekylerne følger deres egen gradient, og det koster ingen energi. Men proteinet er langsomt, og det kan mættes: skruer man glukosen op, arbejder det til sidst hele tiden og kan ikke mere. Det er dér, forskellen på en bærer og en kanal viser sig.',

  byg(ctx){
    konc = ctx.tilstand.glukose;

    baerer = ctx.membran.findProtein('baerer');
    midtX = mundX = baerer.x; midtZ = mundZ = baerer.z;

    /* Stavene i bundtet — dem, formskiftet flytter. */
    helixer = [];
    baerer.objekt.traverse(o => {
      if(o.userData.grundvinkel === undefined) return;
      const a = o.userData.grundvinkel;
      helixer.push({
        mesh:o, vinkel:a, y:o.position.y,
        radius:Math.hypot(o.position.x, o.position.z),
        /* Den hældning, struktur.js allerede gav staven — formskiftet
           lægges oven i den, så proteinet beholder sin egen facon. */
        grundTilt:-0.05,
      });
    });

    materiale = new THREE.MeshStandardMaterial({
      color:findMolekyle('glukose').farve, roughness:0.30, metalness:0.05,
      emissive:findMolekyle('glukose').farve, emissiveIntensity:0.12});

    const geo = new THREE.SphereGeometry(ATOM_R, 9, 7);
    gruppe = new THREE.Group();
    gruppe.userData.delId = 'stof:glukose';
    ringe = [];
    for(let j = 0; j < 6; j++){
      const im = new THREE.InstancedMesh(geo, materiale, N);
      im.frustumCulled = false;
      ringe.push(im);
      gruppe.add(im);
    }
    ctx.membran.gruppe.add(gruppe);
    ctx.membran.tilfoejDel('stof:glukose', [materiale]);

    for(let i = 0; i < N; i++){ saetUd(i, i % 2 ? 1 : -1); aktiv[i] = 0; }
    justér( 1, målAntal(konc.ude),  true);
    justér(-1, målAntal(konc.inde), true);
    for(let i = 0; i < N; i++) if(aktiv[i]) liv[i] = 1;

    trin = 'VENTER'; ur = 0; form = 0; fører = -1;
    nyVentetid();
    sætForm(0);
    tegn();
  },

  opdater(t, dt, ctx){
    const fast = ctx.tilstand.fast;
    mundX = baerer.objekt.position.x;
    mundZ = baerer.objekt.position.z;

    if(dt > 0){
      /* ── Tilstandsmaskinen ─────────────────────────── */
      ur += dt;
      switch(trin){

        /* Tomt protein. Ventetiden løber hurtigere, jo mere glukose
           der er — det er dén kobling, der giver mætningskurven. */
        case 'VENTER': {
          const ctot = konc.ude + konc.inde;
          venteAkk += dt * ctot / (K_M * T_TUR);
          if(venteAkk >= venteMål && ctot > 0){
            /* Hvilken side kommer molekylet fra? Jo flere der er på
               en side, jo oftere derfra — og derfor følger
               nettostrømmen gradienten helt af sig selv. */
            fraSide = Math.random() * ctot < konc.ude ? 1 : -1;
            const i = nærmeste(fraSide);
            if(i >= 0){
              fører = i; begynd(i, PAA_VEJ);
              trin = 'BIND'; ur = 0;
            } else {
              nyVentetid();          // ingen tegnet lige der — prøv igen
            }
          }
          form += (0 - form) * Math.min(1, dt * 3);
          break;
        }

        /* Molekylet glider ind i mundingen, og proteinet åbner mod
           netop den side. */
        case 'BIND': {
          const k = blødt(Math.min(1, ur / T_BIND));
          glid(fører, k, mundX, fraSide * MUND, mundZ);
          form += (fraSide - form) * Math.min(1, dt * 8);
          if(ur >= T_BIND){
            begynd(fører, INDE);
            trin = 'VEND'; ur = 0;
          }
          break;
        }

        /* Formskiftet. Proteinet svinger fra den ene side til den
           anden, og molekylet føres med — midtvejs er der lukket
           til begge sider, og dér er det hverken ude eller inde. */
        case 'VEND': {
          const u = Math.min(1, ur / T_VEND), k = blødt(u);
          form = fraSide * (1 - 2 * k);
          px[fører] = mundX; pz[fører] = mundZ;
          py[fører] = fraSide * MUND * (1 - 2 * k);
          if(ur >= T_VEND){
            const s = -fraSide;
            side[fører] = s;
            if(!fast){
              const fra = fraSide === 1 ? 'ude' : 'inde';
              const til = fraSide === 1 ? 'inde' : 'ude';
              konc[fra] = Math.max(0, konc[fra] - DELTA);
              konc[til] = Math.min(G_LOFT, konc[til] + DELTA);
            }
            begynd(fører, UD);
            const a = Math.random() * Math.PI * 2, r = mellem(1.5, 2.8);
            tilX[fører] = mundX + Math.cos(a) * r;
            tilZ[fører] = mundZ + Math.sin(a) * r;
            tilY[fører] = s * mellem(OVER + 0.9, OVER + 2.6);
            trin = 'SLIP'; ur = 0;
          }
          break;
        }

        /* Molekylet slippes fri på den anden side. */
        case 'SLIP': {
          const k = blødt(Math.min(1, ur / T_SLIP));
          glid(fører, k, tilX[fører], tilY[fører], tilZ[fører]);
          if(ur >= T_SLIP){
            fase[fører] = FRI; nyFart(fører);
            fører = -1;
            trin = 'VENTER'; ur = 0; nyVentetid();
          }
          break;
        }
      }
      sætForm(form);

      /* ── Molekylerne ───────────────────────────────── */
      const drej = Math.min(1, dt * 3.5);
      for(let i = 0; i < N; i++){
        if(!aktiv[i]) continue;
        dreje[i] += spin[i] * dt;
        if(fase[i] === FRI) vandr(i, dt, drej);
        liv[i] += (doer[i] ? -LIV : LIV) * dt;
        if(liv[i] >= 1) liv[i] = 1;
        if(liv[i] <= 0 && doer[i]){ liv[i] = 0; aktiv[i] = 0; doer[i] = 0; }
      }
    }

    /* Antallet af tegnede molekyler skal passe med koncentrationen
       — også når det var eleven, der flyttede skyderen. */
    justér( 1, målAntal(konc.ude),  false);
    justér(-1, målAntal(konc.inde), false);

    tegn();
  },

  aflaes(){
    /* Regnet på samme model, som proteinet kører efter: andelen af
       tiden, det er optaget, gange loftet 1/T_TUR — fordelt på de
       to sider efter hvor meget glukose der er hvert sted. */
    const ude = konc.ude, inde = konc.inde, nævner = K_M + ude + inde;
    const indad = ude  / nævner / T_TUR;
    const udad  = inde / nævner / T_TUR;
    const netto = indad - udad;
    const mætning = (ude + inde) / nævner * 100;
    const en = v => v.toFixed(2).replace('.', ',');

    return [
      Math.abs(netto) < 0.005
        ? {mærkat:'Glukose gennem bæreren', værdi:'0', enhed:'ligevægt'}
        : {mærkat:'Glukose gennem bæreren', værdi:en(Math.abs(netto)),
           enhed:netto > 0 ? 'molekyler/s ind' : 'molekyler/s ud'},
      {mærkat:'Bæreren optaget', værdi:Math.round(mætning), enhed:'% af tiden'},
    ];
  },

  ryd(ctx){
    if(!gruppe) return;
    sætForm(0);
    ctx.membran.gruppe.remove(gruppe);
    ringe[0].geometry.dispose();
    materiale.dispose();
    ringe = []; helixer = [];
    gruppe = materiale = null;
  },
});

/** Skriver molekylernes plads over i de seks instansmatricer.
    Ringen tumler om sig selv, så sekskanten kan ses fra alle sider. */
function tegn(){
  for(let i = 0; i < N; i++){
    if(!aktiv[i]){
      for(const im of ringe) im.setMatrixAt(i, SKJULT);
      continue;
    }
    const s = blødt(liv[i]);
    _akse.set(Math.cos(dreje[i] * 0.7), hælde[i], Math.sin(dreje[i] * 0.7)).normalize();
    _q.setFromAxisAngle(_akse, dreje[i]);
    for(let j = 0; j < 6; j++){
      _v.copy(RING[j]).multiplyScalar(s).applyQuaternion(_q);
      _m.makeScale(s, s, s);
      _m.setPosition(px[i] + _v.x, py[i] + _v.y, pz[i] + _v.z);
      ringe[j].setMatrixAt(i, _m);
    }
  }
  for(const im of ringe) im.instanceMatrix.needsUpdate = true;
}
