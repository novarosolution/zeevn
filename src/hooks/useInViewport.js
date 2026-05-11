import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

/**
 * Returns `{ ref, inView }` — true once the element enters the viewport.
 * - Web: IntersectionObserver on the target DOM node (via React Native Web ref).
 * - Native: optimistic fallback (returns true after first layout) so motion
 *   tied to viewport doesn't permanently freeze on platforms without IO.
 *   Pass `disabled` to skip activation (e.g. while data is still loading).
 */
export default function useInViewport({
  threshold = 0.2,
  rootMargin = "0px",
  once = true,
  disabled = false,
} = {}) {
  const [inView, setInView] = useState(false);
  const ref = useRef(null);
  const observedRef = useRef(null);

  const setRef = useCallback((node) => {
    ref.current = node;
  }, []);

  useEffect(() => {
    if (disabled) return undefined;

    if (Platform.OS !== "web") {
      const t = setTimeout(() => setInView(true), 60);
      return () => clearTimeout(t);
    }

    if (typeof window === "undefined" || typeof window.IntersectionObserver !== "function") {
      setInView(true);
      return undefined;
    }

    const node = ref.current;
    if (!node) {
      const retry = setTimeout(() => {
        observedRef.current = ref.current;
      }, 0);
      return () => clearTimeout(retry);
    }

    const target =
      typeof Element !== "undefined" && node instanceof Element
        ? node
        : node?._nativeTag
          ? null
          : node;

    if (!target || !(target instanceof Element)) {
      setInView(true);
      return undefined;
    }

    observedRef.current = target;
    const observer = new window.IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) {
              observer.disconnect();
              return;
            }
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once, disabled]);

  return { ref: setRef, inView };
}
