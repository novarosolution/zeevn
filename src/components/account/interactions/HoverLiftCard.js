import React, { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../../context/ThemeContext";
import useReducedMotion from "../../../hooks/useReducedMotion";
import { platformShadow } from "../../../theme/shadowPlatform";

const DURATION = 240;

/** Desktop hover lift for account cards (scale 1.01 + shadow). */
export default function HoverLiftCard({ children, style, disabled = false }) {
  const { SHADOWS } = useTheme();
  const reducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const scale = useSharedValue(1);

  const isWeb = Platform.OS === "web" && !disabled;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shadowStyle =
    isWeb && hovered && !reducedMotion
      ? platformShadow(SHADOWS?.lifted || SHADOWS?.soft || { elevation: 6, opacity: 0.12 })
      : platformShadow(SHADOWS?.soft || { elevation: 2, opacity: 0.06 });

  const onHoverIn = () => {
    if (!isWeb || reducedMotion) return;
    setHovered(true);
    scale.value = withTiming(1.01, { duration: DURATION, easing: Easing.out(Easing.cubic) });
  };

  const onHoverOut = () => {
    if (!isWeb) return;
    setHovered(false);
    scale.value = withTiming(1, { duration: DURATION, easing: Easing.out(Easing.cubic) });
  };

  return (
    <Animated.View
      style={[animStyle, shadowStyle, style]}
      onMouseEnter={isWeb ? onHoverIn : undefined}
      onMouseLeave={isWeb ? onHoverOut : undefined}
    >
      <View style={styles.inner}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
  },
});
