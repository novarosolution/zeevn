import React, { memo, useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated from "react-native-reanimated";
import PremiumProductCard from "../PremiumProductCard";
import useAddToCartAnim from "../../hooks/useAddToCartAnim";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { WP } from "../../theme/webPremium";
import { useTheme } from "../../context/ThemeContext";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { fonts } from "../../theme/tokens";
import { FONT_HEADING, FONT_PRICE } from "../../theme/typographyRoles";
import { formatINRWhole } from "../../utils/currency";
import { SHOP_SCREEN_UI } from "../../content/appContent";
import { WEB_HOME_PREMIUM } from "../../content/webHomeContent";
import { getComingSoonImageBlurStyle } from "../../utils/comingSoonImageStyle";
import { getImageUriCandidates, getProductThumbImageUri, prefetchProductHeroImage } from "../../utils/image";
import ProgressiveProductImage from "../ui/ProgressiveProductImage";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";
import { ensureWebPremiumCss } from "../../utils/webPremiumCss";
import { WebPillLink } from "./webPremiumParts";

const PRODUCT_CARD_CSS_ID = "zeevan-atelier-product-card-v2";
const PRODUCT_CARD_CLASS = "zeevan-product-card";
const PRODUCT_PHOTO_CLASS = "zeevan-product-photo";
const PRODUCT_CTA_CLASS = "zeevan-product-cta";
const PRODUCT_TITLE_CLASS = "zeevan-product-title";

const PRODUCT_IMAGE_ASPECT = 1;
const STAGE_RADIUS = 16;

if (Platform.OS === "web") {
  ensureWebPremiumCss();
  injectWebCssOnce(
    PRODUCT_CARD_CSS_ID,
    `.${PRODUCT_CARD_CLASS} {
  transition: transform 0.5s ${WP.ease}, box-shadow 0.5s ease, border-color 0.3s ease;
  will-change: transform;
}
.${PRODUCT_CARD_CLASS}:hover {
  transform: translateY(-8px);
  box-shadow: ${WP.shadow.lift};
  border-color: rgba(184, 136, 76, 0.42);
}
.${PRODUCT_PHOTO_CLASS} {
  transition: transform 1.1s ${WP.ease};
}
.${PRODUCT_CARD_CLASS}:hover .${PRODUCT_PHOTO_CLASS} {
  transform: scale(1.07);
}
.${PRODUCT_TITLE_CLASS} {
  transition: color 0.3s ease;
}
.${PRODUCT_CARD_CLASS}:hover .${PRODUCT_TITLE_CLASS} {
  color: ${WP.green.ink};
}
.${PRODUCT_CTA_CLASS} {
  transition: filter 0.3s ease, box-shadow 0.35s ease, transform 0.35s ${WP.ease};
}
.${PRODUCT_CARD_CLASS}:hover .${PRODUCT_CTA_CLASS}:not([aria-disabled="true"]) {
  filter: brightness(1.14) saturate(1.05);
  box-shadow: ${WP.shadow.green};
}
@media (prefers-reduced-motion: reduce) {
  .${PRODUCT_CARD_CLASS}, .${PRODUCT_PHOTO_CLASS}, .${PRODUCT_CTA_CLASS}, .${PRODUCT_TITLE_CLASS} {
    transition: none !important;
  }
  .${PRODUCT_CARD_CLASS}:hover { transform: none; }
  .${PRODUCT_CARD_CLASS}:hover .${PRODUCT_PHOTO_CLASS} { transform: none; }
}`
  );
}

/** "View all" pill for a home catalog section header. */
export function HomeCatalogViewAllLink({ label, onPress }) {
  return <WebPillLink label={label} onPress={onPress} />;
}

/** Soft cream veil + gold "Coming soon" pill over the (blurred) photo of an upcoming product. */
function SoonVeil({ note, compact }) {
  return (
    <View style={styles.soonVeil} pointerEvents="none">
      <View style={[styles.soonPill, compact && styles.soonPillCompact]}>
        <Ionicons name="sparkles" size={compact ? 12 : 14} color={WP.gold.ink} />
        <Text style={[styles.soonPillText, compact && styles.soonPillTextCompact]} numberOfLines={1}>
          {SHOP_SCREEN_UI.card.comingSoon}
        </Text>
      </View>
      {note ? (
        <Text style={[styles.soonNote, compact && styles.soonNoteCompact]} numberOfLines={2}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

const HomeEditorialProductCard = memo(function HomeEditorialProductCard({
  product,
  onPress,
  onAddToCart,
  onRemoveFromCart,
  quantity = 0,
  isOutOfStock = false,
  isAvailableAtCounter = false,
  isComingSoon = false,
  comingSoonNote = "",
  imagePriority = "normal",
  featured = false,
}) {
  const { isDark } = useTheme();
  const { isMobileWeb } = useKankregLayout();
  // Tight columns (the Shop grid beside its filter rail) get the compact type and a one-word ADD.
  const [cardWidth, setCardWidth] = useState(0);
  const narrow = cardWidth > 0 && cardWidth < 200;
  const compact = isMobileWeb || narrow;
  const isWeb = Platform.OS === "web";
  const ink = isDark ? WP.cream : WP.ink;
  const muted = isDark ? "rgba(250, 248, 244, 0.6)" : WP.inkFaint;
  const meta = isDark ? WP.gold.bright : WP.gold.deep;
  const copy = SHOP_SCREEN_UI.card;

  const primaryImage = useMemo(() => {
    if (String(product?.image || "").trim()) return product.image;
    if (Array.isArray(product?.images) && product.images.length) {
      return String(product.images[0] || "");
    }
    return "";
  }, [product?.image, product?.images]);

  const imageUris = useMemo(
    () =>
      getImageUriCandidates(primaryImage, {
        width: isWeb ? (featured ? 960 : 520) : 640,
        quality: isWeb ? "auto:eco" : "auto:good",
      }),
    [featured, isWeb, primaryImage]
  );
  const [imageCandidateIndex, setImageCandidateIndex] = useState(0);
  const imageUri = imageUris[imageCandidateIndex] || "";

  useEffect(() => {
    setImageCandidateIndex(0);
  }, [primaryImage]);

  const safePrice = useMemo(() => {
    const n = Number(product?.price);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }, [product?.price]);

  const listMrp = useMemo(() => {
    const n = product?.mrp != null ? Number(product.mrp) : NaN;
    return Number.isFinite(n) && n > safePrice ? n : null;
  }, [product?.mrp, safePrice]);

  const savePct = useMemo(() => {
    if (!listMrp) return null;
    return Math.max(1, Math.round(((listMrp - safePrice) / listMrp) * 100));
  }, [listMrp, safePrice]);

  const launchNote = String(comingSoonNote || copy.comingSoonNoteFallback).trim();
  const unavailable = isComingSoon || isOutOfStock;
  const { trigger: triggerAddAnim, scaleStyle: addScaleStyle } = useAddToCartAnim();

  const handleAddToCart = () => {
    if (unavailable) return;
    triggerAddAnim();
    onAddToCart?.();
  };

  const category = String(product?.category || "").trim();
  const unit = String(product?.unit || "").trim();
  const badge = String(product?.badgeText || (featured ? copy.featuredBadge : "")).trim();
  const name = String(product?.name || "").trim();
  const ratingAvg = Number(product?.ratingAverage ?? product?.rating ?? 0) || 0;
  const reviewCount = Number(product?.reviewCount ?? 0) || 0;
  const showRating = ratingAvg > 0 && !unavailable;

  const ctaLabel = isComingSoon
    ? copy.comingSoon
    : isOutOfStock
      ? copy.soldOut
      : narrow
        ? WEB_HOME_PREMIUM.card.addShort
        : copy.addLabel;

  return (
    <View
      className={isWeb ? PRODUCT_CARD_CLASS : undefined}
      onLayout={(e) => {
        const next = Math.round(e.nativeEvent.layout.width);
        if (next !== cardWidth) setCardWidth(next);
      }}
      style={[styles.card, compact && styles.cardCompact, isDark && styles.cardDark]}
    >
      <Pressable
        onPressIn={() => prefetchProductHeroImage(primaryImage)}
        onPress={onPress}
        style={({ focused }) => [styles.cardPressable, focused && isWeb ? styles.cardFocus : null]}
        accessibilityRole="button"
        accessibilityLabel={`Open ${name || "product"}`}
      >
        <View style={[styles.stage, isDark && styles.stageDark]}>
          {imageUri && imageCandidateIndex < imageUris.length ? (
            <ProgressiveProductImage
              uri={imageUri}
              previewUri={getProductThumbImageUri(primaryImage)}
              className={isWeb ? PRODUCT_PHOTO_CLASS : undefined}
              style={[
                styles.image,
                isOutOfStock && { opacity: 0.45 },
                isComingSoon && getComingSoonImageBlurStyle(),
              ]}
              contentFit="cover"
              recyclingKey={`${product?.id || "p"}:${imageUri}`}
              onError={() => setImageCandidateIndex((idx) => idx + 1)}
              priority={imagePriority}
              rounded={0}
            />
          ) : (
            <View style={[styles.imageFallback, isDark && styles.imageFallbackDark]}>
              <Ionicons name="image-outline" size={30} color={muted} />
            </View>
          )}

          {savePct && !unavailable ? (
            <View style={[styles.sale, compact && styles.saleCompact]}>
              <Text style={[styles.saleText, compact && styles.saleTextCompact]}>{`${savePct}% OFF`}</Text>
            </View>
          ) : null}

          {badge && !unavailable ? (
            <View style={[styles.badge, savePct && styles.badgeBelowSale, compact && styles.badgeCompact]}>
              <Text style={[styles.badgeText, compact && styles.badgeTextCompact]} numberOfLines={1}>
                {badge}
              </Text>
            </View>
          ) : null}

          {showRating ? (
            <View style={[styles.rating, compact && styles.ratingCompact]}>
              <Ionicons name="star" size={compact ? 11 : 12} color={WP.gold.deep} />
              <Text style={styles.ratingText}>{ratingAvg.toFixed(1)}</Text>
              {reviewCount > 0 && !compact ? <Text style={styles.ratingCount}>({reviewCount})</Text> : null}
            </View>
          ) : null}

          {isComingSoon ? (
            <SoonVeil note={launchNote} compact={compact} />
          ) : isOutOfStock ? (
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>{isAvailableAtCounter ? "Available at the shop counter" : copy.soldOut}</Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.body, compact && styles.bodyCompact]}>
          <Text style={[styles.meta, { color: meta }]} numberOfLines={1}>
            {[category, unit].filter(Boolean).join(" · ").toUpperCase() || " "}
          </Text>

          <Text
            className={isWeb ? PRODUCT_TITLE_CLASS : undefined}
            style={[
              styles.title,
              compact && styles.titleCompact,
              featured && styles.titleFeatured,
              { color: ink },
            ]}
            numberOfLines={2}
          >
            {name}
          </Text>

          <View style={styles.priceRow}>
            <Text style={[styles.price, compact && styles.priceCompact, { color: ink }]} numberOfLines={1}>
              {formatINRWhole(safePrice)}
            </Text>
            {listMrp ? (
              <Text style={[styles.mrp, { color: muted }]} numberOfLines={1}>
                {formatINRWhole(listMrp)}
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>

      <View style={[styles.actions, compact && styles.actionsCompact]}>
        {quantity > 0 && !unavailable ? (
          <View
            style={[styles.stepper, compact && styles.ctaCompact]}
            accessibilityRole="adjustable"
            accessibilityLabel={`Quantity ${quantity}`}
          >
            <TouchableOpacity
              onPress={onRemoveFromCart}
              style={styles.stepBtn}
              accessibilityRole="button"
              accessibilityLabel="Decrease quantity"
              hitSlop={8}
            >
              <Ionicons name="remove" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.stepQty}>{quantity}</Text>
            <TouchableOpacity
              onPress={handleAddToCart}
              style={styles.stepBtn}
              accessibilityRole="button"
              accessibilityLabel="Increase quantity"
              hitSlop={8}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <Animated.View style={addScaleStyle}>
            <Pressable
              onPress={handleAddToCart}
              disabled={unavailable}
              className={isWeb ? `${PRODUCT_CTA_CLASS}${unavailable ? "" : " zv-btn"}` : undefined}
              style={[
                styles.cta,
                compact && styles.ctaCompact,
                isOutOfStock && styles.ctaSoldOut,
                isComingSoon && styles.ctaSoon,
              ]}
              accessibilityRole="button"
              accessibilityState={{ disabled: unavailable }}
              accessibilityLabel={
                isComingSoon ? `${name || "Product"} coming soon` : `${copy.addA11y}: ${name || "product"}`
              }
            >
              {!unavailable ? <Ionicons name="add" size={18} color="#FFFFFF" /> : null}
              <Text
                numberOfLines={1}
                style={[
                  styles.ctaText,
                  compact && styles.ctaTextCompact,
                  isOutOfStock && { color: isDark ? "rgba(250,248,244,0.5)" : "#8C8672" },
                  isComingSoon && { color: isDark ? WP.gold.bright : WP.gold.deep },
                ]}
              >
                {ctaLabel}
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </View>
  );
});

/** Grid cell for responsive catalog layout (memoized). */
export const HomeCatalogGridCard = memo(function HomeCatalogGridCard({
  item,
  idx,
  styles: gridStyles,
  navigation,
  quantity,
  onAddToCart,
  onRemoveFromCart,
  isOutOfStock,
  isAvailableAtCounter = false,
  isComingSoon = false,
  comingSoonNote = "",
  compact = false,
  variant = "default",
  featured = false,
}) {
  const card =
    variant === "editorial" && Platform.OS === "web" ? (
      <HomeEditorialProductCard
        product={item}
        featured={featured}
        imagePriority={idx < 2 || featured ? "high" : "low"}
        isOutOfStock={isOutOfStock}
        isAvailableAtCounter={isAvailableAtCounter}
        isComingSoon={isComingSoon}
        comingSoonNote={comingSoonNote}
        quantity={quantity}
        onPress={() => navigation.navigate("Product", { productId: item.id })}
        onAddToCart={onAddToCart}
        onRemoveFromCart={onRemoveFromCart}
      />
    ) : (
      <PremiumProductCard
        index={idx}
        compact={compact}
        imagePriority={idx < 2 ? "high" : "low"}
        isOutOfStock={isOutOfStock}
        isAvailableAtCounter={isAvailableAtCounter}
        isComingSoon={isComingSoon}
        comingSoonNote={comingSoonNote}
        product={item}
        onPress={() => navigation.navigate("Product", { productId: item.id })}
        quantity={quantity}
        onAddToCart={onAddToCart}
        onRemoveFromCart={onRemoveFromCart}
      />
    );

  return <View style={[gridStyles?.productGridCell, gridCardStyles.cell]}>{card}</View>;
});

const gridCardStyles = StyleSheet.create({
  cell: {
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
  },
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(36, 68, 36, 0.08)",
    backgroundColor: KANKREG_PALETTE.card,
    overflow: "hidden",
    ...Platform.select({ web: { boxShadow: WP.shadow.card }, default: {} }),
  },
  cardCompact: { padding: 8, borderRadius: 18 },
  cardDark: {
    backgroundColor: "#181513",
    borderColor: "#3f3933",
    ...Platform.select({ web: { boxShadow: "0 10px 28px -22px rgba(0, 0, 0, 0.5)" }, default: {} }),
  },
  cardPressable: {
    width: "100%",
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  cardFocus: {
    ...Platform.select({
      web: { outlineStyle: "solid", outlineWidth: 2, outlineColor: WP.gold.base, outlineOffset: 2 },
      default: {},
    }),
  },

  stage: {
    width: "100%",
    aspectRatio: PRODUCT_IMAGE_ASPECT,
    borderRadius: STAGE_RADIUS,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#F5F5F5",
    ...Platform.select({ web: { backgroundImage: WP.gradient.stage }, default: {} }),
  },
  stageDark: {
    backgroundColor: "#24201d",
    ...Platform.select({ web: { backgroundImage: "linear-gradient(180deg, #2a2420 0%, #1c1815 100%)" }, default: {} }),
  },
  image: { width: "100%", height: "100%" },
  imageFallback: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: KANKREG_PALETTE.paper2 },
  imageFallbackDark: { backgroundColor: "#24201d" },

  sale: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: WP.radius.pill,
    ...Platform.select({
      web: { backgroundImage: WP.gradient.gold, boxShadow: "0 6px 14px -6px rgba(120, 82, 28, 0.6)" },
      default: { backgroundColor: WP.gold.base },
    }),
  },
  saleCompact: { top: 8, left: 8, paddingVertical: 4, paddingHorizontal: 8 },
  saleText: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.7, color: WP.gold.ink },
  saleTextCompact: { fontSize: 9.5, letterSpacing: 0.5 },
  badge: {
    position: "absolute",
    top: 12,
    left: 12,
    maxWidth: "78%",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: WP.radius.pill,
    backgroundColor: "rgba(250, 248, 244, 0.94)",
  },
  badgeBelowSale: { top: 44 },
  badgeCompact: { top: 8, left: 8, paddingVertical: 3, paddingHorizontal: 7 },
  badgeText: { fontFamily: fonts.bold, fontSize: 9.5, letterSpacing: 0.7, textTransform: "uppercase", color: WP.green.ink },
  badgeTextCompact: { fontSize: 8.5, letterSpacing: 0.4 },
  rating: {
    position: "absolute",
    left: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: WP.radius.pill,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    ...Platform.select({ web: { boxShadow: "0 6px 16px -8px rgba(0, 0, 0, 0.35)" }, default: {} }),
  },
  ratingCompact: { left: 8, bottom: 8, paddingVertical: 3, paddingHorizontal: 7 },
  ratingText: { fontFamily: fonts.bold, fontSize: 12.5, color: "#2E2208" },
  ratingCount: { fontFamily: fonts.regular, fontSize: 11.5, color: "#7A7460" },

  soonVeil: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
    ...Platform.select({
      web: {
        backgroundImage:
          "linear-gradient(180deg, rgba(31,51,31,0.46) 0%, rgba(31,51,31,0.62) 100%)",
      },
      default: { backgroundColor: "rgba(31,51,31,0.5)" },
    }),
  },
  soonPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: WP.radius.pill,
    ...Platform.select({
      web: { backgroundImage: WP.gradient.gold, boxShadow: WP.shadow.gold },
      default: { backgroundColor: WP.gold.base },
    }),
  },
  soonPillCompact: { paddingVertical: 6, paddingHorizontal: 11, gap: 5 },
  soonPillText: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: WP.gold.ink },
  soonPillTextCompact: { fontSize: 10, letterSpacing: 0.8 },
  soonNote: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 17,
    textAlign: "center",
    maxWidth: 200,
    color: "rgba(250, 248, 244, 0.92)",
  },
  soonNoteCompact: { fontSize: 10.5, lineHeight: 14, maxWidth: 140 },
  soldOutBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: WP.radius.pill,
    backgroundColor: "rgba(25, 20, 15, 0.78)",
  },
  soldOutText: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(255, 253, 248, 0.95)",
  },

  body: { paddingHorizontal: 6, paddingTop: 14, gap: 7 },
  bodyCompact: { paddingHorizontal: 3, paddingTop: 10, gap: 5 },
  meta: { fontFamily: fonts.bold, fontSize: 10.5, lineHeight: 14, letterSpacing: 1.6 },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: -0.25,
    minHeight: 46,
  },
  titleCompact: { fontSize: 15, lineHeight: 19, minHeight: 38 },
  titleFeatured: { fontSize: 20, lineHeight: 25 },
  priceRow: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", columnGap: 8, rowGap: 2 },
  price: { fontFamily: FONT_PRICE, fontSize: 21, letterSpacing: -0.4 },
  priceCompact: { fontSize: 17 },
  mrp: { fontFamily: fonts.regular, fontSize: 13.5, textDecorationLine: "line-through" },

  actions: { paddingHorizontal: 4, paddingTop: 12, paddingBottom: 4 },
  actionsCompact: { paddingHorizontal: 2, paddingTop: 9 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    gap: 6,
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: WP.radius.pill,
    ...Platform.select({
      web: { backgroundImage: WP.gradient.green, boxShadow: "0 10px 22px -14px rgba(31, 51, 31, 0.7)", cursor: "pointer" },
      default: { backgroundColor: WP.green.deep },
    }),
  },
  ctaCompact: { minHeight: 40 },
  ctaSoldOut: {
    backgroundColor: "rgba(36, 68, 36, 0.08)",
    ...Platform.select({ web: { backgroundImage: "none", boxShadow: "none", cursor: "not-allowed" }, default: {} }),
  },
  ctaSoon: {
    backgroundColor: "rgba(212, 165, 116, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(184, 136, 76, 0.55)",
    ...Platform.select({ web: { backgroundImage: "none", boxShadow: "none", cursor: "default" }, default: {} }),
  },
  ctaText: { fontFamily: fonts.bold, fontSize: 14, letterSpacing: 1, textTransform: "uppercase", color: "#FFFFFF" },
  ctaTextCompact: { fontSize: 12.5, letterSpacing: 0.7 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    justifyContent: "space-between",
    minHeight: 46,
    paddingHorizontal: 6,
    borderRadius: WP.radius.pill,
    ...Platform.select({
      web: { backgroundImage: WP.gradient.green, boxShadow: "0 10px 22px -14px rgba(31, 51, 31, 0.7)" },
      default: { backgroundColor: WP.green.deep },
    }),
  },
  stepBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  stepQty: { fontFamily: fonts.bold, fontSize: 16, minWidth: 28, textAlign: "center", color: "#FFFFFF" },
});
