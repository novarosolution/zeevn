/**
 * Storefront loading building blocks — one shared shimmer timeline (`ShimmerProvider`), the `Bone` placeholder and
 * the product-tile skeleton. Warm cream in light mode, a faint gold glint in dark mode; holds still with Reduce Motion.
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useStoreTheme } from "../../theme/storefront";

const ShimmerContext = createContext(null);
const SHIMMER_MS = 1600;

/** Runs one 0 → 1 loop that every `Bone` underneath follows, so the whole screen glints in step. */
export function ShimmerProvider({ children }) {
  const t = useSharedValue(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return undefined;
    t.value = 0;
    t.value = withRepeat(withTiming(1, { duration: SHIMMER_MS, easing: Easing.inOut(Easing.quad) }), -1, false);
    return () => cancelAnimation(t);
  }, [reduced, t]);
  return <ShimmerContext.Provider value={t}>{children}</ShimmerContext.Provider>;
}

/** A placeholder block with the shared glint sweeping across it. */
export function Bone({ width = "100%", height = 14, radius = 8, style, children }) {
  const { isDark } = useStoreTheme();
  const t = useContext(ShimmerContext);
  const idle = useSharedValue(0);
  const clock = t || idle;
  const [w, setW] = useState(0);
  const base = isDark ? "rgba(255, 255, 255, 0.07)" : "#ECE4D0";
  const glint = isDark ? "rgba(232, 188, 132, 0.2)" : "rgba(255, 255, 255, 0.8)";
  const glintStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(clock.value, [0, 1], [-w * 1.1, w * 1.1]) }],
  }));
  return (
    <View
      onLayout={(e) => {
        const next = Math.round(e.nativeEvent.layout.width);
        if (next !== w) setW(next);
      }}
      style={[{ width, height, borderRadius: radius, backgroundColor: base, overflow: "hidden" }, style]}
    >
      {t && w ? (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, glintStyle]}>
          <LinearGradient
            colors={["rgba(255,255,255,0)", glint, "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ width: w * 0.7, height: "100%" }}
          />
        </Animated.View>
      ) : null}
      {children}
    </View>
  );
}

/** Same footprint as `ProductCard`, so the grid does not jump when the real tiles arrive. */
export function ProductCardSkeleton({ width = 168, style }) {
  const { c, r, shadow } = useStoreTheme();
  const image = Math.max(64, width - 16);
  return (
    <View style={[styles.card, shadow.soft, { width, backgroundColor: c.card, borderColor: c.line, borderRadius: r.xl }, style]}>
      <Bone width={image} height={image} radius={18} />
      <View style={styles.info}>
        <Bone width="92%" height={12} radius={6} />
        <Bone width="58%" height={12} radius={6} />
        <Bone width="34%" height={10} radius={5} style={styles.gapSm} />
        <View style={styles.buyRow}>
          <Bone width={58} height={18} radius={7} />
          <Bone width={width < 160 ? 68 : 78} height={width < 160 ? 33 : 36} radius={18} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, paddingTop: 8, paddingHorizontal: 8, paddingBottom: 12 },
  info: { paddingHorizontal: 4, paddingTop: 12, gap: 7 },
  gapSm: { marginTop: 3 },
  buyRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 8 },
});
