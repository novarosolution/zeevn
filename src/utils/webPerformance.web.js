import { Platform } from "react-native";
import { ALCHEMY } from "../theme/customerAlchemy";

let cachedProfile = null;
let sharedCleanup = null;
const subscribers = new Set();

/**
 * Detect Android / touch web and other low-cost signals.
 * Used to disable blur, GSAP, layered gradients, and scroll-linked decor.
 */
export function getWebPerformanceProfile() {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return { lite: false, android: false, coarse: false, reduced: false };
  }
  if (cachedProfile) return cachedProfile;

  const android = /Android/i.test(String(window.navigator?.userAgent || ""));
  const coarse = Boolean(window.matchMedia?.("(pointer: coarse)")?.matches);
  const reduced = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
  const saveData = Boolean(window.navigator?.connection?.saveData);
  const lowMemory = Number(window.navigator?.deviceMemory || 8) <= 4;
  const lite = android || coarse || reduced || saveData || lowMemory;

  cachedProfile = { lite, android, coarse, reduced, saveData, lowMemory };
  return cachedProfile;
}

export function refreshWebPerformanceProfile() {
  cachedProfile = null;
  return getWebPerformanceProfile();
}

export function isWebLiteMode() {
  return getWebPerformanceProfile().lite;
}

export function applyWebDocumentPerfClasses({ lite, isDark } = {}) {
  if (typeof document === "undefined") return;
  const profile = lite == null ? getWebPerformanceProfile() : { lite: Boolean(lite), android: getWebPerformanceProfile().android };
  const html = document.documentElement;
  html.classList.toggle("zv-lite", profile.lite);
  html.classList.toggle("zv-android-web", profile.android);
  if (typeof isDark === "boolean") {
    html.classList.toggle("zv-dark", isDark);
  }
}

export function bindWebPerformanceListeners(onChange) {
  if (typeof window === "undefined") return () => {};

  if (!sharedCleanup) {
    const notifyAll = () => {
      const profile = refreshWebPerformanceProfile();
      subscribers.forEach((handler) => {
        try {
          handler?.(profile);
        } catch {
          // Ignore subscriber errors to avoid breaking other listeners.
        }
      });
    };

    const mqs = ["(pointer: coarse)", "(prefers-reduced-motion: reduce)"]
      .map((q) => window.matchMedia?.(q))
      .filter(Boolean);

    mqs.forEach((mq) => {
      if (typeof mq.addEventListener === "function") mq.addEventListener("change", notifyAll);
      else if (typeof mq.addListener === "function") mq.addListener(notifyAll);
    });

    const conn = window.navigator?.connection;
    if (conn?.addEventListener) conn.addEventListener("change", notifyAll);

    notifyAll();

    sharedCleanup = () => {
      mqs.forEach((mq) => {
        if (typeof mq.removeEventListener === "function") mq.removeEventListener("change", notifyAll);
        else if (typeof mq.removeListener === "function") mq.removeListener(notifyAll);
      });
      if (conn?.removeEventListener) conn.removeEventListener("change", notifyAll);
      sharedCleanup = null;
    };
  }

  if (typeof onChange === "function") {
    subscribers.add(onChange);
    onChange(getWebPerformanceProfile());
  }

  return () => {
    if (typeof onChange === "function") {
      subscribers.delete(onChange);
    }
    if (!subscribers.size && sharedCleanup) {
      sharedCleanup();
    }
  };
}

/** Solid page backdrop for lite light mode (no multi-stop gradients). */
export function getLiteLightPageBackground() {
  return ALCHEMY.cream || "#FAF8F4";
}
