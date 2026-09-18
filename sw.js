const CACHE_NAME = 'exhale-crm-v1';

// List all the static assets your CRM needs to load the shell instantly
const ASSETS_TO_CACHE = [
  '/crm.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-icon-192.png',
  '/icons/maskable-icon-512.png'
  // Add paths to your main CSS or JS files here if you have them, e.g.:
  // '/css/styles.css',
  // '/js/app.js'
];

// 1. Install Event: Cache core app shell files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// 2. Activate Event: Clean up older cache versions when you update the CRM
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache store:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 3. Fetch Event: Serve cached assets immediately, or fallback to the network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests or non-GET requests (like API data submissions)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // Return fast cached asset
      }

      // If not cached, fetch from network normally
      return fetch(event.request).then((networkResponse) => {
        // Don't cache dynamic API responses or database queries
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Dynamically cache new static assets encountered
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Optional: If offline completely and looking for a page, you can handle it here
      });
    })
  );
});
