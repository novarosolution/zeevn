/**
 * Home motion helpers — kept deliberately light so Home scroll stays smooth.
 * Reveal/Stagger/DepthSlide are pass-through wrappers (no scroll-driven work).
 */
import React, { createContext, useContext, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { interpolateColor, useAnimatedStyle } from "react-native-reanimated";
import { useStoreTheme } from "../../theme/storefront";

const ScrollContext = createContext(null);

export function HomeScrollProvider({ scrollY, viewportH, originY, children }) {
  const value = useMemo(() => ({ scrollY, viewportH, originY }), [scrollY, viewportH, originY]);
  return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>;
}

export function useHomeScroll() {
  return useContext(ScrollContext);
}

/** Pass-through — previously ran per-section scroll reactions that hitch Home. */
export function Reveal({ children, style }) {
  return <View style={style}>{children}</View>;
}

/** Pass-through — tiles render immediately. */
export function Stagger({ style, children }) {
  return <View style={style}>{children}</View>;
}

export function useCountUp(value) {
  /** Instant — counting animation was re-rendering Home header every frame. */
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

/** Pass-through — no per-frame scale/opacity on carousel scroll. */
export function DepthSlide({ children, style }) {
  return <View style={style}>{children}</View>;
}

function PagerDot({ index, scrollX, step }) {
  const { c } = useStoreTheme();
  const animatedStyle = useAnimatedStyle(() => {
    const n = 1 - Math.min(Math.abs(scrollX.value / step - index), 1);
    return {
      width: 6 + 16 * n,
      backgroundColor: interpolateColor(n, [0, 1], [c.lineStrong, c.brand]),
    };
  });
  return <Animated.View style={[styles.pagerDot, animatedStyle]} />;
}

export function PagerDots({ count, scrollX, step, style }) {
  if (count < 2) return null;
  return (
    <View style={[styles.pager, style]}>
      {Array.from({ length: count }, (_, i) => (
        <PagerDot key={i} index={i} scrollX={scrollX} step={step} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pager: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 5 },
  pagerDot: { height: 6, borderRadius: 3 },
});
