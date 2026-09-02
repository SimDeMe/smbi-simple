const CACHE = 'tid-v11';
const SHELL = [
  '/tid/',
  '/tid/index.html',
  '/tid/hjaelp.html',
  '/tid/installer.html',
  '/tid/styles.css',
  '/tid/app.js',
  '/tid/activities.js',
  '/tid/timer.js',
  '/tid/historik.js',
  '/tid/kalender.js',
  '/tid/kalender-akse.js',
  '/tid/kalender-oversigt.js',
  '/tid/periode.js',
  '/tid/rapporter.js',
  '/tid/indstillinger.js',
  '/tid/skema.js',
  '/tid/pauser.js',
  '/tid/firebase-config.js',
  '/tid/manifest.json',
  '/tid/icons/icon.svg',
  '/tid/icons/icon-180.png',
  '/tid/icons/icon-192.png',
  '/tid/icons/icon-512.png',
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

  // Sider, stilark og JavaScript: netværket først, cachen som reserve.
  //
  // Cache-først var forkert her: en ny udgave af index.html blev hentet fra
  // netværket, mens styles.css og modulerne kom fra den gamle cache — så
  // sad appen med ny markup og gammel kode, hvor knapper ingen lyttere
  // havde og nye elementer stod ustylede. Koden skal følges ad.
  const erSide = e.request.mode === 'navigate';
  if (erSide || /\.(?:html|css|js)$/.test(url.pathname)) {
    e.respondWith(netvaerkFoerst(e, erSide));
    return;
  }

  // Ikoner, billeder og manifest ændrer sig sjældent: cachen først, og
  // hentes i baggrunden, så næste besøg har den nye udgave
  e.respondWith(cacheFoerst(e));
});

function gem(e, res) {
  if (res.ok) {
    const kopi = res.clone();
    e.waitUntil(caches.open(CACHE).then(c => c.put(e.request, kopi)));
  }
  return res;
}

async function netvaerkFoerst(e, erSide) {
  try {
    return gem(e, await fetch(e.request));
  } catch (err) {
    const cachet = await caches.match(e.request);
    if (cachet) return cachet;
    if (erSide) {
      const start = await caches.match('/tid/index.html');
      if (start) return start;
    }
    throw err;
  }
}

async function cacheFoerst(e) {
  const cachet = await caches.match(e.request);
  if (!cachet) return gem(e, await fetch(e.request));
  e.waitUntil(
    fetch(e.request)
      .then(res => { if (res.ok) return caches.open(CACHE).then(c => c.put(e.request, res)); })
      .catch(() => {})
  );
  return cachet;
}
