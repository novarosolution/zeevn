import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import useReducedMotion from "../../hooks/useReducedMotion";
import { pointerEventsNativeOnly, withPointerEventsStyle } from "../../utils/pointerEventsStyle";

const FADE_MS = 200;

/**
 * Crossfades auth form ↔ success panel. Success panel should include AuthBrassIconEntrance.
 */
export default function AuthContentSwap({ showSuccess, form, success, footer = null }) {
  const reducedMotion = useReducedMotion();
  const formOpacity = useSharedValue(1);
  const successOpacity = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      formOpacity.value = showSuccess ? 0 : 1;
      successOpacity.value = showSuccess ? 1 : 0;
      return;
    }
    if (showSuccess) {
      formOpacity.value = withTiming(0, { duration: FADE_MS });
      successOpacity.value = withTiming(1, { duration: FADE_MS });
    } else {
      formOpacity.value = withTiming(1, { duration: FADE_MS });
      successOpacity.value = withTiming(0, { duration: FADE_MS });
    }
  }, [formOpacity, reducedMotion, showSuccess, successOpacity]);

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
  }));

  const successStyle = useAnimatedStyle(() => ({
    opacity: successOpacity.value,
  }));

  return (
    <View style={styles.root}>
      <Animated.View
        style={withPointerEventsStyle([styles.layer, formStyle], showSuccess ? "none" : "auto")}
        {...pointerEventsNativeOnly(showSuccess ? "none" : "auto")}
        accessibilityElementsHidden={showSuccess}
        importantForAccessibility={showSuccess ? "no-hide-descendants" : "auto"}
      >
        {form}
      </Animated.View>
      {showSuccess ? (
        <Animated.View
          style={withPointerEventsStyle([styles.layer, styles.successOverlay, successStyle], "auto")}
          {...pointerEventsNativeOnly("auto")}
        >
          {success}
        </Animated.View>
      ) : null}
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    position: "relative",
  },
  layer: {
    width: "100%",
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
