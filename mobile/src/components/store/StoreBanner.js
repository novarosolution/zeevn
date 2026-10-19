import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import { useStoreTheme, withAlpha } from "../../theme/storefront";

/** Inline status banner — `tone` is "error" (red) or "success" (olive). Dismissible when `onClose` is given. */
export default function StoreBanner({ message, tone = "error", onClose, style }) {
  const { c, r, type } = useStoreTheme();
  const isError = tone === "error";
  const color = isError ? c.danger : c.brand;
  return (
    <Animated.View
      entering={FadeInDown.duration(180)}
      exiting={FadeOut.duration(120)}
      accessibilityRole="alert"
      style={[
        styles.banner,
        {
          backgroundColor: isError ? c.dangerSoft : c.brandSoft,
          borderColor: withAlpha(color, isError ? 0.35 : 0.25),
          borderRadius: r.lg,
        },
        style,
      ]}
    >
      <Ionicons name={isError ? "alert-circle-outline" : "checkmark-circle-outline"} size={19} color={color} />
      <Text style={[type.ui(13.5, "medium", color), styles.text]}>{message}</Text>
      {onClose ? (
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Dismiss">
          <Ionicons name="close" size={18} color={color} />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: "row", alignItems: "center", gap: 9, padding: 13, borderWidth: 1 },
  text: { flex: 1, minWidth: 0 },
});
