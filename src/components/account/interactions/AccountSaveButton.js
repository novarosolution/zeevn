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

  const content = () => {
    if (saving) {
      return (
        <View style={[styles.pill, { backgroundColor: semanticPalette.ink, borderRadius: RADII.pill }]}>
          <ProgressRing size={22} accentColor={semanticPalette.accent} spinning />
        </View>
      );
    }
    if (showSaved) {
      return (
        <View style={[styles.pill, { backgroundColor: semanticPalette.ink, borderRadius: RADII.pill, flexDirection: "row", gap: 8 }]}>
          <Ionicons name="checkmark-circle" size={20} color={semanticPalette.accent} />
          <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.inkInverse }}>{savedLabel}</Text>
        </View>
      );
    }
    return (
      <Pressable
        onPress={enabled ? onPress : undefined}
        disabled={!enabled}
        style={({ pressed }) => [
          styles.pill,
          {
            backgroundColor: semanticPalette.ink,
            borderRadius: RADII.pill,
            opacity: !dirty ? 0.5 : pressed ? 0.92 : 1,
          },
          Platform.OS === "web" && !enabled ? { cursor: "not-allowed" } : null,
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

  return <Animated.View style={[animWrap, style]} pointerEvents={dirty ? "auto" : "none"}>{content()}</Animated.View>;
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 44,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
