import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { SHOP_SCREEN_UI } from "../../content/shopPageContent";
import { getShopTheme } from "../../theme/shopTheme";
import { fonts, spacing, typography } from "../../theme/tokens";

/**
 * Removable chips for active shop filters.
 * @param {{ key: string, label: string }[]} chips
 */
export default function ShopActiveFilters({ chips = [], onRemove, onClearAll, inline = true }) {
  const { isDark } = useTheme();
  const t = getShopTheme(isDark);

  if (!chips.length) return null;

  const content = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {chips.map((chip) => (
        <Pressable
          key={chip.key}
          onPress={() => onRemove?.(chip.key)}
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: t.accentSoft,
              borderColor: t.borderStrong,
            },
            pressed && styles.chipPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Remove filter ${chip.label}`}
        >
          <Text style={[styles.chipText, { color: t.text }]} numberOfLines={1}>
            {chip.label}
          </Text>
          <Ionicons name="close" size={11} color={t.accent} />
        </Pressable>
      ))}
      {onClearAll ? (
        <Pressable
          onPress={onClearAll}
          style={({ pressed }) => [styles.clearBtn, pressed && styles.chipPressed]}
          accessibilityRole="button"
        >
          <Text style={[styles.clearText, { color: t.accent }]}>{SHOP_SCREEN_UI.clearFilters}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );

  if (inline) {
    return <View style={styles.inlineWrap}>{content}</View>;
  }

  return (
    <View style={[styles.wrap, { borderColor: t.border, backgroundColor: t.surfaceMuted }]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  inlineWrap: {
    marginBottom: spacing.xs,
  },
  wrap: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.xs + 2,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 0,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 180,
  },
  chipText: {
    fontFamily: fonts.semibold,
    fontSize: typography.caption - 1,
  },
  chipPressed: { opacity: 0.86 },
  clearBtn: {
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  clearText: {
    fontFamily: fonts.semibold,
    fontSize: typography.caption - 1,
    textDecorationLine: "underline",
  },
});
