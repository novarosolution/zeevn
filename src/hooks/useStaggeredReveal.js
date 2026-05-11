import { useMemo } from "react";
import { motionStagger, staggerDelay } from "../theme/motion";
import useReducedMotion from "./useReducedMotion";

/**
 * Returns a stable array of per-item delays (ms) for staggered reveals.
 * When reduced-motion is on, all delays collapse to `0` so consumers can
 * render the final state immediately.
 *
 *   const delays = useStaggeredReveal(items.length);
 *   items.map((it, i) => <SectionReveal key={it.id} delay={delays[i]}>...)
 */
export default function useStaggeredReveal(
  count,
  { gap = motionStagger.gap, initialDelay = motionStagger.initialDelay, disabled = false } = {}
) {
  const reducedMotion = useReducedMotion();
  return useMemo(() => {
    const safeCount = Math.max(0, count | 0);
    const arr = new Array(safeCount);
    if (reducedMotion || disabled) {
      for (let i = 0; i < safeCount; i += 1) arr[i] = 0;
      return arr;
    }
    for (let i = 0; i < safeCount; i += 1) {
      arr[i] = staggerDelay(i, { gap, initialDelay });
    }
    return arr;
  }, [count, reducedMotion, disabled, gap, initialDelay]);
}
