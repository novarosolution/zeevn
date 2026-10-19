import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HOME_PAGE_TRUST_BADGES } from "../../content/appContent";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { KANKREG_PALETTE, ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { fonts, icon, spacing } from "../../theme/tokens";
import SectionReveal from "../motion/SectionReveal";

/** Compact phone trust chips — single horizontal row. */
export default function WebPhoneTrustStrip() {
  const { pageGutterClamp } = useKankregLayout();
  const badges = (HOME_PAGE_TRUST_BADGES || []).slice(0, 4);
  if (!badges.length) return null;

  return (
    <SectionReveal preset="fade-up" delay={100} style={styles.reveal}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.row, { paddingHorizontal: pageGutterClamp }]}
      >
        {badges.map((badge) => (
          <View key={badge.key || badge.label} style={styles.chip}>
            <Ionicons name={badge.icon || "checkmark-circle-outline"} size={icon.xs} color={ZEEVAN_GREEN.deep} />
            <Text style={styles.label} numberOfLines={1}>
              {badge.label}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SectionReveal>
  );
}

const styles = StyleSheet.create({
  reveal: { width: "100%", paddingVertical: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KANKREG_PALETTE.line,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: KANKREG_PALETTE.inkSoft,
    letterSpacing: 0.1,
  },
});
