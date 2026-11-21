// Only cache public static app assets. Do not intercept private Supabase requests.
const CACHE_NAME = 'ourworld-static-v2';
const ASSETS = [
  './manifest.webmanifest', './apple-touch-icon.png',
  './icon-192.png', './icon-512.png',
  './favicon-32x32.png', './favicon-16x16.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(names => Promise.all(names.filter(n => n !== CACHE_NAME && n.startsWith('ourworld-')).map(n => caches.delete(n)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !ASSETS.some(p => url.pathname.endsWith(p.slice(1)))) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
