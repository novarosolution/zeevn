import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { formatINR } from "../../utils/currency";
import { CART_UI, fillProductScreen } from "../../content/appContent";
import { fonts, spacing } from "../../theme/tokens";
import { platformShadow } from "../../theme/shadowPlatform";
import KankregCartCouponStrip from "./KankregCartCouponStrip";
import KankregCartPayBar from "./KankregCartPayBar";

/** Web cart aside — premium order summary with gold accent. */
export default function KankregCartSummaryCard({
  subtotal,
  discount = 0,
  discountLabel,
  platformFee = 0,
  total,
  ctaLabel,
  onPress,
  disabled,
  loading,
  showCoupon = false,
  couponCode,
  onCouponChange,
  onApplyCoupon,
  appliedCouponText,
  itemCount = 0,
}) {
  const { colors: c, isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? c.surface : "#FFFEFA",
          borderColor: isDark ? c.border : KANKREG_PALETTE.line,
        },
        isDark ? cardShadowDark : cardShadowLight,
      ]}
    >
      <View style={[styles.accent, { backgroundColor: isDark ? "rgba(52, 211, 153, 0.55)" : KANKREG_PALETTE.gold }]} />
      <Text style={[styles.title, { color: isDark ? c.textPrimary : KANKREG_PALETTE.ink }]}>
        {CART_UI.summaryTitle}
      </Text>
      {itemCount > 0 ? (
        <Text style={styles.itemCount}>
          {itemCount === 1
            ? fillProductScreen(CART_UI.itemCount, { count: "1" })
            : fillProductScreen(CART_UI.itemCountPlural, { count: String(itemCount) })}
        </Text>
      ) : null}

      {showCoupon ? (
        <KankregCartCouponStrip
          value={couponCode}
          onChangeText={onCouponChange}
          onApply={onApplyCoupon}
          appliedLabel={appliedCouponText}
        />
      ) : null}

      <View style={styles.lines}>
        <View style={styles.line}>
          <Text style={[styles.label, { color: isDark ? c.textSecondary : KANKREG_PALETTE.inkSoft }]}>
            {CART_UI.stickySubtotalLabel}
          </Text>
          <Text style={[styles.value, { color: isDark ? c.textPrimary : KANKREG_PALETTE.ink }]}>
            {formatINR(subtotal)}
          </Text>
        </View>
        <View style={styles.line}>
          <Text style={[styles.label, { color: isDark ? c.textSecondary : KANKREG_PALETTE.inkSoft }]}>
            {CART_UI.shippingLabel}
          </Text>
          <Text style={styles.free}>{CART_UI.shippingFree}</Text>
        </View>
        {platformFee > 0 ? (
          <View style={styles.line}>
            <Text style={[styles.label, { color: isDark ? c.textSecondary : KANKREG_PALETTE.inkSoft }]}>
              {CART_UI.serviceFeeLabel}
            </Text>
            <Text style={[styles.value, { color: isDark ? c.textPrimary : KANKREG_PALETTE.ink }]}>
              {formatINR(platformFee)}
            </Text>
          </View>
        ) : null}
        {discount > 0 ? (
          <View style={styles.line}>
            <Text style={[styles.label, styles.discount]}>{discountLabel || "Discount"}</Text>
            <Text style={[styles.value, styles.discount]}>−{formatINR(discount)}</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.totalBlock, { borderTopColor: isDark ? c.border : KANKREG_PALETTE.line }]}>
        <Text style={[styles.totalBlockLabel, { color: isDark ? c.textMuted : KANKREG_PALETTE.inkFaint }]}>
          {CART_UI.totalLabel}
        </Text>
        <Text style={[styles.totalBlockValue, { color: isDark ? c.textPrimary : KANKREG_PALETTE.ink }]}>
          {formatINR(total)}
        </Text>
      </View>

      <View style={[styles.trustRow, { borderTopColor: isDark ? c.border : KANKREG_PALETTE.line }]}>
        <Ionicons name="shield-checkmark-outline" size={13} color={KANKREG_PALETTE.green} />
        <Text style={[styles.trustText, { color: isDark ? c.textMuted : KANKREG_PALETTE.inkFaint }]}>
          {CART_UI.trustLine}
        </Text>
      </View>

      <KankregCartPayBar
        mode="inline"
        compact
        subtotal={subtotal}
        total={total}
        ctaLabel={ctaLabel}
        onPress={onPress}
        disabled={disabled}
        loading={loading}
        itemCount={itemCount}
        style={styles.payInline}
      />
    </View>
  );
}

const cardShadowLight = platformShadow({
  web: { boxShadow: "0 12px 32px rgba(22, 69, 51, 0.08)" },
  ios: {
    shadowColor: "#3D2A12",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  android: { elevation: 4 },
});

const cardShadowDark = platformShadow({
  web: { boxShadow: "0 12px 32px rgba(0, 0, 0, 0.32)" },
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
  },
  android: { elevation: 4 },
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: spacing.md + 4,
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    width: "100%",
    flexDirection: "column",
  },
  accent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.3,
    marginTop: 4,
  },
  itemCount: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: KANKREG_PALETTE.goldDeep,
    marginTop: -4,
    marginBottom: spacing.xs,
  },
  lines: {
    gap: 6,
    marginTop: spacing.xs,
  },
  line: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  value: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  free: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: KANKREG_PALETTE.green,
    letterSpacing: 0.3,
  },
  discount: {
    color: KANKREG_PALETTE.green,
  },
  totalBlock: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalBlockLabel: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  totalBlockValue: {
    flexShrink: 0,
    fontFamily: FONT_HEADING,
    fontSize: 24,
    letterSpacing: -0.4,
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  trustText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 14,
  },
  payInline: {
    marginTop: spacing.xs,
    paddingHorizontal: 0,
    paddingTop: spacing.sm,
    borderTopWidth: 0,
    backgroundColor: "transparent",
  },
});
