const C = 'sloth-hour-v2', F = ['./', 'index.html', 'style.css', 'app.js', 'icon.svg', 'manifest.webmanifest'];
self.addEventListener('install', e => e.waitUntil(caches.open(C).then(c => c.addAll(F))));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== C).map(n => caches.delete(n))))));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(C).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});