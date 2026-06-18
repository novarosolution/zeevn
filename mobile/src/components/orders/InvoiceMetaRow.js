import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MY_ORDERS_UI } from "../../content/appContent";
import { useTheme } from "../../context/ThemeContext";
import { FIGMA, figmaTextMuted, figmaTextPrimary } from "../../theme/figmaApp";
import { fonts } from "../../theme/tokens";
import { getInvoiceStatusBadge, resolveInvoiceNumber } from "../../utils/orderInvoiceMeta";

const TONE_STYLES = {
  paid: { bg: "rgba(21, 128, 61, 0.1)", border: "rgba(21, 128, 61, 0.28)", text: "#15803D" },
  pending: { bg: "rgba(220, 172, 116, 0.14)", border: "rgba(188, 144, 92, 0.35)", text: FIGMA.goldDeep },
  failed: { bg: "rgba(184, 68, 47, 0.1)", border: "rgba(184, 68, 47, 0.28)", text: FIGMA.danger },
  refunded: { bg: "rgba(30, 58, 138, 0.08)", border: "rgba(30, 58, 138, 0.22)", text: "#1E3A8A" },
  void: { bg: "rgba(184, 68, 47, 0.08)", border: "rgba(184, 68, 47, 0.22)", text: FIGMA.danger },
  draft: { bg: "rgba(92, 104, 52, 0.08)", border: "rgba(92, 104, 52, 0.22)", text: FIGMA.greenDeep },
  final: { bg: "rgba(220, 172, 116, 0.12)", border: "rgba(188, 144, 92, 0.3)", text: FIGMA.goldDeep },
};

function InvoiceMetaRowBase({ order }) {
  const { isDark, colors: c } = useTheme();
  const invoiceNumber = resolveInvoiceNumber(order);
  const badge = getInvoiceStatusBadge(order);
  const tone = TONE_STYLES[badge.tone] || TONE_STYLES.pending;
  const badgeTextColor =
    isDark && (badge.tone === "paid"
      ? "#86efac"
      : badge.tone === "failed" || badge.tone === "void"
        ? c.danger
        : c.accentGold);
  const resolvedBadgeColor = badgeTextColor || tone.text;
  const issueDate = order?.invoice?.issueDate || order?.createdAt;
  const issueLabel = issueDate
    ? new Date(issueDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : "";

  return (
    <View
      style={[
        styles.shell,
        {
          borderColor: isDark ? "rgba(232,200,90,0.22)" : tone.border,
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : tone.bg,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: isDark ? "rgba(232,200,90,0.12)" : "rgba(255,255,255,0.7)" }]}>
        <Ionicons name="document-text-outline" size={16} color={isDark ? FIGMA.goldBright : tone.text} />
      </View>
      <View style={styles.textCol}>
        <Text style={[styles.kicker, figmaTextMuted(isDark)]}>{MY_ORDERS_UI.invoiceDownload}</Text>
        <Text style={[styles.number, figmaTextPrimary(isDark)]} numberOfLines={1}>
          {invoiceNumber}
        </Text>
        {issueLabel ? (
          <Text style={[styles.meta, figmaTextMuted(isDark)]}>
            {MY_ORDERS_UI.detailInvoice} {issueLabel}
          </Text>
        ) : null}
      </View>
      <View style={[styles.badge, { borderColor: tone.border, backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.75)" }]}>
        <View style={[styles.dot, { backgroundColor: resolvedBadgeColor }]} />
        <Text style={[styles.badgeText, { color: resolvedBadgeColor }]} numberOfLines={1}>
          {badge.label}
        </Text>
      </View>
    </View>
  );
}

const InvoiceMetaRow = memo(InvoiceMetaRowBase);
export default InvoiceMetaRow;

const styles = StyleSheet.create({
  shell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  number: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    marginTop: 2,
    letterSpacing: -0.15,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 10,
    marginTop: 2,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 110,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 0.2,
    textTransform: "uppercase",
    flexShrink: 1,
  },
});
