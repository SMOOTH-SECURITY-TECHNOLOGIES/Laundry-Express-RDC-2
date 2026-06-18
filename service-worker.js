// Service Worker v3 — Offline-first with network fallback

const CACHE_NAME = 'laundry-express-cache-v3';
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const IMAGE_CACHE = `${CACHE_NAME}-images`;

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
];

// Install: Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== IMAGE_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: Network-first for API, Cache-first for static
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and non-http
  if (!url.protocol.startsWith('http')) return;

  // API requests: Network-first with cache fallback
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/v1/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Images: Cache-first with network fallback
  if (request.destination === 'image' || /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // Static assets: Cache-first
  if (STATIC_ASSETS.some((asset) => url.pathname === asset || url.pathname.endsWith(asset))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Default: Stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// Cache strategies
async function cacheFirst(request, cacheName = STATIC_CACHE) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Laundry Express';
  const options = {
    body: data.body || 'Nouvelle notification',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: { url: data.url || self.location.origin },
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const urlToOpen = event.notification.data.url || '/';
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingActions());
  }
});

async function syncPendingActions() {
  // Sync pending orders, status updates, etc.
  console.log('[SW] Syncing pending actions');
}
