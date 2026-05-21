import { Platform } from "react-native";

export const APP_VH_CSS_VAR = "--app-vh";
export const APP_VIEWPORT_MIN_HEIGHT = "calc(var(--app-vh, 1vh) * 100)";

let viewportBound = false;
let cleanupFns = [];

function addListener(target, event, handler) {
  if (!target?.addEventListener) return;
  target.addEventListener(event, handler);
  cleanupFns.push(() => target.removeEventListener(event, handler));
}

export function supportsCssFeature(property, value) {
  if (Platform.OS !== "web" || typeof window === "undefined") return false;
  const css = window.CSS;
  if (!css?.supports) return false;
  try {
    return css.supports(property, value);
  } catch {
    return false;
  }
}

export function supportsBackdropFilter() {
  return (
    supportsCssFeature("backdrop-filter", "blur(14px)") ||
    supportsCssFeature("-webkit-backdrop-filter", "blur(14px)")
  );
}

export function setViewportHeightVar() {
  if (Platform.OS !== "web" || typeof window === "undefined" || typeof document === "undefined") return;
  const vh = Math.max(1, Number(window.innerHeight || 0)) * 0.01;
  document.documentElement.style.setProperty(APP_VH_CSS_VAR, `${vh}px`);
}

export function installWebViewportWorkarounds() {
  if (Platform.OS !== "web" || typeof window === "undefined") return () => {};
  if (viewportBound) return () => {};
  viewportBound = true;
  setViewportHeightVar();
  const onResize = () => setViewportHeightVar();
  addListener(window, "resize", onResize);
  addListener(window, "orientationchange", onResize);
  addListener(window.visualViewport, "resize", onResize);
  return () => {
    cleanupFns.forEach((fn) => fn());
    cleanupFns = [];
    viewportBound = false;
  };
}

export function isAndroidUserAgent() {
  if (Platform.OS !== "web" || typeof navigator === "undefined") return false;
  return /Android/i.test(String(navigator.userAgent || ""));
}

