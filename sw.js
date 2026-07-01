/* Service worker — tryb offline dla planu podróży Japonia 2026 */
const CACHE = 'japonia2026-v8';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './img/day01-1-yasaka-pagoda.jpg',
  './img/day01-2-shirakawa.jpg',
  './img/day01-3-pontocho.jpg',
  './img/day01-4-yasaka-shrine.jpg',
  './img/day02-1-kiyomizu.jpg',
  './img/day02-2-fushimi.jpg',
  './img/day02-3-sannenzaka.jpg',
  './img/day02-4-nanzenji.jpg',
  './img/day03-1-osaka-castle.jpg',
  './img/day03-2-dotonbori.jpg',
  './img/day03-3-tsutenkaku.jpg',
  './img/day03-4-shinsaibashi.jpg',
  './img/day04-1-bamboo.jpg',
  './img/day04-2-kinkakuji.jpg',
  './img/day04-3-tenryuji.jpg',
  './img/day04-4-togetsukyo.jpg',
  './img/day05-1-byodoin.jpg',
  './img/day05-2-todaiji.jpg',
  './img/day05-3-nara-deer.jpg',
  './img/day05-4-kasuga.jpg'
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
