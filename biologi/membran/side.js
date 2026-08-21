/* ═══════════════════════════════════════════════════════════
   side.js — indgangen.

   Binder DOM'en i membran.html sammen med modulerne, holder styr
   på sidens tilstand og på adressen. Al kode, der handler om
   *knapper og tilstand*, hører hjemme her; alt der handler om
   *figuren*, hører hjemme i model.js og struktur.js.
   ═══════════════════════════════════════════════════════════ */
import {byggScene}                 from './model.js';
import {byggMembran}               from './struktur.js';
import {opretForklaring}           from './forklaring.js';
import {MEKANISMER}                from './transport.js';
import {MED_GRADIENT, find as findMolekyle} from './molekyler.js';

/* Transportmekanismerne registrerer sig selv, når de indlæses, og
   de kører alle sammen samtidig: membranen er levende, ikke en
   række adskilte forsøg. En ny mekanisme er én ny fil plus én
   importlinje her. */
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

/* ── Sidens model ──────────────────────────────────────── *
 * Én gradient pr. stof. Koncentrationerne er i mmol/L på hver
 * side af membranen, og tallene kommer fra molekyler.js, hvor de
 * hører hjemme sammen med resten af fagdataene: ilt 0,26/0,05,
 * kalium 4/140, natrium 145/12, glukose 5,5/1.
 *
 * `fast` betyder, at cellen holder alle forskellene ved lige —
 * den forbruger og tilfører. Slås den fra, er systemet lukket:
 * så udligner diffusionen, kanalen og bæreren gradienterne, mens
 * pumpen bruger ATP på at trække dem den anden vej. Det er den
 * modsætning, hele siden handler om.                           */
const tilstand = {fast:true};
for(const m of MED_GRADIENT){
  tilstand[m.id] = {ude:m.gradient.ude, inde:m.gradient.inde};
}

/* Det stof, de to skydere skruer på lige nu. Fire stoffer ville
   give otte skydere, og så kan panelet ikke overskues — i stedet
   gælder skyderne det stof, der er valgt i forklaringsruden. */
let valgtStof = MED_GRADIENT[0].id;

const tal = (id, v) => {
  const g = findMolekyle(id).gradient;
  return v.toFixed(g.decimaler).replace('.', ',');
};

/* ── Figuren ───────────────────────────────────────────── */
const model = byggScene({
  lærred:  el('scene'),
  boks:    el('view'),
  hint:    el('hint'),
  start:   {az:0.62, el:0.26, dist:28},
  graenser:{minEl:-1.25, maxEl:1.25, minDist:8, maxDist:66},
});

const membran = byggMembran(model.scene);

/* Det, mekanismerne får at arbejde med. Se kontrakten i transport.js. */
const ctx = {scene:model.scene, membran, tilstand};
for(const m of MEKANISMER) m.byg?.(ctx);

const forklaring = opretForklaring({
  model, membran,
  lærred:     el('scene'),
  felter:     {stempel:el('fork-stempel'), navn:el('fork-navn'), tekst:el('fork-tekst')},
  signaturer: [...document.querySelectorAll('.fact[data-del]')],
  naarValgt:  delId => { følgValg(delId); gemTilstand(); },
});

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
    gaugeBoks.innerHTML = læst.map(() =>
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
 * Skyderne står i hele trin (0,01 mmol/L for ilt, 1 for ionerne,
 * 0,5 for glukose), så adressen kan holde dem som hele tal, og
 * så browseren ikke skal validere kommatal op mod `step`.     */
function opretSkyder(hvor, hvorTekst){
  const input   = el(`inp-${hvor}`);
  const visning = el(`val-${hvor}`);
  const mærkat  = el(`lab-${hvor}`);
  let trækker = false;

  function vis(){
    const navn = findMolekyle(valgtStof).gradient.kort;
    const v = tilstand[valgtStof][hvor];
    visning.textContent = tal(valgtStof, v);
    mærkat.textContent  = `${navn} ${hvorTekst}`;
    input.setAttribute('aria-valuetext',
      `${tal(valgtStof, v)} millimol per liter ${navn.toLowerCase()}`);
  }

  /* Skift af stof: skyderen får nyt spænd, ny værdi og ny mærkat. */
  function stof(){
    const g = findMolekyle(valgtStof).gradient;
    input.min  = 0;
    input.max  = Math.round(g.maks / g.trin);
    input.step = 1;
    input.value = Math.round(tilstand[valgtStof][hvor] / g.trin);
    vis();
  }

  input.addEventListener('input', () => {
    const g = findMolekyle(valgtStof).gradient;
    tilstand[valgtStof][hvor] = Number(input.value) * g.trin;
    vis();
    fortæl(`${g.kort} ${hvorTekst} er `
         + `${tal(valgtStof, tilstand[valgtStof][hvor])} millimol per liter.`);
    gemTilstand();
  });
  input.addEventListener('pointerdown', () => { trækker = true; });
  addEventListener('pointerup', () => { trækker = false; });

  return {
    stof,
    /* Når gradienten udligner sig selv — eller pumpen trækker den
       op igen — er det modellen, der fører skyderen. Men ikke midt
       i et træk, hvor eleven fører den. */
    følg(){
      if(trækker) return;
      const g = findMolekyle(valgtStof).gradient;
      const trin = Math.round(tilstand[valgtStof][hvor] / g.trin);
      if(Number(input.value) !== trin) input.value = trin;
      vis();
    },
  };
}

const skydere = {
  ude:  opretSkyder('ude',  'uden for cellen'),
  inde: opretSkyder('inde', 'inde i cellen'),
};

function sætStof(id, sig = true){
  if(!tilstand[id] || id === valgtStof) return;
  valgtStof = id;
  skydere.ude.stof(); skydere.inde.stof();
  if(sig) fortæl(`Skyderne gælder nu ${findMolekyle(id).gradient.kort.toLowerCase()}.`);
}

/* Peger eleven på et stof — eller på det protein, der flytter det
   — så skal skyderne handle om netop dét. Ellers bliver de stående:
   at klikke på en fosfolipidhale skal ikke flytte rundt på noget. */
function følgValg(delId){
  if(delId.startsWith('stof:')) return sætStof(delId.slice(5));
  const m = MEKANISMER.find(m => m.protein === delId);
  if(m) sætStof(m.molekyler.find(id => tilstand[id]));
}

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
      /* Gradienterne flytter sig selv, og skyderne følger med.
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
  fortæl(v ? 'Cellen holder alle forskellene ved lige — den forbruger og tilfører.'
           : 'Lukket system: nu udligner transporten forskellene, mens pumpen bruger ATP på at trække dem den anden vej.');
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
 * Så en figur kan deles præcis som den står på tavlen. Kun det,
 * der er lavet om, kommer med — ellers ville adressen fylde en
 * hel linje med tal, ingen har rørt. Ventetiden gør også, at der
 * ikke skrives i adressen, mens gradienterne er i gang med at
 * flytte sig — først når de er faldet til ro.                  */
let gemTimer = null;
function gemTilstand(){
  clearTimeout(gemTimer);
  gemTimer = setTimeout(() => {
    const h = [];

    for(const M of MED_GRADIENT){
      const g = M.gradient, T = tilstand[M.id];
      const ude  = Math.round(T.ude  / g.trin);
      const inde = Math.round(T.inde / g.trin);
      if(ude !== Math.round(g.ude / g.trin) || inde !== Math.round(g.inde / g.trin)){
        h.push(`${M.id}=${ude},${inde}`);
      }
    }
    if(valgtStof !== MED_GRADIENT[0].id) h.push(`stof=${valgtStof}`);

    for(const [nøgle, knap, standard] of [
      ['fast',       'btn-fast',       true],
      ['kolesterol', 'btn-kolesterol', true],
      ['sukker',     'btn-sukker',     true],
      ['snit',       'btn-snit',       false],
    ]){
      if(knapper[knap].værdi !== standard) h.push(`${nøgle}=${knapper[knap].værdi ? 1 : 0}`);
    }

    const del = membran.fremhævet;
    if(del) h.push(`del=${del}`);

    /* Står alt på standardværdierne, skal fragmentet væk igen — men
       ikke sidens query: `?projektor=1` skal overleve, at man skruer
       tilbage til udgangspunktet. */
    history.replaceState(null, '',
      h.length ? '#' + h.join('&') : location.pathname + location.search);
  }, 500);
}

(function læsTilstand(){
  const q = new URLSearchParams(location.search);
  const h = new URLSearchParams(location.hash.replace(/^#/, ''));
  const hent = k => h.get(k) ?? q.get(k);

  const sæt = (id, ude, inde) => {
    const g = findMolekyle(id).gradient, loft = Math.round(g.maks / g.trin);
    const rens = v => Math.max(0, Math.min(loft, Math.round(v))) * g.trin;
    if(Number.isFinite(ude))  tilstand[id].ude  = rens(ude);
    if(Number.isFinite(inde)) tilstand[id].inde = rens(inde);
  };

  for(const M of MED_GRADIENT){
    const v = hent(M.id);
    if(v == null) continue;
    const [ude, inde] = v.split(',').map(Number);
    sæt(M.id, ude, inde);
  }
  /* Ældre links delte ilt-skyderne som `ude` og `inde` alene. */
  if(hent('ude') != null || hent('inde') != null){
    sæt('o2', Number(hent('ude')), Number(hent('inde')));
  }

  const stof = hent('stof');
  if(stof && tilstand[stof]) valgtStof = stof;
  skydere.ude.stof(); skydere.inde.stof();

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
