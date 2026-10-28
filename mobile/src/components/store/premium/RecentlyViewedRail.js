import React, { memo, useCallback, useMemo } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useStoreTheme } from "../../../theme/storefront";
import { useRecentlyViewedIds } from "../../../utils/recentlyViewed";
import { SectionHeader } from "../SectionTitle";
import MiniProductCard, { MINI_CARD_WIDTH } from "./MiniProductCard";
import PremiumBoundary from "./PremiumBoundary";

const GAP = 12;

/**
 * Products the shopper opened recently, newest first, matched to the live catalog. `excludeId` leaves out the product
 * whose page this is shown on. Returns `[]` unless at least `min` are left, so a single glance never fills a section.
 */
export function useRecentProducts(products, { excludeId, min = 2, limit = 8 } = {}) {
  const ids = useRecentlyViewedIds();
  return useMemo(() => {
    if (!Array.isArray(products) || !products.length || !ids.length) return [];
    const byId = new Map(products.map((p) => [String(p.id), p]));
    const list = ids
      .filter((id) => id !== String(excludeId || ""))
      .map((id) => byId.get(id))
      .filter(Boolean)
      .slice(0, limit);
    return list.length >= min ? list : [];
  }, [ids, products, excludeId, min, limit]);
}

/**
 * Rail of recently viewed products.
 * props: items (from `useRecentProducts`), onProductPress, title, eyebrow
 */
function RecentlyViewedRailBase({ items, onProductPress, title = "Recently viewed", eyebrow = "Pick up where you left off" }) {
  const { gutter } = useStoreTheme();

  const renderItem = useCallback(
    ({ item }) => <MiniProductCard product={item} onPress={() => onProductPress?.(item)} />,
    [onProductPress]
  );
  const keyExtractor = useCallback((item) => String(item.id), []);

  if (!Array.isArray(items) || !items.length) return null;

  return (
    <View style={styles.block}>
      <SectionHeader eyebrow={eyebrow} title={title} />
      <FlatList
        horizontal
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={MINI_CARD_WIDTH + GAP}
        snapToAlignment="start"
        contentContainerStyle={[styles.content, { paddingHorizontal: gutter }]}
        initialNumToRender={3}
        windowSize={5}
      />
    </View>
  );
}

const Memo = memo(RecentlyViewedRailBase);

export default function RecentlyViewedRail(props) {
  return (
    <PremiumBoundary name="RecentlyViewedRail">
      <Memo {...props} />
    </PremiumBoundary>
  );
}

const styles = StyleSheet.create({
  block: { gap: 14 },
  content: { gap: GAP, paddingVertical: 4, alignItems: "flex-start" },
});
