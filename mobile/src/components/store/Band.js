import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import { useStoreTheme, withAlpha } from "../../theme/storefront";

/**
 * Full-width tinted panel — solid fill (no LinearGradient) for cheaper Home scroll.
 */
function Band({ tone = "gold", children, style }) {
  const { c, isDark } = useStoreTheme();
  const bg =
    tone === "olive"
      ? isDark
        ? withAlpha(c.brand, 0.1)
        : "#EBF0D8"
      : isDark
        ? withAlpha(c.gold, 0.1)
        : "#FAEED4";
  const border = withAlpha(tone === "olive" ? c.brand : c.gold, isDark ? 0.14 : 0.22);
  return <View style={[styles.band, { backgroundColor: bg, borderColor: border }, style]}>{children}</View>;
}

export default memo(Band);

const styles = StyleSheet.create({
  band: { borderRadius: 32, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 18, overflow: "hidden" },
});
