const CACHE = 'tid-v1';
const SHELL = [
  '/tid/',
  '/tid/index.html',
  '/tid/app.js',
  '/tid/styles.css',
  '/tid/firebase-config.js',
  '/tid/manifest.json',
  '/tid/icons/icon.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Don't intercept Firebase / Google CDN requests
  if (url.origin !== self.location.origin) return;

  // Navigation requests → serve cached index.html (SPA fallback)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('/tid/index.html').then(r => r || fetch(e.request))
    );
    return;
  }

  // App shell: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
