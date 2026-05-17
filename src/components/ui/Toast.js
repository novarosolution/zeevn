import React, { memo, useEffect, useRef } from "react";
import { PanResponder, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "../../theme/tokens";
import { useTheme } from "../../context/ThemeContext";
import { usePrefersReducedMotion } from "../../utils/motion";

/**
 * Bottom-centered toast: navy surface, white body, brass action label.
 * Slide-up + fade; auto-dismiss via parent-driven `visible` + timer calling `onDismiss`.
 */
function ToastBase({
  visible,
  message,
  actionLabel,
  onAction,
  onDismiss,
  durationMs = 3000,
  enableSwipeDismiss = false,
}) {
  const { semanticPalette, RADII, TYPE } = useTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = usePrefersReducedMotion();
  const translateY = useSharedValue(28);
  const opacity = useSharedValue(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (reducedMotion) {
      translateY.value = visible ? 0 : 28;
      opacity.value = visible ? 1 : 0;
      return;
    }
    if (visible) {
      translateY.value = withTiming(0, { duration: 260 });
      opacity.value = withTiming(1, { duration: 220 });
    } else {
      translateY.value = withTiming(28, { duration: 200 });
      opacity.value = withTiming(0, { duration: 180 });
    }
  }, [visible, opacity, reducedMotion, translateY]);

  useEffect(() => {
    if (!visible || durationMs <= 0) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      return undefined;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onDismiss?.();
    }, durationMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, durationMs, message, onDismiss]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const handleAction = () => {
    clearTimer();
    onAction?.();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => enableSwipeDismiss && g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderRelease: (_, g) => {
        if (enableSwipeDismiss && g.dy > 36) {
          clearTimer();
          onDismiss?.();
        }
      },
    })
  ).current;

  if (!message) return null;

  return (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        {
          justifyContent: "flex-end",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingBottom: Math.max(insets.bottom, 12) + (Platform.OS === "web" ? 72 : 88),
          zIndex: 9999,
          elevation: 9999,
          pointerEvents: "box-none",
        },
      ]}
    >
      <Animated.View
        {...(enableSwipeDismiss ? panResponder.panHandlers : {})}
        style={[
          {
            pointerEvents: visible ? "auto" : "none",
            maxWidth: 440,
            width: "100%",
            borderRadius: RADII.md,
            backgroundColor: semanticPalette.bgDeep,
            paddingVertical: 14,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            ...Platform.select({
              web: {
                boxShadow: "0 12px 32px rgba(14,23,41,0.24)",
              },
              ios: {
                shadowColor: "#0E1729",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 16,
              },
              android: { elevation: 10 },
              default: {},
            }),
          },
          animStyle,
        ]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <Text
          style={{
            flex: 1,
            fontFamily: fonts.medium,
            fontSize: TYPE.body.fontSize,
            lineHeight: TYPE.body.lineHeight,
            color: semanticPalette.inkInverse,
          }}
          numberOfLines={3}
        >
          {message}
        </Text>
        {actionLabel ? (
          <Pressable onPress={handleAction} hitSlop={10} accessibilityRole="button">
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: TYPE.small.fontSize,
                letterSpacing: 0.8,
                color: semanticPalette.accent,
              }}
            >
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

const Toast = memo(ToastBase);

export default Toast;
