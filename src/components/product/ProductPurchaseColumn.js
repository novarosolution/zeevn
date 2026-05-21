import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutAnimation,
  Linking,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  UIManager,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RotateCcw, ShieldCheck, Truck, Wallet, Star } from "lucide-react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";
import AnimatedCheckmark from "./motion/AnimatedCheckmark";
import { useTheme } from "../../context/ThemeContext";
import { useWishlistOptional } from "../../context/WishlistContext";
import { PRODUCT_SCREEN, fillProductScreen } from "../../content/appContent";
import { RUNTIME_SUPPORT_EMAIL, RUNTIME_SUPPORT_WHATSAPP_URL } from "../../constants/runtimeConfig";
import { checkPincodeServiceability } from "../../services/pincodeService";
import { pointerEventsProp } from "../../utils/pointerEventsStyle";
import { fonts } from "../../theme/tokens";
import { formatINRWhole } from "../../utils/currency";
import useReducedMotion from "../../hooks/useReducedMotion";
import {
  hapticImpactLight,
  hapticSelection,
  hapticSuccess,
  hapticWarning,
} from "../../utils/haptics";
import LiveRegion from "../a11y/LiveRegion";
import { decorativeTextA11yProps } from "../../utils/a11y";
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function isVariantOutOfStock(product, variantLabel) {
  if (product?.inStock === false || Number(product?.stockQty || 0) <= 0) return true;
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const match = variants.find((v) => String(v?.label || "").trim() === String(variantLabel || "").trim());
  if (match && match.inStock === false) return true;
  return false;
}

function RatingStars({ value, semanticPalette }) {
  const rounded = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          size={13}
          color={index <= rounded ? semanticPalette.accent : semanticPalette.inkMuted}
          fill={index <= rounded ? semanticPalette.accent : "transparent"}
          strokeWidth={1.8}
        />
      ))}
    </View>
  );
}

function PurchaseVariantChip({ label, selected, disabled, onPress, onPressWhenDisabled, semanticPalette, reducedMotion, forceDisabled }) {
  const isDisabled = disabled || forceDisabled;
  const scale = useSharedValue(selected ? 1 : 1);
  const border = useSharedValue(selected ? 1.5 : 1);

  useEffect(() => {
    if (reducedMotion) return;
    if (selected) {
      scale.value = 0.96;
      scale.value = withSpring(1, { damping: 14, stiffness: 320 });
      border.value = withTiming(1.5, { duration: 200, easing: Easing.out(Easing.cubic) });
    } else {
      border.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
    }
  }, [border, reducedMotion, scale, selected]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderWidth: border.value,
  }));

  const handlePress = () => {
    if (!isDisabled) hapticSelection();
    if (isDisabled) onPressWhenDisabled?.();
    else onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: isDisabled }}
      accessibilityLabel={isDisabled ? `${label}, out of stock` : label}
      style={({ pressed }) => [
        {
          opacity: isDisabled ? 0.4 : pressed ? 0.92 : 1,
        },
      ]}
    >
      <Animated.View
        style={[
          {
            position: "relative",
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 999,
            borderColor: selected ? semanticPalette.accent : semanticPalette.line,
            backgroundColor: semanticPalette.surface,
            overflow: "hidden",
          },
          animStyle,
        ]}
      >
      {selected ? (
        <View
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: semanticPalette.accent,
          }}
        />
      ) : null}
      {isDisabled ? (
        <View
          style={{
            position: "absolute",
            left: 8,
            right: 8,
            top: "50%",
            height: 1,
            backgroundColor: semanticPalette.inkMuted,
            transform: [{ rotate: "-12deg" }],
          }}
          {...pointerEventsProp("none")}
        />
      ) : null}
      <Text
        style={{
          fontFamily: fonts.semibold,
          fontSize: 13,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: semanticPalette.ink,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
      </Animated.View>
    </Pressable>
  );
}

function AnimatedPriceBlock({ displayPrice, mrp, showMrp, offPct, styles, semanticPalette, reducedMotion }) {
  const opacity = useSharedValue(1);
  const priceScale = useSharedValue(1);
  const badgeY = useSharedValue(offPct != null && offPct > 0 ? 4 : 0);
  const badgeOpacity = useSharedValue(offPct != null && offPct > 0 ? 0 : 1);
  const prevPriceRef = React.useRef(displayPrice);

  useEffect(() => {
    if (reducedMotion) return;
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
    if (prevPriceRef.current !== displayPrice) {
      priceScale.value = 1;
      priceScale.value = withSpring(1.05, { damping: 12, stiffness: 280 }, () => {
        priceScale.value = withSpring(1, { damping: 14, stiffness: 300 });
      });
      prevPriceRef.current = displayPrice;
    }
    if (offPct != null && offPct > 0) {
      badgeY.value = 4;
      badgeOpacity.value = 0;
      badgeY.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });
      badgeOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
    }
  }, [badgeOpacity, badgeY, displayPrice, mrp, offPct, opacity, priceScale, reducedMotion, showMrp]);

  const priceAnim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: priceScale.value }],
  }));
  const badgeAnim = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ translateY: badgeY.value }],
  }));

  return (
    <Animated.View style={[styles.priceRow, priceAnim]}>
      <Animated.Text style={styles.priceCurrent}>{formatINRWhole(displayPrice)}</Animated.Text>
      {showMrp && mrp != null ? <Text style={styles.mrp}>{formatINRWhole(mrp)}</Text> : null}
      {offPct != null && offPct > 0 ? (
        <Animated.View style={badgeAnim}>
          <Badge variant="sale" size="md">
            {fillProductScreen(PRODUCT_SCREEN.savePctChipUpper, { pct: String(offPct) })}
          </Badge>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

function PincodeResultPanel({ pincodeResult, styles, semanticPalette, reducedMotion, onAnnounce }) {
  const translateY = useSharedValue(reducedMotion ? 0 : 6);
  const opacity = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: reducedMotion ? 1 : 220, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(1, { duration: reducedMotion ? 1 : 220, easing: Easing.out(Easing.cubic) });
    if (pincodeResult?.serviceable && pincodeResult.deliversByLabel) {
      onAnnounce?.(fillProductScreen(PRODUCT_SCREEN.pincodeSuccessLive, { date: pincodeResult.deliversByLabel }));
    }
  }, [onAnnounce, opacity, pincodeResult, reducedMotion, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!pincodeResult) return null;

  return (
    <Animated.View style={[styles.pinResult, animStyle]} accessibilityLiveRegion="polite">
      {pincodeResult.serviceable ? (
        <>
          <View style={styles.pinResultLine}>
            <AnimatedCheckmark size={18} color={semanticPalette.success} active />
            <Text style={styles.pinResultText}>
              {fillProductScreen(PRODUCT_SCREEN.pincodeDeliversBy, { date: pincodeResult.deliversByLabel || "" })}
            </Text>
          </View>
          <Text style={styles.pinResultSub}>
            {fillProductScreen(PRODUCT_SCREEN.pincodeDispatchNote, {
              hours: String(pincodeResult.dispatchHours ?? 4),
              minutes: String(pincodeResult.dispatchMinutes ?? 12),
            })}
          </Text>
        </>
      ) : (
        <View style={styles.pinResultLine}>
          <Ionicons name="close-circle" size={18} color={semanticPalette.warning} />
          <Text style={styles.pinResultText}>
            {pincodeResult.errorKey === "invalid"
              ? PRODUCT_SCREEN.pincodeCheckMockShort
              : pincodeResult.errorKey === "unavailable"
                ? PRODUCT_SCREEN.pincodeUnavailable
                : PRODUCT_SCREEN.pincodeNotServiceable}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

function PurchaseAccordion({
  title,
  body,
  open,
  onToggle,
  semanticPalette,
  RADII,
  SPACING,
  reducedMotion,
  accordionId,
}) {
  const bodyId = `pdp-accordion-${accordionId}`;
  const rotate = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    rotate.value = withTiming(open ? 1 : 0, { duration: 200, easing: Easing.out(Easing.cubic) });
  }, [open, rotate]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value * 180}deg` }],
  }));

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
    onToggle();
  };

  return (
    <Card
      padding="none"
      contentStyle={{ padding: 0, borderWidth: StyleSheet.hairlineWidth, borderColor: semanticPalette.line, borderRadius: RADII.md }}
      style={{ borderWidth: 0, shadowOpacity: 0, elevation: 0 }}
    >
      <Pressable
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        {...(Platform.OS === "web" ? { "aria-expanded": open, "aria-controls": bodyId } : { accessibilityControls: { nativeID: bodyId } })}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: SPACING.md,
          paddingVertical: 14,
          opacity: pressed ? 0.92 : 1,
        })}
      >
        <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: semanticPalette.ink, flex: 1 }}>{title}</Text>
        <Animated.View style={chevronStyle}>
          <Ionicons name="chevron-down-outline" size={20} color={semanticPalette.inkMuted} />
        </Animated.View>
      </Pressable>
      {open ? (
        reducedMotion ? (
          <View nativeID={bodyId} id={bodyId} style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <Text style={{ fontFamily: fonts.regular, fontSize: 14, lineHeight: 14 * 1.6, color: semanticPalette.inkSoft }}>{body}</Text>
          </View>
        ) : (
          <Animated.View
            nativeID={bodyId}
            id={bodyId}
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(160)}
            style={{ paddingHorizontal: 16, paddingBottom: 16 }}
          >
            <Text style={{ fontFamily: fonts.regular, fontSize: 14, lineHeight: 14 * 1.6, color: semanticPalette.inkSoft }}>{body}</Text>
          </Animated.View>
        )
      ) : null}
    </Card>
  );
}

export default function ProductPurchaseColumn({
  product,
  selectedVariantLabel,
  onSelectVariant,
  quantity,
  isOutOfStock,
  displayPrice,
  mrp,
  showMrp,
  offPct,
  reviews = [],
  shelfMatch = false,
  isTwoColumn = false,
  mainCtaRef,
  descriptionBody = "",
  materialAccordionBody = "",
  accordionOpen,
  onToggleAccordion,
  onAddToCart,
  onRemoveFromCart,
  onNavigateLogin,
  isAuthenticated,
  onScrollToReviews,
  onFlyToCart,
  productImageUri = "",
  stickyStyle,
  viewedRecently = false,
  stickyElevated = false,
  onWishlistSaved,
  onAddToCartComplete,
}) {
  const { width } = useWindowDimensions();
  const { semanticPalette, TYPE, SPACING, RADII, SHADOWS } = useTheme();
  const reducedMotion = useReducedMotion();
  const wishlist = useWishlistOptional();
  const wishlistId = String(product?.id ?? "").trim();
  const isSaved = Boolean(wishlist && wishlistId && wishlist.has(wishlistId));

  const [addBusy, setAddBusy] = useState(false);
  const [pincode, setPincode] = useState("");
  const [pincodeBusy, setPincodeBusy] = useState(false);
  const [pincodeResult, setPincodeResult] = useState(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [showAskModal, setShowAskModal] = useState(false);
  const [variantOosLabel, setVariantOosLabel] = useState("");
  const [liveMessage, setLiveMessage] = useState("");
  const [pincodeLive, setPincodeLive] = useState("");
  const ctaRef = mainCtaRef;

  const stockQty = Number(product?.stockQty ?? 0);
  const showLowStock = stockQty > 0 && stockQty <= 5 && product?.inStock !== false;

  const titleSize = width >= 768 ? 40 : 32;
  const ratingValue = Number(product?.ratingAverage || 0);
  const reviewCount = Number(product?.reviewCount || 0);
  const hasRating = ratingValue > 0 && reviewCount > 0;
  const hasVerifiedReviews = (reviews || []).some((r) => r?.verifiedPurchase === true || r?.verified === true);

  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const selectedVariant = String(selectedVariantLabel || "").trim();
  const variantHelper = selectedVariant
    ? fillProductScreen(PRODUCT_SCREEN.variantSoldPer, { unit: selectedVariant })
    : fillProductScreen(PRODUCT_SCREEN.variantSoldPer, { unit: product?.unit || PRODUCT_SCREEN.unitFallback });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        col: {
          flex: isTwoColumn ? 2 : undefined,
          width: isTwoColumn ? undefined : "100%",
          minWidth: 0,
          gap: 0,
          paddingHorizontal: isTwoColumn ? SPACING.lg : 0,
          paddingVertical: isTwoColumn ? SPACING.md : 0,
          borderRadius: isTwoColumn ? RADII.lg : 0,
          borderWidth: isTwoColumn ? StyleSheet.hairlineWidth : 0,
          borderColor: isTwoColumn ? semanticPalette.lineSoft : "transparent",
          backgroundColor: isTwoColumn ? semanticPalette.surface : "transparent",
          ...(stickyStyle || {}),
        },
        shelfAccent: {
          height: 2,
          width: "100%",
          backgroundColor: shelfMatch ? semanticPalette.accent : "transparent",
          marginBottom: SPACING.sm,
          borderRadius: 1,
        },
        brandOverline: {
          fontFamily: fonts.semibold,
          fontSize: 11,
          letterSpacing: 0.16 * 11,
          textTransform: "uppercase",
          color: semanticPalette.accent,
          marginBottom: 6,
        },
        title: {
          fontFamily: TYPE.serifFamily,
          fontSize: titleSize,
          lineHeight: titleSize * 1.14,
          fontWeight: "500",
          letterSpacing: titleSize * -0.025,
          color: semanticPalette.ink,
        },
        ratingRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 6,
          marginTop: 8,
        },
        ratingText: {
          fontFamily: fonts.medium,
          fontSize: 13,
          color: semanticPalette.ink,
        },
        priceBlock: {
          marginTop: 16,
          gap: 8,
        },
        priceRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 12,
        },
        priceCurrent: {
          fontFamily: TYPE.serifFamily,
          fontSize: 28,
          lineHeight: 32,
          fontWeight: "500",
          color: semanticPalette.ink,
          fontVariant: ["tabular-nums"],
        },
        mrp: {
          fontFamily: fonts.regular,
          fontSize: 16,
          color: semanticPalette.inkMuted,
          textDecorationLine: "line-through",
        },
        taxLine: {
          fontFamily: fonts.regular,
          fontSize: 12,
          color: semanticPalette.inkMuted,
          lineHeight: 16,
        },
        variantSection: { marginTop: 20, gap: 8 },
        variantTitle: {
          fontFamily: fonts.medium,
          fontSize: 13,
          color: semanticPalette.ink,
        },
        variantRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
        variantHelper: {
          fontFamily: fonts.regular,
          fontSize: 11,
          color: semanticPalette.inkMuted,
          marginTop: 4,
        },
        stepperWrap: { marginTop: 16 },
        stepper: {
          flexDirection: "row",
          alignItems: "center",
          alignSelf: "flex-start",
          height: 40,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: semanticPalette.line,
          backgroundColor: semanticPalette.surface,
          paddingHorizontal: 4,
        },
        stepHit: {
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
        },
        stepCount: {
          minWidth: 32,
          textAlign: "center",
          fontFamily: fonts.medium,
          fontSize: 14,
          color: semanticPalette.ink,
        },
        ctaWrap: { marginTop: 20, width: "100%" },
        secondaryRow: {
          marginTop: 12,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
        },
        actionBtn: {
          flex: 1,
          minWidth: 0,
        },
        trustCard: {
          marginTop: 24,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: semanticPalette.lineSoft,
          backgroundColor: semanticPalette.surfaceAlt,
        },
        trustGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
        },
        trustCell: {
          width: width >= 768 ? "25%" : "50%",
          paddingVertical: 6,
          paddingHorizontal: 4,
          alignItems: "center",
          gap: 6,
        },
        trustLabel: {
          fontFamily: fonts.semibold,
          fontSize: 12,
          color: semanticPalette.ink,
          textAlign: "center",
        },
        pinCard: {
          marginTop: 16,
          borderWidth: 1,
          borderColor: semanticPalette.line,
          borderRadius: 14,
          padding: 14,
          backgroundColor: semanticPalette.surfaceAlt,
        },
        pinHeading: {
          fontFamily: fonts.semibold,
          fontSize: 12,
          letterSpacing: 0.14 * 12,
          textTransform: "uppercase",
          color: semanticPalette.inkMuted,
          marginBottom: 10,
        },
        pinRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
        pinInput: { flex: 1, minWidth: 0 },
        pinResult: { marginTop: 10, gap: 4 },
        pinResultLine: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
        pinResultText: { flex: 1, fontFamily: fonts.medium, fontSize: 13, color: semanticPalette.ink },
        pinResultSub: { fontFamily: fonts.regular, fontSize: 12, color: semanticPalette.inkMuted, marginLeft: 26 },
        accordions: { marginTop: 24, gap: SPACING.sm },
        modalBackdrop: {
          flex: 1,
          backgroundColor: "rgba(14,23,41,0.55)",
          justifyContent: "center",
          padding: SPACING.lg,
        },
        modalCard: {
          borderRadius: RADII.lg,
          padding: SPACING.lg,
          backgroundColor: semanticPalette.surface,
          gap: SPACING.md,
          maxWidth: 420,
          width: "100%",
          alignSelf: "center",
        },
        modalTitle: {
          fontFamily: fonts.semibold,
          fontSize: TYPE.h3.fontSize,
          color: semanticPalette.ink,
        },
        modalBody: {
          fontFamily: fonts.regular,
          fontSize: TYPE.body.fontSize,
          lineHeight: TYPE.body.lineHeight,
          color: semanticPalette.inkSoft,
        },
        viewedBadge: {
          fontFamily: fonts.semibold,
          fontSize: 10,
          letterSpacing: 0.14 * 10,
          textTransform: "uppercase",
          color: semanticPalette.accent,
          marginBottom: 8,
        },
        lowStockRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginTop: 4,
        },
        lowStockText: {
          fontFamily: fonts.regular,
          fontSize: 12,
          color: semanticPalette.sale,
          flex: 1,
        },
        variantOosMsg: {
          marginTop: 8,
          fontFamily: fonts.regular,
          fontSize: 12,
          lineHeight: 18,
          color: semanticPalette.inkSoft,
        },
        variantOosLink: {
          fontFamily: fonts.semibold,
          color: semanticPalette.accent,
        },
      }),
    [RADII, SPACING, TYPE, isTwoColumn, semanticPalette, shelfMatch, stickyStyle, titleSize, width, SHADOWS]
  );

  const trustItems = useMemo(
    () => [
      { Icon: Truck, label: PRODUCT_SCREEN.trustFreeShipping },
      { Icon: RotateCcw, label: PRODUCT_SCREEN.trustEasyReturns },
      { Icon: Wallet, label: PRODUCT_SCREEN.trustCod },
      { Icon: ShieldCheck, label: PRODUCT_SCREEN.trustGenuine },
    ],
    []
  );

  const toggleWishlist = useCallback(() => {
    if (wishlist && wishlistId) {
      const wasSaved = wishlist.has(wishlistId);
      wishlist.toggle(wishlistId);
      if (!wasSaved) onWishlistSaved?.();
    }
  }, [onWishlistSaved, wishlist, wishlistId]);

  const handleShare = useCallback(async () => {
    const name = String(product?.name || "Product").trim();
    const url =
      Platform.OS === "web" && typeof window !== "undefined"
        ? `${window.location.origin}/product/${encodeURIComponent(product?.id || "")}`
        : "";
    const message = url ? `${name}\n${url}` : name;
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: name, text: message, url: url || undefined });
        return;
      }
      await Share.share({ message, title: name, url: url || undefined });
    } catch {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
      }
    }
  }, [product?.id, product?.name]);

  const handleAskWhatsApp = useCallback(() => {
    const prefill = fillProductScreen(PRODUCT_SCREEN.askPrefill, { name: String(product?.name || "").trim() });
    const base = String(RUNTIME_SUPPORT_WHATSAPP_URL || "").trim();
    if (base) {
      const sep = base.includes("?") ? "&" : "?";
      void Linking.openURL(`${base}${sep}text=${encodeURIComponent(prefill)}`);
    }
    setShowAskModal(false);
  }, [product?.name]);

  const handleAskEmail = useCallback(() => {
    const subject = fillProductScreen(PRODUCT_SCREEN.askEmailSubject, { name: String(product?.name || "").trim() });
    const body = fillProductScreen(PRODUCT_SCREEN.askPrefill, { name: String(product?.name || "").trim() });
    void Linking.openURL(`mailto:${RUNTIME_SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    setShowAskModal(false);
  }, [product?.name]);

  const handleRatingPress = useCallback(() => {
    onScrollToReviews?.();
  }, [onScrollToReviews]);

  const runAddToCart = useCallback(() => {
    if (isOutOfStock) {
      setShowNotifyModal(true);
      return;
    }
    if (!isAuthenticated) {
      onNavigateLogin?.();
      return;
    }
    hapticImpactLight();
    setAddBusy(true);
    const started = Date.now();
    const finish = () => {
      const elapsed = Date.now() - started;
      const wait = Math.max(0, 300 - elapsed);
      setTimeout(() => setAddBusy(false), wait);
    };

    onAddToCart?.();
    onFlyToCart?.();
    onAddToCartComplete?.();
    setTimeout(finish, 480);
  }, [isAuthenticated, isOutOfStock, onAddToCart, onAddToCartComplete, onFlyToCart, onNavigateLogin]);

  const checkPincode = useCallback(async () => {
    setPincodeBusy(true);
    setPincodeResult(null);
    try {
      const result = await checkPincodeServiceability(pincode);
      setPincodeResult(result);
      if (result?.serviceable) hapticSuccess();
      else hapticWarning();
    } catch {
      setPincodeResult({ serviceable: false, errorKey: "error" });
      hapticWarning();
    } finally {
      setPincodeBusy(false);
    }
  }, [pincode]);

  const addCtaLabel = isOutOfStock
    ? PRODUCT_SCREEN.notifyWhenBack
    : fillProductScreen(PRODUCT_SCREEN.addToCartWithPrice, { price: formatINRWhole(displayPrice) });

  const variantTitleText = selectedVariant
    ? fillProductScreen(PRODUCT_SCREEN.variantTitleWithSelection, { selection: selectedVariant })
    : PRODUCT_SCREEN.variantTitle;

  useEffect(() => {
    if (!selectedVariant) return;
    setLiveMessage(
      fillProductScreen(PRODUCT_SCREEN.variantSelectedLive, {
        variant: selectedVariant,
        price: formatINRWhole(displayPrice),
      })
    );
  }, [displayPrice, selectedVariant]);

  return (
    <View
      style={[
        styles.col,
        stickyElevated && isTwoColumn
          ? {
              ...SHADOWS.lifted,
              ...(Platform.OS === "web" ? { transition: "box-shadow 220ms ease" } : {}),
            }
          : Platform.OS === "web"
            ? { transition: "box-shadow 220ms ease" }
            : null,
      ]}
    >
      {viewedRecently ? <Text style={styles.viewedBadge}>{PRODUCT_SCREEN.viewedRecentlyOverline}</Text> : null}
      <View style={styles.shelfAccent} />
      <Text style={styles.brandOverline}>{String(product?.brand || "").trim() || PRODUCT_SCREEN.brandFallback}</Text>
      <LiveRegion message={liveMessage} />
      <LiveRegion message={pincodeLive} />
      <Text style={styles.title} numberOfLines={3} {...decorativeTextA11yProps()}>
        {product?.name}
      </Text>

      {hasRating ? (
        <Pressable onPress={handleRatingPress} accessibilityRole="link" style={styles.ratingRow}>
          <RatingStars value={ratingValue} semanticPalette={semanticPalette} />
          <Text style={styles.ratingText}>
            {ratingValue.toFixed(1)} ({reviewCount} {reviewCount === 1 ? PRODUCT_SCREEN.reviewSingular : PRODUCT_SCREEN.reviewPlural})
          </Text>
          {hasVerifiedReviews ? (
            <>
              <Text style={[styles.ratingText, { color: semanticPalette.inkMuted }]}>·</Text>
              <Badge variant="brass" size="sm">
                {PRODUCT_SCREEN.verifiedBadge}
              </Badge>
            </>
          ) : null}
        </Pressable>
      ) : null}

      <View style={styles.priceBlock}>
        <AnimatedPriceBlock
          displayPrice={displayPrice}
          mrp={mrp}
          showMrp={showMrp}
          offPct={offPct}
          styles={styles}
          semanticPalette={semanticPalette}
          reducedMotion={reducedMotion}
        />
        <Text style={styles.taxLine}>{PRODUCT_SCREEN.priceTaxLine}</Text>
        {showLowStock ? (
          <View style={styles.lowStockRow}>
            <Ionicons name="time-outline" size={14} color={semanticPalette.sale} />
            <Text style={styles.lowStockText}>
              {fillProductScreen(PRODUCT_SCREEN.lowStockAlert, { count: String(stockQty) })}
            </Text>
          </View>
        ) : null}
      </View>

      {variants.length > 0 ? (
        <View
          style={styles.variantSection}
          accessibilityRole="radiogroup"
          accessibilityLabel={variantTitleText}
        >
          <Text style={styles.variantTitle}>{variantTitleText}</Text>
          <View style={styles.variantRow}>
            {variants.map((v) => {
              const lab = String(v?.label || "").trim();
              const oos = isVariantOutOfStock(product, lab);
              return (
                <PurchaseVariantChip
                  key={lab}
                  label={lab}
                  selected={lab === selectedVariant}
                  disabled={oos}
                  forceDisabled={isOutOfStock}
                  onPress={() => {
                    setVariantOosLabel("");
                    onSelectVariant?.(lab);
                  }}
                  onPressWhenDisabled={() => setVariantOosLabel(lab)}
                  semanticPalette={semanticPalette}
                  reducedMotion={reducedMotion}
                />
              );
            })}
          </View>
          {variantOosLabel ? (
            <Text style={styles.variantOosMsg}>
              {PRODUCT_SCREEN.variantUnavailableMessage}{" "}
              <Text style={styles.variantOosLink} onPress={() => setShowNotifyModal(true)}>
                {PRODUCT_SCREEN.variantUnavailableNotify}
              </Text>
            </Text>
          ) : null}
          <Text style={styles.variantHelper}>{variantHelper}</Text>
        </View>
      ) : null}

      {quantity > 0 && !isOutOfStock ? (
        <View style={styles.stepperWrap}>
          <View style={styles.stepper}>
            <Pressable style={styles.stepHit} onPress={onRemoveFromCart} accessibilityRole="button" accessibilityLabel="Decrease quantity">
              <Ionicons name="remove" size={20} color={semanticPalette.ink} />
            </Pressable>
            <Text style={styles.stepCount}>{quantity}</Text>
            <Pressable style={styles.stepHit} onPress={onAddToCart} accessibilityRole="button" accessibilityLabel="Increase quantity">
              <Ionicons name="add" size={20} color={semanticPalette.ink} />
            </Pressable>
          </View>
        </View>
      ) : null}

      <View ref={ctaRef} collapsable={false} style={styles.ctaWrap}>
        <Button
          label={addCtaLabel}
          variant={isOutOfStock ? "secondary" : "primary"}
          size="lg"
          fullWidth
          disabled={addBusy}
          loading={addBusy}
          loadingLabel={PRODUCT_SCREEN.addingToBag}
          onPress={runAddToCart}
          accessibilityLabel={isOutOfStock ? PRODUCT_SCREEN.notifyWhenBackA11y : PRODUCT_SCREEN.addToCartA11y}
        />
      </View>

      <View style={styles.secondaryRow}>
        <Button
          variant="ghost"
          size="sm"
          label={isSaved ? PRODUCT_SCREEN.savedLabel : PRODUCT_SCREEN.saveLabel}
          iconLeft={<Ionicons name={isSaved ? "heart" : "heart-outline"} size={18} color={semanticPalette.ink} />}
          onPress={toggleWishlist}
          style={styles.actionBtn}
          accessibilityLabel={isSaved ? PRODUCT_SCREEN.removeWishlistA11y : PRODUCT_SCREEN.saveWishlistA11y}
        />
        <Button
          variant="ghost"
          size="sm"
          label={PRODUCT_SCREEN.shareLabel}
          iconLeft={<Ionicons name="share-outline" size={18} color={semanticPalette.ink} />}
          onPress={handleShare}
          style={styles.actionBtn}
        />
        <Button
          variant="ghost"
          size="sm"
          label={PRODUCT_SCREEN.askLabel}
          iconLeft={<Ionicons name="help-circle-outline" size={18} color={semanticPalette.ink} />}
          onPress={() => setShowAskModal(true)}
          style={styles.actionBtn}
        />
      </View>

      <Card
        padding={12}
        style={[styles.trustCard, Platform.select({ web: { boxShadow: "none" }, default: { elevation: 0, shadowOpacity: 0 } })]}
        contentStyle={{ padding: 0 }}
      >
        <View style={styles.trustGrid}>
          {trustItems.map((t) => (
            <View key={t.label} style={styles.trustCell}>
              <t.Icon size={18} color={semanticPalette.accent} strokeWidth={2} />
              <Text style={styles.trustLabel}>{t.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.pinCard}>
        <Text style={styles.pinHeading}>{PRODUCT_SCREEN.pincodeHeading}</Text>
        <View style={styles.pinRow}>
          <View style={styles.pinInput}>
            <Input
              label=""
              placeholder={PRODUCT_SCREEN.pincodePlaceholder}
              value={pincode}
              onChangeText={setPincode}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
          <Button label={PRODUCT_SCREEN.pincodeCheckCta} variant="secondary" size="sm" loading={pincodeBusy} onPress={checkPincode} />
        </View>
        <PincodeResultPanel
          pincodeResult={pincodeResult}
          styles={styles}
          semanticPalette={semanticPalette}
          reducedMotion={reducedMotion}
          onAnnounce={setPincodeLive}
        />
      </View>

      <View style={styles.accordions}>
        <PurchaseAccordion
          accordionId="description"
          title={PRODUCT_SCREEN.accordionDescription}
          body={descriptionBody || PRODUCT_SCREEN.defaultDescription}
          open={accordionOpen.description}
          onToggle={() => onToggleAccordion?.("description")}
          semanticPalette={semanticPalette}
          RADII={RADII}
          SPACING={SPACING}
          reducedMotion={reducedMotion}
        />
        <PurchaseAccordion
          accordionId="material"
          title={PRODUCT_SCREEN.accordionMaterial}
          body={materialAccordionBody}
          open={accordionOpen.material}
          onToggle={() => onToggleAccordion?.("material")}
          semanticPalette={semanticPalette}
          RADII={RADII}
          SPACING={SPACING}
          reducedMotion={reducedMotion}
        />
        <PurchaseAccordion
          accordionId="shipping"
          title={PRODUCT_SCREEN.accordionShipping}
          body={PRODUCT_SCREEN.accordionShippingBody}
          open={accordionOpen.shipping}
          onToggle={() => onToggleAccordion?.("shipping")}
          semanticPalette={semanticPalette}
          RADII={RADII}
          SPACING={SPACING}
          reducedMotion={reducedMotion}
        />
        <PurchaseAccordion
          accordionId="faq"
          title={PRODUCT_SCREEN.accordionFaq}
          body={PRODUCT_SCREEN.accordionFaqBody}
          open={accordionOpen.faq}
          onToggle={() => onToggleAccordion?.("faq")}
          semanticPalette={semanticPalette}
          RADII={RADII}
          SPACING={SPACING}
          reducedMotion={reducedMotion}
        />
      </View>

      <Modal transparent visible={showNotifyModal} animationType="fade" onRequestClose={() => setShowNotifyModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowNotifyModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation?.()}>
            <Text style={styles.modalTitle}>{PRODUCT_SCREEN.notifyModalTitle}</Text>
            <Text style={styles.modalBody}>{PRODUCT_SCREEN.notifyModalBody}</Text>
            <Input
              label={PRODUCT_SCREEN.notifyEmailLabel}
              value={notifyEmail}
              onChangeText={setNotifyEmail}
              placeholder={PRODUCT_SCREEN.notifyEmailPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button label={PRODUCT_SCREEN.notifySubmit} variant="primary" fullWidth onPress={() => setShowNotifyModal(false)} />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={showAskModal} animationType="fade" onRequestClose={() => setShowAskModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowAskModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation?.()}>
            <Text style={styles.modalTitle}>{PRODUCT_SCREEN.askModalTitle}</Text>
            <Text style={styles.modalBody}>
              {fillProductScreen(PRODUCT_SCREEN.askModalBody, { name: String(product?.name || "").trim() })}
            </Text>
            <Button
              label={PRODUCT_SCREEN.askWhatsApp}
              variant="primary"
              fullWidth
              iconLeft={<Ionicons name="logo-whatsapp" size={20} color={semanticPalette.inkInverse} />}
              onPress={handleAskWhatsApp}
            />
            <Button label={PRODUCT_SCREEN.askEmail} variant="secondary" fullWidth onPress={handleAskEmail} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export { PurchaseAccordion };
