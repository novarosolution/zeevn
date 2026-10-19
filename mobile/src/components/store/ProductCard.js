import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from "react-native-reanimated";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { STORE_CARD, STORE_SECTIONS } from "../../content/storefrontContent";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
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
import { FLIGHT_MS, flyToCart, hasCartTarget } from "./flyToCart";
import { markCartFlight } from "../../utils/cartFeedback";
import PressableScale from "./PressableScale";
import { useVariantSheet } from "./VariantSheet";

const AnimatedView = Animated.View;

const WELL_RADIUS = 18;
const WELL_FILL = "#F5F5F5";

// Page dots use fixed dark tones on the light product well.
const DOT_ACTIVE = "#2F4F22";
const DOT_IDLE = "rgba(40, 32, 12, 0.42)";
const DOT_RING = "rgba(255, 255, 255, 0.75)";

function Heart({ active, onPress, lite }) {
  const { c, shadow } = useStoreTheme();
  const scale = useSharedValue(1);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    if (!lite) {
      scale.value = withSequence(withSpring(1.28, { damping: 8, stiffness: 420 }), withSpring(1, { damping: 12 }));
    }
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={active ? STORE_CARD.wishlistRemove : STORE_CARD.wishlistAdd}
      style={styles.heartHit}
    >
      <AnimatedView style={[styles.heart, shadow.soft, { backgroundColor: withAlpha(c.card, 0.94) }, lite ? null : popStyle]}>
        <Ionicons name={active ? "heart" : "heart-outline"} size={16} color={active ? c.danger : c.inkSoft} />
      </AnimatedView>
    </Pressable>
  );
}

/** Gold "1 / 2 / 3" medal pinned to a card's top-left corner (Bestsellers). */
function RankBadge({ rank }) {
  const { c, type } = useStoreTheme();
  return (
    <View
      style={[styles.rank, { borderColor: c.card, backgroundColor: c.gold }]}
      accessible
      accessibilityLabel={STORE_SECTIONS.bestsellers.rankA11y(rank)}
    >
      <Text style={type.display(14, { color: "#3A2A0C", ls: 0, lh: 17 })} allowFontScaling={false}>
        {rank}
      </Text>
    </View>
  );
}

/** "★ 4.8" in a frosted pill on the photo's bottom-left corner. */
function RatingChip({ rating }) {
  const { c, type, shadow } = useStoreTheme();
  return (
    <View style={[styles.rating, shadow.soft, { backgroundColor: withAlpha("#FFFFFF", 0.94) }]}>
      <Ionicons name="star" size={11} color={c.gold} />
      <Text style={type.ui(11.5, "extrabold", "#3A2A0C")}>{rating.toFixed(1)}</Text>
    </View>
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
      <Image
        source={{ uri: uris[0] }}
        style={imageStyle}
        contentFit="contain"
        transition={0}
        cachePolicy="memory-disk"
        recyclingKey={uris[0]}
      />
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
            <Image source={{ uri: item }} style={imageStyle} contentFit="contain" transition={0} cachePolicy="memory-disk" />
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
 * Product tile: a photo on a cream stage (offer badge, heart and rating on it), then the name, size, and a
 * price with the green ADD pill on one line.
 *
 * @param {number} width   tile width in points
 * @param {boolean} gallery swipeable image gallery (use in vertical grids, not horizontal rails)
 * @param {number} rank     gold medal number (Bestsellers)
 * @param {string} hideEta  delivery time to leave out when the product has exactly this one (Home already
 *                          promises it in the header), so only exceptions show on a tile
 */
function ProductCard({ product, width = 172, onPress, gallery = false, rank, hideEta, lite = false, style }) {
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
  const rawEta = getEtaLabel(product);
  const eta = hideEta && rawEta === hideEta ? "" : rawEta;
  const stockHint = getStockHint(product);
  const rating = Number(product.ratingAverage) || 0;
  const showRating = rating >= 3.5 && (Number(product.reviewCount) || 0) > 0 && state === "ready";

  const badge = useMemo(() => {
    if (state === "soon") return { text: STORE_CARD.comingSoon, tone: "soon" };
    if (pricing.discountPct) return { text: STORE_CARD.off(pricing.discountPct), tone: "offer" };
    if (product.badgeText) return { text: String(product.badgeText).toUpperCase(), tone: "brand" };
    return null;
  }, [state, pricing.discountPct, product.badgeText]);

  const wellRef = useRef(null);
  const handleAdd = useCallback(() => {
    if (hasCartTarget()) markCartFlight(FLIGHT_MS + 500); // the flight replaces the "added to bag" toast
    addToCart(productToCartLine(product));
    // Let the product photo hop into the cart button.
    wellRef.current?.measureInWindow?.((x, y, w, h) => flyToCart({ uri: uris[0], from: { x, y, width: w, height: h } }));
  }, [addToCart, product, uris]);
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
  // Narrow tiles (the Shop grid beside its category rail) put the price on its own line and stretch ADD beneath it.
  const stacked = width < 150;
  const priceText = (
    <Text style={type.ui(17, "extrabold", c.ink, { letterSpacing: -0.3 })} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
      {formatINRWhole(pricing.price)}
    </Text>
  );

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      lite={lite}
      style={[
        styles.card,
        lite ? shadow.soft : shadow.card,
        { width, backgroundColor: c.card, borderColor: c.line, borderRadius: r.xl },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={STORE_CARD.a11y.tile(product.name, formatINRWhole(pricing.price))}
    >
      {rank ? <RankBadge rank={rank} /> : null}
      <View ref={wellRef} collapsable={false} style={[styles.well, { width: imageSize, height: imageSize, backgroundColor: c.well || WELL_FILL, borderRadius: WELL_RADIUS }]}>
        <CardImage uris={uris} size={imageSize} gallery={gallery && !lite} dim={dim} c={c} />
        {!lite ? <View style={[StyleSheet.absoluteFill, styles.wellRim]} pointerEvents="none" /> : null}
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
        <Heart active={wished} onPress={handleWish} lite={lite} />
        {showRating && !lite ? <RatingChip rating={rating} /> : null}
        {state === "sold" ? (
          <View style={styles.soldWrap} pointerEvents="none">
            <View style={[styles.soldTag, { backgroundColor: c.glassStrong, borderColor: c.line }]}>
              <Text style={type.ui(11, "bold", c.inkSoft, { letterSpacing: 0.4 })}>{STORE_CARD.outOfStock}</Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.info}>
        <Text style={[type.ui(14, "bold", c.ink), styles.name]} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.unitRow}>
          <Text style={[type.ui(12.5, "semibold", c.inkMute), styles.unit]} numberOfLines={1}>
            {unit}
          </Text>
          {stockHint ? (
            <View style={[styles.stock, { backgroundColor: c.dangerSoft }]}>
              <Text style={type.ui(10.5, "bold", c.danger)}>{stockHint}</Text>
            </View>
          ) : eta ? (
            <View style={styles.meta}>
              <Ionicons name="time-outline" size={12} color={c.inkMute} />
              <Text style={type.ui(11.5, "semibold", c.inkMute)} numberOfLines={1}>
                {eta}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.buyRow, stacked && styles.buyRowStacked]}>
          {stacked ? (
            <View style={styles.priceRow}>
              {pricing.from ? <Text style={type.ui(11, "semibold", c.inkMute)}>{STORE_CARD.from}</Text> : null}
              {priceText}
              {!pricing.from && pricing.mrp ? (
                <Text style={[type.ui(12, "regular", c.inkMute), styles.strike]}>{formatINRWhole(pricing.mrp)}</Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.priceCol}>
              {pricing.from ? (
                <Text style={type.ui(11, "semibold", c.inkMute)}>{STORE_CARD.from}</Text>
              ) : pricing.mrp ? (
                <Text style={[type.ui(12, "regular", c.inkMute), styles.strike]}>{formatINRWhole(pricing.mrp)}</Text>
              ) : null}
              {priceText}
            </View>
          )}
          <AddControl
            block={stacked}
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
  image: { width: "100%", height: "100%" },
  wellRim: { borderRadius: WELL_RADIUS, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.55)" },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    maxWidth: "72%",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
  },
  heartHit: { position: "absolute", top: 6, right: 6 },
  rank: {
    position: "absolute",
    top: -8,
    left: -6,
    zIndex: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  heart: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  rating: {
    position: "absolute",
    left: 8,
    bottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 11,
  },
  dots: {
    position: "absolute",
    bottom: 13,
    right: 10,
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
  info: { paddingHorizontal: 4, paddingTop: 10, gap: 3 },
  name: { lineHeight: 18, minHeight: 36 },
  unitRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6, minHeight: 18 },
  unit: { flexShrink: 1 },
  meta: { flexDirection: "row", alignItems: "center", gap: 3 },
  stock: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7 },
  buyRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 6, marginTop: 6 },
  buyRowStacked: { flexDirection: "column", alignItems: "stretch", gap: 8 },
  priceCol: { flexShrink: 1, minHeight: 36, justifyContent: "flex-end", paddingBottom: 1 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  strike: { textDecorationLine: "line-through" },
});
