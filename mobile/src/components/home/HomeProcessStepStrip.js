import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  HOME_SPACE,
  homeEditorialInk,
} from "../../theme/homeEditorial";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { useTheme } from "../../context/ThemeContext";
import { fonts, radius } from "../../theme/tokens";

function formatStepNum(index) {
  return String(index + 1).padStart(2, "0");
}

/** Compact numbered strip for the 6 Bilona process steps. */
export default function HomeProcessStepStrip({ steps = [], style }) {
  const { isDark } = useTheme();
  const ink = homeEditorialInk(isDark);
  const labels = steps.filter(Boolean);
  if (!labels.length) return null;

  const content = (
    <View style={styles.row}>
      {labels.map((label, index) => (
        <View key={`${label}-${index}`} style={styles.itemWrap}>
          <View style={[styles.item, isDark && styles.itemDark]}>
            <Text style={[styles.num, { color: KANKREG_PALETTE.gold }]}>{formatStepNum(index)}</Text>
            <Text style={[styles.label, { color: ink }]} numberOfLines={1}>
              {label}
            </Text>
          </View>
          {index < labels.length - 1 ? (
            <View style={[styles.connector, isDark && styles.connectorDark]} />
          ) : null}
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.wrap, style]} accessibilityRole="list">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {content}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    gap: HOME_SPACE.xs,
  },
  scrollContent: {
    paddingVertical: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255, 253, 248, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(31, 92, 71, 0.14)",
    ...Platform.select({
      web: { boxShadow: "0 1px 2px rgba(60, 45, 20, 0.04)" },
      default: {},
    }),
  },
  itemDark: {
    backgroundColor: "rgba(24, 21, 19, 0.52)",
    borderColor: "rgba(42, 117, 89, 0.14)",
  },
  num: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 0.1,
  },
  connector: {
    width: 10,
    height: 1,
    marginHorizontal: 4,
    backgroundColor: "rgba(31, 92, 71, 0.28)",
  },
  connectorDark: {
    backgroundColor: "rgba(42, 117, 89, 0.22)",
  },
});
