import React, { memo, useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import Animated, { useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import useReducedMotion from "../../../hooks/useReducedMotion";

const AnimatedPath = Animated.createAnimatedComponent(Path);

function AnimatedCheckmarkBase({ size = 18, color = "#2E7D5B", active = true }) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: reducedMotion ? 1 : 420 });
  }, [active, progress, reducedMotion]);

  const pathLen = size * 1.4;
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: pathLen * (1 - progress.value),
  }));

  if (Platform.OS === "web") {
    return (
      <View style={[styles.box, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M5 13l4 4L19 7" stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
    );
  }

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.5} fill="none" opacity={0.25} />
        <AnimatedPath
          d="M5 13l4 4L19 7"
          stroke={color}
          strokeWidth={2.2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLen}
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: "center",
    justifyContent: "center",
  },
});

const AnimatedCheckmark = memo(AnimatedCheckmarkBase);

export default AnimatedCheckmark;
