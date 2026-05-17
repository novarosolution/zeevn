/**
 * Registers the product-detail cache service worker (web only).
 */
export function registerProductCacheServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

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
