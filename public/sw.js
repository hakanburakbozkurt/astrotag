const CACHE_NAME = "astrotag-v4";
const OFFLINE_URL = "/";

const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/assets/sales/a98ae98a-fff5-43ff-a684-011bdfc6aa82.jfif?v=2",
  "/private-mode-warning",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: "offline" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  if (url.pathname.startsWith("/c/")) {
    event.respondWith(fetch(request));
    return;
  }

  if (
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/profile")
  ) {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(OFFLINE_URL)) ?? new Response("Offline", { status: 503 });
      })
    );
    return;
  }

  if (url.pathname === "/" || url.pathname === "/kozmik-baslangic" || url.pathname === "/siparislerim") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && url.origin === self.location.origin) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match(request)) ?? (await cache.match(OFFLINE_URL)) ?? new Response("Offline", { status: 503 });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          if (response.ok && url.origin === self.location.origin) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
    )
  );
});
