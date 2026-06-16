import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { buildHomeCategories } from "../../utils/homeCategories";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { fonts, icon, spacing } from "../../theme/tokens";
import { useTheme } from "../../context/ThemeContext";

import SectionReveal from "../motion/SectionReveal";

/** Quick category pill strip — desktop web, below intro band. */
export default function WebHomeCategoryPills({ products = [], onSelect }) {
  const { isDark } = useTheme();
  const { pageGutterClamp, isMobileWeb } = useKankregLayout();
  const pills = useMemo(() => buildHomeCategories(products, { max: 6 }), [products]);

  if (Platform.OS !== "web" || isMobileWeb || !pills.length) return null;

  const ink = isDark ? "#FAF8F4" : KANKREG_PALETTE.ink;
  const pillBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(31, 92, 71, 0.06)";
  const pillBorder = isDark ? "rgba(42, 117, 89, 0.22)" : "rgba(31, 92, 71, 0.14)";

  return (
    <SectionReveal immediate preset="fade-up" delay={200} style={styles.revealWrap}>
      <View style={[styles.shell, isDark && styles.shellDark]}>
        <View style={[styles.inner, { paddingHorizontal: pageGutterClamp }]}>
          <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.track}
        >
          {pills.map((cat) => (
            <Pressable
              key={cat.key}
              onPress={() => onSelect?.(cat.label)}
              style={({ hovered, pressed }) => [
                styles.pill,
                { backgroundColor: pillBg, borderColor: pillBorder },
                hovered && styles.pillHover,
                pressed && { opacity: 0.88 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Browse ${cat.label}`}
            >
              <Ionicons
                name={cat.icon || "grid-outline"}
                size={icon.xs}
                color={cat.accent || KANKREG_PALETTE.green}
              />
              <Text style={[styles.pillText, { color: ink }]}>{cat.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
    </SectionReveal>
  );
}

const styles = StyleSheet.create({
  revealWrap: {
    width: "100%",
  },
  shell: {
    width: "100%",
    paddingBottom: spacing.md,
    backgroundColor: "transparent",
  },
  shellDark: {},
  inner: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
  },
  track: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: 2,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  pillHover: {
    borderColor: KANKREG_PALETTE.green,
    transform: [{ translateY: -1 }],
  },
  pillText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    letterSpacing: 0.1,
  },
});
