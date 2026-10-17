import React, { memo, useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from "react-native-reanimated";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useStoreTheme } from "../../theme/storefront";
import { formatINRWhole } from "../../utils/currency";
import { hapticTap } from "../../utils/haptics";
import { getProductCardFlags } from "../../utils/productAvailability";
import { productToCartLine } from "../../utils/productCart";
import {
  getEtaLabel,
  getProductPricing,
  getStockHint,
  getUnitLabel,
  productGalleryUris,
  productImageUri,
} from "../../utils/storefront";
import AddControl from "./AddControl";
import PressableScale from "./PressableScale";
import { useVariantSheet } from "./VariantSheet";

const AnimatedView = Animated.View;

// The photo well stays cream in light and dark mode, so the page dots use fixed dark tones.
const DOT_ACTIVE = "#2F4F22";
const DOT_IDLE = "rgba(40, 32, 12, 0.42)";
const DOT_RING = "rgba(255, 255, 255, 0.75)";

function Heart({ active, onPress }) {
  const { c, shadow } = useStoreTheme();
  const scale = useSharedValue(1);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSequence(withSpring(1.28, { damping: 8, stiffness: 420 }), withSpring(1, { damping: 12 }));
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={active ? "Remove from wishlist" : "Save to wishlist"}
      style={styles.heartHit}
    >
      <AnimatedView style={[styles.heart, shadow.soft, { backgroundColor: c.card }, popStyle]}>
        <Ionicons name={active ? "heart" : "heart-outline"} size={16} color={active ? c.danger : c.inkSoft} />
      </AnimatedView>
    </Pressable>
  );
}

/** Image block: single image, or a swipeable gallery with page dots (grid cards only). */
function CardImage({ uris, size, gallery, dim, c }) {
  const [index, setIndex] = useState(0);
  const onEnd = useCallback(
    (e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / Math.max(size, 1))),
    [size]
  );

  if (!uris.length) {
    return (
      <View style={[styles.placeholder, { backgroundColor: c.soft }]}>
        <MaterialCommunityIcons name="image-outline" size={34} color={c.inkMute} />
      </View>
    );
  }

  const imageStyle = [styles.image, dim && { opacity: 0.42 }];

  if (!gallery || uris.length < 2) {
    return (
      <Image source={{ uri: uris[0] }} style={imageStyle} contentFit="cover" transition={180} cachePolicy="memory-disk" />
    );
  }

  return (
    <>
      <FlatList
        data={uris}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(uri, i) => `${i}-${uri}`}
        onMomentumScrollEnd={onEnd}
        getItemLayout={(_, i) => ({ length: size, offset: size * i, index: i })}
        renderItem={({ item }) => (
          <View style={{ width: size, height: size }}>
            <Image source={{ uri: item }} style={imageStyle} contentFit="cover" transition={180} cachePolicy="memory-disk" />
          </View>
        )}
      />
      <View style={styles.dots} pointerEvents="none">
        {uris.map((uri, i) => (
          <View
            key={`${i}-${uri}`}
            style={[
              styles.dot,
              { backgroundColor: i === index ? DOT_ACTIVE : DOT_IDLE, width: i === index ? 12 : 5 },
            ]}
          />
        ))}
      </View>
    </>
  );
}

/**
 * Blinkit-style product tile: image well with offer badge + heart, unit label with an overlapping ADD,
 * price / MRP, name and delivery / stock hints.
 *
 * @param {number} width   tile width in points
 * @param {boolean} gallery swipeable image gallery (use in vertical grids, not horizontal rails)
 */
function ProductCard({ product, width = 172, onPress, gallery = false, style }) {
  const { c, r, type, shadow } = useStoreTheme();
  const { addToCart, removeFromCart, getItemQuantity } = useCart();
  const wishlist = useWishlist();
  const variantSheet = useVariantSheet();

  const pricing = useMemo(() => getProductPricing(product), [product]);
  const flags = getProductCardFlags(product);
  const state = flags.isComingSoon ? "soon" : flags.isOutOfStock ? "sold" : "ready";
  const quantity = getItemQuantity(product.id);
  const imageSize = Math.max(64, width - 16);
  const uris = useMemo(
    () => (gallery ? productGalleryUris(product, imageSize) : [productImageUri(product, imageSize)].filter(Boolean)),
    [gallery, product, imageSize]
  );
  const wished = wishlist.has(product.id);
  const unit = getUnitLabel(product);
  const eta = getEtaLabel(product);
  const stockHint = getStockHint(product);
  const rating = Number(product.ratingAverage) || 0;
  const showRating = rating >= 3.5 && (Number(product.reviewCount) || 0) > 0;

  const badge = useMemo(() => {
    if (state === "soon") return { text: "COMING SOON", tone: "soon" };
    if (pricing.discountPct) return { text: `${pricing.discountPct}% OFF`, tone: "offer" };
    if (product.badgeText) return { text: String(product.badgeText).toUpperCase(), tone: "brand" };
    return null;
  }, [state, pricing.discountPct, product.badgeText]);

  const handleAdd = useCallback(() => addToCart(productToCartLine(product)), [addToCart, product]);
  const handleRemove = useCallback(() => removeFromCart(product.id), [removeFromCart, product.id]);
  const handleOptions = useCallback(() => variantSheet.open(product), [variantSheet, product]);
  const handleWish = useCallback(() => {
    hapticTap();
    wishlist.toggle(product.id);
  }, [wishlist, product.id]);

  const badgeColors =
    badge?.tone === "offer"
      ? { bg: c.gold, fg: "#3A2A0C" }
      : badge?.tone === "soon"
        ? { bg: "#FBEFD6", fg: "#8A5A12" }
        : { bg: c.brand, fg: c.onBrand };

  const dim = state === "sold";

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.97}
      style={[
        styles.card,
        shadow.soft,
        { width, backgroundColor: c.card, borderColor: c.line, borderRadius: r.xl },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${formatINRWhole(pricing.price)}`}
    >
      <View style={[styles.well, { width: imageSize, height: imageSize, backgroundColor: c.well, borderRadius: r.lg }]}>
        <CardImage uris={uris} size={imageSize} gallery={gallery} dim={dim} c={c} />
        {badge ? (
          <View style={[styles.badge, { backgroundColor: badgeColors.bg }]}>
            <Text
              style={type.ui(badge.text.length > 9 ? 8.5 : 9.5, "extrabold", badgeColors.fg, { letterSpacing: badge.text.length > 9 ? 0.3 : 0.5 })}
              numberOfLines={1}
            >
              {badge.text}
            </Text>
          </View>
        ) : null}
        <Heart active={wished} onPress={handleWish} />
        {state === "sold" ? (
          <View style={styles.soldWrap} pointerEvents="none">
            <View style={[styles.soldTag, { backgroundColor: c.glassStrong, borderColor: c.line }]}>
              <Text style={type.ui(11, "bold", c.inkSoft, { letterSpacing: 0.4 })}>Out of stock</Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.actionRow}>
        <View style={styles.unitCol}>
          <Text style={type.ui(12.5, "semibold", c.inkMute)} numberOfLines={1}>
            {unit}
          </Text>
        </View>
        <AddControl
          compact={width < 160}
          state={state}
          mode={pricing.hasOptions ? "options" : "stepper"}
          quantity={quantity}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onOpenOptions={handleOptions}
          label={product.name}
        />
      </View>

      <View style={styles.info}>
        <View style={styles.priceRow}>
          {pricing.from ? <Text style={type.ui(11.5, "semibold", c.inkMute)}>From</Text> : null}
          <Text style={type.ui(17, "extrabold", c.ink, { letterSpacing: -0.2 })}>{formatINRWhole(pricing.price)}</Text>
          {pricing.mrp ? (
            <Text style={[type.ui(12, "regular", c.inkMute), styles.strike]}>{formatINRWhole(pricing.mrp)}</Text>
          ) : null}
        </View>
        <Text style={[type.ui(13.5, "semibold", c.ink), styles.name]} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.metaRow}>
          {showRating ? (
            <View style={styles.meta}>
              <Ionicons name="star" size={11.5} color={c.gold} />
              <Text style={type.ui(11.5, "bold", c.inkSoft)}>{rating.toFixed(1)}</Text>
            </View>
          ) : null}
          {eta ? (
            <View style={styles.meta}>
              <Ionicons name="time-outline" size={12} color={c.inkMute} />
              <Text style={type.ui(11.5, "semibold", c.inkMute)} numberOfLines={1}>
                {eta}
              </Text>
            </View>
          ) : null}
          {stockHint ? (
            <View style={[styles.stock, { backgroundColor: c.dangerSoft }]}>
              <Text style={type.ui(10.5, "bold", c.danger)}>{stockHint}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
}

export default memo(ProductCard);

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  well: { overflow: "hidden" },
  image: { width: "100%", height: "100%", padding: 6 },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    maxWidth: "70%",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  heartHit: { position: "absolute", top: 6, right: 6 },
  heart: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  dots: {
    position: "absolute",
    bottom: 22,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: { height: 6, borderRadius: 3, borderWidth: 1, borderColor: DOT_RING },
  soldWrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  soldTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: -18,
    paddingLeft: 6,
    paddingRight: 0,
  },
  unitCol: { flex: 1, minWidth: 0, paddingBottom: 1 },
  info: { paddingHorizontal: 6, paddingTop: 8, gap: 3 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 6, flexWrap: "wrap" },
  strike: { textDecorationLine: "line-through" },
  name: { lineHeight: 18, minHeight: 36 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 20, marginTop: 1 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  stock: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7 },
});
