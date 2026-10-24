import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from "react-native-reanimated";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { STORE_CARD, STORE_SECTIONS } from "../../content/storefrontContent";
import { pickRange, useStoreTheme, withAlpha } from "../../theme/storefront";
import { formatINRWhole } from "../../utils/currency";
import { hapticTap } from "../../utils/haptics";
import { getProductCardFlags } from "../../utils/productAvailability";
import { productToCartLine } from "../../utils/productCart";
import {
  getEtaLabel,
  getProductLine,
  getProductPricing,
  getStockHint,
  getUnitLabel,
  productGalleryUris,
  productImageSource,
  productImageUri,
} from "../../utils/storefront";
import AddControl from "./AddControl";
import { FLIGHT_MS, flyToCart, hasCartTarget } from "./flyToCart";
import { markCartFlight } from "../../utils/cartFeedback";
import PressableScale from "./PressableScale";
import { canBlend } from "./RangeTiles";
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
    <PressableScale scaleTo={0.88} lite
      onPress={handlePress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={active ? STORE_CARD.wishlistRemove : STORE_CARD.wishlistAdd}
      style={styles.heartHit}
    >
      <AnimatedView style={[styles.heart, shadow.soft, { backgroundColor: withAlpha(c.card, 0.94) }, lite ? null : popStyle]}>
        <Ionicons name={active ? "heart" : "heart-outline"} size={16} color={active ? c.danger : c.inkSoft} />
      </AnimatedView>
    </PressableScale>
  );
}

/** Gold "1 / 2 / 3" medal pinned to a card's top-left corner (Bestsellers). */
function RankBadge({ rank, compact, end }) {
  const { c, type } = useStoreTheme();
  const size = compact ? 22 : 28;
  return (
    <View
      style={[
        styles.rank,
        end ? { right: 6 } : { left: 6 },
        { width: size, height: size, borderRadius: size / 2, borderColor: c.card, backgroundColor: c.gold },
      ]}
      accessible
      accessibilityLabel={STORE_SECTIONS.bestsellers.rankA11y(rank)}
    >
      <Text style={type.display(compact ? 12 : 14, { color: "#3A2A0C", ls: 0, lh: compact ? 14 : 17 })} allowFontScaling={false}>
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

/**
 * Image block: single image, or a swipeable gallery with page dots (grid cards only). With `blend` the photo's white
 * studio backdrop dissolves into the tinted well behind it (multiply), so the jar looks printed on the card.
 */
function CardImage({ uris, source, size, gallery, dim, c, blend }) {
  const [index, setIndex] = useState(0);
  const onEnd = useCallback(
    (e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / Math.max(size, 1))),
    [size]
  );

  const first = source || (uris[0] ? { uri: uris[0] } : null);
  if (!first) {
    return (
      <View style={[styles.placeholder, { backgroundColor: c.soft }]}>
        <MaterialCommunityIcons name="image-outline" size={34} color={c.inkMute} />
      </View>
    );
  }

  const imageStyle = [styles.image, dim && { opacity: 0.42 }];
  const blendStyle = blend ? styles.blend : null;

  if (!gallery || uris.length < 2) {
    return (
      <View style={[StyleSheet.absoluteFill, blendStyle]}>
        <Image
          source={first}
          style={imageStyle}
          contentFit="contain"
          transition={0}
          cachePolicy="memory-disk"
          recyclingKey={typeof first === "number" ? String(first) : first.uri || uris[0]}
        />
      </View>
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
          <View style={[{ width: size, height: size }, blendStyle]}>
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
  const { c, r, type, shadow, isDark } = useStoreTheme();
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
  const coverSource = useMemo(() => productImageSource(product, imageSize), [product, imageSize]);
  const wished = wishlist.has(product.id);
  const unit = getUnitLabel(product);
  const rawEta = getEtaLabel(product);
  const eta = hideEta ? "" : rawEta;
  const stockHint = getStockHint(product);
  const rating = Number(product.ratingAverage) || 0;
  const showRating = rating >= 3.5 && (Number(product.reviewCount) || 0) > 0 && state === "ready";

  const badge = useMemo(() => {
    if (state === "soon") return { text: STORE_CARD.comingSoon, tone: "soon" };
    if (pricing.discountPct) return { text: STORE_CARD.off(pricing.discountPct), tone: "offer" };
    if (product.badgeText) return { text: String(product.badgeText).toUpperCase(), tone: "brand" };
    return null;
  }, [state, pricing.discountPct, product.badgeText]);

  // Light mode: the well takes its range's wash and the photo blends into it; dark mode keeps the cream well.
  const blend = useMemo(() => canBlend(isDark), [isDark]);
  const range = useMemo(() => pickRange(c, getProductLine(product)), [c, product]);

  const wellRef = useRef(null);
  const handleAdd = useCallback(() => {
    if (hasCartTarget()) markCartFlight(FLIGHT_MS + 500);
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
  const stacked = width < 150;
  const compact = stacked || lite;
  const priceSize = stacked ? 16 : 19;
  const wellSize = stacked ? width : imageSize;
  const wellRadius = stacked ? r.lg : WELL_RADIUS;
  const priceText = (
    <Text style={type.display(priceSize, { color: c.ink, ls: -0.35, lh: stacked ? 19 : 23 })} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
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
        compact ? shadow.soft : shadow.card,
        {
          width,
          backgroundColor: c.card,
          borderColor: compact ? withAlpha(c.gold, isDark ? 0.16 : 0.18) : c.goldLine,
          borderRadius: stacked ? r.lg : r.xl,
          paddingTop: stacked ? 0 : 8,
          paddingHorizontal: stacked ? 0 : 8,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={STORE_CARD.a11y.tile(product.name, formatINRWhole(pricing.price))}
    >
      {rank ? <RankBadge rank={rank} compact={compact} end={compact && Boolean(badge)} /> : null}
      <View
        ref={wellRef}
        collapsable={false}
        style={[
          styles.well,
          {
            width: wellSize,
            height: wellSize,
            backgroundColor: blend ? range.wash[1] : c.well || WELL_FILL,
            borderRadius: stacked ? 0 : wellRadius,
            borderTopLeftRadius: wellRadius,
            borderTopRightRadius: wellRadius,
          },
        ]}
      >
        {blend ? <LinearGradient colors={range.wash} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" /> : null}
        <CardImage uris={uris} source={coverSource} size={wellSize} gallery={gallery && !lite} dim={dim} c={c} blend={blend} />
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.wellRim,
            { borderRadius: stacked ? 0 : wellRadius, borderTopLeftRadius: wellRadius, borderTopRightRadius: wellRadius },
          ]}
          pointerEvents="none"
        />
        {badge ? (
          <View style={[styles.badge, compact && styles.badgeCompact, { backgroundColor: badgeColors.bg }]}>
            <Text
              style={type.ui(compact || badge.text.length > 9 ? 8 : 9.5, "extrabold", badgeColors.fg, { letterSpacing: 0.3 })}
              numberOfLines={1}
            >
              {badge.text}
            </Text>
          </View>
        ) : null}
        {!compact ? <Heart active={wished} onPress={handleWish} lite={lite} /> : null}
        {showRating && !compact ? <RatingChip rating={rating} /> : null}
        {state === "sold" ? (
          <View style={styles.soldWrap} pointerEvents="none">
            <View style={[styles.soldTag, { backgroundColor: c.glassStrong, borderColor: c.line }]}>
              <Text style={type.ui(11, "bold", c.inkSoft, { letterSpacing: 0.4 })}>{STORE_CARD.outOfStock}</Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={[styles.info, stacked && styles.infoStacked]}>
        <Text style={[type.ui(stacked ? 12.5 : 14, "bold", c.ink, { letterSpacing: stacked ? 0.05 : 0 }), stacked ? styles.nameCompact : styles.name]} numberOfLines={2}>
          {product.name}
        </Text>

        {unit || stockHint || eta ? (
          <View style={styles.unitRow}>
            {unit ? (
              <Text style={[type.ui(stacked ? 11 : 12.5, "semibold", c.inkMute), styles.unit]} numberOfLines={1}>
                {unit}
              </Text>
            ) : null}
            {stockHint ? (
              <View style={[styles.stock, { backgroundColor: c.dangerSoft }]}>
                <Text style={type.ui(10, "bold", c.danger)}>{stockHint}</Text>
              </View>
            ) : eta && !stacked ? (
              <View style={styles.meta}>
                <Ionicons name="time-outline" size={12} color={c.inkMute} />
                <Text style={type.ui(11.5, "semibold", c.inkMute)} numberOfLines={1}>
                  {eta}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={[styles.buyRow, stacked && styles.buyRowStacked]}>
          {stacked ? (
            <View style={styles.priceRow}>
              {pricing.from ? <Text style={type.ui(10, "semibold", c.inkMute)}>{STORE_CARD.from}</Text> : null}
              {priceText}
              {!pricing.from && pricing.mrp ? (
                <Text style={[type.ui(10.5, "regular", c.inkMute), styles.strike]}>{formatINRWhole(pricing.mrp)}</Text>
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
            compact
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
    paddingBottom: 10,
    overflow: "hidden",
  },
  well: { overflow: "hidden", alignSelf: "center" },
  image: { width: "100%", height: "100%" },
  blend: { mixBlendMode: "multiply" },
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
  badgeCompact: { top: 6, left: 6, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 7, maxWidth: "80%" },
  heartHit: { position: "absolute", top: 6, right: 6 },
  rank: {
    position: "absolute",
    top: 6,
    zIndex: 6,
    borderWidth: 2,
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
  infoStacked: { paddingHorizontal: 8, paddingTop: 8, gap: 2 },
  name: { lineHeight: 18, minHeight: 36 },
  nameCompact: { lineHeight: 16, minHeight: 32 },
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
