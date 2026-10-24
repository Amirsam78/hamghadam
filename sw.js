/* Hamghadam service worker: opens instantly and works offline with the last saved data. */
const CACHE = 'hamghadam-f53ec5b457';
const SHELL = ['./', 'index.html', 'icon-180.png', 'icon-192.png', 'vazir-arabic.woff2', 'vazir-latin.woff2', 'markazi-arabic.woff2'];
const at = (u) => new URL(u, self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map(at))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.indexOf('hamghadam-') === 0 && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (/\/(sw\.js|manifest\.webmanifest)$/.test(url.pathname)) return;
  const page = req.mode === 'navigate' || url.href.split('?')[0] === at('./') || url.href.split('?')[0] === at('index.html');
  if (page) {
    // network first, so updates arrive right away; the saved copy when offline
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(at('index.html'), copy)); }
          return res;
        })
        .catch(() => caches.match(at('index.html')))
    );
    return;
  }
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }))
  );
});
