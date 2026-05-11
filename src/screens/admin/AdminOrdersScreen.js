import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing as ReanimatedEasing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import MotionScrollView from "../../components/motion/MotionScrollView";
import SectionReveal from "../../components/motion/SectionReveal";
import useReducedMotion from "../../hooks/useReducedMotion";
import AppFooter from "../../components/AppFooter";
import CustomerScreenShell from "../../components/CustomerScreenShell";
import AdminBackLink from "../../components/admin/AdminBackLink";
import AdminPageHeading from "../../components/admin/AdminPageHeading";
import { useAuth } from "../../context/AuthContext";
import {
  deleteAdminOrder,
  fetchAdminOrders,
  fetchAdminUsers,
  updateAdminOrderDetails,
  updateOrderStatus,
} from "../../services/adminService";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { adminPanel } from "../../theme/adminLayout";
import { adminInnerPageScrollContent, customerScrollFill } from "../../theme/screenLayout";
import { layout, radius, spacing } from "../../theme/tokens";
import { formatINR } from "../../utils/currency";
import {
  ALL_ORDER_STATUSES,
  ORDER_ADMIN_NEXT_STATUS,
  getOrderStatusLabel,
  getAdminNextStatusLabel,
} from "../../utils/orderStatus";
import PremiumInput from "../../components/ui/PremiumInput";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumCard from "../../components/ui/PremiumCard";
import PremiumChip from "../../components/ui/PremiumChip";

const STATUSES = ["all", ...ALL_ORDER_STATUSES];

function AdminPaymentStatusChip({ paymentStatus, c, styles }) {
  const ps = String(paymentStatus || "pending").toLowerCase();
  const label =
    ps === "paid"
      ? "Paid"
      : ps === "pending"
        ? "Payment pending"
        : ps === "failed"
          ? "Payment failed"
          : ps === "refunded"
            ? "Refunded"
            : String(paymentStatus || "—");
  const bg =
    ps === "paid"
      ? c.secondarySoft
      : ps === "failed"
        ? "rgba(220, 38, 38, 0.08)"
        : ps === "refunded"
          ? c.surfaceMuted
          : c.primarySoft;
  const border =
    ps === "paid" ? c.secondaryBorder : ps === "failed" ? c.danger : ps === "refunded" ? c.border : c.primaryBorder;
  const textColor =
    ps === "paid" ? c.secondaryDark : ps === "failed" ? c.danger : ps === "refunded" ? c.textMuted : c.primaryDark;
  return (
    <View style={[styles.paymentStatusBadge, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.paymentStatusBadgeText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

function AdminOrderStatusBadge({ status, c, styles, reducedMotion }) {
  const s = String(status || "");
  let target = 1;
  if (s === "cancelled") target = 0;
  else if (s === "delivered") target = 3;
  else if (["shipped", "out_for_delivery", "ready_for_pickup"].includes(s)) target = 2;
  else if (["pending", "pending_payment", "confirmed", "preparing", "paid"].includes(s)) target = 1;
  const anim = useSharedValue(reducedMotion ? target : 0);
  useEffect(() => {
    if (reducedMotion) {
      anim.value = target;
      return;
    }
    anim.value = withTiming(target, {
      duration: 360,
      easing: ReanimatedEasing.bezier(0.22, 1, 0.36, 1),
    });
  }, [target, reducedMotion, anim]);
  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      anim.value,
      [0, 1, 2, 3],
      [c.surfaceMuted, c.primarySoft, c.secondarySoft, c.secondarySoft],
    ),
    borderColor: interpolateColor(
      anim.value,
      [0, 1, 2, 3],
      [c.danger, c.primaryBorder, c.secondaryBorder, c.secondaryBorder],
    ),
  }));
  return (
    <Animated.View style={[styles.statusBadge, pillStyle]}>
      <Text style={styles.statusBadgeText}>{getOrderStatusLabel(s)}</Text>
    </Animated.View>
  );
}

export default function AdminOrdersScreen({ navigation, route }) {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState(route?.params?.query || "");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState("");
  const [busyOrderId, setBusyOrderId] = useState("");
  const [editFormsByOrder, setEditFormsByOrder] = useState({});
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [renderCount, setRenderCount] = useState(30);

  const { colors: c, shadowPremium } = useTheme();
  const styles = useMemo(() => createAdminOrdersStyles(c, shadowPremium), [c, shadowPremium]);
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const loadOrders = useCallback(async () => {
    try {
      setError("");
      const [response, users] = await Promise.all([
        fetchAdminOrders(token),
        fetchAdminUsers(token).catch(() => []),
      ]);
      setOrders(response);
      setDeliveryPartners((users || []).filter((u) => u.isDeliveryPartner));
    } catch (err) {
      setError(err.message || "Failed to load orders.");
    }
  }, [token]);

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!user.isAdmin) return;
    loadOrders();
  }, [user, loadOrders]);

  useEffect(() => {
    const incomingQuery = String(route?.params?.query || "").trim();
    if (!incomingQuery) return;
    setSearch(incomingQuery);
    setStatusFilter("all");
  }, [route?.params?.query]);

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const statusOk = statusFilter === "all" ? true : order.status === statusFilter;
      if (!statusOk) return false;

      if (!query) return true;

      const idPart = order._id.toLowerCase();
      const name = String(order.user?.name || "").toLowerCase();
      const email = String(order.user?.email || "").toLowerCase();
      return idPart.includes(query) || name.includes(query) || email.includes(query);
    });
  }, [orders, search, statusFilter]);
  const renderedOrders = useMemo(
    () => visibleOrders.slice(0, renderCount),
    [visibleOrders, renderCount]
  );

  useEffect(() => {
    setRenderCount(30);
  }, [search, statusFilter]);

  const stats = useMemo(() => {
    const total = orders.length;
    const newOrders = orders.filter((order) => order.status === "pending").length;
    const inKitchen = orders.filter((order) =>
      ["confirmed", "preparing", "paid"].includes(order.status)
    ).length;
    const outForDelivery = orders.filter((order) =>
      ["ready_for_pickup", "shipped", "out_for_delivery"].includes(order.status)
    ).length;
    const delivered = orders.filter((order) => order.status === "delivered").length;
    return { total, newOrders, inKitchen, outForDelivery, delivered };
  }, [orders]);

  if (user && !user.isAdmin) {
    return (
      <CustomerScreenShell style={styles.screen} variant="admin">
        <MotionScrollView
          style={customerScrollFill}
          contentContainerStyle={adminInnerPageScrollContent(insets)}
          showsVerticalScrollIndicator={false}
        >
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.panel}>
              <PremiumErrorBanner
                severity="warning"
                title="Admin access required"
                message="This account does not have admin privileges."
              />
              <PremiumButton
                label="Back to home"
                iconLeft="home-outline"
                variant="primary"
                size="md"
                onPress={() => navigation.navigate("Home")}
                style={styles.gateCta}
              />
            </View>
          </SectionReveal>
        </MotionScrollView>
      </CustomerScreenShell>
    );
  }

  const handleStatus = async (orderId, status) => {
    try {
      setBusyOrderId(orderId);
      setError("");
      setSuccess("");
      await updateOrderStatus(token, orderId, status);
      setSuccess(`Order moved to "${status}".`);
      await loadOrders();
    } catch (err) {
      setError(err.message || "Unable to update status.");
    } finally {
      setBusyOrderId("");
    }
  };

  const handleDelete = async (orderId) => {
    Alert.alert("Delete Order", "This action will remove the order permanently.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setBusyOrderId(orderId);
            setError("");
            setSuccess("");
            await deleteAdminOrder(token, orderId);
            setSuccess("Order deleted successfully.");
            await loadOrders();
          } catch (err) {
            setError(err.message || "Unable to delete order.");
          } finally {
            setBusyOrderId("");
          }
        },
      },
    ]);
  };

  const getOrderEditForm = (order) => {
    if (editFormsByOrder[order._id]) return editFormsByOrder[order._id];
    const aid = order.assignedDeliveryUser;
    const assignedDeliveryUserId =
      aid && typeof aid === "object" && aid._id
        ? String(aid._id)
        : aid
          ? String(aid)
          : "";
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
    };
  };

  const updateOrderFormField = (orderId, field, value, order) => {
    setEditFormsByOrder((current) => {
      const existing = current[orderId] || getOrderEditForm(order);
      return {
        ...current,
        [orderId]: {
          ...existing,
          [field]: value,
        },
      };
    });
  };

  const handleSaveOrderDetails = async (order) => {
    try {
      const form = getOrderEditForm(order);
      setBusyOrderId(order._id);
      setError("");
      setSuccess("");
      await updateAdminOrderDetails(token, order._id, {
        paymentMethod: form.paymentMethod,
        assignedDeliveryUser: form.assignedDeliveryUserId || null,
        shippingAddress: {
          fullName: form.fullName,
          phone: form.phone,
          line1: form.line1,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: form.country,
          note: form.note,
        },
        invoice: {
          number: form.invoiceNumber,
          issueDate: form.invoiceIssueDate || null,
          dueDate: form.invoiceDueDate || null,
          taxRatePercent: Number(form.invoiceTaxRatePercent || 0),
          status: form.invoiceStatus,
          notes: form.invoiceNotes,
        },
      });
      setSuccess("Order details updated successfully.");
      await loadOrders();
    } catch (err) {
      setError(err.message || "Unable to update order details.");
    } finally {
      setBusyOrderId("");
    }
  };

  const handleAssignDeliveryPartner = async (order, deliveryUserId) => {
    try {
      const nextId = deliveryUserId ? String(deliveryUserId) : "";
      updateOrderFormField(order._id, "assignedDeliveryUserId", nextId, order);
      setBusyOrderId(order._id);
      setError("");
      setSuccess("");
      await updateAdminOrderDetails(token, order._id, {
        assignedDeliveryUser: nextId || null,
      });
      setSuccess(nextId ? "Delivery partner assigned." : "Delivery partner unassigned.");
      await loadOrders();
    } catch (err) {
      setError(err.message || "Unable to assign delivery partner.");
    } finally {
      setBusyOrderId("");
    }
  };

  function MetricCard({ label, value }) {
    return (
      <View style={styles.metricCard}>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
    );
  }

  function SectionTitle({ icon, label }) {
    return (
      <View style={styles.sectionTitleRow}>
        <Ionicons name={icon} size={14} color={c.primary} />
        <Text style={styles.sectionTitleText}>{label}</Text>
      </View>
    );
  }

  return (
    <CustomerScreenShell style={styles.screen} variant="admin">
      <KeyboardAvoidingView style={customerScrollFill} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <MotionScrollView
        style={customerScrollFill}
        contentContainerStyle={adminInnerPageScrollContent(insets)}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.panel}>
          <SectionReveal preset="fade-up" delay={0}>
          <AdminBackLink navigation={navigation} />
          <AdminPageHeading
            title="Manage orders"
            subtitle="Track statuses, assign delivery, and move orders forward."
          />
          {error ? (
            <View style={styles.bannerSpacer}>
              <PremiumErrorBanner severity="error" message={error} onClose={() => setError("")} compact />
            </View>
          ) : null}
          {success ? (
            <View style={styles.bannerSpacer}>
              <PremiumErrorBanner severity="success" message={success} onClose={() => setSuccess("")} compact />
            </View>
          ) : null}

          <View style={styles.statsGrid}>
            <MetricCard label="Total" value={stats.total} />
            <MetricCard label="New" value={stats.newOrders} />
            <MetricCard label="In kitchen" value={stats.inKitchen} />
            <MetricCard label="Out / pickup" value={stats.outForDelivery} />
            <MetricCard label="Delivered" value={stats.delivered} />
          </View>

          <View style={styles.actionsRow}>
            <View style={styles.searchInputWrap}>
              <PremiumInput
                label="Search orders"
                value={search}
                onChangeText={setSearch}
                placeholder="Order id, name, or email"
                iconLeft="search-outline"
                iconRight={search ? "close-circle" : undefined}
                onIconRightPress={search ? () => setSearch("") : undefined}
                autoCapitalize="none"
              />
            </View>
            <PremiumButton
              label="Refresh"
              iconLeft="refresh-outline"
              variant="secondary"
              size="sm"
              onPress={loadOrders}
              style={styles.refreshBtn}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
          >
            {STATUSES.map((status) => (
              <PremiumChip
                key={status}
                label={status === "all" ? "All" : getOrderStatusLabel(status)}
                tone="gold"
                size="sm"
                selected={statusFilter === status}
                onPress={() => setStatusFilter(status)}
              />
            ))}
          </ScrollView>
          </SectionReveal>

          <SectionReveal preset="fade-up" delay={60}>
          <View style={styles.listContent}>
            {renderedOrders.map((item) => {
              const accentBorder =
                item.status === "delivered"
                  ? c.secondary
                  : item.status === "cancelled"
                    ? c.danger
                    : ["shipped", "out_for_delivery"].includes(item.status)
                      ? c.primary
                      : c.border;
              return (
              <PremiumCard
                key={item._id}
                variant="muted"
                padding="md"
                goldAccent={["shipped", "out_for_delivery"].includes(item.status)}
                style={[styles.orderCardShell, { borderLeftWidth: 4, borderLeftColor: accentBorder }]}
              >
                <View style={styles.orderTopRow}>
                  <View style={styles.orderMain}>
                    <Text style={styles.cardTitle}>Order #{item._id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.cardMeta}>
                      {item.user?.name || "User"} • {item.user?.email || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.badgeCluster}>
                    <AdminOrderStatusBadge
                      status={item.status}
                      c={c}
                      styles={styles}
                      reducedMotion={reducedMotion}
                    />
                    <AdminPaymentStatusChip paymentStatus={item.paymentStatus} c={c} styles={styles} />
                  </View>
                </View>
                <Text style={styles.amountText}>{formatINR(Number(item.totalPrice || 0))}</Text>
                <Text style={styles.cardMeta}>
                  Qty: {(item.products || []).reduce((sum, p) => sum + Number(p.quantity || 0), 0)} •
                  Items: {(item.products || []).length}
                </Text>
                <Text style={styles.cardMeta}>
                  Placed: {item.createdAt ? new Date(item.createdAt).toLocaleString() : "N/A"}
                </Text>
                {item.assignedDeliveryUser?.name ? (
                  <Text style={styles.cardMeta}>
                    Delivery partner: {item.assignedDeliveryUser.name}
                    {item.assignedDeliveryUser.phone ? ` • ${item.assignedDeliveryUser.phone}` : ""}
                  </Text>
                ) : (
                  <Text style={styles.cardMeta}>Delivery partner: not assigned</Text>
                )}

                <View style={styles.quickActionsRow}>
                  {ORDER_ADMIN_NEXT_STATUS[item.status] ? (
                    <PremiumButton
                      label={
                        busyOrderId === item._id
                          ? "Updating…"
                          : `Next: ${getAdminNextStatusLabel(item.status)}`
                      }
                      iconLeft="arrow-forward-outline"
                      variant="primary"
                      size="sm"
                      loading={busyOrderId === item._id}
                      disabled={busyOrderId === item._id}
                      onPress={() => handleStatus(item._id, ORDER_ADMIN_NEXT_STATUS[item.status])}
                    />
                  ) : null}
                  <PremiumButton
                    label={expandedOrderId === item._id ? "Hide details" : "View full details"}
                    iconLeft={expandedOrderId === item._id ? "chevron-up-outline" : "chevron-down-outline"}
                    variant="ghost"
                    size="sm"
                    onPress={() =>
                      setExpandedOrderId((current) => (current === item._id ? "" : item._id))
                    }
                  />
                </View>

                {expandedOrderId === item._id ? (
                  <View style={styles.detailsWrap}>
                    <SectionTitle icon="cube-outline" label="Products" />
                    {(item.products || []).map((product, index) => (
                      <View key={`${item._id}-${index}`} style={styles.productRow}>
                        <Text style={styles.productName}>{product.name}</Text>
                        <Text style={styles.productMeta}>
                          {formatINR(Number(product.price || 0))} x {Number(product.quantity || 0)}
                        </Text>
                        {product.product?.inStock === false || Number(product.product?.stockQty || 0) <= 0 ? (
                          <Text style={styles.outOfStockNote}>Currently out of stock</Text>
                        ) : null}
                      </View>
                    ))}

                    <SectionTitle icon="wallet-outline" label="Payment Breakdown" />
                    <Text style={styles.cardMeta}>
                      Items Total: {formatINR(Number(item.priceBreakdown?.itemsTotal || 0))}
                    </Text>
                    <Text style={styles.cardMeta}>
                      Delivery Fee: {formatINR(Number(item.priceBreakdown?.deliveryFee || 0))}
                    </Text>
                    <Text style={styles.cardMeta}>
                      Platform Fee: {formatINR(Number(item.priceBreakdown?.platformFee || 0))}
                    </Text>
                    <Text style={styles.cardMeta}>
                      Discount: -{formatINR(Number(item.priceBreakdown?.discountAmount || 0))}
                    </Text>
                    {item.coupon?.code ? (
                      <Text style={styles.cardMeta}>
                        Coupon: {item.coupon.code} (-{formatINR(Number(item.coupon.discountAmount || 0))})
                      </Text>
                    ) : null}

                    <SectionTitle icon="location-outline" label="Shipping Address" />
                    <Text style={styles.cardMeta}>
                      {item.shippingAddress?.fullName || "N/A"} • {item.shippingAddress?.phone || "N/A"}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {item.shippingAddress?.line1 || "N/A"}, {item.shippingAddress?.city || ""},{" "}
                      {item.shippingAddress?.state || ""}, {item.shippingAddress?.postalCode || ""}
                    </Text>
                    <Text style={styles.cardMeta}>{item.shippingAddress?.country || "N/A"}</Text>

                    <Text style={styles.cardMeta}>Payment Method: {item.paymentMethod || "N/A"}</Text>
                    {item.razorpay?.orderId ? (
                      <Text style={styles.cardMeta}>Razorpay order ID: {item.razorpay.orderId}</Text>
                    ) : null}
                    {item.razorpay?.paymentId ? (
                      <Text style={styles.cardMeta}>Razorpay payment ID: {item.razorpay.paymentId}</Text>
                    ) : null}

                    <SectionTitle icon="bicycle-outline" label="Assign delivery partner" />
                    <Text style={styles.cardMeta}>
                      {item.assignedDeliveryUser?.name
                        ? `Current: ${item.assignedDeliveryUser.name}`
                        : "No one assigned — pick a partner and save order details."}
                    </Text>
                    {deliveryPartners.length === 0 ? (
                      <Text style={styles.cardMeta}>
                        No delivery partners yet. Enable delivery on a user in Manage Users.
                      </Text>
                    ) : (
                      <View style={styles.assigneeChips}>
                        <PremiumChip
                          label="Unassign"
                          tone="neutral"
                          size="sm"
                          selected={!getOrderEditForm(item).assignedDeliveryUserId}
                          onPress={() => handleAssignDeliveryPartner(item, "")}
                        />
                        {deliveryPartners.map((dp) => {
                          const sel = getOrderEditForm(item).assignedDeliveryUserId === String(dp._id);
                          return (
                            <PremiumChip
                              key={dp._id}
                              label={dp.name}
                              tone="gold"
                              size="sm"
                              selected={sel}
                              style={styles.assigneeChipMax}
                              onPress={() => handleAssignDeliveryPartner(item, String(dp._id))}
                            />
                          );
                        })}
                      </View>
                    )}

                    <SectionTitle icon="create-outline" label="Edit Order Details (Admin)" />
                    <View style={styles.orderFieldGap}>
                      <PremiumInput
                        label="Payment method"
                        value={getOrderEditForm(item).paymentMethod}
                        onChangeText={(value) =>
                          updateOrderFormField(item._id, "paymentMethod", value, item)
                        }
                        iconLeft="card-outline"
                      />
                    </View>
                    <View style={styles.orderFieldGap}>
                      <PremiumInput
                        label="Full name"
                        value={getOrderEditForm(item).fullName}
                        onChangeText={(value) => updateOrderFormField(item._id, "fullName", value, item)}
                        iconLeft="person-outline"
                      />
                    </View>
                    <View style={styles.orderFieldGap}>
                      <PremiumInput
                        label="Phone"
                        value={getOrderEditForm(item).phone}
                        onChangeText={(value) => updateOrderFormField(item._id, "phone", value, item)}
                        keyboardType="phone-pad"
                        iconLeft="call-outline"
                      />
                    </View>
                    <View style={styles.orderFieldGap}>
                      <PremiumInput
                        label="Address line"
                        value={getOrderEditForm(item).line1}
                        onChangeText={(value) => updateOrderFormField(item._id, "line1", value, item)}
                        iconLeft="home-outline"
                      />
                    </View>
                    <View style={styles.editSplitRow}>
                      <View style={[styles.orderFieldGap, styles.orderHalfField]}>
                        <PremiumInput
                          label="City"
                          value={getOrderEditForm(item).city}
                          onChangeText={(value) => updateOrderFormField(item._id, "city", value, item)}
                        />
                      </View>
                      <View style={[styles.orderFieldGap, styles.orderHalfField]}>
                        <PremiumInput
                          label="State"
                          value={getOrderEditForm(item).state}
                          onChangeText={(value) => updateOrderFormField(item._id, "state", value, item)}
                        />
                      </View>
                    </View>
                    <View style={styles.editSplitRow}>
                      <View style={[styles.orderFieldGap, styles.orderHalfField]}>
                        <PremiumInput
                          label="Postal code"
                          value={getOrderEditForm(item).postalCode}
                          onChangeText={(value) =>
                            updateOrderFormField(item._id, "postalCode", value, item)
                          }
                          keyboardType="number-pad"
                        />
                      </View>
                      <View style={[styles.orderFieldGap, styles.orderHalfField]}>
                        <PremiumInput
                          label="Country"
                          value={getOrderEditForm(item).country}
                          onChangeText={(value) => updateOrderFormField(item._id, "country", value, item)}
                        />
                      </View>
                    </View>
                    <View style={styles.orderFieldGap}>
                      <PremiumInput
                        label="Order note"
                        value={getOrderEditForm(item).note}
                        onChangeText={(value) => updateOrderFormField(item._id, "note", value, item)}
                        iconLeft="document-outline"
                      />
                    </View>
                    <SectionTitle icon="document-text-outline" label="Invoice (Admin update)" />
                    <View style={styles.orderFieldGap}>
                      <PremiumInput
                        label="Invoice number"
                        value={getOrderEditForm(item).invoiceNumber}
                        onChangeText={(value) => updateOrderFormField(item._id, "invoiceNumber", value, item)}
                        iconLeft="receipt-outline"
                      />
                    </View>
                    <View style={styles.editSplitRow}>
                      <View style={[styles.orderFieldGap, styles.orderHalfField]}>
                        <PremiumInput
                          label="Issue date (YYYY-MM-DD)"
                          value={getOrderEditForm(item).invoiceIssueDate}
                          onChangeText={(value) => updateOrderFormField(item._id, "invoiceIssueDate", value, item)}
                          autoCapitalize="none"
                        />
                      </View>
                      <View style={[styles.orderFieldGap, styles.orderHalfField]}>
                        <PremiumInput
                          label="Due date (YYYY-MM-DD)"
                          value={getOrderEditForm(item).invoiceDueDate}
                          onChangeText={(value) => updateOrderFormField(item._id, "invoiceDueDate", value, item)}
                          autoCapitalize="none"
                        />
                      </View>
                    </View>
                    <View style={styles.editSplitRow}>
                      <View style={[styles.orderFieldGap, styles.orderHalfField]}>
                        <PremiumInput
                          label="Tax %"
                          value={getOrderEditForm(item).invoiceTaxRatePercent}
                          onChangeText={(value) => updateOrderFormField(item._id, "invoiceTaxRatePercent", value, item)}
                          keyboardType="decimal-pad"
                        />
                      </View>
                      <View style={[styles.orderFieldGap, styles.orderHalfField]}>
                        <PremiumInput
                          label="Invoice status"
                          value={getOrderEditForm(item).invoiceStatus}
                          onChangeText={(value) => updateOrderFormField(item._id, "invoiceStatus", value, item)}
                          placeholder="draft / final / paid / void"
                          autoCapitalize="none"
                        />
                      </View>
                    </View>
                    <View style={styles.orderFieldGap}>
                      <PremiumInput
                        label="Invoice notes"
                        value={getOrderEditForm(item).invoiceNotes}
                        onChangeText={(value) => updateOrderFormField(item._id, "invoiceNotes", value, item)}
                        multiline
                        numberOfLines={2}
                      />
                    </View>
                    <PremiumButton
                      label={busyOrderId === item._id ? "Saving…" : "Save order details"}
                      iconLeft="save-outline"
                      variant="secondary"
                      size="sm"
                      loading={busyOrderId === item._id}
                      disabled={busyOrderId === item._id}
                      onPress={() => handleSaveOrderDetails(item)}
                      fullWidth
                      style={styles.saveEditBtn}
                    />

                    <Text style={styles.cardMeta}>Set status (any stage)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusButtonsWrap}>
                      {STATUSES.filter((status) => status !== "all").map((status) => (
                        <PremiumChip
                          key={status}
                          label={getOrderStatusLabel(status)}
                          tone="gold"
                          size="sm"
                          selected={item.status === status}
                          onPress={
                            busyOrderId === item._id ? undefined : () => handleStatus(item._id, status)
                          }
                        />
                      ))}
                    </ScrollView>
                  </View>
                ) : null}

                <View style={styles.actionsWrap}>
                  <PremiumButton
                    label={busyOrderId === item._id ? "Deleting…" : "Delete order"}
                    iconLeft="trash-outline"
                    variant="danger"
                    size="sm"
                    loading={busyOrderId === item._id}
                    disabled={busyOrderId === item._id}
                    onPress={() => handleDelete(item._id)}
                  />
                </View>
              </PremiumCard>
            );
            })}
            {renderedOrders.length < visibleOrders.length ? (
              <PremiumButton
                label={`Load more (${visibleOrders.length - renderedOrders.length} remaining)`}
                variant="ghost"
                size="sm"
                onPress={() => setRenderCount((prev) => prev + 30)}
                style={styles.loadMoreBtn}
              />
            ) : null}
            {visibleOrders.length === 0 ? (
              <PremiumEmptyState
                iconName="receipt-outline"
                title="No orders match this filter"
                description="Try another status chip or clear your search."
                compact
              />
            ) : null}
          </View>
          </SectionReveal>
        </View>
        <AppFooter />
      </MotionScrollView>
      </KeyboardAvoidingView>
    </CustomerScreenShell>
  );
}

function createAdminOrdersStyles(c, shadowPremium) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    maxWidth: Platform.select({ web: layout.maxContentWidth + 72, default: "100%" }),
  },
  panel: {
    ...adminPanel(c, shadowPremium),
  },
  gateCta: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
  },
  orderCardShell: {
    width: "100%",
  },
  bannerSpacer: {
    marginBottom: spacing.sm,
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
    flexWrap: "wrap",
  },
  metricCard: {
    flex: 1,
    minWidth: 90,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    backgroundColor: c.surfaceMuted,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  metricValue: {
    color: c.primary,
    fontSize: 18,
    fontWeight: "800",
  },
  metricLabel: {
    color: c.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchInputWrap: {
    flex: 1,
    minWidth: 0,
  },
  refreshBtn: {
    alignSelf: "flex-end",
  },
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
    paddingRight: spacing.md,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  orderTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  orderMain: {
    flex: 1,
  },
  badgeCluster: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    maxWidth: "100%",
  },
  cardTitle: {
    color: c.textPrimary,
    fontWeight: "700",
  },
  amountText: {
    marginTop: spacing.xs,
    color: c.textPrimary,
    fontSize: 18,
    fontWeight: "800",
  },
  statusBadge: {
    borderWidth: 1,
    borderColor: c.primaryBorder,
    borderRadius: radius.pill,
    backgroundColor: c.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusDelivered: {
    borderColor: c.secondaryBorder,
    backgroundColor: c.secondarySoft,
  },
  statusCancelled: {
    borderColor: c.danger,
    backgroundColor: c.surfaceMuted,
  },
  statusShipped: {
    borderColor: c.secondaryBorder,
    backgroundColor: c.secondarySoft,
  },
  statusEarly: {
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft,
  },
  statusBadgeText: {
    color: c.textPrimary,
    fontSize: 10,
    fontWeight: "700",
  },
  paymentStatusBadge: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  paymentStatusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  cardMeta: {
    marginTop: 4,
    color: c.textSecondary,
    fontSize: 12,
  },
  quickActionsRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  orderFieldGap: {
    marginBottom: spacing.sm,
  },
  orderHalfField: {
    flex: 1,
    minWidth: 0,
  },
  editSplitRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  saveEditBtn: {
    marginTop: spacing.sm,
  },
  detailsWrap: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: c.border,
    gap: spacing.xs,
  },
  sectionTitleRow: {
    marginTop: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitleText: {
    color: c.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  productRow: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    backgroundColor: c.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  productName: {
    color: c.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  productMeta: {
    marginTop: 2,
    color: c.textSecondary,
    fontSize: 11,
  },
  outOfStockNote: {
    marginTop: 2,
    color: c.danger,
    fontSize: 10,
    fontWeight: "700",
  },
  statusButtonsWrap: {
    marginTop: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  actionsWrap: {
    marginTop: spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  loadMoreBtn: {
    marginTop: spacing.sm,
    alignSelf: "center",
  },
  assigneeChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  assigneeChipMax: {
    maxWidth: 160,
  },
  });
}
