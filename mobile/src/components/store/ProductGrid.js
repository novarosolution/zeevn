import React, { memo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useStoreTheme } from "../../theme/storefront";
import ProductCard from "./ProductCard";

const COLS = 3;
const GAP = 8;

/**
 * Blinkit-style three-column product grid. Lives inside Home's ScrollView — no nested FlatList.
 */
function ProductGrid({ products, onProductPress, hideEta, rankTop = 0, lite = true }) {
  const { gutter } = useStoreTheme();
  const { width } = useWindowDimensions();
  const list = Array.isArray(products) ? products : [];
  if (!list.length) return null;

  const cardW = Math.floor((width - gutter * 2 - GAP * (COLS - 1)) / COLS);

  return (
    <View style={[styles.grid, { paddingHorizontal: gutter }]}>
      {list.map((product, index) => (
        <ProductCard
          key={String(product.id)}
          product={product}
          width={cardW}
          lite={lite}
          hideEta={hideEta}
          rank={index < rankTop ? index + 1 : undefined}
          onPress={() => onProductPress?.(product)}
        />
      ))}
    </View>
  );
}

export default memo(ProductGrid);

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP, rowGap: 16 },
});
