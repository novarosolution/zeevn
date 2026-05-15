import React, { memo, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { usePrefersReducedMotion } from "../../utils/motion";

const SIZE_CONFIG = {
  sm: { size: 16, stroke: 1.5 },
  md: { size: 24, stroke: 1.5 },
  lg: { size: 40, stroke: 2 },
};

function resolveSizeConfig(size) {
  if (typeof size === "number") {
    const stroke = size >= 40 ? 2 : 1.5;
    return { size, stroke };
  }
  return SIZE_CONFIG[size] || SIZE_CONFIG.md;
}

function ProgressRingBase({
  size = "md",
  reducedMotion: reducedMotionProp,
  accessibilityValueText = "Loading",
  accessible = true,
  style,
  progress,
  spinning,
}) {
  const { isDark } = useTheme();
  const systemReducedMotion = usePrefersReducedMotion();
  const reducedMotion = typeof reducedMotionProp === "boolean" ? reducedMotionProp : systemReducedMotion;
  const { size: resolvedSize, stroke } = resolveSizeConfig(size);
  const radius = (resolvedSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const resolvedProgress =
    typeof progress === "number" && Number.isFinite(progress)
      ? Math.max(0, Math.min(1, progress))
      : null;
  const arcLength = resolvedProgress != null ? circumference * resolvedProgress : circumference * 0.25;
  const track = isDark ? "rgba(255,255,255,0.10)" : "rgba(14,14,14,0.08)";
  const accent = isDark ? "#C8A97E" : "#1F3A2E";

  const spin = useSharedValue(0);
  const dotOpacity = useSharedValue(0.4);

  useEffect(() => {
    if (spinning || (!reducedMotion && resolvedProgress == null)) {
      spin.value = withRepeat(withTiming(360, { duration: 1400, easing: Easing.linear }), -1, false);
      return;
    }
    dotOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [dotOpacity, reducedMotion, resolvedProgress, spin, spinning]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  return (
    <View
      style={[styles.wrap, { width: resolvedSize, height: resolvedSize }, style]}
      accessible={accessible}
      accessibilityRole={accessible ? "progressbar" : undefined}
      accessibilityValue={accessible ? { text: accessibilityValueText } : undefined}
      importantForAccessibility={accessible ? "auto" : "no-hide-descendants"}
      accessibilityElementsHidden={!accessible}
    >
      <Animated.View style={reducedMotion && !spinning ? null : spinStyle}>
        <Svg width={resolvedSize} height={resolvedSize}>
          <Circle
            cx={resolvedSize / 2}
            cy={resolvedSize / 2}
            r={radius}
            stroke={track}
            strokeWidth={stroke}
            fill="none"
          />
          <Circle
            cx={resolvedSize / 2}
            cy={resolvedSize / 2}
            r={radius}
            stroke={accent}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            fill="none"
            transform={`rotate(-90 ${resolvedSize / 2} ${resolvedSize / 2})`}
          />
        </Svg>
      </Animated.View>
      {reducedMotion ? (
        <Animated.View
          style={[
            styles.centerDot,
            { backgroundColor: accent, width: Math.max(3, Math.round(resolvedSize * 0.12)), height: Math.max(3, Math.round(resolvedSize * 0.12)) },
            dotStyle,
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerDot: {
    position: "absolute",
    borderRadius: 999,
  },
});

const ProgressRing = memo(ProgressRingBase);

export default ProgressRing;
