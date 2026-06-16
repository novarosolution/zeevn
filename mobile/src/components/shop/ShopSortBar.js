import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SHOP_SCREEN_UI } from "../../content/shopPageContent";
import { useTheme } from "../../context/ThemeContext";
import { getShopTheme } from "../../theme/shopTheme";
import { fonts, radius, typography } from "../../theme/tokens";

/** Visible sort options — clearer than cycling one button. */
export default function ShopSortBar({ value, onChange, compact = false, vertical = false }) {
  const { isDark } = useTheme();
  const t = getShopTheme(isDark);
  const options = SHOP_SCREEN_UI.sortOptions;

  return (
    <View style={[styles.wrap, vertical && styles.wrapVertical, compact && styles.wrapCompact]}>
      {options.map((opt) => {
        const on = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange?.(opt.key)}
            style={({ pressed }) => [
              styles.item,
              vertical && styles.itemVertical,
              compact && styles.itemCompact,
              {
                backgroundColor: on ? t.chipOnBg : t.surfaceChip,
                borderColor: on ? t.chipOnBorder : t.border,
              },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            {on ? <Ionicons name="checkmark" size={11} color={t.chipOnText} /> : null}
            <Text style={[styles.label, { color: on ? t.chipOnText : t.textMuted }]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  wrapVertical: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  wrapCompact: {
    gap: 5,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  itemVertical: {
    justifyContent: "flex-start",
  },
  itemCompact: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: typography.caption - 1,
  },
  pressed: {
    opacity: 0.88,
  },
});
