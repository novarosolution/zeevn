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
import { fonts, getSemanticColors, icon, radius, semanticRadius, spacing, typography } from "../../theme/tokens";
import { platformShadow } from "../../theme/shadowPlatform";
import { formatINR, formatINRWhole } from "../../utils/currency";
import { getImageUriCandidates } from "../../utils/image";
import { matchesShelfProduct } from "../../utils/shelfMatch";
import { APP_DISPLAY_NAME } from "../../constants/brand";
import { useTheme } from "../../context/ThemeContext";
import { useWishlistOptional } from "../../context/WishlistContext";
import { ALCHEMY, FONT_DISPLAY, FONT_DISPLAY_SEMI } from "../../theme/customerAlchemy";
import { usePrefersReducedMotion } from "../../utils/motion";

export default function ProductCardInner({
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
  /** PDP rails: stronger hover lift on desktop */
  railHover = false,
  /** Called after wishlist heart toggle: `(productId, isNowSaved)`. */
  onWishlistToggle,
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
  const wishlist = useWishlistOptional();
  const wishlistProductId = useMemo(
    () => String(product?.id ?? product?._id ?? "").trim(),
    [product?.id, product?._id]
  );
  const [localWishlist, setLocalWishlist] = useState(false);
  const isWishlistedRemote = Boolean(wishlist && wishlistProductId && wishlist.has(wishlistProductId));
  const isSaved = wishlist ? isWishlistedRemote : localWishlist;
  const [imageCandidateIndex, setImageCandidateIndex] = useState(0);
  const [secondaryImageIndex, setSecondaryImageIndex] = useState(0);
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
    const hoverScale =
      isWeb && (showSecondaryImage || (railHover && longPressRaised)) ? (railHover ? 1.04 : 1.03) : 1;
    hoverImageScale.value = withTiming(hoverScale, {
      duration: railHover ? 240 : 320,
      easing: Easing.out(Easing.cubic),
    });
    if (showSecondaryImage && hasSecondaryImage) {
      secondaryOpacity.value = withTiming(1, { duration: 200 });
      return;
    }
    secondaryOpacity.value = withTiming(0, { duration: 200 });
  }, [hasSecondaryImage, hoverImageScale, isWeb, longPressRaised, railHover, secondaryOpacity, showSecondaryImage]);

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
      if (!railHover) setShowSecondaryImage(true);
      if (railHover) {
        cardPress.value = withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) });
      }
    }
  };
  const onHoverOutImage = () => {
    if (isWeb) {
      setLongPressRaised(false);
      setShowSecondaryImage(false);
      if (railHover) {
        cardPress.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) });
      }
    }
  };
  const toggleWishlist = (event) => {
    event?.stopPropagation?.();
    triggerLightHaptic();
    const wasSaved = isSaved;
    if (wishlist && wishlistProductId) {
      wishlist.toggle(wishlistProductId);
      onWishlistToggle?.(wishlistProductId, !wasSaved);
    } else {
      setLocalWishlist((prev) => !prev);
      if (wishlistProductId) onWishlistToggle?.(wishlistProductId, !wasSaved);
    }
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
  const mutedColor = c.textSecondary || c.muted || "#4A4A4A";
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
  const handleCardPress = () => {
    if (Platform.OS === "ios") {
      Haptics.selectionAsync().catch(() => {});
    }
    onPress?.();
  };

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
          <View style={styles.premiumCardPressable}>
            <View ref={imageAreaRef} style={styles.premiumImageArea}>
              <Pressable
                onPress={handleCardPress}
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
                style={styles.premiumImageHit}
              >
              <Animated.View style={[styles.premiumImageScaleWrap, hoverImageScaleStyle]}>
                <View style={styles.premiumImageFrame}>
                  <View style={styles.premiumImageBackground} />
                  {!reducedMotion && !primaryLoaded ? (
                    <Animated.View style={[styles.shimmerSweep, shimmerStyle, { pointerEvents: "none" }]}>
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
                    <Animated.View style={[styles.premiumSecondaryImageLayer, secondaryFadeStyle, { pointerEvents: "none" }]}>
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
              </Pressable>

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
              <Pressable
                onPress={handleCardPress}
                onPressIn={onCardPressIn}
                onPressOut={onCardPressOut}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
                style={styles.premiumContentPressable}
              >
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
                      <Text style={[styles.newPillText, { color: c.textSecondary }]}>NEW</Text>
                    </View>
                  )}
                </View>
              </Pressable>
              <View style={styles.premiumBottomRow}>
                <Pressable
                  onPress={handleCardPress}
                  accessible={false}
                  importantForAccessibility="no-hide-descendants"
                  style={styles.premiumPriceHit}
                >
                  <View style={styles.gridPriceRow}>
                    <Text style={[styles.gridPriceCurrent, { color: inkColor }]}>{formatINRWhole(safePrice)}</Text>
                    {listMrp ? (
                      <Text style={[styles.gridPriceMrp, { color: mutedColor }]}>{formatINRWhole(listMrp)}</Text>
                    ) : null}
                  </View>
                </Pressable>
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
          </View>
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
      <View style={isList ? styles.touchableList : null}>
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
          <TouchableOpacity
            activeOpacity={0.94}
            onPress={onPress}
            onPressIn={isWeb ? undefined : handlePressIn}
            onPressOut={isWeb ? undefined : handlePressOut}
            accessibilityRole="button"
            accessibilityLabel={isList ? `${product.name}, ${formatINRWhole(safePrice)}` : undefined}
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
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={toggleWishlist}
            style={styles.wishlistBtn}
            accessibilityRole="button"
            accessibilityState={{ selected: isSaved }}
            accessibilityLabel={isSaved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          >
            <Ionicons name={isSaved ? "heart" : "heart-outline"} size={17} color={isSaved ? c.discount : c.textPrimary} />
          </TouchableOpacity>
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
        {isList ? (
          <View
            style={[
              styles.content,
              styles.contentList,
              compact && isList ? styles.contentCompact : null,
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.94}
              onPress={onPress}
              onPressIn={isWeb ? undefined : handlePressIn}
              onPressOut={isWeb ? undefined : handlePressOut}
              accessibilityRole="button"
              accessibilityLabel={`${product.name}, ${formatINRWhole(safePrice)}`}
            >
              {showCategory ? (
                <Text
                  style={[styles.category, { color: c.textSecondary, fontFamily: fonts.semibold }]}
                  numberOfLines={1}
                >
                  {product.category || "Groceries"}
                </Text>
              ) : null}
              <Text
                numberOfLines={2}
                style={[
                  styles.name,
                  compactListLayout ? styles.nameListCompact : null,
                  editorial ? styles.nameEditorial : null,
                  { color: c.textPrimary, fontFamily: editorial ? FONT_DISPLAY : fonts.semibold },
                ]}
              >
                {product.name}
              </Text>
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
                      <Text style={[styles.mrpList, { color: c.textSecondary, fontFamily: fonts.medium }]}>
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
              </View>
            </TouchableOpacity>
            <View
              style={[
                styles.bottomStackList,
                editorial ? styles.bottomStackListEditorial : null,
                compactListLayout ? styles.bottomStackListCompact : null,
              ]}
            >
              <View style={[styles.listCtaRow, compactListLayout ? styles.listCtaRowCompact : null]}>
                {quantity > 0 ? (
                  <View
                    style={[
                      styles.stepper,
                      compactListLayout ? styles.stepperListCompact : null,
                      { backgroundColor: editorial ? ALCHEMY.brown : c.primaryDark },
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
                        backgroundColor: isOutOfStock ? c.textMuted : editorial ? ALCHEMY.brown : c.primary,
                      },
                      editorial && !isOutOfStock ? styles.buttonEditorialList : null,
                      editorial && !isOutOfStock && compactListLayout ? styles.buttonEditorialListCompact : null,
                    ]}
                    activeOpacity={0.85}
                    onPress={onAddToCart}
                    disabled={isOutOfStock}
                  >
                    <Ionicons name="bag-add-outline" size={icon.xs} color={semantic.text.onPrimary} />
                    <Text style={[styles.buttonText, { fontFamily: fonts.bold, color: semantic.text.onPrimary }]}>
                      {isOutOfStock ? "Out of Stock" : "Add"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.94}
            onPress={onPress}
            onPressIn={isWeb ? undefined : handlePressIn}
            onPressOut={isWeb ? undefined : handlePressOut}
            accessibilityRole="button"
          >
            <View
              style={[
                styles.content,
                styles.contentGridHome,
                compactGridLayout ? styles.contentGridCompact : null,
                isWebGrid ? styles.contentGridWeb : null,
              ]}
            >
              {showCategory ? (
                <Text
                  style={[
                    styles.category,
                    styles.categoryGridHome,
                    compactGridLayout ? styles.categoryGridCompact : null,
                    isWebGrid ? styles.categoryGridWeb : null,
                    { color: c.textSecondary, fontFamily: fonts.semibold },
                  ]}
                  numberOfLines={1}
                >
                  {product.category || "Groceries"}
                </Text>
              ) : null}
              <Text
                numberOfLines={1}
                style={[
                  styles.name,
                  styles.nameGridHome,
                  compactGridLayout ? styles.nameGridCompact : null,
                  isWebGrid ? styles.nameGridWeb : null,
                  { color: c.textPrimary, fontFamily: fonts.semibold },
                ]}
              >
                {product.name}
              </Text>
              {showUnitRow ? (
                <Text
                  style={[
                    styles.unit,
                    compactGridLayout ? styles.unitGridCompact : null,
                    isWebGrid ? styles.unitGridWeb : null,
                    { color: c.textSecondary, fontFamily: fonts.medium },
                  ]}
                >
                  {product.unit || "1 pc"}
                </Text>
              ) : null}
              <View style={styles.gridPriceRow}>
                <Text style={[styles.gridPriceCurrent, { color: c.textPrimary }]}>{formatINR(safePrice)}</Text>
                {listMrp ? (
                  <Text style={[styles.gridPriceMrp, { color: c.textSecondary }]}>{formatINR(listMrp)}</Text>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </CardInner>
  );

  return (
    <Root style={styles.cardEntryWrap} {...(rootEntering ? { entering: rootEntering } : {})}>
      {legacyBody}
    </Root>
  );
}
import createStyles from "./productCardStyles";
import {
  getRatingMeta,
  getProductDisplayName,
  isWithinDays,
  getCardA11yLabel,
  getCategoryTone,
} from "./productCardUtils";
