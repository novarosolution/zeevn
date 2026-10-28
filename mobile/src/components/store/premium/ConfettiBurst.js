import React, { memo, useEffect, useMemo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { useStoreTheme } from "../../../theme/storefront";

const PIECES = 26;

/** Deterministic pseudo-random in [0,1) so a burst looks the same on every device and re-render. */
const rand = (seed) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

function Piece({ index, origin, width, height, colors, duration }) {
  const t = useSharedValue(0);
  const reduced = useReducedMotion();

  const spec = useMemo(() => {
    const angle = (-Math.PI / 2) + (rand(index + 1) - 0.5) * Math.PI * 1.15;
    const speed = 0.35 + rand(index + 50) * 0.65;
    return {
      dx: Math.cos(angle) * width * 0.55 * speed,
      rise: Math.abs(Math.sin(angle)) * height * 0.32 * speed + 40,
      fall: height * (0.35 + rand(index + 90) * 0.35),
      spin: (rand(index + 130) - 0.5) * 900,
      size: 6 + rand(index + 7) * 7,
      round: rand(index + 21) > 0.62,
      color: colors[index % colors.length],
      delay: Math.floor(rand(index + 300) * 140),
    };
  }, [index, width, height, colors]);

  useEffect(() => {
    if (reduced) return undefined;
    t.value = withDelay(spec.delay, withTiming(1, { duration, easing: Easing.out(Easing.quad) }));
    return () => cancelAnimation(t);
  }, [reduced, spec.delay, duration, t]);

  const style = useAnimatedStyle(() => {
    const p = t.value;
    // Up fast, then gravity pulls it down: a parabola in y, a gentle drift in x.
    const y = -spec.rise * (1 - Math.pow(1 - p, 2)) + spec.fall * p * p;
    return {
      opacity: p === 0 ? 0 : p > 0.82 ? (1 - p) / 0.18 : 1,
      transform: [{ translateX: spec.dx * p }, { translateY: y }, { rotate: `${spec.spin * p}deg` }],
    };
  });

  if (reduced) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.piece,
        { left: origin.x, top: origin.y, width: spec.size, height: spec.round ? spec.size : spec.size * 0.55, borderRadius: spec.round ? spec.size / 2 : 2, backgroundColor: spec.color },
        style,
      ]}
    />
  );
}

/**
 * One-shot celebration for a placed order: gold, olive and ivory confetti fired from `origin` (defaults to the upper
 * middle of the screen). Purely decorative — it ignores touches, is skipped entirely with Reduce Motion, and unmounts its
 * pieces once the burst has finished.
 *
 * props: origin ({x,y} in the overlay), duration (ms), active
 */
function ConfettiBurstBase({ origin, duration = 1700, active = true }) {
  const { c } = useStoreTheme();
  const { width, height } = useWindowDimensions();
  const colors = useMemo(() => [c.gold, c.goldBright, c.brandBright, c.brand, "#FFFFFF", c.saffron], [c]);
  const start = origin || { x: width / 2, y: height * 0.32 };
  if (!active) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: PIECES }).map((_, i) => (
        <Piece key={i} index={i} origin={start} width={width} height={height} colors={colors} duration={duration} />
      ))}
    </View>
  );
}

export default memo(ConfettiBurstBase);

const styles = StyleSheet.create({
  piece: { position: "absolute" },
});
