import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { interpolate, useAnimatedStyle, Extrapolation } from "react-native-reanimated";
import { motionParallax } from "../../theme/motion";
import useReducedMotion from "../../hooks/useReducedMotion";
import { useScrollOffsetValue } from "../../hooks/useScrollOffset";

/**
 * Wraps a hero block and applies parallax driven by the shared scrollY value
 * from the nearest `MotionScrollView`. Reads via Reanimated `useAnimatedStyle`
 * so React never re-renders during scroll.
 *
 *   <HeroParallax strength="medium" maxScroll={400}>
 *     <Image .../>
 *   </HeroParallax>
 *
 * Props:
 *  - `strength`: "subtle" | "medium" | "strong" — token from `motionParallax`.
 *  - `maxScroll`: scroll distance over which the effect maxes out (px).
 *  - `dimColor`: overlay applied as opacity fades in (default subtle dark).
 *  - `scale`: enable/disable the gentle scale-up (default `true`).
 *  - `dim`: enable/disable the overlay dim (default `true`).
 *  - `style`: optional outer style.
 */
export default function HeroParallax({
  children,
  strength = "medium",
  maxScroll = 400,
  dimColor = "rgba(8, 6, 4, 0.55)",
  scale = true,
  dim = true,
  style,
  contentStyle,
}) {
  const reducedMotion = useReducedMotion();
  const scrollY = useScrollOffsetValue();
  const preset = motionParallax[strength] || motionParallax.medium;

  const motionStyle = useAnimatedStyle(() => {
    if (reducedMotion) {
      return { transform: [{ translateY: 0 }, { scale: 1 }] };
    }
    const y = scrollY.value || 0;
    const ty = interpolate(
      y,
      [0, maxScroll],
      [0, -maxScroll * preset.translatePerPx],
      Extrapolation.CLAMP,
    );
    const sc = scale
      ? 1 + interpolate(y, [0, maxScroll], [0, maxScroll * preset.scalePerPx], Extrapolation.CLAMP)
      : 1;
    return {
      transform: [{ translateY: ty }, { scale: sc }],
    };
  }, [reducedMotion, maxScroll, preset.translatePerPx, preset.scalePerPx, scale]);

  const dimStyle = useAnimatedStyle(() => {
    if (reducedMotion || !dim) return { opacity: 0 };
    const y = scrollY.value || 0;
    const op = interpolate(
      y,
      [0, maxScroll],
      [0, Math.min(0.85, maxScroll * preset.dimPerPx)],
      Extrapolation.CLAMP,
    );
    return { opacity: op };
  }, [reducedMotion, dim, maxScroll, preset.dimPerPx]);

  const dimBackground = useMemo(() => ({ backgroundColor: dimColor }), [dimColor]);

  return (
    <View style={[styles.root, style, styles.peBoxNone]}>
      <Animated.View style={[styles.inner, motionStyle, contentStyle, styles.peBoxNone]}>
        {children}
      </Animated.View>
      {dim ? (
        <Animated.View
          style={[StyleSheet.absoluteFill, dimBackground, dimStyle, styles.peNone]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
    overflow: "hidden",
  },
  inner: {
    width: "100%",
  },
  peNone: {
    pointerEvents: "none",
  },
  peBoxNone: {
    pointerEvents: "box-none",
  },
});
