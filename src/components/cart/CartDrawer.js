import React, { useEffect, useMemo, useRef, useCallback } from "react";
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";
import CartItem from "./CartItem";
import PageHeader from "../ui/PageHeader";
import { useCart } from "../../context/CartContext";
import { useTheme } from "../../context/ThemeContext";
import { useWishlistOptional } from "../../context/WishlistContext";
import { FREE_SHIPPING_PROGRESS_GOAL_INR } from "../../constants/cartConstants";
import { CART_DRAWER_UI } from "../../content/appContent";
import { fonts } from "../../theme/tokens";
import { nativeDriverEnabled } from "../../utils/motion";
import { WEB_Z_INDEX, webOverlayPanelStyle, webOverlayRootStyle, webOverlayScrimStyle } from "../../theme/web";
import useModalA11y from "../../hooks/useModalA11y";
import { formatINR } from "../../utils/currency";
import { APP_VIEWPORT_MIN_HEIGHT } from "../../utils/webViewport";

export default function CartDrawer({ visible, onClose, navigationRef, triggerRef }) {
  const insets = useSafeAreaInsets();
  const { width: winW } = useWindowDimensions();
  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();
  const { cartItems, totalAmount, addToCart, removeFromCart, removeLineFromCart } = useCart();
  const wishlist = useWishlistOptional();

  const slide = useRef(new Animated.Value(0)).current;
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const handleClose = useCallback(() => onClose?.(), [onClose]);

  useModalA11y({ visible, onClose: handleClose, triggerRef, containerRef: panelRef });

  useEffect(() => {
    if (!visible) return;
    slide.setValue(0);
    Animated.timing(slide, {
      toValue: 1,
      duration: 260,
      useNativeDriver: nativeDriverEnabled,
    }).start();
  }, [slide, visible]);

  const panelWidth = Platform.OS === "web" ? Math.min(420, winW) : winW;
  const translateX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [panelWidth, 0],
  });

  const progress = Math.min(1, Math.max(0, totalAmount / FREE_SHIPPING_PROGRESS_GOAL_INR));
  const remainder = Math.max(0, FREE_SHIPPING_PROGRESS_GOAL_INR - totalAmount);

  const noopNav = useMemo(
    () => ({
      canGoBack: () => false,
      goBack: onClose,
    }),
    [onClose]
  );

  const goCheckout = () => {
    onClose();
    if (navigationRef?.isReady?.()) {
      navigationRef.navigate({ name: "Cart", params: { checkout: true }, merge: true });
    }
  };

  const goBag = () => {
    onClose();
    if (navigationRef?.isReady?.()) {
      navigationRef.navigate({ name: "Cart", params: { checkout: false }, merge: true });
    }
  };

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={handleClose}>
      <View ref={rootRef} style={[styles.root, webOverlayRootStyle(WEB_Z_INDEX.overlay)]}>
        <Pressable
          style={[styles.scrim, webOverlayScrimStyle(false)]}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel={CART_DRAWER_UI.closeA11y}
        />
        <Animated.View
          ref={panelRef}
          style={[
            styles.panel,
            webOverlayPanelStyle(),
            {
              width: panelWidth,
              maxWidth: winW,
              paddingTop: insets.top + SPACING.sm,
              backgroundColor: semanticPalette.surface,
              borderLeftWidth: StyleSheet.hairlineWidth,
              borderLeftColor: semanticPalette.line,
              transform: [{ translateX }],
            },
          ]}
        >
          <View style={{ paddingHorizontal: SPACING.lg, flex: 1 }}>
            <PageHeader
              navigation={noopNav}
              title={CART_DRAWER_UI.title}
              hideBackButton
              rightActions={
                <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel={CART_DRAWER_UI.closeA11y}>
                  <Ionicons name="close-outline" size={28} color={semanticPalette.ink} />
                </Pressable>
              }
            />

            <View style={{ marginBottom: SPACING.md }}>
              <View
                style={{
                  height: 6,
                  borderRadius: RADII.pill,
                  backgroundColor: semanticPalette.lineSoft,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width: `${Math.round(progress * 100)}%`,
                    borderRadius: RADII.pill,
                    backgroundColor: semanticPalette.accent,
                  }}
                />
              </View>
              <Text style={{ marginTop: SPACING.xs, fontFamily: fonts.regular, fontSize: TYPE.caption.fontSize, color: semanticPalette.inkMuted }}>
                {progress >= 1
                  ? CART_DRAWER_UI.freeShippingDone
                  : fillProgress(CART_DRAWER_UI.freeShippingProgress, remainder, Math.round(progress * 100))}
              </Text>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: SPACING["3xl"] }} showsVerticalScrollIndicator={false}>
              {cartItems.length === 0 ? (
                <EmptyState
                  iconName="bag-handle-outline"
                  title={CART_DRAWER_UI.emptyTitle}
                  description={CART_DRAWER_UI.emptyDescription}
                  ctaLabel={CART_DRAWER_UI.browseCta}
                  onCtaPress={() => {
                    onClose();
                    navigationRef?.isReady?.() && navigationRef.navigate("Home");
                  }}
                />
              ) : (
                cartItems.map((item) => (
                  <CartItem
                    key={`${item.id}-${item.variantLabel || ""}`}
                    item={item}
                    showLineTotal={false}
                    onDecrease={() => removeFromCart(item.id, item.variantLabel)}
                    onIncrease={() => addToCart(item)}
                    onRemove={() => removeLineFromCart(item.id, item.variantLabel)}
                    onMoveToWishlist={() => {
                      wishlist?.add?.(item.id);
                      removeLineFromCart(item.id, item.variantLabel);
                    }}
                  />
                ))
              )}
            </ScrollView>
          </View>

          {cartItems.length > 0 ? (
            <View
              style={{
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: semanticPalette.line,
                paddingHorizontal: SPACING.lg,
                paddingTop: SPACING.md,
                paddingBottom: Math.max(insets.bottom, SPACING.md),
                backgroundColor: semanticPalette.surface,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: SPACING.sm }}>
                <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.body.fontSize, color: semanticPalette.inkMuted }}>{CART_DRAWER_UI.subtotal}</Text>
                <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }}>{formatINR(totalAmount)}</Text>
              </View>
              <Button label={CART_DRAWER_UI.viewBagCta} variant="ghost" size="md" fullWidth onPress={goBag} />
              <View style={{ height: SPACING.sm }} />
              <Button label={CART_DRAWER_UI.checkoutCta} variant="primary" size="lg" fullWidth onPress={goCheckout} />
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

function fillAway(template, amount) {
  return String(template || "").replace(/\{amount\}/g, formatINR(amount));
}

function fillProgress(template, amount, percent) {
  return String(template || "")
    .replace(/\{amount\}/g, formatINR(amount))
    .replace(/\{percent\}/g, String(percent));
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  scrim: {},
  panel: {
    flex: 1,
    maxHeight: "100%",
    ...Platform.select({
      web: { maxHeight: APP_VIEWPORT_MIN_HEIGHT },
      default: {},
    }),
  },
  thumbPlaceholder: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(14,23,41,0.04)",
  },
});
