import React, { memo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStoreTheme } from "../../../theme/storefront";
import { clearSearches, forgetSearch, useRecentSearches } from "../../../utils/recentSearches";
import { hapticTick } from "../../../utils/haptics";
import PressableScale from "../PressableScale";
import PremiumBoundary from "./PremiumBoundary";

/**
 * Chips for the searches the shopper ran before. Tap one to run it again, the × forgets it, "Clear" forgets all. Renders
 * nothing when there is no history, so it can sit permanently under a search field.
 *
 * props: onPick(query), style
 */
function RecentSearchesBase({ onPick, style }) {
  const { c, type, gutter } = useStoreTheme();
  const items = useRecentSearches();
  if (!items.length) return null;

  return (
    <View style={style}>
      <View style={[styles.head, { paddingHorizontal: gutter }]}>
        <Text style={type.ui(12, "extrabold", c.inkMute, { letterSpacing: 1.2, textTransform: "uppercase" })}>Recent searches</Text>
        <PressableScale lite scaleTo={0.95} onPress={() => clearSearches()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear recent searches">
          <Text style={type.ui(13, "bold", c.brand)}>Clear</Text>
        </PressableScale>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.row, { paddingHorizontal: gutter }]} keyboardShouldPersistTaps="handled">
        {items.map((q) => (
          <View key={q} style={[styles.chip, { backgroundColor: c.card, borderColor: c.line }]}>
            <PressableScale
              lite
              scaleTo={0.96}
              onPress={() => {
                hapticTick();
                onPick?.(q);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Search ${q}`}
              style={styles.chipMain}
            >
              <Ionicons name="time-outline" size={15} color={c.inkMute} />
              <Text style={type.ui(14, "semibold", c.ink)} numberOfLines={1}>
                {q}
              </Text>
            </PressableScale>
            <PressableScale lite scaleTo={0.9} onPress={() => forgetSearch(q)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Forget ${q}`} style={styles.chipX}>
              <Ionicons name="close" size={14} color={c.inkMute} />
            </PressableScale>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const Memo = memo(RecentSearchesBase);

export default function RecentSearches(props) {
  return (
    <PremiumBoundary name="RecentSearches">
      <Memo {...props} />
    </PremiumBoundary>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  row: { gap: 8, paddingVertical: 2 },
  chip: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 20, height: 40, overflow: "hidden" },
  chipMain: { flexDirection: "row", alignItems: "center", gap: 7, paddingLeft: 13, paddingRight: 6, height: "100%", maxWidth: 200 },
  chipX: { width: 32, height: "100%", alignItems: "center", justifyContent: "center" },
});
