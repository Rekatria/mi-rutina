// Mi Rutina – service worker: la app abre aunque no haya señal.
const CACHE = 'mi-rutina-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const propio = url.origin === self.location.origin;
  const fuente = url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com';
  if (!propio && !fuente) return; // la planilla (Apps Script) siempre va por red
  e.respondWith(caches.open(CACHE).then(async c => {
    const enCache = await c.match(req, {ignoreSearch: propio});
    const red = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => enCache);
    return enCache || red;   // muestra lo guardado al instante y se actualiza para la próxima
  }));
});
