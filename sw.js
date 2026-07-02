/* Service worker — tryb offline dla planu podróży Japonia 2026 */
const CACHE = 'japonia2026-v12';
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
  './img/day05-4-kasuga.jpg',
  './img/day06-1-kenrokuen.jpg',
  './img/day06-2-shirakawago.jpg',
  './img/day06-3-takayama.jpg',
  './img/day06-4-omicho.jpg',
  './img/day07-1-miyagawa.jpg',
  './img/day07-2-jinya.jpg',
  './img/day07-3-setogawa.jpg',
  './img/day07-4-hidabeef.jpg',
  './img/day08-1-taisho.jpg',
  './img/day08-2-kappa.jpg',
  './img/day08-3-myojin.jpg',
  './img/day08-4-azusa.jpg',
  './img/day09-1-matsumoto.jpg',
  './img/day09-2-nawate.jpg',
  './img/day09-3-wasabi.jpg',
  './img/day09-4-utsukushigahara.jpg',
  './img/day10-1-sugi.jpg',
  './img/day10-2-zuishinmon.jpg',
  './img/day10-3-chusha.jpg',
  './img/day10-4-kagamiike.jpg',
  './img/day11-1-monkey.jpg',
  './img/day11-2-shigakogen.jpg',
  './img/day11-3-shibutoge.jpg',
  './img/day11-4-obuse.jpg',
  './img/day12-1-zenkoji.jpg',
  './img/day12-2-nakamise.jpg',
  './img/day12-3-matsushiro.jpg',
  './img/day12-4-sanmon.jpg',
  './img/day13-1-shinkansen.jpg',
  './img/day13-2-sugamo.jpg',
  './img/day13-3-rikugien.jpg',
  './img/day13-4-ikebukuro.jpg',
  './img/day14-1-sensoji.jpg',
  './img/day14-2-nakamise.jpg',
  './img/day14-3-skytree.jpg',
  './img/day14-4-teamlab.jpg',
  './img/day15-1-akihabara.jpg',
  './img/day15-2-gundam.jpg',
  './img/day15-3-daikoku.jpg',
  './img/day15-4-rainbowbridge.jpg',
  './img/day16-1-meiji.jpg',
  './img/day16-2-shibuya-crossing.jpg',
  './img/day16-3-shibuyasky.jpg',
  './img/day16-4-sakebarrels.jpg',
  './img/day17-1-tomioka.jpg',
  './img/day17-2-yanaka.jpg',
  './img/day17-3-nezu.jpg',
  './img/day17-4-ameyoko.jpg',
  './img/day18-1-godzilla.jpg',
  './img/day18-2-kabukicho.jpg',
  './img/day18-3-omoide.jpg',
  './img/day18-4-fujitv.jpg',
  './img/day19-1-daibutsu.jpg',
  './img/day19-2-tsurugaoka.jpg',
  './img/day19-3-enoden.jpg',
  './img/day19-4-enoshima.jpg'
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
