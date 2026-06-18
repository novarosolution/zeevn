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
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { useTheme } from "../../context/ThemeContext";
import { fonts, icon, radius } from "../../theme/tokens";
import { formatINRWhole } from "../../utils/currency";
import { SHOP_SCREEN_UI } from "../../content/appContent";
import ComingSoonProductOverlay from "../product/ComingSoonProductOverlay";
import { getComingSoonImageBlurStyle } from "../../utils/comingSoonImageStyle";
import { COMING_SOON_RED } from "../../theme/comingSoonTheme";
import { getImageUriCandidates, getProductThumbImageUri, prefetchProductHeroImage } from "../../utils/image";
import ProgressiveProductImage from "../ui/ProgressiveProductImage";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";

const PRODUCT_CARD_CSS_ID = "kankreg-home-product-card";
const PRODUCT_CARD_CLASS = "kankreg-product-card";
const PRODUCT_PHOTO_CLASS = "kankreg-product-photo";

const PRODUCT_IMAGE_ASPECT = 1;

if (Platform.OS === "web") {
  injectWebCssOnce(
    PRODUCT_CARD_CSS_ID,
    `.${PRODUCT_CARD_CLASS} {
  transition: transform 0.38s ease, box-shadow 0.38s ease;
}
.${PRODUCT_CARD_CLASS}:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 40px -26px rgba(25, 20, 15, 0.26);
}
.${PRODUCT_PHOTO_CLASS} {
  transition: transform 0.6s ease-out;
}
.${PRODUCT_CARD_CLASS}:hover .${PRODUCT_PHOTO_CLASS} {
  transform: scale(1.03);
}
@media (prefers-reduced-motion: reduce) {
  .${PRODUCT_CARD_CLASS}, .${PRODUCT_PHOTO_CLASS} { transition: none !important; }
  .${PRODUCT_CARD_CLASS}:hover { transform: none; box-shadow: 0 8px 22px -18px rgba(25, 20, 15, 0.16); }
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
}) {
  const { isDark } = useTheme();
  const ink = homeEditorialInk(isDark);
  const muted = homeEditorialMuted(isDark);
  const isWeb = Platform.OS === "web";

  const primaryImage = useMemo(() => {
    if (String(product?.image || "").trim()) return product.image;
    if (Array.isArray(product?.images) && product.images.length) {
      return String(product.images[0] || "");
    }
    return "";
  }, [product?.image, product?.images]);

  const imageUris = useMemo(
    () => getImageUriCandidates(primaryImage, { width: isWeb ? 360 : 640, quality: isWeb ? "auto:eco" : "auto:good" }),
    [isWeb, primaryImage]
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

  const launchNote = String(comingSoonNote || SHOP_SCREEN_UI.card.comingSoonNoteFallback).trim();
  const unavailable = isComingSoon || isOutOfStock;
  const { trigger: triggerAddAnim, scaleStyle: addScaleStyle } = useAddToCartAnim();

  const handleAddToCart = () => {
    if (unavailable) return;
    triggerAddAnim();
    onAddToCart?.();
  };

  const metaLine = useMemo(() => {
    const parts = [];
    if (product?.category) parts.push(String(product.category));
    if (product?.unit) parts.push(String(product.unit));
    return parts.join(" · ");
  }, [product?.category, product?.unit]);

  return (
    <View
      className={isWeb ? PRODUCT_CARD_CLASS : undefined}
      style={[
        editorialStyles.card,
        isDark && editorialStyles.cardDark,
        isComingSoon && editorialStyles.cardComingSoon,
        isComingSoon && isDark && editorialStyles.cardComingSoonDark,
      ]}
    >
      <Pressable
        onPressIn={() => prefetchProductHeroImage(primaryImage)}
        onPress={onPress}
        style={({ focused }) => [editorialStyles.cardPressable, focused && isWeb ? editorialStyles.cardFocus : null]}
        accessibilityRole="button"
        accessibilityLabel={`Open ${product?.name || "product"}`}
      >
        <View style={editorialStyles.imageFrame}>
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
              rounded={12}
            />
          ) : (
            <View style={[editorialStyles.imageFallback, isDark && editorialStyles.imageFallbackDark]}>
              <Ionicons name="image-outline" size={icon.md} color={muted} />
            </View>
          )}
          {isComingSoon ? (
            <ComingSoonProductOverlay note={launchNote} compact={false} isDark={isDark} />
          ) : isOutOfStock ? (
            <View style={editorialStyles.soldOutBadge}>
              <Text style={editorialStyles.soldOutText}>Sold out</Text>
            </View>
          ) : null}
        </View>

        <View style={editorialStyles.bodyTop}>
          {metaLine ? (
            <Text style={[editorialStyles.meta, { color: muted }]} numberOfLines={1}>
              {metaLine}
            </Text>
          ) : null}
          <Text style={[editorialStyles.title, { color: ink }]} numberOfLines={2}>
            {product?.name || ""}
          </Text>
          <View style={editorialStyles.priceRow}>
            <Text style={[editorialStyles.price, { color: ink }]} numberOfLines={1}>
              {formatINRWhole(safePrice)}
            </Text>
            {listMrp ? (
              <Text style={[editorialStyles.mrp, { color: muted }]} numberOfLines={1}>
                {formatINRWhole(listMrp)}
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>

      <View style={editorialStyles.bodyActions}>
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
            style={({ hovered }) => [
              editorialStyles.addBtn,
              isDark && editorialStyles.addBtnDark,
              unavailable && editorialStyles.addBtnDisabled,
              isComingSoon && editorialStyles.addBtnComingSoon,
              hovered && isWeb && !unavailable ? editorialStyles.addBtnHover : null,
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              isComingSoon
                ? `${product?.name || "Product"} coming soon`
                : `Add ${product?.name || "product"} to cart`
            }
          >
            <Text style={[editorialStyles.addBtnText, { color: unavailable ? muted : ink }]}>
              {isComingSoon ? SHOP_SCREEN_UI.card.comingSoon : isOutOfStock ? "Unavailable" : "Add to cart"}
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
}) {
  const card = (
    variant === "editorial" && Platform.OS === "web" ? (
      <HomeEditorialProductCard
        product={item}
        imagePriority={idx < 2 ? "high" : "low"}
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
    )
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
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KANKREG_PALETTE.line,
    backgroundColor: KANKREG_PALETTE.card,
    overflow: "hidden",
    ...Platform.select({
      web: {
        boxShadow: "0 8px 22px -18px rgba(25, 20, 15, 0.16)",
      },
      default: {},
    }),
  },
  cardPressable: {
    width: "100%",
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  bodyTop: {
    paddingHorizontal: HOME_SPACE.md,
    paddingTop: HOME_SPACE.sm + 2,
    gap: HOME_SPACE.xs,
  },
  bodyActions: {
    paddingHorizontal: HOME_SPACE.md,
    paddingBottom: HOME_SPACE.md,
    paddingTop: HOME_SPACE.xs,
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
    ...Platform.select({
      web: {
        boxShadow:
          "0 18px 44px rgba(127, 29, 29, 0.14), 0 0 0 1px rgba(220, 38, 38, 0.12), inset 0 1px 0 rgba(255,255,255,0.92)",
      },
      default: {},
    }),
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
  image: {
    width: "100%",
    height: "100%",
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
    top: HOME_SPACE.sm,
    left: HOME_SPACE.sm,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: "rgba(25, 20, 15, 0.62)",
  },
  soldOutText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: "rgba(255, 253, 248, 0.92)",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  body: {
    paddingHorizontal: HOME_SPACE.md,
    paddingTop: HOME_SPACE.sm + 2,
    paddingBottom: HOME_SPACE.md,
    gap: HOME_SPACE.xs,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.25,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: HOME_TYPE.kicker,
    lineHeight: HOME_TYPE.body.lineHeight,
    letterSpacing: -0.1,
    minHeight: HOME_TYPE.body.lineHeight * 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: HOME_SPACE.xs,
    marginTop: 2,
  },
  price: {
    fontFamily: fonts.bold,
    fontSize: HOME_TYPE.kicker + 1,
    letterSpacing: -0.2,
  },
  mrp: {
    fontFamily: fonts.regular,
    fontSize: HOME_TYPE.kicker - 1,
    textDecorationLine: "line-through",
  },
  addBtn: {
    marginTop: HOME_SPACE.xs,
    alignSelf: "stretch",
    paddingVertical: 10,
    paddingHorizontal: HOME_SPACE.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KANKREG_PALETTE.line,
    alignItems: "center",
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  addBtnDark: {
    borderColor: "#3f3933",
  },
  addBtnHover: {
    borderColor: KANKREG_PALETTE.gold,
  },
  addBtnDisabled: {
    opacity: 0.55,
  },
  addBtnComingSoon: {
    backgroundColor: COMING_SOON_RED.mid,
    borderColor: COMING_SOON_RED.borderStrong,
    opacity: 1,
  },
  addBtnText: {
    fontFamily: fonts.semibold,
    fontSize: HOME_TYPE.kicker - 1,
    letterSpacing: 0.15,
  },
  stepper: {
    marginTop: HOME_SPACE.xs,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    justifyContent: "space-between",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KANKREG_PALETTE.line,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: HOME_SPACE.xs,
  },
  stepperDark: {
    borderColor: "#3f3933",
  },
  stepBtn: {
    width: 32,
    height: 32,
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
