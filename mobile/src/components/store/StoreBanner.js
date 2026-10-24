import React from "react";
import { StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { panelIn, panelOut } from "../../theme/motion";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import PressableScale from "./PressableScale";

/** Inline status banner — `tone` is "error" (red) or "success" (olive). Dismissible when `onClose` is given. */
export default function StoreBanner({ message, tone = "error", onClose, style }) {
  const { c, r, type } = useStoreTheme();
  const isError = tone === "error";
  const color = isError ? c.danger : c.brand;
  return (
    <Animated.View
      entering={panelIn}
      exiting={panelOut}
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
        <PressableScale scaleTo={0.88} lite onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Dismiss">
          <Ionicons name="close" size={18} color={color} />
        </PressableScale>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: "row", alignItems: "center", gap: 9, padding: 13, borderWidth: 1 },
  text: { flex: 1, minWidth: 0 },
});
