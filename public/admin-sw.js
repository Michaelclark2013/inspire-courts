// Inspire Courts — Admin App Service Worker
// Vanilla JS, runs in service worker context — scoped to /admin

const CACHE_VERSION = 'v1';
const SHELL_CACHE = `admin-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `admin-static-${CACHE_VERSION}`;
const API_CACHE = `admin-api-${CACHE_VERSION}`;

const SHELL_URLS = ['/admin/offline'];

// ── Install: pre-cache admin shell ────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

// ── Activate: clean up old caches ─────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('admin-') && !k.endsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch handler ─────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip auth routes
  if (url.pathname.startsWith('/api/auth')) return;

  // Navigation: network-first with 3 s timeout
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithTimeout(request, 3000));
    return;
  }

  // Static assets: cache-first
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.match(/\.(js|css|woff2?|png|jpg|svg|ico)$/)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Admin API GETs: stale-while-revalidate
  if (url.pathname.startsWith('/api/admin') ||
      url.pathname.startsWith('/api/scores') ||
      url.pathname.startsWith('/api/tournaments')) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }
});

// ── Background sync (Phase 1C placeholders) ──────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'score-sync') {
    event.waitUntil(syncScores());
  }
  if (event.tag === 'checkin-sync') {
    event.waitUntil(syncCheckins());
  }
});

async function syncScores() {
  // Phase 1C: replay queued score updates from IndexedDB
  // Placeholder — will be implemented when offline score entry is built
}

async function syncCheckins() {
  // Phase 1C: replay queued check-in actions from IndexedDB
  // Placeholder — will be implemented when offline check-in is built
}

// ── Helpers ───────────────────────────────────────────────────────────

async function networkFirstWithTimeout(request, timeout) {
  try {
    const response = await promiseWithTimeout(fetch(request), timeout);
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offlinePage = await caches.match('/admin/offline');
    return offlinePage || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/html' } });
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_err) {
    return new Response('', { status: 408 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

function promiseWithTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}
