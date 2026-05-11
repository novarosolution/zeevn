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

  useEffect(() => {
    if (Platform.OS === "web" || reducedMotion) return undefined;
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
    return () => cancelAnimation(opacity);
  }, [opacity, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const borderRadius = typeof rounded === "number" ? rounded : ROUNDED_TOKENS[rounded] ?? radius.md;
  const baseColor = isDark ? "rgba(220, 38, 38, 0.08)" : "rgba(63, 63, 70, 0.08)";

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
              ? "linear-gradient(90deg, rgba(220, 38, 38, 0.06) 0%, rgba(220, 38, 38, 0.18) 50%, rgba(220, 38, 38, 0.06) 100%)"
              : "linear-gradient(90deg, rgba(63, 63, 70, 0.06) 0%, rgba(185, 28, 28, 0.16) 50%, rgba(63, 63, 70, 0.06) 100%)",
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

  return <Animated.View style={[baseStyle, animatedStyle]} />;
}

const ROUNDED_TOKENS = {
  none: 0,
  sm: radius.sm,
  md: radius.md,
  lg: radius.lg,
  xl: radius.xl,
  pill: radius.pill,
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
