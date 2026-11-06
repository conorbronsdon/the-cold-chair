/* The Cold Chair — offline service worker (v0.61.0, the second file the game admits to).
   The game is one self-contained page, so "offline" means: keep index.html alive with no network.
   Strategy is NETWORK-FIRST — an online player always gets the freshest single file (no stale-cache
   trap for a game that ships often), and only when the network is gone do we serve the last good copy.
   The shell is also pre-cached on install so the very first offline visit works even if the player
   never came back online first. Bump CACHE to retire an old generation. No app state lives here —
   saves and slots are localStorage, which the worker never touches. */
const CACHE = 'cold-chair-v0.61';
const SHELL = ['./', './index.html', './vendor/three.r158.min.js'];   // the diorama's renderer, so it opens offline

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
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
  // Hosted endpoints (play counters, health) always go to the network: a cached answer would lie offline.
  if (new URL(e.request.url).pathname.startsWith('/api/')) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // freshen the cache on every full same-origin 200 (really just index.html). Gate on status===200,
        // not res.ok — a 206 Partial would pass res.ok but reject in cache.put; and swallow any put error
        // (quota/partial) so it never becomes an unhandled rejection in the worker.
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
  );
});
