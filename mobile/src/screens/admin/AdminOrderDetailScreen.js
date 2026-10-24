import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminBackLink from "../../components/admin/AdminBackLink";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminPanel from "../../components/admin/AdminPanel";
import AdminOrderManagePanel from "../../components/admin/AdminOrderManagePanel";
import { AdminOrderStatusBadge, AdminPaymentStatusChip } from "../../components/admin/AdminOrderBadges";
import { useAuth } from "../../context/AuthContext";
import { useLiveSocket } from "../../context/LiveSocketContext";
import { useTheme } from "../../context/ThemeContext";
import {
  deleteAdminOrder,
  fetchAdminOrder,
  fetchAdminUsers,
  updateAdminOrderDetails,
  updateOrderStatus,
} from "../../services/adminService";
import { adminShellContent } from "../../theme/adminLayout";
import { FONT_HEADING, FONT_PRICE } from "../../theme/typographyRoles";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, layout, radius, spacing, typography } from "../../theme/tokens";
import { formatOrderPublicRef } from "../../content/appContent";
import { formatINR } from "../../utils/currency";
import { getOrderItemQty } from "../../utils/adminOrderHelpers";
import { ORDER_ADMIN_NEXT_STATUS, getAdminNextStatusLabel } from "../../utils/orderStatus";
import PremiumLoader from "../../components/ui/PremiumLoader";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumButton from "../../components/ui/PremiumButton";
import SectionReveal from "../../components/motion/SectionReveal";

function buildEditForm(order) {
  if (!order) return null;
  const aid = order.assignedDeliveryUser;
  const assignedDeliveryUserId =
    aid && typeof aid === "object" && aid._id ? String(aid._id) : aid ? String(aid) : "";
  return {
    paymentMethod: order.paymentMethod || "",
    fullName: order.shippingAddress?.fullName || "",
    phone: order.shippingAddress?.phone || "",
    line1: order.shippingAddress?.line1 || "",
    city: order.shippingAddress?.city || "",
    state: order.shippingAddress?.state || "",
    postalCode: order.shippingAddress?.postalCode || "",
    country: order.shippingAddress?.country || "",
    note: order.shippingAddress?.note || "",
    assignedDeliveryUserId,
    invoiceNumber: order.invoice?.number || "",
    invoiceIssueDate: order.invoice?.issueDate ? String(order.invoice.issueDate).slice(0, 10) : "",
    invoiceDueDate: order.invoice?.dueDate ? String(order.invoice.dueDate).slice(0, 10) : "",
    invoiceTaxRatePercent: String(Number(order.invoice?.taxRatePercent || 0)),
    invoiceStatus: order.invoice?.status || "draft",
    invoiceNotes: order.invoice?.notes || "",
    statusNote: "",
    trackingNote: order.tracking?.note || "",
    etaMinutesMin: order.tracking?.etaMinutesMin != null ? String(order.tracking.etaMinutesMin) : "",
    etaMinutesMax: order.tracking?.etaMinutesMax != null ? String(order.tracking.etaMinutesMax) : "",
    courierName: order.tracking?.courierName || "",
    trackingId: order.tracking?.trackingId || "",
    trackingUrl: order.tracking?.trackingUrl || "",
  };
}

export default function AdminOrderDetailScreen({ navigation, route }) {
  const orderId = String(route?.params?.orderId || "");
  const { token, user } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const styles = useMemo(() => createStyles(c, shadowPremium), [c, shadowPremium]);

  const [order, setOrder] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setError("Missing order id.");
      setLoading(false);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const [fetched, users] = await Promise.all([
        fetchAdminOrder(token, orderId),
        fetchAdminUsers(token).catch(() => []),
      ]);
      setOrder(fetched);
      setEditForm(buildEditForm(fetched));
      setDeliveryPartners((users || []).filter((u) => u.isDeliveryPartner));
    } catch (err) {
      setError(err.message || "Failed to load order.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [token, orderId]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadOrder();
  }, [user?.isAdmin, loadOrder]);

  const { on: onLiveEvent } = useLiveSocket();
  useEffect(() => {
    if (!user?.isAdmin || !orderId) return undefined;
    return onLiveEvent("orders:updated", ({ order: liveOrder }) => {
      if (!liveOrder?._id || String(liveOrder._id) !== orderId) return;
      setOrder((prev) => ({ ...prev, ...liveOrder }));
    });
  }, [user?.isAdmin, orderId, onLiveEvent]);

  const updateField = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleStatus = async (id, status) => {
    try {
      setBusy(true);
      setError("");
      setSuccess("");
      await updateOrderStatus(token, id, status, editForm?.statusNote);
      setSuccess(`Status updated to "${status.replace(/_/g, " ")}".`);
      await loadOrder();
    } catch (err) {
      setError(err.message || "Unable to update status.");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!order || !editForm) return;
    try {
      setBusy(true);
      setError("");
      setSuccess("");
      await updateAdminOrderDetails(token, order._id, {
        paymentMethod: editForm.paymentMethod,
        assignedDeliveryUser: editForm.assignedDeliveryUserId || null,
        shippingAddress: {
          fullName: editForm.fullName,
          phone: editForm.phone,
          line1: editForm.line1,
          city: editForm.city,
          state: editForm.state,
          postalCode: editForm.postalCode,
          country: editForm.country,
          note: editForm.note,
        },
        invoice: {
          number: editForm.invoiceNumber,
          issueDate: editForm.invoiceIssueDate || null,
          dueDate: editForm.invoiceDueDate || null,
          taxRatePercent: Number(editForm.invoiceTaxRatePercent || 0),
          status: editForm.invoiceStatus,
          notes: editForm.invoiceNotes,
        },
        tracking: {
          note: editForm.trackingNote,
          etaMinutesMin: editForm.etaMinutesMin,
          etaMinutesMax: editForm.etaMinutesMax,
          courierName: editForm.courierName,
          trackingId: editForm.trackingId,
          trackingUrl: editForm.trackingUrl,
        },
      });
      setSuccess("Order details saved.");
      await loadOrder();
    } catch (err) {
      setError(err.message || "Unable to save order details.");
    } finally {
      setBusy(false);
    }
  };

  const handleAssignDelivery = async (deliveryUserId) => {
    if (!order) return;
    const nextId = deliveryUserId ? String(deliveryUserId) : "";
    updateField("assignedDeliveryUserId", nextId);
    try {
      setBusy(true);
      setError("");
      setSuccess("");
      await updateAdminOrderDetails(token, order._id, {
        assignedDeliveryUser: nextId || null,
      });
      setSuccess(
        nextId
          ? "Delivery partner assigned — they must accept the run (or pick another to reassign)."
          : "Delivery partner unassigned."
      );
      await loadOrder();
    } catch (err) {
      setError(err.message || "Unable to assign delivery partner.");
    } finally {
      setBusy(false);
    }
  };

  const handleCancelOrder = () => {
    if (!order) return;
    Alert.alert("Cancel order", "Customer will see this order as cancelled.", [
      { text: "Keep open", style: "cancel" },
      {
        text: "Cancel order",
        style: "destructive",
        onPress: () => handleStatus(order._id, "cancelled"),
      },
    ]);
  };

  const handleDelete = () => {
    if (!order) return;
    Alert.alert("Delete order", "This permanently removes the order.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setBusy(true);
            setError("");
            await deleteAdminOrder(token, order._id);
            navigation.replace("AdminOrders");
          } catch (err) {
            setError(err.message || "Unable to delete order.");
            setBusy(false);
          }
        },
      },
    ]);
  };

  const orderRef = order ? formatOrderPublicRef(order) || `#${String(order._id).slice(-6).toUpperCase()}` : "Order";
  const customerName = order?.user?.name || order?.shippingAddress?.fullName || "Guest";
  const placedAt = order?.createdAt
    ? new Date(order.createdAt).toLocaleString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <AdminScreenShell style={styles.screen}>
      <KeyboardAvoidingView style={customerScrollFill} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <KankregScrollPage
          scrollVariant="admin"
          showFooter={false}
          style={customerScrollFill}
          keyboardShouldPersistTaps="handled"
        >
          <KankregAdminShell
            navigation={navigation}
            route={route}
            title={orderRef}
            subtitle={order ? `${customerName} · ${getOrderItemQty(order)} items` : "Loading order…"}
          >
            <View style={styles.panel}>
              <AdminBackLink navigation={navigation} label="All orders" target="AdminOrders" style={styles.backLink} />

              <AdminAlerts
                error={error}
                success={success}
                onCloseError={() => setError("")}
                onCloseSuccess={() => setSuccess("")}
              />

              {loading ? (
                <PremiumLoader caption="Loading order…" />
              ) : !order ? (
                <PremiumErrorBanner
                  severity="error"
                  title="Order not found"
                  message={error || "This order may have been deleted."}
                />
              ) : (
                <>
                  <SectionReveal preset="fade-up">
                    <AdminPanel
                      title={orderRef}
                      icon="receipt-outline"
                      meta={formatINR(Number(order.totalPrice || 0))}
                      description={`${customerName}${order.user?.email ? ` · ${order.user.email}` : ""}${placedAt ? ` · ${placedAt}` : ""}`}
                    >
                      <View style={styles.heroBadges}>
                        <AdminOrderStatusBadge status={order.status} c={c} compact />
                        <AdminPaymentStatusChip paymentStatus={order.paymentStatus} c={c} />
                      </View>
                      <View style={styles.heroActions}>
                        {ORDER_ADMIN_NEXT_STATUS[order.status] ? (
                          <PremiumButton
                            label={`Advance · ${getAdminNextStatusLabel(order.status)}`}
                            iconLeft="play-forward-outline"
                            variant="primary"
                            size="sm"
                            loading={busy}
                            disabled={busy}
                            onPress={() => handleStatus(order._id, ORDER_ADMIN_NEXT_STATUS[order.status])}
                          />
                        ) : null}
                        {order.status !== "cancelled" && order.status !== "delivered" ? (
                          <PremiumButton
                            label="Cancel order"
                            iconLeft="close-circle-outline"
                            variant="danger"
                            size="sm"
                            disabled={busy}
                            onPress={handleCancelOrder}
                          />
                        ) : null}
                        <PremiumButton
                          label="Refresh"
                          iconLeft="refresh-outline"
                          variant="ghost"
                          size="sm"
                          onPress={loadOrder}
                          disabled={busy}
                        />
                      </View>
                    </AdminPanel>
                  </SectionReveal>

                  {editForm ? (
                    <AdminOrderManagePanel
                      order={order}
                      editForm={editForm}
                      deliveryPartners={deliveryPartners}
                      busy={busy}
                      onUpdateField={updateField}
                      onSaveDetails={handleSaveDetails}
                      onAssignDelivery={handleAssignDelivery}
                      onStatus={handleStatus}
                      onCancelOrder={handleCancelOrder}
                      onDelete={handleDelete}
                    />
                  ) : null}
                </>
              )}
            </View>
          </KankregAdminShell>
        </KankregScrollPage>
      </KeyboardAvoidingView>
    </AdminScreenShell>
  );
}

function createStyles(c, shadowPremium) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      width: "100%",
      alignSelf: "center",
      maxWidth: "100%",
    },
    panel: adminShellContent(),
    backLink: { marginBottom: spacing.sm },
    heroCard: {
      marginBottom: spacing.sm,
      ...shadowPremium,
    },
    heroTop: {
      flexDirection: Platform.select({ web: "row", default: "column" }),
      alignItems: Platform.select({ web: "flex-start", default: "stretch" }),
      justifyContent: "space-between",
      gap: spacing.md,
    },
    heroMain: { flex: 1, minWidth: 0 },
    heroAside: {
      alignItems: Platform.select({ web: "flex-end", default: "flex-start" }),
      gap: spacing.sm,
    },
    heroKicker: {
      fontSize: 10,
      fontFamily: fonts.bold,
      letterSpacing: 1.4,
    },
    heroRef: {
      fontFamily: FONT_HEADING,
      fontSize: typography.h2,
      letterSpacing: -0.3,
      marginTop: 4,
    },
    heroCustomer: {
      marginTop: 6,
      fontSize: typography.bodySmall,
      fontFamily: fonts.medium,
    },
    heroDate: {
      marginTop: 4,
      fontSize: typography.caption,
      fontFamily: fonts.regular,
    },
    heroAmount: {
      fontFamily: FONT_PRICE,
      fontSize: typography.h1,
      letterSpacing: -0.5,
    },
    heroBadges: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
      justifyContent: "flex-start",
    },
    heroActions: {
      marginTop: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
      alignItems: "center",
    },
  });
}
