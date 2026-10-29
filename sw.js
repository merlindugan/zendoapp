// ZendoApp service worker: permite instalar la app y abrirla sin conexión.
// Si cambiás algo en la app, subí este número para forzar la actualización.
const VERSION = 'zendoapp-v1';
const SHELL = ['/', '/index.html', '/config.js', '/manifest.json',
  '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // Firebase y fuentes van directo a la red

  // Página y configuración: primero la red (para tener siempre lo último), si no hay, lo guardado.
  if (req.mode === 'navigate' || url.pathname === '/config.js' || url.pathname === '/index.html') {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put(req.mode === 'navigate' ? '/' : req, copy));
      return res;
    }).catch(() => caches.match(req.mode === 'navigate' ? '/' : req)));
    return;
  }
  // Íconos y demás: lo guardado, si no hay, la red.
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});

// Al tocar un aviso, abre la app.
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(list => {
    for (const c of list) if ('focus' in c) return c.focus();
    return self.clients.openWindow('/');
  }));
});
