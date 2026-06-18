import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MY_ORDERS_UI } from "../../content/appContent";
import { useTheme } from "../../context/ThemeContext";
import { FONT_HEADING_SEMI, FONT_PRICE } from "../../theme/typographyRoles";
import { FIGMA, figmaTextMuted, figmaTextPrimary } from "../../theme/figmaApp";
import { platformShadow } from "../../theme/shadowPlatform";
import { fonts } from "../../theme/tokens";
import { formatINR } from "../../utils/currency";
import { resolveInvoiceNumber, getInvoiceStatusBadge } from "../../utils/orderInvoiceMeta";

function DetailRow({ label, value, accent, isDark, last = false }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder, { borderBottomColor: isDark ? "#3f3933" : FIGMA.line }]}>
      <Text style={[styles.rowLabel, figmaTextMuted(isDark)]}>{label}</Text>
      <Text style={[styles.rowValue, figmaTextPrimary(isDark), accent && { color: accent }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function formatPaymentStatusLabel(ps) {
  const s = String(ps || "pending").toLowerCase();
  if (s === "paid") return "Paid";
  if (s === "pending") return "Pending";
  if (s === "failed") return "Failed";
  if (s === "refunded") return "Refunded";
  return String(ps || "—");
}

/** Premium expandable order breakdown + delivery details. */
function OrderDetailPanelBase({ order }) {
  const { isDark, colors: c } = useTheme();
  if (!order) return null;

  const breakdown = order.priceBreakdown || {};
  const address = order.shippingAddress || {};
  const addressLines = [
    address.fullName,
    address.line1,
    [address.city, address.state].filter(Boolean).join(", "),
    [address.postalCode, address.country].filter(Boolean).join(" "),
  ].filter((line) => String(line || "").trim());

  const totalShadow = platformShadow({
    web: { boxShadow: "0 8px 24px -12px rgba(169,119,46,.35)" },
    ios: { shadowColor: "#244424", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 10 },
    android: { elevation: 3 },
  });

  return (
    <View style={[styles.shell, { borderColor: isDark ? "#3f3933" : FIGMA.line, backgroundColor: isDark ? "#14110e" : "rgba(255,253,248,0.92)" }]}>
      <View style={styles.head}>
        <View style={[styles.headIcon, { backgroundColor: isDark ? "rgba(232,200,90,0.12)" : "rgba(255,251,235,0.95)" }]}>
          <Ionicons name={MY_ORDERS_UI.icons.details} size={16} color={FIGMA.goldDeep} />
        </View>
        <Text style={[styles.headTitle, figmaTextPrimary(isDark)]}>{MY_ORDERS_UI.detailTitle}</Text>
      </View>

      {(order?.products || []).length > 0 ? (
        <View style={[styles.itemsBlock, { borderBottomColor: isDark ? "#3f3933" : FIGMA.line }]}>
          {(order.products || []).map((productItem, index) => (
            <View key={`${order._id}-item-${index}`} style={styles.itemRow}>
              <Text style={[styles.itemName, figmaTextPrimary(isDark)]} numberOfLines={2}>
                {productItem.name}
              </Text>
              <Text style={[styles.itemQty, figmaTextMuted(isDark)]}>× {productItem.quantity}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <DetailRow label={MY_ORDERS_UI.detailItems} value={formatINR(breakdown.itemsTotal || 0)} isDark={isDark} />
      <DetailRow label={MY_ORDERS_UI.detailDelivery} value={formatINR(breakdown.deliveryFee || 0)} isDark={isDark} />
      <DetailRow label={MY_ORDERS_UI.detailPlatform} value={formatINR(breakdown.platformFee || 0)} isDark={isDark} />
      {Number(breakdown.discountAmount || 0) > 0 ? (
        <DetailRow label={MY_ORDERS_UI.detailDiscount} value={`− ${formatINR(breakdown.discountAmount)}`} accent={c.secondary} isDark={isDark} />
      ) : null}
      {order?.coupon?.code ? (
        <DetailRow
          label={MY_ORDERS_UI.detailCoupon}
          value={`${order.coupon.code} · −${formatINR(order.coupon.discountAmount || 0)}`}
          accent={FIGMA.goldDeep}
          isDark={isDark}
        />
      ) : null}
      <DetailRow
        label={MY_ORDERS_UI.detailPaymentMethod}
        value={order.paymentMethod || "Cash on Delivery"}
        isDark={isDark}
      />
      <DetailRow
        label={MY_ORDERS_UI.detailPaymentStatus}
        value={formatPaymentStatusLabel(order.paymentStatus)}
        isDark={isDark}
      />
      {order.razorpay?.paymentId ? (
        <DetailRow label={MY_ORDERS_UI.detailPaymentId} value={order.razorpay.paymentId} isDark={isDark} />
      ) : null}
      {Number(order?.invoice?.taxAmount || 0) > 0 ? (
        <DetailRow
          label={MY_ORDERS_UI.detailTax}
          value={formatINR(order.invoice.taxAmount)}
          isDark={isDark}
        />
      ) : null}
      {order.invoice?.number || order._id ? (
        <View style={[styles.invoiceBox, { borderColor: isDark ? "#3f3933" : FIGMA.line, backgroundColor: isDark ? "#181513" : "#fffefb" }]}>
          <View style={styles.invoiceHead}>
            <Ionicons name="document-text-outline" size={14} color={FIGMA.goldDeep} />
            <Text style={[styles.invoiceTitle, figmaTextMuted(isDark)]}>{MY_ORDERS_UI.invoiceDownload}</Text>
            <View style={[styles.invoiceBadge, { borderColor: isDark ? "rgba(232,200,90,0.35)" : "rgba(188,144,92,0.35)" }]}>
              <Text style={[styles.invoiceBadgeText, { color: FIGMA.goldDeep }]}>
                {getInvoiceStatusBadge(order).label}
              </Text>
            </View>
          </View>
          <Text style={[styles.invoiceNumber, figmaTextPrimary(isDark)]}>{resolveInvoiceNumber(order)}</Text>
          {order.invoice?.issueDate ? (
            <Text style={[styles.invoiceMeta, figmaTextMuted(isDark)]}>
              {MY_ORDERS_UI.detailInvoice} {new Date(order.invoice.issueDate).toLocaleDateString()}
            </Text>
          ) : null}
          {order.invoice?.notes ? (
            <Text style={[styles.invoiceNote, figmaTextMuted(isDark)]} numberOfLines={3}>
              {order.invoice.notes}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.totalBanner, totalShadow]}>
        <LinearGradient
          colors={isDark ? ["#BC905C", "#8a5a12"] : ["#f3e4c4", "#DCAC74"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.totalGradient}
        >
          <Text style={[styles.totalLabel, { color: isDark ? "rgba(255,255,255,0.85)" : "#5c3d12" }]}>
            {MY_ORDERS_UI.detailTotal}
          </Text>
          <Text style={[styles.totalValue, { color: isDark ? "#fff" : "#3d2a0a" }]}>
            {formatINR(order.totalPrice)}
          </Text>
        </LinearGradient>
      </View>

      {addressLines.length ? (
        <View style={[styles.addressBox, { borderColor: isDark ? "#3f3933" : FIGMA.line, backgroundColor: isDark ? "#181513" : "#fffefb" }]}>
          <View style={styles.addressHead}>
            <Ionicons name="location-outline" size={14} color={FIGMA.goldDeep} />
            <Text style={[styles.addressTitle, figmaTextMuted(isDark)]}>{MY_ORDERS_UI.detailAddress}</Text>
          </View>
          {addressLines.map((line) => (
            <Text key={String(line)} style={[styles.addressLine, figmaTextPrimary(isDark)]}>
              {line}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const OrderDetailPanel = memo(OrderDetailPanelBase);
export default OrderDetailPanel;

const styles = StyleSheet.create({
  shell: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  headTitle: {
    fontFamily: FONT_HEADING_SEMI,
    fontSize: 15,
    letterSpacing: -0.2,
  },
  itemsBlock: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  itemName: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  itemQty: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    flex: 1,
  },
  rowValue: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    textAlign: "right",
    flex: 1,
  },
  totalBanner: {
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 12,
    borderRadius: 14,
    overflow: "hidden",
  },
  totalGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  totalLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  totalValue: {
    fontFamily: FONT_PRICE,
    fontSize: 22,
    letterSpacing: -0.5,
  },
  addressBox: {
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  addressHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  addressTitle: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  addressLine: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  invoiceBox: {
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  invoiceHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  invoiceTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  invoiceBadge: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  invoiceBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  invoiceNumber: {
    fontFamily: FONT_HEADING_SEMI,
    fontSize: 14,
    letterSpacing: -0.2,
  },
  invoiceMeta: {
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  invoiceNote: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
});
