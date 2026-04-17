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
  await replayFromIndexedDB('score');
}

async function syncCheckins() {
  await replayFromIndexedDB('checkin');
}

// ── IndexedDB replay (vanilla JS — SW cannot import TS modules) ──────
async function replayFromIndexedDB(filterType) {
  const db = await openOfflineDB();
  const pending = await getPendingMutations(db, filterType);

  for (const mutation of pending) {
    try {
      const res = await fetch(mutation.url, {
        method: mutation.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mutation.body),
      });
      if (res.ok) {
        await updateMutationStatus(db, mutation.id, 'synced');
      } else {
        const errText = await res.text().catch(() => res.statusText);
        await updateMutationStatus(db, mutation.id, 'failed', errText);
      }
    } catch (err) {
      await updateMutationStatus(db, mutation.id, 'failed', err.message || 'Unknown error');
    }
  }
  db.close();
}

function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('inspire-offline-db', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('offline-mutations')) {
        const store = db.createObjectStore('offline-mutations', { keyPath: 'id', autoIncrement: true });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getPendingMutations(db, filterType) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline-mutations', 'readonly');
    const store = tx.objectStore('offline-mutations');
    const index = store.index('status');
    const request = index.getAll('pending');
    request.onsuccess = () => {
      let results = request.result || [];
      if (filterType) {
        results = results.filter((m) => m.type === filterType);
      }
      results.sort((a, b) => a.timestamp - b.timestamp);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

function updateMutationStatus(db, id, status, error) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline-mutations', 'readwrite');
    const store = tx.objectStore('offline-mutations');
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      if (getReq.result) {
        const updated = { ...getReq.result, status };
        if (error) updated.error = error;
        store.put(updated);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Helpers ───────────────────────────────────────────────────────────

// ── Push notification handler ────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Inspire Courts', {
      body: data.body || '',
      icon: '/apple-icon-180x180.png',
      badge: '/icons/icon-72x72.png',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});

// ── Message handler (SKIP_WAITING for UpdatePrompt) ──────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

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
