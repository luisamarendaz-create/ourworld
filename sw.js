// OurWorld service worker v2: fresh app HTML first, cached copy only if offline.
// Authentication tokens and Supabase requests must never be cached here.
const CACHE_NAME = 'ourworld-shell-v2';
const SHELL = [
  './', './index.html', './manifest.webmanifest', './apple-touch-icon.png',
  './icon-192.png', './icon-512.png', './favicon-32x32.png', './favicon-16x16.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(names => Promise.all(names.filter(n => n.startsWith('ourworld-') && n !== CACHE_NAME).map(n => caches.delete(n)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase, CDN etc: always network
  const isNavigation = req.mode === 'navigate';
  if (isNavigation) {
    event.respondWith(fetch(req).then(response => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE_NAME).then(c => c.put('./index.html', copy)); }
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(req).then(hit => hit || fetch(req).then(response => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE_NAME).then(c => c.put(req, copy)); }
    return response;
  })));
});
