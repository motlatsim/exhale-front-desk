// Bumped to v2 so activate() drops any v1 cache that already holds a bad
// response cached by the previous fetch handler.
const CACHE_NAME = "exhale-crm-shell-v2";

const OFFLINE_PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Exhale CRM — Offline</title>
<style>
  body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;
    flex-direction:column;gap:14px;text-align:center;padding:24px;
    background:#2B2D37;color:#F3EEE8;font-family:system-ui,sans-serif}
  h1{font-size:19px;font-weight:700;margin:0}
  p{font-size:13.5px;color:#B9BAC4;margin:0;max-width:280px;line-height:1.5}
  button{margin-top:6px;padding:11px 20px;border:none;border-radius:9px;
    background:#20C997;color:#12241D;font-weight:800;font-size:13.5px;cursor:pointer}
</style></head>
<body>
  <h1>No connection</h1>
  <p>The CRM couldn't load because the signal dropped. It'll work again as soon as you're back online.</p>
  <button onclick="location.reload()">Try again</button>
</body></html>`;

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
    const isNavigation = req.mode === "navigate";
    const cacheKey = isNavigation ? "/crm.html" : req;
    // Network-first so staff always get the latest build when online;
    // fall back to the cached shell when offline.
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Only cache a genuinely good response. Caching a 404 or a 502
          // here poisons the shell, and every later offline load then
          // serves that error body as if it were the app.
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(cacheKey, copy))
              .catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(cacheKey).then((cached) => {
          if (cached) return cached;
          // caches.match() resolves to undefined on a miss, and
          // respondWith(undefined) fails the navigation outright — that is
          // what turns one dropped request on a weak signal into a blank
          // white page. The cache is empty more often than it looks: the
          // install handler swallows precache failures, and iOS evicts
          // Cache Storage after about a week of disuse.
          if (!isNavigation) return Response.error();
          return new Response(OFFLINE_PAGE, {
            status: 503,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        }))
    );
    return;
  }

  if (url.origin !== self.location.origin) {
    // Fonts and other cross-origin static assets: stale-while-revalidate.
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(req).then((cached) => {
          const fetchPromise = fetch(req).then((res) => {
            if (res.ok || res.type === "opaque") {
              cache.put(req, res.clone()).catch(() => {});
            }
            return res;
          }).catch(() => cached || Response.error());
          return cached || fetchPromise;
        })
      )
    );
  }
});
