import React, { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useCart } from "../../../context/CartContext";
import { pickRange, useStoreTheme, withAlpha } from "../../../theme/storefront";
import { formatINRWhole } from "../../../utils/currency";
import { hapticTap } from "../../../utils/haptics";
import { getProductCardFlags, isProductPurchasable } from "../../../utils/productAvailability";
import { productToCartLine } from "../../../utils/productCart";
import { getProductLine, getProductPricing, getUnitLabel, productImageSource } from "../../../utils/storefront";
import AddControl from "../AddControl";
import PressableScale from "../PressableScale";

export const MINI_CARD_WIDTH = 150;

/**
 * Compact product tile for the premium rails (buy again, recently viewed, related): picture on a range-tinted well, name,
 * unit + price and the same ADD / stepper the grid uses. A product with several sizes opens its page instead of guessing
 * one, so the shopper always picks the size.
 *
 * props: product, caption (small line under the name, e.g. "Bought 3 times"), onPress, width
 */
function MiniProductCardBase({ product, caption = "", onPress, width = MINI_CARD_WIDTH }) {
  const { c, r, type, shadow, isDark } = useStoreTheme();
  const { addToCart, removeFromCart, getItemQuantity } = useCart();
  const pricing = useMemo(() => getProductPricing(product), [product]);
  const flags = useMemo(() => getProductCardFlags(product), [product]);
  const source = useMemo(() => productImageSource(product, 320), [product]);
  const wash = pickRange(c, getProductLine(product)).wash;
  const quantity = getItemQuantity(product.id, "");
  const state = flags.isComingSoon ? "soon" : flags.isOutOfStock || !isProductPurchasable(product) ? "sold" : "ready";

  return (
    <PressableScale
      onPress={onPress}
      lite
      scaleTo={0.97}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${formatINRWhole(pricing.price)}`}
      style={[styles.card, shadow.soft, { width, backgroundColor: c.card, borderColor: c.line, borderRadius: r.xl }]}
    >
      <View style={[styles.well, { borderTopLeftRadius: r.xl, borderTopRightRadius: r.xl }]}>
        <LinearGradient colors={isDark ? [withAlpha(wash[0], 0.9), withAlpha(wash[1], 0.9)] : wash} style={StyleSheet.absoluteFill} />
        {source ? <Image source={source} style={styles.image} contentFit="contain" transition={140} /> : null}
        {pricing.discountPct ? (
          <View style={[styles.off, { backgroundColor: c.brand }]}>
            <Text style={type.ui(10.5, "extrabold", c.onBrand)}>{pricing.discountPct}% off</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.meta}>
        <Text style={type.ui(13.5, "bold", c.ink)} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={type.ui(11.5, "medium", c.inkMute)} numberOfLines={1}>
          {caption || getUnitLabel(product)}
        </Text>
        <View style={styles.bottom}>
          <Text style={type.display(16, { semi: true, ls: -0.2, lh: 20 })}>
            {pricing.from ? "From " : ""}
            {formatINRWhole(pricing.price)}
          </Text>
        </View>
        <AddControl
          block
          compact
          quantity={quantity}
          state={state}
          label={product.name}
          onOpenOptions={pricing.hasOptions ? onPress : undefined}
          onAdd={() => {
            if (pricing.hasOptions) return onPress?.();
            hapticTap();
            return addToCart(productToCartLine(product));
          }}
          onRemove={() => removeFromCart(product.id, "")}
        />
      </View>
    </PressableScale>
  );
}

export default memo(MiniProductCardBase);

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  well: { height: 118, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  image: { width: "78%", height: "82%" },
  off: { position: "absolute", top: 8, left: 8, paddingHorizontal: 8, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  meta: { padding: 11, gap: 3 },
  bottom: { flexDirection: "row", alignItems: "center", marginTop: 2, marginBottom: 8 },
});
