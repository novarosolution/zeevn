import React from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { buildShopCollectionLines } from "../../content/shopPageContent";
import { getHomeLineImage } from "../../content/homeLineImages";
import { useTheme } from "../../context/ThemeContext";
import { KANKREG_PALETTE, ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { fonts, spacing } from "../../theme/tokens";

const LINES = buildShopCollectionLines();

/**
 * Web shop line filter — image chips (premium, not Blinkit pills).
 */
export default function ShopAtelierLineRail({ selectedPill = "All", onSelectPill }) {
  const { isDark } = useTheme();
  if (Platform.OS !== "web") return null;

  const ink = isDark ? "#FAF8F4" : KANKREG_PALETTE.ink;
  const items = [
    { key: "all", pill: "All", label: "All", image: null },
    ...LINES.map((l) => ({
      key: l.key,
      pill: l.pill,
      label: l.label,
      image: getHomeLineImage(l.key),
    })),
  ];

  return (
    <View style={styles.rail} accessibilityRole="navigation" accessibilityLabel="Shop by line">
      {items.map((item) => {
        const on = selectedPill === item.pill;
        return (
          <Pressable
            key={item.key}
            onPress={() => onSelectPill?.(item.pill)}
            style={({ hovered, pressed }) => [
              styles.chip,
              isDark && styles.chipDark,
              on && styles.chipOn,
              on && isDark && styles.chipOnDark,
              hovered && !on && styles.chipHover,
              pressed && { opacity: 0.9 },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            {item.image ? <Image source={item.image} style={styles.thumb} /> : null}
            <Text style={[styles.text, { color: on ? (isDark ? "#FAF8F4" : ZEEVAN_GREEN.deep) : ink }]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    paddingVertical: spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    paddingRight: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(36, 68, 36, 0.14)",
    backgroundColor: "rgba(252, 248, 240, 0.9)",
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  chipDark: {
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  chipOn: {
    borderColor: ZEEVAN_GREEN.deep,
    backgroundColor: "rgba(92, 104, 52, 0.1)",
  },
  chipOnDark: {
    borderColor: "rgba(232, 188, 132, 0.45)",
    backgroundColor: "rgba(232, 188, 132, 0.1)",
  },
  chipHover: {
    borderColor: "rgba(36, 68, 36, 0.28)",
  },
  thumb: {
    width: 28,
    height: 28,
    borderRadius: 7,
  },
  text: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    letterSpacing: 0.04,
  },
});
