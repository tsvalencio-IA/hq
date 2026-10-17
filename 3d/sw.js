/* Instalação web do Universo thIAguinho 3D. Não altera estado nem jogabilidade. */
const CACHE = 'universo-thiaguinho-3d-pwa-v4';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './mascotes-3d.js', './acoes-visuais.js', './acoes-visuais.css',
  './troca-bateria.js', './troca-bateria.css', './mascotes_aprovados.webp',
  './icons/mascotes-reais-192.png', './icons/mascotes-reais-512.png', './icons/mascotes-reais-maskable-512.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => Promise.allSettled(
    ASSETS.map(url => cache.add(new Request(url, {cache:'reload'})))
  )).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('universo-thiaguinho-3d-pwa-') && key !== CACHE)
      .map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE);
        event.waitUntil(cache.put(request, response.clone()).catch(() => {}));
      }
      return response;
    } catch (_) {
      const cached = await caches.match(request, {ignoreSearch:true});
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const shell = await caches.match('./index.html', {ignoreSearch:true});
        if (shell) return shell;
      }
      return Response.error();
    }
  })());
});
