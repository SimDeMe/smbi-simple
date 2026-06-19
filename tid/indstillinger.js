// indstillinger.js — Trin 9: Indstillinger

import { db, showToast } from './app.js';
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

// ─── Defaults ─────────────────────────────────────────────
const DEFAULTS = {
  currentSchoolYear:    '2026/27',
  schoolYearStartMonth: 6,
  schoolYearStartDay:   1,
  normHours:            1650,
  moduleLengthMinutes:  90,
  autoStopAfterMinutes: 600,
  weekStartsOn:         1
};

let userId      = null;
let settings    = { ...DEFAULTS };
let listenersOk = false;

export const getSettings = () => ({ ...settings });

// ─── Init ─────────────────────────────────────────────────
export function initIndstillingerView(uid) {
  if (userId === uid) return;
  userId = uid;
  loadSettings();
  bindListeners();
}

export function refreshIndstillinger() {
  populateForm();
}

// ─── Load from Firestore ──────────────────────────────────
async function loadSettings() {
  try {
    const snap = await getDoc(doc(db, `users/${userId}/settings/config`));
    if (snap.exists()) settings = { ...DEFAULTS, ...snap.data() };
    populateForm();
  } catch (err) {
    console.error('Indlæs indstillinger fejl:', err);
  }
}

// ─── Populate form ────────────────────────────────────────
function populateForm() {
  const s = settings;
  set('cfg-school-year',   s.currentSchoolYear    ?? DEFAULTS.currentSchoolYear);
  set('cfg-start-month',   s.schoolYearStartMonth ?? DEFAULTS.schoolYearStartMonth);
  set('cfg-start-day',     s.schoolYearStartDay   ?? DEFAULTS.schoolYearStartDay);
  set('cfg-norm-hours',    s.normHours            ?? DEFAULTS.normHours);
  set('cfg-module-mins',   s.moduleLengthMinutes  ?? DEFAULTS.moduleLengthMinutes);
  set('cfg-autostop-mins', s.autoStopAfterMinutes ?? DEFAULTS.autoStopAfterMinutes);

  const ws = s.weekStartsOn ?? DEFAULTS.weekStartsOn;
  document.querySelectorAll('input[name="cfg-week-start"]')
    .forEach(r => { r.checked = parseInt(r.value) === ws; });
}

const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

// ─── Save ─────────────────────────────────────────────────
async function saveSettings() {
  const yearVal = document.getElementById('cfg-school-year').value.trim();
  if (!yearVal) { showToast('Angiv et gyldigt skoleår (fx 2026/27)'); return; }

  const updated = {
    currentSchoolYear:    yearVal,
    schoolYearStartMonth: parseInt(document.getElementById('cfg-start-month').value)  || 6,
    schoolYearStartDay:   parseInt(document.getElementById('cfg-start-day').value)    || 1,
    normHours:            parseInt(document.getElementById('cfg-norm-hours').value)   || 1650,
    moduleLengthMinutes:  parseInt(document.getElementById('cfg-module-mins').value)  || 90,
    autoStopAfterMinutes: parseInt(document.getElementById('cfg-autostop-mins').value)|| 600,
    weekStartsOn: parseInt(
      document.querySelector('input[name="cfg-week-start"]:checked')?.value ?? '1'
    )
  };

  const btn = document.getElementById('cfg-save-btn');
  if (btn) btn.disabled = true;
  try {
    await setDoc(doc(db, `users/${userId}/settings/config`), updated);
    settings = updated;
    showToast('Indstillinger gemt');
  } catch (err) {
    console.error('Gem indstillinger fejl:', err);
    showToast('Kunne ikke gemme — prøv igen');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ─── Bind listeners ───────────────────────────────────────
function bindListeners() {
  if (listenersOk) return;
  listenersOk = true;
  document.getElementById('cfg-save-btn')?.addEventListener('click', saveSettings);
}
