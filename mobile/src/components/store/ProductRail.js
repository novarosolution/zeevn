import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStoreTheme } from "../../theme/storefront";
import PressableScale from "./PressableScale";
import ProductCard from "./ProductCard";

export const RAIL_CARD_WIDTH = 168;

/** Horizontal product rail with a trailing “See all” card. */
/** `rankTop`: the first N products carry a gold #1…#N badge (0 = none). */
export default function ProductRail({
  products,
  onProductPress,
  onSeeAll,
  seeAllLabel = "See all",
  cardWidth = RAIL_CARD_WIDTH,
  rankTop = 0,
}) {
  const { c, r, type, gutter, shadow } = useStoreTheme();
  const items = Array.isArray(products) ? products : [];
  if (!items.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={cardWidth + 12}
      snapToAlignment="start"
      contentContainerStyle={[styles.content, { paddingHorizontal: gutter }]}
    >
      {items.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          width={cardWidth}
          rank={index < rankTop ? index + 1 : undefined}
          onPress={() => onProductPress?.(product)}
        />
      ))}
      {onSeeAll ? (
        <PressableScale
          onPress={onSeeAll}
          accessibilityRole="button"
          accessibilityLabel={seeAllLabel}
          style={[styles.seeAll, shadow.soft, { width: 112, backgroundColor: c.brandSoft, borderRadius: r.xl, borderColor: c.line }]}
        >
          <View style={[styles.seeAllIcon, { backgroundColor: c.brand }]}>
            <Ionicons name="arrow-forward" size={20} color={c.onBrand} />
          </View>
          <Text style={[type.ui(14, "bold", c.brand), styles.seeAllText]}>{seeAllLabel}</Text>
        </PressableScale>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingVertical: 6, alignItems: "flex-start" },
  seeAll: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  seeAllIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  seeAllText: { textAlign: "center" },
});
