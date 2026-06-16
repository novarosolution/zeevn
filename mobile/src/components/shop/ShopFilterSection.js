import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { getShopTheme } from "../../theme/shopTheme";
import { fonts, spacing, typography } from "../../theme/tokens";

const SECTION_ICONS = {
  category: "grid-outline",
  collection: "layers-outline",
  price: "pricetag-outline",
  rating: "star-outline",
  sort: "swap-vertical-outline",
};

/** Premium filter group — compact with section dividers. */
export default function ShopFilterSection({ title, icon = "options-outline", children, last = false, dense = true }) {
  const { isDark } = useTheme();
  const t = getShopTheme(isDark);
  const iconName = SECTION_ICONS[icon] || icon;

  return (
    <View style={[styles.wrap, dense ? styles.wrapDense : styles.wrapSpacious, !last && styles.wrapGap]}>
      <View style={[styles.head, dense && styles.headDense]}>
        <View style={[styles.iconRing, dense && styles.iconRingDense, { backgroundColor: t.accentSoft, borderColor: t.border }]}>
          <Ionicons name={iconName} size={dense ? 11 : 13} color={t.sectionIcon} />
        </View>
        <Text style={[styles.title, dense && styles.titleDense, { color: t.sectionIcon }]}>{title}</Text>
      </View>
      <View style={styles.body}>{children}</View>
      {!last ? <View style={[styles.divider, { backgroundColor: t.border }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  wrapDense: {
    marginBottom: 0,
  },
  wrapSpacious: {
    marginBottom: spacing.md + 4,
  },
  wrapGap: {
    paddingBottom: spacing.sm + 2,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: spacing.sm,
  },
  headDense: {
    marginBottom: 6,
    gap: 6,
  },
  iconRing: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  iconRingDense: {
    width: 22,
    height: 22,
    borderRadius: 7,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: typography.caption,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  titleDense: {
    fontSize: 10,
    letterSpacing: 1.1,
  },
  body: {},
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
    opacity: 0.85,
  },
});
