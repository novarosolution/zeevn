import React, { useMemo } from "react";
import { Linking, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { adminTwoColAside, adminTwoColMain, adminTwoColStyle, useAdminCompactLayout } from "../../theme/adminLayout";
import { fonts, radius, spacing, typography } from "../../theme/tokens";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { formatINR } from "../../utils/currency";
import { getOrderItemQty } from "../../utils/adminOrderHelpers";
import {
  ALL_ORDER_STATUSES,
  INVOICE_STATUS_VALUES,
  ORDER_ADMIN_NEXT_STATUS,
  formatEventClock,
  getOrderStatusLabel,
  getAdminNextStatusLabel,
} from "../../utils/orderStatus";
import AdminPanel from "./AdminPanel";
import AdminOrderQuickActions from "./AdminOrderQuickActions";
import PremiumInput from "../ui/PremiumInput";
import PremiumButton from "../ui/PremiumButton";
import PremiumChip from "../ui/PremiumChip";
import SectionReveal from "../motion/SectionReveal";

const ETA_PRESETS = [
  { min: "20", max: "35", label: "20–35m" },
  { min: "30", max: "45", label: "30–45m" },
  { min: "45", max: "60", label: "45–60m" },
  { min: "60", max: "90", label: "60–90m" },
];

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
  onOpenMap,
  onAssignDelivery,
  onStatus,
  onDelete,
  onCancelOrder,
}) {
  const { colors: c } = useTheme();
  const compact = useAdminCompactLayout();
  const panelStyles = useMemo(() => createStyles(c), [c]);
  const nextStatus = ORDER_ADMIN_NEXT_STATUS[order.status];
  const statuses = ALL_ORDER_STATUSES;
  const phone = String(order.shippingAddress?.phone || order.user?.phone || "").trim();

  const applyEtaPreset = (preset) => {
    onUpdateField("etaMinutesMin", preset.min);
    onUpdateField("etaMinutesMax", preset.max);
  };

  const callCustomer = () => {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/\s+/g, "")}`);
  };

  const leftColumn = (
    <>
      <AdminPanel
        title="Customer contact"
        icon="call-outline"
        meta={phone ? "Reachable" : "No phone"}
        description="Call or note the shipping contact for this run."
      >
        <InfoRow label="Name" value={order.shippingAddress?.fullName || order.user?.name} c={c} />
        <InfoRow label="Phone" value={phone || "—"} c={c} />
        <InfoRow label="Email" value={order.user?.email} c={c} />
        <View style={panelStyles.contactActions}>
          <PremiumButton
            label="Call customer"
            iconLeft="call-outline"
            variant="primary"
            size="sm"
            disabled={!phone}
            onPress={callCustomer}
          />
          <PremiumButton
            label="Copy phone"
            iconLeft="copy-outline"
            variant="ghost"
            size="sm"
            disabled={!phone || Platform.OS !== "web"}
            onPress={() => {
              if (Platform.OS === "web" && phone && globalThis.navigator?.clipboard?.writeText) {
                globalThis.navigator.clipboard.writeText(phone);
              }
            }}
          />
        </View>
      </AdminPanel>

      <AdminPanel title="Line items" icon="basket-outline" meta={`${getOrderItemQty(order)} units`} description="Products and quantities on this order.">
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

      <AdminPanel title="Payment summary" icon="card-outline" description="Fees, discounts, and gateway refs.">
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
        {order.youpi?.paymentId ? <InfoRow label="YouPI payment" value={order.youpi.paymentId} c={c} /> : null}
        {order.youpi?.utr ? <InfoRow label="YouPI UTR" value={order.youpi.utr} c={c} /> : null}
      </AdminPanel>

      <AdminPanel title="Shipping address" icon="home-outline" description="Delivery destination and zone.">
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
      <AdminOrderQuickActions
        status={order.status}
        busy={busy}
        compact={compact}
        onAdvance={(status) => onStatus(order._id, status)}
        onStatus={(status) => onStatus(order._id, status)}
        onCancel={() => (onCancelOrder ? onCancelOrder() : onStatus(order._id, "cancelled"))}
      />

      <AdminPanel
        title="Fulfillment"
        icon="flash-outline"
        meta={getOrderStatusLabel(order.status)}
        description="Advance the run, or jump to any status. Notes show on the customer timeline."
      >
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

        <View style={panelStyles.fieldGap}>
          <PremiumInput
            label="Status note (customer timeline)"
            value={editForm.statusNote}
            onChangeText={(v) => onUpdateField("statusNote", v)}
            iconLeft="chatbubble-ellipses-outline"
            placeholder="e.g. Rider left the store"
          />
        </View>

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

      <AdminPanel
        title="Delivery partner"
        icon="bicycle-outline"
        description="Assign a rider — they must accept before the run goes live."
      >
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

      <AdminPanel
        title="Customer tracking"
        icon="navigate-outline"
        meta="Shown on My Orders"
        description="ETA presets, courier, and tracking link for the customer app."
      >
        <Text style={[panelStyles.fieldLabel, { color: c.textSecondary }]}>ETA presets</Text>
        <View style={panelStyles.assigneeChips}>
          {ETA_PRESETS.map((preset) => (
            <PremiumChip
              key={preset.label}
              label={preset.label}
              tone="gold"
              size="sm"
              selected={editForm.etaMinutesMin === preset.min && editForm.etaMinutesMax === preset.max}
              onPress={() => applyEtaPreset(preset)}
            />
          ))}
        </View>
        <View style={panelStyles.fieldGap}>
          <PremiumInput
            label="Tracking note"
            value={editForm.trackingNote}
            onChangeText={(v) => onUpdateField("trackingNote", v)}
            iconLeft="navigate-outline"
            placeholder="e.g. Almost at your gate"
          />
        </View>
        <View style={panelStyles.splitRow}>
          <View style={[panelStyles.fieldGap, panelStyles.halfField]}>
            <PremiumInput
              label="ETA min (minutes)"
              value={editForm.etaMinutesMin}
              onChangeText={(v) => onUpdateField("etaMinutesMin", v)}
              keyboardType="number-pad"
            />
          </View>
          <View style={[panelStyles.fieldGap, panelStyles.halfField]}>
            <PremiumInput
              label="ETA max (minutes)"
              value={editForm.etaMinutesMax}
              onChangeText={(v) => onUpdateField("etaMinutesMax", v)}
              keyboardType="number-pad"
            />
          </View>
        </View>
        <View style={panelStyles.fieldGap}>
          <PremiumInput
            label="Courier name"
            value={editForm.courierName}
            onChangeText={(v) => onUpdateField("courierName", v)}
            iconLeft="bicycle-outline"
          />
        </View>
        <View style={panelStyles.fieldGap}>
          <PremiumInput
            label="Tracking ID"
            value={editForm.trackingId}
            onChangeText={(v) => onUpdateField("trackingId", v)}
            autoCapitalize="characters"
          />
        </View>
        <View style={panelStyles.fieldGap}>
          <PremiumInput
            label="Tracking URL"
            value={editForm.trackingUrl}
            onChangeText={(v) => onUpdateField("trackingUrl", v)}
            autoCapitalize="none"
            iconLeft="link-outline"
          />
        </View>
        <PremiumButton
          label={busy ? "Saving…" : "Save tracking"}
          iconLeft="save-outline"
          variant="secondary"
          size="md"
          fullWidth
          loading={busy}
          disabled={busy}
          onPress={onSaveDetails}
        />
        {(order.statusHistory || []).length ? (
          <View style={panelStyles.timeline}>
            <Text style={[panelStyles.fieldLabel, { color: c.textSecondary }]}>Status timeline</Text>
            {[...order.statusHistory].reverse().map((ev, i) => (
              <View key={`${ev.status}-${ev.at}-${i}`} style={panelStyles.timelineRow}>
                <Text style={[panelStyles.timelineStatus, { color: c.textPrimary }]}>
                  {getOrderStatusLabel(ev.status)}
                </Text>
                <Text style={[panelStyles.timelineMeta, { color: c.textMuted }]}>
                  {formatEventClock(ev.at)}
                  {ev.note ? ` · ${ev.note}` : ""}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </AdminPanel>

      <AdminPanel title="Edit order details" icon="create-outline" description="Payment method and shipping fields.">
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
          <PremiumButton
            label="Select on map"
            iconLeft="map-outline"
            variant="ghost"
            size="md"
            onPress={onOpenMap}
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

      <AdminPanel title="Invoice" icon="document-text-outline" description="Invoice number, tax, and due dates.">
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
            <Text style={[panelStyles.fieldLabel, { color: c.textSecondary }]}>Invoice status</Text>
            <View style={panelStyles.assigneeChips}>
              {INVOICE_STATUS_VALUES.map((status) => (
                <PremiumChip
                  key={status}
                  label={status}
                  tone="gold"
                  size="sm"
                  selected={editForm.invoiceStatus === status}
                  onPress={() => onUpdateField("invoiceStatus", status)}
                />
              ))}
            </View>
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
    contactActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    fieldLabel: {
      fontSize: typography.caption,
      fontFamily: fonts.semibold,
      marginBottom: spacing.xs,
      marginTop: spacing.xs,
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
      marginBottom: spacing.sm,
    },
    fieldGap: { marginBottom: spacing.sm },
    splitRow: {
      flexDirection: "row",
      gap: spacing.sm,
      ...Platform.select({ web: {}, default: { flexWrap: "wrap" } }),
    },
    halfField: { flex: 1, minWidth: 140 },
    timeline: { marginTop: spacing.xs, gap: 8 },
    timelineRow: { gap: 2 },
    timelineStatus: { fontFamily: fonts.semibold, fontSize: typography.bodySmall },
    timelineMeta: { fontFamily: fonts.regular, fontSize: typography.caption },
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
