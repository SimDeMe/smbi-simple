/* ═══════════════════════════════════════════════════════════
   Simpel diffusion — ilt tværs gennem lipidlaget.

   Pointen, eleven skal kunne se: molekylerne går **begge veje**
   hele tiden. Hvert enkelt molekyle vælger ikke en retning — det
   støder tilfældigt rundt, og engang imellem rammer det membranen
   og glider igennem. Netop fordi der er flere molekyler på den
   side, hvor koncentrationen er høj, sker det oftere derfra, og
   nettostrømmen følger derfor gradienten helt af sig selv.

   Modellen er tilsvarende enkel: hvert aktivt molekyle har samme
   lille chance pr. sekund for at krydse. Så er strømmen den ene
   vej lig antallet på den side gange den chance — Ficks lov, uden
   at der er regnet på den ét eneste sted.

   Ilt er valgt, fordi tallene kan stå rigtigt: vand i ligevægt med
   atmosfærisk luft indeholder ca. 0,26 mmol/L ilt, og inde i en
   celle, der forbrænder, er der væsentligt mindre.
   ═══════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import {registrer}             from './transport.js';
import {MÅL}                   from './struktur.js';
import {find as findMolekyle}  from './molekyler.js';

/* ── Modellens tal ─────────────────────────────────────── */
const C_MAKS  = 0.30;               // mmol/L — skydernes øverste værdi
const PR_SIDE = 54;                 // molekyler tegnet ved C_MAKS på én side
const PR_MMOL = PR_SIDE / C_MAKS;   // molekyler pr. mmol/L
const N       = PR_SIDE * 2;        // hele puljen

const RATE     = 0.11;   // krydsninger pr. sekund pr. molekyle på siden
const KRYDSTID = 0.9;    // s om at komme gennem lipidlaget
const VAND     = 6.0;    // nm vand tegnet på hver side
const ZONE     = 1.4;    // nm fra membranen, hvor en krydsning kan begynde
const FART     = 3.2;    // nm/s — molekylernes tilfældige vandring

/* Et molekyle kan kun krydse, når det er tæt på membranen, og det er
   det kun brøkdelen ZONE/SLAB af tiden. Undervejs igennem er det
   desuden optaget og kan ikke begynde forfra. Chancen inde i zonen
   skrues op for begge dele, så den gennemsnitlige rate bliver netop
   RATE — og instrumenternes tal dermed passer med det, man ser ske.
   Efterprøvet: 0,105 krydsninger pr. molekyle pr. sekund over 600 s. */
const SLAB   = VAND - 0.3;
const P_ZONE = RATE * (SLAB / ZONE) / (1 - RATE * KRYDSTID);

const OVER = MÅL.tykkelse / 2 + MÅL.hoved * 0.85;   // membranens overflade
const KANT = MÅL.bredde / 2 - 0.6;                  // molekylerne holder sig inden for

const R_ATOM  = 0.15;    // nm — ét iltatom, tegnet lidt større end virkeligheden
const BINDING = 0.15;    // nm fra molekylets midte ud til hvert atom

/* ── Molekylernes tilstand ─────────────────────────────── */
const px = new Float32Array(N), py = new Float32Array(N), pz = new Float32Array(N);
const vx = new Float32Array(N), vy = new Float32Array(N), vz = new Float32Array(N);
const side   = new Int8Array(N);      // +1 uden for cellen, -1 inde i cellen
const aktiv  = new Uint8Array(N);     // 0 = ikke tegnet (lav koncentration)
const kryds  = new Float32Array(N);   // 0 = ikke undervejs, ellers 0-1
const fraX = new Float32Array(N), fraY = new Float32Array(N), fraZ = new Float32Array(N);
const tilX = new Float32Array(N), tilZ = new Float32Array(N);
const dreje = new Float32Array(N), hælde = new Float32Array(N), spin = new Float32Array(N);

let atomA = null, atomB = null, gruppe = null, materiale = null;
let spærret = [];                     // proteinerne — der krydses ikke gennem dem
const skrevet = {ude:-1, inde:-1};    // de koncentrationer, modulet sidst skrev

const _m = new THREE.Matrix4();
const SKJULT = new THREE.Matrix4().makeScale(0, 0, 0);

/* ── Små hjælpere ──────────────────────────────────────── */
const mellem = (a, b) => a + Math.random() * (b - a);

/** Et tilfældigt sted i vandet på den ene side. */
function saetUd(i, s){
  px[i] = mellem(-KANT, KANT);
  pz[i] = mellem(-KANT, KANT);
  py[i] = s * mellem(OVER + 0.3, OVER + VAND);
  const a = Math.random() * Math.PI * 2, h = mellem(-1, 1);
  const c = Math.sqrt(1 - h * h);
  vx[i] = Math.cos(a) * c * FART; vy[i] = h * FART; vz[i] = Math.sin(a) * c * FART;
  side[i] = s; kryds[i] = 0;
  dreje[i] = Math.random() * Math.PI * 2;
  hælde[i] = mellem(-1, 1);
  spin[i]  = mellem(-1.4, 1.4);
}

function tælSide(s){
  let n = 0;
  for(let i = 0; i < N; i++) if(aktiv[i] && side[i] === s) n++;
  return n;
}

/** Sluk ét molekyle på siden — cellen har forbrugt det. */
function slukEt(s){
  for(let i = 0; i < N; i++){
    if(aktiv[i] && side[i] === s && kryds[i] === 0){ aktiv[i] = 0; return true; }
  }
  return false;
}

/** Tænd ét molekyle på siden — der er kommet nyt til. */
function tændEt(s){
  for(let i = 0; i < N; i++){
    if(!aktiv[i]){ saetUd(i, s); aktiv[i] = 1; return true; }
  }
  return false;
}

/** Bring antallet på siden nærmere det, koncentrationen svarer til.
    `straks` bruges, når eleven selv har flyttet skyderen; ellers
    rettes der kun ét molekyle pr. billede, så det ikke ses. */
function justér(s, ønsket, straks){
  let trin = straks ? N : 1;
  let n = tælSide(s);
  while(n > ønsket && trin-- > 0 && slukEt(s)) n--;
  while(n < ønsket && trin-- > 0 && tændEt(s)) n++;
}

/** Simpel diffusion foregår i det rene dobbeltlag — ikke tværs
    gennem et protein. Ligger stedet oven i et, skubbes det ud. */
function friPlads(x, z){
  for(const p of spærret){
    const dx = x - p.x, dz = z - p.z;
    const d = Math.hypot(dx, dz), r = p.r + 0.6;
    if(d < r){
      if(d < 1e-3){ x = p.x + r; z = p.z; }
      else        { x = p.x + dx / d * r; z = p.z + dz / d * r; }
    }
  }
  return [Math.max(-KANT, Math.min(KANT, x)), Math.max(-KANT, Math.min(KANT, z))];
}

function startKryds(i){
  fraX[i] = px[i]; fraY[i] = py[i]; fraZ[i] = pz[i];
  const [x, z] = friPlads(px[i], pz[i]);
  tilX[i] = x; tilZ[i] = z;
  kryds[i] = 1e-4;
}

/* ═══════════════════════════════════════════════════════════ */
export default registrer({
  id:'diffusion',
  navn:'Simpel diffusion',
  slags:'passiv',
  energi:'Ingen',
  protein:null,
  molekyler:['o2','co2','steroid'],
  beskrivelse:'Små upolære molekyler som ilt glider tværs gennem lipidlaget uden hjælp fra noget protein. De bevæger sig begge veje hele tiden, men nettostrømmen går fra høj mod lav koncentration — og standser, når der er lige meget på begge sider. Kuldioxid og steroidhormoner tager samme vej.',

  byg(ctx){
    materiale = new THREE.MeshStandardMaterial({
      color:findMolekyle('o2').farve, roughness:0.28, metalness:0.06});

    /* Ilt er to atomer bundet sammen, og sådan tegnes det: to
       kugler, der deler samme midte og drejer om den. */
    const geo = new THREE.SphereGeometry(R_ATOM, 10, 8);
    atomA = new THREE.InstancedMesh(geo, materiale, N);
    atomB = new THREE.InstancedMesh(geo, materiale, N);
    atomA.frustumCulled = atomB.frustumCulled = false;

    gruppe = new THREE.Group();
    gruppe.userData.delId = 'stof:o2';
    gruppe.add(atomA, atomB);

    /* Molekylerne lægges i membranens egen gruppe, så de kan
       udpeges sammen med resten af figuren. */
    ctx.membran.gruppe.add(gruppe);
    ctx.membran.tilfoejDel('stof:o2', [materiale]);

    spærret = ctx.membran.proteiner.filter(p => p.r > 0);

    for(let i = 0; i < N; i++){ saetUd(i, i < PR_SIDE ? 1 : -1); aktiv[i] = 0; }
    justér( 1, Math.round(ctx.tilstand.ude  * PR_MMOL), true);
    justér(-1, Math.round(ctx.tilstand.inde * PR_MMOL), true);
    skrevet.ude = ctx.tilstand.ude; skrevet.inde = ctx.tilstand.inde;
    tegn();
  },

  opdater(t, dt, ctx){
    const T = ctx.tilstand;

    /* Har eleven flyttet en skyder, siden modulet sidst skrev? Så
       skal antallet af molekyler passe med det samme. */
    if(Math.abs(T.ude - skrevet.ude) > 1e-9 || Math.abs(T.inde - skrevet.inde) > 1e-9){
      justér( 1, Math.round(T.ude  * PR_MMOL), true);
      justér(-1, Math.round(T.inde * PR_MMOL), true);
    }

    if(dt > 0){
      const drej = Math.min(1, dt * 4.5);
      for(let i = 0; i < N; i++){
        if(!aktiv[i]) continue;
        dreje[i] += spin[i] * dt;

        if(kryds[i] > 0){
          kryds[i] += dt / KRYDSTID;
          if(kryds[i] >= 1){
            /* Fremme på den anden side: molekylet hører nu til dér. */
            const s = -side[i];
            side[i] = s; kryds[i] = 0;
            px[i] = tilX[i]; pz[i] = tilZ[i]; py[i] = s * (OVER + 0.35);
            vy[i] = s * Math.abs(vy[i]);
          } else {
            const u = kryds[i], k = u * u * (3 - 2 * u);   // blødt ind og ud
            const slutY = -side[i] * (OVER + 0.35);
            px[i] = fraX[i] + (tilX[i] - fraX[i]) * k;
            pz[i] = fraZ[i] + (tilZ[i] - fraZ[i]) * k;
            py[i] = fraY[i] + (slutY   - fraY[i]) * k;
          }
          continue;
        }

        /* Tilfældig vandring: retningen skifter hele tiden lidt. */
        vx[i] += ((Math.random() * 2 - 1) * FART - vx[i]) * drej;
        vy[i] += ((Math.random() * 2 - 1) * FART - vy[i]) * drej;
        vz[i] += ((Math.random() * 2 - 1) * FART - vz[i]) * drej;
        const f = FART / (Math.hypot(vx[i], vy[i], vz[i]) || 1);
        vx[i] *= f; vy[i] *= f; vz[i] *= f;

        px[i] += vx[i] * dt; py[i] += vy[i] * dt; pz[i] += vz[i] * dt;

        if(px[i] < -KANT){ px[i] = -KANT; vx[i] =  Math.abs(vx[i]); }
        if(px[i] >  KANT){ px[i] =  KANT; vx[i] = -Math.abs(vx[i]); }
        if(pz[i] < -KANT){ pz[i] = -KANT; vz[i] =  Math.abs(vz[i]); }
        if(pz[i] >  KANT){ pz[i] =  KANT; vz[i] = -Math.abs(vz[i]); }

        const s = side[i];
        const nær = s * (OVER + 0.3), fjern = s * (OVER + VAND);
        if(s * py[i] < s * nær)  { py[i] = nær;   vy[i] =  s * Math.abs(vy[i]); }
        if(s * py[i] > s * fjern){ py[i] = fjern; vy[i] = -s * Math.abs(vy[i]); }

        /* Tæt nok på membranen til at kunne glide igennem? */
        if(Math.abs(py[i]) < OVER + 0.3 + ZONE && Math.random() < P_ZONE * dt){
          startKryds(i);
        }
      }
    }

    /* Holdes koncentrationerne fast, forbruger og tilfører cellen,
       så antallet passer igen. Ellers er systemet lukket, og
       koncentrationerne er simpelthen dét, molekylerne viser. */
    if(T.fast){
      justér( 1, Math.round(T.ude  * PR_MMOL), false);
      justér(-1, Math.round(T.inde * PR_MMOL), false);
    } else {
      T.ude  = tælSide( 1) / PR_MMOL;
      T.inde = tælSide(-1) / PR_MMOL;
    }
    skrevet.ude = T.ude; skrevet.inde = T.inde;

    tegn();
  },

  aflaes(ctx){
    /* Strømmen den ene vej er antallet på siden gange chancen pr.
       molekyle. Tallene regnes altså på samme model, som billedet
       kører efter — de er bare ikke behæftet med tilfældighederne,
       så de står stille nok til at kunne aflæses. */
    const indad = tælSide( 1) * RATE;
    const udad  = tælSide(-1) * RATE;
    const netto = indad - udad;
    const en    = v => v.toFixed(1).replace('.', ',');

    return [
      {mærkat:'Ind i cellen', værdi:en(indad), enhed:'molekyler/s'},
      {mærkat:'Ud af cellen', værdi:en(udad),  enhed:'molekyler/s'},
      Math.abs(netto) < 0.05
        ? {mærkat:'Nettostrøm', værdi:'0', enhed:'ligevægt'}
        : {mærkat:'Nettostrøm', værdi:en(Math.abs(netto)),
           enhed:netto > 0 ? 'molekyler/s ind i cellen' : 'molekyler/s ud af cellen'},
    ];
  },

  ryd(ctx){
    if(!gruppe) return;
    ctx.membran.gruppe.remove(gruppe);
    atomA.geometry.dispose();
    materiale.dispose();
    gruppe = atomA = atomB = materiale = null;
  },
});

/** Skriver molekylernes plads over i de to instansmatricer. */
function tegn(){
  for(let i = 0; i < N; i++){
    if(!aktiv[i]){
      atomA.setMatrixAt(i, SKJULT);
      atomB.setMatrixAt(i, SKJULT);
      continue;
    }
    const h = hælde[i], c = Math.sqrt(1 - h * h);
    const ox = Math.cos(dreje[i]) * c * BINDING;
    const oy = h * BINDING;
    const oz = Math.sin(dreje[i]) * c * BINDING;
    atomA.setMatrixAt(i, _m.makeTranslation(px[i] + ox, py[i] + oy, pz[i] + oz));
    atomB.setMatrixAt(i, _m.makeTranslation(px[i] - ox, py[i] - oy, pz[i] - oz));
  }
  atomA.instanceMatrix.needsUpdate = true;
  atomB.instanceMatrix.needsUpdate = true;
}
