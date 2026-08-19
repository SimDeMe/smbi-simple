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
import {MEKANISMER, find as findVej} from './transport.js';
import {find as findMolekyle}        from './molekyler.js';

/* Transportmekanismerne registrerer sig selv, når de indlæses.
   Rækkefølgen her er den, knapperne står i. Trin 6-9 fylder
   mekanikken ud; indtil da leverer de kun deres beskrivelse. */
import './transport-diffusion.js';
import './transport-kanal.js';
import './transport-baerer.js';
import './transport-pumpe.js';

const el = id => document.getElementById(id);

/* Skjult besked til skærmlæsere — figuren siger ikke selv fra. */
let fortælTimer = null;
function fortæl(tekst){
  clearTimeout(fortælTimer);
  fortælTimer = setTimeout(() => { el('status').textContent = tekst; }, 120);
}

/* ── Figuren ───────────────────────────────────────────── */
const model = byggScene({
  lærred:  el('scene'),
  boks:    el('view'),
  hint:    el('hint'),
  start:   {az:0.62, el:0.26, dist:28},
  graenser:{minEl:-1.25, maxEl:1.25, minDist:8, maxDist:66},
});

const membran = byggMembran(model.scene);
model.naarOpdater(t => membran.opdater(t));

const forklaring = opretForklaring({
  model, membran,
  lærred:     el('scene'),
  felter:     {stempel:el('fork-stempel'), navn:el('fork-navn'), tekst:el('fork-tekst')},
  signaturer: [...document.querySelectorAll('.fact[data-del]')],
  naarValgt:  () => gemTilstand(),
});

/* ── Transportvælgeren ─────────────────────────────────── */
const vejknapper = [...document.querySelectorAll('.pill[data-vej]')];
let valgtVej = null;

/** Instrumenterne viser det, der er kendt om den valgte vej.
    Trin 6-9 supplerer med tal fra mekanismens `aflaes()`. */
function visInstrumenter(m){
  el('g-type').textContent   = m.slags === 'aktiv' ? 'Aktiv transport' : 'Passiv transport';
  el('g-energi').textContent = m.energi;
  el('g-protein').textContent = m.protein
    ? membran.findProtein(m.protein).navn
    : 'Intet protein';
  el('g-stoffer').textContent = m.molekyler
    .map(id => findMolekyle(id)?.formel ?? id)
    .join(' · ');
}

function vælgVej(id, {flyv = true} = {}){
  const m = findVej(id);
  if(!m) return;
  valgtVej = m;
  for(const b of vejknapper){
    b.setAttribute('aria-pressed', b.dataset.vej === id ? 'true' : 'false');
  }
  visInstrumenter(m);
  forklaring.visVej(m);

  /* Det protein, vejen bruger — eller det stykke rent dobbeltlag,
     hvor den simple diffusion foregår. */
  const sted = m.protein ? membran.findProtein(m.protein) : m.sted;

  /* Tværsnittet skal skære lige foran vejen, så knappen viser ind i
     membranen det rigtige sted — uden at save proteinet over. */
  model.saetSnitPunkt({x:sted.x, y:0, z:sted.z}, m.protein ? 2.2 : 0.8);

  if(flyv){
    model.flyvTil({
      el:   m.kamera?.el   ?? 0.40,
      dist: m.kamera?.dist ?? 13,
      mål:  {x:sted.x, y:m.kamera?.y ?? 0, z:sted.z},
    });
  }
  gemTilstand();
}

for(const b of vejknapper){
  b.addEventListener('click', () => vælgVej(b.dataset.vej));
}

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

trykknap('btn-projektor', false, v => {
  document.body.dataset.projektor = v ? '1' : '0';
  requestAnimationFrame(model.tilpasStoerrelse);
});

el('btn-nulstil').addEventListener('click', () => {
  model.nulstilKamera();
  fortæl('Kameraet viser hele membranen igen.');
});

/* ── Tilstand i adressen ───────────────────────────────── *
 * Så en figur kan deles præcis som den står på tavlen.      */
let gemTimer = null;
function gemTilstand(){
  clearTimeout(gemTimer);
  gemTimer = setTimeout(() => {
    const h = [
      `vej=${valgtVej ? valgtVej.id : MEKANISMER[0].id}`,
      `kolesterol=${knapper['btn-kolesterol'].værdi ? 1 : 0}`,
      `sukker=${knapper['btn-sukker'].værdi ? 1 : 0}`,
      `snit=${knapper['btn-snit'].værdi ? 1 : 0}`,
    ];
    const del = membran.fremhævet;
    if(del) h.push(`del=${del}`);
    history.replaceState(null, '', '#' + h.join('&'));
  }, 250);
}

(function læsTilstand(){
  const q = new URLSearchParams(location.search);
  const h = new URLSearchParams(location.hash.replace(/^#/, ''));
  const hent = k => h.get(k) ?? q.get(k);

  for(const [nøgle, knap] of [
    ['kolesterol', 'btn-kolesterol'],
    ['sukker',     'btn-sukker'],
    ['snit',       'btn-snit'],
  ]){
    const v = hent(nøgle);
    if(v != null) knapper[knap].sæt(v === '1', false);
  }

  /* Ved indlæsning vises hele membranen — der flyves ikke.
     Vejen er stadig valgt, så instrumenterne har noget at vise. */
  vælgVej(hent('vej') ?? MEKANISMER[0].id, {flyv:false});

  const del = hent('del');
  if(del) forklaring.visDel(del);

  if(q.get('projektor') === '1' || q.get('mode') === 'teach'){
    knapper['btn-projektor'].sæt(true, false);
  }
})();

model.start();

/* Iframe-krom: figuren skal kunne lægges ind på en anden side. */
if(window.top !== window.self){
  const top = el('site-top');
  if(top) top.style.display = 'none';
  document.querySelectorAll('.foot, .head').forEach(n => { n.style.display = 'none'; });
  requestAnimationFrame(model.tilpasStoerrelse);
}
