import React, { memo, useEffect, useMemo } from "react";
import { Platform, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import useReducedMotion from "../../hooks/useReducedMotion";

/**
 * Neutral skeleton sweep — semantic surfaceAlt, optional 1400ms shimmer (respects reduced motion).
 */
function SkeletonBase({ width = "100%", height = 16, radius: radiusProp, shimmer = true, style }) {
  const { semanticPalette, RADII } = useTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(0.62);
  const shimmerX = useSharedValue(-180);

  const r = radiusProp ?? RADII.md;

  useEffect(() => {
    if (Platform.OS === "web" || reducedMotion || !shimmer) return undefined;
    opacity.value = withRepeat(withTiming(1, { duration: 880 }), -1, true);
    shimmerX.value = withRepeat(withTiming(360, { duration: 1400 }), -1, false);
    return () => {
      cancelAnimation(opacity);
      cancelAnimation(shimmerX);
    };
  }, [opacity, reducedMotion, shimmer, shimmerX]);

  const animatedOpacityStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
    opacity: reducedMotion || !shimmer ? 0 : 0.4,
  }));

  const baseStyle = useMemo(
    () => [
      {
        width,
        height,
        borderRadius: r,
        backgroundColor: semanticPalette.surfaceAlt,
        overflow: "hidden",
      },
      Platform.OS === "web" && !reducedMotion && shimmer
        ? {
            animationName: "zeevanSkeletonShimmer",
            animationDuration: "1400ms",
            animationIterationCount: "infinite",
            animationTimingFunction: "ease-in-out",
            backgroundImage:
              semanticPalette.mode === "dark"
                ? "linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.02) 100%)"
                : "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.65) 50%, rgba(255,255,255,0) 100%)",
            backgroundSize: "200% 100%",
          }
        : null,
      style,
    ],
    [width, height, r, semanticPalette.mode, semanticPalette.surfaceAlt, reducedMotion, shimmer, style]
  );

  if (Platform.OS === "web") {
    return <View style={baseStyle} />;
  }

  return (
    <Animated.View style={[baseStyle, !reducedMotion && shimmer ? animatedOpacityStyle : null]}>
      {!reducedMotion && shimmer ? (
        <Animated.View style={[nativeSweep, sweepStyle]}>
          <View
            style={{
              flex: 1,
              backgroundColor: semanticPalette.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.65)",
            }}
          />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const nativeSweep = {
  position: "absolute",
  top: 0,
  bottom: 0,
  width: "48%",
};

if (Platform.OS === "web" && typeof document !== "undefined" && typeof document.head !== "undefined") {
  if (!document.getElementById("zeevan-skeleton-shimmer")) {
    const el = document.createElement("style");
    el.id = "zeevan-skeleton-shimmer";
    el.innerHTML =
      "@keyframes zeevanSkeletonShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }";
    document.head.appendChild(el);
  }
}

const Skeleton = memo(SkeletonBase);

export default Skeleton;
