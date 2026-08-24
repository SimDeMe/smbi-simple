// kalender.js — Kalendervisning i Historik: én dag ad gangen
//
// Viser dagens registreringer som blokke på en tidsakse. Overlappende
// registreringer lægges ved siden af hinanden. Uregistreret tid er bare tom
// plads på aksen — tryk på den for at oprette en post. Korte pauser er
// almindelige poster (se pauser.js) og vises dæmpet.

import { db, showToast } from './app.js';
import { getLoadedActivities } from './activities.js';
import { openEntrySheet } from './historik.js';
import { fmtMins } from './timer.js';
import { erPause, PAUSE_NAVN } from './pauser.js';
import {
  collection, onSnapshot, query, where, orderBy, Timestamp
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

// ─── Konstanter ───────────────────────────────────────────
const HOUR_H          = 48;          // px pr. time på tidsaksen
const PX_MIN          = HOUR_H / 60;
const DEFAULT_FROM_H  = 6;           // tidsaksen starter tidligst her
const DEFAULT_TO_H    = 22;          // ... og slutter senest her, hvis intet andet
const SNAP_MIN        = 15;          // afrunding ved tryk på tom plads
const DAY_MS          = 86400000;

// ─── State ────────────────────────────────────────────────
let userId       = null;
let selectedDay  = startOfDay(new Date());
let dayEntries   = [];
let unsubEntries = null;
let listenersOk  = false;
let isVisible    = false;
let tick         = null;

// ─── Init ─────────────────────────────────────────────────
export function initKalenderView(uid) {
  if (userId === uid) return;
  userId = uid;
  bindListeners();
}

// Kaldes når Historik-fanen åbnes
export function refreshKalender() {
  if (!userId || !isVisible) return;
  setupEntriesListener();
  render();
}

// ─── Visningsskift (Liste / Kalender) ─────────────────────
function setMode(mode) {
  isVisible = mode === 'kalender';

  document.querySelectorAll('.hist-mode-tab').forEach(b =>
    b.classList.toggle('hist-mode-tab-active', b.dataset.mode === mode));
  document.getElementById('hist-mode-liste')
    ?.classList.toggle('hidden', isVisible);
  document.getElementById('hist-mode-kalender')
    ?.classList.toggle('hidden', !isVisible);

  if (isVisible) {
    setupEntriesListener();
    render();
    startTick();
  } else {
    stopTick();
    if (unsubEntries) { unsubEntries(); unsubEntries = null; }
  }
}

// Nu-linjen og igangværende blokke skal følge med uret
function startTick() {
  stopTick();
  tick = setInterval(() => { if (isVisible) render(); }, 60000);
}
function stopTick() {
  if (tick) { clearInterval(tick); tick = null; }
}

// ─── Dagvalg ──────────────────────────────────────────────
function setDay(date) {
  selectedDay = startOfDay(date);
  dayEntries  = [];          // den nye dags poster hentes af lytteren
  setupEntriesListener(true);
  render();
}

// ─── Firestore-lytter for den valgte dag ──────────────────
function setupEntriesListener(force = false) {
  if (unsubEntries && !force) return;
  if (unsubEntries) { unsubEntries(); unsubEntries = null; }

  const dayStart = selectedDay;
  const dayEnd   = new Date(dayStart.getTime() + DAY_MS);
  // Registreringer der begynder dagen før kan række ind i dagen — derfor
  // hentes to døgn bagud og filtreres på overlap bagefter.
  const from = new Date(dayStart.getTime() - 2 * DAY_MS);

  unsubEntries = onSnapshot(
    query(
      collection(db, `users/${userId}/entries`),
      where('startTime', '>=', Timestamp.fromDate(from)),
      where('startTime', '<',  Timestamp.fromDate(dayEnd)),
      orderBy('startTime')
    ),
    snap => {
      dayEntries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      render();
    },
    err => console.error('Kalender-lytter:', err)
  );
}

// ─── Fra registrering til blok på aksen ───────────────────
function toItem(e) {
  if (!e.startTime) return null;
  const acts     = getLoadedActivities();
  const dayStart = selectedDay;
  const dayEnd   = new Date(dayStart.getTime() + DAY_MS);
  const now      = new Date();

  const s        = e.startTime.toDate();
  const isActive = !e.endTime;
  const end      = isActive ? now : e.endTime.toDate();
  if (end <= dayStart || s >= dayEnd) return null;   // uden for dagen

  const act    = acts.find(a => a.id === e.activityId);
  const isPause = erPause(e);
  const raw    = { start: minutesInto(s, dayStart), end: minutesInto(end, dayStart) };

  return {
    id:        e.id,
    name:      isPause ? PAUSE_NAVN
                       : act?.name || (e.activityId ? 'Slettet aktivitet' : 'Ubundet tid'),
    color:     act?.color || '#94a3b8',
    isPause,
    workType:  e.workType || null,
    note:      e.note || '',
    isActive,
    clipTop:    raw.start < 0,
    clipBottom: raw.end > 1440,
    // Afrundes til hele minutter, så både placering og varigheder bliver pæne
    startMin:  Math.max(0, Math.round(raw.start)),
    endMin:    Math.min(1440, Math.round(raw.end)),
    realStart: s,
    realEnd:   isActive ? null : end,
    col: 0, cols: 1
  };
}

// ─── Overlap: pak blokke i kolonner ───────────────────────
// Blokke der overlapper hinanden samles i en klynge og fordeles på det
// mindst mulige antal kolonner, så alle er synlige ved siden af hinanden.
function layoutColumns(items) {
  let cluster = [];
  let clusterEnd = -1;

  const flush = () => {
    if (!cluster.length) return;
    const colEnds = [];
    cluster.forEach(it => {
      let c = colEnds.findIndex(endMin => endMin <= it.startMin);
      if (c === -1) { colEnds.push(it.endMin); c = colEnds.length - 1; }
      else colEnds[c] = it.endMin;
      it.col = c;
    });
    cluster.forEach(it => { it.cols = colEnds.length; });
    cluster = [];
  };

  items.forEach(it => {
    // En blok med 0 minutters længde skal stadig kunne ses
    const visEnd = Math.max(it.endMin, it.startMin + 1);
    if (cluster.length && it.startMin >= clusterEnd) { flush(); clusterEnd = -1; }
    cluster.push(it);
    clusterEnd = Math.max(clusterEnd, visEnd);
  });
  flush();
  return items;
}

// ─── Tidsvindue for aksen ─────────────────────────────────
function windowFor(items) {
  let from = DEFAULT_FROM_H, to = DEFAULT_TO_H;
  items.forEach(it => {
    from = Math.min(from, Math.floor(it.startMin / 60));
    to   = Math.max(to,   Math.ceil(it.endMin / 60));
  });
  if (isToday(selectedDay)) {
    const n = minutesInto(new Date(), selectedDay);
    from = Math.min(from, Math.floor(n / 60));
    to   = Math.max(to,   Math.ceil((n + 30) / 60));
  }
  from = Math.max(0, from);
  to   = Math.min(24, Math.max(to, from + 4));
  return { from, to };
}

// ─── Render ───────────────────────────────────────────────
function render() {
  const grid = document.getElementById('kal-grid');
  if (!grid) return;

  const items = layoutColumns(
    dayEntries.map(toItem).filter(Boolean).sort((a, b) => a.startMin - b.startMin)
  );
  const { from, to } = windowFor(items);
  const top0 = from * 60;   // minut-nulpunkt for aksen

  renderHeader(items);

  const y = min => (min - top0) * PX_MIN;

  let hours = '';
  for (let h = from; h <= to; h++) {
    hours += `<div class="kal-hour" style="top:${y(h * 60)}px">
      <span class="kal-hour-lab">${String(h).padStart(2, '0')}</span>
    </div>`;
    if (h < to) hours += `<div class="kal-halfhour" style="top:${y(h * 60 + 30)}px"></div>`;
  }

  let lane = '';

  items.forEach(it => {
    // En pause må gerne blive lavere end en rigtig blok — den skal kunne ses,
    // men ikke skubbe til dagens arbejde
    const h    = Math.max(it.isPause ? 11 : 16, (it.endMin - it.startMin) * PX_MIN);
    const w    = 100 / it.cols;
    // Varigheden er den del, der ligger inden for dagen — en registrering
    // hen over midnat vises derfor med '…' og kun dagens andel.
    const dur  = it.isActive
      ? 'i gang'
      : fmtMins(Math.max(0, Math.round(it.endMin - it.startMin)));
    const tid  = it.isActive
      ? fmtTime(it.realStart)
      : `${it.clipTop ? '…' : fmtTime(it.realStart)}–${it.clipBottom ? '…' : fmtTime(it.realEnd)}`;
    // I en smal, lav blok er der kun plads til navnet
    const visTid = !(h < 34 && it.cols > 1);
    const wt   = it.workType ? ` · ${capitalize(it.workType)}` : '';
    const cls  = [
      h < 34 ? 'kal-block-sm' : '',
      it.isPause ? 'kal-block-pause' : '',
      it.isActive ? 'kal-block-active' : '',
      it.clipTop ? 'kal-block-clip-top' : '',
      it.clipBottom ? 'kal-block-clip-bottom' : ''
    ].filter(Boolean).join(' ');

    lane += `<button type="button" class="kal-block ${cls}" data-id="${it.id}"
        style="top:${y(it.startMin)}px;height:${h}px;left:${it.col * w}%;width:${w}%;--act-color:${it.color}"
        aria-label="${esc(it.name)}${esc(wt)}, ${tid}, ${dur}">
      <span class="kal-block-title">${esc(it.name)}<span class="kal-block-wt">${esc(wt)}</span></span>
      ${visTid ? `<span class="kal-block-time">${tid} · ${dur}</span>` : ''}
    </button>`;
  });

  if (isToday(selectedDay)) {
    const n = minutesInto(new Date(), selectedDay);
    if (n >= top0 && n <= to * 60)
      lane += `<div class="kal-now" style="top:${y(n)}px"><span class="kal-now-dot"></span></div>`;
  }

  if (!items.length)
    lane += `<div class="kal-empty">Ingen registreringer denne dag<br>
      <span>Tryk på tidsaksen for at oprette en</span></div>`;

  grid.style.height = `${(to - from) * HOUR_H}px`;
  grid.innerHTML = `${hours}<div class="kal-lane" id="kal-lane" data-from="${top0}">${lane}</div>`;

  const laneEl = document.getElementById('kal-lane');
  laneEl.querySelectorAll('.kal-block').forEach(b =>
    b.addEventListener('click', ev => { ev.stopPropagation(); openEntrySheet(b.dataset.id); }));
  laneEl.addEventListener('click', ev => {
    if (ev.target.closest('.kal-block')) return;
    const rect = laneEl.getBoundingClientRect();
    const min  = top0 + (ev.clientY - rect.top) / PX_MIN;
    const snap = Math.floor(min / SNAP_MIN) * SNAP_MIN;
    newEntryAt(snap, snap + 60);
  });
}

// ─── Sidehoved med dato og dagens tal ─────────────────────
function renderHeader(items) {
  const t = document.getElementById('kal-title');
  const s = document.getElementById('kal-sub');
  const d = document.getElementById('kal-date');
  if (t) t.textContent = dayTitle(selectedDay);
  if (s) s.textContent = longDate(selectedDay);
  if (d) d.value = toDateInput(selectedDay);

  // Pauser er ikke arbejdstid og holdes uden for dagens total
  const laengde   = it => it.endMin - it.startMin;
  const total     = items.filter(it => !it.isPause).reduce((sum, it) => sum + laengde(it), 0);
  const pauseMins = items.filter(it =>  it.isPause).reduce((sum, it) => sum + laengde(it), 0);

  const tot = document.getElementById('kal-total');
  if (tot) tot.textContent = total ? fmtMins(Math.round(total)) : '0m';

  const pauseEl = document.getElementById('kal-pausestat');
  if (pauseEl) {
    pauseEl.textContent = pauseMins ? `${fmtMins(Math.round(pauseMins))} pause` : '';
    pauseEl.classList.toggle('hidden', !pauseMins);
  }
}

// ─── Ny registrering fra kalenderen ───────────────────────
function newEntryAt(startMin, endMin) {
  const dayStart = selectedDay;
  const now      = new Date();
  let start = new Date(dayStart.getTime() + startMin * 60000);
  let end   = new Date(dayStart.getTime() + Math.min(endMin, 1440) * 60000);

  if (start > now) { showToast('Kan ikke registrere i fremtiden'); return; }
  if (end > now)   end = now;
  // Sluttid skal altid med — ellers ville posten blive oprettet som aktiv
  if (end <= start) end = new Date(start.getTime() + SNAP_MIN * 60000);

  openEntrySheet(null, { start, end });
}

// ─── Lyttere ──────────────────────────────────────────────
function bindListeners() {
  if (listenersOk) return;
  listenersOk = true;

  document.querySelectorAll('.hist-mode-tab').forEach(btn =>
    btn.addEventListener('click', () => setMode(btn.dataset.mode)));

  document.getElementById('kal-prev')?.addEventListener('click', () =>
    setDay(new Date(selectedDay.getTime() - DAY_MS)));
  document.getElementById('kal-next')?.addEventListener('click', () =>
    setDay(new Date(selectedDay.getTime() + DAY_MS)));
  document.getElementById('kal-today')?.addEventListener('click', () =>
    setDay(new Date()));
  document.getElementById('kal-date')?.addEventListener('change', ev => {
    const [y, m, d] = ev.target.value.split('-').map(Number);
    if (y && m && d) setDay(new Date(y, m - 1, d));
  });
}

// ─── Hjælpere ─────────────────────────────────────────────
const capitalize = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
const esc = s => s ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';

function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function isToday(d)    { return d.toDateString() === new Date().toDateString(); }
function minutesInto(date, dayStart) { return (date - dayStart) / 60000; }

function fmtTime(d) {
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function toDateInput(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

const DAYS = ['søndag','mandag','tirsdag','onsdag','torsdag','fredag','lørdag'];
const MONTHS = ['januar','februar','marts','april','maj','juni',
                'juli','august','september','oktober','november','december'];

function dayTitle(d) {
  const today = startOfDay(new Date());
  const diff  = Math.round((startOfDay(d) - today) / DAY_MS);
  if (diff === 0)  return 'I dag';
  if (diff === -1) return 'I går';
  if (diff === 1)  return 'I morgen';
  return capitalize(DAYS[d.getDay()]);
}

function longDate(d) {
  return `${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
