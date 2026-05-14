import React, { useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { fonts, getSemanticColors, icon, radius, semanticRadius, spacing, typography } from "../theme/tokens";
import { platformShadow } from "../theme/shadowPlatform";
import { formatINR, formatINRWhole } from "../utils/currency";
import { getImageUriCandidates } from "../utils/image";
import { matchesShelfProduct } from "../utils/shelfMatch";
import { APP_DISPLAY_NAME } from "../constants/brand";
import { useTheme } from "../context/ThemeContext";
import { ALCHEMY, FONT_DISPLAY, FONT_DISPLAY_SEMI } from "../theme/customerAlchemy";

export default function ProductCard({
  product,
  onPress,
  onAddToCart,
  onRemoveFromCart,
  quantity,
  isOutOfStock = false,
  variant = "grid",
  showEta = false,
  compact = false,
  showCategory = true,
  /** Staggered entrance on native; omit on web */
  index,
  /** If unset: unit row shows on list / non-compact only */
  showUnit,
  /** Warm editorial list styling (e.g. Home catalog) */
  editorial = false,
}) {
  const { width } = useWindowDimensions();
  const { colors: c, isDark } = useTheme();
  const semantic = getSemanticColors(c);
  const isNarrowViewport = width < 420;
  const isWideWeb = Platform.OS === "web" && width >= 1180;
  const isHugeWeb = Platform.OS === "web" && width >= 1440;
  const styles = useMemo(
    () => createStyles(c, isDark, { isWideWeb, isHugeWeb, isNarrowViewport }),
    [c, isDark, isWideWeb, isHugeWeb, isNarrowViewport]
  );

  const scale = useSharedValue(1);
  const isList = variant === "list";
  const isWeb = Platform.OS === "web";
  const isWebGrid = isWeb && !isList;
  const [imageCandidateIndex, setImageCandidateIndex] = useState(0);
  const primaryImage = useMemo(() => {
    if (String(product?.image || "").trim()) return product.image;
    if (Array.isArray(product?.images) && product.images.length) {
      return String(product.images[0] || "");
    }
    return "";
  }, [product?.image, product?.images]);
  const imageUris = useMemo(() => getImageUriCandidates(primaryImage), [primaryImage]);
  const imageUri = imageUris[imageCandidateIndex] || "";
  const imageFailed = imageUris.length === 0 || imageCandidateIndex >= imageUris.length;
  const imageFallbackLabel = imageUris.length > 0 ? "Image unavailable" : "No image";
  const categoryTone = useMemo(
    () => getCategoryTone(product?.category, isDark, editorial, c),
    [product?.category, isDark, editorial, c]
  );
  const shelfMatch = useMemo(() => matchesShelfProduct(product), [product]);
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const hasEtaCopy = Boolean(String(product?.eta || "").trim());
  const showEtaBadge = showEta && hasEtaCopy;
  const showUnitRow = showUnit !== undefined ? showUnit : isList || !compact;
  const handleImageError = () => setImageCandidateIndex((index) => index + 1);

  useEffect(() => {
    setImageCandidateIndex(0);
  }, [primaryImage]);

  const handlePressIn = () => {
    scale.value = withSpring(0.985, { damping: 18, stiffness: 280 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 18, stiffness: 280 });
  };

  const CardInner = isWeb ? View : Animated.View;
  const Root = isWeb || index == null ? View : Animated.View;
  const compactListLayout = isList && isNarrowViewport;
  const compactGridLayout = !isWeb && !isList && isNarrowViewport;
  const rootEntering =
    !isWeb && index != null
      ? FadeInDown.delay(Math.min(index * 52, 520)).duration(400)
      : undefined;

  const safePrice = (() => {
    const n = Number(product?.price);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  })();
  const mrpNum = product?.mrp != null ? Number(product.mrp) : NaN;
  const listMrp = Number.isFinite(mrpNum) && mrpNum > safePrice ? mrpNum : null;
  const offPct = listMrp ? Math.round((1 - safePrice / listMrp) * 100) : null;
  const legacyBody = (
    <CardInner
      style={[
        styles.card,
        isWebGrid ? styles.cardGridWeb : null,
        compactGridLayout ? styles.cardGridCompact : null,
        shelfMatch ? styles.cardShelfAccent : null,
        isList ? styles.cardList : null,
        isList && editorial ? styles.cardListEditorial : null,
        isList
          ? {
              backgroundColor: categoryTone.cardBg,
              borderColor: categoryTone.cardBorder,
            }
          : null,
        isList && shelfMatch && !editorial ? styles.cardListShelfAccent : null,
        !isWeb ? animatedCardStyle : null,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.94}
        style={isList ? styles.touchableList : null}
        onPress={onPress}
        onPressIn={isWeb ? undefined : handlePressIn}
        onPressOut={isWeb ? undefined : handlePressOut}
      >
        <View
          style={[
            styles.imageWrap,
            isWebGrid ? styles.imageWrapGridWeb : null,
            isList ? styles.imageWrapList : null,
            compactGridLayout ? styles.imageWrapGridCompact : null,
            isList ? { backgroundColor: categoryTone.imageWrapBg } : null,
          ]}
        >
          <View
            style={[
              styles.imageBox,
              isWebGrid ? styles.imageBoxGridWeb : null,
              isList ? styles.imageBoxList : null,
              compactGridLayout ? styles.imageBoxGridCompact : null,
              isList ? { backgroundColor: categoryTone.imageBoxBg, borderColor: categoryTone.imageBoxBorder } : null,
            ]}
          >
            {imageUri && !imageFailed ? (
              <Image
                source={{ uri: imageUri }}
                style={[styles.image, isWebGrid ? styles.imageGridWeb : null]}
                contentFit={isWebGrid ? "contain" : "cover"}
                transition={240}
                recyclingKey={`${product?.id || "product"}:${imageUri}`}
                onError={handleImageError}
              />
            ) : (
              <View style={styles.imageFallback}>
                <View style={[styles.imageFallbackIconWrap, { backgroundColor: isDark ? c.surface : ALCHEMY.goldSoft }]}>
                  <Ionicons name="image-outline" size={icon.sm} color={c.textMuted} />
                </View>
                <Text style={[styles.imageFallbackText, { color: c.textMuted, fontFamily: fonts.semibold }]}>
                  {imageFallbackLabel}
                </Text>
              </View>
            )}
            {offPct != null && offPct > 0 ? (
              <View style={[styles.discountBadge, { backgroundColor: c.primary }]}>
                <Text style={[styles.discountBadgeText, { fontFamily: fonts.extrabold, color: c.onPrimary }]}>
                  {offPct}% off
                </Text>
              </View>
            ) : null}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {}}
              style={styles.wishlistBtn}
              accessibilityRole="button"
              accessibilityLabel={`Save ${product.name} to wishlist`}
            >
              <Ionicons name="heart-outline" size={icon.xs + 1} color={c.textPrimary} />
            </TouchableOpacity>
          </View>
          {!isList && showEtaBadge ? (
            <View style={styles.etaBadge}>
              <Ionicons name="time-outline" size={icon.tiny} color={c.primary} />
              <Text style={[styles.etaText, { color: c.textPrimary, fontFamily: fonts.bold }]} numberOfLines={1}>
                {String(product.eta).trim()}
              </Text>
            </View>
          ) : null}
          {!isList && !compact && product.isSpecial ? (
            <View style={styles.badge}>
              <MaterialCommunityIcons name="star-four-points-outline" size={icon.tiny} color={c.onPrimary} />
              <Text style={[styles.badgeText, { fontFamily: fonts.bold }]}>Special</Text>
            </View>
          ) : null}
        </View>
        <View
          style={[
            styles.content,
            isList ? styles.contentList : null,
            compactGridLayout ? styles.contentGridCompact : null,
            isWebGrid ? styles.contentGridWeb : null,
            compact && isList ? styles.contentCompact : null,
          ]}
        >
          {showCategory ? (
            <Text
              style={[
                styles.category,
                compactGridLayout ? styles.categoryGridCompact : null,
                isWebGrid ? styles.categoryGridWeb : null,
                { color: c.textMuted, fontFamily: fonts.semibold },
              ]}
              numberOfLines={1}
            >
              {product.category || "Groceries"}
            </Text>
          ) : null}
          <Text
            numberOfLines={isList ? 2 : compact ? 2 : 2}
            style={[
              styles.name,
              compactListLayout ? styles.nameListCompact : null,
              compactGridLayout ? styles.nameGridCompact : null,
              isWebGrid ? styles.nameGridWeb : null,
              editorial && isList ? styles.nameEditorial : null,
              { color: c.textPrimary, fontFamily: editorial && isList ? FONT_DISPLAY : fonts.semibold },
            ]}
          >
            {product.name}
          </Text>
          {isList ? (
            <>
              <View style={styles.metaRowList}>
                <View
                  style={[
                    styles.metaPillList,
                    {
                      borderColor: editorial ? ALCHEMY.pillInactive : c.border,
                      backgroundColor: editorial ? ALCHEMY.creamDeep : c.surfaceMuted,
                    },
                  ]}
                >
                  <Ionicons name="cube-outline" size={icon.tiny} color={c.textSecondary} />
                  <Text style={[styles.metaPillTextList, { color: c.textSecondary, fontFamily: fonts.bold }]}>
                    {product.unit || "1 pc"}
                  </Text>
                </View>
                <View
                  style={[
                    styles.metaPillList,
                    {
                      borderColor: isOutOfStock ? c.danger : editorial ? ALCHEMY.pillInactive : c.border,
                      backgroundColor: isOutOfStock ? "rgba(220, 38, 38, 0.08)" : editorial ? ALCHEMY.creamDeep : c.surfaceMuted,
                    },
                  ]}
                >
                  <Ionicons
                    name={isOutOfStock ? "alert-circle-outline" : "checkmark-circle-outline"}
                    size={icon.tiny}
                    color={isOutOfStock ? c.danger : c.secondary}
                  />
                  <Text
                    style={[
                      styles.metaPillTextList,
                      {
                        color: isOutOfStock ? c.danger : c.secondaryDark,
                        fontFamily: fonts.bold,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {isOutOfStock ? "Unavailable" : "In stock"}
                  </Text>
                </View>
                {showEta && hasEtaCopy ? (
                  <View
                    style={[
                      styles.metaPillList,
                      {
                        borderColor: editorial ? ALCHEMY.pillInactive : c.border,
                        backgroundColor: editorial ? ALCHEMY.creamDeep : c.surfaceMuted,
                      },
                    ]}
                  >
                    <Ionicons name="information-circle-outline" size={icon.tiny} color={c.textSecondary} />
                    <Text style={[styles.metaPillTextList, { color: c.textSecondary, fontFamily: fonts.bold }]} numberOfLines={1}>
                      {String(product.eta).trim()}
                    </Text>
                  </View>
                ) : null}
              </View>
              {String(product.description || "").trim() ? (
                <Text
                  numberOfLines={editorial || compactListLayout ? 1 : 2}
                  style={[
                    styles.description,
                    compactListLayout ? styles.descriptionListCompact : null,
                    { color: c.textSecondary, fontFamily: fonts.regular },
                  ]}
                >
                  {String(product.description).trim()}
                </Text>
              ) : !editorial ? (
                <Text numberOfLines={1} style={[styles.description, { color: c.textSecondary, fontFamily: fonts.regular }]}>
                  {`Trusted ${APP_DISPLAY_NAME} pick.`}
                </Text>
              ) : null}
            </>
          ) : showUnitRow ? (
            <Text
              style={[
                styles.unit,
                compactGridLayout ? styles.unitGridCompact : null,
                isWebGrid ? styles.unitGridWeb : null,
                { color: c.textMuted, fontFamily: fonts.medium },
              ]}
            >
              {product.unit || "1 pc"}
            </Text>
          ) : null}
          {isList ? (
            <View
              style={[
                styles.bottomStackList,
                editorial ? styles.bottomStackListEditorial : null,
                compactListLayout ? styles.bottomStackListCompact : null,
              ]}
            >
              <View style={[styles.priceBlockListFull, compactListLayout ? styles.priceBlockListCompact : null]}>
                <View style={styles.priceLineList}>
                  <Text
                    style={[
                      styles.price,
                      styles.priceList,
                      compactListLayout ? styles.priceListCompact : null,
                      editorial ? styles.priceListEditorial : null,
                      { color: c.textPrimary, fontFamily: fonts.extrabold },
                    ]}
                  >
                    {formatINRWhole(safePrice)}
                  </Text>
                  {listMrp ? (
                    <Text style={[styles.mrpList, { color: c.textMuted, fontFamily: fonts.medium }]}>
                      {formatINRWhole(listMrp)}
                    </Text>
                  ) : null}
                </View>
                {editorial && listMrp ? (
                  <Text style={[styles.youSaveText, { color: c.secondaryDark, fontFamily: fonts.semibold }]}>
                    You save {formatINRWhole(listMrp - safePrice)}
                  </Text>
                ) : null}
              </View>
              <View style={[styles.listCtaRow, compactListLayout ? styles.listCtaRowCompact : null]}>
                {quantity > 0 ? (
                  <View
                    style={[
                      styles.stepper,
                      compactListLayout ? styles.stepperListCompact : null,
                      { backgroundColor: editorial && isList ? ALCHEMY.brown : c.primaryDark },
                    ]}
                  >
                    <TouchableOpacity style={styles.stepButton} activeOpacity={0.85} onPress={onRemoveFromCart}>
                      <Ionicons name="remove" size={icon.sm} color={c.onPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.quantityText, { color: c.onPrimary, fontFamily: fonts.bold }]}>{quantity}</Text>
                    <TouchableOpacity style={styles.stepButton} activeOpacity={0.85} onPress={onAddToCart}>
                      <Ionicons name="add" size={icon.sm} color={c.onPrimary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.button,
                      compactListLayout ? styles.buttonListCompact : null,
                      isOutOfStock ? styles.buttonDisabled : null,
                      {
                        backgroundColor: isOutOfStock ? c.textMuted : editorial && isList ? ALCHEMY.brown : c.primary,
                      },
                      editorial && isList && !isOutOfStock ? styles.buttonEditorialList : null,
                      editorial && isList && !isOutOfStock && compactListLayout ? styles.buttonEditorialListCompact : null,
                    ]}
                    activeOpacity={0.85}
                    onPress={onAddToCart}
                    disabled={isOutOfStock}
                  >
                    <Ionicons
                      name="bag-add-outline"
                      size={compact && !isList ? icon.micro : icon.xs}
                      color={semantic.text.onPrimary}
                    />
                    <Text style={[styles.buttonText, { fontFamily: fonts.bold, color: semantic.text.onPrimary }]}>
                      {isOutOfStock ? "Out of Stock" : isList ? "Add" : compact ? "Add" : "ADD"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <View
              style={[
                styles.bottomRow,
                compactGridLayout ? styles.bottomRowGridCompact : null,
                isWebGrid ? styles.bottomRowGridWeb : null,
              ]}
            >
              <Text
                style={[
                  styles.price,
                  compactGridLayout ? styles.priceGridCompact : null,
                  isWebGrid ? styles.priceGridWeb : null,
                  { color: c.textPrimary, fontFamily: fonts.extrabold },
                ]}
              >
                {formatINR(safePrice)}
              </Text>
              {quantity > 0 ? (
                <View
                  style={[
                    styles.stepper,
                    compactGridLayout ? styles.stepperGridCompact : null,
                    isWebGrid ? styles.stepperGridWeb : null,
                    { backgroundColor: c.primaryDark },
                  ]}
                >
                  <TouchableOpacity style={styles.stepButton} activeOpacity={0.85} onPress={onRemoveFromCart}>
                    <Ionicons name="remove" size={icon.sm} color={c.onPrimary} />
                  </TouchableOpacity>
                  <Text style={[styles.quantityText, { color: c.onPrimary, fontFamily: fonts.bold }]}>{quantity}</Text>
                  <TouchableOpacity style={styles.stepButton} activeOpacity={0.85} onPress={onAddToCart}>
                    <Ionicons name="add" size={icon.sm} color={c.onPrimary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.button,
                    compactGridLayout ? styles.buttonGridCompact : null,
                    isWebGrid ? styles.buttonGridWeb : null,
                    isOutOfStock ? styles.buttonDisabled : null,
                    { backgroundColor: isOutOfStock ? c.textMuted : c.primary },
                  ]}
                  activeOpacity={0.85}
                  onPress={onAddToCart}
                  disabled={isOutOfStock}
                >
                  <Ionicons
                    name="bag-add-outline"
                    size={compact && !isList ? icon.micro : icon.xs}
                    color={semantic.text.onPrimary}
                  />
                  <Text style={[styles.buttonText, { fontFamily: fonts.bold, color: semantic.text.onPrimary }]}>
                    {isOutOfStock ? "Out of Stock" : compact ? "Add" : "ADD"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </CardInner>
  );

  return (
    <Root style={styles.cardEntryWrap} {...(rootEntering ? { entering: rootEntering } : {})}>
      {legacyBody}
    </Root>
  );
}

function getCategoryTone(rawCategory, isDark, editorial, c) {
  const key = String(rawCategory || "").toLowerCase();
  const editorialLight = {
    cardBg: c.surface,
    cardBorder: c.border,
    imageWrapBg: c.surfaceMuted,
    imageBoxBg: c.surface,
    imageBoxBorder: c.border,
  };
  const editorialDark = {
    cardBg: c.surface,
    cardBorder: c.border,
    imageWrapBg: c.surfaceMuted,
    imageBoxBg: c.surfaceMuted,
    imageBoxBorder: c.borderStrong,
  };
  if (editorial && !isDark) {
    return editorialLight;
  }
  if (editorial && isDark) {
    return editorialDark;
  }
  if (isDark) {
    return editorialDark;
  }
  const neutral = {
    cardBg: c.surface,
    cardBorder: c.border,
    imageWrapBg: "rgba(248, 250, 252, 0.96)",
    imageBoxBg: c.surface,
    imageBoxBorder: c.border,
  };
  const redShelf = {
    cardBg: c.primarySoft,
    cardBorder: c.primaryBorder,
    imageWrapBg: "rgba(254, 242, 242, 0.94)",
    imageBoxBg: c.surface,
    imageBoxBorder: c.primaryBorder,
  };
  const slateShelf = {
    cardBg: c.secondarySoft,
    cardBorder: c.secondaryBorder,
    imageWrapBg: "rgba(241, 245, 249, 0.95)",
    imageBoxBg: c.surface,
    imageBoxBorder: c.secondaryBorder,
  };
  if (key.includes("fruit") || key.includes("vegetable")) {
    return redShelf;
  }
  if (key.includes("snack") || key.includes("bakery")) {
    return slateShelf;
  }
  if (key.includes("dairy") || key.includes("beverage") || key.includes("drink")) {
    return neutral;
  }
  return neutral;
}

function createStyles(c, isDark, layoutFlags = {}) {
  const { isWideWeb = false, isHugeWeb = false, isNarrowViewport = false } = layoutFlags;
  const cardLiftShadow = platformShadow({
    web: {
      boxShadow: isDark
        ? "0 10px 26px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.05)"
        : "0 6px 16px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.03), inset 0 1px 0 rgba(255,255,255,0.92)",
    },
    ios: {
      shadowColor: "#18181B",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.22 : 0.07,
      shadowRadius: 14,
    },
    android: { elevation: isDark ? 4 : 3 },
  });

  return StyleSheet.create({
    cardEntryWrap: {
      width: "100%",
    },
    card: {
      width: "100%",
      minHeight: Platform.select({
        web: isHugeWeb ? 220 : isWideWeb ? 204 : 168,
        default: isNarrowViewport ? 170 : 186,
      }),
      backgroundColor: c.surface,
      borderRadius: radius.xxl,
      overflow: "hidden",
      marginBottom: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? c.border : "rgba(100, 116, 139, 0.12)",
      borderTopWidth: 1,
      borderTopColor: isDark ? "rgba(220, 38, 38, 0.5)" : "rgba(185, 28, 28, 0.65)",
      ...cardLiftShadow,
      ...Platform.select({
        web: {
          backgroundImage: isDark
            ? undefined
            : "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,253,250,0.99))",
          transition: "box-shadow 0.18s ease, border-color 0.18s ease, transform 0.18s ease",
        },
        default: {},
      }),
    },
    /** Quick-commerce tile: white card, blue discount badge, ETA row, outlined ADD. */
    cardQcShell: {
      width: "100%",
      maxWidth: "100%",
      alignSelf: "center",
      minHeight: 0,
      marginBottom: 0,
      padding: 0,
      borderRadius: semanticRadius.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? c.border : "rgba(100, 116, 139, 0.12)",
      borderTopWidth: 1,
      borderTopColor: isDark ? "rgba(220, 38, 38, 0.5)" : "rgba(185, 28, 28, 0.65)",
      overflow: "hidden",
      ...cardLiftShadow,
      ...Platform.select({
        web: {
          backgroundImage: isDark
            ? undefined
            : "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,253,250,0.99))",
          transitionProperty: "transform, box-shadow, border-color, background-color",
          transitionDuration: "180ms",
        },
        default: {},
      }),
    },
    cardQcShelfAccent: {
      borderLeftWidth: 2,
      borderLeftColor: c.secondary,
    },
    cardGridWeb: {
      minHeight: 0,
    },
    cardGridCompact: {
      minHeight: 0,
    },
    qcPress: {
      width: "100%",
    },
    qcImageBlock: {
      width: "100%",
    },
    qcImageFrame: {
      position: "relative",
      marginHorizontal: spacing.sm,
      marginTop: spacing.sm,
      borderRadius: radius.lg + 4,
      borderWidth: 1,
      padding: spacing.xs,
      overflow: "hidden",
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255, 252, 248, 0.85)",
    },
    qcDiscountBadge: {
      position: "absolute",
      top: 6,
      left: 6,
      zIndex: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
      maxWidth: "62%",
      borderWidth: 1,
      borderColor: "rgba(255, 252, 248, 0.5)",
      ...Platform.select({
        web: { boxShadow: "0 8px 18px rgba(220, 38, 38, 0.25)" },
        default: {},
      }),
    },
    qcDiscountBadgeText: {
      fontSize: 10,
      letterSpacing: 0.5,
    },
    qcImageInner: {
      borderRadius: radius.lg,
      aspectRatio: 1,
      width: "100%",
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    },
    qcImage: {
      width: "100%",
      height: "100%",
    },
    qcBody: {
      paddingHorizontal: spacing.md + 2,
      paddingTop: spacing.md - 2,
      paddingBottom: spacing.md + 2,
    },
    qcTitle: {
      fontSize: typography.body,
      fontFamily: FONT_DISPLAY_SEMI,
      lineHeight: 21,
      letterSpacing: -0.3,
      minHeight: 40,
      width: "100%",
      ...Platform.select({
        android: { includeFontPadding: false },
        default: {},
      }),
    },
    qcUnitRow: {
      marginTop: 2,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    qcRatingRow: {
      marginTop: 6,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: isDark ? "rgba(185, 28, 28, 0.1)" : ALCHEMY.goldSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? c.primaryBorder : "rgba(185, 28, 28, 0.2)",
    },
    qcRatingText: {
      fontSize: typography.overline + 1,
      lineHeight: 15,
      fontFamily: fonts.semibold,
    },
    qcUnit: {
      fontSize: 11,
      flexShrink: 1,
    },
    qcPriceRow: {
      marginTop: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    qcPriceCol: {
      flex: 1,
      minWidth: 72,
      flexShrink: 1,
      paddingRight: 4,
    },
    qcPrice: {
      fontSize: typography.h3 - 1,
      fontFamily: FONT_DISPLAY,
      letterSpacing: -0.45,
      maxWidth: "100%",
      ...Platform.select({
        android: { includeFontPadding: false },
        default: {},
      }),
    },
    qcMrp: {
      marginTop: 2,
      fontSize: 11,
      textDecorationLine: "line-through",
    },
    qcSaveText: {
      marginTop: 2,
      fontSize: 10,
      letterSpacing: 0.15,
      opacity: 0.92,
    },
    qcAddBtn: {
      borderWidth: 1,
      borderRadius: semanticRadius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: 9,
      minWidth: 64,
      flexShrink: 0,
      flexDirection: "row",
      gap: 4,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        web: {
          boxShadow: "0 8px 16px rgba(62, 40, 12, 0.16), inset 0 1px 0 rgba(255,255,255,0.2)",
          transitionProperty: "transform, box-shadow, background-color, border-color",
          transitionDuration: "180ms",
        },
        default: {},
      }),
    },
    qcAddBtnText: {
      fontSize: typography.caption,
      letterSpacing: 0.6,
    },
    qcStepper: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: semanticRadius.control,
      paddingHorizontal: 4,
      height: 34,
      flexShrink: 0,
      backgroundColor: "transparent",
    },
    qcStepHit: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      minWidth: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    qcStepQty: {
      fontSize: 13,
      minWidth: 18,
      textAlign: "center",
    },
    cardShelfAccent: {
      borderLeftWidth: 3,
      borderLeftColor: c.accentGold,
    },
    cardList: {
      minHeight: Platform.select({
        web: isHugeWeb ? 212 : isWideWeb ? 192 : isNarrowViewport ? 158 : 174,
        ios: isNarrowViewport ? 156 : 168,
        default: isNarrowViewport ? 162 : 174,
      }),
      borderRadius: semanticRadius.card,
      marginBottom: 0,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? c.border : "rgba(100, 116, 139, 0.1)",
      ...platformShadow({
        web: {
          boxShadow: isDark
            ? "0 10px 28px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)"
            : "0 8px 20px rgba(28, 25, 23, 0.07), 0 2px 8px rgba(24, 24, 27, 0.04), inset 0 1px 0 rgba(255,255,255,0.82)",
        },
        ios: {
          shadowColor: "#18181B",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.22 : 0.07,
          shadowRadius: 11,
        },
        android: { elevation: isDark ? 3 : 2 },
      }),
      ...Platform.select({
        web: {
          transition: "box-shadow 0.18s ease, border-color 0.18s ease, transform 0.18s ease",
        },
        default: {},
      }),
    },
    cardListShelfAccent: {
      borderLeftWidth: 3,
      borderLeftColor: c.accentGreen,
    },
    touchableList: {
      flexDirection: "row",
      alignItems: "stretch",
    },
    imageWrap: {
      position: "relative",
      padding: spacing.sm,
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : ALCHEMY.creamAlt,
    },
    imageWrapGridWeb: {
      paddingHorizontal: isWideWeb ? spacing.md : spacing.sm,
      paddingTop: isWideWeb ? spacing.md : spacing.sm,
      paddingBottom: spacing.sm,
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(255, 252, 248, 0.92)",
    },
    imageWrapGridCompact: {
      padding: spacing.xs + 2,
    },
    imageWrapList: {
      width: Platform.select({
        web: isHugeWeb ? 180 : isWideWeb ? 164 : isNarrowViewport ? 110 : 140,
        ios: isNarrowViewport ? 116 : 132,
        default: isNarrowViewport ? 120 : 140,
      }),
      padding: isNarrowViewport ? spacing.xs + 2 : spacing.sm,
    },
    imageBox: {
      height: Platform.select({
        web: isHugeWeb ? 112 : isWideWeb ? 98 : 76,
        default: isNarrowViewport ? 84 : 94,
      }),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderRadius: radius.lg + 2,
      backgroundColor: c.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    imageBoxGridWeb: {
      height: isHugeWeb ? 214 : isWideWeb ? 190 : 166,
      borderRadius: radius.xl + 4,
      borderWidth: 1,
      borderColor: isDark ? "rgba(220, 38, 38, 0.16)" : "rgba(63, 63, 70, 0.08)",
      backgroundColor: isDark ? "rgba(24, 24, 27, 0.98)" : "#FFFFFF",
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 18px rgba(0,0,0,0.18)"
            : "0 10px 24px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.96)",
        },
        default: {},
      }),
    },
    imageBoxGridCompact: {
      borderRadius: radius.lg,
    },
    imageBoxList: {
      height: Platform.select({
        web: isHugeWeb ? 176 : isWideWeb ? 152 : isNarrowViewport ? 102 : 130,
        default: isNarrowViewport ? 108 : 130,
      }),
      borderRadius: radius.xl + 4,
      position: "relative",
    },
    discountBadge: {
      position: "absolute",
      top: spacing.xs,
      left: spacing.xs,
      zIndex: 2,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,252,248,0.45)",
      ...Platform.select({
        web: { boxShadow: "0 6px 14px rgba(180, 83, 9, 0.22)" },
        ios: {
          shadowColor: "#B45309",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
        },
        android: { elevation: 2 },
        default: {},
      }),
    },
    discountBadgeText: {
      fontSize: 9,
      letterSpacing: 0.32,
    },
    wishlistBtn: {
      position: "absolute",
      top: spacing.xs,
      right: spacing.xs,
      zIndex: 2,
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(100,116,139,0.22)",
      backgroundColor: isDark ? "rgba(24,24,27,0.78)" : "rgba(255,255,255,0.92)",
      alignItems: "center",
      justifyContent: "center",
    },
    cardListEditorial: {
      borderLeftWidth: 0,
      borderTopWidth: isDark ? StyleSheet.hairlineWidth : 2,
      borderTopColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(185, 28, 28, 0.55)",
      borderRadius: radius.xxl - 2,
      ...Platform.select({
        ios: {
          shadowColor: "#18181B",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.18 : 0.06,
          shadowRadius: 12,
        },
        android: { elevation: isDark ? 3 : 2 },
        web: {
          boxShadow: isDark
            ? "0 10px 28px rgba(0,0,0,0.22)"
            : "0 8px 20px rgba(28, 25, 23, 0.05), 0 2px 6px rgba(28, 25, 23, 0.035)",
        },
        default: {},
      }),
    },
    nameEditorial: {
      fontSize: 17,
      lineHeight: 22,
      letterSpacing: -0.25,
      minHeight: 44,
    },
    bottomStackList: {
      marginTop: spacing.md,
      width: "100%",
      alignSelf: "stretch",
      gap: spacing.sm,
    },
    bottomStackListCompact: {
      marginTop: spacing.sm + 2,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    bottomStackListEditorial: {
      marginTop: spacing.sm + 2,
      gap: spacing.sm + 2,
    },
    priceBlockListFull: {
      width: "100%",
      minWidth: 0,
    },
    priceBlockListCompact: {
      flex: 1,
      width: "auto",
    },
    priceLineList: {
      flexDirection: "row",
      alignItems: "baseline",
      flexWrap: "wrap",
      columnGap: 10,
      rowGap: 4,
    },
    priceListEditorial: {
      fontSize: 22,
      letterSpacing: -0.4,
    },
    mrpList: {
      fontSize: 12,
      textDecorationLine: "line-through",
      flexShrink: 0,
    },
    youSaveText: {
      marginTop: 6,
      fontSize: typography.bodySmall,
      lineHeight: 18,
    },
    listCtaRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      width: "100%",
    },
    listCtaRowCompact: {
      width: "auto",
      flexShrink: 0,
    },
    buttonEditorialList: {
      paddingHorizontal: spacing.md,
      minWidth: 96,
      flexShrink: 0,
    },
    image: {
      width: "100%",
      height: "100%",
      backgroundColor: "transparent",
    },
    imageGridWeb: {
      width: "92%",
      height: "92%",
    },
    imageFallback: {
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: spacing.xs,
    },
    imageFallbackIconWrap: {
      width: 34,
      height: 34,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    imageFallbackText: {
      fontSize: typography.caption,
      textAlign: "center",
    },
    etaBadge: {
      position: "absolute",
      top: spacing.xs,
      left: spacing.xs,
      maxWidth: "85%",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: isDark ? "rgba(28,25,23,0.9)" : "rgba(255,252,248,0.96)",
      borderRadius: radius.md,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.primaryBorder,
    },
    etaText: {
      fontSize: 9,
      flexShrink: 1,
    },
    badge: {
      position: "absolute",
      bottom: spacing.xs,
      left: spacing.xs,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: c.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.md,
    },
    badgeText: {
      color: c.onPrimary,
      fontSize: 9,
    },
    content: {
      padding: Platform.select({
        web: isWideWeb ? spacing.md : spacing.sm,
        default: isNarrowViewport ? spacing.sm + 2 : spacing.md,
      }),
    },
    contentGridCompact: {
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
    },
    contentGridWeb: {
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    contentCompact: {
      paddingTop: 6,
      paddingBottom: 6,
    },
    contentList: {
      flex: 1,
      paddingVertical: isWideWeb ? spacing.lg : isNarrowViewport ? spacing.sm + 2 : spacing.md + 2,
      paddingRight: isWideWeb ? spacing.xl : isNarrowViewport ? spacing.sm + 2 : spacing.lg,
      paddingLeft: isWideWeb ? spacing.md : isNarrowViewport ? spacing.xs + 2 : spacing.sm,
      justifyContent: "flex-start",
    },
    category: {
      fontSize: typography.overline + 1,
      textTransform: "none",
      marginBottom: 2,
      opacity: 0.82,
    },
    categoryGridCompact: {
      marginBottom: 1,
    },
    categoryGridWeb: {
      marginBottom: 4,
    },
    name: {
      fontSize: Platform.select({
        web: isWideWeb ? typography.body + 3 : typography.body + 1,
        default: typography.body + 1,
      }),
      lineHeight: Platform.select({
        web: isWideWeb ? 25 : 22,
        default: 22,
      }),
      minHeight: Platform.select({
        web: isWideWeb ? 50 : 42,
        default: 42,
      }),
      fontWeight: "500",
    },
    nameListCompact: {
      fontSize: typography.body,
      lineHeight: 20,
      minHeight: 40,
    },
    nameGridCompact: {
      fontSize: typography.body,
      lineHeight: 20,
      minHeight: 40,
    },
    nameGridWeb: {
      fontSize: isWideWeb ? typography.body + 2 : typography.body + 1,
      lineHeight: isWideWeb ? 23 : 22,
      minHeight: isWideWeb ? 46 : 44,
    },
    description: {
      marginTop: 4,
      fontSize: typography.bodySmall,
      lineHeight: isWideWeb ? 19 : 17,
    },
    descriptionListCompact: {
      marginTop: 3,
      lineHeight: 16,
    },
    metaRowList: {
      marginTop: 2,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap",
    },
    metaPillList: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.pill,
      paddingHorizontal: 9,
      paddingVertical: 5,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      maxWidth: "100%",
    },
    metaPillTextList: {
      fontSize: 11,
      flexShrink: 1,
      letterSpacing: 0.15,
    },
    unit: {
      marginTop: 4,
      fontSize: typography.caption,
    },
    unitGridCompact: {
      marginTop: 3,
    },
    unitGridWeb: {
      marginTop: 5,
    },
    bottomRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: isWideWeb ? spacing.md + 2 : spacing.md,
      gap: spacing.sm,
    },
    bottomRowGridCompact: {
      marginTop: spacing.sm,
    },
    bottomRowGridWeb: {
      marginTop: spacing.sm + 2,
      alignItems: "flex-end",
    },
    price: {
      fontSize: Platform.select({
        web: isWideWeb ? typography.h3 : typography.body + 2,
        default: typography.body + 2,
      }),
      color: isDark ? c.textPrimary : "#111827",
    },
    priceGridCompact: {
      fontSize: typography.body + 1,
    },
    priceGridWeb: {
      fontSize: isWideWeb ? typography.h3 + 1 : typography.h3,
    },
    priceList: {
      fontSize: Platform.select({
        web: isWideWeb ? 22 : 20,
        default: 20,
      }),
    },
    priceListCompact: {
      fontSize: 18,
    },
    button: {
      borderRadius: semanticRadius.control + 2,
      minWidth: Platform.select({ web: isWideWeb ? 92 : 72, default: 84 }),
      paddingHorizontal: Platform.select({ web: isWideWeb ? spacing.md + 2 : spacing.md, default: spacing.md + 2 }),
      paddingVertical: Platform.select({ web: isWideWeb ? 11 : 10, default: 11 }),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 6px 14px rgba(0,0,0,0.28)"
            : "0 4px 10px rgba(62, 40, 12, 0.1), inset 0 1px 0 rgba(255,255,255,0.15)",
        },
        default: {},
      }),
    },
    buttonListCompact: {
      minWidth: 72,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 9,
    },
    buttonGridCompact: {
      minWidth: 72,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 9,
    },
    buttonGridWeb: {
      minWidth: isWideWeb ? 92 : 84,
      paddingHorizontal: isWideWeb ? spacing.md + 2 : spacing.md,
      paddingVertical: 10,
    },
    buttonDisabled: {},
    buttonText: {
      fontSize: typography.bodySmall,
      letterSpacing: isWideWeb ? 0.22 : 0.15,
    },
    stepper: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: semanticRadius.control,
      paddingHorizontal: 4,
      height: 34,
      minWidth: 78,
      justifyContent: "space-between",
      ...Platform.select({
        web: { boxShadow: "0 3px 8px rgba(15, 23, 42, 0.08)" },
        default: {},
      }),
    },
    stepperListCompact: {
      minWidth: 72,
      height: 32,
    },
    stepperGridCompact: {
      minWidth: 74,
      height: 32,
    },
    stepperGridWeb: {
      minWidth: isWideWeb ? 94 : 84,
      height: 36,
    },
    stepButton: {
      width: 26,
      alignItems: "center",
      justifyContent: "center",
    },
    quantityText: {
      fontSize: typography.bodySmall,
    },
    buttonEditorialListCompact: {
      minWidth: 82,
    },
  });
}
