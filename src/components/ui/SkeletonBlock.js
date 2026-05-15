import React, { memo, useEffect, useMemo } from "react";
import { Platform, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { radius } from "../../theme/tokens";
import { useTheme } from "../../context/ThemeContext";
import useReducedMotion from "../../hooks/useReducedMotion";

/**
 * Theme-aware shimmering skeleton block used to fill space while a screen is
 * loading. On native it animates opacity via Reanimated; on web it uses a CSS
 * keyframe so RAFs don't block the main thread.
 */
function SkeletonBlockBase({
  width = "100%",
  height = 16,
  rounded = "md",
  style,
}) {
  const { isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(0.6);
  const shimmerX = useSharedValue(-140);

  useEffect(() => {
    if (Platform.OS === "web" || reducedMotion) return undefined;
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
    shimmerX.value = -140;
    shimmerX.value = withRepeat(withTiming(280, { duration: 1400 }), -1, false);
    return () => {
      cancelAnimation(opacity);
      cancelAnimation(shimmerX);
    };
  }, [opacity, reducedMotion, shimmerX]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
    opacity: reducedMotion ? 0 : 1,
  }));

  const borderRadius = typeof rounded === "number" ? rounded : ROUNDED_TOKENS[rounded] ?? radius.md;
  const baseColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";

  const baseStyle = useMemo(
    () => [
      {
        width,
        height,
        borderRadius,
        backgroundColor: baseColor,
        overflow: "hidden",
      },
      Platform.OS === "web" && !reducedMotion
        ? {
            animationName: "zeevanSkeletonShimmer",
            animationDuration: "1400ms",
            animationIterationCount: "infinite",
            animationTimingFunction: "ease-in-out",
            backgroundImage: isDark
              ? "linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 100%)"
              : "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 100%)",
            backgroundSize: "200% 100%",
          }
        : null,
      style,
    ],
    [width, height, borderRadius, baseColor, isDark, reducedMotion, style]
  );

  if (Platform.OS === "web") {
    return <View style={baseStyle} />;
  }

  return (
    <Animated.View style={[baseStyle, animatedStyle]}>
      {!reducedMotion ? (
        <Animated.View style={[styles.nativeShimmerSweep, shimmerStyle]}>
          <View
            style={[
              styles.nativeShimmerFill,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)",
              },
            ]}
          />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const ROUNDED_TOKENS = {
  none: 0,
  sm: radius.sm,
  md: radius.md,
  lg: radius.lg,
  xl: radius.xl,
  pill: radius.pill,
};

const styles = {
  nativeShimmerSweep: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "46%",
  },
  nativeShimmerFill: {
    flex: 1,
  },
};

if (Platform.OS === "web" && typeof document !== "undefined" && typeof document.head !== "undefined") {
  if (!document.getElementById("zeevan-skeleton-shimmer")) {
    const style = document.createElement("style");
    style.id = "zeevan-skeleton-shimmer";
    style.innerHTML = `@keyframes zeevanSkeletonShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`;
    document.head.appendChild(style);
  }
}

const SkeletonBlock = memo(SkeletonBlockBase);

export default SkeletonBlock;
