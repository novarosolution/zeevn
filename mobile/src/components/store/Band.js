import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useStoreTheme, withAlpha } from "../../theme/storefront";

/**
 * A full-width tinted panel with rounded corners that lifts one Home section off the page, so white product
 * cards read against it and the long scroll gets a rhythm. `tone`: "gold" (warm) or "olive" (cool).
 */
export default function Band({ tone = "gold", children, style }) {
  const { c, isDark } = useStoreTheme();
  const colors =
    tone === "olive"
      ? isDark
        ? [withAlpha(c.brand, 0.13), withAlpha(c.brand, 0.04)]
        : ["#E6EDD0", "#F1F4E3"]
      : isDark
        ? [withAlpha(c.gold, 0.13), withAlpha(c.gold, 0.04)]
        : ["#FAE9C3", "#F8EFD8"];
  return (
    <View style={[styles.band, { borderColor: withAlpha(tone === "olive" ? c.brand : c.gold, isDark ? 0.14 : 0.24) }, style]}>
      <LinearGradient colors={colors} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  band: { borderRadius: 32, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 20, overflow: "hidden" },
});
