import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStoreTheme } from "../../theme/storefront";
import PressableScale from "./PressableScale";

/** Height of the bar itself (below the status bar) — scroll content starts at `insets.top + SCREEN_HEADER_PAD`. */
export const SCREEN_HEADER_PAD = 64;

/**
 * Frosted top bar shared by the app's detail screens (bag, checkout, orders, confirmation):
 * round back button, centred title and an optional trailing slot. Sits over the scroll view.
 */
export default function ScreenHeader({ title, onBack, backLabel = "Back", right, divider = false }) {
  const { c, type, isDark, gutter } = useStoreTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        { paddingTop: insets.top + 6, borderBottomColor: c.line, borderBottomWidth: divider ? StyleSheet.hairlineWidth : 0 },
      ]}
    >
      <BlurView intensity={isDark ? 40 : 70} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: c.glassStrong }]} />
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
  wrap: { position: "absolute", top: 0, left: 0, right: 0, paddingBottom: 10, zIndex: 20, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 46 },
  title: { position: "absolute", left: 72, right: 72, textAlign: "center" },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth },
  spacer: { width: 44, height: 44 },
  right: { minWidth: 44, alignItems: "flex-end" },
});
