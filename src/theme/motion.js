/**
 * Shared motion tokens for the cinematic customer surface.
 *
 * Pair with `useReducedMotion` in components — when reduced is true,
 * components should render the final state immediately and skip animation.
 *
 * GSAP receives `gsapEase` strings; Reanimated `Easing` callers should map
 * to a comparable easing via the `bezier` field exported here.
 */
import { Easing } from "react-native-reanimated";

/** Durations in milliseconds. Web/native both consume these. */
export const motionDuration = {
  fast: 180,
  base: 320,
  slow: 520,
  cinematic: 720,
};

/**
 * Easing presets.
 * - `bezier` is a 4-tuple usable by Reanimated `Easing.bezier(...)`.
 * - `gsap` is the matching GSAP token.
 */
export const motionEasing = {
  outQuint: {
    bezier: [0.22, 1, 0.36, 1],
    gsap: "expo.out",
    reanimated: Easing.bezier(0.22, 1, 0.36, 1),
  },
  outExpo: {
    bezier: [0.16, 1, 0.3, 1],
    gsap: "expo.out",
    reanimated: Easing.bezier(0.16, 1, 0.3, 1),
  },
  inOutCubic: {
    bezier: [0.65, 0, 0.35, 1],
    gsap: "power2.inOut",
    reanimated: Easing.bezier(0.65, 0, 0.35, 1),
  },
  outBack: {
    bezier: [0.34, 1.56, 0.64, 1],
    gsap: "back.out(1.6)",
    reanimated: Easing.bezier(0.34, 1.56, 0.64, 1),
  },
};

/** Reanimated `withSpring` configs. */
export const motionSpring = {
  /** Soft, calm landing — used for hover lifts and label moves. */
  gentle: { damping: 22, stiffness: 220, mass: 0.9 },
  /** Premium press feedback — slightly bouncier. */
  lift: { damping: 18, stiffness: 280, mass: 0.85 },
  /** Snappy chip / checkbox toggles. */
  snap: { damping: 14, stiffness: 320, mass: 0.7 },
};

/** Stagger choreography. */
export const motionStagger = {
  /** Gap between consecutive child reveals (ms). */
  gap: 52,
  /** Initial delay before the first child reveals (ms). */
  initialDelay: 48,
  /** Hard cap so 30-item lists don't take 2s to finish. */
  maxIndex: 10,
};

/**
 * Parallax strength presets — used by `HeroParallax`.
 * Each pair is `{ translatePerPx, scalePerPx, dimPerPx }`.
 *
 * For 400px of scroll the hero should translate `translatePerPx * 400` px
 * upward, scale to `1 - scalePerPx * 400` and dim its overlay by `dimPerPx * 400`.
 */
export const motionParallax = {
  subtle: { translatePerPx: 0.18, scalePerPx: 0.0001, dimPerPx: 0.0006 },
  medium: { translatePerPx: 0.32, scalePerPx: 0.00018, dimPerPx: 0.0011 },
  strong: { translatePerPx: 0.5, scalePerPx: 0.00028, dimPerPx: 0.0016 },
};

/** Distance presets (translate) for reveal motion. */
export const motionDistance = {
  xs: 8,
  sm: 14,
  md: 24,
  lg: 36,
};

/** Delay/duration helper for reveal sequences. */
export function staggerDelay(index, { gap = motionStagger.gap, initialDelay = motionStagger.initialDelay } = {}) {
  const safeIndex = Math.max(0, Math.min(index, motionStagger.maxIndex));
  return initialDelay + safeIndex * gap;
}

/** Web-only CSS easing string for `transition` properties. */
export function cssEase(preset = "outQuint") {
  const e = motionEasing[preset]?.bezier;
  if (!e) return "ease";
  return `cubic-bezier(${e[0]}, ${e[1]}, ${e[2]}, ${e[3]})`;
}
