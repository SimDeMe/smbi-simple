/* ═══════════════════════════════════════════════════════════
   model.js — rammen om en 3D-figur.

   Scene, kamera, lys, orbit-styring, størrelse og render-løkke.
   Intet fagligt indhold: modulet ved ikke, at det er en membran,
   det viser. Kan derfor genbruges af den næste 3D-side.
   ═══════════════════════════════════════════════════════════ */
import * as THREE from 'three';

/* Brugere, der har slået bevægelse fra i systemet, skal have en
   figur der står stille. Alle animationer spørger til denne. */
export const ROLIG = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

/**
 * @param lærred  <canvas> der tegnes i
 * @param boks    elementet, hvis bredde bestemmer figurens størrelse
 * @param start   {az, el, dist} — kameraets udgangspunkt
 * @param graenser {minEl, maxEl, minDist, maxDist}
 * @param hint    elementet der skal fade væk, første gang man rører figuren
 */
export function byggScene({
  lærred, boks, hint,
  baggrund = 0x0B1220,
  start    = {az:0.55, el:0.42, dist:34},
  graenser = {minEl:-1.25, maxEl:1.25, minDist:12, maxDist:70},
}){
  const renderer = new THREE.WebGLRenderer({canvas:lærred, antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(baggrund, 1);

  const scene  = new THREE.Scene();
  const kamera = new THREE.PerspectiveCamera(38, 1.6, 0.5, 400);

  /* Lys: ét nøglelys skråt oppefra, ét svagt modlys nedefra, så
     cytosolsiden ikke bliver kulsort, og lidt himmellys på toppen. */
  scene.add(new THREE.HemisphereLight(0xBFE4FF, 0x1B2436, 0.85));
  const noegle = new THREE.DirectionalLight(0xFFFFFF, 1.15);
  noegle.position.set(6, 12, 9);
  scene.add(noegle);
  const modlys = new THREE.DirectionalLight(0x9FD0FF, 0.45);
  modlys.position.set(-7, -9, -5);
  scene.add(modlys);

  /* ── Kamera: samme lille orbit-styring som Tidevand.html ─── *
   * `mål` er det punkt, kameraet kredser om. Det kan flyttes, så
   * figuren kan zoome hen til ét bestemt protein.               */
  const cam = {...start};
  const udgangspunkt = {...start};
  const mål = new THREE.Vector3(0, 0, 0);

  function opdaterKamera(){
    cam.el   = Math.max(graenser.minEl,   Math.min(graenser.maxEl,   cam.el));
    cam.dist = Math.max(graenser.minDist, Math.min(graenser.maxDist, cam.dist));
    kamera.position.set(
      mål.x + cam.dist * Math.cos(cam.el) * Math.sin(cam.az),
      mål.y + cam.dist * Math.sin(cam.el),
      mål.z + cam.dist * Math.cos(cam.el) * Math.cos(cam.az)
    );
    kamera.lookAt(mål);
  }
  opdaterKamera();

  /* ── Blød flyvning fra ét standpunkt til et andet ───────── *
   * Et spring fra oversigt til nærbillede er svært at følge med
   * i; en glidende bevægelse fortæller, hvor man endte henne.   */
  let flyvning = null;

  function flyvTil({az, el, dist, mål:nytMål}, varighed = 1.0){
    const slut = {
      az:   az   ?? cam.az,
      el:   el   ?? cam.el,
      dist: dist ?? cam.dist,
      /* `mål` må gerne komme som et almindeligt {x,y,z}, så
         kaldere slipper for at kende til three.js. */
      mål:  nytMål
        ? new THREE.Vector3(nytMål.x ?? 0, nytMål.y ?? 0, nytMål.z ?? 0)
        : mål.clone(),
    };
    /* Drej den korteste vej rundt, ikke hele vejen om. */
    let drej = slut.az - cam.az;
    while(drej >  Math.PI) drej -= Math.PI * 2;
    while(drej < -Math.PI) drej += Math.PI * 2;
    slut.az = cam.az + drej;

    if(ROLIG || varighed <= 0){
      Object.assign(cam, {az:slut.az, el:slut.el, dist:slut.dist});
      mål.copy(slut.mål); opdaterKamera(); flyvning = null;
      return;
    }
    flyvning = {
      tid:0, varighed, slut,
      fra:{az:cam.az, el:cam.el, dist:cam.dist, mål:mål.clone()},
    };
  }

  function fremFlyvning(dt){
    if(!flyvning) return;
    flyvning.tid += dt;
    const u = Math.min(flyvning.tid / flyvning.varighed, 1);
    const k = u * u * (3 - 2 * u);                    // blød start og slut
    const {fra, slut} = flyvning;
    cam.az   = fra.az   + (slut.az   - fra.az)   * k;
    cam.el   = fra.el   + (slut.el   - fra.el)   * k;
    cam.dist = fra.dist + (slut.dist - fra.dist) * k;
    mål.lerpVectors(fra.mål, slut.mål, k);
    opdaterKamera();
    if(u >= 1) flyvning = null;
  }

  function nulstilKamera(){ flyvTil({...udgangspunkt, mål:{x:0, y:0, z:0}}); }

  const skjulHint = () => hint && hint.classList.add('gone');

  (function styring(){
    let traekker = false, sidst = null, knib = null;

    lærred.addEventListener('pointerdown', e=>{
      if(e.pointerType === 'touch' && e.isPrimary === false) return;
      flyvning = null;                    // brugeren overtager styringen
      traekker = true; sidst = {x:e.clientX, y:e.clientY};
      lærred.setPointerCapture(e.pointerId);
      lærred.classList.add('dragging');
      skjulHint();
    });
    lærred.addEventListener('pointermove', e=>{
      if(!traekker || !sidst) return;
      cam.az -= (e.clientX - sidst.x) * 0.006;
      cam.el += (e.clientY - sidst.y) * 0.006;
      sidst = {x:e.clientX, y:e.clientY};
      opdaterKamera();
    });
    const slip = e=>{
      traekker = false; sidst = null;
      lærred.classList.remove('dragging');
      try{ lærred.releasePointerCapture(e.pointerId); }catch(_){}
    };
    lærred.addEventListener('pointerup', slip);
    lærred.addEventListener('pointercancel', slip);

    lærred.addEventListener('wheel', e=>{
      e.preventDefault(); skjulHint();
      cam.dist *= (1 + Math.sign(e.deltaY) * 0.09);
      opdaterKamera();
    }, {passive:false});

    lærred.addEventListener('touchstart', e=>{
      if(e.touches.length === 2){
        knib = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                          e.touches[0].clientY - e.touches[1].clientY);
      }
    }, {passive:true});
    lærred.addEventListener('touchmove', e=>{
      if(e.touches.length === 2 && knib){
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                             e.touches[0].clientY - e.touches[1].clientY);
        cam.dist *= knib / d; knib = d; opdaterKamera(); e.preventDefault();
      }
    }, {passive:false});
    lærred.addEventListener('touchend', ()=>{ knib = null; });

    /* Betjening skal kunne klares med tastatur alene. */
    lærred.addEventListener('keydown', e=>{
      const k = e.key; let brugt = true;
      if(k === 'ArrowLeft')       cam.az += 0.09;
      else if(k === 'ArrowRight') cam.az -= 0.09;
      else if(k === 'ArrowUp')    cam.el += 0.07;
      else if(k === 'ArrowDown')  cam.el -= 0.07;
      else if(k === '+' || k === '=') cam.dist *= 0.9;
      else if(k === '-')          cam.dist *= 1.1;
      else if(k === '0')          nulstilKamera();
      else brugt = false;
      if(brugt){ e.preventDefault(); skjulHint(); opdaterKamera(); }
    });
  })();

  /* ── Størrelse ─────────────────────────────────────────── */
  function tilpasStoerrelse(){
    const b = boks.clientWidth - 20;          // .view har 10 px luft i hver side
    if(b <= 0) return;
    /* På smalle skærme er der ikke plads i bredden, så figuren får
       lov at blive relativt højere — ellers bliver membranen for lille. */
    const forhold = b < 560 ? 0.88 : 0.58;
    const h = Math.round(Math.min(Math.max(b * forhold, 260), 620));
    renderer.setSize(b, h, true);
    kamera.aspect = b / h;
    kamera.updateProjectionMatrix();
  }
  new ResizeObserver(tilpasStoerrelse).observe(boks);
  tilpasStoerrelse();
  document.fonts?.ready.then(tilpasStoerrelse);

  /* ── Udpegning ─────────────────────────────────────────── *
   * Returnerer de dele, en musepeger rammer, nærmeste først.
   * Usynlige dele springes over — kolesterolet kan ikke udpeges,
   * når det er slået fra.                                       */
  const stråle = new THREE.Raycaster();
  const skærm  = new THREE.Vector2();

  function synlig(o){
    for(let n = o; n; n = n.parent) if(n.visible === false) return false;
    return true;
  }

  function peg(hændelse, objekter){
    const r = lærred.getBoundingClientRect();
    skærm.x =  ((hændelse.clientX - r.left) / r.width)  * 2 - 1;
    skærm.y = -((hændelse.clientY - r.top)  / r.height) * 2 + 1;
    stråle.setFromCamera(skærm, kamera);
    return stråle.intersectObjects(objekter, true).filter(t => synlig(t.object));
  }

  /* ── Tværsnit ──────────────────────────────────────────── *
   * Snittet lægges gennem et punkt, man har fokus på, og vender
   * altid mod kameraet: alt mellem beskueren og punktet klippes
   * væk. Så kan man se ind i membranen dér, hvor det er
   * interessant — også når figuren drejes.                     */
  const snitPlan   = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
  const snitPunkt  = new THREE.Vector3(0, 0, 0);
  const _snitN     = new THREE.Vector3();
  const _snitP     = new THREE.Vector3();
  let   snitTil    = false;
  let   snitMargen = 0;

  function opdaterSnit(){
    if(!snitTil) return;
    _snitN.subVectors(snitPunkt, kamera.position);
    _snitN.y = 0;                       // altid et lodret snit
    if(_snitN.lengthSq() < 1e-6) return;
    _snitN.normalize();
    /* Læg planet et stykke foran punktet, ikke tværs igennem det:
       ellers skæres netop det protein væk, man ville se på. */
    _snitP.copy(snitPunkt).addScaledVector(_snitN, -snitMargen);
    snitPlan.setFromNormalAndCoplanarPoint(_snitN, _snitP);
  }

  function saetSnit(til){
    snitTil = til;
    opdaterSnit();
    renderer.clippingPlanes = til ? [snitPlan] : [];
  }
  function saetSnitPunkt(p, margen = 0){
    snitPunkt.set(p.x ?? 0, p.y ?? 0, p.z ?? 0);
    snitMargen = margen;
    opdaterSnit();
  }

  /* ── Render-løkke ──────────────────────────────────────── */
  const opdateringer = [];
  let sidstTid = 0, tid = 0;

  function loekke(nu){
    const dt = Math.min((nu - sidstTid) / 1000, 0.1);
    sidstTid = nu;
    if(!ROLIG) tid += dt;
    fremFlyvning(dt);
    opdaterSnit();
    for(const f of opdateringer) f(tid, ROLIG ? 0 : dt);
    renderer.render(scene, kamera);
    requestAnimationFrame(loekke);
  }

  return {
    scene, kamera, renderer, cam,
    opdaterKamera, nulstilKamera, flyvTil, peg, tilpasStoerrelse,
    saetSnit, saetSnitPunkt,
    naarOpdater: f => opdateringer.push(f),
    start(){ requestAnimationFrame(nu=>{ sidstTid = nu; loekke(nu); }); },
  };
}
