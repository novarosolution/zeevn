import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { fonts, radius, spacing } from "../../theme/tokens";
import { useTheme } from "../../context/ThemeContext";

/** kankreg.html `.kv` key-value grid for profile / checkout details. */
export default function KankregKvGrid({ rows = [] }) {
  const { isXs } = useKankregLayout();
  const { isDark } = useTheme();
  const cols = isXs ? 1 : 2;

  return (
    <View style={[styles.grid, cols === 1 && styles.gridSingle]}>
      {rows.map((row) => (
        <View
          key={row.key}
          style={[
            styles.cell,
            { width: cols === 1 ? "100%" : "48%" },
            isDark ? styles.cellDark : styles.cellLight,
          ]}
        >
          <Text style={[styles.k, { color: isDark ? KANKREG_PALETTE.paper : KANKREG_PALETTE.inkFaint }]}>
            {row.label}
          </Text>
          <Text
            style={[styles.v, { color: isDark ? "#e8e0d4" : KANKREG_PALETTE.inkSoft }]}
            numberOfLines={3}
          >
            {row.value || "—"}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm + 4,
  },
  gridSingle: {
    flexDirection: "column",
  },
  cell: {
    minWidth: 120,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cellLight: {
    backgroundColor: "rgba(255, 252, 248, 0.72)",
    borderColor: "rgba(22, 69, 51, 0.08)",
  },
  cellDark: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.07)",
  },
  k: {
    fontSize: 10.5,
    fontFamily: fonts.bold,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  v: {
    fontSize: 14.5,
    marginTop: 4,
    fontFamily: fonts.semibold,
    lineHeight: 21,
  },
});
