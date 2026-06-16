import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SHOP_SCREEN_UI } from "../../content/shopPageContent";
import { useTheme } from "../../context/ThemeContext";
import { getShopTheme } from "../../theme/shopTheme";
import { fonts, icon, spacing } from "../../theme/tokens";

/** Delivery + payment note below shop hero. */
export default function ShopDeliveryNote({ compact = false }) {
  const { isDark } = useTheme();
  const t = getShopTheme(isDark);
  const note = SHOP_SCREEN_UI.deliveryNote;
  if (!note) return null;

  return (
    <View
      style={[
        styles.wrap,
        compact && styles.wrapCompact,
        { backgroundColor: t.accentSoft, borderColor: t.border },
      ]}
    >
      <Ionicons name="information-circle-outline" size={compact ? icon.xs : icon.sm} color={t.accent} />
      <Text style={[styles.text, compact && styles.textCompact, { color: t.textMuted }]}>{note}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },
  wrapCompact: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
  },
  text: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  textCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
});
