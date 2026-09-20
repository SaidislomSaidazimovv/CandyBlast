const CACHE_NAME = 'candy-blast-v26';
const ASSETS = [
  '/js/entry.js',
  '/js/supabase-config.js',
  '/images/ui/landscape.svg',
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
  '/js/render-bridge.js',
  '/js/renderer3d.mjs',
  '/css/mobile-game.css',
  '/css/interface.css',
  '/css/responsive.css',
  '/css/worlds.css',
  '/js/interface.js',
  '/images/ui/icons.svg',
  '/images/ui/app.svg',
  '/images/ui/app-icon-512.png',
  '/images/ui/candyblast-logo.webp',
  '/images/ui/candyblast-emblem.webp',
  '/images/worlds/berry-meadow.webp',
  '/images/worlds/sundae-harbour.webp',
  '/images/worlds/mintwood.webp',
  '/images/worlds/caramel-peaks.webp',
  '/vendor/three/three.module.min.js',
  '/vendor/three/three.core.js',
  '/js/performance.js',
  '/css/adventure.css',
  '/js/adventure.js',
  '/images/candies/berry.svg',
  '/images/candies/diamond.svg',
  '/images/candies/mint.svg',
  '/images/candies/star.svg',
  '/images/candies/grape.svg',
  '/images/candies/orange.svg',
  '/images/candies/prism.svg',
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
      Promise.all(keys.filter(k => k.startsWith('candy-blast-') && k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Local development must show edits immediately; deployed builds stay offline-first.
  if(['localhost','127.0.0.1','[::1]'].includes(self.location.hostname))return;
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
