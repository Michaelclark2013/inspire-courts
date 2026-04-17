// Inspire Courts — Public App Service Worker
// Vanilla JS, runs in service worker context

const CACHE_VERSION = 'v1';
const SHELL_CACHE = `inspire-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `inspire-static-${CACHE_VERSION}`;
const API_CACHE = `inspire-api-${CACHE_VERSION}`;

const SHELL_URLS = ['/offline'];

// ── Install: pre-cache app shell ──────────────────────────────────────
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
          .filter((k) => k.startsWith('inspire-') && !k.endsWith(CACHE_VERSION))
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

  // Skip non-GET, auth, and admin routes
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/auth')) return;
  if (url.pathname.startsWith('/admin')) return;

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

  // API GETs: stale-while-revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }
});

// ── Helpers ───────────────────────────────────────────────────────────

/**
 * Network-first with timeout. Falls back to cache, then /offline.
 */
async function networkFirstWithTimeout(request, timeout) {
  try {
    const response = await promiseWithTimeout(fetch(request), timeout);
    // Cache successful navigations in the shell cache
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_err) {
    // Network failed or timed out — try cache
    const cached = await caches.match(request);
    if (cached) return cached;
    // Last resort: offline page
    const offlinePage = await caches.match('/offline');
    return offlinePage || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/html' } });
  }
}

/**
 * Cache-first. If not cached, fetch from network and store.
 */
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

/**
 * Stale-while-revalidate. Return cached immediately, refresh in background.
 */
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
    .catch(() => cached); // If network fails and we have a cached copy, keep it

  return cached || fetchPromise;
}

/**
 * Race a promise against a timeout.
 */
function promiseWithTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}
