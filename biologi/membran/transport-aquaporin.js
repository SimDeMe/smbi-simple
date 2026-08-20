/* ═══════════════════════════════════════════════════════════
   Aquaporin — en altid åben vandkanal.

   Vand er lille nok til at sive gennem lipidlaget hist og her, men
   det går langt hurtigere gennem en aquaporin: kanalen er én lang
   række brintbindinger, og vandmolekylerne falder gennem den som
   perler på en snor, uden at skulle vride sig forbi de hydrofobe
   haler. Der er intet låg her, som i kaliumkanalen — en aquaporin
   står åben hele tiden, og det er selve pointen: cellen kan ikke
   regulere sin egen permeabilitet for vand med denne kanal alene.

   ── Simplificeret gradient ─────────────────────────────────
   Den egentlige drivkraft bag osmose er opløste stoffer, ikke vand
   selv — vandkoncentrationen i en celle er praktisk talt konstant
   (omkring 55 mol/L). At give vand sin egen skyder i mmol/L ville
   derfor være direkte forkert. I stedet bruges et forenklet mål:
   `ctx.tilstand.stof.h2o` er den *relative* vandandel i procent,
   hvor lavere andel står for "mere opløst stof, mindre frit vand" —
   nok til at vise, at vand følger den vej, uden at påstå noget
   forkert om enhederne. Den egentlige konsekvens for hele cellen
   — svulmer eller skrumper den — hører til i osmosesimuleringen,
   ikke her; se linket i figurens forklaring.
   ═══════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import {registrer}             from './transport.js';
import {MÅL}                   from './struktur.js';
import {find as findMolekyle}  from './molekyler.js';

/* ── Modellens tal ─────────────────────────────────────── */
const C_MAKS  = 100;                // % — skydernes øverste værdi
const PR_ENHED = 0.4;               // tegnede molekyler pr. procentpoint
const N        = Math.round(C_MAKS * PR_ENHED * 2) + 4;

const RATE     = 0.9;    // krydsninger pr. sekund pr. tegnet molekyle på siden
const KRYDSTID = 0.15;   // s om at glide gennem poren — en tiendedel af lipidlagets
const VAND     = 5.0;    // nm vand tegnet på hver side
const FART     = 3.0;    // nm/s — molekylernes tilfældige vandring

const OVER = MÅL.tykkelse / 2 + MÅL.hoved * 0.85;
const KANT = MÅL.bredde / 2 - 0.6;

const R_ATOM  = 0.13;
const BINDING = 0.13;

/* ── Molekylernes tilstand ─────────────────────────────── */
const px = new Float32Array(N), py = new Float32Array(N), pz = new Float32Array(N);
const vx = new Float32Array(N), vy = new Float32Array(N), vz = new Float32Array(N);
const side  = new Int8Array(N);
const aktiv = new Uint8Array(N);
const kryds = new Float32Array(N);
const fraX = new Float32Array(N), fraY = new Float32Array(N), fraZ = new Float32Array(N);
const dreje = new Float32Array(N), hælde = new Float32Array(N), spin = new Float32Array(N);

let atomA = null, atomB = null, gruppe = null, materiale = null;
let aquaporin = null, poreX = 0, poreZ = 0;
let h2oStof = null;
const skrevet = {ude:-1, inde:-1};
const akk = {ude:0, inde:0};

const _m = new THREE.Matrix4();
const SKJULT = new THREE.Matrix4().makeScale(0, 0, 0);

/* ── Små hjælpere ──────────────────────────────────────── */
const mellem = (a, b) => a + Math.random() * (b - a);

function saetUd(i, s){
  let x = 0, z = 0;
  for(let forsøg = 0; forsøg < 6; forsøg++){
    x = mellem(-KANT, KANT); z = mellem(-KANT, KANT);
    if(Math.hypot(x - poreX, z - poreZ) > 4.5) break;
  }
  px[i] = x; pz[i] = z;
  py[i] = s * mellem(OVER + 0.3, OVER + VAND);
  const a = Math.random() * Math.PI * 2, h = mellem(-1, 1);
  const c = Math.sqrt(1 - h * h);
  vx[i] = Math.cos(a) * c * FART; vy[i] = h * FART; vz[i] = Math.sin(a) * c * FART;
  side[i] = s; kryds[i] = 0;
  dreje[i] = Math.random() * Math.PI * 2;
  hælde[i] = mellem(-1, 1);
  spin[i]  = mellem(-1.6, 1.6);
}

function tælSide(s){
  let n = 0;
  for(let i = 0; i < N; i++) if(aktiv[i] && side[i] === s) n++;
  return n;
}

function slukEt(s){
  for(let i = 0; i < N; i++){
    if(aktiv[i] && side[i] === s && kryds[i] === 0){ aktiv[i] = 0; return true; }
  }
  return false;
}

function tændEt(s){
  for(let i = 0; i < N; i++){
    if(!aktiv[i]){ saetUd(i, s); aktiv[i] = 1; return true; }
  }
  return false;
}

function justér(s, ønsket, straks){
  let trin = straks ? N : 1;
  let n = tælSide(s);
  while(n > ønsket && trin-- > 0 && slukEt(s)) n--;
  while(n < ønsket && trin-- > 0 && tændEt(s)) n++;
}

/** Molekylet nærmest poren på siden `s` — det er det, der finder
    vejen ind, ligesom ved kaliumkanalen. I modsætning til simpel
    diffusion krydser vand ét bestemt sted, ikke hvor som helst i
    lipidlaget, så det er en udpegning, ikke en tilfældig chance
    for hvert enkelt molekyle, der afgør, hvem der krydser næste
    gang — ellers ville de færreste nogensinde finde den lille pore
    ved egen tilfældige vandring. */
function nærmeste(s){
  let bedst = -1, kortest = Infinity;
  for(let i = 0; i < N; i++){
    if(!aktiv[i] || kryds[i] > 0 || side[i] !== s) continue;
    const d = (px[i] - poreX) ** 2 + (pz[i] - poreZ) ** 2;
    if(d < kortest){ kortest = d; bedst = i; }
  }
  return bedst;
}

function startKryds(i){
  fraX[i] = px[i]; fraY[i] = py[i]; fraZ[i] = pz[i];
  kryds[i] = 1e-4;
}

/* ═══════════════════════════════════════════════════════════ */
export default registrer({
  id:'aquaporin',
  navn:'Aquaporin',
  slags:'passiv',
  energi:'Ingen',
  protein:'aquaporin',
  molekyler:['h2o'],
  beskrivelse:'En smal, altid åben vandkanal. Vandmolekylerne går på række gennem poren, ét lag brintbindinger ad gangen — langt hurtigere end de få, der siver tilfældigt gennem lipidlaget. Der er intet låg: cellen styrer ikke, hvor meget der går igennem, kun hvor mange aquaporiner der sidder i membranen.',

  byg(ctx){
    h2oStof = ctx.tilstand.stof.h2o;

    aquaporin = ctx.membran.findProtein('aquaporin');
    poreX = aquaporin.objekt.position.x;
    poreZ = aquaporin.objekt.position.z;

    materiale = new THREE.MeshStandardMaterial({
      color:findMolekyle('h2o').farve, roughness:0.25, metalness:0.08});

    const geo = new THREE.SphereGeometry(R_ATOM, 9, 7);
    atomA = new THREE.InstancedMesh(geo, materiale, N);
    atomB = new THREE.InstancedMesh(geo, materiale, N);
    atomA.frustumCulled = atomB.frustumCulled = false;

    gruppe = new THREE.Group();
    gruppe.userData.delId = 'stof:h2o';
    gruppe.add(atomA, atomB);
    ctx.membran.gruppe.add(gruppe);
    ctx.membran.tilfoejDel('stof:h2o', [materiale]);

    for(let i = 0; i < N; i++){ saetUd(i, i % 2 ? 1 : -1); aktiv[i] = 0; }
    justér( 1, Math.round(h2oStof.ude  * PR_ENHED), true);
    justér(-1, Math.round(h2oStof.inde * PR_ENHED), true);
    skrevet.ude = h2oStof.ude; skrevet.inde = h2oStof.inde;
    tegn();
  },

  opdater(t, dt, ctx){
    poreX = aquaporin.objekt.position.x;
    poreZ = aquaporin.objekt.position.z;

    if(Math.abs(h2oStof.ude - skrevet.ude) > 1e-9 || Math.abs(h2oStof.inde - skrevet.inde) > 1e-9){
      justér( 1, Math.round(h2oStof.ude  * PR_ENHED), true);
      justér(-1, Math.round(h2oStof.inde * PR_ENHED), true);
    }

    /* ── Nye krydsninger ─────────────────────────────── *
     * Samme greb som kaliumkanalen: chancen pr. sekund er antallet
     * på siden gange en fast rate, så nettostrømmen følger
     * gradienten helt af sig selv. */
    if(dt > 0){
      for(const [navn, s] of [['ude', 1], ['inde', -1]]){
        akk[navn] += RATE * tælSide(s) * dt;
        while(akk[navn] >= 1){
          akk[navn] -= mellem(0.7, 1.3);
          const i = nærmeste(s);
          if(i < 0) break;
          startKryds(i);
        }
      }
    }

    if(dt > 0){
      const drej = Math.min(1, dt * 5);
      for(let i = 0; i < N; i++){
        if(!aktiv[i]) continue;
        dreje[i] += spin[i] * dt;

        if(kryds[i] > 0){
          kryds[i] += dt / KRYDSTID;
          if(kryds[i] >= 1){
            const s = -side[i];
            side[i] = s; kryds[i] = 0;
            px[i] = poreX; pz[i] = poreZ; py[i] = s * (OVER + 0.35);
            vy[i] = s * Math.abs(vy[i]);
          } else {
            const u = kryds[i], k = u * u * (3 - 2 * u);
            const slutY = -side[i] * (OVER + 0.35);
            px[i] = fraX[i] + (poreX - fraX[i]) * k;
            pz[i] = fraZ[i] + (poreZ - fraZ[i]) * k;
            py[i] = fraY[i] + (slutY - fraY[i]) * k;
          }
          continue;
        }

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
      }
    }

    if(ctx.tilstand.fast){
      justér( 1, Math.round(h2oStof.ude  * PR_ENHED), false);
      justér(-1, Math.round(h2oStof.inde * PR_ENHED), false);
    } else {
      h2oStof.ude  = tælSide( 1) / PR_ENHED;
      h2oStof.inde = tælSide(-1) / PR_ENHED;
    }
    skrevet.ude = h2oStof.ude; skrevet.inde = h2oStof.inde;

    tegn();
  },

  aflaes(){
    const indad = tælSide( 1) * RATE;
    const udad  = tælSide(-1) * RATE;
    const netto = indad - udad;
    const en = v => v.toFixed(1).replace('.', ',');

    return [
      {mærkat:'Vand ind i cellen', værdi:en(indad), enhed:'molekyler/s'},
      {mærkat:'Vand ud af cellen', værdi:en(udad),  enhed:'molekyler/s'},
      Math.abs(netto) < 0.05
        ? {mærkat:'Nettostrøm vand', værdi:'0', enhed:'ligevægt'}
        : {mærkat:'Nettostrøm vand', værdi:en(Math.abs(netto)),
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
