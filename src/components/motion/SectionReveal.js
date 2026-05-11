import React, { useCallback, useMemo } from "react";
import { Platform, View } from "react-native";
import Animated, { FadeInDown, FadeIn, FadeInRight, ZoomIn } from "react-native-reanimated";
import useGsapReveal from "../../hooks/useGsapReveal";
import useReducedMotion from "../../hooks/useReducedMotion";
import { motionDuration, staggerDelay } from "../../theme/motion";

/**
 * Single reveal primitive with platform parity:
 *  - Web: GSAP ScrollTrigger via `useGsapReveal` (preset-driven).
 *  - Native: Reanimated entering animation (`FadeInDown` / `FadeIn`).
 *  - Reduced motion: render final state immediately, no animation.
 *
 *   <SectionReveal index={0} preset="fade-up">...</SectionReveal>
 *   <SectionReveal delay={140} preset="fade-in">...</SectionReveal>
 *
 * Props:
 *  - `index`: stagger index; computed delay = `staggerDelay(index)`. Ignored
 *    if `delay` is passed.
 *  - `delay`: explicit delay in ms.
 *  - `preset`: "fade-up" | "fade-in" | "scale-in" | "slide-right".
 *  - `start`: GSAP start position string (web only).
 *  - `as`: container component (default `Animated.View` on native, `View` on web).
 *  - `style`, `children`: standard.
 */
const NATIVE_FADE_DISTANCE = 18;

export default function SectionReveal({
  children,
  index,
  delay,
  preset = "fade-up",
  start = "top 88%",
  duration = motionDuration.slow,
  style,
  pointerEvents,
  as,
}) {
  const pointerStyle = pointerEvents ? { pointerEvents } : null;

  const reducedMotion = useReducedMotion();
  const computedDelay = useMemo(() => {
    if (typeof delay === "number") return Math.max(0, delay);
    if (typeof index === "number") return staggerDelay(index);
    return 0;
  }, [delay, index]);

  const { ref: gsapRef } = useGsapReveal({
    preset,
    start,
    delay: computedDelay / 1000,
    reducedMotion,
  });

  const setRef = useCallback(
    (node) => {
      if (Platform.OS === "web") {
        gsapRef(node);
      }
    },
    [gsapRef],
  );

  if (Platform.OS === "web") {
    const Container = as || View;
    return (
      <Container ref={setRef} style={[style, pointerStyle, { opacity: 1 }]}>
        {children}
      </Container>
    );
  }

  if (reducedMotion) {
    const Container = as || View;
    return (
      <Container style={[style, pointerStyle]}>
        {children}
      </Container>
    );
  }

  const entering = (() => {
    if (preset === "fade-in") return FadeIn.delay(computedDelay).duration(duration);
    if (preset === "slide-right") return FadeInRight.springify().delay(computedDelay).damping(18).mass(0.85);
    if (preset === "scale-in") return ZoomIn.springify().delay(computedDelay).damping(18).mass(0.85);
    return FadeInDown.springify().delay(computedDelay).damping(18).mass(0.85);
  })();

  const Container = as || Animated.View;
  return (
    <Container entering={entering} style={[style, pointerStyle]}>
      {children}
    </Container>
  );
}

/**
 * Convenience wrapper that returns its child as a regular View when reduced
 * motion is on. Useful when you want to retain measurements but skip the
 * entering animation.
 */
SectionReveal.NATIVE_FADE_DISTANCE = NATIVE_FADE_DISTANCE;
