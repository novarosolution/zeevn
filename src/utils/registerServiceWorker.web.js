/**
 * Registers the product-detail cache service worker (web only).
 */
export function registerProductCacheServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (__DEV__ || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") return;

  const register = () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* optional — dev server may not serve /sw.js */
    });
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}
