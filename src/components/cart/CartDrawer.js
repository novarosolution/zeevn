import React, { useEffect, useMemo, useRef } from "react";
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
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../ui/Button";
import Card from "../ui/Card";
import EmptyState from "../ui/EmptyState";
import PageHeader from "../ui/PageHeader";
import { useCart } from "../../context/CartContext";
import { useTheme } from "../../context/ThemeContext";
import { FREE_SHIPPING_PROGRESS_GOAL_INR } from "../../constants/cartConstants";
import { CART_DRAWER_UI } from "../../content/appContent";
import { fonts } from "../../theme/tokens";
import { formatINR } from "../../utils/currency";
import { getImageUriCandidates } from "../../utils/image";

function DrawerCartThumb({ uri, width: w, height: h, semanticPalette }) {
  const candidates = useMemo(() => getImageUriCandidates(uri), [uri]);
  const [idx, setIdx] = React.useState(0);
  useEffect(() => setIdx(0), [uri]);
  const current = candidates[idx] || "";
  if (!current) {
    return (
      <View style={[styles.thumbPlaceholder, { width: w, height: h, borderColor: semanticPalette.line }]}>
        <Ionicons name="image-outline" size={22} color={semanticPalette.inkMuted} />
      </View>
    );
  }
  return (
    <Image
      source={{ uri: current }}
      style={{ width: w, height: h, borderRadius: 10 }}
      contentFit="cover"
      onError={() => setIdx((i) => i + 1)}
    />
  );
}

export default function CartDrawer({ visible, onClose, navigationRef }) {
  const insets = useSafeAreaInsets();
  const { width: winW } = useWindowDimensions();
  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();
  const { cartItems, totalAmount, addToCart, removeFromCart, removeLineFromCart } = useCart();

  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    slide.setValue(0);
    Animated.timing(slide, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
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
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel={CART_DRAWER_UI.closeA11y} />
        <Animated.View
          style={[
            styles.panel,
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
                {progress >= 1 ? CART_DRAWER_UI.freeShippingDone : fillAway(CART_DRAWER_UI.freeShippingAway, remainder)}
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
                  <Card key={`${item.id}-${item.variantLabel || ""}`} padding="md" style={{ marginBottom: SPACING.md }}>
                    <View style={{ flexDirection: "row", gap: SPACING.md }}>
                      <DrawerCartThumb uri={item.image || ""} width={80} height={100} semanticPalette={semanticPalette} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }} numberOfLines={2}>
                          {item.name}
                        </Text>
                        {item.variantLabel ? (
                          <Text style={{ marginTop: 4, fontFamily: fonts.medium, fontSize: TYPE.caption.fontSize, color: semanticPalette.inkMuted }}>
                            {item.variantLabel}
                          </Text>
                        ) : null}
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: SPACING.sm }}>
                          <View style={{ flexDirection: "row", alignItems: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: semanticPalette.line, borderRadius: RADII.pill }}>
                            <Pressable
                              style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                              onPress={() => removeFromCart(item.id, item.variantLabel)}
                              accessibilityRole="button"
                              accessibilityLabel="Decrease quantity"
                            >
                              <Ionicons name="remove" size={18} color={semanticPalette.ink} />
                            </Pressable>
                            <Text style={{ fontFamily: fonts.semibold, minWidth: 24, textAlign: "center", color: semanticPalette.ink }}>{item.quantity}</Text>
                            <Pressable style={{ paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => addToCart(item)} accessibilityRole="button" accessibilityLabel="Increase quantity">
                              <Ionicons name="add" size={18} color={semanticPalette.ink} />
                            </Pressable>
                          </View>
                          <Pressable onPress={() => removeLineFromCart(item.id, item.variantLabel)} hitSlop={8} accessibilityRole="button" accessibilityLabel={CART_DRAWER_UI.removeLineA11y}>
                            <Ionicons name="trash-outline" size={20} color={semanticPalette.inkMuted} />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </Card>
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
              <Button label={CART_DRAWER_UI.checkoutCta} variant="primary" size="lg" fullWidth onPress={goCheckout} />
              <View style={{ height: SPACING.sm }} />
              <Button label={CART_DRAWER_UI.viewBagCta} variant="ghost" size="md" fullWidth onPress={goBag} />
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(14,23,41,0.45)",
  },
  panel: {
    flex: 1,
    maxHeight: "100%",
    ...Platform.select({
      web: { maxHeight: "100vh" },
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
