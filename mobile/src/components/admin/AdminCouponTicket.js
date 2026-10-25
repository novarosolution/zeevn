import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { ADMIN_FONT, getAdminChrome } from "../../theme/adminLayout";
import { fonts } from "../../theme/tokens";
import { formatRupees } from "../../utils/adminFormat";
import AdminBadge from "./AdminBadge";

function valueLabel(coupon) {
  if (coupon.type === "flat") return `${formatRupees(coupon.value)} off`;
  return `${Number(coupon.value || 0)}% off`;
}

function expiryLabel(value) {
  if (!value) return "No expiry";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "No expiry";
  return d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
}

function usageLabel(coupon) {
  const used = Number(coupon.usedCount || 0);
  const limit = Number(coupon.usageLimit);
  if (Number.isFinite(limit) && limit >= 1) return `${used} / ${limit} used`;
  return `${used} / unlimited`;
}

export default function AdminCouponTicket({ coupon, onPress }) {
  const { colors: c, isDark } = useTheme();
  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
  const issued = Boolean(coupon.issuedForUser);
  const styles = useMemo(() => createStyles(chrome, Boolean(onPress) && !issued), [chrome, onPress, issued]);
  const customer = coupon.issuedForName || coupon.issuedForEmail || "Customer";
  const Wrap = issued || !onPress ? View : Pressable;
  const wrapProps = issued || !onPress ? {} : { onPress, accessibilityRole: "button", accessibilityLabel: `Edit ${coupon.code}` };

  return (
    <Wrap style={styles.ticket} {...wrapProps}>
      <Text style={styles.code}>{coupon.code}</Text>
      {coupon.title ? <Text style={styles.title}>{coupon.title}</Text> : null}
      <Text style={styles.meta}>
        {coupon.type === "flat" ? "Flat" : "Percent"} · {valueLabel(coupon)}
      </Text>
      <Text style={styles.meta}>Minimum {formatRupees(coupon.minOrderAmount || 0)}</Text>
      <Text style={styles.meta}>{usageLabel(coupon)}</Text>
      <Text style={styles.meta}>{expiryLabel(coupon.expiresAt)}</Text>
      {issued ? <Text style={styles.issued}>Issued for {customer}</Text> : null}
      <View style={styles.pills}>
        <AdminBadge label={coupon.isActive === false ? "Off" : "Active"} tone={coupon.isActive === false ? "neutral" : "green"} size="sm" />
        {coupon.isVisibleToUsers === false ? <AdminBadge label="Hidden" tone="gold" size="sm" /> : null}
        {coupon.isOneTimePerUser ? <AdminBadge label="One-time" tone="purple" size="sm" /> : null}
      </View>
    </Wrap>
  );
}

function createStyles(chrome, clickable) {
  return StyleSheet.create({
    ticket: {
      backgroundColor: chrome.card,
      borderWidth: 1,
      borderColor: chrome.line,
      borderRadius: 16,
      padding: 16,
      gap: 4,
      ...Platform.select({
        web: clickable ? { cursor: "pointer" } : {},
        default: {},
      }),
    },
    code: {
      fontFamily: ADMIN_FONT.semibold,
      fontSize: 16,
      letterSpacing: 0.3,
      color: chrome.ink,
      fontWeight: "600",
    },
    title: { fontSize: 13.5, color: chrome.ink, fontFamily: fonts.semibold },
    meta: { fontSize: 12.5, color: chrome.inkSoft, fontFamily: fonts.regular },
    issued: { marginTop: 4, fontSize: 12.5, color: chrome.ink, fontFamily: fonts.semibold },
    pills: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  });
}
