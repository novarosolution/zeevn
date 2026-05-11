import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";

/**
 * Returns true when the user has requested reduced motion at the OS level.
 * - Web: `(prefers-reduced-motion: reduce)` media query.
 * - Native: `AccessibilityInfo.isReduceMotionEnabled()` plus listener.
 */
export default function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (Platform.OS === "web") {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return undefined;
      }
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      const apply = () => {
        if (!cancelled) setReduced(Boolean(mq.matches));
      };
      apply();
      if (typeof mq.addEventListener === "function") {
        mq.addEventListener("change", apply);
        return () => {
          cancelled = true;
          mq.removeEventListener("change", apply);
        };
      }
      if (typeof mq.addListener === "function") {
        mq.addListener(apply);
        return () => {
          cancelled = true;
          mq.removeListener(apply);
        };
      }
      return () => {
        cancelled = true;
      };
    }

    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((value) => {
        if (!cancelled) setReduced(Boolean(value));
      })
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener?.("reduceMotionChanged", (value) => {
      if (!cancelled) setReduced(Boolean(value));
    });

    return () => {
      cancelled = true;
      if (sub && typeof sub.remove === "function") {
        sub.remove();
      }
    };
  }, []);

  return reduced;
}
