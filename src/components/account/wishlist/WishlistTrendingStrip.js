import React, { memo } from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import ProductCard from "../../ProductCard";
import SectionHeader from "../../ui/SectionHeader";
import { WISHLIST_SCREEN } from "../../../content/appContent";
import { useTheme } from "../../../context/ThemeContext";

const copy = WISHLIST_SCREEN.trending;

function WishlistTrendingStripBase({ products, navigation, getQty, onAddToCart, onRemoveFromCart }) {
  const { SPACING } = useTheme();
  const { width } = useWindowDimensions();
  const tileWidth = width >= 720 ? 200 : 168;

  if (!products?.length) return null;

  return (
    <View style={{ marginTop: SPACING.xl }}>
      <SectionHeader overline={copy.overline} title={copy.title} showActionChevron={false} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.md, paddingBottom: 4 }}>
        {products.map((product, index) => (
          <View key={String(product.id)} style={{ width: tileWidth }}>
            <ProductCard
              product={product}
              index={index}
              compact
              isOutOfStock={product.inStock === false}
              onPress={() => navigation.navigate("Product", { productId: String(product.id) })}
              quantity={getQty(product.id)}
              onAddToCart={() => onAddToCart(product)}
              onRemoveFromCart={() => onRemoveFromCart(product.id)}
              variant="grid"
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const WishlistTrendingStrip = memo(WishlistTrendingStripBase);
export default WishlistTrendingStrip;
