import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache,
  doc, getDoc, setDoc,
  collection, getDocs, query, limit
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import { initActivitiesView } from './activities.js';
import { initTimerView, refreshQuickStart } from './timer.js';
import { initHistorikView, refreshHistorik } from './historik.js';
import { initRapporterView, refreshRapporter } from './rapporter.js';
import { initIndstillingerView, refreshIndstillinger, getSettings } from './indstillinger.js';

// ─── Firebase init ────────────────────────────────────────
const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db   = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache()
});
const provider = new GoogleAuthProvider();

// ─── Farvepalette til aktiviteter ─────────────────────────
export const COLOR_PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
];

// ─── Eksport ─────────────────────────────────────────────
let currentUserId = null;

async function exportAllData() {
  if (!currentUserId) return;
  try {
    const [actsSnap, entriesSnap] = await Promise.all([
      getDocs(collection(db, `users/${currentUserId}/activities`)),
      getDocs(collection(db, `users/${currentUserId}/entries`))
    ]);
    // Firestore Timestamp har sin egen toJSON, som JSON.stringify kalder før
    // en replacer — derfor konverteres rekursivt inden serialisering.
    const tsToIso = v => {
      if (v?.toDate) return v.toDate().toISOString();
      if (Array.isArray(v)) return v.map(tsToIso);
      if (v && typeof v === 'object') return Object.fromEntries(
        Object.entries(v).map(([k, x]) => [k, tsToIso(x)])
      );
      return v;
    };
    const payload = tsToIso({
      exportedAt:  new Date().toISOString(),
      activities:  actsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      entries:     entriesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    });
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href: url,
      download: `tidsregistrering-backup-${new Date().toISOString().slice(0,10)}.json`
    });
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup downloadet');
  } catch (err) {
    console.error('JSON eksport fejl:', err);
    showToast('Eksport fejlede — prøv igen');
  }
}

// ─── DOM-referencer ──────────────────────────────────────
const $ = id => document.getElementById(id);

const loadingScreen    = $('loading-screen');
const loginScreen      = $('login-screen');
const onboardingScreen = $('onboarding');
const appEl            = $('app');
const btnGoogleLogin   = $('btn-google-login');
const btnLogout        = $('btn-logout');
const btnOnbActs       = $('btn-onboarding-activities');
const btnOnbSkip       = $('btn-onboarding-skip');
const navBtns          = document.querySelectorAll('.nav-btn');
const views            = document.querySelectorAll('.view');

// ─── Login ───────────────────────────────────────────────
btnGoogleLogin.addEventListener('click', async () => {
  btnGoogleLogin.disabled = true;
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user') {
      showToast('Kunne ikke logge ind — prøv igen');
    }
    btnGoogleLogin.disabled = false;
  }
});

btnLogout.addEventListener('click', async () => {
  if (confirm('Log ud af Tidsregistrering?')) {
    await signOut(auth);
  }
});

// ─── Auth state ──────────────────────────────────────────
onAuthStateChanged(auth, async user => {
  if (user) {
    currentUserId = user.uid;
    loginScreen.classList.add('hidden');
    appEl.classList.remove('hidden');
    try {
      await initSettings(user.uid);
      // Indstillinger skal være indlæst før de andre views, da de bruger
      // getCurrentSchoolYear(), som læser fra indstillingerne
      await initIndstillingerView(user.uid);
      initActivitiesView(user.uid);
      initTimerView(user.uid);
      initHistorikView(user.uid);
      initRapporterView(user.uid);
      await checkFirstRun(user.uid);
    } catch (err) {
      console.error('Init fejl:', err);
      navigateTo('hjem');
    }
    loadingScreen.classList.add('hidden');
  } else {
    currentUserId = null;
    loadingScreen.classList.add('hidden');
    appEl.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    btnGoogleLogin.disabled = false;
  }
});

$('btn-export-json')?.addEventListener('click', exportAllData);

// ─── Settings: opret med standardværdier hvis de mangler ──
async function initSettings(userId) {
  const ref  = doc(db, `users/${userId}/settings/config`);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      currentSchoolYear:    getCurrentSchoolYear(),
      schoolYearStartMonth: 6,
      schoolYearStartDay:   1,
      normHours:            1650,
      moduleLengthMinutes:  90,
      autoStopAfterMinutes: 600
    });
  }
}

// ─── First-run: vis onboarding hvis ingen aktiviteter ─────
async function checkFirstRun(userId) {
  const ref  = collection(db, `users/${userId}/activities`);
  const snap = await getDocs(query(ref, limit(1)));
  if (snap.empty) {
    onboardingScreen.classList.remove('hidden');
  } else {
    navigateTo('hjem');
  }
}

btnOnbActs.addEventListener('click', () => {
  onboardingScreen.classList.add('hidden');
  navigateTo('aktiviteter');
});

btnOnbSkip.addEventListener('click', () => {
  onboardingScreen.classList.add('hidden');
  navigateTo('hjem');
});

// ─── Skoleår-hjælpere ────────────────────────────────────
export function getCurrentSchoolYear() {
  const s = getSettings();
  if (/^\d{4}\/\d{2}$/.test(s.currentSchoolYear ?? '')) return s.currentSchoolYear;
  const startMonth = s.schoolYearStartMonth ?? 6;
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return m >= startMonth
    ? `${y}/${String(y + 1).slice(2)}`
    : `${y - 1}/${String(y).slice(2)}`;
}

// ─── Navigation ──────────────────────────────────────────
export function navigateTo(viewName) {
  views.forEach(v => v.classList.add('hidden'));
  navBtns.forEach(b => b.classList.remove('active'));

  const view = $(`view-${viewName}`);
  const btn  = document.querySelector(`.nav-btn[data-view="${viewName}"]`);

  if (view) view.classList.remove('hidden');
  if (btn)  btn.classList.add('active');

  $('main-content').scrollTop = 0;
}

navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navigateTo(btn.dataset.view);
    if (btn.dataset.view === 'hjem')     refreshQuickStart();
    if (btn.dataset.view === 'historik')  refreshHistorik();
    if (btn.dataset.view === 'rapporter')      refreshRapporter();
    if (btn.dataset.view === 'indstillinger')  refreshIndstillinger();
  });
});

// ─── Toast ───────────────────────────────────────────────
export function showToast(message, duration = 2800) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('visible'), duration);
}

// ─── Service Worker ──────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./service-worker.js')
      .then(r  => console.log('SW registreret:', r.scope))
      .catch(e => console.warn('SW fejl:', e));
  });
}
