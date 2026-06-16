import React, { memo, useEffect, useMemo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { radius } from "../../theme/tokens";
import { useTheme } from "../../context/ThemeContext";
import { LOADING_THEME } from "../../theme/loadingTheme";
import useReducedMotion from "../../hooks/useReducedMotion";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";

const SHIMMER_CSS_ID = "kankreg-skeleton-shimmer";
const SHIMMER_CLASS = "kankreg-skeleton-shimmer";

function SkeletonBlockBase({ width = "100%", height = 16, rounded = "md", style }) {
  const { isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const shimmerPos = useSharedValue(0);

  useEffect(() => {
    if (Platform.OS === "web" || reducedMotion) return undefined;
    shimmerPos.value = withRepeat(withTiming(1, { duration: LOADING_THEME.shimmerDurationMs }), -1, false);
    return () => cancelAnimation(shimmerPos);
  }, [reducedMotion, shimmerPos]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (shimmerPos.value * 2 - 1) * 120 }],
  }));

  const borderRadius = typeof rounded === "number" ? rounded : ROUNDED_TOKENS[rounded] ?? radius.md;
  const baseColor = isDark ? LOADING_THEME.skeletonBaseDark : LOADING_THEME.skeletonBaseLight;
  const gradientColors = isDark ? LOADING_THEME.shimmerDark : LOADING_THEME.shimmerLight;
  const borderColor = isDark ? LOADING_THEME.skeletonBorderDark : "rgba(22, 69, 51, 0.06)";

  const shellStyle = useMemo(
    () => [
      {
        width,
        height,
        borderRadius,
        backgroundColor: baseColor,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor,
        overflow: "hidden",
      },
      Platform.OS === "web" && !reducedMotion
        ? {
            backgroundImage: `linear-gradient(90deg, ${gradientColors.join(", ")})`,
            backgroundSize: "200% 100%",
          }
        : null,
      style,
    ],
    [width, height, borderRadius, baseColor, borderColor, gradientColors, reducedMotion, style]
  );

  if (Platform.OS === "web") {
    return (
      <View
        className={!reducedMotion ? SHIMMER_CLASS : undefined}
        style={shellStyle}
      />
    );
  }

  return (
    <View style={shellStyle}>
      {!reducedMotion ? (
        <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.shimmerBand, { width: "200%" }]}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shimmerBand: {
    height: "100%",
  },
});

const ROUNDED_TOKENS = {
  none: 0,
  sm: radius.sm,
  md: radius.md,
  lg: radius.lg,
  xl: radius.xl,
  pill: radius.pill,
  full: 999,
};

injectWebCssOnce(
  SHIMMER_CSS_ID,
  `@keyframes kankregSkeletonShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.${SHIMMER_CLASS} { animation: kankregSkeletonShimmer ${LOADING_THEME.shimmerDurationMs}ms ease-in-out infinite; }`
);

const SkeletonBlock = memo(SkeletonBlockBase);

export default SkeletonBlock;
