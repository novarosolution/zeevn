/**
 * Shared motion tokens for the cinematic customer surface.
 *
 * Pair with `useReducedMotion` in components — when reduced is true,
 * components should render the final state immediately and skip animation.
 *
 * GSAP receives `gsapEase` strings; Reanimated `Easing` callers should map
 * to a comparable easing via the `bezier` field exported here.
 */
import { Easing, FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";

/** Durations in milliseconds. Web/native both consume these. */
export const motionDuration = {
  fast: 160,
  base: 280,
  slow: 460,
  cinematic: 640,
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
  gap: 44,
  /** Initial delay before the first child reveals (ms). */
  initialDelay: 40,
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

/* --------------------------------------------------------------------------------------------------------------------
 * Native interaction language: the rules behind every press, sheet, tab indicator and entrance in the storefront.
 * Distilled from Emil Kowalski's design-engineering skills (installed in `.claude/skills/`: `emil-design-eng`, `animate-expo`).
 *
 *  - Strong custom curves only. The built-ins (`Easing.ease`, `Easing.out(Easing.cubic)`) are too weak, and ease-in never
 *    belongs on UI: it delays the exact moment the shopper is watching.
 *  - Entering or exiting → ease-out. Something already on screen that moves → ease-in-out. A finger involved → a spring.
 *  - UI motion stays under ~300 ms (sheets may take a little longer) and every exit is quicker than its entrance.
 *  - Frequent actions (tab switches, row taps) get no decoration; rare moments (a placed order) may have delight.
 *  - Reduced motion means fewer and gentler: keep opacity, drop travel, scale and overshoot.
 * ------------------------------------------------------------------------------------------------------------------ */

/** Strong ease-out for anything entering, exiting or answering a touch. */
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
/** Strong ease-in-out for something already on screen that moves or morphs (a tab indicator gliding). */
export const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);
/** The iOS sheet / drawer curve. */
export const EASE_SHEET = Easing.bezier(0.32, 0.72, 0, 1);

/** Press feedback scale: subtle enough for something touched this often (0.95–0.98). */
export const PRESS_SCALE = 0.97;

/** Native durations (ms). */
export const motionTiming = {
  /** Finger down: the answer has to feel instant. */
  press: 110,
  /** Finger up: the system responds, a touch slower than the press. */
  release: 170,
  /** Chips, switches, indicators. */
  toggle: 180,
  /** Content the shopper asked for. */
  enter: 260,
  /** Always quicker than the way in. */
  exit: 200,
  sheetIn: 340,
  sheetOut: 240,
};

/**
 * Reanimated duration springs (Apple's two-knob form). Critically damped by default; bounce only when a gesture
 * carried momentum (a flick) or for a short, rare delight.
 */
export const motionSettle = {
  settle: { duration: 400, dampingRatio: 1 },
  snapBack: { duration: 400, dampingRatio: 0.8 },
  sheet: { duration: 300, dampingRatio: 0.8 },
  /** A small confirming bump (an item landing in the bag). */
  bump: { duration: 320, dampingRatio: 0.7 },
};

/**
 * Entrance for content the shopper asked for and is waiting on: a short rise from below plus a fade, strong ease-out and
 * a 40 ms stagger (capped, so long lists never drag). Build it once per index (`useMemo`): layout-animation builders
 * rebuilt during render cost every re-render.
 */
export function riseIn(index = 0, { step = 40, max = 8, distance = 10 } = {}) {
  return FadeInDown.delay(Math.min(Math.max(index, 0), max) * step)
    .duration(motionTiming.enter)
    .easing(EASE_OUT)
    .withInitialValues({ opacity: 0, transform: [{ translateY: distance }] });
}

/** A small panel, banner or expanded detail appearing: a shorter rise than a screen entrance. Shared at module scope. */
export const panelIn = FadeInDown.duration(motionTiming.exit)
  .easing(EASE_OUT)
  .withInitialValues({ opacity: 0, transform: [{ translateY: 8 }] });
/** Its exit is a quick fade, quicker than the way in. */
export const panelOut = FadeOut.duration(motionTiming.press + 20);
/** A control swapping state in place (ADD → stepper): an opacity crossfade with no travel. */
export const stateIn = FadeIn.duration(motionTiming.press + 30).easing(EASE_OUT);
/** Loaded content replacing its skeleton: a short fade, so the swap is bridged instead of teleporting. */
export const contentIn = FadeIn.duration(motionTiming.exit).easing(EASE_OUT);

/** Momentum projection: where a flick would come to rest (Apple's exponential-decay form). Worklet-safe. */
export function projectVelocity(velocity, decelerationRate = 0.998) {
  "worklet";
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** Rubber-banding: the further past an edge, the less the element follows. Worklet-safe. */
export function rubberband(overshoot, dimension, constant = 0.55) {
  "worklet";
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}
