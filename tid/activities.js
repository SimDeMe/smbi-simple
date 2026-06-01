// activities.js — Trin 3: Aktiviteter CRUD

import { db, COLOR_PALETTE, getCurrentSchoolYear, showToast } from './app.js';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, writeBatch
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

// ─── State ────────────────────────────────────────────────
let userId       = null;
let activities   = [];
let selectedYear = '';
let editingId    = null;
let unsub        = null;
let listenersOk  = false;

// ─── Eksportér aktiviteter til andre moduler ──────────────
let activitiesLoaded = false;
export const getLoadedActivities  = () => activities;
export const isActivitiesLoaded   = () => activitiesLoaded;

// ─── Init (kaldes fra app.js efter login) ─────────────────
export function initActivitiesView(uid) {
  if (userId === uid && unsub) return;
  userId = uid;
  selectedYear = getCurrentSchoolYear();
  startListener();
  bindListeners();
}

// ─── Realtime listener ────────────────────────────────────
function startListener() {
  if (unsub) unsub();
  unsub = onSnapshot(
    query(collection(db, `users/${userId}/activities`), orderBy('order', 'asc')),
    snap => {
      activities = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      activitiesLoaded = true;
      renderYearSelect();
      renderList();
    },
    err => { console.error('Activities listener:', err); showToast('Fejl ved indlæsning'); }
  );
}

// ─── Year selector ────────────────────────────────────────
function renderYearSelect() {
  const sel = document.getElementById('act-year-select');
  if (!sel) return;
  const years = [...new Set(activities.map(a => a.schoolYear).filter(Boolean))].sort();
  const cur = getCurrentSchoolYear();
  if (!years.includes(cur)) years.push(cur);
  years.sort();
  // Skift til det seneste år MED aktiviteter, hvis det valgte år er tomt
  const withActs = years.filter(y => activities.some(a => a.schoolYear === y && !a.isArchived));
  if (withActs.length && !activities.some(a => a.schoolYear === selectedYear && !a.isArchived)) {
    selectedYear = withActs[withActs.length - 1];
  } else if (!years.includes(selectedYear)) {
    selectedYear = cur;
  }
  sel.innerHTML = years.map(y =>
    `<option value="${y}"${y === selectedYear ? ' selected' : ''}>${y}</option>`
  ).join('');
}

// ─── Activity list ────────────────────────────────────────
function renderList() {
  const el = document.getElementById('act-list');
  if (!el) return;

  const yr     = activities.filter(a => a.schoolYear === selectedYear && !a.isArchived);
  const hold   = yr.filter(a => a.type === 'hold');
  const topOpg = yr.filter(a => a.type === 'opgave' && !a.parentId);
  let html = '';

  if (hold.length) {
    html += sectionHead('Hold');
    hold.forEach(a => { html += actRow(a); });
  }

  html += sectionHead('Opgaver');
  if (topOpg.length) {
    topOpg.forEach(a => {
      html += actRow(a);
      yr.filter(c => c.parentId === a.id).forEach(c => { html += actRow(c, true); });
    });
  }

  if (!yr.length) {
    html = `<div class="act-empty">Ingen aktiviteter for <strong>${selectedYear}</strong><br>Tryk "+ Ny aktivitet" for at begynde</div>`;
  }

  el.innerHTML = html;
  el.querySelectorAll('.act-row').forEach(row =>
    row.addEventListener('click', () => openActSheet(row.dataset.id))
  );
}

const sectionHead = label =>
  `<div class="act-section-head">${label}</div>`;

function actRow(a, child = false) {
  const color  = a.color || COLOR_PALETTE[0];
  const budget = a.budgetHours != null ? `${a.budgetHours}t` : '—';
  return `<div class="act-row${child ? ' act-row-child' : ''}" data-id="${a.id}">
    <div class="act-color-dot" style="background:${color}"></div>
    <div class="act-row-body">
      <div class="act-row-name">${esc(a.name)}</div>
      ${a.note ? `<div class="act-row-note">${esc(a.note)}</div>` : ''}
    </div>
    <div class="act-row-meta">
      <span class="act-row-budget">${budget}</span>
      <svg class="act-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    </div>
  </div>`;
}

// ─── Open create/edit sheet ───────────────────────────────
function openActSheet(actId) {
  editingId = actId || null;
  const a = actId ? activities.find(x => x.id === actId) : null;

  document.getElementById('act-sheet-title').textContent = a ? 'Redigér aktivitet' : 'Ny aktivitet';
  document.getElementById('field-type').style.display    = a ? 'none' : '';

  document.getElementById('act-name').value   = a?.name       || '';
  document.getElementById('act-budget').value = a?.budgetHours ?? '';
  document.getElementById('act-year').value   = a?.schoolYear  || selectedYear;
  document.getElementById('act-note').value   = a?.note        || '';

  const typeVal = a?.type || 'opgave';
  const radio = document.querySelector(`input[name="act-type"][value="${typeVal}"]`);
  if (radio) radio.checked = true;
  toggleParentField(typeVal);
  populateParentSelect(a?.schoolYear || selectedYear, a?.parentId || '');
  renderColorPicker(a?.color || '');

  document.getElementById('act-delete-btn').classList.toggle('hidden', !a);
  openSheet('act-sheet', 'act-backdrop');
}

function toggleParentField(type) {
  document.getElementById('field-parent').style.display = type === 'opgave' ? '' : 'none';
}

function populateParentSelect(year, selId) {
  const sel = document.getElementById('act-parent');
  const parents = activities.filter(a =>
    a.type === 'opgave' && !a.parentId && a.schoolYear === year && a.id !== editingId
  );
  sel.innerHTML = `<option value="">— Ingen (top-niveau) —</option>` +
    parents.map(p => `<option value="${p.id}"${p.id === selId ? ' selected' : ''}>${esc(p.name)}</option>`).join('');
}

function renderColorPicker(selected) {
  const picker = document.getElementById('act-color-picker');
  picker.innerHTML = COLOR_PALETTE.map(c =>
    `<button type="button" class="color-dot-btn${c === selected ? ' selected' : ''}" style="background:${c}" data-color="${c}" aria-label="${c}"></button>`
  ).join('');
  picker.querySelectorAll('.color-dot-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      picker.querySelectorAll('.color-dot-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    })
  );
}

const getSelectedColor = () =>
  document.querySelector('.color-dot-btn.selected')?.dataset.color || '';

// ─── Save ─────────────────────────────────────────────────
async function saveActivity(e) {
  e.preventDefault();
  const name = document.getElementById('act-name').value.trim();
  if (!name) { showToast('Angiv et navn'); return; }

  const isEditing  = !!editingId;
  const existingA  = isEditing ? activities.find(x => x.id === editingId) : null;
  const type       = isEditing ? existingA.type
                               : (document.querySelector('input[name="act-type"]:checked')?.value || 'opgave');
  const parentId   = type === 'opgave' ? (document.getElementById('act-parent').value || null) : null;
  const budgetRaw  = document.getElementById('act-budget').value.trim();
  const budgetHours = budgetRaw !== '' ? parseFloat(budgetRaw) : null;
  const schoolYear  = document.getElementById('act-year').value.trim() || selectedYear;
  const note        = document.getElementById('act-note').value.trim();
  const color       = getSelectedColor() || autoColor();

  const btn = document.getElementById('act-save-btn');
  btn.disabled = true;
  try {
    if (isEditing) {
      await updateDoc(doc(db, `users/${userId}/activities/${editingId}`),
        { name, parentId, budgetHours, color, schoolYear, note });
      showToast('Aktivitet opdateret');
    } else {
      await addDoc(collection(db, `users/${userId}/activities`),
        { name, type, parentId, budgetHours, color, schoolYear, note, order: nextOrder(), isArchived: false });
      showToast('Aktivitet oprettet');
    }
    closeSheet('act-sheet', 'act-backdrop');
  } catch (err) {
    console.error('Gem fejl:', err);
    showToast('Kunne ikke gemme — prøv igen');
  } finally { btn.disabled = false; }
}

// ─── Delete ───────────────────────────────────────────────
async function deleteActivity() {
  if (!editingId) return;
  const a = activities.find(x => x.id === editingId);
  if (!a) return;

  if (!confirm(`Slet "${a.name}"?`)) return;

  const children = activities.filter(c => c.parentId === editingId);
  let promoteKids = false;
  if (children.length) {
    promoteKids = !confirm(
      `"${a.name}" har ${children.length} under-aktivitet${children.length > 1 ? 'er' : ''}.\n\nOK = slet under-aktiviteterne også\nAnnuller = bevar dem som selvstændige`
    );
  }

  const btn = document.getElementById('act-delete-btn');
  btn.disabled = true;
  try {
    const batch = writeBatch(db);
    children.forEach(c => {
      if (promoteKids) {
        batch.update(doc(db, `users/${userId}/activities/${c.id}`), { parentId: null });
      } else {
        batch.delete(doc(db, `users/${userId}/activities/${c.id}`));
      }
    });
    batch.delete(doc(db, `users/${userId}/activities/${editingId}`));
    await batch.commit();
    showToast('Aktivitet slettet');
    closeSheet('act-sheet', 'act-backdrop');
  } catch (err) {
    console.error('Slet fejl:', err);
    showToast('Kunne ikke slette — prøv igen');
  } finally { btn.disabled = false; }
}

// ─── Import fra tekst ─────────────────────────────────────
function openImportSheet() {
  document.getElementById('import-year').value = selectedYear;
  document.getElementById('import-text').value = '';
  openSheet('import-sheet', 'import-backdrop');
}

async function doImport() {
  const raw  = document.getElementById('import-text').value.trim();
  const year = document.getElementById('import-year').value.trim() || selectedYear;
  if (!raw) { showToast('Ingen tekst at importere'); return; }

  const parsed = raw.split('\n')
    .map(l => l.trim()).filter(Boolean)
    .map(line => {
      const p = line.split(';').map(s => s.trim());
      return { name: p[0], type: p[1]?.toLowerCase() === 'hold' ? 'hold' : 'opgave',
               budget: p[2] ? parseFloat(p[2]) : null, parent: p[3] || null };
    }).filter(p => p.name);

  const btn = document.getElementById('btn-do-import');
  btn.disabled = true;
  const nameToId = {};
  let i = 0;
  try {
    for (const p of parsed.filter(p => !p.parent)) {
      const ref = await addDoc(collection(db, `users/${userId}/activities`), {
        name: p.name, type: p.type, parentId: null,
        budgetHours: p.budget, color: COLOR_PALETTE[(activities.length + i) % COLOR_PALETTE.length],
        schoolYear: year, note: '', order: nextOrder() + i, isArchived: false
      });
      nameToId[p.name] = ref.id;
      i++;
    }
    for (const p of parsed.filter(p => p.parent)) {
      await addDoc(collection(db, `users/${userId}/activities`), {
        name: p.name, type: 'opgave', parentId: nameToId[p.parent] || null,
        budgetHours: p.budget, color: COLOR_PALETTE[(activities.length + i) % COLOR_PALETTE.length],
        schoolYear: year, note: '', order: nextOrder() + i, isArchived: false
      });
      i++;
    }
    showToast(`${parsed.length} aktiviteter importeret`);
    closeSheet('import-sheet', 'import-backdrop');
  } catch (err) {
    console.error('Import fejl:', err);
    showToast('Import fejlede — tjek formatet');
  } finally { btn.disabled = false; }
}

// ─── Kopiér til næste skoleår ─────────────────────────────
function openCopySheet() {
  const next     = nextSchoolYear(selectedYear);
  const existing = activities.filter(a => a.schoolYear === next).length;
  document.getElementById('copy-sheet-body').innerHTML = `
    <p class="sheet-desc">
      Kopierer alle aktiviteter fra <strong>${selectedYear}</strong> til <strong>${next}</strong> — kun struktur, ingen tidsdata.
      ${existing ? `<br><span class="warn-text">OBS: Der er allerede ${existing} aktivitet${existing > 1 ? 'er' : ''} i ${next}.</span>` : ''}
    </p>`;
  document.getElementById('btn-do-copy').dataset.target = next;
  openSheet('copy-sheet', 'copy-backdrop');
}

async function doCopy() {
  const targetYear = document.getElementById('btn-do-copy').dataset.target;
  const source = activities.filter(a => a.schoolYear === selectedYear && !a.isArchived);
  if (!source.length) { showToast('Ingen aktiviteter at kopiere'); return; }

  const btn = document.getElementById('btn-do-copy');
  btn.disabled = true;
  try {
    const batch  = writeBatch(db);
    const colRef = collection(db, `users/${userId}/activities`);
    const idMap  = {};

    for (const a of source.filter(a => !a.parentId)) {
      const newRef = doc(colRef);
      idMap[a.id] = newRef.id;
      const { id, ...rest } = a;
      batch.set(newRef, { ...rest, schoolYear: targetYear, parentId: null });
    }
    for (const a of source.filter(a => a.parentId)) {
      const newRef = doc(colRef);
      const { id, ...rest } = a;
      batch.set(newRef, { ...rest, schoolYear: targetYear, parentId: idMap[a.parentId] || null });
    }

    await batch.commit();
    selectedYear = targetYear;
    showToast(`Kopieret til ${targetYear}`);
    closeSheet('copy-sheet', 'copy-backdrop');
  } catch (err) {
    console.error('Kopi fejl:', err);
    showToast('Kopiering fejlede — prøv igen');
  } finally { btn.disabled = false; }
}

// ─── Sheet open/close ─────────────────────────────────────
function openSheet(sheetId, bdId) {
  document.getElementById(sheetId).classList.remove('hidden');
  document.getElementById(bdId).classList.remove('hidden');
  requestAnimationFrame(() => {
    document.getElementById(sheetId).classList.add('open');
    document.getElementById(bdId).classList.add('open');
  });
}

function closeSheet(sheetId, bdId) {
  document.getElementById(sheetId).classList.remove('open');
  document.getElementById(bdId).classList.remove('open');
  setTimeout(() => {
    document.getElementById(sheetId).classList.add('hidden');
    document.getElementById(bdId).classList.add('hidden');
  }, 280);
}

// ─── Event listeners (én gang) ────────────────────────────
function bindListeners() {
  if (listenersOk) return;
  listenersOk = true;

  document.getElementById('act-year-select')
    .addEventListener('change', e => { selectedYear = e.target.value; renderList(); });

  document.getElementById('btn-new-activity')
    .addEventListener('click', () => openActSheet(null));

  document.getElementById('btn-copy-year')
    .addEventListener('click', openCopySheet);

  document.getElementById('btn-import-text')
    .addEventListener('click', openImportSheet);

  // Act sheet
  document.getElementById('act-sheet-close')
    .addEventListener('click', () => closeSheet('act-sheet', 'act-backdrop'));
  document.getElementById('act-backdrop')
    .addEventListener('click', () => closeSheet('act-sheet', 'act-backdrop'));
  document.getElementById('act-form')
    .addEventListener('submit', saveActivity);
  document.getElementById('act-delete-btn')
    .addEventListener('click', deleteActivity);

  document.querySelectorAll('input[name="act-type"]').forEach(r =>
    r.addEventListener('change', e => {
      toggleParentField(e.target.value);
      populateParentSelect(document.getElementById('act-year').value || selectedYear, '');
    })
  );

  // Import sheet
  document.getElementById('import-sheet-close')
    .addEventListener('click', () => closeSheet('import-sheet', 'import-backdrop'));
  document.getElementById('import-backdrop')
    .addEventListener('click', () => closeSheet('import-sheet', 'import-backdrop'));
  document.getElementById('btn-do-import')
    .addEventListener('click', doImport);

  // Copy sheet
  document.getElementById('copy-sheet-close')
    .addEventListener('click', () => closeSheet('copy-sheet', 'copy-backdrop'));
  document.getElementById('copy-backdrop')
    .addEventListener('click', () => closeSheet('copy-sheet', 'copy-backdrop'));
  document.getElementById('btn-do-copy')
    .addEventListener('click', doCopy);
}

// ─── Helpers ──────────────────────────────────────────────
const nextOrder    = () => Math.max(0, ...activities.map(a => a.order || 0)) + 1;
const autoColor    = () => { const u = new Set(activities.map(a => a.color)); return COLOR_PALETTE.find(c => !u.has(c)) || COLOR_PALETTE[0]; };
const nextSchoolYear = y => { const n = parseInt(y) + 1; return `${n}/${String(n + 1).slice(2)}`; };
const esc = s => s ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';
