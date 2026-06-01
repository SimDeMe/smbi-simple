import { initializeApp }          from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut }
                                   from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js';
import { initializeFirestore, persistentLocalCache }
                                   from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';
import { firebaseConfig }          from './firebase-config.js';

// ─── Firebase init ────────────────────────────────────────
const firebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db   = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache()
});

const provider = new GoogleAuthProvider();

// ─── Farvepalette til aktiviteter ─────────────────────────
export const COLOR_PALETTE = [
  '#3b82f6', // blå
  '#10b981', // smaragd
  '#f59e0b', // amber
  '#ef4444', // rød
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#ec4899', // pink
  '#6366f1', // indigo
];

// ─── DOM-referencer ──────────────────────────────────────
const $        = id => document.getElementById(id);
const loadingScreen  = $('loading-screen');
const loginScreen    = $('login-screen');
const appEl          = $('app');
const btnGoogleLogin = $('btn-google-login');
const btnLogout      = $('btn-logout');
const navBtns        = document.querySelectorAll('.nav-btn');
const views          = document.querySelectorAll('.view');

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
onAuthStateChanged(auth, user => {
  loadingScreen.classList.add('hidden');
  if (user) {
    loginScreen.classList.add('hidden');
    appEl.classList.remove('hidden');
    onUserSignedIn(user);
  } else {
    appEl.classList.add('hidden');
    loginScreen.classList.remove('hidden');
  }
});

// ─── App init ────────────────────────────────────────────
function onUserSignedIn(user) {
  console.log('Logget ind:', user.email);
  navigateTo('hjem');
  // TODO Trin 2: check first-run onboarding
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
  btn.addEventListener('click', () => navigateTo(btn.dataset.view));
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
