import React, { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { getLoadingPalette, LOADING_THEME } from "../../theme/loadingTheme";
import useReducedMotion from "../../hooks/useReducedMotion";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";

const PROGRESS_CSS_ID = "kankreg-progress-slide";
const PROGRESS_CLASS = "kankreg-progress-fill";

/** Sliding gold bar — indeterminate progress (HTML loader kit). */
export default function IndeterminateProgressBar({
  height = 4,
  trackColor,
  fillColor,
  style,
  light = false,
}) {
  const reducedMotion = useReducedMotion();
  const { colors: c, isDark } = useTheme();
  const palette = getLoadingPalette(isDark, c);
  const progress = useSharedValue(0);
  const track = trackColor || (light ? "rgba(255,255,255,0.18)" : palette.track);
  const fill =
    fillColor ||
    (light ? "#fff" : isDark ? palette.fill : `linear-gradient(90deg, #788844, #244424)`);

  useEffect(() => {
    if (reducedMotion) return undefined;
    progress.value = withRepeat(
      withTiming(1, { duration: LOADING_THEME.progressDurationMs, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
    return () => cancelAnimation(progress);
  }, [progress, reducedMotion]);

  const barStyle = useAnimatedStyle(() => ({
    left: `${-40 + progress.value * 140}%`,
  }));

  return (
    <View style={[styles.track, { height, backgroundColor: track, borderRadius: height / 2 }, style]}>
      {Platform.OS === "web" && !reducedMotion ? (
        <View
          className={PROGRESS_CLASS}
          style={[
            styles.fill,
            {
              height,
              borderRadius: height / 2,
              background: typeof fill === "string" && fill.includes("gradient") ? fill : fill,
            },
          ]}
        />
      ) : (
        <Animated.View
          style={[
            styles.fill,
            {
              height,
              borderRadius: height / 2,
              backgroundColor: light ? "#fff" : palette.fill,
              width: "40%",
            },
            !reducedMotion && barStyle,
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  fill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "40%",
  },
});

injectWebCssOnce(
  PROGRESS_CSS_ID,
  `@keyframes kankregProgressSlide { 0% { left: -40%; } 100% { left: 100%; } }
.${PROGRESS_CLASS} { animation: kankregProgressSlide 1.4s ease-in-out infinite; }`
);
