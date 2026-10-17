import React, { useMemo } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { adminTwoColAside, adminTwoColMain, adminTwoColStyle, useAdminCompactLayout } from "../../theme/adminLayout";
import { fonts, radius, spacing, typography } from "../../theme/tokens";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { formatINR } from "../../utils/currency";
import { getOrderItemQty } from "../../utils/adminOrderHelpers";
import {
  ALL_ORDER_STATUSES,
  ORDER_ADMIN_NEXT_STATUS,
  getOrderStatusLabel,
  getAdminNextStatusLabel,
} from "../../utils/orderStatus";
import AdminPanel from "./AdminPanel";
import PremiumInput from "../ui/PremiumInput";
import PremiumButton from "../ui/PremiumButton";
import PremiumChip from "../ui/PremiumChip";
import SectionReveal from "../motion/SectionReveal";

function InfoRow({ label, value, c }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: c.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: c.textPrimary }]}>{value || "—"}</Text>
    </View>
  );
}

export default function AdminOrderManagePanel({
  order,
  editForm,
  deliveryPartners,
  busy,
  onUpdateField,
  onSaveDetails,
  onAssignDelivery,
  onStatus,
  onDelete,
}) {
  const { colors: c } = useTheme();
  const compact = useAdminCompactLayout();
  const panelStyles = useMemo(() => createStyles(c), [c]);
  const nextStatus = ORDER_ADMIN_NEXT_STATUS[order.status];
  const statuses = ALL_ORDER_STATUSES;

  const leftColumn = (
    <>
      <AdminPanel title="Line items" meta={`${getOrderItemQty(order)} units`}>
        {(order.products || []).length ? (
          (order.products || []).map((product, index) => (
            <View
              key={`${order._id}-line-${index}`}
              style={[panelStyles.productRow, { borderColor: c.border, backgroundColor: c.surfaceMuted }]}
            >
              <Text style={[panelStyles.productName, { color: c.textPrimary }]}>{product.name}</Text>
              <Text style={[panelStyles.productMeta, { color: c.textSecondary }]}>
                {formatINR(Number(product.price || 0))} × {Number(product.quantity || 0)}
              </Text>
              {product.product?.inStock === false || Number(product.product?.stockQty || 0) <= 0 ? (
                <Text style={[panelStyles.outOfStockNote, { color: c.danger }]}>Out of stock</Text>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={[panelStyles.emptyHint, { color: c.textMuted }]}>No products on this order.</Text>
        )}
      </AdminPanel>

      <AdminPanel title="Payment summary">
        <InfoRow label="Items total" value={formatINR(Number(order.priceBreakdown?.itemsTotal || 0))} c={c} />
        <InfoRow label="Delivery fee" value={formatINR(Number(order.priceBreakdown?.deliveryFee || 0))} c={c} />
        <InfoRow label="Platform fee" value={formatINR(Number(order.priceBreakdown?.platformFee || 0))} c={c} />
        <InfoRow label="Discount" value={`-${formatINR(Number(order.priceBreakdown?.discountAmount || 0))}`} c={c} />
        {order.coupon?.code ? (
          <InfoRow
            label="Coupon"
            value={`${order.coupon.code} (-${formatINR(Number(order.coupon.discountAmount || 0))})`}
            c={c}
          />
        ) : null}
        <View style={[panelStyles.totalRow, { borderTopColor: c.border }]}>
          <Text style={[panelStyles.totalLabel, { color: c.textPrimary }]}>Order total</Text>
          <Text style={[panelStyles.totalValue, { color: c.primary }]}>
            {formatINR(Number(order.totalPrice || 0))}
          </Text>
        </View>
        <InfoRow label="Payment method" value={order.paymentMethod || "—"} c={c} />
        {order.razorpay?.orderId ? <InfoRow label="Razorpay order" value={order.razorpay.orderId} c={c} /> : null}
        {order.razorpay?.paymentId ? (
          <InfoRow label="Razorpay payment" value={order.razorpay.paymentId} c={c} />
        ) : null}
      </AdminPanel>

      <AdminPanel title="Shipping address">
        {order.deliveryZoneName ? (
          <InfoRow label="Delivery zone" value={order.deliveryZoneName} c={c} />
        ) : null}
        <InfoRow label="Name" value={order.shippingAddress?.fullName} c={c} />
        <InfoRow label="Phone" value={order.shippingAddress?.phone} c={c} />
        <InfoRow label="Address" value={order.shippingAddress?.line1} c={c} />
        <InfoRow
          label="City / State"
          value={[order.shippingAddress?.city, order.shippingAddress?.state].filter(Boolean).join(", ")}
          c={c}
        />
        <InfoRow
          label="Postal / Country"
          value={[order.shippingAddress?.postalCode, order.shippingAddress?.country].filter(Boolean).join(" · ")}
          c={c}
        />
        {order.shippingAddress?.note ? <InfoRow label="Note" value={order.shippingAddress.note} c={c} /> : null}
      </AdminPanel>
    </>
  );

  const rightColumn = (
    <>
      <AdminPanel title="Fulfillment">
        {nextStatus ? (
          <PremiumButton
            label={busy ? "Updating…" : `Advance to ${getAdminNextStatusLabel(order.status)}`}
            iconLeft="arrow-forward-outline"
            variant="primary"
            size="md"
            fullWidth
            loading={busy}
            disabled={busy}
            onPress={() => onStatus(order._id, nextStatus)}
            style={panelStyles.primaryAction}
          />
        ) : (
          <Text style={[panelStyles.emptyHint, { color: c.textMuted }]}>
            {order.status === "delivered"
              ? "This order is complete."
              : order.status === "cancelled"
                ? "This order was cancelled."
                : "No automatic next step."}
          </Text>
        )}

        <Text style={[panelStyles.fieldLabel, { color: c.textSecondary }]}>Set status</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={panelStyles.statusChips}>
          {statuses.map((status) => (
            <PremiumChip
              key={status}
              label={getOrderStatusLabel(status)}
              tone="gold"
              size="sm"
              selected={order.status === status}
              onPress={busy ? undefined : () => onStatus(order._id, status)}
            />
          ))}
        </ScrollView>
      </AdminPanel>

      <AdminPanel title="Delivery partner">
        <Text style={[panelStyles.emptyHint, { color: c.textSecondary, marginBottom: spacing.sm }]}>
          {order.assignedDeliveryUser?.name
            ? `Assigned: ${order.assignedDeliveryUser.name}${order.assignedDeliveryUser.phone ? ` · ${order.assignedDeliveryUser.phone}` : ""}`
            : "No partner assigned yet."}
        </Text>
        <Text style={[panelStyles.emptyHint, { color: c.textMuted, marginBottom: spacing.sm }]}>
          Accept:{" "}
          {String(order.deliveryAcceptStatus || "none")
            .replace(/_/g, " ")
            .replace(/\b\w/g, (ch) => ch.toUpperCase())}
          {order.deliveryDeclineReason
            ? ` · Last decline: ${order.deliveryDeclineReason}`
            : ""}
        </Text>
        {String(order.deliveryAcceptStatus) === "pending" ? (
          <Text style={[panelStyles.emptyHint, { color: c.warning || c.textSecondary, marginBottom: spacing.sm }]}>
            Waiting for partner to accept. Tap another name below to reassign.
          </Text>
        ) : null}
        {String(order.deliveryAcceptStatus) === "declined" && !order.assignedDeliveryUser ? (
          <Text style={[panelStyles.emptyHint, { color: c.danger, marginBottom: spacing.sm }]}>
            Partner declined — pick another delivery boy to reassign.
          </Text>
        ) : null}
        {deliveryPartners.length === 0 ? (
          <Text style={[panelStyles.emptyHint, { color: c.textMuted }]}>
            Enable delivery on a user in Manage Users first.
          </Text>
        ) : (
          <View style={panelStyles.assigneeChips}>
            <PremiumChip
              label="Unassign"
              tone="neutral"
              size="sm"
              selected={!editForm.assignedDeliveryUserId}
              onPress={() => onAssignDelivery("")}
            />
            {deliveryPartners.map((dp) => (
              <PremiumChip
                key={dp._id}
                label={
                  editForm.assignedDeliveryUserId === String(dp._id) &&
                  String(order.deliveryAcceptStatus) === "pending"
                    ? `${dp.name} (pending)`
                    : editForm.assignedDeliveryUserId === String(dp._id) &&
                        String(order.deliveryAcceptStatus) === "accepted"
                      ? `${dp.name} (accepted)`
                      : `Reassign · ${dp.name}`
                }
                tone="gold"
                size="sm"
                selected={editForm.assignedDeliveryUserId === String(dp._id)}
                onPress={() => onAssignDelivery(String(dp._id))}
              />
            ))}
          </View>
        )}
      </AdminPanel>

      <AdminPanel title="Edit order details">
        <View style={panelStyles.fieldGap}>
          <PremiumInput
            label="Payment method"
            value={editForm.paymentMethod}
            onChangeText={(v) => onUpdateField("paymentMethod", v)}
            iconLeft="card-outline"
          />
        </View>
        <View style={panelStyles.fieldGap}>
          <PremiumInput
            label="Full name"
            value={editForm.fullName}
            onChangeText={(v) => onUpdateField("fullName", v)}
            iconLeft="person-outline"
          />
        </View>
        <View style={panelStyles.fieldGap}>
          <PremiumInput
            label="Phone"
            value={editForm.phone}
            onChangeText={(v) => onUpdateField("phone", v)}
            keyboardType="phone-pad"
            iconLeft="call-outline"
          />
        </View>
        <View style={panelStyles.fieldGap}>
          <PremiumInput
            label="Address line"
            value={editForm.line1}
            onChangeText={(v) => onUpdateField("line1", v)}
            iconLeft="home-outline"
          />
        </View>
        <View style={panelStyles.splitRow}>
          <View style={[panelStyles.fieldGap, panelStyles.halfField]}>
            <PremiumInput label="City" value={editForm.city} onChangeText={(v) => onUpdateField("city", v)} />
          </View>
          <View style={[panelStyles.fieldGap, panelStyles.halfField]}>
            <PremiumInput label="State" value={editForm.state} onChangeText={(v) => onUpdateField("state", v)} />
          </View>
        </View>
        <View style={panelStyles.splitRow}>
          <View style={[panelStyles.fieldGap, panelStyles.halfField]}>
            <PremiumInput
              label="Postal code"
              value={editForm.postalCode}
              onChangeText={(v) => onUpdateField("postalCode", v)}
              keyboardType="number-pad"
            />
          </View>
          <View style={[panelStyles.fieldGap, panelStyles.halfField]}>
            <PremiumInput label="Country" value={editForm.country} onChangeText={(v) => onUpdateField("country", v)} />
          </View>
        </View>
        <View style={panelStyles.fieldGap}>
          <PremiumInput
            label="Order note"
            value={editForm.note}
            onChangeText={(v) => onUpdateField("note", v)}
            iconLeft="document-outline"
          />
        </View>
        <PremiumButton
          label={busy ? "Saving…" : "Save changes"}
          iconLeft="save-outline"
          variant="secondary"
          size="md"
          fullWidth
          loading={busy}
          disabled={busy}
          onPress={onSaveDetails}
        />
      </AdminPanel>

      <AdminPanel title="Invoice">
        <View style={panelStyles.fieldGap}>
          <PremiumInput
            label="Invoice number"
            value={editForm.invoiceNumber}
            onChangeText={(v) => onUpdateField("invoiceNumber", v)}
            iconLeft="receipt-outline"
          />
        </View>
        <View style={panelStyles.splitRow}>
          <View style={[panelStyles.fieldGap, panelStyles.halfField]}>
            <PremiumInput
              label="Issue date"
              value={editForm.invoiceIssueDate}
              onChangeText={(v) => onUpdateField("invoiceIssueDate", v)}
              placeholder="YYYY-MM-DD"
              autoCapitalize="none"
            />
          </View>
          <View style={[panelStyles.fieldGap, panelStyles.halfField]}>
            <PremiumInput
              label="Due date"
              value={editForm.invoiceDueDate}
              onChangeText={(v) => onUpdateField("invoiceDueDate", v)}
              placeholder="YYYY-MM-DD"
              autoCapitalize="none"
            />
          </View>
        </View>
        <View style={panelStyles.splitRow}>
          <View style={[panelStyles.fieldGap, panelStyles.halfField]}>
            <PremiumInput
              label="Tax %"
              value={editForm.invoiceTaxRatePercent}
              onChangeText={(v) => onUpdateField("invoiceTaxRatePercent", v)}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={[panelStyles.fieldGap, panelStyles.halfField]}>
            <PremiumInput
              label="Status"
              value={editForm.invoiceStatus}
              onChangeText={(v) => onUpdateField("invoiceStatus", v)}
              placeholder="draft / final / paid"
              autoCapitalize="none"
            />
          </View>
        </View>
        <View style={panelStyles.fieldGap}>
          <PremiumInput
            label="Invoice notes"
            value={editForm.invoiceNotes}
            onChangeText={(v) => onUpdateField("invoiceNotes", v)}
            multiline
            numberOfLines={2}
          />
        </View>
      </AdminPanel>

      <PremiumButton
        label={busy ? "Deleting…" : "Delete order"}
        iconLeft="trash-outline"
        variant="danger"
        size="md"
        fullWidth
        loading={busy}
        disabled={busy}
        onPress={onDelete}
      />
    </>
  );

  return (
    <View style={[adminTwoColStyle(compact), panelStyles.grid]}>
      <View style={adminTwoColMain(compact)}>
        <SectionReveal preset="fade-up" delay={40}>
          {leftColumn}
        </SectionReveal>
      </View>
      <View style={adminTwoColAside(compact)}>
        <SectionReveal preset="fade-up" delay={80}>
          {rightColumn}
        </SectionReveal>
      </View>
    </View>
  );
}

function createStyles(c) {
  return StyleSheet.create({
    grid: { marginTop: spacing.md },
    productRow: {
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.sm,
      marginBottom: spacing.sm,
    },
    productName: {
      fontFamily: fonts.semibold,
      fontSize: typography.bodySmall,
    },
    productMeta: {
      marginTop: 4,
      fontSize: typography.caption,
      fontFamily: fonts.regular,
    },
    outOfStockNote: {
      marginTop: 4,
      fontSize: typography.caption,
      fontFamily: fonts.semibold,
    },
    emptyHint: {
      fontSize: typography.bodySmall,
      fontFamily: fonts.regular,
      lineHeight: 20,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.md,
      paddingVertical: 6,
    },
    infoLabel: {
      fontSize: typography.caption,
      fontFamily: fonts.medium,
      flex: 1,
    },
    infoValue: {
      fontSize: typography.caption,
      fontFamily: fonts.semibold,
      flex: 1.2,
      textAlign: "right",
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    totalLabel: {
      fontFamily: FONT_HEADING,
      fontSize: typography.body,
    },
    totalValue: {
      fontFamily: FONT_HEADING,
      fontSize: typography.h3,
    },
    primaryAction: { marginBottom: spacing.md },
    fieldLabel: {
      fontSize: typography.caption,
      fontFamily: fonts.semibold,
      marginBottom: spacing.xs,
    },
    statusChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
      paddingBottom: spacing.xs,
    },
    assigneeChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    fieldGap: { marginBottom: spacing.sm },
    splitRow: {
      flexDirection: "row",
      gap: spacing.sm,
      ...Platform.select({ web: {}, default: { flexWrap: "wrap" } }),
    },
    halfField: { flex: 1, minWidth: 140 },
  });
}

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: typography.caption,
    flex: 1,
  },
  infoValue: {
    fontSize: typography.caption,
    flex: 1.2,
    textAlign: "right",
  },
});
