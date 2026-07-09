// rapporter.js — Trin 7: Rapporter med budget-sammenligning og hierarki-aggregering

import { db, getCurrentSchoolYear } from './app.js';
import { getLoadedActivities } from './activities.js';
import { getSettings } from './indstillinger.js';
import {
  collection, query, orderBy, where, limit, onSnapshot, Timestamp
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

// ─── State ────────────────────────────────────────────────
let userId       = null;
let periodFilter = 'skolear';
let listenersOk  = false;
let entries      = [];
let unsubEntries = null;

const normHours = () => getSettings().normHours ?? 1650;

// ─── Init ─────────────────────────────────────────────────
export function initRapporterView(uid) {
  if (userId === uid) return;
  userId = uid;
  bindListeners();
}

export function refreshRapporter() {
  if (!userId) return;
  // Genstart lytteren hvis skoleårets start har ændret sig (nye indstillinger)
  const yStart = schoolYearStart(getCurrentSchoolYear());
  if (!unsubEntries || yStart.getTime() !== listenerYearStartMs) setupEntriesListener();
  else renderReport();
}

// ─── Firestore listener ───────────────────────────────────
let listenerYearStartMs = null;

function setupEntriesListener() {
  if (unsubEntries) unsubEntries();
  const yStart = schoolYearStart(getCurrentSchoolYear());
  listenerYearStartMs = yStart.getTime();
  unsubEntries = onSnapshot(
    query(
      collection(db, `users/${userId}/entries`),
      where('startTime', '>=', Timestamp.fromDate(yStart)),
      orderBy('startTime', 'asc'),
      limit(2000)
    ),
    snap => {
      entries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderReport();
    },
    err => console.error('Rapport listener:', err)
  );
}

function schoolYearStart(year) {
  const s = getSettings();
  return new Date(parseInt(year), (s.schoolYearStartMonth ?? 6) - 1, s.schoolYearStartDay ?? 1);
}

function schoolYearEnd(year) {
  const s = schoolYearStart(year);
  return new Date(s.getFullYear() + 1, s.getMonth(), s.getDate());
}

// ─── Period filtering ─────────────────────────────────────
function getPeriodEntries() {
  const start = getPeriodStart(periodFilter);
  return entries.filter(e =>
    e.durationMinutes != null &&
    (!start || (e.startTime && e.startTime.toDate() >= start))
  );
}

function getPeriodStart(p) {
  const n = new Date();
  if (p === 'dag')    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  if (p === 'uge') {
    const d = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    const dow = d.getDay() === 0 ? 7 : d.getDay();
    d.setDate(d.getDate() - (dow - 1));
    return d;
  }
  if (p === 'maaned') return new Date(n.getFullYear(), n.getMonth(), 1);
  return null; // skoleår = alt
}

// ─── Aggregation ──────────────────────────────────────────
function aggregate(acts) {
  const filtered = getPeriodEntries();
  const year     = getCurrentSchoolYear();
  const direct   = {};
  const wtMap    = {};
  let uboundMins = 0;

  filtered.forEach(e => {
    const m = e.durationMinutes || 0;
    if (!e.activityId) { uboundMins += m; return; }
    direct[e.activityId] = (direct[e.activityId] || 0) + m;
    if (e.workType) {
      if (!wtMap[e.activityId]) wtMap[e.activityId] = {};
      wtMap[e.activityId][e.workType] = (wtMap[e.activityId][e.workType] || 0) + m;
    }
  });

  const showAll = periodFilter === 'skolear';
  const topActs = acts.filter(a => a.schoolYear === year && !a.isArchived && !a.parentId);
  // Kun aktive under-opgaver medregnes hos forælderen. En afsluttet under-opgave
  // tæller som sin egen afsluttede opgave (se archivedRows) og trækkes dermed ud
  // af forælderens total, så ingen tid tælles to gange.
  const liveKids = id =>
    acts.filter(c => c.schoolYear === year && c.parentId === id && !c.isArchived);

  const rows = topActs
    .map(act => {
      const cs        = liveKids(act.id);
      const childMins = cs.reduce((s, c) => s + (direct[c.id] || 0), 0);
      const totalMins = (direct[act.id] || 0) + childMins;
      return {
        act,
        ownMins:  direct[act.id] || 0,
        totalMins,
        wt:       wtMap[act.id] || {},
        children: cs
          .map(c => ({ act: c, totalMins: direct[c.id] || 0 }))
          .filter(c => showAll || c.totalMins > 0)
          .sort((a, b) => b.totalMins - a.totalMins)
      };
    })
    .filter(r => showAll || r.totalMins > 0)
    .sort((a, b) => b.totalMins - a.totalMins);

  // Afsluttede opgaver — kun i skoleårs-rapporten. Inkluderer både afsluttede
  // topopgaver og afsluttede under-opgaver (hver som sin egen post).
  const archivedRows = (showAll
    ? acts.filter(a => a.schoolYear === year && a.isArchived)
    : []
  ).map(act => {
    // Topopgave: rul kun de aktive under-opgaver ind. Under-opgave: står alene.
    const cs         = act.parentId ? [] : liveKids(act.id);
    const childMins  = cs.reduce((s, c) => s + (direct[c.id] || 0), 0);
    const totalMins  = (direct[act.id] || 0) + childMins;
    const budgetMins = act.budgetHours != null ? act.budgetHours * 60 : null;
    return {
      act, totalMins, budgetMins, isChild: !!act.parentId,
      diffMins: budgetMins != null ? budgetMins - totalMins : null
    };
  }).sort((a, b) => b.totalMins - a.totalMins);

  const archivedMins = archivedRows.reduce((s, r) => s + r.totalMins, 0);

  const totalMins = rows.reduce((s, r) => s + r.totalMins, 0) + uboundMins + archivedMins;
  return { rows, uboundMins, totalMins, archivedRows, archivedMins };
}

// ─── Main render ──────────────────────────────────────────
function renderReport() {
  const el = document.getElementById('rapport-content');
  if (!el) return;
  const acts = getLoadedActivities();
  const { rows, uboundMins, totalMins, archivedRows, archivedMins } = aggregate(acts);
  el.innerHTML =
    renderSummary(totalMins) +
    renderDonut(rows, uboundMins, totalMins, archivedMins) +
    renderActList(rows, uboundMins) +
    renderArchivedList(archivedRows);
}

// ─── Summary card ─────────────────────────────────────────
function renderSummary(totalMins) {
  const year = getCurrentSchoolYear();
  let extra  = '';

  if (periodFilter === 'skolear') {
    const yStart  = schoolYearStart(year);
    const yEnd    = schoolYearEnd(year);
    const total   = Math.max(1, (yEnd - yStart) / 86400000);
    const elapsed = Math.min(1, Math.max(0, (Date.now() - yStart.getTime()) / 86400000 / total));
    const NORM    = normHours();
    const normM   = NORM * 60;
    const expM    = Math.round(normM * elapsed);
    const diff    = totalMins - expM;
    const diffH   = Math.abs(Math.round(diff / 60));
    const pct     = normM > 0 ? Math.min(100, Math.round(totalMins / normM * 100)) : 0;
    const expPct  = Math.min(99, Math.round(elapsed * 100));
    const chip    = diff >= 0
      ? `<span class="forecast-chip forecast-ahead">▲ ${diffH}t foran skema</span>`
      : `<span class="forecast-chip forecast-behind">▼ ${diffH}t bagud skema</span>`;

    extra = `
      <div class="norm-progress-outer">
        <div class="norm-progress-bg">
          <div class="norm-progress-fill" style="width:${Math.min(100,pct)}%"></div>
          <div class="norm-progress-marker" style="left:${expPct}%"></div>
        </div>
        <div class="norm-progress-labels">
          <span>${fmtMins(totalMins)} / ${NORM}t</span>
          <span>${pct}%</span>
        </div>
      </div>
      ${chip}`;
  }

  return `<div class="rapport-summary">
    <div class="rapport-total">${totalMins > 0 ? fmtMins(totalMins) : '—'}</div>
    <div class="rapport-total-sub">Samlet tid${periodFilter === 'skolear' ? ` · ${year}` : ''}</div>
    ${extra}
  </div>`;
}

// ─── Donut chart ──────────────────────────────────────────
const PERIOD_LABELS = { dag: 'I dag', uge: 'Uge', maaned: 'Måned', skolear: 'Skoleår' };

function renderDonut(rows, uboundMins, totalMins, archivedMins = 0) {
  if (totalMins === 0) return '';
  const R    = 72;
  const CIRC = 2 * Math.PI * R;

  const segs = [
    ...rows.filter(r => r.totalMins > 0).slice(0, 6)
      .map(r => ({ name: r.act.name, mins: r.totalMins, color: r.act.color || 'var(--accent)' })),
    ...(uboundMins > 0 ? [{ name: 'Ubundet', mins: uboundMins, color: 'var(--text-3)' }] : []),
    ...(archivedMins > 0 ? [{ name: 'Afsluttet', mins: archivedMins, color: 'var(--border)' }] : []),
  ];
  const restMins = rows.slice(6).reduce((s, r) => s + r.totalMins, 0);
  if (restMins > 0) segs.push({ name: 'Andre', mins: restMins, color: 'var(--border)' });

  let circles = '';
  let offset  = 0;
  segs.forEach(s => {
    const len = (s.mins / totalMins) * CIRC;
    circles += `<circle cx="100" cy="100" r="${R}" fill="none"
      stroke="${s.color}" stroke-width="28"
      stroke-dasharray="${len.toFixed(2)} ${CIRC.toFixed(2)}"
      stroke-dashoffset="${offset.toFixed(2)}"
      transform="rotate(-90 100 100)"/>`;
    offset -= len;
  });

  const legend = segs.slice(0, 5).map(s => {
    const pct = Math.round(s.mins / totalMins * 100);
    return `<div class="legend-item">
      <div class="legend-dot" style="background:${s.color}"></div>
      <div class="legend-name">${esc(s.name)}</div>
      <div class="legend-pct">${pct}%</div>
    </div>`;
  }).join('');

  const label = PERIOD_LABELS[periodFilter];

  return `<div class="rapport-chart-section">
    <div class="rapport-donut-wrap">
      <svg viewBox="0 0 200 200" width="130" height="130" aria-hidden="true">
        <circle cx="100" cy="100" r="${R}" fill="none" stroke="var(--border)" stroke-width="28"/>
        ${circles}
        <text x="100" y="92" text-anchor="middle" class="donut-big">${fmtMins(totalMins)}</text>
        <text x="100" y="116" text-anchor="middle" class="donut-sub">${label}</text>
      </svg>
    </div>
    <div class="rapport-legend">${legend}</div>
  </div>`;
}

// ─── Activity list ────────────────────────────────────────
function renderActList(rows, uboundMins) {
  if (!rows.length && !uboundMins) {
    return `<div class="hist-empty">Ingen registreringer i denne periode</div>`;
  }

  let html = `<div class="rapport-act-section"><div class="rapport-act-head">Pr. aktivitet</div>`;
  rows.forEach(r => {
    html += actRow(r.act, r.totalMins, r.ownMins, r.wt, false);
    r.children.forEach(c => html += actRow(c.act, c.totalMins, c.totalMins, {}, true));
  });

  if (uboundMins > 0) {
    html += `<div class="rapport-act-row">
      <div class="rapport-act-top">
        <div class="act-color-dot" style="background:var(--text-3)"></div>
        <div class="rapport-act-name">Ubundet tid</div>
        <div class="rapport-act-time">${fmtMins(uboundMins)}</div>
      </div>
    </div>`;
  }

  return html + '</div>';
}

function actRow(act, totalMins, ownMins, wt, isChild) {
  const color  = act.color || 'var(--accent)';
  const budget = act.budgetHours != null ? act.budgetHours * 60 : null;
  const pct    = budget ? Math.min(100, Math.round(totalMins / budget * 100)) : null;

  const progressHtml = budget != null ? `
    <div class="rapport-progress-bg">
      <div class="rapport-progress-fill" style="width:${pct ?? 0}%;background:${color}${pct >= 100 ? '' : ''}"></div>
    </div>
    <div class="rapport-act-budget-row">
      <span>${totalMins > 0 ? fmtMins(totalMins) : '—'} / ${act.budgetHours}t</span>
      <span>${pct ?? 0}%</span>
    </div>` : (totalMins > 0 ? `<div class="rapport-act-budget-row"><span>${fmtMins(totalMins)}</span></div>` : '');

  const wtKeys = ['undervisning', 'forberedelse', 'retning'].filter(t => wt[t]);
  const wtHtml = !isChild && wtKeys.length > 0
    ? `<div class="rapport-wt-row">${wtKeys.map(t =>
        `<span class="rapport-wt-item"><span class="rapport-wt-label">${capitalize(t)}</span> ${fmtMins(wt[t])}</span>`
      ).join('')}</div>`
    : '';

  return `<div class="rapport-act-row${isChild ? ' rapport-act-row-child' : ''}">
    <div class="rapport-act-top">
      <div class="act-color-dot" style="background:${color}"></div>
      <div class="rapport-act-name">${esc(act.name)}</div>
      <div class="rapport-act-time">${totalMins > 0 ? fmtMins(totalMins) : '—'}</div>
    </div>
    ${progressHtml}${wtHtml}
  </div>`;
}

// ─── Afsluttede opgaver ───────────────────────────────────
function renderArchivedList(rows) {
  if (!rows.length) return '';

  // Netto ubrugt budget på tværs af afsluttede opgaver — overforbrug på én
  // opgave trækkes fra det sparede på de øvrige.
  const budgeted = rows.filter(r => r.diffMins != null);
  const netDiff  = budgeted.reduce((s, r) => s + r.diffMins, 0);
  const netLine  = budgeted.length
    ? `<div class="rapport-archived-net">
         <span class="rapport-archived-net-label">Ubrugt tid i alt</span>
         <span class="rapport-archived-net-val ${netDiff >= 0 ? 'is-pos' : 'is-neg'}">
           ${netDiff >= 0 ? `${fmtMins(netDiff)} tilbage` : `${fmtMins(-netDiff)} over budget`}
         </span>
       </div>`
    : '';

  let html = `<div class="rapport-act-section rapport-archived-section">
    <div class="rapport-act-head">Afsluttede opgaver</div>
    ${netLine}`;
  rows.forEach(r => { html += archivedRow(r); });
  return html + '</div>';
}

function archivedRow(r) {
  const { act, totalMins, budgetMins, diffMins, isChild } = r;
  const color = act.color || 'var(--accent)';

  let bar = '';
  let chip = '';

  if (budgetMins != null) {
    const pct  = budgetMins > 0 ? Math.min(100, Math.round(totalMins / budgetMins * 100)) : 0;
    const over = diffMins < 0;
    bar = `
      <div class="rapport-progress-bg">
        <div class="rapport-progress-fill" style="width:${pct}%;background:${over ? 'var(--danger)' : color}"></div>
      </div>
      <div class="rapport-act-budget-row">
        <span>${fmtMins(totalMins)} / ${act.budgetHours}t</span>
        <span>${pct}%</span>
      </div>`;
    chip = diffMins > 0
      ? `<span class="forecast-chip forecast-ahead">✓ Sparet ${fmtMins(diffMins)}</span>`
      : diffMins < 0
        ? `<span class="forecast-chip forecast-behind">▲ ${fmtMins(-diffMins)} for meget</span>`
        : `<span class="forecast-chip forecast-neutral">Præcis på budget</span>`;
  } else {
    chip = `<div class="rapport-archived-nobudget">Intet budget · ${fmtMins(totalMins)} brugt</div>`;
  }

  return `<div class="rapport-act-row rapport-act-row-archived${isChild ? ' rapport-act-row-child' : ''}">
    <div class="rapport-act-top">
      <div class="act-color-dot" style="background:${color}"></div>
      <div class="rapport-act-name">${esc(act.name)}</div>
      <div class="rapport-act-time">${totalMins > 0 ? fmtMins(totalMins) : '—'}</div>
    </div>
    ${bar}${chip}
  </div>`;
}

// ─── CSV-eksport ──────────────────────────────────────────
export function exportCSV() {
  const acts     = getLoadedActivities();
  const filtered = getPeriodEntries()
    .slice()
    .sort((a, b) => a.startTime.toDate() - b.startTime.toDate());

  if (!filtered.length) { alert('Ingen registreringer i denne periode at eksportere.'); return; }

  const q  = s => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const header = 'dato;starttid;sluttid;varighed_minutter;aktivitet;arbejdstype;note';
  const rows   = filtered.map(e => {
    const act   = acts.find(a => a.id === e.activityId);
    const start = e.startTime?.toDate();
    const end   = e.endTime?.toDate();
    return [
      start ? fmtDate(start) : '',
      start ? fmtTime(start) : '',
      end   ? fmtTime(end)   : '',
      e.durationMinutes ?? '',
      q(act?.name ?? ''),
      e.workType ?? '',
      q(e.note ?? '')
    ].join(';');
  });

  const csv  = '﻿' + [header, ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url, download: `tidsregistrering-${periodFilter}.csv`
  });
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Bind listeners ───────────────────────────────────────
function bindListeners() {
  if (listenersOk) return;
  listenersOk = true;
  document.getElementById('rapport-tabs')
    ?.addEventListener('click', e => {
      const btn = e.target.closest('.rapport-tab');
      if (!btn) return;
      periodFilter = btn.dataset.period;
      document.querySelectorAll('.rapport-tab')
        .forEach(b => b.classList.toggle('rapport-tab-active', b === btn));
      renderReport();
    });
  document.getElementById('btn-export-csv')
    ?.addEventListener('click', exportCSV);
}

// ─── Formattering ─────────────────────────────────────────
const capitalize = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
const esc = s => s ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '';

function fmtDate(d) {
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
}

function fmtTime(d) {
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function fmtMins(m) {
  if (!m) return '0m';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60), r = m % 60;
  return r > 0 ? `${h}t ${r}m` : `${h}t`;
}
