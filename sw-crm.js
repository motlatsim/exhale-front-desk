const CACHE_NAME = "exhale-crm-shell-v1";
const SHELL_URLS = [
  "/crm.html",
  "/manifest-crm.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        SHELL_URLS.map((url) => cache.add(url).catch(() => {}))
      )
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never intercept the live API — always hit the network directly.
  if (url.pathname.startsWith("/.netlify/functions/")) return;

  const isShellAsset = url.origin === self.location.origin &&
    (SHELL_URLS.includes(url.pathname) || req.mode === "navigate");

  if (isShellAsset) {
    // Network-first so staff always get the latest build when online;
    // fall back to the cached shell when offline.
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req.mode === "navigate" ? "/crm.html" : req, copy));
          return res;
        })
        .catch(() => caches.match(req.mode === "navigate" ? "/crm.html" : req))
    );
    return;
  }

  if (url.origin !== self.location.origin) {
    // Fonts and other cross-origin static assets: stale-while-revalidate.
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(req).then((cached) => {
          const fetchPromise = fetch(req).then((res) => {
            cache.put(req, res.clone());
            return res;
          }).catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
  }
});
