/* ═══════════════════════════════════════════════════════════
   Faciliteret diffusion gennem et transportprotein (bærer).

   Glukose er for stor og for polær til at glide gennem lipidlaget
   som ilt gør. I stedet binder ét transportprotein ét molekyle ad
   gangen og skifter form: bind → luk → åbn på den anden side →
   slip. Stadig passivt — molekylet går kun med sin egen gradient —
   men langsommere end en kanal, for der er kun én bindingslomme.

   ── Mætning, uden at der er skrevet "mætning" noget sted ────
   Der er kun ét transportprotein i figuren, og det kan kun holde
   på ét molekyle ad gangen. Mens det er optaget, må et glukose-
   molekyle, der støder til, vente. Det giver af sig selv den
   mætningskurve, bærertransport er kendt for: ved lav koncentration
   er turen næsten altid ledig med det samme, og strømmen vokser
   omtrent proportionalt med koncentrationen (som ved en kanal) —
   men ved høj koncentration er transportøren næsten altid optaget,
   og strømmen kan ikke vokse hurtigere end proteinet kan skifte
   form. Det svarer til Michaelis-Menten-kinetik: strømmen den ene
   vej er Vmax·C/(Km+Cude+Cinde), hvor Vmax er "så mange omgange
   proteinet kan nå pr. sekund" og Km er den koncentration, hvor det
   er halvt mættet. Se PLAN.md for udregningen og efterprøvningen.
   ═══════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import {registrer}             from './transport.js';
import {MÅL}                   from './struktur.js';
import {find as findMolekyle}  from './molekyler.js';

/* ── Modellens tal ─────────────────────────────────────── */
const C_MAKS  = 10;                 // mmol/L — skydernes øverste værdi
const PR_MMOL = 5;                  // tegnede molekyler pr. mmol/L på én side
const N       = C_MAKS * PR_MMOL * 2 + 4;

const T_TIL = 0.35, T_LUK = 0.45, T_ÅBEN = 0.35, T_SLIP = 0.35;
const T_CYKLUS = T_TIL + T_LUK + T_ÅBEN + T_SLIP;   // s — én fuld omgang

const KM   = 3;                 // mmol/L — halvt mættet ved denne forskel
const VMAX = 1 / T_CYKLUS;      // omgange/s — proteinets øverste fart
const K_ON = VMAX / KM;         // bindingsrate pr. mmol/L, mens proteinet er ledigt

const VAND  = 5.0;    // nm vand tegnet på hver side
const ZONE  = 1.6;    // nm fra membranen, hvor puljen holder sig tættest
const FART  = 2.2;    // nm/s — glukose er stort og driver langsommere end ilt
const DOCK  = 0.55;   // nm — hvor langt fra membranens midte lommen sidder

const OVER = MÅL.tykkelse / 2 + MÅL.hoved * 0.85;
const KANT = MÅL.bredde / 2 - 0.6;

const R_KUGLE = 0.26;   // nm — glukose tegnet som én kugle, ikke atomer

/* Ringens radius, ligesom kanalens låg — men her betyder "lukket"
   ikke stængt, det betyder at proteinet er midt i sit formskift. */
const ÅBEN_R = 0.98, LUKKET_R = 0.55, DREJ = 0.30;

/* ── Faser for den ene, der lige nu bæres igennem ─────────── */
const LEDIG = 0, TIL = 1, LUKKET = 2, ÅBEN = 3, SLIP = 4;

/* ── Puljen af glukosemolekyler, der driver rundt i vandet ── */
const px = new Float32Array(N), py = new Float32Array(N), pz = new Float32Array(N);
const vx = new Float32Array(N), vy = new Float32Array(N), vz = new Float32Array(N);
const side  = new Int8Array(N);
const aktiv = new Uint8Array(N);
const skrevet = {ude:-1, inde:-1};

let kugler = null, gruppe = null, materiale = null;
let spærret = [];
let helixer = [];
let baerer = null, baererX = 0, baererZ = 0;
let glukStof = null;

let fase = LEDIG, u = 0, bærerI = -1, bærerSide = 1;
let akk = 0, lukVis = 0;
const fra = {x:0, y:0, z:0}, til = {x:0, y:0, z:0};

const _m = new THREE.Matrix4();
const SKJULT = new THREE.Matrix4().makeScale(0, 0, 0);

/* ── Små hjælpere ──────────────────────────────────────── */
const mellem = (a, b) => a + Math.random() * (b - a);
const blødt  = v => v * v * (3 - 2 * v);

function saetUd(i, s){
  px[i] = mellem(-KANT, KANT);
  pz[i] = mellem(-KANT, KANT);
  py[i] = s * mellem(OVER + 0.3, OVER + VAND);
  const a = Math.random() * Math.PI * 2, h = mellem(-1, 1);
  const c = Math.sqrt(1 - h * h);
  vx[i] = Math.cos(a) * c * FART; vy[i] = h * FART; vz[i] = Math.sin(a) * c * FART;
  side[i] = s;
}

function tælSide(s){
  let n = 0;
  for(let i = 0; i < N; i++) if(aktiv[i] && side[i] === s && i !== bærerI) n++;
  return n;
}

function slukEt(s){
  for(let i = 0; i < N; i++){
    if(aktiv[i] && side[i] === s && i !== bærerI){ aktiv[i] = 0; return true; }
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

/** Nærmeste ledige molekyle på siden `s`, tættest på transportøren —
    det er det, der finder vejen ind i lommen, ligesom ved kanalen. */
function nærmeste(s){
  let bedst = -1, kortest = Infinity;
  for(let i = 0; i < N; i++){
    if(!aktiv[i] || i === bærerI || side[i] !== s) continue;
    const d = (px[i] - baererX) ** 2 + (Math.abs(py[i]) - (OVER + DOCK)) ** 2 + (pz[i] - baererZ) ** 2;
    if(d < kortest){ kortest = d; bedst = i; }
  }
  return bedst;
}

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

function glidTil(k){
  px[bærerI] = fra.x + (til.x - fra.x) * k;
  py[bærerI] = fra.y + (til.y - fra.y) * k;
  pz[bærerI] = fra.z + (til.z - fra.z) * k;
}

function nytMål(x, y, z){
  fra.x = px[bærerI]; fra.y = py[bærerI]; fra.z = pz[bærerI];
  til.x = x; til.y = y; til.z = z;
}

/** Proteinets ringradius — samme greb som kanalens låg, men her er
    "lukket" en occluded mellemtilstand, ikke en stængt kanal. */
function sætForm(l){
  for(const H of helixer){
    const a = H.vinkel + DREJ * l;
    const r = ÅBEN_R + (LUKKET_R - ÅBEN_R) * l;
    H.mesh.position.set(Math.cos(a) * r, H.grund.y, Math.sin(a) * r);
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
  beskrivelse:'Glukose er både for stor og for polær til lipidlaget. Et transportprotein binder ét molekyle ad gangen og skifter form, så molekylet slippes ud på den anden side. Stadig passivt — men langsommere end en kanal, og det kan mættes, når det ene protein allerede er optaget af et andet molekyle.',

  byg(ctx){
    glukStof = ctx.tilstand.stof.glukose;

    baerer = ctx.membran.findProtein('baerer');
    baererX = baerer.objekt.position.x;
    baererZ = baerer.objekt.position.z;
    spærret = ctx.membran.proteiner.filter(p => p.r > 0);

    helixer = [];
    baerer.objekt.traverse(o => {
      if(o.userData.grundvinkel !== undefined){
        helixer.push({mesh:o, vinkel:o.userData.grundvinkel, grund:o.position.clone()});
      }
    });

    materiale = new THREE.MeshStandardMaterial({
      color:findMolekyle('glukose').farve, roughness:0.32, metalness:0.05});
    kugler = new THREE.InstancedMesh(new THREE.SphereGeometry(R_KUGLE, 12, 9), materiale, N);
    kugler.frustumCulled = false;

    gruppe = new THREE.Group();
    gruppe.userData.delId = 'stof:glukose';
    gruppe.add(kugler);
    ctx.membran.gruppe.add(gruppe);
    ctx.membran.tilfoejDel('stof:glukose', [materiale]);

    for(let i = 0; i < N; i++){ saetUd(i, i % 2 ? 1 : -1); aktiv[i] = 0; }
    justér( 1, Math.round(glukStof.ude  * PR_MMOL), true);
    justér(-1, Math.round(glukStof.inde * PR_MMOL), true);
    skrevet.ude = glukStof.ude; skrevet.inde = glukStof.inde;

    fase = LEDIG; u = 0; bærerI = -1; akk = 0; lukVis = 0;
    sætForm(0);
    tegn();
  },

  opdater(t, dt, ctx){
    baererX = baerer.objekt.position.x;
    baererZ = baerer.objekt.position.z;

    /* Har eleven flyttet en skyder? Så skal puljen følge med med
       det samme — men aldrig det molekyle, der er midt i en tur. */
    if(Math.abs(glukStof.ude - skrevet.ude) > 1e-9 || Math.abs(glukStof.inde - skrevet.inde) > 1e-9){
      justér( 1, Math.round(glukStof.ude  * PR_MMOL), true);
      justér(-1, Math.round(glukStof.inde * PR_MMOL), true);
    }

    if(dt > 0){
      /* ── Transportøren ─────────────────────────────── *
       * Kun mens den er ledig, tæller tiden med til næste forsøg —
       * optaget kan den ikke tage imod et molekyle mere. Det er
       * netop det, der giver mætningen: se hoved-kommentaren. */
      if(fase === LEDIG){
        akk += K_ON * (glukStof.ude + glukStof.inde) * dt;
        if(akk >= 1){
          akk = 0;
          const andelUde = (glukStof.ude + glukStof.inde) > 0
            ? glukStof.ude / (glukStof.ude + glukStof.inde) : 0.5;
          const s = Math.random() < andelUde ? 1 : -1;
          const i = nærmeste(s);
          if(i >= 0){
            bærerI = i; bærerSide = s; fase = TIL; u = 0;
            nytMål(baererX, s * (OVER + DOCK), baererZ);
          }
        }
      } else {
        u += dt;
        if(fase === TIL){
          glidTil(blødt(Math.min(1, u / T_TIL)));
          if(u >= T_TIL){ u = 0; fase = LUKKET; nytMål(baererX, 0, baererZ); }

        } else if(fase === LUKKET){
          glidTil(blødt(Math.min(1, u / T_LUK)));
          if(u >= T_LUK){
            u = 0; fase = ÅBEN;
            nytMål(baererX, -bærerSide * (OVER + DOCK), baererZ);
          }

        } else if(fase === ÅBEN){
          glidTil(blødt(Math.min(1, u / T_ÅBEN)));
          if(u >= T_ÅBEN){
            /* Molekylet er nu fremme på den anden side — det tæller
               med i puljen dér fra dette øjeblik. Koncentrationen
               er ikke sit eget tal her, som hos kanalen: den er
               simpelthen antallet, der er talt op, delt med PR_MMOL,
               præcis som ved simpel diffusion. */
            side[bærerI] = -bærerSide;
            const [x, z] = friPlads(baererX + mellem(-2, 2), baererZ + mellem(-2, 2));
            u = 0; fase = SLIP;
            nytMål(x, -bærerSide * (OVER + 0.4), z);
          }

        } else if(fase === SLIP){
          glidTil(blødt(Math.min(1, u / T_SLIP)));
          if(u >= T_SLIP){
            const a = Math.random() * Math.PI * 2, h = mellem(-1, 1), c = Math.sqrt(1 - h * h);
            vx[bærerI] = Math.cos(a) * c * FART;
            vy[bærerI] = h * FART;
            vz[bærerI] = Math.sin(a) * c * FART;
            fase = LEDIG; u = 0; bærerI = -1;
          }
        }
      }

      /* ── Formen, rent visuelt ─────────────────────────── *
       * Kun "lukket" i selve LUKKET-fasen — i TIL og ÅBEN er der
       * allerede en side, molekylet glider ind eller ud af. */
      const målLuk = fase === LUKKET ? 1 : 0;
      lukVis += (målLuk - lukVis) * Math.min(1, dt * 7);
      sætForm(lukVis);

      /* ── Baggrundspuljen vandrer som sædvanlig ────────── */
      const drej = Math.min(1, dt * 4.5);
      for(let i = 0; i < N; i++){
        if(!aktiv[i] || i === bærerI) continue;
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
        const nær = s * (OVER + 0.3), fjern = s * (OVER + ZONE + VAND);
        if(s * py[i] < s * nær)  { py[i] = nær;   vy[i] =  s * Math.abs(vy[i]); }
        if(s * py[i] > s * fjern){ py[i] = fjern; vy[i] = -s * Math.abs(vy[i]); }

        const [fx, fz] = friPlads(px[i], pz[i]);
        px[i] = fx; pz[i] = fz;
      }
    }

    /* Holdes glukose fast, forbruger og tilfører cellen, så
       antallet passer igen — det molekyle, der er midt i en tur,
       røres ikke. Ellers er systemet lukket, og koncentrationerne
       er simpelthen dét, molekylerne viser, ligesom ved diffusion. */
    if(ctx.tilstand.fast){
      justér( 1, Math.round(glukStof.ude  * PR_MMOL), false);
      justér(-1, Math.round(glukStof.inde * PR_MMOL), false);
    } else {
      glukStof.ude  = tælSide( 1) / PR_MMOL;
      glukStof.inde = tælSide(-1) / PR_MMOL;
    }
    skrevet.ude = glukStof.ude; skrevet.inde = glukStof.inde;

    tegn();
  },

  aflaes(){
    /* Samme udledning som i hoved-kommentaren: mens proteinet er
       ledigt, er ventetiden til næste forsøg eksponentialfordelt med
       rate K_ON·C. Lagt sammen med den faste transporttid T_CYKLUS
       giver det en middelgennemløbstid — og dermed en strøm — der
       flader ud mod Vmax, præcis som Michaelis-Menten-kinetik. */
    const λ = K_ON * (glukStof.ude + glukStof.inde);
    const total = λ / (1 + λ * T_CYKLUS);
    const andelUde = (glukStof.ude + glukStof.inde) > 0
      ? glukStof.ude / (glukStof.ude + glukStof.inde) : 0;
    const indad = total * andelUde;
    const udad  = total * (1 - andelUde);
    const netto = indad - udad;
    const en = v => v.toFixed(2).replace('.', ',');

    return [
      {mærkat:'Glukose ind i cellen', værdi:en(indad), enhed:'molekyler/s'},
      {mærkat:'Glukose ud af cellen', værdi:en(udad),  enhed:'molekyler/s'},
      Math.abs(netto) < 0.01
        ? {mærkat:'Nettostrøm glukose', værdi:'0', enhed:'ligevægt'}
        : {mærkat:'Nettostrøm glukose', værdi:en(Math.abs(netto)),
           enhed:netto > 0 ? 'molekyler/s ind i cellen' : 'molekyler/s ud af cellen'},
    ];
  },

  ryd(ctx){
    if(!gruppe) return;
    sætForm(0);
    ctx.membran.gruppe.remove(gruppe);
    kugler.geometry.dispose();
    materiale.dispose();
    gruppe = kugler = materiale = null; helixer = [];
  },
});

function tegn(){
  for(let i = 0; i < N; i++){
    if(!aktiv[i]){ kugler.setMatrixAt(i, SKJULT); continue; }
    kugler.setMatrixAt(i, _m.makeTranslation(px[i], py[i], pz[i]));
  }
  kugler.instanceMatrix.needsUpdate = true;
}
