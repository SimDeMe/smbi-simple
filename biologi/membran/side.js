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
import './transport-baerer.js';
import './transport-pumpe.js';
import './transport-aquaporin.js';

const el  = id => document.getElementById(id);

/* Skjult besked til skærmlæsere — figuren siger ikke selv fra. */
let fortælTimer = null;
function fortæl(tekst){
  clearTimeout(fortælTimer);
  fortælTimer = setTimeout(() => { el('status').textContent = tekst; }, 120);
}

/* ── Sidens model ──────────────────────────────────────── *
 * Hvert stof har sin egen gradient, i mmol/L på nær vand — se
 * transport-aquaporin.js for hvorfor vand er en undtagelse.
 * `min`/`maks`/`trin`/`decimaler`/`enhed`/`navn` styrer kun
 * skyderne herunder; det er `ude`/`inde`, mekanismerne læser og
 * skriver i. `fast` gælder ilt, glukose og vand: cellen tilfører
 * og forbruger dem, så forskellen holdes ved lige, medmindre
 * systemet er lukket. Natrium og kalium har intet med `fast` at
 * gøre — deres forskel holdes udelukkende oppe af balancen
 * mellem pumpen og kanalens lækage, se transport-pumpe.js.      */
const STOF_STANDARD = {
  o2:      {ude:0.26, inde:0.05, min:0,  maks:0.30, trin:0.01, decimaler:2, enhed:'mmol/L', navn:'Ilt'},
  k:       {ude:4,    inde:140,  min:0,  maks:160,  trin:1,    decimaler:0, enhed:'mmol/L', navn:'Kalium'},
  na:      {ude:145,  inde:12,   min:0,  maks:160,  trin:1,    decimaler:0, enhed:'mmol/L', navn:'Natrium'},
  glukose: {ude:5,    inde:1,    min:0,  maks:10,   trin:0.1,  decimaler:1, enhed:'mmol/L', navn:'Glukose'},
  h2o:     {ude:100,  inde:97,   min:80, maks:100,  trin:1,    decimaler:0, enhed:'%',      navn:'Vand'},
};
const tilstand = {
  stof: Object.fromEntries(Object.entries(STOF_STANDARD).map(([id, s]) => [id, {...s}])),
  fast: true,
};
const skalaAf = id => 10 ** tilstand.stof[id].decimaler;
const fmtStof = (id, v) => v.toFixed(tilstand.stof[id].decimaler).replace('.', ',');

/* ── Figuren ───────────────────────────────────────────── */
const model = byggScene({
  lærred:  el('scene'),
  boks:    el('view'),
  hint:    el('hint'),
  start:   {az:0.62, el:0.26, dist:28},
  graenser:{minEl:-1.25, maxEl:1.25, minDist:8, maxDist:66},
});

const membran = byggMembran(model.scene);

/* ── Skyderne — kun ét stof ad gangen ──────────────────── *
 * .knobs har plads til to skydere. Frem for at bygge et sæt pr.
 * stof — og skulle finde ud af, hvordan seks sæt skydere kan stå
 * uden at fylde hele siden — genbruges de samme to: de viser det
 * stof, der sidst er peget på i figuren (design_rules.md, trin
 * 10 i PLAN.md). Adressen husker værdierne for alle stoffer,
 * uanset hvilket der lige nu står i skyderne.                   */
let activeStof = 'o2';
const inpUde  = el('inp-ude'),  inpInde  = el('inp-inde');
const valUde  = el('val-ude'),  valInde  = el('val-inde');
const labUde  = el('lab-ude'),  labInde  = el('lab-inde');
const enhUde  = el('enh-ude'),  enhInde  = el('enh-inde');
let trækkerUde = false, trækkerInde = false;

function visKnobVærdier(){
  const S = tilstand.stof[activeStof], skala = skalaAf(activeStof);
  if(!trækkerUde)  inpUde.value  = Math.round(S.ude  * skala);
  if(!trækkerInde) inpInde.value = Math.round(S.inde * skala);
  valUde.textContent  = fmtStof(activeStof, S.ude);
  valInde.textContent = fmtStof(activeStof, S.inde);
  inpUde.setAttribute('aria-valuetext',  `${fmtStof(activeStof, S.ude)} ${S.enhed}`);
  inpInde.setAttribute('aria-valuetext', `${fmtStof(activeStof, S.inde)} ${S.enhed}`);
}

/** Programmerer de to skydere om til det stof, der nu er aktivt. */
function tegnKnob(){
  const S = tilstand.stof[activeStof], skala = skalaAf(activeStof);
  const min = Math.round(S.min * skala), maks = Math.round(S.maks * skala);
  const trin = Math.max(1, Math.round(S.trin * skala));
  for(const inp of [inpUde, inpInde]){
    inp.min = min; inp.max = maks; inp.step = trin;
  }
  labUde.textContent  = `${S.navn} uden for cellen`;
  labInde.textContent = `${S.navn} inde i cellen`;
  enhUde.textContent = enhInde.textContent = S.enhed;
  visKnobVærdier();
}

function fortælStof(id, hvor){
  const S = tilstand.stof[id];
  const hvorTekst = hvor === 'ude' ? 'uden for cellen' : 'inde i cellen';
  fortæl(`${S.navn} ${hvorTekst} er nu ${fmtStof(id, S[hvor])} ${S.enhed}.`);
}

inpUde.addEventListener('input', () => {
  tilstand.stof[activeStof].ude = Number(inpUde.value) / skalaAf(activeStof);
  visKnobVærdier();
  fortælStof(activeStof, 'ude');
  gemTilstand();
});
inpInde.addEventListener('input', () => {
  tilstand.stof[activeStof].inde = Number(inpInde.value) / skalaAf(activeStof);
  visKnobVærdier();
  fortælStof(activeStof, 'inde');
  gemTilstand();
});
inpUde.addEventListener('pointerdown',  () => { trækkerUde  = true; });
inpInde.addEventListener('pointerdown', () => { trækkerInde = true; });
addEventListener('pointerup', () => { trækkerUde = false; trækkerInde = false; });

tegnKnob();

const forklaring = opretForklaring({
  model, membran,
  lærred:     el('scene'),
  felter:     {stempel:el('fork-stempel'), navn:el('fork-navn'), tekst:el('fork-tekst')},
  signaturer: [...document.querySelectorAll('.fact[data-del]')],
  naarValgt:  delId => {
    if(delId && delId.startsWith('stof:')){
      const id = delId.slice(5);
      if(tilstand.stof[id]){ activeStof = id; tegnKnob(); }
    }
    gemTilstand();
  },
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

/* ── Render-løkken ─────────────────────────────────────── */
let sidstAflæst = 0, sidstGemt = 0;

model.naarOpdater((t, dt) => {
  membran.opdater(t);
  for(const m of MEKANISMER) m.opdater?.(t, dt, ctx);

  /* Aflæsningen følger uret, ikke billederne: er bevægelse slået
     fra, står figuren stille, men tallene skal stadig komme frem.
     Kalium og natrium ændrer sig altid lidt — pumpen og kanalens
     lækage kører hele tiden — så skyderne følges med, uanset
     `fast`. */
  const nu = performance.now();
  if(nu - sidstAflæst > 200){
    sidstAflæst = nu;
    visInstrumenter();
    visKnobVærdier();
    if(nu - sidstGemt > 1500){ sidstGemt = nu; gemTilstand(); }
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
  fortæl(v
    ? 'Cellen tilfører nu ilt, glukose og vand, så deres forskel holdes ved lige. Natrium og kalium styres stadig af pumpen.'
    : 'Lukket system: ilt, glukose og vand udlignes nu af sig selv. Natrium og kalium styres stadig af pumpen.');
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
 * gør også, at der ikke skrives i adressen ved hvert enkelt tik,
 * mens en gradient er i gang med at ændre sig.                  */
let gemTimer = null;
function gemTilstand(){
  clearTimeout(gemTimer);
  gemTimer = setTimeout(() => {
    const h = [];
    for(const [id, S] of Object.entries(tilstand.stof)){
      const skala = skalaAf(id);
      h.push(`${id}-ude=${Math.round(S.ude * skala)}`);
      h.push(`${id}-inde=${Math.round(S.inde * skala)}`);
    }
    h.push(`fast=${tilstand.fast ? 1 : 0}`);
    h.push(`kolesterol=${knapper['btn-kolesterol'].værdi ? 1 : 0}`);
    h.push(`sukker=${knapper['btn-sukker'].værdi ? 1 : 0}`);
    h.push(`snit=${knapper['btn-snit'].værdi ? 1 : 0}`);
    const del = membran.fremhævet;
    if(del) h.push(`del=${del}`);
    history.replaceState(null, '', '#' + h.join('&'));
  }, 500);
}

(function læsTilstand(){
  const q = new URLSearchParams(location.search);
  const h = new URLSearchParams(location.hash.replace(/^#/, ''));
  const hent = k => h.get(k) ?? q.get(k);

  for(const [id, S] of Object.entries(tilstand.stof)){
    const skala = skalaAf(id);
    for(const hvor of ['ude', 'inde']){
      const rå = hent(`${id}-${hvor}`);
      if(rå == null) continue;
      const v = Number(rå);
      if(Number.isFinite(v)) S[hvor] = Math.max(S.min, Math.min(S.maks, v / skala));
    }
  }
  tegnKnob();

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
