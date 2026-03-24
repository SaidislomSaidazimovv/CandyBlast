const CACHE_NAME = 'candy-blast-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/tutorial.css',
  '/css/spin.css',
  '/css/specials.css',
  '/css/map.css',
  '/js/tutorial.js',
  '/js/lives.js',
  '/js/daily.js',
  '/js/spin.js',
  '/js/specials.js',
  '/js/map.js',
  '/js/backgrounds.js',
  '/js/game.js',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cache Google Fonts on first load
        if (e.request.url.includes('fonts.googleapis.com') ||
            e.request.url.includes('fonts.gstatic.com')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback
        if (e.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
