import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { Platform } from "react-native";
import { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";

/**
 * Shared scroll-offset context. The provider lives inside `MotionScrollView`
 * so descendants like `HeroParallax`, `CustomerScreenShell` orbs, and
 * `WebAppHeader` can react to a single source of truth without duplicate
 * listeners and React re-renders.
 *
 * Value shape: `{ scrollY: SharedValue<number>, source: "internal" | "window" }`
 *
 * Consumers MUST read via `useAnimatedStyle` / `useDerivedValue` to avoid React
 * rerenders. Imperative consumers can use `scrollY.value` (read-only).
 */
const ScrollOffsetContext = createContext(null);

export function ScrollOffsetProvider({ value, children }) {
  return <ScrollOffsetContext.Provider value={value}>{children}</ScrollOffsetContext.Provider>;
}

/**
 * Returns the current scrollY shared value. Falls back to a zero-locked
 * shared value when no provider is mounted (so consumers always have a
 * usable handle without conditional logic).
 */
export function useScrollOffsetValue() {
  const ctx = useContext(ScrollOffsetContext);
  const fallback = useSharedValue(0);
  return ctx?.scrollY || fallback;
}

/**
 * Drives a `scrollY` shared value:
 *  - Native: caller passes `scrollHandler` to a Reanimated.ScrollView.
 *  - Web: subscribes to window scroll once (RAF-throttled).
 *
 *   const { scrollY, scrollHandler } = useScrollOffset({ trackWindow: false });
 */
export default function useScrollOffset({ trackWindow = false } = {}) {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  useEffect(() => {
    if (Platform.OS !== "web" || !trackWindow) return undefined;
    if (typeof globalThis === "undefined" || typeof globalThis.window === "undefined") {
      return undefined;
    }
    const win = globalThis.window;
    const doc = globalThis.document;
    let frame = null;
    const tick = () => {
      const y = win.pageYOffset || doc?.documentElement?.scrollTop || 0;
      scrollY.value = y;
      frame = null;
    };
    const onScroll = () => {
      if (frame == null) {
        frame = win.requestAnimationFrame(tick);
      }
    };
    onScroll();
    win.addEventListener("scroll", onScroll, { passive: true });
    win.addEventListener("resize", onScroll);
    return () => {
      win.removeEventListener("scroll", onScroll);
      win.removeEventListener("resize", onScroll);
      if (frame != null) {
        win.cancelAnimationFrame(frame);
      }
    };
  }, [scrollY, trackWindow]);

  return { scrollY, scrollHandler };
}

/**
 * Convenience: a stable provider value that updates only when the underlying
 * shared value identity changes (which is never after first render).
 */
export function useScrollOffsetContextValue(scrollY, source = "internal") {
  return useMemo(() => ({ scrollY, source }), [scrollY, source]);
}

/** Imperative ref-like getter for non-Reanimated consumers (web only). */
export function useScrollOffsetRef() {
  const value = useScrollOffsetValue();
  const ref = useRef(0);
  const get = useCallback(() => {
    try {
      ref.current = value.value;
    } catch {
      // SharedValue may not be readable on web in some edge paths
    }
    return ref.current;
  }, [value]);
  return get;
}

export { ScrollOffsetContext };
