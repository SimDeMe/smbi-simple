/* side.js — binder skydere, instrumenter og de tre modeller sammen,
   og holder billedet i gang. */

import * as K from './kyst.js';
import * as B from './boelger.js';
import * as O from './opskyl.js';

const $ = id => document.getElementById(id);

const kanvas = $('sim');
const c = kanvas.getContext('2d');

const inpVind  = $('inp-vind'),   inpStraek = $('inp-straek');
const inpHoejde= $('inp-hoejde'), inpPeriode= $('inp-periode');
const inpHaeld = $('inp-haeld'),  inpTid    = $('inp-tid');
const parVejr  = $('par-vejr'),   parBoelge = $('par-boelge');

const roligt = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

let tilstand = 'vejr';
let tid = 0, sidsteBillede = 0, haeldTraekkes = false;
const pr = { punkter: [] };

// ── Skarpt billede på skærme med høj pixeltæthed ───────
function tilpasKanvas(){
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  kanvas.width  = Math.round(K.W  * dpr);
  kanvas.height = Math.round(K.HC * dpr);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
}
tilpasKanvas();
window.addEventListener('resize', tilpasKanvas);

// ── Talformat ──────────────────────────────────────────
const tal = (v, n = 1) => v.toLocaleString('da-DK', { minimumFractionDigits:n, maximumFractionDigits:n });
const grader = h => Math.atan(h) * 180 / Math.PI;
const fraGrader = g => Math.tan(g * Math.PI / 180);

// ── Sidens to måder at sætte bølgen på ─────────────────
function boelgen(){
  if (tilstand === 'boelge'){
    const T = +inpPeriode.value;
    // En bølge kan ikke blive stejlere end ca. 1:7 — så bryder den af sig
    // selv. Skyderen standser derfor, hvor den grænse er nået.
    const maks = Math.min(+inpHoejde.max, 0.14 * B.dybvandsLaengde(T));
    const H = Math.min(+inpHoejde.value, maks);
    if (+inpHoejde.value > H) inpHoejde.value = H.toFixed(1);
    return { H, T };
  }
  return B.fraVind(+inpVind.value, +inpStraek.value * 1000);
}

function saetTilstand(navn){
  tilstand = navn;
  const vejr = navn === 'vejr';
  parVejr.hidden = !vejr; parBoelge.hidden = vejr;
  $('btn-vejr').setAttribute('aria-pressed', vejr ? 'true' : 'false');
  $('btn-boelge').setAttribute('aria-pressed', vejr ? 'false' : 'true');
  // skift af tilstand må ikke flytte bølgen: tag de aktuelle tal med over
  if (!vejr){
    const b = B.fraVind(+inpVind.value, +inpStraek.value * 1000);
    inpHoejde.value  = Math.min(8, Math.max(0.1, b.H)).toFixed(1);
    inpPeriode.value = Math.min(14, Math.max(2, b.T)).toFixed(1);
  }
  merkater(); gemTilstand();
}

const FORLAEG = {
  kattegat: { u: 8,  s: 20  },
  nordsoen: { u: 8,  s: 500 },
  storm:    { u: 22, s: 120 }
};
function saetForlaeg(navn){
  const f = FORLAEG[navn];
  inpVind.value = f.u; inpStraek.value = f.s;
  saetTilstand('vejr');
  merkater();
}

// ── Instrumenter og nøgletal ───────────────────────────
function merkater(){
  if (tilstand === 'vejr'){
    $('lbl-vind').textContent   = tal(+inpVind.value, 1) + ' m/s';
    $('lbl-straek').textContent = (+inpStraek.value).toLocaleString('da-DK') + ' km';
  } else {
    $('lbl-hoejde').textContent  = tal(+inpHoejde.value, 1) + ' m';
    $('lbl-periode').textContent = tal(+inpPeriode.value, 1) + ' s';
  }
  $('lbl-haeld').textContent = tal(+inpHaeld.value, 1) + '°';
  const d = +inpTid.value;
  $('lbl-tid').textContent = d === 0 ? 'sat på pause' : tal(d, 1) + ' døgn/s';
}

let srTimer = 0;
function aflaes(b, m){
  const t = O.type(m.netto);

  $('val-h').firstChild.nodeValue = tal(b.H, 2);
  $('val-l').firstChild.nodeValue = tal(pr.L0, 1);
  $('val-t').firstChild.nodeValue = tal(b.T, 1);
  $('val-type').firstChild.nodeValue = t.navn;
  $('val-flux').textContent = (m.netto >= 0 ? '+' : '−') + tal(Math.abs(m.netto), 2);

  $('anim-h').style.height = Math.min(100, b.H / 6 * 100) + '%';
  $('anim-l').style.width  = Math.min(100, pr.L0 / 140 * 100) + '%';
  $('anim-t').style.width  = Math.min(100, b.T / 14 * 100) + '%';

  const f = Math.max(-1, Math.min(1, m.netto / 6));
  const flux = $('anim-flux');
  flux.style.width = Math.abs(f) * 50 + '%';
  flux.style.left  = f >= 0 ? '50%' : (50 - Math.abs(f) * 50) + '%';
  flux.style.background = t.farve;
  $('g-type').style.setProperty('--tc', t.farve);

  $('f-stejl').textContent  = tal(b.H / pr.L0, 3);
  $('f-frek').textContent   = Math.round(m.frekvens);
  $('f-basis').textContent  = tal(pr.boelgebasis, 1);
  $('f-bryd').textContent   = pr.dBryd > 0 ? tal(pr.dBryd, 1) : '—';
  $('f-dag').textContent    = Math.floor(K.kyst.dag).toLocaleString('da-DK');

  if (performance.now() > srTimer){
    srTimer = performance.now() + 1500;
    $('sr-status').textContent =
      'Bølgehøjde ' + tal(b.H, 2) + ' meter, bølgelængde ' + tal(pr.L0, 1) +
      ' meter, periode ' + tal(b.T, 1) + ' sekunder. Strandhældning ' +
      tal(grader(K.kyst.haeldning), 1) + ' grader. ' + t.navn +
      ', netto ' + t.ord + ' ' + tal(Math.abs(m.netto), 2) +
      ' kubikmeter pr. meter kystlinje pr. døgn. Dag ' + Math.floor(K.kyst.dag) + '.';
  }
}

// ── Billedet ───────────────────────────────────────────
function tegn(b, m, sk){
  c.clearRect(0, 0, K.W, K.HC);
  K.tegnHimmel(c);
  if (tilstand === 'vejr') B.tegnVind(c, +inpVind.value);
  B.tegnVand(c, pr, tid, K.kystlinje() + sk.front);
  const basis = B.tegnBoelgebasis(c, pr);
  K.tegnBund(c);
  O.tegnOpskyl(c, m, sk);
  O.tegnKorn(c);
  B.tegnBrydning(c, pr, tid);
  O.tegnPile(c, m);

  const maerk = [];
  if (basis) maerk.push({ tekst:'BØLGEBASIS ' + tal(basis.dybde, 1) + ' m', x: basis.x, y: basis.y });
  if (K.kyst.revle > 0.35)
    maerk.push({ tekst:'REVLE', x: K.px(K.revleX()), y: K.py(K.bundZ(K.revleX())) + 34 });
  const foerste = pr.punkter.find(p => p.bryder);
  if (foerste && foerste.x < pr.xs - 20)
    maerk.push({ tekst:'GRUNDBRÆNDING', x: K.px(foerste.x), y: K.py(0) - 34, tik: 20 });
  maerk.push({ tekst:'KLIT', x: K.px(K.KLIT_X + 12), y: K.py(K.bundZ(K.KLIT_X + 12)) - 16 });
  K.tegnMaerkater(c, maerk);
}

// ── Løkken ─────────────────────────────────────────────
function billede(nu){
  const dt = Math.min(0.05, (nu - sidsteBillede) / 1000 || 0);
  sidsteBillede = nu;
  if (!roligt) tid += dt;

  if (!haeldTraekkes && document.activeElement !== inpHaeld)
    inpHaeld.value = grader(K.kyst.haeldning).toFixed(1);

  const b = boelgen();
  B.profil(b.H, b.T, pr);
  const m = O.beregn(pr.Hb, b.T, K.kyst.haeldning);

  const doegn = dt * (+inpTid.value);
  K.udvikl(m.netto, doegn);

  const sk = O.opdaterTunger(tid, m, b.T);
  O.flytKorn(dt, m, sk, pr);

  tegn(b, m, sk);
  aflaes(b, m);
  merkater();
  requestAnimationFrame(billede);
}

// ── Betjening ──────────────────────────────────────────
[inpVind, inpStraek, inpHoejde, inpPeriode, inpTid].forEach(el =>
  el.addEventListener('input', () => { merkater(); gemTilstand(); }));

inpHaeld.addEventListener('input', () => {
  K.kyst.haeldning = Math.min(K.HAELD_MAX, Math.max(K.HAELD_MIN, fraGrader(+inpHaeld.value)));
  merkater(); gemTilstand();
});
inpHaeld.addEventListener('pointerdown', () => { haeldTraekkes = true; });
window.addEventListener('pointerup',   () => { haeldTraekkes = false; });

$('btn-vejr').addEventListener('click',   () => saetTilstand('vejr'));
$('btn-boelge').addEventListener('click', () => saetTilstand('boelge'));
for (const navn of Object.keys(FORLAEG))
  $('btn-' + navn).addEventListener('click', () => saetForlaeg(navn));

$('btn-reset').addEventListener('click', () => {
  K.nulstil(); O.nulstilTunger(); O.saaKorn();
  inpHaeld.value = grader(K.kyst.haeldning).toFixed(1);
  merkater(); gemTilstand();
});

// Projektortilstand: sidens krom ryger væk, aflæsningerne skaleres op
const btnProjektor = $('btn-projektor');
function saetProjektor(til){
  document.body.setAttribute('data-projektor', til ? '1' : '0');
  btnProjektor.setAttribute('aria-pressed', til ? 'true' : 'false');
}
btnProjektor.addEventListener('click', () =>
  saetProjektor(document.body.getAttribute('data-projektor') !== '1'));

// ── Deling: tilstanden ligger i adressen ───────────────
let hashTimer = 0, hashSidste = '';
function tilstandStreng(){
  return '#m=' + tilstand + '&u=' + inpVind.value + '&s=' + inpStraek.value +
         '&h=' + inpHoejde.value + '&p=' + inpPeriode.value +
         '&b=' + (+inpHaeld.value).toFixed(1) + '&d=' + inpTid.value;
}
function gemTilstand(){
  const h = tilstandStreng();
  if (h === hashSidste) return;
  hashSidste = h;
  clearTimeout(hashTimer);
  hashTimer = setTimeout(() => { if (location.hash !== h) history.replaceState(null, '', h); }, 400);
}
function laesTilstand(){
  const p = new URLSearchParams(location.search);
  new URLSearchParams(location.hash.replace(/^#/, '')).forEach((v, k) => p.set(k, v));
  const saet = (el, noegle) => {
    const v = parseFloat(p.get(noegle));
    if (isFinite(v)) el.value = Math.max(+el.min, Math.min(+el.max, v));
  };
  saet(inpVind, 'u'); saet(inpStraek, 's');
  saet(inpHoejde, 'h'); saet(inpPeriode, 'p');
  saet(inpHaeld, 'b'); saet(inpTid, 'd');
  K.kyst.haeldning = Math.min(K.HAELD_MAX, Math.max(K.HAELD_MIN, fraGrader(+inpHaeld.value)));
  if (p.get('m') === 'boelge'){ tilstand = 'boelge'; parVejr.hidden = true; parBoelge.hidden = false;
    $('btn-vejr').setAttribute('aria-pressed','false'); $('btn-boelge').setAttribute('aria-pressed','true'); }
  hashSidste = tilstandStreng();
}

// ── Start ──────────────────────────────────────────────
if (roligt) inpTid.value = 0;
inpHaeld.value = grader(K.kyst.haeldning).toFixed(1);
laesTilstand();
O.saaKorn();
merkater();
if (/mode=teach|projektor=1/.test(location.search)) saetProjektor(true);

// På en smal skærm ruller figuren vandret. Start ved brændingen og
// stranden — det er dér, der sker noget.
const scene = document.querySelector('.stage');
requestAnimationFrame(() => {
  if (scene.scrollWidth > scene.clientWidth)
    scene.scrollLeft = (scene.scrollWidth - scene.clientWidth) * 0.8;
});

requestAnimationFrame(billede);
