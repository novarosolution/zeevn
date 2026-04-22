import React, { useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View, Pressable } from "react-native";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { fonts, radius, spacing, typography } from "../theme/tokens";
import { platformShadow } from "../theme/shadowPlatform";
import { formatINR, formatINRWhole } from "../utils/currency";
import { getImageUriCandidates } from "../utils/image";
import { matchesShelfProduct } from "../utils/shelfMatch";
import { useTheme } from "../context/ThemeContext";
import { ALCHEMY, FONT_DISPLAY } from "../theme/customerAlchemy";

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
  const { colors: c, shadowPremium, shadowLift, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(c, shadowPremium, shadowLift, isDark),
    [c, shadowPremium, shadowLift, isDark]
  );

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
  const categoryTone = useMemo(
    () => getCategoryTone(product?.category, isDark, editorial),
    [product?.category, isDark, editorial]
  );
  const shelfMatch = useMemo(() => matchesShelfProduct(product), [product]);
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const hasEtaCopy = Boolean(String(product?.eta || "").trim());
  const showEtaBadge = showEta && hasEtaCopy;
  const showUnitRow = showUnit !== undefined ? showUnit : isList || !compact;

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
  const rootEntering =
    !isWeb && index != null
      ? FadeInDown.delay(Math.min(index * 52, 520)).duration(400)
      : undefined;

  const isPremiumCatalog = compact && !isList;

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
  const cardBody = isPremiumCatalog ? (
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
              <View style={[styles.qcDiscountBadge, { backgroundColor: c.primary }]}>
                <Text style={[styles.qcDiscountBadgeText, { fontFamily: fonts.bold, color: c.onPrimary }]} numberOfLines={1}>
                  {discountBadge}
                </Text>
              </View>
            ) : null}
            <View style={[styles.qcImageInner, { backgroundColor: isDark ? "#292524" : "#FFFFFF" }]}>
              {imageUri && !imageFailed ? (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.qcImage}
                  contentFit="contain"
                  transition={240}
                  recyclingKey={String(product?.id || imageUri)}
                />
              ) : (
                <View style={styles.imageFallback}>
                  <Ionicons name="image-outline" size={26} color={c.textMuted} />
                  <Text style={[styles.imageFallbackText, { fontFamily: fonts.semibold }]}>No image</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.qcBody}>
          <Text style={[styles.qcTitle, { color: c.textPrimary, fontFamily: fonts.bold }]} numberOfLines={2}>
            {product.name}
          </Text>
          <View style={styles.qcUnitRow}>
            <Text style={[styles.qcUnit, { color: c.textMuted, fontFamily: fonts.medium }]} numberOfLines={1}>
              {product.unit || "1 pc"}
            </Text>
            <Ionicons name="chevron-down" size={12} color={c.secondary} style={{ opacity: 0.85 }} />
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
            </View>
            {quantity > 0 ? (
              <View style={[styles.qcStepper, { borderColor: c.secondary }]}>
                <TouchableOpacity style={styles.qcStepHit} activeOpacity={0.85} onPress={onRemoveFromCart}>
                  <Ionicons name="remove" size={16} color={c.secondary} />
                </TouchableOpacity>
                <Text style={[styles.qcStepQty, { color: c.textPrimary, fontFamily: fonts.bold }]}>{quantity}</Text>
                <TouchableOpacity style={styles.qcStepHit} activeOpacity={0.85} onPress={onAddToCart}>
                  <Ionicons name="add" size={16} color={c.secondary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.qcAddBtn,
                  { borderColor: c.secondary, backgroundColor: c.surface },
                  isOutOfStock && { borderColor: c.textMuted, opacity: 0.7 },
                ]}
                activeOpacity={0.88}
                onPress={onAddToCart}
                disabled={isOutOfStock}
              >
                <Text style={[styles.qcAddBtnText, { color: isOutOfStock ? c.textMuted : c.secondary, fontFamily: fonts.extrabold }]}>
                  {isOutOfStock ? "OUT" : "ADD"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Pressable>
    </CardInner>
  ) : (
    <CardInner
      style={[
        styles.card,
        shelfMatch && !isPremiumCatalog ? styles.cardShelfAccent : null,
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
                recyclingKey={String(product?.id || imageUri)}
              />
            ) : (
              <View style={styles.imageFallback}>
                <Ionicons name="image-outline" size={18} color={c.textMuted} />
                <Text style={[styles.imageFallbackText, { fontFamily: fonts.semibold }]}>No image</Text>
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
              <Ionicons name="time-outline" size={11} color={c.primary} />
              <Text style={[styles.etaText, { color: c.textPrimary, fontFamily: fonts.bold }]} numberOfLines={1}>
                {String(product.eta).trim()}
              </Text>
            </View>
          ) : null}
          {!isList && !compact && product.isSpecial ? (
            <View style={styles.badge}>
              <MaterialCommunityIcons name="star-four-points-outline" size={11} color={c.onPrimary} />
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
                  <Ionicons name="cube-outline" size={11} color={c.textSecondary} />
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
                    size={11}
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
                    <Ionicons name="information-circle-outline" size={11} color={c.textSecondary} />
                    <Text style={[styles.metaPillTextList, { color: c.textSecondary, fontFamily: fonts.bold }]} numberOfLines={1}>
                      {String(product.eta).trim()}
                    </Text>
                  </View>
                ) : null}
              </View>
              {String(product.description || "").trim() ? (
                <Text numberOfLines={editorial ? 2 : 2} style={[styles.description, { color: c.textSecondary, fontFamily: fonts.regular }]}>
                  {String(product.description).trim()}
                </Text>
              ) : !editorial ? (
                <Text numberOfLines={2} style={[styles.description, { color: c.textSecondary, fontFamily: fonts.regular }]}>
                  Trusted picks from KankreG.
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
                      <Ionicons name="remove" size={16} color={c.onPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.quantityText, { color: c.onPrimary, fontFamily: fonts.bold }]}>{quantity}</Text>
                    <TouchableOpacity style={styles.stepButton} activeOpacity={0.85} onPress={onAddToCart}>
                      <Ionicons name="add" size={16} color={c.onPrimary} />
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
                    <Ionicons name="bag-add-outline" size={compact && !isList ? 14 : 15} color="#FFFCF8" />
                    <Text style={[styles.buttonText, { fontFamily: fonts.bold, color: "#FFFCF8" }]}>
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
                    <Ionicons name="remove" size={16} color={c.onPrimary} />
                  </TouchableOpacity>
                  <Text style={[styles.quantityText, { color: c.onPrimary, fontFamily: fonts.bold }]}>{quantity}</Text>
                  <TouchableOpacity style={styles.stepButton} activeOpacity={0.85} onPress={onAddToCart}>
                    <Ionicons name="add" size={16} color={c.onPrimary} />
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
                  <Ionicons name="bag-add-outline" size={compact && !isList ? 14 : 15} color="#FFFCF8" />
                  <Text style={[styles.buttonText, { fontFamily: fonts.bold, color: "#FFFCF8" }]}>
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
      {cardBody}
    </Root>
  );
}

function getCategoryTone(rawCategory, isDark, editorial) {
  const key = String(rawCategory || "").toLowerCase();
  if (editorial && !isDark) {
    return {
      cardBg: ALCHEMY.cardBg,
      cardBorder: "rgba(116, 79, 28, 0.14)",
      imageWrapBg: ALCHEMY.creamAlt,
      imageBoxBg: "#FFFCF8",
      imageBoxBorder: ALCHEMY.pillInactive,
    };
  }
  if (editorial && isDark) {
    return {
      cardBg: "#1C1917",
      cardBorder: "#44403C",
      imageWrapBg: "rgba(28,25,23,0.92)",
      imageBoxBg: "#292524",
      imageBoxBorder: "#57534E",
    };
  }
  if (isDark) {
    return {
      cardBg: "#1C1917",
      cardBorder: "#44403C",
      imageWrapBg: "rgba(28,25,23,0.9)",
      imageBoxBg: "#292524",
      imageBoxBorder: "#57534E",
    };
  }
  if (key.includes("dairy")) {
    return {
      cardBg: "#F8FAFC",
      cardBorder: "#E5E7EB",
      imageWrapBg: "rgba(249,250,251,0.95)",
      imageBoxBg: "#FFFFFF",
      imageBoxBorder: "#E5E7EB",
    };
  }
  if (key.includes("fruit") || key.includes("vegetable")) {
    return {
      cardBg: "#F0FDF4",
      cardBorder: "#D1FAE5",
      imageWrapBg: "rgba(236,253,245,0.9)",
      imageBoxBg: "#FFFFFF",
      imageBoxBorder: "#BBF7D0",
    };
  }
  if (key.includes("snack") || key.includes("bakery")) {
    return {
      cardBg: "#FFFBEB",
      cardBorder: "#FDE68A",
      imageWrapBg: "rgba(255,251,235,0.9)",
      imageBoxBg: "#FFFFFF",
      imageBoxBorder: "#FCD34D",
    };
  }
  if (key.includes("beverage") || key.includes("drink")) {
    return {
      cardBg: "#EFF6FF",
      cardBorder: "#BFDBFE",
      imageWrapBg: "rgba(239,246,255,0.9)",
      imageBoxBg: "#FFFFFF",
      imageBoxBorder: "#93C5FD",
    };
  }
  return {
    cardBg: "#F9FAFB",
    cardBorder: "#E5E7EB",
    imageWrapBg: "rgba(249,250,251,0.9)",
    imageBoxBg: "#FFFFFF",
    imageBoxBorder: "#E5E7EB",
  };
}

function createStyles(c, shadowPremium, shadowLift, isDark) {
  return StyleSheet.create({
    cardEntryWrap: {
      width: "100%",
    },
    card: {
      width: "100%",
      minHeight: 168,
      backgroundColor: c.surface,
      borderRadius: radius.xxl,
      overflow: "hidden",
      marginBottom: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderTopWidth: 2,
      borderTopColor: isDark ? c.primaryBorder : ALCHEMY.gold,
      ...shadowPremium,
    },
    /** Quick-commerce tile: white card, blue discount badge, ETA row, outlined ADD. */
    cardQcShell: {
      width: "100%",
      maxWidth: "100%",
      alignSelf: "center",
      minHeight: 0,
      marginBottom: 0,
      padding: 0,
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderTopWidth: 2,
      borderTopColor: isDark ? c.primaryBorder : ALCHEMY.gold,
      overflow: "hidden",
      ...shadowLift,
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
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      padding: spacing.xs,
      overflow: "hidden",
    },
    qcDiscountBadge: {
      position: "absolute",
      top: 6,
      left: 6,
      zIndex: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.md,
      maxWidth: "62%",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255, 252, 248, 0.35)",
    },
    qcDiscountBadgeText: {
      fontSize: 10,
      letterSpacing: 0.5,
    },
    qcImageInner: {
      borderRadius: radius.md,
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
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    qcTitle: {
      fontSize: typography.bodySmall,
      lineHeight: 19,
      letterSpacing: -0.25,
      minHeight: 36,
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
      fontSize: typography.h3,
      letterSpacing: -0.4,
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
    qcAddBtn: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      minWidth: 58,
      flexShrink: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    qcAddBtnText: {
      fontSize: typography.caption,
      letterSpacing: 0.6,
    },
    qcStepper: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.md,
      paddingHorizontal: 4,
      height: 32,
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
      borderRadius: radius.xl,
      marginBottom: 0,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      ...platformShadow({
        web: { boxShadow: "0 6px 20px rgba(28, 25, 23, 0.07), 0 2px 8px rgba(61, 42, 18, 0.04)" },
        ios: {
          shadowColor: "#3D2A12",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.28 : 0.09,
          shadowRadius: 12,
        },
        android: { elevation: 3 },
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
      height: 76,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderRadius: radius.lg,
      backgroundColor: c.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    imageBoxList: {
      height: 128,
      borderRadius: radius.xl,
      position: "relative",
    },
    listSaveBadge: {
      position: "absolute",
      top: 8,
      left: 8,
      zIndex: 2,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: radius.md,
    },
    listSaveBadgeText: {
      fontSize: 10,
      letterSpacing: 0.4,
    },
    cardListEditorial: {
      borderLeftWidth: 3,
      borderLeftColor: ALCHEMY.gold,
      borderTopWidth: 2,
      borderTopColor: isDark ? "rgba(201, 162, 39, 0.35)" : ALCHEMY.gold,
      borderRadius: radius.xxl,
      ...Platform.select({
        ios: {
          shadowColor: "#3D2A12",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.26 : 0.12,
          shadowRadius: 18,
        },
        android: { elevation: isDark ? 5 : 4 },
        web: { boxShadow: "0 12px 36px rgba(61, 42, 18, 0.1), 0 4px 12px rgba(28, 25, 23, 0.04)" },
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
      marginTop: spacing.sm + 4,
      gap: spacing.md,
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
      minWidth: 88,
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
      gap: 4,
    },
    imageFallbackText: {
      fontSize: typography.caption,
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
      padding: spacing.sm,
    },
    contentCompact: {
      paddingTop: 6,
      paddingBottom: 6,
    },
    contentList: {
      flex: 1,
      paddingVertical: spacing.md,
      paddingRight: spacing.lg,
      paddingLeft: spacing.xs,
      justifyContent: "flex-start",
    },
    category: {
      fontSize: typography.caption,
      textTransform: "none",
      marginBottom: 2,
    },
    name: {
      fontSize: typography.body,
      minHeight: 36,
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
      borderRadius: radius.md,
      paddingHorizontal: 8,
      paddingVertical: 5,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      maxWidth: "100%",
    },
    metaPillTextList: {
      fontSize: 10,
      flexShrink: 1,
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
      fontSize: typography.body,
    },
    priceList: {
      fontSize: 20,
    },
    button: {
      borderRadius: radius.lg,
      minWidth: 64,
      paddingHorizontal: spacing.sm,
      paddingVertical: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    buttonDisabled: {},
    buttonText: {
      fontSize: typography.bodySmall,
      letterSpacing: 0.15,
    },
    stepper: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: radius.lg,
      paddingHorizontal: 4,
      height: 30,
      minWidth: 68,
      justifyContent: "space-between",
    },
    stepButton: {
      width: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    quantityText: {
      fontSize: typography.bodySmall,
    },
  });
}
