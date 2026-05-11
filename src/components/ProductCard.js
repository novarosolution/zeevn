import React, { useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View, Pressable } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { fonts, getSemanticColors, icon, radius, semanticRadius, spacing, typography } from "../theme/tokens";
import { platformShadow } from "../theme/shadowPlatform";
import { formatINR, formatINRWhole } from "../utils/currency";
import { getImageUriCandidates } from "../utils/image";
import { matchesShelfProduct } from "../utils/shelfMatch";
import { APP_DISPLAY_NAME } from "../constants/brand";
import { useTheme } from "../context/ThemeContext";
import { ALCHEMY, FONT_DISPLAY, FONT_DISPLAY_SEMI, HERITAGE } from "../theme/customerAlchemy";
import PremiumProductCard from "./PremiumProductCard";

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
  const { colors: c, isDark } = useTheme();
  const semantic = getSemanticColors(c);
  const styles = useMemo(() => createStyles(c, isDark), [c, isDark]);

  const scale = useSharedValue(1);
  const isList = variant === "list";
  const isWeb = Platform.OS === "web";
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
  const ctaScale = useSharedValue(1);
  const ctaScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
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
  const handleAddPress = () => {
    ctaScale.value = withSpring(0.96, { damping: 18, stiffness: 280 }, () => {
      ctaScale.value = withSpring(1, { damping: 15, stiffness: 250 });
    });
    onAddToCart?.();
  };

  const CardInner = isWeb ? View : Animated.View;
  const Root = isWeb || index == null ? View : Animated.View;
  const rootEntering =
    !isWeb && index != null
      ? FadeInDown.delay(Math.min(index * 52, 520)).duration(400)
      : undefined;

  const isPremiumCatalog = compact && !isList;

  if (isPremiumCatalog) {
    return (
      <PremiumProductCard
        product={product}
        onPress={onPress}
        onAddToCart={onAddToCart}
        onRemoveFromCart={onRemoveFromCart}
        quantity={quantity}
        isOutOfStock={isOutOfStock}
        index={index}
      />
    );
  }

  const safePrice = (() => {
    const n = Number(product?.price);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  })();
  const mrpNum = product?.mrp != null ? Number(product.mrp) : NaN;
  const listMrp = Number.isFinite(mrpNum) && mrpNum > safePrice ? mrpNum : null;
  const offPct = listMrp ? Math.round((1 - safePrice / listMrp) * 100) : null;
  const discountBadge =
    offPct != null && offPct > 0
      ? `${offPct}% OFF`
      : product?.isSpecial
        ? "OFFER"
        : null;
  const ratingAvg = Number(product?.ratingAverage || 0);
  const reviewCount = Number(product?.reviewCount || 0);
  const cardBody = (
    <CardInner
      style={[
        styles.cardQcShell,
        { backgroundColor: c.surface, borderColor: c.border },
        shelfMatch ? styles.cardQcShelfAccent : null,
        !isWeb ? animatedCardStyle : null,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={isWeb ? undefined : handlePressIn}
        onPressOut={isWeb ? undefined : handlePressOut}
        style={({ pressed }) => [styles.qcPress, pressed && { opacity: 0.98 }]}
      >
        <View style={styles.qcImageBlock}>
          <View style={[styles.qcImageFrame, { borderColor: c.border, backgroundColor: isDark ? c.surfaceMuted : "#FAFAFA" }]}>
            {discountBadge ? (
              <LinearGradient
                colors={isDark ? ["#EF4444", "#DC2626"] : ["#F97316", "#DC2626"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.qcDiscountBadge}
              >
                <Text style={[styles.qcDiscountBadgeText, { fontFamily: fonts.bold, color: "#FFF7ED" }]} numberOfLines={1}>
                  {discountBadge}
                </Text>
              </LinearGradient>
            ) : null}
            <View style={[styles.qcImageInner, { backgroundColor: isDark ? "#292524" : "#FFFFFF" }]}>
              {imageUri && !imageFailed ? (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.qcImage}
                  contentFit="contain"
                  transition={240}
                  recyclingKey={`${product?.id || "product"}:${imageUri}`}
                  onError={handleImageError}
                />
              ) : (
                <View style={styles.imageFallback}>
                  <View style={[styles.imageFallbackIconWrap, { backgroundColor: isDark ? c.surface : ALCHEMY.goldSoft }]}>
                    <Ionicons name="image-outline" size={icon.md} color={c.textMuted} />
                  </View>
                  <Text style={[styles.imageFallbackText, { color: c.textMuted, fontFamily: fonts.semibold }]}>
                    {imageFallbackLabel}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.qcBody}>
          <Text style={[styles.qcTitle, { color: c.textPrimary }]} numberOfLines={2}>
            {product.name}
          </Text>
          {ratingAvg > 0 ? (
            <View style={styles.qcRatingRow}>
              <Ionicons name="star" size={icon.tiny} color={HERITAGE.amberMid} />
              <Text style={[styles.qcRatingText, { color: c.textSecondary, fontFamily: fonts.semibold }]} numberOfLines={1}>
                {ratingAvg.toFixed(1)} ({reviewCount})
              </Text>
            </View>
          ) : null}
          <View style={styles.qcUnitRow}>
            <Text style={[styles.qcUnit, { color: c.textMuted, fontFamily: fonts.medium }]} numberOfLines={1}>
              {product.unit || "1 pc"}
            </Text>
          </View>

          <View style={styles.qcPriceRow}>
            <View style={styles.qcPriceCol}>
              <Text style={[styles.qcPrice, { color: c.textPrimary, fontFamily: fonts.extrabold }]}>
                {formatINRWhole(safePrice)}
              </Text>
              {listMrp ? (
                <Text
                  style={[styles.qcMrp, { color: c.textMuted, fontFamily: fonts.medium }]}
                  numberOfLines={1}
                >
                  {formatINRWhole(listMrp)}
                </Text>
              ) : null}
              {listMrp ? (
                <Text style={[styles.qcSaveText, { color: c.secondaryDark, fontFamily: fonts.bold }]} numberOfLines={1}>
                  Save {formatINRWhole(listMrp - safePrice)}
                </Text>
              ) : null}
            </View>
            {quantity > 0 ? (
              <View style={[styles.qcStepper, { borderColor: c.secondary }]}>
                <TouchableOpacity style={styles.qcStepHit} activeOpacity={0.85} onPress={onRemoveFromCart}>
                  <Ionicons name="remove" size={icon.sm} color={c.secondary} />
                </TouchableOpacity>
                <Text style={[styles.qcStepQty, { color: c.textPrimary, fontFamily: fonts.bold }]}>{quantity}</Text>
                <TouchableOpacity style={styles.qcStepHit} activeOpacity={0.85} onPress={onAddToCart}>
                  <Ionicons name="add" size={icon.sm} color={c.secondary} />
                </TouchableOpacity>
              </View>
            ) : (
              <Animated.View style={ctaScaleStyle}>
                <TouchableOpacity
                  style={[
                    styles.qcAddBtn,
                    { borderColor: c.primaryDark, backgroundColor: c.primary },
                    isOutOfStock && { borderColor: c.textMuted, backgroundColor: c.textMuted, opacity: 0.7 },
                  ]}
                  activeOpacity={0.88}
                  onPress={handleAddPress}
                  disabled={isOutOfStock}
                >
                  <Ionicons
                    name={isOutOfStock ? "close-outline" : "add"}
                    size={icon.xs}
                    color={c.onPrimary}
                  />
                  <Text style={[styles.qcAddBtnText, { color: c.onPrimary, fontFamily: fonts.extrabold }]}>
                    {isOutOfStock ? "OUT" : "ADD"}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </View>
      </Pressable>
    </CardInner>
  );

  const legacyBody = (
    <CardInner
      style={[
        styles.card,
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
            isList ? styles.imageWrapList : null,
            isList ? { backgroundColor: categoryTone.imageWrapBg } : null,
          ]}
        >
          <View
            style={[
              styles.imageBox,
              isList ? styles.imageBoxList : null,
              isList ? { backgroundColor: categoryTone.imageBoxBg, borderColor: categoryTone.imageBoxBorder } : null,
            ]}
          >
            {imageUri && !imageFailed ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.image}
                contentFit="cover"
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
            {isList && editorial && offPct != null && offPct > 0 ? (
              <View style={[styles.listSaveBadge, { backgroundColor: c.primary }]}>
                <Text style={[styles.listSaveBadgeText, { fontFamily: fonts.extrabold, color: c.onPrimary }]}>
                  {offPct}% off
                </Text>
              </View>
            ) : null}
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
            compact && isList ? styles.contentCompact : null,
          ]}
        >
          {showCategory ? (
            <Text style={[styles.category, { color: c.textMuted, fontFamily: fonts.semibold }]} numberOfLines={1}>
              {product.category || "Groceries"}
            </Text>
          ) : null}
          <Text
            numberOfLines={isList ? 2 : compact ? 2 : 2}
            style={[
              styles.name,
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
                  numberOfLines={editorial ? 1 : 2}
                  style={[styles.description, { color: c.textSecondary, fontFamily: fonts.regular }]}
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
            <Text style={[styles.unit, { color: c.textMuted, fontFamily: fonts.medium }]}>
              {product.unit || "1 pc"}
            </Text>
          ) : null}
          {isList ? (
            <View style={[styles.bottomStackList, editorial ? styles.bottomStackListEditorial : null]}>
              <View style={styles.priceBlockListFull}>
                <View style={styles.priceLineList}>
                  <Text
                    style={[
                      styles.price,
                      styles.priceList,
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
              <View style={styles.listCtaRow}>
                {quantity > 0 ? (
                  <View
                    style={[
                      styles.stepper,
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
                      isOutOfStock ? styles.buttonDisabled : null,
                      {
                        backgroundColor: isOutOfStock ? c.textMuted : editorial && isList ? ALCHEMY.brown : c.primary,
                      },
                      editorial && isList && !isOutOfStock ? styles.buttonEditorialList : null,
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
            <View style={styles.bottomRow}>
              <Text style={[styles.price, { color: c.textPrimary, fontFamily: fonts.extrabold }]}>
                {formatINR(safePrice)}
              </Text>
              {quantity > 0 ? (
                <View style={[styles.stepper, { backgroundColor: c.primaryDark }]}>
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
      {isList ? legacyBody : cardBody}
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

function createStyles(c, isDark) {
  const cardLiftShadow = platformShadow({
    web: {
      boxShadow: isDark
        ? "0 12px 36px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.05)"
        : "0 8px 22px rgba(15, 23, 42, 0.06), 0 1px 4px rgba(15, 23, 42, 0.03), inset 0 1px 0 rgba(255,255,255,0.92)",
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
      minHeight: Platform.select({ web: 168, default: 186 }),
      backgroundColor: c.surface,
      borderRadius: radius.xxl,
      overflow: "hidden",
      marginBottom: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? c.border : "rgba(100, 116, 139, 0.12)",
      borderTopWidth: 2,
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
      borderTopWidth: 2,
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
          boxShadow: "0 12px 20px rgba(62, 40, 12, 0.22), inset 0 1px 0 rgba(255,255,255,0.2)",
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
      minHeight: Platform.OS === "ios" ? 168 : 174,
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
    imageWrapList: {
      width: Platform.OS === "ios" ? 132 : 140,
      padding: spacing.sm,
    },
    imageBox: {
      height: Platform.select({ web: 76, default: 94 }),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderRadius: radius.lg + 2,
      backgroundColor: c.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    imageBoxList: {
      height: 130,
      borderRadius: radius.xl + 4,
      position: "relative",
    },
    listSaveBadge: {
      position: "absolute",
      top: 10,
      left: 10,
      zIndex: 2,
      paddingHorizontal: 10,
      paddingVertical: 6,
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
    listSaveBadgeText: {
      fontSize: 10,
      letterSpacing: 0.45,
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
    bottomStackListEditorial: {
      marginTop: spacing.sm + 2,
      gap: spacing.sm + 2,
    },
    priceBlockListFull: {
      width: "100%",
      minWidth: 0,
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
      padding: Platform.select({ web: spacing.sm, default: spacing.md }),
    },
    contentCompact: {
      paddingTop: 6,
      paddingBottom: 6,
    },
    contentList: {
      flex: 1,
      paddingVertical: spacing.md + 2,
      paddingRight: spacing.lg,
      paddingLeft: spacing.sm,
      justifyContent: "flex-start",
    },
    category: {
      fontSize: typography.caption,
      textTransform: "none",
      marginBottom: 2,
    },
    name: {
      fontSize: typography.body + 1,
      lineHeight: 22,
      minHeight: 42,
    },
    description: {
      marginTop: 4,
      fontSize: typography.bodySmall,
      lineHeight: 17,
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
    bottomRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: spacing.md,
    },
    price: {
      fontSize: typography.body + 2,
    },
    priceList: {
      fontSize: 20,
    },
    button: {
      borderRadius: semanticRadius.control + 2,
      minWidth: Platform.select({ web: 72, default: 84 }),
      paddingHorizontal: Platform.select({ web: spacing.md, default: spacing.md + 2 }),
      paddingVertical: Platform.select({ web: 10, default: 11 }),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 8px 18px rgba(0,0,0,0.35)"
            : "0 6px 16px rgba(62, 40, 12, 0.14), inset 0 1px 0 rgba(255,255,255,0.15)",
        },
        default: {},
      }),
    },
    buttonDisabled: {},
    buttonText: {
      fontSize: typography.bodySmall,
      letterSpacing: 0.15,
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
        web: { boxShadow: "0 4px 12px rgba(15, 23, 42, 0.1)" },
        default: {},
      }),
    },
    stepButton: {
      width: 26,
      alignItems: "center",
      justifyContent: "center",
    },
    quantityText: {
      fontSize: typography.bodySmall,
    },
  });
}
