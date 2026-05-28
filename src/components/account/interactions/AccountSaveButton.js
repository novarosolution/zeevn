import React, { useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import ProgressRing from "../../ui/ProgressRing";
import { pointerEventsNativeOnly, withPointerEventsStyle } from "../../../utils/pointerEventsStyle";
import { WebNativeButton } from "../../ui/inputWebHelpers";
import { useTheme } from "../../../context/ThemeContext";
import useReducedMotion from "../../../hooks/useReducedMotion";
import { fonts } from "../../../theme/tokens";

/**
 * Profile save CTA — disabled until dirty, animates in, saving ring, saved check state.
 */
export default function AccountSaveButton({
  dirty,
  saving,
  saveLabel,
  savingLabel,
  savedLabel,
  onPress,
  style,
}) {
  const { semanticPalette, RADII, TYPE } = useTheme();
  const reducedMotion = useReducedMotion();
  const [showSaved, setShowSaved] = useState(false);
  const prevSaving = useRef(false);
  const translateY = useSharedValue(8);
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    if (!dirty) {
      setShowSaved(false);
      if (reducedMotion) {
        opacity.value = 0.5;
        translateY.value = 0;
        scale.value = 1;
        return;
      }
      opacity.value = withTiming(0.5, { duration: 160 });
      return;
    }
    if (reducedMotion) {
      opacity.value = 1;
      translateY.value = 0;
      scale.value = 1;
      return;
    }
    opacity.value = withTiming(1, { duration: 220 });
    translateY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
    scale.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [dirty, opacity, reducedMotion, scale, translateY]);

  useEffect(() => {
    if (saving) {
      prevSaving.current = true;
      return;
    }
    if (prevSaving.current) {
      prevSaving.current = false;
      setShowSaved(true);
      const t = setTimeout(() => setShowSaved(false), 1200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [saving]);

  const animWrap = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const enabled = dirty && !saving && !showSaved;
  const pillRadius = Platform.OS === "web" ? 22 : RADII.pill;
  const pillShell = { backgroundColor: semanticPalette.ink, borderRadius: pillRadius };

  const content = () => {
    if (saving) {
      return (
        <View style={[styles.pill, pillShell]}>
          <ProgressRing size={22} accentColor={semanticPalette.accent} spinning />
        </View>
      );
    }
    if (showSaved) {
      return (
        <View style={[styles.pill, pillShell, { flexDirection: "row", gap: 8 }]}>
          <Ionicons name="checkmark-circle" size={20} color={semanticPalette.accent} />
          <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.inkInverse }}>{savedLabel}</Text>
        </View>
      );
    }
    if (Platform.OS === "web") {
      return (
        <WebNativeButton
          onPress={onPress}
          disabled={!enabled}
          ariaLabel={saveLabel}
          minHeight={44}
          borderRadius={RADII.pill}
          style={{
            ...styles.pill,
            ...pillShell,
            borderWidth: 0,
            opacity: !dirty ? 0.5 : 1,
            cursor: !enabled ? "not-allowed" : "pointer",
          }}
        >
          <span
            style={{
              fontFamily: fonts.semibold,
              fontSize: TYPE.body.fontSize,
              lineHeight: `${TYPE.body.lineHeight}px`,
              color: semanticPalette.inkInverse,
            }}
          >
            {saveLabel}
          </span>
        </WebNativeButton>
      );
    }
    return (
      <Pressable
        onPress={enabled ? onPress : undefined}
        disabled={!enabled}
        style={({ pressed }) => [
          styles.pill,
          pillShell,
          { opacity: !dirty ? 0.5 : pressed ? 0.92 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled: !enabled }}
      >
        <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.inkInverse }}>
          {saveLabel}
        </Text>
      </Pressable>
    );
  };

  return (
    <Animated.View
      style={withPointerEventsStyle([animWrap, style], dirty ? "auto" : "none")}
      {...pointerEventsNativeOnly(dirty ? "auto" : "none")}
    >
      {content()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 44,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
