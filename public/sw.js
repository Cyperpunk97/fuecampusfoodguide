const APP_CACHE = 'cs-family-app-v4';
const SOURCE_CACHE = 'cs-family-original-v3';
const LOGO_CACHE = 'cs-family-logos-v2';
const MENU_IMAGE_CACHE = 'cs-family-dish-images-v1';
const MENU_IMAGE_HOSTS = ['talabat.dhmedia.io', 'images.deliveryhero.io', 'images.talabat.com'];
const ORIGINAL_PREFIX = 'https://raw.githubusercontent.com/Cyperpunk97/CS-FAMILY-STAR/d8392863f32443974543d50307774a81def72b07/';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg', '/CREDITS.md'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(APP_CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key =>
    key.startsWith('cs-family-photos-')
    || (key.startsWith('cs-family-app-') && key !== APP_CACHE)
    || (key.startsWith('cs-family-original-') && key !== SOURCE_CACHE)
  ).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (MENU_IMAGE_HOSTS.includes(url.hostname)) {
    event.respondWith(caches.open(MENU_IMAGE_CACHE).then(async cache => {
      const saved = await cache.match(event.request);
      if (saved) return saved;
      const response = await fetch(event.request);
      if (response.ok || response.type === 'opaque') await cache.put(event.request, response.clone());
      return response;
    }));
    return;
  }
  if (event.request.url.startsWith(ORIGINAL_PREFIX)) {
    const cacheName = url.pathname.includes('/public/logos/') ? LOGO_CACHE : SOURCE_CACHE;
    event.respondWith(caches.open(cacheName).then(async cache => {
      const saved = await cache.match(event.request);
      if (saved) return saved;
      const response = await fetch(event.request);
      if (response.ok || response.type === 'opaque') await cache.put(event.request, response.clone());
      return response;
    }));
    return;
  }
  if (url.origin === self.location.origin && url.pathname.startsWith('/icons/')) {
    event.respondWith(caches.open('cs-family-icons-v2').then(cache => cache.match(event.request)).then(response => response || fetch(event.request)));
    return;
  }
  if (url.origin === self.location.origin) {
    event.respondWith(fetch(event.request).then(response => {
      if (response.ok && !url.pathname.startsWith('/@') && !url.pathname.startsWith('/src/') && !url.pathname.includes('node_modules')) {
        const copy = response.clone(); event.waitUntil(caches.open(APP_CACHE).then(cache => cache.put(event.request, copy)));
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      if (event.request.mode === 'navigate') return (await caches.match('/')) || Response.error();
      return Response.error();
    }));
  }
});
