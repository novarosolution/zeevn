/* eslint-disable no-restricted-globals */
/**
 * PWA service worker:
 * - App shell + static assets: stale-while-revalidate
 * - Product images: stale-while-revalidate
 * - API GET: network-first (product detail cache retained)
 */
const SHELL_CACHE = "zeevan-shell-v2";
const IMAGE_CACHE = "zeevan-images-v1";
const API_CACHE = "zeevan-product-detail-v1";
const API_TTL_MS = 5 * 60 * 1000;

const SHELL_PATHS = ["/", "/index.html", "/manifest.webmanifest"];

function isProductDetailRequest(url) {
  try {
    const path = new URL(url).pathname;
    return /^\/api\/products\/[^/]+$/.test(path) || /^\/products\/[^/]+$/.test(path);
  } catch {
    return false;
  }
}

function isProductImageRequest(url) {
  try {
    const u = new URL(url);
    if (u.origin !== self.location.origin) {
      return /\.(webp|png|jpe?g|gif|avif)(\?|$)/i.test(u.pathname);
    }
    return /\/assets\/|\/_expo\/static\/|\/products\//i.test(u.pathname);
  } catch {
    return false;
  }
}

function isStaticAsset(url) {
  try {
    const path = new URL(url).pathname;
    return (
      path.startsWith("/_expo/") ||
      path.startsWith("/assets/") ||
      path.endsWith(".js") ||
      path.endsWith(".css") ||
      path.endsWith(".woff2") ||
      path.endsWith(".ttf")
    );
  } catch {
    return false;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || networkPromise || fetch(request);
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_PATHS.filter(Boolean)).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("zeevan-") && ![SHELL_CACHE, IMAGE_CACHE, API_CACHE].includes(k))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = request.url;

  if (isProductDetailRequest(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(API_CACHE);
        const cached = await cache.match(request);
        if (cached) {
          const cachedAt = Number(cached.headers.get("x-zeevan-cached-at") || 0);
          if (cachedAt && Date.now() - cachedAt < API_TTL_MS) return cached;
        }
        try {
          const response = await fetch(request);
          if (response.ok) {
            const headers = new Headers(response.headers);
            headers.set("x-zeevan-cached-at", String(Date.now()));
            const body = await response.clone().blob();
            await cache.put(request, new Response(body, { status: response.status, statusText: response.statusText, headers }));
          }
          return response;
        } catch (err) {
          if (cached) return cached;
          throw err;
        }
      })()
    );
    return;
  }

  if (isProductImageRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  if (isStaticAsset(url) || SHELL_PATHS.some((p) => url.endsWith(p))) {
    event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
  }
});
