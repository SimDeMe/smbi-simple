/* ═══════════════════════════════════════════════════════════
   side.js — indgangen.

   Binder DOM'en i membran2d.html sammen med modulerne, fordeler
   pladsen i membranen mellem transportvejene og holder styr på
   sidens tilstand og adresse. Al kode om *knapper og tilstand*
   hører hjemme her; alt om *figuren* hører hjemme i model.js,
   struktur.js og transport-*.js.
   ═══════════════════════════════════════════════════════════ */
import {byggLaerred}                 from './model.js';
import {MÅL, Y, byggDobbeltlag, tegnMærkat} from './struktur.js';
import {opretVand}                   from './vand.js';
import {opretForklaring}             from './forklaring.js';
import {MEKANISMER}                  from './transport.js';

/* Transportvejene registrerer sig selv, når de indlæses, og de
   kører alle sammen samtidig i den samme membran. En ny vej er
   én ny fil plus én importlinje her. Rækkefølgen er også
   rækkefølgen fra venstre mod højre i figuren. */
import './transport-diffusion.js';
import './transport-osmose.js';
import './transport-kanal.js';
import './transport-baerer.js';
import './transport-pumpe.js';
import './transport-symport.js';
import './transport-vesikel.js';

const el = id => document.getElementById(id);
const komma = (v, n = 1) => Number(v).toFixed(n).replace('.', ',');

/* Skjult besked til skærmlæsere — figuren siger ikke selv fra. */
let fortælUr = null;
function fortæl(tekst){
  clearTimeout(fortælUr);
  fortælUr = setTimeout(() => { el('status').textContent = tekst; }, 140);
}

/* ── Sidens model ──────────────────────────────────────── *
 * `fast` betyder, at cellen holder forskellene ved lige — den
 * forbruger og tilfører, som en levende celle gør. Slås den fra,
 * er systemet lukket, og transporten får lov at ændre
 * koncentrationerne, indtil mekanismerne selv går i stå.       */
const tilstand = {fast:true};
const vand = opretVand(tilstand);

/* ── Pladsen i membranen ───────────────────────────────── *
 * Hver transportvej får sit stykke af bredden, og mellemrummene
 * bliver til fosfolipider.                                      */
const brugt = MEKANISMER.reduce((s, m) => s + m.bredde, 0);
const hul   = (MÅL.bredde - brugt) / (MEKANISMER.length + 1);
let løbe = hul;
for(const m of MEKANISMER){
  m.omr = {x0:løbe, x1:løbe + m.bredde, midte:løbe + m.bredde / 2};
  løbe += m.bredde + hul;
}

const spans = MEKANISMER
  .filter(m => m.proteinBredde > 0)
  .map(m => ({x0:m.omr.midte - m.proteinBredde / 2, x1:m.omr.midte + m.proteinBredde / 2}));

const lag = byggDobbeltlag(spans);

/* Hver mekanisme får sin egen ctx — den samme model, sit eget
   stykke af membranen. */
for(const m of MEKANISMER){
  m.ctx = {vand, tilstand, omr:m.omr, t:0};
  m.byg?.(m.ctx);
}

/* ── Figuren ───────────────────────────────────────────── */
const model = byggLaerred({
  lærred: el('scene'), boks: el('view'),
  bredde: MÅL.bredde, højde: MÅL.højde,
});

model.saetHjem({cx:MÅL.bredde / 2, cy:MÅL.højde / 2, skala:1});

function zoomKasse(m){
  const luft = 34;
  /* Vandret er kassen transportvejens eget stykke; lodret er den
     så høj, vejen har brug for. `zoomMidte` flytter den, når det
     meste sker på den ene side af membranen — vesiklerne bruger
     cytosolen. */
  const midte = m.zoomMidte ?? MÅL.midte;
  return {
    x0:m.omr.x0 - luft, x1:m.omr.x1 + luft,
    y0:midte - m.zoomHøjde / 2, y1:midte + m.zoomHøjde / 2,
  };
}

model.naarSkridt((t, dt) => {
  lag.opdater(t);
  vand.opdater(dt);
  /* Mekanismerne — og instrumenterne — skal bruge modellens eget
     ur, ikke et de selv henter. Så kan de også køres uden for
     browseren og efterprøves. */
  for(const m of MEKANISMER){ m.ctx.t = t; m.opdater?.(t, dt, m.ctx); }
});

model.naarTegn((g, u) => {
  const valgt = forklaring.valgt;

  /* Vandet på hver side, så man kan se, hvad der er hvad. */
  g.save();
  g.fillStyle = '#EAF6FC';
  g.fillRect(u.x0 - 10, u.y0 - 10, u.x1 - u.x0 + 20, Y.ud - u.y0 + 10);
  g.fillStyle = '#FFF3DC';
  g.fillRect(u.x0 - 10, Y.ind, u.x1 - u.x0 + 20, u.y1 - Y.ind + 10);
  g.restore();

  lag.tegn(g, u, valgt ? 0.42 : 1);
  vand.tegn(g, u, valgt ? 0.5 : 1);

  for(const m of MEKANISMER){
    if(m.omr.x1 < u.x0 - 60 || m.omr.x0 > u.x1 + 60) continue;
    m.tegn?.(g, m.ctx, !valgt || valgt === m ? 1 : 0.28);
  }

  /* Hvilken side er hvad. Mærkaterne holder sig i venstre kant af
     det, kameraet ser, så de ikke lægger sig oven i proteinernes
     egne navne, og de har samme størrelse på skærmen, uanset hvor
     langt der er zoomet ind. */
  const str = 15 / model.kamera.skala;
  g.textAlign = 'left';
  const x = u.x0 + str * 9;
  tegnMærkat(g, 'uden for cellen', x, u.y0 + str * 2.4, {størrelse:str});
  tegnMærkat(g, 'inde i cellen · cytosol', x + str * 3.2, u.y1 - str * 2.4, {størrelse:str});
});

/* ── Forklaringsruden ──────────────────────────────────── */
const forklaring = opretForklaring({
  felter:     {stempel:el('fork-stempel'), navn:el('fork-navn'), tekst:el('fork-tekst')},
  signaturer: [...document.querySelectorAll('.fact[data-vej]')],
  mekanismer: MEKANISMER,
  naarValgt(m){
    if(m){ model.zoomTil(zoomKasse(m)); fortæl(`${m.navn}. ${m.beskrivelse}`); }
    else  { model.visAlt(); fortæl('Hele membranen med alle syv transportveje.'); }
    el('btn-hjem').hidden = !m;
    visSkydere();
    visInstrumenter(true);
    gemTilstand();
  },
});

/* ── Instrumenter ──────────────────────────────────────── *
 * Fire faste pladser. Er der ikke valgt en transportvej, viser de
 * de fire tal, der siger mest om membranen som helhed.          */
const gaugeBoks = el('gauges');
gaugeBoks.innerHTML = Array.from({length:4}, () =>
  `<div class="gauge"><dt></dt><dd><span class="tal"></span> <span class="enhed"></span></dd></div>`
).join('');
const gauge = [...gaugeBoks.querySelectorAll('.gauge')];

function oversigtstal(){
  const k = tilstand.konc;
  return [
    {mærkat:'Natrium ude / inde', værdi:`${Math.round(k.na.ude)} / ${Math.round(k.na.inde)}`, enhed:'mmol/L'},
    {mærkat:'Kalium ude / inde',  værdi:`${Math.round(k.k.ude)} / ${Math.round(k.k.inde)}`,   enhed:'mmol/L'},
    {mærkat:'Glukose ude / inde', værdi:`${komma(k.glukose.ude)} / ${komma(k.glukose.inde)}`, enhed:'mmol/L'},
    {mærkat:'Transportveje',      værdi:MEKANISMER.length, enhed:'i membranen'},
  ];
}

function visInstrumenter(nyOpsætning = false){
  const m = forklaring.valgt;
  const læst = m ? m.aflaes(m.ctx) : oversigtstal();
  læst.forEach((v, i) => {
    if(nyOpsætning) gauge[i].querySelector('dt').textContent = v.mærkat;
    gauge[i].querySelector('.tal').textContent   = v.værdi;
    gauge[i].querySelector('.enhed').textContent = v.enhed ?? '';
  });
}

/* ── Skydere ───────────────────────────────────────────── *
 * Fire faste pladser, så panelet ikke hopper i højden, når der
 * skiftes transportvej. De pladser, vejen ikke bruger, står tomme
 * med `visibility:hidden` — de fylder, men de ses ikke.          */
const knobBoks = el('knobs');
knobBoks.innerHTML = Array.from({length:4}, (_, i) => `
  <div class="knob" data-plads="${i}">
    <div class="knob-top">
      <label class="mono" for="inp-${i}"></label>
      <span class="knob-val"><span class="tal"></span> <span class="enhed"></span></span>
    </div>
    <input type="range" id="inp-${i}" min="0" max="100" step="1" value="0">
  </div>`).join('');
const knob = [...knobBoks.querySelectorAll('.knob')];
let aktive = [];

function visKnob(i, s){
  const rude = knob[i];
  const input = rude.querySelector('input');
  rude.style.visibility = s ? 'visible' : 'hidden';
  if(!s) return;
  rude.querySelector('label').textContent   = s.mærkat;
  rude.querySelector('.enhed').textContent  = s.enhed;
  input.style.setProperty('--kc', s.farve);
  input.min = 0;
  input.max = Math.round((s.max - s.min) / s.trin);
  input.step = 1;
  sætVisning(i, s);
}

function sætVisning(i, s){
  const input = knob[i].querySelector('input');
  const v = s.hent();
  const trin = Math.round((v - s.min) / s.trin);
  if(Number(input.value) !== trin) input.value = trin;
  const tekst = s.trin < 1 ? komma(v, s.trin < 0.05 ? 2 : 1) : String(Math.round(v));
  knob[i].querySelector('.tal').textContent = tekst;
  input.setAttribute('aria-valuetext', `${tekst} ${s.enhed}`);
}

for(let i = 0; i < 4; i++){
  const input = knob[i].querySelector('input');
  input.addEventListener('input', () => {
    const s = aktive[i];
    if(!s) return;
    s.sæt(s.min + Number(input.value) * s.trin);
    sætVisning(i, s);
    fortæl(`${s.mærkat}: ${knob[i].querySelector('.tal').textContent} ${s.enhed}.`);
    gemTilstand();
  });
  input.addEventListener('pointerdown', () => { knob[i].dataset.træk = '1'; });
  addEventListener('pointerup',        () => { delete knob[i].dataset.træk; });
}

function visSkydere(){
  const m = forklaring.valgt;
  aktive = (m?.skydere?.(m.ctx) ?? []).slice(0, 4);
  for(let i = 0; i < 4; i++) visKnob(i, aktive[i]);
  el('knobs').classList.toggle('tom', aktive.length === 0);
}

/* Modellen fører selv skyderne, når koncentrationerne ændrer sig —
   men ikke midt i et træk, hvor det er eleven, der fører dem. */
function følgSkydere(){
  for(let i = 0; i < 4; i++){
    if(aktive[i] && !knob[i].dataset.træk) sætVisning(i, aktive[i]);
  }
}

/* ── Udpegning i figuren ───────────────────────────────── */
const lærred = el('scene');

function vejVed(x){
  return MEKANISMER.find(m => x >= m.omr.x0 - 12 && x <= m.omr.x1 + 12) ?? null;
}

lærred.addEventListener('click', ev => {
  const {x} = model.tilLogisk(ev);
  const m = vejVed(x);
  forklaring.vis(m && m === forklaring.valgt ? null : m);
});

lærred.addEventListener('keydown', ev => {
  const nu = forklaring.valgt;
  const i = nu ? MEKANISMER.indexOf(nu) : -1;
  if(ev.key === 'ArrowRight'){ forklaring.vis(MEKANISMER[(i + 1) % MEKANISMER.length]); }
  else if(ev.key === 'ArrowLeft'){ forklaring.vis(MEKANISMER[(i <= 0 ? MEKANISMER.length : i) - 1]); }
  else if(ev.key === 'Escape'){ forklaring.vis(null); }
  else return;
  ev.preventDefault();
});

/* ── Værktøjsknapper ───────────────────────────────────── */
const knapper = {};

function trykknap(id, udgangspunkt, virkning){
  const b = el(id);
  const k = {
    værdi:udgangspunkt,
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
  lag.sætKolesterol(v);
  fortæl(v ? 'Kolesterolet vises mellem fosfolipiderne.' : 'Kolesterolet er skjult.');
});

trykknap('btn-fast', true, v => {
  tilstand.fast = v;
  fortæl(v ? 'Cellen holder forskellene ved lige, som en levende celle gør.'
           : 'Lukket system: transporten ændrer nu koncentrationerne.');
});

trykknap('btn-pause', false, v => {
  model.sætPause(v);
  el('btn-pause').textContent = v ? 'Kør' : 'Pause';
  fortæl(v ? 'Figuren står stille.' : 'Figuren kører igen.');
});

trykknap('btn-projektor', false, v => {
  document.body.dataset.projektor = v ? '1' : '0';
  requestAnimationFrame(model.tilpasStoerrelse);
});

el('btn-hjem').addEventListener('click', () => forklaring.vis(null));

/* ── Løkkens efterarbejde ──────────────────────────────── */
let sidstAflæst = 0;
model.naarSkridt(() => {
  const nu = performance.now();
  if(nu - sidstAflæst < 200) return;
  sidstAflæst = nu;
  visInstrumenter();
  if(!tilstand.fast) følgSkydere();
});

/* ── Tilstand i adressen ───────────────────────────────── *
 * Så en figur kan deles præcis, som den står på tavlen.       */
let gemUr = null;
function gemTilstand(){
  clearTimeout(gemUr);
  gemUr = setTimeout(() => {
    const h = [
      `fast=${tilstand.fast ? 1 : 0}`,
      `kolesterol=${knapper['btn-kolesterol'].værdi ? 1 : 0}`,
    ];
    if(forklaring.valgt) h.push(`vej=${forklaring.valgt.id}`);
    aktive.forEach((s, i) => h.push(`s${i}=${Math.round((s.hent() - s.min) / s.trin)}`));
    history.replaceState(null, '', '#' + h.join('&'));
  }, 600);
}

(function læsTilstand(){
  const q = new URLSearchParams(location.search);
  const h = new URLSearchParams(location.hash.replace(/^#/, ''));
  const hent = k => h.get(k) ?? q.get(k);

  for(const [nøgle, knap] of [['fast', 'btn-fast'], ['kolesterol', 'btn-kolesterol']]){
    const v = hent(nøgle);
    if(v != null) knapper[knap].sæt(v === '1', false);
  }

  const vej = hent('vej');
  forklaring.vis(MEKANISMER.find(m => m.id === vej) ?? null);

  aktive.forEach((s, i) => {
    const v = hent(`s${i}`);
    if(v == null || !Number.isFinite(Number(v))) return;
    const trin = Math.max(0, Math.min(Math.round((s.max - s.min) / s.trin), Math.round(Number(v))));
    s.sæt(s.min + trin * s.trin);
    sætVisning(i, s);
  });

  if(q.get('projektor') === '1' || q.get('mode') === 'teach'){
    knapper['btn-projektor'].sæt(true, false);
  }
})();

visInstrumenter(true);
model.start();

/* Iframe-krom: figuren skal kunne lægges ind på en anden side. */
if(window.top !== window.self){
  const top = el('site-top');
  if(top) top.style.display = 'none';
  document.querySelectorAll('.foot, .head').forEach(n => { n.style.display = 'none'; });
  requestAnimationFrame(model.tilpasStoerrelse);
}
