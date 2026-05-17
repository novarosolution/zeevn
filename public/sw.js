/* eslint-disable no-restricted-globals */
/**
 * Cache GET /products/:id responses for 5 minutes (PDP fast revisit).
 */
const CACHE = "zeevan-product-detail-v1";
const TTL_MS = 5 * 60 * 1000;

function isProductDetailRequest(url) {
  try {
    const path = new URL(url).pathname;
    return /^\/api\/products\/[^/]+$/.test(path) || /^\/products\/[^/]+$/.test(path);
  } catch {
    return false;
  }
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("zeevan-product-detail-") && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !isProductDetailRequest(request.url)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);
      if (cached) {
        const cachedAt = Number(cached.headers.get("x-zeevan-cached-at") || 0);
        if (cachedAt && Date.now() - cachedAt < TTL_MS) {
          return cached;
        }
      }

      try {
        const response = await fetch(request);
        if (response.ok) {
          const headers = new Headers(response.headers);
          headers.set("x-zeevan-cached-at", String(Date.now()));
          const body = await response.clone().blob();
          await cache.put(
            request,
            new Response(body, { status: response.status, statusText: response.statusText, headers })
          );
        }
        return response;
      } catch (err) {
        if (cached) return cached;
        throw err;
      }
    })()
  );
});
