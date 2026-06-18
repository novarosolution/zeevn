import { InteractionManager, Platform } from "react-native";

/**
 * Run work after the first frame / idle — keeps startup path fast.
 * @param {() => void} fn
 * @param {{ timeoutMs?: number }} [options]
 * @returns {() => void} cancel
 */
export function deferAfterFirstPaint(fn, { timeoutMs = 2500 } = {}) {
  let cancelled = false;
  const run = () => {
    if (!cancelled) fn();
  };

  if (Platform.OS === "web" && typeof requestIdleCallback === "function") {
    const idleId = requestIdleCallback(run, { timeout: timeoutMs });
    return () => {
      cancelled = true;
      if (typeof cancelIdleCallback === "function") cancelIdleCallback(idleId);
    };
  }

  const handle = InteractionManager.runAfterInteractions(run);
  const fallbackId = setTimeout(run, Math.min(timeoutMs, 1200));

  return () => {
    cancelled = true;
    handle?.cancel?.();
    clearTimeout(fallbackId);
  };
}
