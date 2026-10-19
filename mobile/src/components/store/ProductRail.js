import React, { memo, useCallback, useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStoreTheme } from "../../theme/storefront";
import PressableScale from "./PressableScale";
import ProductCard from "./ProductCard";

export const RAIL_CARD_WIDTH = 168;
const GAP = 12;
/** Cap tiles so Home does not mount dozens of cards at once. */
const RAIL_MAX = 6;

/** Horizontal product rail — windowed FlatList for smooth Home scroll. */
function ProductRail({
  products,
  onProductPress,
  onSeeAll,
  seeAllLabel = "See all",
  cardWidth = RAIL_CARD_WIDTH,
  rankTop = 0,
  hideEta,
}) {
  const { c, r, type, gutter, shadow } = useStoreTheme();
  const items = useMemo(() => (Array.isArray(products) ? products.slice(0, RAIL_MAX) : []), [products]);

  const renderItem = useCallback(
    ({ item, index }) => (
      <ProductCard
        product={item}
        width={cardWidth}
        rank={index < rankTop ? index + 1 : undefined}
        hideEta={hideEta}
        lite
        onPress={() => onProductPress?.(item)}
      />
    ),
    [cardWidth, hideEta, onProductPress, rankTop]
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  const ListFooter = useMemo(() => {
    if (!onSeeAll) return null;
    return (
      <PressableScale
        onPress={onSeeAll}
        lite
        accessibilityRole="button"
        accessibilityLabel={seeAllLabel}
        style={[styles.seeAll, shadow.soft, { width: 112, backgroundColor: c.brandSoft, borderRadius: r.xl, borderColor: c.line }]}
      >
        <View style={[styles.seeAllIcon, { backgroundColor: c.brand }]}>
          <Ionicons name="arrow-forward" size={20} color={c.onBrand} />
        </View>
        <Text style={[type.ui(14, "bold", c.brand), styles.seeAllText]}>{seeAllLabel}</Text>
      </PressableScale>
    );
  }, [c, onSeeAll, r.xl, seeAllLabel, shadow.soft, type]);

  if (!items.length) return null;

  return (
    <FlatList
      horizontal
      data={items}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListFooterComponent={ListFooter}
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={cardWidth + GAP}
      snapToAlignment="start"
      contentContainerStyle={[styles.content, { paddingHorizontal: gutter }]}
      initialNumToRender={3}
      maxToRenderPerBatch={3}
      windowSize={5}
      removeClippedSubviews
    />
  );
}

export default memo(ProductRail);

const styles = StyleSheet.create({
  content: { gap: GAP, paddingVertical: 4, alignItems: "flex-start" },
  seeAll: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginLeft: 0,
  },
  seeAllIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  seeAllText: { textAlign: "center" },
});
