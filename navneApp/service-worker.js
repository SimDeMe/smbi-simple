const CACHE_NAME = 'navne-app-v3';
const ASSETS = [
  '/navneApp/',
  '/navneApp/index.html',
  '/navneApp/css/style.css',
  '/navneApp/js/app.js',
  '/navneApp/js/auth.js',
  '/navneApp/js/import.js',
  '/navneApp/js/quiz.js',
  '/navneApp/js/srs.js',
  '/navneApp/js/confusion.js',
  '/navneApp/js/students.js',
  '/navneApp/js/classes.js',
  '/navneApp/js/ui.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (
    e.request.url.includes('firebasestorage') ||
    e.request.url.includes('firestore') ||
    e.request.url.includes('googleapis') ||
    e.request.url.includes('gstatic')
  ) return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
