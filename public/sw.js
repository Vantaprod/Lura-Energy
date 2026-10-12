/* Lura Admin service worker.
 * Strategy:
 *   - Same-origin static assets: cache-first
 *   - Admin HTML pages: network-first with offline fallback
 *   - API calls: always network (never cached)
 */
const VERSION = 'lura-admin-v1';
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

const PRECACHE = ['/admin/login', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE).catch(() => {})),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(VERSION))
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API responses.
  if (url.pathname.startsWith('/api/')) return;

  // Only handle admin scope + assets.
  const isAdminPage = url.pathname === '/admin' || url.pathname.startsWith('/admin/');
  const isAsset =
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/icon') ||
    url.pathname === '/manifest.webmanifest';

  if (!isAdminPage && !isAsset) return;

  if (isAsset) {
    // Cache-first for static assets.
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(req, copy)).catch(() => {});
            return res;
          }),
      ),
    );
    return;
  }

  // Network-first for admin HTML, fall back to cache.
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('/admin/login'))),
  );
});