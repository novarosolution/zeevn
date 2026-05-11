import React, { memo } from "react";
import { Platform, View } from "react-native";
import PremiumProductCard from "../PremiumProductCard";
import ProductCard from "../ProductCard";

/** Single-row catalog layout (memoized). */
export const HomeCatalogListRow = memo(function HomeCatalogListRow({
  item,
  index,
  totalInGroup,
  styles,
  navigation,
  quantity,
  onAddToCart,
  onRemoveFromCart,
  isOutOfStock,
  cardStyle = "compact",
}) {
  const useLegacyMobileCard = Platform.OS !== "web";

  return (
    <View
      style={[
        styles.productListRow,
        index < totalInGroup - 1 ? styles.productListRowDivider : styles.productListRowLast,
      ]}
    >
      {useLegacyMobileCard ? (
        <PremiumProductCard
          index={index}
          imagePriority={index < 4 ? "high" : "normal"}
          isOutOfStock={isOutOfStock}
          product={item}
          onPress={() => navigation.navigate("Product", { productId: item.id })}
          quantity={quantity}
          onAddToCart={onAddToCart}
          onRemoveFromCart={onRemoveFromCart}
        />
      ) : (
        <ProductCard
          index={index}
          isOutOfStock={isOutOfStock}
          product={item}
          onPress={() => navigation.navigate("Product", { productId: item.id })}
          quantity={quantity}
          onAddToCart={onAddToCart}
          onRemoveFromCart={onRemoveFromCart}
          variant="list"
          editorial={cardStyle === "comfortable"}
          showEta={cardStyle === "comfortable"}
        />
      )}
    </View>
  );
});

/** Grid cell for responsive grid layout (memoized). */
export const HomeCatalogGridCard = memo(function HomeCatalogGridCard({
  item,
  idx,
  styles,
  catalogGridColStyle,
  navigation,
  quantity,
  onAddToCart,
  onRemoveFromCart,
  isOutOfStock,
  cardStyle = "compact",
}) {
  return (
    <View style={[styles.productGridCell, catalogGridColStyle]}>
      <ProductCard
        index={idx}
        isOutOfStock={isOutOfStock}
        product={item}
        onPress={() => navigation.navigate("Product", { productId: item.id })}
        quantity={quantity}
        onAddToCart={onAddToCart}
        onRemoveFromCart={onRemoveFromCart}
        variant="grid"
        compact={cardStyle !== "comfortable"}
        editorial={cardStyle === "comfortable"}
        showEta={cardStyle === "comfortable"}
      />
    </View>
  );
});
