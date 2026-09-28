// Cache voor de V40 Carpool PWA.
// Navigatie (index.html) gaat network-first, zodat je nooit een verouderde
// versie te zien krijgt. Alleen offline valt hij terug op de gecachte versie.
// Statische bestanden (iconen, manifest) blijven cache-first.
const CACHE = 'v40carpool-v8';
const ASSETS = ['./', './index.html', './manifest.json', './DE9C44F0-A923-4E46-9C12-6E9843AE79B3.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  const isNavigation =
    e.request.mode === 'navigate' ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/');

  if (isNavigation) {
    // Network-first, en 'no-cache' zodat ook de HTTP-cache van de browser wordt omzeild.
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' })
        .then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Cache-first voor de rest (iconen, manifest, Firebase SDK, ...).
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached ||
      fetch(e.request)
        .then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => cached)
    )
  );
});