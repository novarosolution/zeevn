import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SHOP_SCREEN_UI } from "../../content/shopPageContent";
import { useTheme } from "../../context/ThemeContext";
import { getShopTheme } from "../../theme/shopTheme";
import { fonts, icon, radius, spacing, typography } from "../../theme/tokens";

/** Four-up feature strip — copy from `SHOP_SCREEN_UI.features`. */
export default function ShopFeaturesStrip({ compact = false }) {
  const { isDark } = useTheme();
  const t = getShopTheme(isDark);
  const items = SHOP_SCREEN_UI.features || [];
  if (!items.length) return null;

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {items.map((item) => (
        <View
          key={item.title}
          style={[
            styles.card,
            compact && styles.cardCompact,
            { backgroundColor: t.surfaceChip, borderColor: t.border },
            t.cardShadow,
          ]}
        >
          <View style={[styles.iconRing, { backgroundColor: t.accentSoft }]}>
            <Ionicons name={item.icon || "checkmark-circle-outline"} size={icon.sm} color={t.accent} />
          </View>
          <Text style={[styles.title, { color: t.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.body, { color: t.textMuted }]} numberOfLines={2}>
            {item.body}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  wrapCompact: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  card: {
    flex: 1,
    minWidth: Platform.OS === "web" ? 148 : "46%",
    maxWidth: Platform.OS === "web" ? "24%" : "48%",
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.sm + 4,
    gap: 5,
  },
  cardCompact: {
    minWidth: "46%",
    maxWidth: "48%",
    padding: spacing.sm,
  },
  iconRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: typography.caption,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
  },
});
