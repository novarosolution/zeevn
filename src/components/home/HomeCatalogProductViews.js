import React, { memo } from "react";
import { FlatList, View } from "react-native";
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
  return (
    <View
      style={[
        styles.productListRow,
        index < totalInGroup - 1 ? styles.productListRowDivider : styles.productListRowLast,
      ]}
    >
      <ProductCard
        index={index}
        isOutOfStock={isOutOfStock}
        product={item}
        onPress={() => navigation.navigate("Product", { productId: item.id })}
        quantity={quantity}
        onAddToCart={(meta) => onAddToCart(meta)}
        onRemoveFromCart={onRemoveFromCart}
        variant="list"
        compact={cardStyle !== "comfortable"}
        editorial={cardStyle === "comfortable"}
        showEta={cardStyle === "comfortable"}
      />
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
    <View style={[styles.productGridCell, { flexGrow: 1 }, catalogGridColStyle]}>
      <ProductCard
        index={idx}
        isOutOfStock={isOutOfStock}
        product={item}
        onPress={() => navigation.navigate("Product", { productId: item.id })}
        quantity={quantity}
        onAddToCart={(meta) => onAddToCart(meta)}
        onRemoveFromCart={onRemoveFromCart}
        variant="grid"
        compact={cardStyle !== "comfortable"}
        editorial={cardStyle === "comfortable"}
        showEta={cardStyle === "comfortable"}
      />
    </View>
  );
});

/** Responsive home catalog grid using FlatList + numColumns. */
export const HomeCatalogResponsiveGrid = memo(function HomeCatalogResponsiveGrid({
  items,
  styles,
  navigation,
  getItemQuantity,
  onAddToCart,
  onRemoveFromCart,
  isOutOfStock,
  cardStyle = "compact",
  numColumns = 2,
  gridGap = 12,
  cardWidth = 160,
  listKeyPrefix = "home-grid",
}) {
  return (
    <FlatList
      data={items}
      key={`${listKeyPrefix}-${numColumns}`}
      scrollEnabled={false}
      numColumns={numColumns}
      keyExtractor={(item, idx) => String(item?.id ?? `${listKeyPrefix}-${idx}`)}
      columnWrapperStyle={
        numColumns > 1
          ? {
              gap: gridGap,
              marginBottom: gridGap,
            }
          : undefined
      }
      contentContainerStyle={styles.productGridListContent}
      renderItem={({ item, index }) => (
        <View style={[styles.productGridCell, { width: cardWidth, maxWidth: cardWidth }]}>
          <ProductCard
            index={index}
            isOutOfStock={isOutOfStock(item)}
            product={item}
            onPress={() => navigation.navigate("Product", { productId: item.id })}
            quantity={getItemQuantity(item.id)}
            onAddToCart={(meta) => onAddToCart(item, meta)}
            onRemoveFromCart={() => onRemoveFromCart(item.id)}
            variant="grid"
            compact={cardStyle !== "comfortable"}
            editorial={cardStyle === "comfortable"}
            showEta={cardStyle === "comfortable"}
          />
        </View>
      )}
    />
  );
});
