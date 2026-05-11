import { useEffect, useRef, useState } from "react";

/** easeOutCubic — calm finish, no overshoot. */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Tween a numeric value from 0 -> target while `active` is true.
 * Pauses (returns target immediately) when reduced-motion is requested.
 *
 *   const value = useCountUp({ target: 12450, active: inView, duration: 1400 });
 */
export default function useCountUp({
  target = 0,
  duration = 1200,
  active = true,
  reducedMotion = false,
  precision = 0,
} = {}) {
  const [value, setValue] = useState(reducedMotion ? target : 0);
  const rafRef = useRef(null);
  const startRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return undefined;
    }
    if (reducedMotion || duration <= 0) {
      setValue(target);
      return undefined;
    }

    const supportsRaf =
      typeof globalThis !== "undefined" && typeof globalThis.requestAnimationFrame === "function";
    const supportsCancel =
      typeof globalThis !== "undefined" && typeof globalThis.cancelAnimationFrame === "function";

    startRef.current = 0;

    const tick = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);
      const next = target * eased;
      const factor = Math.pow(10, precision);
      setValue(Math.round(next * factor) / factor);
      if (progress < 1 && supportsRaf) {
        rafRef.current = globalThis.requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };

    if (supportsRaf) {
      rafRef.current = globalThis.requestAnimationFrame(tick);
    } else {
      setValue(target);
    }

    return () => {
      if (rafRef.current && supportsCancel) {
        globalThis.cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = null;
    };
  }, [target, duration, active, reducedMotion, precision]);

  return value;
}
