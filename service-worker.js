// Cache voor de V40 Carpool PWA.
// v2: navigatie (index.html) gaat network-first, zodat je nooit een verouderde
// versie van de app te zien krijgt — alleen als er geen internet is, valt hij
// terug op de laatst gecachte versie. Statische bestanden (iconen, manifest)
// blijven cache-first, want die veranderen zelden.
const CACHE = 'v40carpool-v6';
const ASSETS = ['./', './index.html', './manifest.json', './DE9C44F0-A923-4E46-9C12-6E9843AE79B3.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const isNavigation = e.request.mode === 'navigate' || e.request.url.endsWith('/index.html') || e.request.url.endsWith('/');

  if (isNavigation) {
    // Network-first: probeer altijd de laatste versie op te halen.
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first voor de rest (iconen, manifest, Firebase SDK, ...).
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => cached))
  );
});
