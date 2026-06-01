// historik.js — Trin 6: Historik med redigering og manuel oprettelse

import { db, showToast, getCurrentSchoolYear } from './app.js';
import { getLoadedActivities } from './activities.js';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, limit, Timestamp
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

// ─── State ────────────────────────────────────────────────
let userId       = null;
let entries      = [];
let unsubEntries = null;
let listenersOk  = false;
let editingId    = null;
let periodFilter = 'uge';
let actFilter    = '';

// ─── Init ─────────────────────────────────────────────────
export function initHistorikView(uid) {
  if (userId === uid) return;
  userId = uid;
  bindListeners();
}

export function refreshHistorik() {
  if (!userId) return;
  if (!unsubEntries) setupEntriesListener();
  renderActivityFilter();
  renderList();
}

// ─── Entries listener ─────────────────────────────────────
function setupEntriesListener() {
  if (unsubEntries) unsubEntries();
  unsubEntries = onSnapshot(
    query(
      collection(db, `users/${userId}/entries`),
      orderBy('startTime', 'desc'),
      limit(500)
    ),
    snap => {
      entries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderList();
    },
    err => console.error('Entries listener:', err)
  );
}

// ─── Filtering ────────────────────────────────────────────
function filterEntries() {
  const start = getPeriodStart(periodFilter);
  return entries.filter(e => {
    if (start && e.startTime?.toDate() < start) return false;
    if (actFilter && e.activityId !== actFilter) return false;
    return true;
  });
}

function getPeriodStart(period) {
  const now = new Date();
  if (period === 'dag')   return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'uge') {
    const d   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dow = d.getDay() === 0 ? 7 : d.getDay();
    d.setDate(d.getDate() - (dow - 1));
    return d;
  }
  if (period === 'maaned') return new Date(now.getFullYear(), now.getMonth(), 1);
  return null;
}

// ─── Render list ──────────────────────────────────────────
function renderList() {
  const el = document.getElementById('hist-list');
  if (!el) return;

  const acts     = getLoadedActivities();
  const filtered = filterEntries();

  if (!filtered.length) {
    el.innerHTML = `<div class="hist-empty">Ingen registreringer i denne periode</div>`;
    return;
  }

  // Group by date key YYYY-MM-DD
  const groups = new Map();
  filtered.forEach(e => {
    if (!e.startTime) return;
    const d   = e.startTime.toDate();
    const key = toDateInput(d);
    if (!groups.has(key)) groups.set(key, { date: d, list: [] });
    groups.get(key).list.push(e);
  });

  let html = '';
  let totalMinsToday = 0;

  for (const [, g] of groups) {
    const dayMins = g.list.reduce((s, e) => s + (e.durationMinutes || 0), 0);
    const dayLabel = dayMins ? `<span class="hist-day-total">${fmtMins(dayMins)}</span>` : '';
    html += `<div class="hist-date-head">${fmtDateHead(g.date)}${dayLabel}</div>`;

    g.list.forEach(e => {
      const act      = acts.find(a => a.id === e.activityId);
      const color    = act?.color || 'var(--border)';
      const name     = act?.name || (e.activityId ? 'Slettet aktivitet' : 'Ubundet tid');
      const isActive = !e.endTime;

      const startT = e.startTime ? fmtTime(e.startTime.toDate()) : '??:??';
      const endT   = e.endTime   ? fmtTime(e.endTime.toDate())   : null;
      const dur    = e.durationMinutes != null
        ? fmtMins(e.durationMinutes)
        : (isActive ? 'I gang' : '—');
      const wt     = e.workType ? ` · ${capitalize(e.workType)}` : '';
      const note   = e.note ? `<div class="entry-note">${esc(e.note)}</div>` : '';
      const timeStr = endT ? `${startT} – ${endT}` : `${startT} –`;
      const dot    = isActive
        ? `<span class="entry-running-dot"></span>`
        : '';

      html += `<div class="entry-row${isActive ? ' entry-row-active' : ''}" data-id="${e.id}" style="--act-color:${color}">
        <div class="entry-body">
          <div class="entry-act">${esc(name)}<span class="entry-wt">${esc(wt)}</span></div>
          <div class="entry-meta">${dot}${timeStr}</div>
          ${note}
        </div>
        <div class="entry-duration">${dur}</div>
        <svg class="act-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </div>`;
    });
  }

  el.innerHTML = html;
  el.querySelectorAll('.entry-row').forEach(row =>
    row.addEventListener('click', () => openEntrySheet(row.dataset.id))
  );
}

// ─── Activity filter dropdown ─────────────────────────────
function renderActivityFilter() {
  const sel = document.getElementById('hist-act-filter');
  if (!sel) return;
  const acts = getLoadedActivities();
  const year = getCurrentSchoolYear();
  const relevant = acts.filter(a => a.schoolYear === year && !a.isArchived);
  sel.innerHTML = `<option value="">Alle aktiviteter</option>` +
    relevant.map(a =>
      `<option value="${a.id}"${a.id === actFilter ? ' selected' : ''}>${esc(a.name)}</option>`
    ).join('');
  sel.value = actFilter;
}

// ─── Open entry sheet ─────────────────────────────────────
function openEntrySheet(entryId) {
  editingId = entryId || null;
  const e   = entryId ? entries.find(x => x.id === entryId) : null;
  const acts = getLoadedActivities();

  document.getElementById('hist-sheet-title').textContent =
    e ? 'Redigér registrering' : 'Ny registrering';

  // Populate activity select
  const actSel = document.getElementById('hist-act-sel');
  const year   = getCurrentSchoolYear();
  const topActs = acts.filter(a => a.schoolYear === year && !a.isArchived);
  actSel.innerHTML = `<option value="">— Ubundet tid —</option>` +
    topActs.map(a =>
      `<option value="${a.id}"${a.id === (e?.activityId || '') ? ' selected' : ''}>${esc(a.name)}</option>`
    ).join('');

  if (e) {
    const sd = e.startTime.toDate();
    document.getElementById('hist-date').value  = toDateInput(sd);
    document.getElementById('hist-start').value = fmtTime(sd);
    document.getElementById('hist-end').value   = e.endTime ? fmtTime(e.endTime.toDate()) : '';
    document.getElementById('hist-note').value  = e.note || '';

    document.querySelectorAll('input[name="hist-wt"]').forEach(r => {
      r.checked = r.value === e.workType;
    });
  } else {
    const now = new Date();
    document.getElementById('hist-date').value  = toDateInput(now);
    document.getElementById('hist-start').value = fmtTime(now);
    document.getElementById('hist-end').value   = '';
    document.getElementById('hist-note').value  = '';
    document.querySelectorAll('input[name="hist-wt"]').forEach(r => r.checked = false);
  }

  updateWtVisibility();
  document.getElementById('hist-delete-btn').classList.toggle('hidden', !e);
  openSheet('hist-sheet', 'hist-backdrop');
}

function updateWtVisibility() {
  const actSel = document.getElementById('hist-act-sel');
  const acts   = getLoadedActivities();
  const sel    = acts.find(a => a.id === actSel.value);
  document.getElementById('hist-wt-group').style.display =
    sel?.type === 'hold' ? '' : 'none';
}

// ─── Save ─────────────────────────────────────────────────
async function saveEntry(ev) {
  ev.preventDefault();

  const dateVal  = document.getElementById('hist-date').value;
  const startVal = document.getElementById('hist-start').value;
  const endVal   = document.getElementById('hist-end').value;

  if (!dateVal || !startVal) { showToast('Angiv dato og starttidspunkt'); return; }

  const startDate = parseDateTime(dateVal, startVal);
  if (!startDate) { showToast('Ugyldigt tidspunkt'); return; }
  if (startDate > new Date()) { showToast('Starttidspunkt kan ikke ligge i fremtiden'); return; }

  let endDate = null, durationMinutes = null;
  if (endVal) {
    endDate = parseDateTime(dateVal, endVal);
    if (!endDate) { showToast('Ugyldig sluttid'); return; }
    if (endDate < startDate) { showToast('Sluttid skal være efter starttid'); return; }
    durationMinutes = Math.round((endDate - startDate) / 60000);
  }

  const actId  = document.getElementById('hist-act-sel').value || null;
  const acts   = getLoadedActivities();
  const selAct = acts.find(a => a.id === actId);

  if (selAct?.type === 'hold') {
    const wtChecked = document.querySelector('input[name="hist-wt"]:checked');
    if (!wtChecked) { showToast('Vælg arbejdstype for holdet'); return; }
  }

  const wt = selAct?.type === 'hold'
    ? (document.querySelector('input[name="hist-wt"]:checked')?.value || null)
    : null;

  const note = document.getElementById('hist-note').value.trim();

  const btn = document.getElementById('hist-save-btn');
  btn.disabled = true;
  try {
    const data = {
      activityId:      actId,
      workType:        wt,
      startTime:       Timestamp.fromDate(startDate),
      endTime:         endDate ? Timestamp.fromDate(endDate) : null,
      durationMinutes,
      note,
      isModule:        false,
      autoStopped:     false
    };
    if (editingId) {
      await updateDoc(doc(db, `users/${userId}/entries/${editingId}`), data);
      showToast('Registrering opdateret');
    } else {
      await addDoc(collection(db, `users/${userId}/entries`), data);
      showToast('Registrering oprettet');
    }
    closeSheet('hist-sheet', 'hist-backdrop');
  } catch (err) {
    console.error('Gem entry fejl:', err);
    showToast('Kunne ikke gemme — prøv igen');
  } finally { btn.disabled = false; }
}

// ─── Delete ───────────────────────────────────────────────
async function deleteEntry() {
  if (!editingId) return;
  if (!confirm('Slet denne registrering?')) return;
  const btn = document.getElementById('hist-delete-btn');
  btn.disabled = true;
  try {
    await deleteDoc(doc(db, `users/${userId}/entries/${editingId}`));
    showToast('Registrering slettet');
    closeSheet('hist-sheet', 'hist-backdrop');
  } catch (err) {
    console.error('Slet entry fejl:', err);
    showToast('Kunne ikke slette');
  } finally { btn.disabled = false; }
}

// ─── Sheet helpers ────────────────────────────────────────
function openSheet(id, bdId) {
  document.getElementById(id).classList.remove('hidden');
  document.getElementById(bdId).classList.remove('hidden');
  requestAnimationFrame(() => {
    document.getElementById(id).classList.add('open');
    document.getElementById(bdId).classList.add('open');
  });
}

function closeSheet(id, bdId) {
  document.getElementById(id).classList.remove('open');
  document.getElementById(bdId).classList.remove('open');
  setTimeout(() => {
    document.getElementById(id).classList.add('hidden');
    document.getElementById(bdId).classList.add('hidden');
  }, 280);
}

// ─── Bind listeners ───────────────────────────────────────
function bindListeners() {
  if (listenersOk) return;
  listenersOk = true;

  document.getElementById('btn-new-entry')
    ?.addEventListener('click', () => openEntrySheet(null));

  document.getElementById('hist-period-select')
    ?.addEventListener('change', e => { periodFilter = e.target.value; renderList(); });

  document.getElementById('hist-act-filter')
    ?.addEventListener('change', e => { actFilter = e.target.value; renderList(); });

  document.getElementById('hist-backdrop')
    ?.addEventListener('click', () => closeSheet('hist-sheet', 'hist-backdrop'));
  document.getElementById('hist-sheet-close')
    ?.addEventListener('click', () => closeSheet('hist-sheet', 'hist-backdrop'));

  document.getElementById('hist-form')
    ?.addEventListener('submit', saveEntry);
  document.getElementById('hist-delete-btn')
    ?.addEventListener('click', deleteEntry);

  document.getElementById('hist-act-sel')
    ?.addEventListener('change', updateWtVisibility);
}

// ─── Formattering ─────────────────────────────────────────
const capitalize = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
const esc = s => s ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '';

function fmtMins(m) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60), r = m % 60;
  return r > 0 ? `${h}t ${r}m` : `${h}t`;
}

function fmtTime(d) {
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function toDateInput(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function parseDateTime(dateStr, timeStr) {
  try {
    const [y, m, day] = dateStr.split('-').map(Number);
    const [hh, mm]    = timeStr.split(':').map(Number);
    return new Date(y, m - 1, day, hh, mm, 0, 0);
  } catch { return null; }
}

const DAYS = ['søndag','mandag','tirsdag','onsdag','torsdag','fredag','lørdag'];
const MONS = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'];

function fmtDateHead(d) {
  const today     = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return 'I dag';
  if (d.toDateString() === yesterday.toDateString()) return 'I går';
  const diffDays = Math.floor((today - d) / 86400000);
  if (diffDays < 7)
    return `${capitalize(DAYS[d.getDay()])} ${d.getDate()}. ${MONS[d.getMonth()]}`;
  return `${d.getDate()}. ${MONS[d.getMonth()]} ${d.getFullYear()}`;
}
