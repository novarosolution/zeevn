import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { KANKREG_PALETTE, ZEEVAN_GOLD, ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { FONT_PRICE } from "../../theme/typographyRoles";
import { customerFloatingNavOffset } from "../../theme/screenLayout";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { formatINR } from "../../utils/currency";
import { CART_UI } from "../../content/appContent";
import { fonts, spacing } from "../../theme/tokens";
import { platformShadow } from "../../theme/shadowPlatform";

const barShadowLight = platformShadow({
  web: { boxShadow: "0 -6px 20px rgba(36, 68, 36, 0.08)" },
  ios: {
    shadowColor: "#244424",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  android: { elevation: 8 },
});

const barShadowDark = platformShadow({
  web: { boxShadow: "0 -6px 20px rgba(0, 0, 0, 0.35)" },
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  android: { elevation: 8 },
});

/** Compact checkout pay bar — single flex row, does not dominate the screen. */
export default function KankregCartPayBar({
  subtotal,
  discount = 0,
  discountLabel,
  total,
  ctaLabel,
  onPress,
  disabled = false,
  loading = false,
  mode = "inline",
  compact = true,
  style,
  itemCount = 0,
}) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { showMobileWebTabBar } = useKankregLayout();
  const isSticky = mode === "sticky";
  const dockBottom = customerFloatingNavOffset(insets, { mobileWebTabBar: showMobileWebTabBar });
  /** In the app the floating bottom nav stays on screen, so the inline bar becomes a card docked just above it. */
  const isNativeDock = Platform.OS !== "web" && !isSticky;
  const sheetBg = isDark ? "rgba(20, 17, 15, 0.98)" : "rgba(252, 248, 240, 0.98)";
  const barShadow = isDark ? barShadowDark : barShadowLight;

  const shortCta = String(ctaLabel || CART_UI.payCta)
    .replace(/\s*[·•].*$/, "")
    .trim() || CART_UI.payCta;
  /** App copy already ends in an arrow ("Checkout →") and the button draws its own icon — drop the duplicate in the app. */
  const ctaText = Platform.OS === "web" ? shortCta : shortCta.replace(/\s*[→›»]+\s*$/, "") || shortCta;

  const metaBits = [];
  if (itemCount > 0) {
    metaBits.push(
      itemCount === 1
        ? CART_UI.itemCount.replace("{count}", "1")
        : CART_UI.itemCountPlural.replace("{count}", String(itemCount))
    );
  }
  metaBits.push(CART_UI.shippingFree);
  if (discount > 0) {
    metaBits.push(`−${formatINR(discount)}`);
  }

  return (
    <View
      style={[
        styles.bar,
        barShadow,
        {
          backgroundColor: sheetBg,
          borderTopColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(36, 68, 36, 0.1)",
          paddingBottom: Math.max(insets.bottom, 10),
        },
        isSticky
          ? {
              position: Platform.OS === "web" && showMobileWebTabBar ? "fixed" : "absolute",
              left: 0,
              right: 0,
              bottom: dockBottom,
              zIndex: Platform.OS === "web" && showMobileWebTabBar ? 850 : 40,
            }
          : styles.barInline,
        isNativeDock && {
          width: "auto",
          alignSelf: "stretch",
          marginHorizontal: spacing.md,
          marginBottom: dockBottom,
          paddingBottom: 10,
          borderRadius: 22,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(36, 68, 36, 0.14)",
        },
        style,
      ]}
    >
      <LinearGradient
        colors={["transparent", ZEEVAN_GOLD.base, "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.hairline}
        pointerEvents="none"
      />

      <View style={styles.row}>
        <View style={styles.totalCol}>
          <Text style={[styles.totalLabel, isDark && styles.totalLabelDark]}>{CART_UI.totalLabel}</Text>
          <Text style={[styles.totalValue, isDark && styles.totalValueDark]} numberOfLines={1}>
            {formatINR(total)}
          </Text>
          <Text style={[styles.metaLine, isDark && styles.metaLineDark]} numberOfLines={1}>
            {metaBits.join(" · ")}
          </Text>
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
          accessibilityLabel={ctaLabel || shortCta}
        >
          <LinearGradient
            colors={disabled || loading ? ["#9a9a9a", "#7a7a7a"] : [ZEEVAN_GREEN.bright, ZEEVAN_GREEN.deep]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText} numberOfLines={1}>
              {loading ? "…" : ctaText}
            </Text>
            {!loading && !disabled ? (
              <Ionicons name="arrow-forward" size={15} color="#FAF8F4" />
            ) : null}
          </LinearGradient>
        </Pressable>
      </View>

      {!compact && discount > 0 && discountLabel ? (
        <Text style={[styles.discountNote, isDark && styles.metaLineDark]} numberOfLines={1}>
          {discountLabel}: −{formatINR(discount)}
          {subtotal != null ? ` · ${CART_UI.stickySubtotalLabel} ${formatINR(subtotal)}` : ""}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "column",
    width: "100%",
    flexShrink: 0,
    paddingTop: 10,
    paddingHorizontal: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  barInline: {
    position: "relative",
    zIndex: 1,
  },
  hairline: {
    position: "absolute",
    top: 0,
    left: "18%",
    right: "18%",
    height: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  totalCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  totalLabel: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: KANKREG_PALETTE.inkFaint,
    marginBottom: 1,
  },
  totalLabelDark: {
    color: "rgba(250,248,244,0.5)",
  },
  totalValue: {
    fontFamily: FONT_PRICE,
    fontSize: 18,
    fontWeight: "600",
    color: ZEEVAN_GREEN.deep,
    letterSpacing: -0.3,
  },
  totalValueDark: {
    color: KANKREG_PALETTE.paper,
  },
  metaLine: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: ZEEVAN_GOLD.deep,
  },
  metaLineDark: {
    color: "rgba(232,188,132,0.85)",
  },
  discountNote: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: KANKREG_PALETTE.inkSoft,
  },
  ctaWrap: {
    flexShrink: 0,
    borderRadius: 12,
    overflow: "hidden",
    ...platformShadow({
      web: { boxShadow: "0 8px 18px -8px rgba(36, 68, 36, 0.4)" },
      default: {},
    }),
  },
  cta: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 44,
    minWidth: 118,
  },
  ctaText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#FAF8F4",
    letterSpacing: 0.15,
  },
});
