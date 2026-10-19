import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStoreTheme } from "../../theme/storefront";
import PressableScale from "./PressableScale";

export const SCREEN_HEADER_PAD = 64;

/** Solid top bar (no BlurView) — shared by bag, checkout, orders, confirmation. */
export default function ScreenHeader({ title, onBack, backLabel = "Back", right, divider = false }) {
  const { c, type, gutter } = useStoreTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + 6,
          backgroundColor: c.page,
          borderBottomColor: c.line,
          borderBottomWidth: divider ? StyleSheet.hairlineWidth : 0,
        },
      ]}
    >
      <View style={[styles.row, { paddingHorizontal: gutter }]}>
        {onBack ? (
          <PressableScale
            onPress={onBack}
            scaleTo={0.92}
            accessibilityRole="button"
            accessibilityLabel={backLabel}
            style={[styles.round, { backgroundColor: c.card, borderColor: c.line }]}
          >
            <Ionicons name="chevron-back" size={21} color={c.ink} />
          </PressableScale>
        ) : (
          <View style={styles.spacer} />
        )}
        <Text style={[type.ui(18, "extrabold", c.ink), styles.title]} numberOfLines={1} pointerEvents="none" accessibilityRole="header">
          {title}
        </Text>
        <View style={styles.right}>{right || <View style={styles.spacer} />}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { zIndex: 20 },
  row: { height: 52, flexDirection: "row", alignItems: "center", gap: 10 },
  title: { flex: 1, textAlign: "center" },
  right: { minWidth: 42, alignItems: "flex-end" },
  spacer: { width: 42, height: 42 },
  round: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
});
