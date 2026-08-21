/* ═══════════════════════════════════════════════════════════
   struktur.js — selve membranen.

   Bygger fosfolipid-dobbeltlaget, kolesterolet, proteinerne og
   kulhydratkæderne. Alle mål er i nanometer, så 1 enhed = 1 nm:
   membranen er ca. 5 nm tyk, et fosfolipidhoved ca. 0,9 nm bredt.

   Modulet kender ikke til transport — det leverer kun stilladset
   og fortæller, hvor proteinerne står, så transport-*.js kan
   hænge molekyler op på dem.
   ═══════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import {ROLIG} from './model.js';

/* ── Mål ───────────────────────────────────────────────── */
export const MÅL = {
  bredde:   20,     // nm på tværs af membranstykket
  tykkelse: 4.6,    // nm fra hovedmidte til hovedmidte
  afstand:  1.05,   // nm mellem to fosfolipider
  hoved:    0.40,   // nm, hovedets radius — lidt luft imellem, så man
                    // kan se ned mellem hovederne til halerne
};

/* Farverne skal kunne aflæses mod den mørke baggrund og går igen
   i signaturforklaringen nederst på siden (.facts i membran.html).
   Blå = hydrofil (kan lide vand), gul/olieagtig = hydrofob. */
export const FARVER = {
  hoved:      0x7EC8E8,
  hale:       0xF2C14E,
  kolesterol: 0xB9E08A,
  kanal:      0xC9A9F0,
  baerer:     0xFFAE8A,
  pumpe:      0xFF7FA8,
  glyko:      0x3E9E92,   /* dybere end sukkerkæderne, men samme familie */
  perifert:   0xE8E0CF,
  sukker:     0x7FE3D0,
};

/* ── De dele, der ikke er proteiner ────────────────────── *
 * Teksterne herunder er dem, eleven får at se, når en del
 * udpeges. De hører til her sammen med figuren, ikke i koden
 * der tegner ruden.                                          */
export const DELE = {
  hoved:{
    navn:'Hydrofilt hoved', type:'Fosfolipid',
    beskrivelse:'Fosfatgruppen er polær og vender ud mod vandet — på begge sider af membranen. Det er derfor, fosfolipiderne helt af sig selv lægger sig som et dobbeltlag, når de kommer i vand.',
  },
  hale:{
    navn:'Hydrofob hale', type:'Fosfolipid',
    beskrivelse:'To fedtsyrekæder, upolære, der vender væk fra vandet og ind mod hinanden. Dette lag er selve barrieren: ioner og store polære molekyler kommer ikke igennem her uden hjælp.',
  },
  kolesterol:{
    navn:'Kolesterol', type:'Lipid',
    beskrivelse:'Sidder klemt ind mellem fosfolipiderne med sin OH-gruppe oppe ved hovederne. Det holder membranen passende flydende: mindre flydende når der er varmt, mere flydende når der er koldt.',
  },
  sukker:{
    navn:'Kulhydratkæde', type:'Glykolipid og glykoprotein',
    beskrivelse:'Forgrenede sukkerkæder, der kun sidder på ydersiden. De er cellens ydre kendetegn — dem immunforsvaret aflæser, og dem blodtyperne bygger på.',
  },
};

/* ── Proteinernes plads i membranen ────────────────────── *
 * x,z = position i membranplanet. r = hvor stor en radius de
 * skubber fosfolipiderne væk fra. side: 'ud' | 'ind' for de
 * perifere, der kun ligger på overfladen.                   */
export const PROTEINER = [
  {id:'kanal',   slags:'kanal',        x:-6.4, z:-3.8, r:1.7,
   navn:'Kanalprotein', type:'Integralt membranprotein',
   beskrivelse:'En tønde af helixer med en vandfyldt pore i midten. Ioner glider igennem med koncentrationsgradienten — passiv transport, og meget hurtig: millioner af ioner i sekundet.'},

  {id:'baerer',  slags:'baerer',       x: 1.4, z: 5.0, r:1.8,
   navn:'Transportprotein', type:'Integralt membranprotein',
   beskrivelse:'Binder ét molekyle ad gangen og skifter form for at slippe det ud på den anden side. Også passivt, men langsommere end en kanal — og det kan mættes, når alle proteiner er i brug.'},

  {id:'pumpe',   slags:'pumpe',        x: 6.6, z:-2.4, r:2.4,
   navn:'Na⁺/K⁺-pumpen', type:'Integralt membranprotein',
   beskrivelse:'Flytter 3 Na⁺ ud og 2 K⁺ ind — mod koncentrationsgradienten. Det koster ATP, og derfor er det aktiv transport. De tre klumper nede i cytosolen er pumpens motor: ATP binder i kløften mellem de to yderste, og hver gang det spaltes, skifter pumpen form.'},

  {id:'glyko',   slags:'glykoprotein', x:-2.4, z:-7.4, r:1.2,
   navn:'Glykoprotein', type:'Integralt membranprotein',
   beskrivelse:'Et membranprotein med forgrenede kulhydratkæder på ydersiden. Kæderne er cellens ydre kendetegn — dem immunforsvaret aflæser, når det skal skelne cellens egne celler fra fremmede.'},

  {id:'perifer-ind', slags:'perifert', x: 5.4, z: 6.2, r:0, side:'ind',
   navn:'Perifert protein (cytosolsiden)', type:'Perifert membranprotein',
   beskrivelse:'Sidder løst på membranens overflade uden at gå igennem. Mange af dem hører til cellens indre skelet eller til de signalveje, der starter ved membranen.'},

  {id:'perifer-ud', slags:'perifert',  x:-7.2, z: 4.6, r:0, side:'ud',
   navn:'Perifert protein (ydersiden)', type:'Perifert membranprotein',
   beskrivelse:'Sidder på ydersiden uden at gå igennem membranen — fx enzymer og molekyler, der binder cellen fast til vævet omkring den.'},
];

/** Slår en del op, uanset om det er et protein eller en lipiddel. */
export function beskriv(delId){
  return DELE[delId] ?? PROTEINER.find(p => p.id === delId) ?? null;
}

/* ═══════════════════════════════════════════════════════════
   Små hjælpere til geometrien
   ═══════════════════════════════════════════════════════════ */

/* En alfahelix som et rør, der snor sig op om sin egen akse.
   Pænere og mere ærligt end en glat cylinder. */
function helix(højde, radius, vindinger, tråd){
  const n = Math.round(vindinger * 11);
  const punkter = [];
  for(let i = 0; i <= n; i++){
    const u = i / n, a = u * vindinger * Math.PI * 2;
    punkter.push(new THREE.Vector3(
      Math.cos(a) * radius,
      -højde / 2 + u * højde,
      Math.sin(a) * radius
    ));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(punkter), n, tråd, 6, false);
}

/* Et bundt helixer stillet op i en ring — sådan ser et rigtigt
   membranprotein ud i tværsnit, og midten bliver til poren. */
function helixbundt({antal, ringR, højde, materiale, hældning = 0}){
  const g = new THREE.Group();
  const geo = helix(højde, 0.25, 3.4, 0.125);
  for(let i = 0; i < antal; i++){
    const a = i / antal * Math.PI * 2;
    const m = new THREE.Mesh(geo, materiale);
    m.position.set(Math.cos(a) * ringR, 0, Math.sin(a) * ringR);
    /* Vip toppen udad, så poren bliver tragtformet. Aksen er
       tangenten til ringen; negativt fortegn vipper udad. */
    if(hældning){
      m.quaternion.setFromAxisAngle(
        new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)), -hældning);
    }
    m.userData.grundvinkel = a;
    g.add(m);
  }
  return g;
}

/* En uregelmæssig, kugleformet klump — sådan tegner man et
   proteindomæne, når man viser overfladen frem for helixerne.
   Formen laves ved at trække en kugle ind og ud efter et blødt
   bølgefelt: nabopunkter flytter sig næsten ens, så klumpen får
   runde buler frem for at se hakket ud. `frø` forskyder feltet, så
   to klumper ikke er ens — men den samme klump er ens hver gang,
   for et protein må ikke skifte form fra indlæsning til indlæsning. */
function klump(materiale, {skala = [1, 1, 1], ryst = 0.26, frø = 1}){
  const geo = new THREE.SphereGeometry(1, 22, 14);
  const pos = geo.attributes.position;
  const f = 1 + frø * 0.37;
  for(let i = 0; i < pos.count; i++){
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const k = 1 + ryst * (
      0.62 * Math.sin(x * 2.3 + f)        * Math.sin(y * 1.9 - f) +
      0.38 * Math.sin(z * 3.1 - f * 1.7)  * Math.sin(x * 2.7 + f * 0.6));
    pos.setXYZ(i, x * k, y * k, z * k);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, materiale);
  m.scale.set(...skala);
  return m;
}

/* En tynd stav mellem to punkter — bruges til sukkerkædernes bindinger. */
function stav(a, b, r, materiale){
  const retning = new THREE.Vector3().subVectors(b, a);
  const længde = retning.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, længde, 5), materiale);
  m.position.copy(a).addScaledVector(retning, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), retning.normalize());
  return m;
}

/* En forgrenet kulhydratkæde. Dybde 2 giver 7 sukkerenheder —
   nok til at det ligner et træ uden at koste noget. */
function sukkerkæde({dybde = 2, længde = 0.62, radius = 0.19, materiale}){
  const g = new THREE.Group();
  const kugle = new THREE.SphereGeometry(1, 8, 6);

  (function gren(fra, retning, dyb, r){
    const til = fra.clone().addScaledVector(retning, længde);
    g.add(stav(fra, til, 0.055, materiale));
    const k = new THREE.Mesh(kugle, materiale);
    k.position.copy(til); k.scale.setScalar(r);
    g.add(k);
    if(dyb <= 0) return;
    for(const drej of [-0.6, 0.6]){
      const ny = retning.clone()
        .applyAxisAngle(new THREE.Vector3(0, 0, 1), drej)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), drej * 1.9)
        .normalize();
      gren(til, ny, dyb - 1, r * 0.86);
    }
  })(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), dybde, radius);

  return g;
}

/* ═══════════════════════════════════════════════════════════
   Na⁺/K⁺-pumpen

   Pumpen er sidens største og vigtigste protein, og dens form er
   selv fagligt indhold. Derfor bygges den ikke som de andre — en
   ring af ens helixer — men efter den form, Na⁺/K⁺-ATPasen
   faktisk har, sådan som den ses i illustrationer af strukturen:

     α-underenheden  10 transmembranhelixer i et skævt pakket
                     bundt, og nede i cytosolen tre domæner:
                     N binder ATP, P bliver fosforyleret, og A
                     drejer pumpen mellem de to former. Det er
                     dem, der giver pumpen dens tunge hoved
                     forneden — og det er dét, der adskiller den
                     fra en kanal ved første øjekast.
     β-underenheden  én helix ude i kanten af bundtet og en stor
                     kugleformet del på ydersiden med sukkerkæde.

   Tallene er en skitse af formen, ikke koordinater fra en
   krystalstruktur. Målene passer: pumpen fylder ca. 12 nm fra
   sukkerkæden øverst til N-domænet nederst, hvoraf membranen kun
   er de 4,6 i midten.
   ═══════════════════════════════════════════════════════════ */

/* α-underenhedens transmembranhelixer. v = vinkel i omgange,
   r = afstand fra ionvejen, y = højdeskub, h = hældning udad.
   De fire inderste står så tæt, at der ikke er hul igennem — en
   pumpe er netop aldrig åben på begge sider samtidig, og dét er
   forskellen på den og kanalproteinet ved siden af. */
const PUMPE_TM = [
  {v:0.03, r:0.48, y: 0.20, h:0.03},
  {v:0.30, r:0.56, y:-0.12, h:0.05},
  {v:0.62, r:0.52, y: 0.08, h:0.04},
  {v:0.86, r:0.62, y: 0.24, h:0.02},

  {v:0.10, r:1.24, y:-0.18, h:0.15},
  {v:0.20, r:1.34, y: 0.10, h:0.18},
  {v:0.41, r:1.18, y: 0.02, h:0.13},
  {v:0.50, r:1.32, y:-0.22, h:0.17},
  {v:0.71, r:1.28, y: 0.16, h:0.16},
  {v:0.95, r:1.16, y:-0.06, h:0.12},
];

/* De tre cytosoldomæner. s er halvakserne, drej vipper klumpen,
   så de tre ikke ligger på linje. N ligger yderst for enden af
   stilken — kløften mellem N og P er der, ATP'et binder. */
const PUMPE_DOMÆNER = [
  {id:'P', x: 0.05, y:-4.05, z: 0.10, s:[1.62, 0.90, 1.40], drej: 0.10, frø: 7},
  {id:'A', x:-1.50, y:-3.95, z:-0.90, s:[1.05, 0.85, 0.95], drej:-0.40, frø:19},
  {id:'N', x: 0.80, y:-5.75, z: 0.40, s:[1.40, 1.24, 1.18], drej: 0.28, frø:31},
];

const PUMPE_BETA = 0.72;   // β-helixens vinkel, i omgange

function byggPumpe({materiale, sukkerMateriale, T}){
  const g = new THREE.Group();
  const sukkerkæder = [];
  const højde = T + 2.0;
  /* Tykkere tråd end sidens andre proteiner: pumpen skal se ud som
     ét pakket bundt, ikke som løse tråde ved siden af de massive
     domæner nedenunder. */
  const geo = helix(højde, 0.24, højde * 0.5, 0.165);
  const akse = new THREE.Vector3();

  /* ── α: bundtet gennem membranen ─────────────────────── *
   * Skubbet en anelse ned, fordi pumpen rager meget længere ud
   * på cytosolsiden end på ydersiden — også dét er sådan, den
   * ser ud i virkeligheden.                                   */
  for(const H of PUMPE_TM){
    const a = H.v * Math.PI * 2;
    const m = new THREE.Mesh(geo, materiale);
    m.position.set(Math.cos(a) * H.r, H.y - 0.45, Math.sin(a) * H.r);
    m.quaternion.setFromAxisAngle(akse.set(-Math.sin(a), 0, Math.cos(a)), -H.h);
    /* Trin 9 vipper stavene mellem pumpens to former. Vinklen i
       ringen er det, hældningen skal regnes ud fra — samme hage som
       `grundvinkel` på kanalproteinet, og struktur.js behøver
       stadig ikke vide, at der findes transport. */
    m.userData.pumpeStav = a;
    g.add(m);
  }

  /* ── α: hovedet nede i cytosolen ─────────────────────── */
  const domæner = {};
  for(const D of PUMPE_DOMÆNER){
    const k = klump(materiale, {skala:D.s, ryst:0.26, frø:D.frø});
    k.position.set(D.x, D.y, D.z);
    k.rotation.set(D.drej * 0.6, D.drej, D.drej * 0.4);
    k.userData.pumpeDomæne = D.id;
    g.add(k);
    domæner[D.id] = k;
  }
  const atpSted = domæner.N.position.clone();
  /* Halsen mellem P og N — hængslet, der lukker sig om ATP'et. */
  g.add(stav(new THREE.Vector3(0.25, -4.50, 0.15),
             new THREE.Vector3(0.70, -5.35, 0.35), 0.38, materiale));

  /* ── β: helix i kanten, kugle og sukker på ydersiden ─── */
  {
    const a = PUMPE_BETA * Math.PI * 2;
    const m = new THREE.Mesh(geo, materiale);
    m.position.set(Math.cos(a) * 1.80, 0.70, Math.sin(a) * 1.80);
    g.add(m);

    const kugle = klump(materiale, {skala:[1.05, 0.92, 0.98], ryst:0.30, frø:41});
    kugle.position.set(Math.cos(a) * 1.60, 3.95, Math.sin(a) * 1.60);
    g.add(kugle);

    const kæde = sukkerkæde({dybde:1, længde:0.5, radius:0.15, materiale:sukkerMateriale});
    kæde.position.set(kugle.position.x, kugle.position.y + 0.80, kugle.position.z);
    kæde.userData.delId = 'sukker';
    g.add(kæde);
    sukkerkæder.push(kæde);
  }

  return {gruppe:g, sukkerkæder, atpSted, pSted:domæner.P.position.clone()};
}

/* ═══════════════════════════════════════════════════════════
   Membranen
   ═══════════════════════════════════════════════════════════ */
export function byggMembran(scene){
  const {bredde:B, tykkelse:T, afstand:A, hoved:HR} = MÅL;
  const gruppe = new THREE.Group();
  scene.add(gruppe);

  /* ── Materialer ──────────────────────────────────────── */
  const mat = {
    hoved:      new THREE.MeshStandardMaterial({color:FARVER.hoved,      roughness:0.34, metalness:0.05}),
    hale:       new THREE.MeshStandardMaterial({color:FARVER.hale,       roughness:0.78, metalness:0.00}),
    kolesterol: new THREE.MeshStandardMaterial({color:FARVER.kolesterol, roughness:0.55, metalness:0.00}),
    kanal:      new THREE.MeshStandardMaterial({color:FARVER.kanal,      roughness:0.50, metalness:0.06}),
    baerer:     new THREE.MeshStandardMaterial({color:FARVER.baerer,     roughness:0.50, metalness:0.06}),
    pumpe:      new THREE.MeshStandardMaterial({color:FARVER.pumpe,      roughness:0.48, metalness:0.06}),
    perifert:   new THREE.MeshStandardMaterial({color:FARVER.perifert,   roughness:0.62, metalness:0.02}),
    glyko:      new THREE.MeshStandardMaterial({color:FARVER.glyko,      roughness:0.50, metalness:0.06}),
    sukker:     new THREE.MeshStandardMaterial({color:FARVER.sukker,     roughness:0.42, metalness:0.04}),
  };

  /* Hvilke materialer hører til hvilken udpegelig del? Bruges til
     at lade den valgte del lyse op — ét opslag pr. skift, ikke
     noget der skal regnes i hvert billede. */
  const delMaterialer = {
    hoved:      [mat.hoved],
    hale:       [mat.hale],
    kolesterol: [mat.kolesterol],
    sukker:     [mat.sukker],
  };

  /* ── Hvor er der ikke plads til fosfolipider? ────────── */
  const spærret = PROTEINER.filter(p => p.r > 0);
  const optaget = (x, z) => spærret.some(p =>
    (x - p.x) ** 2 + (z - p.z) ** 2 < p.r ** 2);

  /* ── Fosfolipiderne ──────────────────────────────────── *
   * Rækkerne forskydes en halv afstand, så pakningen bliver
   * sekskantet ligesom i en rigtig membran.                */
  const lipider = [];
  const rækkeafstand = A * 0.87;
  const rækker = Math.floor(B / rækkeafstand);
  const søjler = Math.floor(B / A);

  for(let r = 0; r <= rækker; r++){
    const z = -B / 2 + r * rækkeafstand;
    const skub = (r % 2) * A / 2;
    for(let c = 0; c <= søjler; c++){
      const x = -B / 2 + c * A + skub;
      if(Math.abs(x) > B / 2 || optaget(x, z)) continue;
      for(const side of [1, -1]){
        lipider.push({
          x: x + (Math.random() - 0.5) * 0.22,
          z: z + (Math.random() - 0.5) * 0.22,
          side,
          fase: Math.random() * Math.PI * 2,
          drej: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  const N = lipider.length;
  const HALE_L = (T / 2 - HR * 0.55) - 0.12;      // halens længde
  const HALE_Y = (T / 2 - HR * 0.55 + 0.12) / 2;  // halens midte over 0

  const hoveder = new THREE.InstancedMesh(
    new THREE.SphereGeometry(HR, 12, 8), mat.hoved, N);
  const haleGeo = new THREE.CylinderGeometry(0.15, 0.10, HALE_L, 6);
  const haleA = new THREE.InstancedMesh(haleGeo, mat.hale, N);
  const haleB = new THREE.InstancedMesh(haleGeo, mat.hale, N);
  gruppe.add(hoveder, haleA, haleB);
  hoveder.userData.delId = 'hoved';
  haleA.userData.delId = haleB.userData.delId = 'hale';

  /* Halernes drejning og sideforskydning ændrer sig ikke undervejs,
     så de regnes én gang og læses fra en tabel i hvert billede. */
  const qA = new Float32Array(N * 4), qB = new Float32Array(N * 4);
  const oA = new Float32Array(N * 2), oB = new Float32Array(N * 2);
  const grundX = new Float32Array(N), grundZ = new Float32Array(N);
  const side   = new Int8Array(N),    fase    = new Float32Array(N);
  {
    const yAkse = new THREE.Vector3(0, 1, 0), zAkse = new THREE.Vector3(0, 0, 1);
    const qy = new THREE.Quaternion(), qz = new THREE.Quaternion(), q = new THREE.Quaternion();
    const off = new THREE.Vector3();
    lipider.forEach((L, i) => {
      grundX[i] = L.x; grundZ[i] = L.z; side[i] = L.side; fase[i] = L.fase;
      qy.setFromAxisAngle(yAkse, L.drej);
      for(const [tal, qArr, oArr, vip] of
          [[0, qA, oA, 0.085], [1, qB, oB, -0.085]]){
        qz.setFromAxisAngle(zAkse, L.side * vip);
        q.copy(qy).multiply(qz).toArray(qArr, i * 4);
        off.set(tal === 0 ? 0.17 : -0.17, 0, 0).applyQuaternion(qy);
        oArr[i * 2] = off.x; oArr[i * 2 + 1] = off.z;
      }
    });
  }

  /* ── Kolesterol ──────────────────────────────────────── *
   * Sidder klemt ind mellem fosfolipiderne, kortere end dem, og
   * stiver membranen af. Ca. hvert sjette sted.              */
  const kolesterolPladser = [];
  for(let i = 0; i < N; i += 6){
    kolesterolPladser.push({
      x: grundX[i] + A * 0.52, z: grundZ[i] + A * 0.40,
      side: side[i], fase: fase[i],
    });
  }
  /* Kolesterol er kortere end fosfolipiderne og sidder højt oppe i
     halelaget: OH-gruppen ligger i højde med fosfathovederne, mens
     ringsystemet stiver de øverste haler af. */
  const KO = kolesterolPladser.length;
  const KO_H = 1.05, KO_Y = 1.54;
  const kolKrop = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.16, 0.13, KO_H, 7), mat.kolesterol, KO);
  const kolOH = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.15, 8, 6), mat.kolesterol, KO);
  const kolesterol = new THREE.Group();
  kolesterol.add(kolKrop, kolOH);
  kolesterol.userData.delId = 'kolesterol';
  gruppe.add(kolesterol);

  /* ── Proteinerne ─────────────────────────────────────── *
   * Sukkerkæderne hænger på det, de sidder fast i — kæden på et
   * glykoprotein skal drive med rundt, når proteinet gør. De
   * samles derfor i en liste frem for i én fælles gruppe, så de
   * stadig kan slås til og fra under ét.                      */
  const sukkerdele = [];
  const proteiner = [];

  for(const P of PROTEINER){
    const g = new THREE.Group();
    g.position.set(P.x, 0, P.z);
    g.userData.delId = P.id;

    /* Hvert protein får sit eget materiale — ellers kan ét af dem
       ikke lyse op uden at trække de andre med. */
    const pm = mat[P.slags === 'glykoprotein' ? 'glyko' : P.slags].clone();
    delMaterialer[P.id] = [pm];

    /* Proteinerne rager et stykke ud på begge sider — sådan er de
       også i virkeligheden, og ellers forsvinder de i lipidlaget. */
    if(P.slags === 'kanal'){
      g.add(helixbundt({antal:5, ringR:0.80, højde:T + 2.1, materiale:pm, hældning:0.13}));

    } else if(P.slags === 'baerer'){
      g.add(helixbundt({antal:8, ringR:0.98, højde:T + 1.8, materiale:pm, hældning:0.05}));

    } else if(P.slags === 'pumpe'){
      const pumpe = byggPumpe({materiale:pm, sukkerMateriale:mat.sukker, T});
      g.add(pumpe.gruppe);
      for(const k of pumpe.sukkerkæder) sukkerdele.push(k);
      /* Hvor ligger N- og P-domænet? Trin 9 hænger et ATP-molekyle op
         i kløften ved N og lader fosfatgruppen flyve over på P, når
         det spaltes — det er dét, der driver formskiftet. */
      g.userData.atpSted = pumpe.atpSted;
      g.userData.pSted   = pumpe.pSted;

    } else if(P.slags === 'glykoprotein'){
      g.add(helixbundt({antal:3, ringR:0.46, højde:T + 1.6, materiale:pm, hældning:0.06}));
      const kæde = sukkerkæde({materiale:mat.sukker});
      kæde.position.set(0, T / 2 + 0.85, 0);
      kæde.userData.delId = 'sukker';
      g.add(kæde);
      sukkerdele.push(kæde);

    } else if(P.slags === 'perifert'){
      const s = P.side === 'ind' ? -1 : 1;
      const k = klump(pm, {skala:[1.04, 0.70, 0.90], ryst:0.28,
                           frø:P.side === 'ind' ? 3 : 23});
      k.position.set(0, s * (T / 2 + 0.55), 0);
      g.add(k);
    }

    gruppe.add(g);
    proteiner.push({...P, objekt:g, materiale:pm, fase:Math.random() * Math.PI * 2});
  }

  /* ── Glykolipider: sukkerkæder på almindelige fosfolipider ──
     Kun på ydersiden — sukkeret vender altid ud mod omgivelserne. */
  const glykolipider = [];
  {
    const ydre = [];
    for(let i = 0; i < N; i++) if(side[i] === 1) ydre.push(i);
    const skridt = Math.max(1, Math.floor(ydre.length / 8));
    for(let k = 0; k < ydre.length; k += skridt){
      const i = ydre[k];
      const kæde = sukkerkæde({dybde:1, længde:0.5, radius:0.15, materiale:mat.sukker});
      kæde.position.set(grundX[i], T / 2 + HR * 0.6, grundZ[i]);
      kæde.userData.delId = 'sukker';
      gruppe.add(kæde);
      sukkerdele.push(kæde);
      glykolipider.push({kæde, i});
    }
  }

  /* ═════════════════════════════════════════════════════
     Bevægelsen — membranen er flydende, ikke en mur
     ═════════════════════════════════════════════════════ */
  const _p = new THREE.Vector3();
  const _q = new THREE.Quaternion();
  const _s = new THREE.Vector3(1, 1, 1);
  const _m = new THREE.Matrix4();

  const RYST = ROLIG ? 0 : 0.16;   // nm, hvor langt et lipid vandrer

  function opdater(t){
    for(let i = 0; i < N; i++){
      const f = fase[i], s = side[i];
      const dx = RYST * Math.sin(t * 0.62 + f);
      const dz = RYST * Math.cos(t * 0.48 + f * 1.7);
      const dy = RYST * 0.35 * Math.sin(t * 1.15 + f);
      const x = grundX[i] + dx, z = grundZ[i] + dz;

      _m.makeTranslation(x, s * (T / 2) + dy, z);
      hoveder.setMatrixAt(i, _m);

      _p.set(x + oA[i * 2], s * HALE_Y + dy, z + oA[i * 2 + 1]);
      _q.fromArray(qA, i * 4);
      haleA.setMatrixAt(i, _m.compose(_p, _q, _s));

      _p.set(x + oB[i * 2], s * HALE_Y + dy, z + oB[i * 2 + 1]);
      _q.fromArray(qB, i * 4);
      haleB.setMatrixAt(i, _m.compose(_p, _q, _s));
    }
    hoveder.instanceMatrix.needsUpdate = true;
    haleA.instanceMatrix.needsUpdate = true;
    haleB.instanceMatrix.needsUpdate = true;

    if(kolesterol.visible){
      for(let i = 0; i < KO; i++){
        const K = kolesterolPladser[i];
        const dx = RYST * Math.sin(t * 0.62 + K.fase);
        const dz = RYST * Math.cos(t * 0.48 + K.fase * 1.7);
        const x = K.x + dx, z = K.z + dz;
        _m.makeTranslation(x, K.side * KO_Y, z);
        kolKrop.setMatrixAt(i, _m);
        _m.makeTranslation(x, K.side * (KO_Y + KO_H / 2 + 0.12), z);
        kolOH.setMatrixAt(i, _m);
      }
      kolKrop.instanceMatrix.needsUpdate = true;
      kolOH.instanceMatrix.needsUpdate = true;
    }

    /* Sukkerkæderne på almindelige fosfolipider skal følge det
       lipid, de sidder på — ellers svæver de. */
    for(const G of glykolipider){
      const f = fase[G.i];
      G.kæde.position.x = grundX[G.i] + RYST * Math.sin(t * 0.62 + f);
      G.kæde.position.z = grundZ[G.i] + RYST * Math.cos(t * 0.48 + f * 1.7);
      G.kæde.position.y = T / 2 + HR * 0.6 + RYST * 0.35 * Math.sin(t * 1.15 + f);
    }

    /* Proteinerne driver langsomt rundt og drejer om sig selv —
       det er hele pointen i navnet væskemosaikmodellen. */
    for(const P of proteiner){
      P.objekt.position.x = P.x + (ROLIG ? 0 : 0.34 * Math.sin(t * 0.17 + P.fase));
      P.objekt.position.z = P.z + (ROLIG ? 0 : 0.34 * Math.cos(t * 0.13 + P.fase));
      P.objekt.rotation.y = ROLIG ? 0 : t * 0.06 + P.fase;
    }
  }
  opdater(0);

  /* ── Fremhævning ─────────────────────────────────────── *
   * Den udpegede del lyser op indefra. Farve er ikke eneste
   * signal: navnet står samtidig i forklaringsruden.        */
  let fremhævet = null;
  function fremhæv(delId){
    fremhævet = delId;
    for(const [id, liste] of Object.entries(delMaterialer)){
      const på = id === delId;
      for(const m of liste){
        m.emissive.setHex(på ? m.color.getHex() : 0x000000);
        m.emissiveIntensity = på ? 0.6 : 0;
      }
    }
  }

  return {
    gruppe, proteiner, mat,
    /** Alt hvad en musepeger kan ramme — hele figuren, gennemsøgt
        rekursivt. Hver del bærer sit `userData.delId`. */
    maalObjekter: [gruppe],
    /** En transportmekanisme melder sine egne materialer ind, så dens
        molekyler kan lyse op på samme måde som membranens egne dele.
        Modulet får ikke af den grund at vide, hvad transport er. */
    tilfoejDel(delId, materialer){ delMaterialer[delId] = materialer; },
    /** Hvor står et protein? Grundpositionen, ikke den drivende. */
    findProtein: id => proteiner.find(p => p.id === id),
    sætKolesterol: v => { kolesterol.visible = v; },
    sætSukker:     v => { for(const s of sukkerdele) s.visible = v; },
    fremhæv,
    get fremhævet(){ return fremhævet; },
    opdater,
  };
}
