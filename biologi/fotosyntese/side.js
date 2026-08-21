/* ═══════════════════════════════════════════════════════════
   side.js — indgangen.

   Binder DOM'en i fotosyntese.html sammen med modellen og
   figuren: træk og slip, tastaturbetjening, molekylernes flugt
   hen over scenen, instrumenterne, adressefeltet og
   projektortilstanden. Regnestykkerne står i model.js, tegningen
   i scene.js — her står kun det, der handler om betjening.
   ═══════════════════════════════════════════════════════════ */
import {tegnMolekyle, MOLEKYLER} from './molekyler.js';
import * as S from './scene.js';
import * as M from './model.js';

const el = id => document.getElementById(id);
const svg = el('scene');
const scene = S.byggScene(svg);

/* ── Signaturforklaringen nederst ──────────────────────── */
for (const felt of document.querySelectorAll('.fact svg[data-signatur]')){
  felt.appendChild(tegnMolekyle(felt.dataset.signatur, {navn:false, skala:0.8}));
}

/* ── Molekyler, der er på vej et sted hen ──────────────── *
 * Farten er sat, så man kan følge det enkelte molekyle med øjnene.
 * `drift` er den rolige svæven ind mod planten: nærmest jævn fart
 * og en flad bue, i modsætning til det korte spring inde i cellen. */
const flyvende = [];

function nyFlugt(node, fra, til, tid, naarFremme, drift){
  flyt(node, fra.x, fra.y);
  const spred = drift ? 30 : 90;
  flyvende.push({
    node, fra, til, tid, t:0, naarFremme, drift,
    bue:{x:(fra.x+til.x)/2 + (Math.random()-0.5)*spred,
         y:(fra.y+til.y)/2 - (drift ? 8 + Math.random()*26 : 40 + Math.random()*50)},
  });
}

function flyt(node, x, y, skala){
  node.setAttribute('transform','translate('+x.toFixed(1)+','+y.toFixed(1)+')'+(skala?' scale('+skala+')':''));
}

function flytFlyvende(dt){
  for (let i=flyvende.length-1;i>=0;i--){
    const f = flyvende[i];
    f.t += dt;
    const u = Math.min(1, f.t/f.tid);
    /* driften holder farten; springet inde i cellen sætter blødt af og i */
    const e = f.drift ? u : (u<0.5 ? 2*u*u : 1-Math.pow(-2*u+2,2)/2);
    const m = 1-e;
    const x = m*m*f.fra.x + 2*m*e*f.bue.x + e*e*f.til.x;
    const y = m*m*f.fra.y + 2*m*e*f.bue.y + e*e*f.til.y;
    flyt(f.node, x, y);
    if (u >= 1){
      flyvende.splice(i,1);
      f.naarFremme?.();
    }
  }
}

function nyToken(type, x, y, klasse){
  const g = tegnMolekyle(type, {navn:type !== 'glukose'});
  if (klasse) g.classList.add(klasse);
  flyt(g, x, y);
  scene.lag.molekyler.appendChild(g);
  return g;
}

/* Et molekyle, planten slipper ud. Det driver ud i luften eller ned
   i jorden og bliver hængende dér et stykke tid — ilten forsvinder
   ikke i samme sekund, den blander sig med luften og forsvinder så
   ét molekyle ad gangen. */
const haengende = [];
const MAKS_HAENGENDE = 14;

function sendUd(type, fra, til){
  if (flyvende.length + haengende.length > 150) return;
  const g = nyToken(type, fra.x, fra.y, 'flyver');
  nyFlugt(g, fra, til, 2.2 + Math.random()*1.1, () => {
    haengende.push({node:g, type, x:til.x, y:til.y,
                    fase:Math.random()*6.3, tid:5 + Math.random()*10});
    /* bliver der for mange i luften, får den ældste kort snor */
    if (haengende.length > MAKS_HAENGENDE && haengende[0].tid > 2)
      haengende[0].tid = 0.5 + Math.random()*1.2;
  });
}

function flytHaengende(dt){
  for (let i=haengende.length-1;i>=0;i--){
    const h = haengende[i];
    h.tid -= dt;
    if (h.tid <= 0){ haengende.splice(i,1); fortonet(h.node); continue; }
    flyt(h.node, h.x + Math.sin(urSek*0.5 + h.fase)*7, h.y + Math.cos(urSek*0.37 + h.fase)*5);
  }
}

function fortonet(node, tid = 600){
  node.animate?.([{opacity:1},{opacity:0}],{duration:tid, fill:'forwards'});
  setTimeout(() => node.remove(), tid + 20);
}

/* Respirationen henter helst den ilt, der allerede hænger i luften
   efter fotosyntesen — det er den samme ilt, der bliver brugt igen. */
function hentIlt(antal){
  const fundet = [];
  for (let i=haengende.length-1;i>=0 && fundet.length<antal;i--){
    if (haengende[i].type === 'o2') fundet.push(haengende.splice(i,1)[0]);
  }
  return fundet;
}

/* ── Råvarerne i luften og i jorden ────────────────────── */
const puljen = [];

function byggPulje(){
  for (const p of puljen) p.node.remove();
  puljen.length = 0;
  for (const type of ['co2','h2o']){
    S.PLADSER[type].forEach(([x,y]) => {
      const node = nyToken(type, x, y);
      node.setAttribute('tabindex','0');
      node.setAttribute('role','button');
      node.setAttribute('aria-label', MOLEKYLER[type].navn+' '+MOLEKYLER[type].formel+' '+MOLEKYLER[type].hvor+
                        ' — træk det ind i bladet, eller tryk Enter');
      const kort = {type, node, hjem:{x,y}, ledig:true};
      bindTraek(kort);
      puljen.push(kort);
    });
  }
  visPulje();
}

function visPulje(){
  const vist = M.tilstand.modus === 'traek';
  for (const p of puljen){
    p.node.style.display = vist ? '' : 'none';
    if (vist && p.ledig) p.node.setAttribute('tabindex','0');
    else p.node.removeAttribute('tabindex');
  }
}

/* Pladsen fyldes op igen, så der altid ligger seks af hver. */
function genopfyld(kort){
  kort.ledig = false;
  kort.node.remove();
  setTimeout(() => {
    if (M.tilstand.modus !== 'traek'){ kort.ledig = true; return; }
    const node = nyToken(kort.type, kort.hjem.x, kort.hjem.y);
    node.setAttribute('tabindex','0');
    node.setAttribute('role','button');
    node.setAttribute('aria-label', kort.node.getAttribute('aria-label'));
    node.animate?.([{opacity:0},{opacity:1}],{duration:300});
    kort.node = node; kort.ledig = true;
    bindTraek(kort);
  }, 520);
}

/* ── Træk og slip ──────────────────────────────────────── */
const punkt = svg.createSVGPoint();
function tilScene(e){
  punkt.x = e.clientX; punkt.y = e.clientY;
  return punkt.matrixTransform(svg.getScreenCTM().inverse());
}
const iZone = (z,p) => {
  const x = +z.getAttribute('x'), y = +z.getAttribute('y');
  return p.x >= x && p.x <= x + +z.getAttribute('width') &&
         p.y >= y && p.y <= y + +z.getAttribute('height');
};

let traek = null;

function bindTraek(kort){
  kort.node.addEventListener('pointerdown', e => {
    if (!kort.ledig || M.tilstand.modus !== 'traek') return;
    e.preventDefault();
    /* er den på vej hjem efter et fejlslag, så stop flugten først */
    const i = flyvende.findIndex(f => f.node === kort.node);
    if (i >= 0) flyvende.splice(i,1);
    kort.node.classList.add('traekkes');
    /* flyt den øverst, FØR pointeren fanges — et flyt i DOM'en
       ville ellers slippe fangsten igen */
    scene.lag.molekyler.appendChild(kort.node);
    kort.node.setPointerCapture(e.pointerId);
    traek = {kort, id:e.pointerId};
    visZoner(true);
    tavsHint();
  });
  kort.node.addEventListener('pointermove', e => {
    if (!traek || traek.id !== e.pointerId) return;
    const p = tilScene(e);
    flyt(kort.node, p.x, p.y);
    for (const z of Object.values(scene.zoner)) z.classList.toggle('over', iZone(z,p));
  });
  const slip = e => {
    if (!traek || traek.id !== e.pointerId) return;
    const p = tilScene(e);
    kort.node.classList.remove('traekkes');
    traek = null;
    visZoner(false);
    const iCellen = iZone(scene.zoner.celle, p);
    if (iCellen || iZone(scene.zoner.plante, p)) sendInd(kort, p, iCellen);
    else nyFlugt(kort.node, p, kort.hjem, 0.8);
  };
  kort.node.addEventListener('pointerup', slip);
  kort.node.addEventListener('pointercancel', slip);
  kort.node.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    tavsHint();
    sendInd(kort, kort.hjem, false);
  });
}

function visZoner(til){
  for (const z of Object.values(scene.zoner)){
    z.classList.toggle('aktiv', til);
    if (!til) z.classList.remove('over');
  }
}

/* Molekylet er sluppet det rigtige sted. Slippes det ude ved planten,
   svæver det ind gennem bladet eller roden; slippes det inde i cellen,
   lægger det sig direkte i kloroplastens plads. Begge veje ender med,
   at cellebilledet tæller én op. */
function sendInd(kort, fra, iCellen){
  const type = kort.type;
  if (!M.erPlads(type)){
    visHint('Kloroplasten har allerede 6 '+MOLEKYLER[type].formel+' — der mangler '+
            (type === 'co2' ? MOLEKYLER.h2o.formel : MOLEKYLER.co2.formel), true);
    nyFlugt(kort.node, fra, kort.hjem, 0.9);
    return;
  }
  const node = kort.node;
  node.classList.add('flyver');
  node.removeAttribute('tabindex');
  genopfyld(kort);
  scene.lag.molekyler.appendChild(node);
  if (iCellen) flyvTilPlads(type, node, fra);
  else         flyvIndIPlanten(type, node, fra, false);
}

/* Ind gennem bladet (CO₂) eller op gennem roden (H₂O). */
function flyvIndIPlanten(type, node, fra, drift){
  M.reserver(type);
  const til = type === 'co2' ? S.bladPos() : S.rodPos();
  const tid = drift ? 2.8 + Math.random()*1.4 : 1.9 + Math.random()*0.6;
  nyFlugt(node, fra, til, tid, () => {
    fortonet(node, 340);
    M.frigiv(type);
    lever(type);
  }, drift);
}

/* Det korte spring fra cellens kant ned i kloroplastens plads. */
function flyvTilPlads(type, node, fra){
  M.reserver(type);
  const til = S.slotPos(type, Math.min(M.tilstand[type] + M.paaVej[type] - 1, 5));
  nyFlugt(node, fra, til, 1.5 + Math.random()*0.5, () => {
    node.remove();
    M.frigiv(type);
    lever(type);
  });
}

/* Molekylet er nået frem: cellen tæller op, og er der seks af hver
   og lys nok, går fotosyntesen i gang. */
function lever(type){
  const svar = M.modtag(type);
  scene.saetSlots(M.tilstand.co2, M.tilstand.h2o);
  if (svar.reaktion) fotosyntese();
  else if (M.tilstand.co2 >= 6 && M.tilstand.h2o >= 6 && !M.erLyst())
    visHint('6 CO₂ og 6 H₂O er klar — men fotosyntesen mangler lys', true);
}

/* Modellens egne råvarer: de dukker op i luften eller i jorden og
   svæver stille og roligt ind mod planten. */
function nytRaastof(type){
  if (flyvende.length + haengende.length > 150) return;
  const fra = type === 'co2' ? S.luftPos() : S.jordPos();
  const node = nyToken(type, fra.x, fra.y, 'flyver');
  node.animate?.([{opacity:0},{opacity:1}],{duration:600});
  flyvIndIPlanten(type, node, fra, true);
}

/* ── De to processer, når de sker ──────────────────────── */
let fotoBlink = 0, respBlink = 0;

function fotosyntese(){
  fotoBlink = 2.4;
  scene.blink('foto');
  scene.saetSlots(M.tilstand.co2, M.tilstand.h2o);
  const kl = S.kloroplastPos();
  /* seks ilt ud i luften, hvor de bliver hængende */
  for (let i=0;i<6;i++) setTimeout(() => sendUd('o2', kl, S.luftPos()), i*180);
  /* og én glukose ned i lageret */
  const g = nyToken('glukose', kl.x, kl.y, 'flyver');
  nyFlugt(g, kl, S.lagerPos(M.tilstand.lager-1), 1.6, () => {
    g.remove();
    scene.saetLager(M.tilstand.lager);
  });
}

function respiration(fra){
  respBlink = 3.4;
  scene.blink('mito');
  const mi = S.mitokondriePos();
  const start = fra === 'lager' ? S.lagerPos(M.tilstand.lager) : S.plantePos();
  scene.saetLager(M.tilstand.lager);
  const g = nyToken('glukose', start.x, start.y, 'flyver');
  nyFlugt(g, start, mi, 1.5, () => g.remove());

  /* seks ilt samles ind fra luften — helst den ilt, fotosyntesen
     lige har sluppet ud */
  const fundet = hentIlt(6);
  for (let i=0;i<6;i++){
    const h = fundet[i];
    const sted = h ? {x:h.x, y:h.y} : S.luftPos();
    const node = h ? h.node : nyToken('o2', sted.x, sted.y, 'flyver');
    if (!h) node.animate?.([{opacity:0},{opacity:1}],{duration:500});
    setTimeout(() => nyFlugt(node, sted, mi, 2.4 + Math.random()*1.0,
                             () => node.remove(), true), i*170);
  }

  /* og kuldioxid og vand ud igen — de bliver hængende som ilten */
  setTimeout(() => {
    for (let i=0;i<6;i++){
      setTimeout(() => sendUd('co2', mi, S.luftPos()), i*180);
      setTimeout(() => sendUd('h2o', mi, S.jordPos()), i*180+90);
    }
  }, 2600);
}

function vaekst(){
  const fra = S.lagerPos(M.tilstand.lager);
  const g = nyToken('glukose', fra.x, fra.y, 'flyver');
  scene.saetLager(M.tilstand.lager);
  nyFlugt(g, fra, S.plantePos(), 2.0, () => g.remove(), true);
}

function haandter(haendelser){
  for (const h of haendelser){
    if (h.type === 'behov')       nytRaastof(h.molekyle);
    else if (h.type === 'respiration') respiration(h.fra);
    else if (h.type === 'vaekst')      vaekst();
    else if (h.type === 'sult')        visHint('Planten har hverken lager eller biomasse tilbage at forbrænde', true);
  }
}

/* ── Instrumenterne ────────────────────────────────────── */
const felter = {
  bpp:el('val-bpp'), r:el('val-r'), npp:el('val-npp'), lager:el('val-lager'),
  bBpp:el('bar-bpp'), bR:el('bar-r'), bNpp:el('bar-npp'), bLager:el('bar-lager'),
  tid:el('val-tid'), lys:el('val-lys'), temp:el('val-temp'),
  doegn:el('who-doegn'), biomasse:el('fact-biomasse'),
  standFoto:el('stand-foto'), standResp:el('stand-resp'),
  lignFoto:el('lign-foto'), lignResp:el('lign-resp'),
};
const sliderTid = el('slider-tid'), sliderLys = el('slider-lys'), sliderTemp = el('slider-temp');

const klokkeslet = t => {
  const timer = Math.floor(t) % 24;
  const min = Math.round((t - Math.floor(t))*60);
  return String(timer).padStart(2,'0')+':'+String(min === 60 ? 0 : min).padStart(2,'0');
};
const medFortegn = n => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n);

let visBiomasse = -1;

function opdaterUdseende(){
  const t = M.tilstand;
  const lys = M.lysNu();
  scene.saetHimmel(M.solHoejde(), t.lysstyrke, t.klokken);

  if (t.biomasse !== visBiomasse){
    scene.tegnPlante(t.biomasse, t.biomasse === 0);
    visBiomasse = t.biomasse;
    felter.biomasse.textContent = t.biomasse;
  }

  const skala = Math.max(20, Math.ceil(Math.max(t.bpp, t.r)/20)*20);
  const npp = M.npp();
  felter.bpp.innerHTML = t.bpp + '<small>glukose</small>';
  felter.r.innerHTML = t.r + '<small>glukose</small>';
  felter.npp.innerHTML = medFortegn(npp) + '<small>glukose</small>';
  felter.lager.innerHTML = t.lager + '<small>glukose</small>';
  felter.bBpp.style.width = (100*t.bpp/skala).toFixed(1)+'%';
  felter.bR.style.width = (100*t.r/skala).toFixed(1)+'%';
  const halv = Math.min(50, 50*Math.abs(npp)/skala);
  felter.bNpp.style.width = halv.toFixed(1)+'%';
  felter.bNpp.style.left = (npp < 0 ? 50-halv : 50).toFixed(1)+'%';
  felter.bNpp.style.setProperty('--cc', npp < 0
    ? 'linear-gradient(90deg,#FF6A3D,#FFB08F)' : 'linear-gradient(90deg,#9BD7F3,#0E86C8)');
  felter.bLager.style.width = (100*Math.min(1, t.lager/M.K.maksLager)).toFixed(1)+'%';

  felter.doegn.textContent = 'Døgn '+t.doegn;
  felter.tid.textContent = klokkeslet(t.klokken);
  if (document.activeElement !== sliderTid) sliderTid.value = t.klokken.toFixed(2);

  const kørerFoto = fotoBlink > 0 || (t.modus === 'auto' && lys > 0.02);
  felter.lignFoto.dataset.aktiv = kørerFoto ? 'true' : 'false';
  felter.standFoto.textContent = kørerFoto ? 'Kører' : (lys > 0.02 ? 'Klar' : 'Venter på lys');

  const braendstof = t.lager > 0 || t.biomasse > 0;
  const kørerResp = respBlink > 0 || (t.urKoerer && braendstof);
  felter.lignResp.dataset.aktiv = kørerResp ? 'true' : 'false';
  felter.standResp.textContent = !braendstof ? 'Intet at forbrænde' : (kørerResp ? 'Kører' : 'Hviler');
}

/* ── Skjult besked til skærmlæsere ─────────────────────── */
let srUr = 0;
function fortael(){
  const t = M.tilstand;
  el('sr-status').textContent =
    'Klokken '+klokkeslet(t.klokken)+', '+(M.erLyst() ? 'lyst' : 'mørkt')+'. '+
    'Kloroplasten har '+t.co2+' af 6 kuldioxid og '+t.h2o+' af 6 vand. '+
    'BPP '+t.bpp+', respiration '+t.r+', NPP '+medFortegn(M.npp())+' glukose. '+
    'Lager '+t.lager+', plantens biomasse '+t.biomasse+'.';
}

/* ── Hint ──────────────────────────────────────────────── */
const hint = el('hint');
let hintUr = 0;
function visHint(tekst, raab){
  clearTimeout(hintUr);
  hint.textContent = tekst;
  hint.classList.toggle('raab', !!raab);
  hint.classList.remove('gone');
  hintUr = setTimeout(() => hint.classList.add('gone'), 3800);
}
function tavsHint(){ clearTimeout(hintUr); hint.classList.add('gone'); }

/* ── Betjening ─────────────────────────────────────────── */
function saetModus(modus){
  M.tilstand.modus = modus;
  el('btn-traek').setAttribute('aria-pressed', modus === 'traek' ? 'true' : 'false');
  el('btn-auto').setAttribute('aria-pressed', modus === 'auto' ? 'true' : 'false');
  visPulje();
  if (modus === 'auto'){
    /* automatisk tilstand giver kun mening, når døgnet også går */
    if (!M.tilstand.urKoerer) saetUr(true);
    visHint('Modellen leverer nu selv molekylerne — lys og temperatur bestemmer farten');
  } else {
    visHint('Træk 6 CO₂ og 6 H₂O ind i bladet');
  }
  gemTilstand();
}

function saetUr(koerer){
  M.tilstand.urKoerer = koerer;
  const b = el('btn-ur');
  b.setAttribute('aria-pressed', koerer ? 'true' : 'false');
  b.textContent = koerer ? 'Pause' : 'Start døgnet';
  gemTilstand();
}

el('btn-traek').addEventListener('click', () => saetModus('traek'));
el('btn-auto').addEventListener('click', () => saetModus('auto'));
el('btn-ur').addEventListener('click', () => saetUr(!M.tilstand.urKoerer));
el('btn-nulstil').addEventListener('click', () => {
  M.nulstil();
  for (const f of flyvende) f.node.remove();
  flyvende.length = 0;
  for (const h of haengende) h.node.remove();
  haengende.length = 0;
  scene.saetSlots(0,0);
  scene.saetLager(0);
  visBiomasse = -1;
  byggPulje();
  visHint('Regnskabet er nulstillet');
  gemTilstand();
});

sliderTid.addEventListener('input', e => {
  M.tilstand.klokken = parseFloat(e.target.value) % 24;
  efterAendring();
});
sliderLys.addEventListener('input', e => {
  M.tilstand.lysstyrke = parseInt(e.target.value,10);
  felter.lys.textContent = M.tilstand.lysstyrke;
  efterAendring();
});
sliderTemp.addEventListener('input', e => {
  M.tilstand.temperatur = parseInt(e.target.value,10);
  felter.temp.textContent = M.tilstand.temperatur;
  gemTilstand();
});

/* Bliver det lyst, mens seks + seks står klar, går fotosyntesen i gang. */
function efterAendring(){
  if (M.tjekReaktion()) fotosyntese();
  gemTilstand();
}

/* ── Projektortilstand ─────────────────────────────────── */
const btnProjektor = el('btn-projektor');
function saetProjektor(til){
  document.body.setAttribute('data-projektor', til ? '1' : '0');
  btnProjektor.setAttribute('aria-pressed', til ? 'true' : 'false');
}
btnProjektor.addEventListener('click', () => {
  saetProjektor(document.body.getAttribute('data-projektor') !== '1');
});

/* ── Deling: indstillingerne ligger i adressen ─────────── */
let hashUr = 0, hashSidste = '';
function tilstandStreng(){
  const t = M.tilstand;
  return '#modus='+t.modus+'&kl='+t.klokken.toFixed(1)+'&lys='+t.lysstyrke+
         '&temp='+t.temperatur+'&ur='+(t.urKoerer ? 1 : 0);
}
function gemTilstand(){
  const h = tilstandStreng();
  if (h === hashSidste) return;
  hashSidste = h;
  clearTimeout(hashUr);
  hashUr = setTimeout(() => { if (location.hash !== h) history.replaceState(null,'',h); }, 500);
}
function laesTilstand(){
  const p = new URLSearchParams(location.search);
  new URLSearchParams(location.hash.replace(/^#/,'')).forEach((v,k) => p.set(k,v));
  const tal = (raa, min, max) => {
    const v = parseFloat(raa);
    return Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : null;
  };
  const modus = p.get('modus');
  if (modus === 'auto' || modus === 'traek') M.tilstand.modus = modus;
  const kl = tal(p.get('kl'), 0, 24);
  const lys = tal(p.get('lys'), 0, 100);
  const temp = tal(p.get('temp'), 0, 40);
  if (kl !== null) M.tilstand.klokken = kl;
  if (lys !== null) M.tilstand.lysstyrke = Math.round(lys/5)*5;
  if (temp !== null) M.tilstand.temperatur = Math.round(temp);

  sliderTid.value = M.tilstand.klokken;
  sliderLys.value = M.tilstand.lysstyrke;
  sliderTemp.value = M.tilstand.temperatur;
  felter.lys.textContent = M.tilstand.lysstyrke;
  felter.temp.textContent = M.tilstand.temperatur;
  saetModus(M.tilstand.modus);
  saetUr(p.get('ur') === '1' || M.tilstand.modus === 'auto');
  if (/mode=teach|projektor=1/.test(location.search)) saetProjektor(true);
  hashSidste = tilstandStreng();
}

/* ── Løkken ────────────────────────────────────────────── */
let sidst = performance.now();
let urSek = 0;
function loep(nu){
  const dt = Math.min(0.1, (nu - sidst)/1000);
  sidst = nu;
  urSek += dt;
  if (M.tilstand.urKoerer) haandter(M.opdater(dt * M.K.timerPrSekund));
  flytFlyvende(dt);
  flytHaengende(dt);
  fotoBlink = Math.max(0, fotoBlink - dt);
  respBlink = Math.max(0, respBlink - dt);
  opdaterUdseende();
  srUr += dt;
  if (srUr > 4){ srUr = 0; fortael(); }
  requestAnimationFrame(loep);
}

/* ── Start ─────────────────────────────────────────────── */
scene.tegnPlante(M.tilstand.biomasse, false);
scene.saetSlots(0,0);
scene.saetLager(0);
byggPulje();
laesTilstand();
visHint('Træk 6 CO₂ og 6 H₂O ind i bladet — eller vælg et molekyle med tab og tryk Enter');
fortael();
requestAnimationFrame(loep);
