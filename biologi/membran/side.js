/* ═══════════════════════════════════════════════════════════
   side.js — indgangen.

   Binder DOM'en i membran.html sammen med modulerne, holder styr
   på sidens tilstand og på adressen. Al kode, der handler om
   *knapper og tilstand*, hører hjemme her; alt der handler om
   *figuren*, hører hjemme i model.js og struktur.js.
   ═══════════════════════════════════════════════════════════ */
import {byggScene}        from './model.js';
import {byggMembran}      from './struktur.js';
import {opretForklaring}  from './forklaring.js';
import {MEKANISMER}       from './transport.js';

/* Transportmekanismerne registrerer sig selv, når de indlæses, og
   de kører alle sammen samtidig: membranen er levende, ikke en
   række adskilte forsøg. En ny mekanisme er én ny fil plus én
   importlinje her. */
import './transport-diffusion.js';
import './transport-kanal.js';

const el  = id => document.getElementById(id);
const tal = v  => v.toFixed(2).replace('.', ',');

/* Skjult besked til skærmlæsere — figuren siger ikke selv fra. */
let fortælTimer = null;
function fortæl(tekst){
  clearTimeout(fortælTimer);
  fortælTimer = setTimeout(() => { el('status').textContent = tekst; }, 120);
}

/* ── Sidens model ──────────────────────────────────────── *
 * Koncentrationerne i mmol/L på hver side af membranen. Tallene
 * er ilt: vand i ligevægt med atmosfærisk luft har ca. 0,26
 * mmol/L, og en celle, der forbrænder, ligger langt under.
 * `fast` betyder, at cellen forbruger ilten og får ny tilført,
 * så forskellen holdes ved lige — slås den fra, er systemet
 * lukket, og diffusionen udligner selv gradienten.            */
const tilstand = {ude:0.26, inde:0.05, fast:true};

/* ── Figuren ───────────────────────────────────────────── */
const model = byggScene({
  lærred:  el('scene'),
  boks:    el('view'),
  hint:    el('hint'),
  start:   {az:0.62, el:0.26, dist:28},
  graenser:{minEl:-1.25, maxEl:1.25, minDist:8, maxDist:66},
});

const membran = byggMembran(model.scene);

const forklaring = opretForklaring({
  model, membran,
  lærred:     el('scene'),
  felter:     {stempel:el('fork-stempel'), navn:el('fork-navn'), tekst:el('fork-tekst')},
  signaturer: [...document.querySelectorAll('.fact[data-del]')],
  naarValgt:  () => gemTilstand(),
});

/* Det, mekanismerne får at arbejde med. Se kontrakten i transport.js. */
const ctx = {scene:model.scene, membran, tilstand};
for(const m of MEKANISMER) m.byg?.(ctx);

/* ── Instrumenter ──────────────────────────────────────── *
 * Rækken bygges af det, mekanismerne aflæser, så en ny
 * transportvej selv tager sine tal med ind på siden.        */
const gaugeBoks = el('gauges');
let opsætning = '';

function visInstrumenter(){
  const læst = MEKANISMER.flatMap(m => m.aflaes?.(ctx) ?? []);
  const nøgle = læst.map(g => g.mærkat).join('|');
  if(nøgle !== opsætning){
    opsætning = nøgle;
    gaugeBoks.innerHTML = læst.map(g =>
      `<div class="gauge"><dt></dt><dd><span class="tal"></span> <span class="enhed"></span></dd></div>`
    ).join('');
    gaugeBoks.querySelectorAll('dt')
      .forEach((dt, i) => { dt.textContent = læst[i].mærkat; });
  }
  const felter = gaugeBoks.querySelectorAll('.gauge');
  læst.forEach((g, i) => {
    felter[i].querySelector('.tal').textContent   = g.værdi;
    felter[i].querySelector('.enhed').textContent = g.enhed ?? '';
  });
}

/* ── Skydere ───────────────────────────────────────────── *
 * Skyderne står i hundrededele mmol/L, så adressen kan holde
 * dem som hele tal.                                          */
const skydere = {};

function opretSkyder(navn, hvor){
  const input = el(`inp-${navn}`), visning = el(`val-${navn}`);
  let trækker = false;

  function vis(){
    visning.textContent = tal(tilstand[navn]);
    input.setAttribute('aria-valuetext', `${tal(tilstand[navn])} millimol per liter`);
  }
  input.addEventListener('input', () => {
    tilstand[navn] = Number(input.value) / 100;
    vis();
    fortæl(`Iltkoncentrationen ${hvor} er ${tal(tilstand[navn])} millimol per liter.`);
    gemTilstand();
  });
  input.addEventListener('pointerdown', () => { trækker = true; });
  addEventListener('pointerup', () => { trækker = false; });

  vis();
  skydere[navn] = {
    sæt(v){ tilstand[navn] = v; input.value = Math.round(v * 100); vis(); },
    /* Når gradienten udligner sig selv, er det modellen der fører
       skyderen — men ikke midt i et træk, hvor eleven fører den. */
    følg(){
      if(trækker) return;
      const trin = Math.round(tilstand[navn] * 100);
      if(Number(input.value) !== trin) input.value = trin;
      vis();
    },
  };
  return skydere[navn];
}

opretSkyder('ude',  'uden for cellen');
opretSkyder('inde', 'inde i cellen');

/* ── Render-løkken ─────────────────────────────────────── */
let sidstAflæst = 0, sidstGemt = 0;

model.naarOpdater((t, dt) => {
  membran.opdater(t);
  for(const m of MEKANISMER) m.opdater?.(t, dt, ctx);

  /* Aflæsningen følger uret, ikke billederne: er bevægelse slået
     fra, står figuren stille, men tallene skal stadig komme frem. */
  const nu = performance.now();
  if(nu - sidstAflæst > 200){
    sidstAflæst = nu;
    visInstrumenter();
    if(!tilstand.fast){
      skydere.ude.følg(); skydere.inde.følg();
      /* Gradienten udligner sig selv, og skyderne flytter sig med.
         Adressen skal følge med, men ikke skrives om ved hvert tik. */
      if(nu - sidstGemt > 1500){ sidstGemt = nu; gemTilstand(); }
    }
  }
});

/* ── Værktøjsknapper ───────────────────────────────────── */
const knapper = {};

function trykknap(id, udgangspunkt, virkning){
  const b = el(id);
  const k = {
    værdi: udgangspunkt,
    sæt(v, gem = true){
      k.værdi = v;
      b.setAttribute('aria-pressed', v ? 'true' : 'false');
      virkning(v);
      if(gem) gemTilstand();
    },
  };
  b.addEventListener('click', () => k.sæt(!k.værdi));
  k.sæt(udgangspunkt, false);
  knapper[id] = k;
  return k;
}

trykknap('btn-kolesterol', true, v => {
  membran.sætKolesterol(v);
  fortæl(v ? 'Kolesterolet vises mellem fosfolipiderne.'
           : 'Kolesterolet er skjult.');
});

trykknap('btn-sukker', true, v => {
  membran.sætSukker(v);
  fortæl(v ? 'Kulhydratkæderne på ydersiden vises.'
           : 'Kulhydratkæderne er skjult.');
});

trykknap('btn-snit', false, v => {
  model.saetSnit(v);
  fortæl(v ? 'Membranen er skåret over, så man kan se ind mellem halerne.'
           : 'Membranen vises hel.');
});

trykknap('btn-fast', true, v => {
  tilstand.fast = v;
  fortæl(v ? 'Cellen forbruger ilten og får ny tilført, så forskellen holdes ved lige.'
           : 'Lukket system: diffusionen udligner nu forskellen af sig selv.');
});

trykknap('btn-projektor', false, v => {
  document.body.dataset.projektor = v ? '1' : '0';
  requestAnimationFrame(model.tilpasStoerrelse);
});

el('btn-nulstil').addEventListener('click', () => {
  model.nulstilKamera();
  fortæl('Kameraet viser hele membranen igen.');
});

/* Snittet vender altid mod kameraet og lægger sig gennem midten,
   så man kan se ind i lipidlaget dér, hvor molekylerne krydser. */
model.saetSnitPunkt({x:0, y:0, z:0}, 0);

/* ── Tilstand i adressen ───────────────────────────────── *
 * Så en figur kan deles præcis som den står på tavlen. Ventetiden
 * gør også, at der ikke skrives i adressen, mens gradienten er i
 * gang med at udligne sig — først når den er faldet til ro.     */
let gemTimer = null;
function gemTilstand(){
  clearTimeout(gemTimer);
  gemTimer = setTimeout(() => {
    const h = [
      `ude=${Math.round(tilstand.ude * 100)}`,
      `inde=${Math.round(tilstand.inde * 100)}`,
      `fast=${tilstand.fast ? 1 : 0}`,
      `kolesterol=${knapper['btn-kolesterol'].værdi ? 1 : 0}`,
      `sukker=${knapper['btn-sukker'].værdi ? 1 : 0}`,
      `snit=${knapper['btn-snit'].værdi ? 1 : 0}`,
    ];
    const del = membran.fremhævet;
    if(del) h.push(`del=${del}`);
    history.replaceState(null, '', '#' + h.join('&'));
  }, 500);
}

(function læsTilstand(){
  const q = new URLSearchParams(location.search);
  const h = new URLSearchParams(location.hash.replace(/^#/, ''));
  const hent = k => h.get(k) ?? q.get(k);

  for(const navn of ['ude', 'inde']){
    const v = Number(hent(navn));
    if(hent(navn) != null && Number.isFinite(v)){
      skydere[navn].sæt(Math.max(0, Math.min(30, Math.round(v))) / 100);
    }
  }

  for(const [nøgle, knap] of [
    ['fast',       'btn-fast'],
    ['kolesterol', 'btn-kolesterol'],
    ['sukker',     'btn-sukker'],
    ['snit',       'btn-snit'],
  ]){
    const v = hent(nøgle);
    if(v != null) knapper[knap].sæt(v === '1', false);
  }

  /* Er der ikke peget på noget endnu, står den transport, der
     kører, i ruden. */
  const del = hent('del');
  if(!(del && forklaring.visDel(del)) && MEKANISMER.length){
    forklaring.visTransport(MEKANISMER[0]);
  }

  if(q.get('projektor') === '1' || q.get('mode') === 'teach'){
    knapper['btn-projektor'].sæt(true, false);
  }
})();

visInstrumenter();
model.start();

/* Iframe-krom: figuren skal kunne lægges ind på en anden side. */
if(window.top !== window.self){
  const top = el('site-top');
  if(top) top.style.display = 'none';
  document.querySelectorAll('.foot, .head').forEach(n => { n.style.display = 'none'; });
  requestAnimationFrame(model.tilpasStoerrelse);
}
