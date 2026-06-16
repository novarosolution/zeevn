import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { FONT_PRICE } from "../../theme/typographyRoles";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { useTheme } from "../../context/ThemeContext";
import { customerFloatingNavOffset } from "../../theme/screenLayout";
import { formatINR } from "../../utils/currency";
import { fonts, icon } from "../../theme/tokens";
import { PRODUCT_SCREEN, fillProductScreen } from "../../content/appContent";

/** Premium sticky buy bar — design board screen 08 */
export default function NativeStickyBuyBar({
  visible,
  productName,
  price,
  quantity = 0,
  onAddToCart,
  onRemoveFromCart,
  onBuyNow,
  disabled = false,
  ctaLabel = "Add to cart",
  dockedAboveTabBar = true,
}) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  if (Platform.OS === "web" || !visible) return null;

  const sheetBg = isDark ? "rgba(28,25,23,0.98)" : "rgba(255,253,248,0.98)";
  const inCart = quantity > 0;
  const lineTotal = inCart ? price * quantity : price;
  const priceLabel = inCart ? PRODUCT_SCREEN.stickyPriceLabel || "Total" : "Price";
  const bottomOffset = dockedAboveTabBar ? customerFloatingNavOffset(insets) : 0;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.shell, { bottom: bottomOffset }]}
    >
      <View
        style={[
          styles.bar,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: sheetBg,
            borderTopColor: isDark ? "rgba(255,255,255,0.08)" : KANKREG_PALETTE.line,
          },
        ]}
      >
        <LinearGradient
          colors={["rgba(220, 172, 116, 0)", ALCHEMY.gold, "rgba(220, 172, 116, 0)"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.hairline}
          pointerEvents="none"
        />

        <View style={styles.row}>
          <View style={styles.meta}>
            <Text style={styles.metaLabel}>{priceLabel}</Text>
            <Text style={[styles.price, { color: isDark ? KANKREG_PALETTE.paper : KANKREG_PALETTE.ink }]}>
              {formatINR(lineTotal)}
            </Text>
            {quantity > 0 ? (
              <Text style={styles.qtyHint}>
                {fillProductScreen(PRODUCT_SCREEN.inCartCount, { count: String(quantity) })}
              </Text>
            ) : productName ? (
              <Text style={styles.nameHint} numberOfLines={1}>
                {productName}
              </Text>
            ) : null}
          </View>

          {inCart && !disabled && onRemoveFromCart ? (
            <View style={styles.stepper}>
              <Pressable
                onPress={onRemoveFromCart}
                style={({ pressed }) => [styles.stepBtn, pressed && styles.stepBtnPressed]}
                accessibilityLabel="Decrease quantity"
              >
                <Ionicons name="remove" size={icon.sm} color="#fff" />
              </Pressable>
              <Text style={styles.stepCount}>{quantity}</Text>
              <Pressable
                onPress={onAddToCart}
                style={({ pressed }) => [styles.stepBtn, pressed && styles.stepBtnPressed]}
                accessibilityLabel="Increase quantity"
              >
                <Ionicons name="add" size={icon.sm} color="#fff" />
              </Pressable>
            </View>
          ) : null}

          <View style={styles.ctaRow}>
            {onBuyNow && !disabled ? (
              <Pressable
                onPress={onBuyNow}
                style={({ pressed }) => [styles.buyNow, pressed && { opacity: 0.9 }]}
                accessibilityRole="button"
              >
                <Text style={styles.buyNowText}>Buy now</Text>
              </Pressable>
            ) : null}
            {!inCart ? (
              <Pressable
                onPress={onAddToCart}
                disabled={disabled}
                style={({ pressed }) => [styles.ctaWrap, (pressed || disabled) && { opacity: 0.88 }]}
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={disabled ? ["#9a9a9a", "#7a7a7a"] : ["#788844", "#244424"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.cta}
                >
                  <Text style={styles.ctaText}>{ctaLabel}</Text>
                </LinearGradient>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 100,
  },
  bar: {
    paddingTop: 10,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: "#3D2A12",
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.1,
        shadowRadius: 14,
      },
      android: { elevation: 12 },
      default: {},
    }),
  },
  hairline: {
    position: "absolute",
    top: 0,
    left: "12%",
    right: "12%",
    height: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  meta: {
    flexShrink: 0,
    minWidth: 72,
    maxWidth: 108,
  },
  metaLabel: {
    fontFamily: fonts.regular,
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: KANKREG_PALETTE.inkFaint,
  },
  price: {
    fontFamily: FONT_PRICE,
    fontSize: 19,
    fontWeight: "600",
    letterSpacing: -0.3,
    marginTop: 1,
  },
  qtyHint: {
    fontFamily: fonts.medium,
    fontSize: 9,
    color: KANKREG_PALETTE.goldDeep,
    marginTop: 2,
  },
  nameHint: {
    fontFamily: fonts.medium,
    fontSize: 9,
    color: KANKREG_PALETTE.inkFaint,
    marginTop: 2,
    maxWidth: 100,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(25,20,15,0.05)",
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: KANKREG_PALETTE.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnPressed: { opacity: 0.85 },
  stepCount: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: KANKREG_PALETTE.ink,
    minWidth: 20,
    textAlign: "center",
  },
  ctaRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "flex-end",
  },
  buyNow: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: KANKREG_PALETTE.line,
    backgroundColor: KANKREG_PALETTE.card,
  },
  buyNowText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: KANKREG_PALETTE.inkSoft,
  },
  ctaWrap: {
    flex: 1,
    maxWidth: 148,
    borderRadius: 999,
    overflow: "hidden",
  },
  cta: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 999,
  },
  ctaText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: "#fff",
    letterSpacing: 0.2,
  },
});
