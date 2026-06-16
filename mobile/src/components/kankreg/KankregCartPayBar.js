import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { FONT_PRICE } from "../../theme/typographyRoles";
import { customerFloatingNavOffset } from "../../theme/screenLayout";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { formatINR } from "../../utils/currency";
import { CART_UI } from "../../content/appContent";
import { fonts, spacing } from "../../theme/tokens";
import { platformShadow } from "../../theme/shadowPlatform";

const barShadow = platformShadow({
  web: { boxShadow: "0 -10px 32px rgba(22, 69, 51, 0.1)" },
  ios: {
    shadowColor: "#3D2A12",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
  },
  android: { elevation: 10 },
});

/**
 * Premium cart sticky footer — gold CTA, clear price breakdown.
 */
export default function KankregCartPayBar({
  subtotal,
  discount = 0,
  discountLabel,
  total,
  ctaLabel,
  onPress,
  disabled = false,
  loading = false,
  mode = "sticky",
  compact = false,
  style,
  itemCount = 0,
}) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { showMobileWebTabBar } = useKankregLayout();
  const isSticky = mode === "sticky";
  const showBreakdown = !compact;
  const dockBottom = customerFloatingNavOffset(insets, { mobileWebTabBar: showMobileWebTabBar });
  const sheetBg = isDark ? "rgba(20, 17, 15, 0.97)" : "rgba(255, 253, 248, 0.98)";

  return (
    <View
      style={[
        styles.bar,
        barShadow,
        {
          backgroundColor: sheetBg,
          borderTopColor: isDark ? "rgba(255,255,255,0.08)" : KANKREG_PALETTE.line,
        },
        isSticky && {
          position: Platform.OS === "web" && showMobileWebTabBar ? "fixed" : "absolute",
          left: 0,
          right: 0,
          bottom: dockBottom,
          paddingBottom: Math.max(insets.bottom, 12),
          zIndex: Platform.OS === "web" && showMobileWebTabBar ? 850 : 40,
          ...(Platform.OS === "web" && showMobileWebTabBar
            ? {
                maxWidth: "100%",
                marginHorizontal: "auto",
                paddingHorizontal: 14,
              }
            : {}),
        },
        style,
      ]}
    >
      <LinearGradient
        colors={["rgba(52, 211, 153, 0)", KANKREG_PALETTE.gold, "rgba(52, 211, 153, 0)"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.hairline}
        pointerEvents="none"
      />

      {showBreakdown ? (
        <>
          <View style={styles.line}>
            <Text style={[styles.meta, isDark && styles.metaDark]}>{CART_UI.stickySubtotalLabel}</Text>
            <Text style={[styles.meta, isDark && styles.metaDark]}>{formatINR(subtotal)}</Text>
          </View>
          <View style={styles.line}>
            <Text style={[styles.meta, isDark && styles.metaDark]}>{CART_UI.shippingLabel}</Text>
            <Text style={styles.free}>{CART_UI.shippingFree}</Text>
          </View>
        </>
      ) : null}
      {showBreakdown && discount > 0 ? (
        <View style={styles.line}>
          <Text style={[styles.meta, styles.discountMeta]}>{discountLabel || "Discount"}</Text>
          <Text style={[styles.meta, styles.discountMeta]}>−{formatINR(discount)}</Text>
        </View>
      ) : null}

      <View style={styles.totalRow}>
        <View>
          <Text style={[styles.totalLabel, isDark && { color: KANKREG_PALETTE.paper }]}>
            {CART_UI.totalLabel}
          </Text>
          {itemCount > 0 ? (
            <Text style={styles.itemHint}>
              {itemCount === 1 ? CART_UI.itemCount.replace("{count}", "1") : CART_UI.itemCountPlural.replace("{count}", String(itemCount))}
            </Text>
          ) : null}
        </View>
        <Text style={[styles.totalValue, isDark && { color: KANKREG_PALETTE.paper }]}>{formatINR(total)}</Text>
      </View>

      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed, hovered }) => [
          styles.ctaWrap,
          (pressed || disabled) && { opacity: 0.88 },
          Platform.OS === "web" && hovered && !disabled && { opacity: 0.94 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
      >
        <LinearGradient
          colors={disabled || loading ? ["#9a9a9a", "#7a7a7a"] : ["#788844", "#244424"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>{loading ? "Please wait…" : ctaLabel}</Text>
          {!loading && !disabled ? (
            <Ionicons name="arrow-forward" size={16} color="#FFF9EC" style={styles.ctaIcon} />
          ) : null}
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  hairline: {
    position: "absolute",
    top: 0,
    left: "10%",
    right: "10%",
    height: 1,
  },
  line: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: KANKREG_PALETTE.inkSoft,
  },
  metaDark: {
    color: "rgba(245, 239, 228, 0.72)",
  },
  free: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: KANKREG_PALETTE.green,
    letterSpacing: 0.4,
  },
  discountMeta: {
    color: KANKREG_PALETTE.green,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: spacing.sm + 4,
  },
  totalLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: KANKREG_PALETTE.inkFaint,
  },
  itemHint: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: KANKREG_PALETTE.goldDeep,
    marginTop: 2,
  },
  totalValue: {
    fontFamily: FONT_PRICE,
    fontSize: 22,
    fontWeight: "600",
    color: KANKREG_PALETTE.ink,
    letterSpacing: -0.3,
  },
  ctaWrap: {
    borderRadius: 999,
    overflow: "hidden",
    ...platformShadow({
      web: { boxShadow: "0 10px 24px rgba(160, 116, 26, 0.28)" },
      default: {},
    }),
  },
  cta: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 999,
  },
  ctaText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#FFF9EC",
    letterSpacing: 0.2,
  },
  ctaIcon: {
    marginTop: 1,
  },
});
