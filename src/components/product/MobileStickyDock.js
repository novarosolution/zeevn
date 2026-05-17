import React, { memo, useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import Button from "../ui/Button";
import { useTheme } from "../../context/ThemeContext";
import { PRODUCT_SCREEN } from "../../content/appContent";
import { fonts } from "../../theme/tokens";
import { formatINR, formatINRWhole } from "../../utils/currency";
import useReducedMotion from "../../hooks/useReducedMotion";

const THUMB_SIZE = 44;
const DOCK_ANIM_MS = 240;

function DockStepper({ quantity, onRemove, onAdd, disabled, semanticPalette }) {
  return (
    <View
      style={[
        dockStyles.stepper,
        {
          borderColor: "rgba(200,169,126,0.35)",
          backgroundColor: "rgba(255,255,255,0.08)",
        },
      ]}
    >
      <Pressable
        onPress={onRemove}
        disabled={disabled}
        style={dockStyles.stepHit}
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
      >
        <Ionicons name="remove" size={18} color={semanticPalette.inkInverse} />
      </Pressable>
      <Text style={[dockStyles.stepCount, { color: semanticPalette.inkInverse }]}>{quantity}</Text>
      <Pressable
        onPress={onAdd}
        disabled={disabled}
        style={dockStyles.stepHit}
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
      >
        <Ionicons name="add" size={18} color={semanticPalette.inkInverse} />
      </Pressable>
    </View>
  );
}

function MobileStickyDockBase({
  visible,
  bottomOffset = 0,
  imageUri = "",
  displayPrice = 0,
  mrp = null,
  showMrp = false,
  variantLabel = "",
  quantity = 0,
  isOutOfStock = false,
  addBusy = false,
  onScrollToTop,
  onAddToCart,
  onRemoveFromCart,
}) {
  const { semanticPalette } = useTheme();
  const reducedMotion = useReducedMotion();
  const shown = useSharedValue(visible ? 1 : 0);

  React.useEffect(() => {
    shown.value = withTiming(visible ? 1 : 0, {
      duration: reducedMotion ? 1 : DOCK_ANIM_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [reducedMotion, shown, visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - shown.value) * 88 }],
    opacity: shown.value,
  }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        dock: {
          position: "absolute",
          left: 0,
          right: 0,
          zIndex: 42,
          paddingVertical: 10,
          paddingHorizontal: 14,
          backgroundColor: semanticPalette.bgDeep,
          borderTopWidth: 1,
          borderTopColor: "rgba(200,169,126,0.4)",
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          ...Platform.select({
            web: { maxWidth: 900, alignSelf: "center" },
            default: {},
            ios: {
              shadowColor: "#0E1729",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
            },
            android: { elevation: 12 },
          }),
        },
        thumb: {
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          borderRadius: 8,
          overflow: "hidden",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: semanticPalette.lineInverse,
          backgroundColor: semanticPalette.bgDeepAlt,
        },
        thumbImage: { width: "100%", height: "100%" },
        mid: { flex: 1, minWidth: 0, gap: 2 },
        priceRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
        price: {
          fontFamily: fonts.semibold,
          fontSize: 14,
          color: semanticPalette.inkInverse,
          fontVariant: ["tabular-nums"],
        },
        mrp: {
          fontFamily: fonts.regular,
          fontSize: 11,
          color: semanticPalette.inkInverseMuted,
          textDecorationLine: "line-through",
          fontVariant: ["tabular-nums"],
        },
        variant: {
          fontFamily: fonts.regular,
          fontSize: 11,
          color: semanticPalette.inkInverseSoft,
        },
        ctaSlot: { flexShrink: 0, maxWidth: "46%" },
      }),
    [semanticPalette]
  );

  const variantLine = String(variantLabel || "").trim() || PRODUCT_SCREEN.unitFallback;

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[styles.dock, { bottom: bottomOffset }, animStyle]}
      accessibilityElementsHidden={!visible}
    >
      <Pressable
        onPress={onScrollToTop}
        style={styles.thumb}
        accessibilityRole="button"
        accessibilityLabel={PRODUCT_SCREEN.dockThumbA11y}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.thumbImage} contentFit="cover" transition={120} />
        ) : (
          <View style={[styles.thumbImage, { alignItems: "center", justifyContent: "center" }]}>
            <Ionicons name="image-outline" size={18} color={semanticPalette.inkInverseMuted} />
          </View>
        )}
      </Pressable>

      <View style={styles.mid}>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatINR(displayPrice)}</Text>
          {showMrp && mrp != null ? <Text style={styles.mrp}>{formatINRWhole(mrp)}</Text> : null}
        </View>
        <Text style={styles.variant} numberOfLines={1}>
          {variantLine}
        </Text>
      </View>

      <View style={styles.ctaSlot}>
        {quantity > 0 && !isOutOfStock ? (
          <DockStepper
            quantity={quantity}
            onRemove={onRemoveFromCart}
            onAdd={onAddToCart}
            disabled={addBusy}
            semanticPalette={semanticPalette}
          />
        ) : (
          <Button
            label={isOutOfStock ? PRODUCT_SCREEN.outOfStock : PRODUCT_SCREEN.addToCart}
            variant="accent"
            size="md"
            disabled={isOutOfStock || addBusy}
            loading={addBusy}
            loadingLabel={PRODUCT_SCREEN.addingToBag}
            onPress={onAddToCart}
            accessibilityLabel={isOutOfStock ? PRODUCT_SCREEN.productOutOfStockA11y : PRODUCT_SCREEN.addToCartA11y}
          />
        )}
      </View>
    </Animated.View>
  );
}

const dockStyles = StyleSheet.create({
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    height: 42,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  stepHit: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCount: {
    minWidth: 28,
    textAlign: "center",
    fontFamily: fonts.semibold,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
});

const MobileStickyDock = memo(MobileStickyDockBase);

export default MobileStickyDock;
