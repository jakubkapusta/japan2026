/* Service worker — tryb offline dla planu podróży Japonia 2026 */
const CACHE = 'japonia2026-v19';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './img/day01-1-yasaka-pagoda.jpg',
  './img/day02-2-fushimi.jpg',
  './img/day03-2-dotonbori.jpg',
  './img/day04-1-bamboo.jpg',
  './img/day05-1-byodoin.jpg',
  './img/day06-2-shirakawago.jpg',
  './img/day07-3-setogawa.jpg',
  './img/day08-2-kappa.jpg',
  './img/day09-1-matsumoto.jpg',
  './img/day10-2-zuishinmon.jpg',
  './img/day11-1-monkey.jpg',
  './img/day12-1-zenkoji.jpg',
  './img/day13-1-shinkansen.jpg',
  './img/day14-3-skytree.jpg',
  './img/day15-4-rainbowbridge.jpg',
  './img/day16-3-shibuyasky.jpg',
  './img/day17-3-nezu.jpg',
  './img/day18-2-kabukicho.jpg',
  './img/day19-1-daibutsu.jpg',
  './img/dog.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Strona (nawigacja): sieć najpierw (świeże dane gdy online), cache w razie braku sieci
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  // Reszta (ikony, manifest, fonty Google): cache najpierw, w tle dociągamy i zapisujemy
  e.respondWith(
    caches.match(req).then(cached => {
      const fetched = fetch(req).then(res => {
        const okToCache = res && res.status === 200 &&
          (url.origin === location.origin ||
           url.host.includes('gstatic') || url.host.includes('googleapis'));
        if (okToCache) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
