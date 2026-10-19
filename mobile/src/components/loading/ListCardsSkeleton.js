import React from "react";
import { StyleSheet, View } from "react-native";
import { FIGMA } from "../../theme/figmaApp";
import { spacing } from "../../theme/tokens";
import SkeletonBlock from "../ui/SkeletonBlock";
import useLoadingShell from "./useLoadingShell";

/** List screens — filter chips + stacked card placeholders. */
export default function ListCardsSkeleton({
  cardCount = 3,
  cardHeight = 128,
  showChips = true,
  chipWidths = [72, 92],
  style,
}) {
  const shell = useLoadingShell();

  return (
    <View style={[styles.wrap, shell.wrap, style]}>
      {showChips ? (
        <View style={styles.chipRow}>
          {chipWidths.map((width, i) => (
            <SkeletonBlock key={i} width={width} height={32} rounded="pill" />
          ))}
        </View>
      ) : null}
      {Array.from({ length: cardCount }).map((_, i) => (
        <SkeletonBlock
          key={i}
          width="100%"
          height={cardHeight}
          rounded="lg"
          style={i > 0 ? styles.cardGap : null}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: FIGMA.gutter,
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: spacing.xs,
  },
  cardGap: {
    marginTop: spacing.sm,
  },
});
