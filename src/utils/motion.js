import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";

/** RN Animated `useNativeDriver` is unsupported on web — avoids console noise + fallback jank. */
export const nativeDriverEnabled = Platform.OS !== "web";

/**
 * Returns true when the user requests reduced motion.
 * - Native: AccessibilityInfo reduce-motion flag + change event
 * - Web: prefers-reduced-motion media query
 */
export function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (Platform.OS === "web") {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return undefined;
      }
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      const apply = () => {
        if (!cancelled) setReducedMotion(Boolean(query.matches));
      };

      apply();

      if (typeof query.addEventListener === "function") {
        query.addEventListener("change", apply);
        return () => {
          cancelled = true;
          query.removeEventListener("change", apply);
        };
      }

      if (typeof query.addListener === "function") {
        query.addListener(apply);
        return () => {
          cancelled = true;
          query.removeListener(apply);
        };
      }

      return () => {
        cancelled = true;
      };
    }

    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((enabled) => {
        if (!cancelled) setReducedMotion(Boolean(enabled));
      })
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener?.("reduceMotionChanged", (enabled) => {
      if (!cancelled) setReducedMotion(Boolean(enabled));
    });

    return () => {
      cancelled = true;
      if (sub && typeof sub.remove === "function") sub.remove();
    };
  }, []);

  return reducedMotion;
}

export default usePrefersReducedMotion;
