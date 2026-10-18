import React, { memo, useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import PremiumProductCard from "../PremiumProductCard";
import useAddToCartAnim from "../../hooks/useAddToCartAnim";
import {
  HOME_SPACE,
  HOME_TYPE,
  homeEditorialInk,
  homeEditorialMuted,
} from "../../theme/homeEditorial";
import { KANKREG_PALETTE, ZEEVAN_GOLD, ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { useTheme } from "../../context/ThemeContext";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { fonts, icon, radius } from "../../theme/tokens";
import { FONT_PRICE } from "../../theme/typographyRoles";
import { formatINRWhole } from "../../utils/currency";
import { SHOP_SCREEN_UI } from "../../content/appContent";
import ComingSoonProductOverlay from "../product/ComingSoonProductOverlay";
import { getComingSoonImageBlurStyle } from "../../utils/comingSoonImageStyle";
import { COMING_SOON_RED } from "../../theme/comingSoonTheme";
import { getImageUriCandidates, getProductThumbImageUri, prefetchProductHeroImage } from "../../utils/image";
import ProgressiveProductImage from "../ui/ProgressiveProductImage";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";

const MAROON = "#B8442F";

const PRODUCT_CARD_CSS_ID = "zeevan-atelier-product-card-v2";
const PRODUCT_CARD_CLASS = "zeevan-product-card";
const PRODUCT_PHOTO_CLASS = "zeevan-product-photo";
const PRODUCT_CTA_CLASS = "zeevan-product-cta";
const PRODUCT_TITLE_CLASS = "zeevan-product-title";

const PRODUCT_IMAGE_ASPECT = 1;

if (Platform.OS === "web") {
  injectWebCssOnce(
    PRODUCT_CARD_CSS_ID,
    `.${PRODUCT_CARD_CLASS} {
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease, border-color 0.3s ease;
  will-change: transform;
}
.${PRODUCT_CARD_CLASS}:hover {
  transform: translateY(-6px);
  box-shadow: 0 24px 48px -26px rgba(36, 68, 36, 0.28);
  border-color: rgba(92, 104, 52, 0.32);
}
.${PRODUCT_PHOTO_CLASS} {
  transition: transform 0.85s cubic-bezier(0.22, 1, 0.36, 1);
}
.${PRODUCT_CARD_CLASS}:hover .${PRODUCT_PHOTO_CLASS} {
  transform: scale(1.06);
}
.${PRODUCT_TITLE_CLASS} {
  transition: color 0.3s ease;
}
.${PRODUCT_CARD_CLASS}:hover .${PRODUCT_TITLE_CLASS} {
  color: ${ZEEVAN_GREEN.deep};
}
.${PRODUCT_CTA_CLASS} {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, transform 0.25s ease;
}
.${PRODUCT_CARD_CLASS}:hover .${PRODUCT_CTA_CLASS}:not([aria-disabled="true"]) {
  background-color: ${ZEEVAN_GREEN.deep};
  border-color: ${ZEEVAN_GREEN.deep};
  color: #FAF8F4;
}
.${PRODUCT_CARD_CLASS}:hover .${PRODUCT_CTA_CLASS}:not([aria-disabled="true"]) * {
  color: #FAF8F4;
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

/** Quiet text link for home catalog section header. */
export function HomeCatalogViewAllLink({ label, onPress }) {
  const { isDark } = useTheme();
  const muted = homeEditorialMuted(isDark);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label}
      style={({ hovered, focused }) => [
        viewAllStyles.wrap,
        hovered && Platform.OS === "web" ? viewAllStyles.wrapHover : null,
        focused && Platform.OS === "web" ? viewAllStyles.wrapFocus : null,
      ]}
    >
      <Text style={[viewAllStyles.label, { color: muted }]}>{label}</Text>
      <Ionicons name="arrow-forward" size={icon.micro} color={muted} />
    </Pressable>
  );
}

const viewAllStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 2,
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  wrapHover: {
    opacity: 0.82,
  },
  wrapFocus: {
    ...Platform.select({
      web: {
        outlineStyle: "solid",
        outlineWidth: 2,
        outlineColor: KANKREG_PALETTE.gold,
        outlineOffset: 2,
        borderRadius: 4,
      },
      default: {},
    }),
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: HOME_TYPE.kicker,
    letterSpacing: 0.2,
  },
});

const HomeEditorialProductCard = memo(function HomeEditorialProductCard({
  product,
  onPress,
  onAddToCart,
  onRemoveFromCart,
  quantity = 0,
  isOutOfStock = false,
  isComingSoon = false,
  comingSoonNote = "",
  imagePriority = "normal",
  featured = false,
}) {
  const { isDark } = useTheme();
  const { isMobileWeb } = useKankregLayout();
  const ink = homeEditorialInk(isDark);
  const muted = homeEditorialMuted(isDark);
  const isWeb = Platform.OS === "web";
  const phoneShop = isWeb && isMobileWeb;
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
        width: isWeb ? (featured ? 960 : 420) : 640,
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

  const ctaLabel = isComingSoon
    ? copy.comingSoon
    : isOutOfStock
      ? copy.soldOut
      : quantity > 0
        ? copy.inBagLabel
        : copy.addLabel;

  return (
    <View
      className={isWeb ? PRODUCT_CARD_CLASS : undefined}
      style={[
        editorialStyles.card,
        featured && editorialStyles.cardFeatured,
        isDark && editorialStyles.cardDark,
        isComingSoon && editorialStyles.cardComingSoon,
        isComingSoon && isDark && editorialStyles.cardComingSoonDark,
      ]}
    >
      <Pressable
        onPressIn={() => prefetchProductHeroImage(primaryImage)}
        onPress={onPress}
        style={({ focused }) => [
          editorialStyles.cardPressable,
          featured && editorialStyles.cardPressableFeatured,
          focused && isWeb ? editorialStyles.cardFocus : null,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Open ${name || "product"}`}
      >
        <View style={[editorialStyles.imageFrame, featured && editorialStyles.imageFrameFeatured]}>
          {imageUri && imageCandidateIndex < imageUris.length ? (
            <ProgressiveProductImage
              uri={imageUri}
              previewUri={getProductThumbImageUri(primaryImage)}
              className={isWeb ? PRODUCT_PHOTO_CLASS : undefined}
              style={[editorialStyles.image, isComingSoon && getComingSoonImageBlurStyle()]}
              contentFit="cover"
              recyclingKey={`${product?.id || "p"}:${imageUri}`}
              onError={() => setImageCandidateIndex((idx) => idx + 1)}
              priority={imagePriority}
              rounded={0}
            />
          ) : (
            <View style={[editorialStyles.imageFallback, isDark && editorialStyles.imageFallbackDark]}>
              <Ionicons name="image-outline" size={icon.md} color={muted} />
            </View>
          )}

          {badge && !isComingSoon && !isOutOfStock ? (
            <View style={[editorialStyles.badge, isDark && editorialStyles.badgeDark]}>
              <Text style={editorialStyles.badgeText}>{badge}</Text>
            </View>
          ) : null}

          {savePct && !unavailable ? (
            <View style={[editorialStyles.savePill, phoneShop && editorialStyles.savePillPhone]}>
              <Text style={[editorialStyles.saveText, phoneShop && editorialStyles.saveTextPhone]}>
                {phoneShop ? `${savePct}% OFF` : `${copy.saveLabel} ${savePct}%`}
              </Text>
            </View>
          ) : null}

          {isComingSoon ? (
            <ComingSoonProductOverlay note={launchNote} compact={false} isDark={isDark} />
          ) : isOutOfStock ? (
            <View style={editorialStyles.soldOutBadge}>
              <Text style={editorialStyles.soldOutText}>{copy.soldOut}</Text>
            </View>
          ) : null}
        </View>

        <View style={[editorialStyles.bodyTop, featured && editorialStyles.bodyTopFeatured]}>
          {(category || unit) ? (
            <Text style={[editorialStyles.meta, { color: muted }]} numberOfLines={1}>
              {[category, unit].filter(Boolean).join(" · ")}
            </Text>
          ) : null}

          <Text
            className={isWeb ? PRODUCT_TITLE_CLASS : undefined}
            style={[
              editorialStyles.title,
              featured && editorialStyles.titleFeatured,
              { color: ink },
            ]}
            numberOfLines={2}
          >
            {name}
          </Text>

          <View style={editorialStyles.priceRow}>
            <Text
              style={[editorialStyles.price, featured && editorialStyles.priceFeatured, { color: ink }]}
              numberOfLines={1}
            >
              {formatINRWhole(safePrice)}
            </Text>
            {listMrp ? (
              <Text
                style={[editorialStyles.mrp, { color: phoneShop ? MAROON : muted }]}
                numberOfLines={1}
              >
                {formatINRWhole(listMrp)}
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>

      <View style={[editorialStyles.bodyActions, featured && editorialStyles.bodyActionsFeatured]}>
        {quantity > 0 ? (
          <View
            style={[editorialStyles.stepper, isDark && editorialStyles.stepperDark]}
            accessibilityRole="adjustable"
            accessibilityLabel={`Quantity ${quantity}`}
          >
            <TouchableOpacity
              onPress={onRemoveFromCart}
              style={editorialStyles.stepBtn}
              accessibilityRole="button"
              accessibilityLabel="Decrease quantity"
              hitSlop={8}
            >
              <Ionicons name="remove" size={icon.sm} color={ink} />
            </TouchableOpacity>
            <Text style={[editorialStyles.stepQty, { color: ink }]}>{quantity}</Text>
            <TouchableOpacity
              onPress={handleAddToCart}
              style={editorialStyles.stepBtn}
              disabled={unavailable}
              accessibilityRole="button"
              accessibilityLabel="Increase quantity"
              hitSlop={8}
            >
              <Ionicons name="add" size={icon.sm} color={ink} />
            </TouchableOpacity>
          </View>
        ) : (
          <Animated.View style={addScaleStyle}>
            <Pressable
              onPress={handleAddToCart}
              disabled={unavailable}
              className={isWeb ? PRODUCT_CTA_CLASS : undefined}
              style={({ hovered }) => [
                editorialStyles.addBtn,
                phoneShop && editorialStyles.addBtnPhone,
                isDark && !phoneShop && editorialStyles.addBtnDark,
                unavailable && editorialStyles.addBtnDisabled,
                isComingSoon && editorialStyles.addBtnComingSoon,
                hovered && isWeb && !unavailable && !phoneShop ? editorialStyles.addBtnHover : null,
              ]}
              accessibilityRole="button"
              accessibilityState={{ disabled: unavailable }}
              accessibilityLabel={
                isComingSoon
                  ? `${name || "Product"} coming soon`
                  : `${copy.addA11y}: ${name || "product"}`
              }
            >
              {!unavailable && !phoneShop ? (
                <Ionicons
                  name="bag-outline"
                  size={icon.xs}
                  color={ink}
                  style={editorialStyles.addIcon}
                />
              ) : null}
              <Text
                style={[
                  editorialStyles.addBtnText,
                  { color: unavailable ? muted : phoneShop ? "#FFFFFF" : ink },
                ]}
              >
                {phoneShop && !unavailable ? "ADD" : ctaLabel}
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
  styles,
  catalogGridColStyle,
  navigation,
  quantity,
  onAddToCart,
  onRemoveFromCart,
  isOutOfStock,
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
        isComingSoon={isComingSoon}
        comingSoonNote={comingSoonNote}
        product={item}
        onPress={() => navigation.navigate("Product", { productId: item.id })}
        quantity={quantity}
        onAddToCart={onAddToCart}
        onRemoveFromCart={onRemoveFromCart}
      />
    );

  return <View style={[styles?.productGridCell, gridCardStyles.cell]}>{card}</View>;
});

const gridCardStyles = StyleSheet.create({
  cell: {
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
  },
});

const editorialStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(36, 68, 36, 0.1)",
    backgroundColor: KANKREG_PALETTE.card,
    overflow: "hidden",
    ...Platform.select({
      web: {
        boxShadow: "0 12px 28px -22px rgba(25, 20, 15, 0.2)",
      },
      default: {},
    }),
  },
  cardFeatured: {},
  cardPressable: {
    width: "100%",
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  cardPressableFeatured: {},
  bodyTop: {
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 4,
  },
  bodyTopFeatured: {
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 4,
  },
  bodyActions: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 6,
  },
  bodyActionsFeatured: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  cardDark: {
    backgroundColor: "#181513",
    borderColor: "#3f3933",
    ...Platform.select({
      web: { boxShadow: "0 10px 28px -22px rgba(0, 0, 0, 0.38)" },
      default: {},
    }),
  },
  cardComingSoon: {
    borderColor: COMING_SOON_RED.cardBorder,
  },
  cardComingSoonDark: {
    borderColor: COMING_SOON_RED.cardBorderDark,
  },
  cardFocus: {
    ...Platform.select({
      web: {
        outlineStyle: "solid",
        outlineWidth: 2,
        outlineColor: KANKREG_PALETTE.gold,
        outlineOffset: 2,
      },
      default: {},
    }),
  },
  imageFrame: {
    width: "100%",
    aspectRatio: PRODUCT_IMAGE_ASPECT,
    overflow: "hidden",
    backgroundColor: KANKREG_PALETTE.paper2,
    position: "relative",
  },
  imageFrameFeatured: {
    aspectRatio: PRODUCT_IMAGE_ASPECT,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
    backgroundColor: "rgba(250, 248, 244, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(36, 68, 36, 0.12)",
  },
  badgeDark: {
    backgroundColor: "rgba(24, 21, 19, 0.88)",
    borderColor: "#3f3933",
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    letterSpacing: 0.1,
    textTransform: "uppercase",
    color: ZEEVAN_GREEN.deep,
  },
  savePill: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
    backgroundColor: ZEEVAN_GOLD.base,
  },
  savePillPhone: {
    top: 8,
    left: 8,
    right: "auto",
    borderRadius: 4,
    backgroundColor: MAROON,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  saveText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.04,
    color: KANKREG_PALETTE.ink,
  },
  saveTextPhone: {
    color: "#FFFFFF",
    fontSize: 10,
    letterSpacing: 0.3,
  },
  addBtnPhone: {
    borderWidth: 0,
    backgroundColor: ZEEVAN_GREEN.deep,
    borderRadius: 8,
    paddingVertical: 10,
  },
  titleFeatured: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    minHeight: 0,
  },
  priceFeatured: {
    fontSize: 14,
  },
  imageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: KANKREG_PALETTE.paper2,
  },
  imageFallbackDark: {
    backgroundColor: "#24201d",
  },
  soldOutBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "rgba(25, 20, 15, 0.72)",
  },
  soldOutText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: "rgba(255, 253, 248, 0.92)",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  meta: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.12,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.1,
    minHeight: 18,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  price: {
    fontFamily: FONT_PRICE,
    fontSize: 14,
    letterSpacing: -0.2,
  },
  mrp: {
    fontFamily: fonts.regular,
    fontSize: 11,
    textDecorationLine: "line-through",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    alignSelf: "stretch",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(36, 68, 36, 0.18)",
    backgroundColor: "transparent",
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  addBtnDark: {
    borderColor: "#3f3933",
  },
  addBtnHover: {
    borderColor: ZEEVAN_GREEN.deep,
    backgroundColor: ZEEVAN_GREEN.deep,
  },
  addBtnDisabled: {
    opacity: 0.55,
  },
  addBtnComingSoon: {
    backgroundColor: COMING_SOON_RED.mid,
    borderColor: COMING_SOON_RED.borderStrong,
    opacity: 1,
  },
  addIcon: {
    marginTop: 1,
  },
  addBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.04,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(36, 68, 36, 0.18)",
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 4,
    backgroundColor: "rgba(92, 104, 52, 0.06)",
  },
  stepperDark: {
    borderColor: "#3f3933",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  stepBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  stepQty: {
    fontFamily: fonts.semibold,
    fontSize: HOME_TYPE.kicker,
    minWidth: 24,
    textAlign: "center",
  },
});
