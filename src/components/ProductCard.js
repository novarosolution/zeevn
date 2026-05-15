import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  Easing,
  FadeInDown,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { fonts, getSemanticColors, icon, radius, semanticRadius, spacing, typography } from "../theme/tokens";
import { platformShadow } from "../theme/shadowPlatform";
import { formatINR, formatINRWhole } from "../utils/currency";
import { getImageUriCandidates } from "../utils/image";
import { matchesShelfProduct } from "../utils/shelfMatch";
import { APP_DISPLAY_NAME } from "../constants/brand";
import { useTheme } from "../context/ThemeContext";
import { ALCHEMY, FONT_DISPLAY, FONT_DISPLAY_SEMI } from "../theme/customerAlchemy";
import { usePrefersReducedMotion } from "../utils/motion";

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
  const reducedMotion = usePrefersReducedMotion();
  const [imageCandidateIndex, setImageCandidateIndex] = useState(0);
  const [secondaryImageIndex, setSecondaryImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [showSecondaryImage, setShowSecondaryImage] = useState(false);
  const [longPressRaised, setLongPressRaised] = useState(false);
  const previewTimerRef = useRef(null);
  const imageAreaRef = useRef(null);
  const burstProgress = useSharedValue(0);
  const imageOpacity = useSharedValue(0);
  const secondaryOpacity = useSharedValue(0);
  const hoverImageScale = useSharedValue(1);
  const heartScale = useSharedValue(1);
  const heartOpacity = useSharedValue(1);
  const cardPress = useSharedValue(0);
  const shimmerX = useSharedValue(-140);
  const stepperY = useSharedValue(-24);
  const [primaryLoaded, setPrimaryLoaded] = useState(false);
  const primaryImage = useMemo(() => {
    if (String(product?.image || "").trim()) return product.image;
    if (Array.isArray(product?.images) && product.images.length) {
      return String(product.images[0] || "");
    }
    return "";
  }, [product?.image, product?.images]);
  const imageUris = useMemo(() => getImageUriCandidates(primaryImage), [primaryImage]);
  const imageUri = imageUris[imageCandidateIndex] || "";
  const secondaryImage = useMemo(() => {
    if (!Array.isArray(product?.images) || product.images.length < 2) return "";
    return String(product.images[1] || "");
  }, [product?.images]);
  const secondaryUris = useMemo(() => getImageUriCandidates(secondaryImage), [secondaryImage]);
  const secondaryUri = secondaryUris[secondaryImageIndex] || "";
  const hasSecondaryImage = Boolean(secondaryUri);
  const imageFailed = imageUris.length === 0 || imageCandidateIndex >= imageUris.length;
  const imageFallbackLabel = imageUris.length > 0 ? "Image unavailable" : "No image";
  const categoryTone = useMemo(
    () => getCategoryTone(product?.category, isDark, editorial, c),
    [product?.category, isDark, editorial, c]
  );
  const shelfMatch = useMemo(() => matchesShelfProduct(product), [product]);
  const listScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const imageFadeStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));
  const secondaryFadeStyle = useAnimatedStyle(() => ({
    opacity: secondaryOpacity.value,
  }));
  const hoverImageScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: hoverImageScale.value }],
  }));
  const heartIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));
  const burstDotStyleA = useAnimatedStyle(() => ({
    opacity: 1 - burstProgress.value,
    transform: [{ translateX: burstProgress.value * -12 }, { translateY: burstProgress.value * -6 }],
  }));
  const burstDotStyleB = useAnimatedStyle(() => ({
    opacity: 1 - burstProgress.value,
    transform: [{ translateX: burstProgress.value * 12 }, { translateY: burstProgress.value * -6 }],
  }));
  const burstDotStyleC = useAnimatedStyle(() => ({
    opacity: 1 - burstProgress.value,
    transform: [{ translateX: 0 }, { translateY: burstProgress.value * 12 }],
  }));
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - cardPress.value * 0.02 }],
    borderColor: interpolateColor(cardPress.value, [0, 1], [c.line || c.border || "#E8E6E1", c.ink || c.textPrimary || "#111827"]),
  }));
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
    opacity: primaryLoaded ? 0 : 1,
  }));
  const stepperStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: stepperY.value }],
    opacity: quantity > 0 ? 1 : 0,
  }));

  const hasEtaCopy = Boolean(String(product?.eta || "").trim());
  const showEtaBadge = showEta && hasEtaCopy;
  const showUnitRow = showUnit !== undefined ? showUnit : isList || !compact;
  const handleImageError = () => setImageCandidateIndex((index) => index + 1);
  const handleSecondaryError = () => setSecondaryImageIndex((index) => index + 1);

  useEffect(() => {
    setImageCandidateIndex(0);
    setPrimaryLoaded(false);
    imageOpacity.value = 0;
  }, [imageOpacity, primaryImage, setPrimaryLoaded]);

  useEffect(() => {
    setSecondaryImageIndex(0);
    secondaryOpacity.value = 0;
  }, [secondaryImage, secondaryOpacity]);

  useEffect(() => {
    hoverImageScale.value = withTiming(showSecondaryImage && isWeb ? 1.03 : 1, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
    if (showSecondaryImage && hasSecondaryImage) {
      secondaryOpacity.value = withTiming(1, { duration: 200 });
      return;
    }
    secondaryOpacity.value = withTiming(0, { duration: 200 });
  }, [hasSecondaryImage, hoverImageScale, isWeb, secondaryOpacity, showSecondaryImage]);

  useEffect(() => {
    if (reducedMotion || primaryLoaded) {
      shimmerX.value = -140;
      return;
    }
    shimmerX.value = -140;
    shimmerX.value = withRepeat(withTiming(220, { duration: 1400, easing: Easing.linear }), -1, false);
  }, [primaryLoaded, reducedMotion, shimmerX]);

  useEffect(() => {
    stepperY.value = withTiming(quantity > 0 ? 0 : -24, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [quantity, stepperY]);

  useEffect(
    () => () => {
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current);
      }
    },
    []
  );

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 120 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 120 });
  };
  const triggerLightHaptic = () => {
    if (Platform.OS !== "ios") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };
  const handleGridAdd = (meta) => {
    triggerLightHaptic();
    onAddToCart?.(meta);
  };
  const handleGridRemove = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    onRemoveFromCart?.();
  };
  const onCardPressIn = () => {
    cardPress.value = withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) });
    if (!isWeb && hasSecondaryImage) {
      previewTimerRef.current = setTimeout(() => {
        setShowSecondaryImage(true);
      }, 1500);
    }
  };
  const onCardPressOut = () => {
    cardPress.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) });
    setLongPressRaised(false);
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    if (!isWeb) {
      setShowSecondaryImage(false);
    }
  };
  const onHoverInImage = () => {
    if (isWeb) {
      setLongPressRaised(true);
      setShowSecondaryImage(true);
    }
  };
  const onHoverOutImage = () => {
    if (isWeb) {
      setLongPressRaised(false);
      setShowSecondaryImage(false);
    }
  };
  const toggleWishlist = (event) => {
    event?.stopPropagation?.();
    triggerLightHaptic();
    setIsSaved((prev) => !prev);
    heartScale.value = 1.2;
    heartOpacity.value = 0.6;
    heartScale.value = withSpring(1, { damping: 10, stiffness: 220 });
    heartOpacity.value = withTiming(1, { duration: 200 });
    if (!reducedMotion) {
      burstProgress.value = 0;
      burstProgress.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    }
  };

  const onAddPress = (event) => {
    event?.stopPropagation?.();
    if (isOutOfStock) {
      setShowNotifyModal(true);
      return;
    }
    const imageRectCallback = (x, y, width, height) => {
      handleGridAdd({
        sourceRect: { x, y, width, height },
        imageUri: imageUri || secondaryUri || primaryImage,
      });
    };
    if (imageAreaRef.current?.measureInWindow) {
      imageAreaRef.current.measureInWindow(imageRectCallback);
    } else {
      handleGridAdd();
    }
  };
  const onStepperRemove = (event) => {
    event?.stopPropagation?.();
    handleGridRemove();
  };
  const onStepperAdd = (event) => {
    event?.stopPropagation?.();
    handleGridAdd();
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
  const saleColor = c.sale || "#B23A3A";
  const inkColor = c.ink || c.textPrimary || "#111827";
  const mutedColor = c.muted || c.textMuted || "#6B7280";
  const ratingInfo = getRatingMeta(product);
  const displayName = getProductDisplayName(product);
  const isNewArrival = isWithinDays(product?.createdAt, 21) && !(offPct > 0);
  const cardA11yLabel = getCardA11yLabel({
    brand: String(product?.category || "Groceries"),
    name: displayName,
    rating: ratingInfo.rating,
    price: formatINRWhole(safePrice),
    mrp: listMrp ? formatINRWhole(listMrp) : "",
    outOfStock: isOutOfStock,
  });

  if (!isList) {
    return (
      <Root style={styles.cardEntryWrap} {...(rootEntering ? { entering: rootEntering } : {})}>
        <Animated.View
          style={[
            styles.premiumGridCard,
            animatedCardStyle,
            longPressRaised ? styles.premiumGridCardRaised : null,
          ]}
        >
          <Pressable
            onPress={() => {
              if (Platform.OS === "ios") {
                Haptics.selectionAsync().catch(() => {});
              }
              onPress?.();
            }}
            onPressIn={onCardPressIn}
            onPressOut={onCardPressOut}
            onLongPress={() => {
              setLongPressRaised(true);
              if (!isWeb && hasSecondaryImage) {
                setShowSecondaryImage(true);
              }
            }}
            delayLongPress={1500}
            onHoverIn={onHoverInImage}
            onHoverOut={onHoverOutImage}
            accessibilityRole="button"
            accessibilityLabel={cardA11yLabel}
            style={styles.premiumCardPressable}
          >
            <View ref={imageAreaRef} style={styles.premiumImageArea}>
              <Animated.View style={[styles.premiumImageScaleWrap, hoverImageScaleStyle]}>
                <View style={styles.premiumImageFrame}>
                  <View style={styles.premiumImageBackground} />
                  {!reducedMotion && !primaryLoaded ? (
                    <Animated.View style={[styles.shimmerSweep, shimmerStyle]} pointerEvents="none">
                      <LinearGradient
                        colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.45)", "rgba(255,255,255,0)"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFillObject}
                      />
                    </Animated.View>
                  ) : null}
                  {imageUri && !imageFailed ? (
                    <Animated.View style={[styles.imageFadeWrap, imageFadeStyle]}>
                      <Image
                        source={{ uri: imageUri }}
                        style={styles.premiumImage}
                        contentFit="cover"
                        transition={0}
                        recyclingKey={`${product?.id || "product"}:${imageUri}`}
                        onError={handleImageError}
                        onLoad={() => {
                          setPrimaryLoaded(true);
                          imageOpacity.value = withTiming(1, { duration: 200 });
                        }}
                      />
                    </Animated.View>
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
                  {hasSecondaryImage ? (
                    <Animated.View style={[styles.premiumSecondaryImageLayer, secondaryFadeStyle]} pointerEvents="none">
                      <Image
                        source={{ uri: secondaryUri }}
                        style={styles.premiumImage}
                        contentFit="cover"
                        transition={0}
                        recyclingKey={`${product?.id || "product"}:${secondaryUri}`}
                        onError={handleSecondaryError}
                      />
                    </Animated.View>
                  ) : null}
                </View>
              </Animated.View>

              {offPct != null && offPct > 0 ? (
                <View style={[styles.discountBadge, { backgroundColor: saleColor }]}>
                  <Ionicons name="flash" size={10} color="#FFFFFF" />
                  <Text style={styles.discountBadgeText}>{`${offPct}% OFF`}</Text>
                </View>
              ) : isNewArrival ? (
                <View style={[styles.newBadge, { backgroundColor: c.accent || "#C8A97E" }]}>
                  <Text style={[styles.newBadgeText, { color: inkColor }]}>NEW</Text>
                </View>
              ) : null}

              <Pressable
                onPress={toggleWishlist}
                style={styles.wishlistBtn}
                accessibilityRole="button"
                accessibilityState={{ selected: isSaved }}
                accessibilityLabel={isSaved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
              >
                {!reducedMotion ? (
                  <>
                    <Animated.View style={[styles.heartBurstDot, burstDotStyleA]} />
                    <Animated.View style={[styles.heartBurstDot, burstDotStyleB]} />
                    <Animated.View style={[styles.heartBurstDot, burstDotStyleC]} />
                  </>
                ) : null}
                <Animated.View style={heartIconStyle}>
                  <Ionicons name={isSaved ? "heart" : "heart-outline"} size={17} color={isSaved ? saleColor : inkColor} />
                </Animated.View>
              </Pressable>

              {isOutOfStock ? (
                <>
                  <View style={[styles.oosOverlay, { backgroundColor: c.surfaceAlt || "rgba(241,245,249,0.6)" }]} />
                  <View style={styles.oosRibbon}>
                    <Text style={styles.oosRibbonText}>OUT OF STOCK</Text>
                  </View>
                </>
              ) : null}

              {quantity > 0 ? null : (
                <Pressable
                  onPress={onAddPress}
                  style={({ pressed }) => [
                    styles.gridFloatingAdd,
                    isOutOfStock ? styles.notifyGhost : null,
                    pressed ? styles.gridFloatingAddPressed : null,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={isOutOfStock ? `Notify me when ${product.name} is back in stock` : `Add ${product.name} to cart`}
                >
                  {isOutOfStock ? (
                    <Text style={[styles.notifyGhostText, { color: inkColor }]}>Notify me</Text>
                  ) : (
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                  )}
                </Pressable>
              )}
            </View>

            <View style={styles.premiumContent}>
              {showCategory ? (
                <Text style={[styles.categoryPremium, { color: mutedColor }]} numberOfLines={1}>
                  {String(product.category || "Groceries").toUpperCase()}
                </Text>
              ) : null}
              <Text numberOfLines={1} style={[styles.namePremium, { color: inkColor }]}>
                {displayName}
              </Text>
              <View style={styles.ratingRow}>
                {ratingInfo.rating ? (
                  <>
                    <Ionicons name="star" size={10} color={c.accent || "#C8A97E"} />
                    <Text style={[styles.ratingValue, { color: inkColor }]}>{ratingInfo.rating}</Text>
                    <Text style={[styles.reviewCount, { color: mutedColor }]}>{`(${ratingInfo.reviewCount || 0})`}</Text>
                  </>
                ) : (
                  <View style={[styles.newPill, { backgroundColor: "rgba(200,169,126,0.14)" }]}>
                    <Text style={[styles.newPillText, { color: c.accent || "#C8A97E" }]}>NEW</Text>
                  </View>
                )}
              </View>
              <View style={styles.premiumBottomRow}>
                <View style={styles.gridPriceRow}>
                  <Text style={[styles.gridPriceCurrent, { color: inkColor }]}>{formatINRWhole(safePrice)}</Text>
                  {listMrp ? (
                    <Text style={[styles.gridPriceMrp, { color: mutedColor }]}>{formatINRWhole(listMrp)}</Text>
                  ) : null}
                </View>
                {quantity > 0 ? (
                  <Animated.View style={[styles.inlineStepper, stepperStyle]}>
                    <Pressable style={styles.inlineStepHit} onPress={onStepperRemove} accessibilityRole="button" accessibilityLabel="Decrease quantity">
                      <Ionicons name="remove" size={14} color="#FFFFFF" />
                    </Pressable>
                    <Text style={styles.inlineQty}>{quantity}</Text>
                    <Pressable style={styles.inlineStepHit} onPress={onStepperAdd} accessibilityRole="button" accessibilityLabel="Increase quantity">
                      <Ionicons name="add" size={14} color="#FFFFFF" />
                    </Pressable>
                  </Animated.View>
                ) : null}
              </View>
            </View>
          </Pressable>
        </Animated.View>
        <Modal transparent visible={showNotifyModal} animationType="fade" onRequestClose={() => setShowNotifyModal(false)}>
          <Pressable style={styles.notifyBackdrop} onPress={() => setShowNotifyModal(false)}>
            <View style={styles.notifyModal}>
              <Text style={[styles.notifyTitle, { color: inkColor }]}>Notify me when available</Text>
              <Text style={[styles.notifyBody, { color: mutedColor }]}>We&apos;ll alert you when this item is back in stock.</Text>
              <TextInput
                value={notifyEmail}
                onChangeText={setNotifyEmail}
                placeholder="Email address"
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.notifyInput, { borderColor: c.line || c.border || "#E8E6E1", color: inkColor }]}
                placeholderTextColor={mutedColor}
              />
              <View style={styles.notifyActions}>
                <Pressable onPress={() => setShowNotifyModal(false)} style={styles.notifyActionGhost}>
                  <Text style={[styles.notifyActionGhostText, { color: mutedColor }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    triggerLightHaptic();
                    setShowNotifyModal(false);
                  }}
                  style={[styles.notifyActionPrimary, { backgroundColor: inkColor }]}
                >
                  <Text style={styles.notifyActionPrimaryText}>Notify me</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>
      </Root>
    );
  }
  const legacyBody = (
    <CardInner
      style={[
        styles.card,
        !isList ? styles.cardGridRest : null,
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
        !isWeb ? listScaleStyle : null,
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
            !isList ? styles.imageWrapGridHome : null,
            isWebGrid ? styles.imageWrapGridWeb : null,
            isList ? styles.imageWrapList : null,
            compactGridLayout ? styles.imageWrapGridCompact : null,
            isList ? { backgroundColor: categoryTone.imageWrapBg } : null,
          ]}
        >
          <View
            style={[
              styles.imageBox,
              !isList ? styles.imageBoxGridHome : null,
              isWebGrid ? styles.imageBoxGridWeb : null,
              isList ? styles.imageBoxList : null,
              compactGridLayout ? styles.imageBoxGridCompact : null,
              isList ? { backgroundColor: categoryTone.imageBoxBg, borderColor: categoryTone.imageBoxBorder } : null,
            ]}
          >
            {imageUri && !imageFailed ? (
              <Animated.View style={[styles.imageFadeWrap, imageFadeStyle]}>
                <Image
                  source={{ uri: imageUri }}
                  style={[styles.image, isWebGrid ? styles.imageGridWeb : null]}
                  contentFit="cover"
                  transition={0}
                  recyclingKey={`${product?.id || "product"}:${imageUri}`}
                  onError={handleImageError}
                  onLoad={() => {
                    imageOpacity.value = withTiming(1, { duration: 200 });
                  }}
                />
              </Animated.View>
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
                <Text style={[styles.discountBadgeText, { fontFamily: fonts.bold, color: c.onPrimary }]}>
                  {offPct}% off
                </Text>
              </View>
            ) : null}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setIsSaved((prev) => !prev)}
              style={styles.wishlistBtn}
              accessibilityRole="button"
              accessibilityLabel={`Save ${product.name} to wishlist`}
            >
              <Ionicons name={isSaved ? "heart" : "heart-outline"} size={17} color={isSaved ? c.discount : c.textPrimary} />
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
          {!isList ? (
            quantity > 0 ? (
              <View style={styles.gridFloatingStepper}>
                <TouchableOpacity style={styles.gridFloatingStepHit} activeOpacity={0.85} onPress={handleGridRemove}>
                  <Ionicons name="remove" size={icon.sm} color={c.onPrimary} />
                </TouchableOpacity>
                <Text style={[styles.gridFloatingQty, { color: c.onPrimary }]}>{quantity}</Text>
                <TouchableOpacity style={styles.gridFloatingStepHit} activeOpacity={0.85} onPress={handleGridAdd}>
                  <Ionicons name="add" size={icon.sm} color={c.onPrimary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.gridFloatingAdd, isOutOfStock ? styles.gridFloatingAddDisabled : null]}
                activeOpacity={0.85}
                onPress={handleGridAdd}
                disabled={isOutOfStock}
              >
                <Ionicons name={isOutOfStock ? "close" : "add"} size={18} color={c.onPrimary} />
              </TouchableOpacity>
            )
          ) : null}
        </View>
        <View
          style={[
            styles.content,
            !isList ? styles.contentGridHome : null,
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
                !isList ? styles.categoryGridHome : null,
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
            numberOfLines={isList ? 2 : 1}
            style={[
              styles.name,
              !isList ? styles.nameGridHome : null,
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
                      { color: c.textPrimary, fontFamily: fonts.semibold },
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
            <View style={styles.gridPriceRow}>
              <Text style={[styles.gridPriceCurrent, { color: c.textPrimary }]}>{formatINR(safePrice)}</Text>
              {listMrp ? (
                <Text style={[styles.gridPriceMrp, { color: c.textMuted }]}>{formatINR(listMrp)}</Text>
              ) : null}
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

function getRatingMeta(product) {
  const rawRating = Number(product?.rating ?? product?.avgRating ?? product?.averageRating ?? product?.stars);
  const rawReviews = Number(product?.reviewCount ?? product?.reviewsCount ?? product?.numReviews ?? product?.ratingsCount);
  const hasRating = Number.isFinite(rawRating) && rawRating > 0;
  return {
    rating: hasRating ? rawRating.toFixed(1) : "",
    reviewCount: Number.isFinite(rawReviews) && rawReviews > 0 ? Math.round(rawReviews) : 0,
  };
}

function getProductDisplayName(product) {
  const name = String(product?.name || "").trim() || "Product";
  const unit = String(product?.unit || product?.size || "").trim();
  if (!unit) return name;
  const normalizedName = name.toLowerCase();
  const normalizedUnit = unit.toLowerCase();
  if (normalizedName.includes(normalizedUnit)) return name;
  return `${name} ${unit}`;
}

function isWithinDays(value, days) {
  if (!value) return false;
  const created = new Date(value).getTime();
  if (!Number.isFinite(created)) return false;
  const now = Date.now();
  return now - created <= days * 24 * 60 * 60 * 1000;
}

function getCardA11yLabel({ brand, name, rating, price, mrp, outOfStock }) {
  const parts = [brand, name];
  if (rating) {
    parts.push(`${rating} stars`);
  }
  parts.push(price);
  if (mrp) {
    parts.push(`was ${mrp}`);
  }
  if (outOfStock) {
    parts.push("out of stock");
  }
  return parts.filter(Boolean).join(", ");
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
  const lineBorder = isDark ? c.border : "#E8E6E1";
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
      borderColor: lineBorder,
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
    cardGridRest: {
      borderRadius: 14,
      borderColor: lineBorder,
      marginBottom: 0,
      ...Platform.select({
        web: {
          boxShadow: "none",
          backgroundImage: "none",
        },
        ios: {
          shadowColor: "transparent",
          shadowOpacity: 0,
          shadowRadius: 0,
          shadowOffset: { width: 0, height: 0 },
        },
        android: { elevation: 0 },
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
      borderColor: lineBorder,
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
      borderLeftWidth: 0,
    },
    cardGridWeb: {
      minHeight: 0,
    },
    cardGridCompact: {
      minHeight: 0,
    },
    premiumGridCard: {
      width: "100%",
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.line || lineBorder,
      backgroundColor: c.surface,
      overflow: "hidden",
    },
    premiumGridCardRaised: {
      ...Platform.select({
        web: { boxShadow: "0 8px 18px rgba(15,23,42,0.10)" },
        ios: {
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
        },
        android: { elevation: 3 },
        default: {},
      }),
    },
    premiumCardPressable: {
      width: "100%",
    },
    premiumImageArea: {
      position: "relative",
      width: "100%",
      aspectRatio: 4 / 5,
      backgroundColor: c.surfaceAlt || "rgba(0,0,0,0.03)",
      overflow: "hidden",
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
    },
    premiumImageScaleWrap: {
      width: "100%",
      height: "100%",
    },
    premiumImageFrame: {
      width: "100%",
      height: "100%",
      overflow: "hidden",
    },
    premiumImageBackground: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.surfaceAlt || "rgba(0,0,0,0.03)",
    },
    premiumImage: {
      width: "100%",
      height: "100%",
    },
    premiumSecondaryImageLayer: {
      ...StyleSheet.absoluteFillObject,
    },
    shimmerSweep: {
      position: "absolute",
      top: 0,
      bottom: 0,
      width: "48%",
      zIndex: 2,
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
      borderLeftWidth: 0,
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
      borderLeftWidth: 0,
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
    imageWrapGridHome: {
      padding: 8,
      paddingBottom: 0,
      backgroundColor: "transparent",
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
    imageBoxGridHome: {
      height: undefined,
      aspectRatio: 4 / 5,
      borderRadius: 12,
      borderWidth: 0,
      backgroundColor: c.surfaceMuted,
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
      top: 10,
      left: 10,
      zIndex: 2,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
      borderWidth: 0,
      borderColor: "transparent",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
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
      fontSize: 10,
      letterSpacing: 0.4,
      color: "#FFFFFF",
      fontFamily: fonts.semibold,
      textTransform: "uppercase",
    },
    newBadge: {
      position: "absolute",
      top: 10,
      left: 10,
      zIndex: 2,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    newBadgeText: {
      fontSize: 10,
      letterSpacing: 0.4,
      fontFamily: fonts.semibold,
      textTransform: "uppercase",
    },
    wishlistBtn: {
      position: "absolute",
      top: 10,
      right: 10,
      zIndex: 2,
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.06)",
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        web: { boxShadow: "0 2px 10px rgba(15,23,42,0.14)" },
        ios: {
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 6,
        },
        android: { elevation: 2 },
        default: {},
      }),
    },
    heartBurstDot: {
      position: "absolute",
      width: 4,
      height: 4,
      borderRadius: 999,
      backgroundColor: c.accent || "#C8A97E",
      zIndex: 1,
    },
    oosOverlay: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.6,
      zIndex: 3,
    },
    oosRibbon: {
      position: "absolute",
      left: -34,
      top: 16,
      width: 170,
      paddingVertical: 4,
      backgroundColor: "rgba(0,0,0,0.7)",
      transform: [{ rotate: "-24deg" }],
      zIndex: 4,
      alignItems: "center",
    },
    oosRibbonText: {
      color: "#FFFFFF",
      fontSize: 11,
      letterSpacing: 0.5,
      fontFamily: fonts.semibold,
      textTransform: "uppercase",
    },
    cardListEditorial: {
      borderLeftWidth: 0,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: lineBorder,
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
    contentGridHome: {
      padding: 12,
      paddingTop: 12,
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
    categoryGridHome: {
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 2,
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
    nameGridHome: {
      fontSize: 14,
      lineHeight: 18,
      minHeight: 18,
      fontWeight: "500",
    },
    imageFadeWrap: {
      width: "100%",
      height: "100%",
    },
    gridPriceRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 6,
      marginTop: 0,
    },
    gridPriceCurrent: {
      fontSize: 16,
      lineHeight: 20,
      fontFamily: fonts.semibold,
    },
    gridPriceMrp: {
      fontSize: 12,
      textDecorationLine: "line-through",
      fontFamily: fonts.medium,
    },
    gridFloatingAdd: {
      position: "absolute",
      right: 10,
      bottom: 10,
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.ink || c.textPrimary || "#111827",
      ...Platform.select({
        web: { boxShadow: "0 4px 12px rgba(0,0,0,0.18)" },
        ios: {
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 12,
        },
        android: { elevation: 3 },
        default: {},
      }),
    },
    notifyGhost: {
      width: "auto",
      minWidth: 88,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.line || lineBorder,
      backgroundColor: "rgba(255,255,255,0.95)",
    },
    notifyGhostText: {
      fontSize: 11,
      fontFamily: fonts.semibold,
      letterSpacing: 0.2,
    },
    gridFloatingAddDisabled: {
      backgroundColor: c.textMuted,
    },
    gridFloatingAddPressed: {
      transform: [{ scale: 0.92 }],
    },
    gridFloatingStepper: {
      position: "absolute",
      right: 8,
      bottom: -12,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.accentGreen || c.secondaryDark,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 2,
    },
    gridFloatingStepHit: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    gridFloatingQty: {
      minWidth: 20,
      textAlign: "center",
      fontFamily: fonts.bold,
      fontSize: 13,
    },
    premiumContent: {
      padding: 12,
      gap: 4,
    },
    categoryPremium: {
      fontSize: 10,
      fontFamily: fonts.semibold,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: 2,
    },
    namePremium: {
      fontSize: 14,
      lineHeight: 18,
      fontFamily: fonts.medium,
      fontWeight: "500",
    },
    ratingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      marginTop: 2,
      minHeight: 14,
    },
    ratingValue: {
      fontSize: 11,
      fontFamily: fonts.semibold,
    },
    reviewCount: {
      fontSize: 11,
      fontFamily: fonts.medium,
    },
    newPill: {
      alignSelf: "flex-start",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 999,
    },
    newPillText: {
      fontSize: 10,
      fontFamily: fonts.semibold,
      letterSpacing: 0.35,
      textTransform: "uppercase",
    },
    premiumBottomRow: {
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    inlineStepper: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 999,
      backgroundColor: c.ink || c.textPrimary || "#111827",
      paddingHorizontal: 2,
      height: 30,
    },
    inlineStepHit: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    inlineQty: {
      color: "#FFFFFF",
      minWidth: 18,
      textAlign: "center",
      fontSize: 12,
      fontFamily: fonts.semibold,
    },
    notifyBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    notifyModal: {
      width: "100%",
      maxWidth: 360,
      borderRadius: 14,
      backgroundColor: c.surface,
      padding: 16,
      gap: 10,
    },
    notifyTitle: {
      fontSize: 16,
      fontFamily: fonts.semibold,
    },
    notifyBody: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fonts.regular,
    },
    notifyInput: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      fontFamily: fonts.regular,
    },
    notifyActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 2,
    },
    notifyActionGhost: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 8,
    },
    notifyActionGhostText: {
      fontSize: 13,
      fontFamily: fonts.medium,
    },
    notifyActionPrimary: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    notifyActionPrimaryText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontFamily: fonts.semibold,
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
