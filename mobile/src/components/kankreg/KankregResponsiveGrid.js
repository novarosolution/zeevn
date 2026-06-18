import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useKankregLayout } from "../../theme/kankregBreakpoints";

/**
 * Flex-wrap grid matching kankreg.html `.pgrid` / `.reward-grid` breakpoints.
 */
export default function KankregResponsiveGrid({ children, variant = "catalog", style }) {
  const { catalogGridCol, statCols, isXs, catalogCardCompact } = useKankregLayout();
  const colStyle =
    variant === "stats"
      ? {
          width: statCols === 1 ? "100%" : statCols === 2 ? "48%" : "23%",
          maxWidth: statCols === 1 ? "100%" : statCols === 2 ? "48%" : "25%",
          minWidth: isXs ? 0 : variant === "stats" && statCols === 4 ? 180 : 140,
          paddingHorizontal: 6,
        }
      : catalogGridCol;

  const useGap = variant === "catalog" && catalogCardCompact;

  return (
    <View
      style={[
        styles.grid,
        useGap ? styles.gridCompact : styles.gridDefault,
        style,
      ]}
    >
      {React.Children.map(children, (child) =>
        child ? (
          <View style={[styles.cell, colStyle, catalogCardCompact && styles.cellCompact]}>{child}</View>
        ) : null
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    minWidth: 0,
    alignSelf: "stretch",
    ...Platform.select({
      web: { boxSizing: "border-box" },
      default: {},
    }),
  },
  gridDefault: {
    marginHorizontal: -7,
  },
  gridCompact: {
    justifyContent: "space-between",
    rowGap: 12,
    columnGap: 0,
  },
  cell: {
    marginBottom: 14,
    minWidth: 0,
    ...Platform.select({
      web: { boxSizing: "border-box", maxWidth: "100%" },
      default: {},
    }),
  },
  cellCompact: {
    marginBottom: 0,
  },
});
