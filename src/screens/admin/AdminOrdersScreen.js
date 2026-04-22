import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppFooter from "../../components/AppFooter";
import CustomerScreenShell from "../../components/CustomerScreenShell";
import AdminBackLink from "../../components/admin/AdminBackLink";
import { useAuth } from "../../context/AuthContext";
import {
  deleteAdminOrder,
  fetchAdminOrders,
  updateAdminOrderDetails,
  updateOrderStatus,
} from "../../services/adminService";
import { useTheme } from "../../context/ThemeContext";
import { adminPanel } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, layout, radius, spacing, typography } from "../../theme/tokens";
import { formatINR } from "../../utils/currency";

const STATUSES = ["all", "pending", "paid", "shipped", "delivered", "cancelled"];
const NEXT_STATUS = {
  pending: "paid",
  paid: "shipped",
  shipped: "delivered",
};

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

  const { colors: c, shadowPremium } = useTheme();
  const styles = useMemo(() => createAdminOrdersStyles(c, shadowPremium), [c, shadowPremium]);

  async function loadOrders() {
    try {
      setError("");
      const response = await fetchAdminOrders(token);
      setOrders(response);
    } catch (err) {
      setError(err.message || "Failed to load orders.");
    }
  }

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!user.isAdmin) return;
    loadOrders();
  }, [user?.isAdmin]);

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

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((order) => order.status === "pending").length;
    const inTransit = orders.filter((order) => order.status === "shipped").length;
    const delivered = orders.filter((order) => order.status === "delivered").length;
    return { total, pending, inTransit, delivered };
  }, [orders]);

  if (user && !user.isAdmin) {
    return (
      <CustomerScreenShell style={styles.screen}>
        <ScrollView style={customerScrollFill} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.panel}>
            <Text style={styles.title}>Admin Access Required</Text>
            <Text style={styles.subtitle}>This account does not have admin privileges.</Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={() => navigation.navigate("Home")}>
              <Text style={styles.refreshBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
      });
      setSuccess("Order details updated successfully.");
      await loadOrders();
    } catch (err) {
      setError(err.message || "Unable to update order details.");
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

  function StatusBadge({ status }) {
    const isDelivered = status === "delivered";
    const isCancelled = status === "cancelled";
    const isShipped = status === "shipped";
    return (
      <View
        style={[
          styles.statusBadge,
          isDelivered ? styles.statusDelivered : null,
          isCancelled ? styles.statusCancelled : null,
          isShipped ? styles.statusShipped : null,
        ]}
      >
        <Text style={styles.statusBadgeText}>{status}</Text>
      </View>
    );
  }

  return (
    <CustomerScreenShell style={styles.screen}>
      <ScrollView style={customerScrollFill} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.panel}>
          <AdminBackLink navigation={navigation} />
          <Text style={styles.title}>Manage Orders</Text>
          <Text style={styles.subtitle}>Clear order timeline, full detail view, and quick action controls.</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}

          <View style={styles.statsGrid}>
            <MetricCard label="Total" value={stats.total} />
            <MetricCard label="Pending" value={stats.pending} />
            <MetricCard label="Shipped" value={stats.inTransit} />
            <MetricCard label="Delivered" value={stats.delivered} />
          </View>

          <View style={styles.actionsRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by order id / user..."
              placeholderTextColor={c.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            <TouchableOpacity style={styles.refreshBtn} onPress={loadOrders}>
              <Text style={styles.refreshBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filtersRow}>
            {STATUSES.map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.filterPill, statusFilter === status ? styles.filterPillActive : null]}
                onPress={() => setStatusFilter(status)}
              >
                <Text
                  style={[styles.filterText, statusFilter === status ? styles.filterTextActive : null]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.listContent}>
            {visibleOrders.map((item) => (
              <View key={item._id} style={styles.card}>
                <View style={styles.orderTopRow}>
                  <View style={styles.orderMain}>
                    <Text style={styles.cardTitle}>Order #{item._id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.cardMeta}>
                      {item.user?.name || "User"} • {item.user?.email || "N/A"}
                    </Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>
                <Text style={styles.amountText}>{formatINR(Number(item.totalPrice || 0))}</Text>
                <Text style={styles.cardMeta}>
                  Qty: {(item.products || []).reduce((sum, p) => sum + Number(p.quantity || 0), 0)} •
                  Items: {(item.products || []).length}
                </Text>
                <Text style={styles.cardMeta}>
                  Placed: {item.createdAt ? new Date(item.createdAt).toLocaleString() : "N/A"}
                </Text>

                <View style={styles.quickActionsRow}>
                  {NEXT_STATUS[item.status] ? (
                    <TouchableOpacity
                      style={styles.primaryActionBtn}
                      onPress={() => handleStatus(item._id, NEXT_STATUS[item.status])}
                      disabled={busyOrderId === item._id}
                    >
                      <Ionicons name="arrow-forward-outline" size={14} color={c.onPrimary} />
                      <Text style={styles.primaryActionText}>
                        {busyOrderId === item._id
                          ? "Updating..."
                          : `Move to ${NEXT_STATUS[item.status]}`}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    style={styles.secondaryActionBtn}
                    onPress={() =>
                      setExpandedOrderId((current) => (current === item._id ? "" : item._id))
                    }
                  >
                    <Ionicons
                      name={expandedOrderId === item._id ? "chevron-up" : "chevron-down"}
                      size={14}
                      color={c.textPrimary}
                    />
                    <Text style={styles.secondaryActionText}>
                      {expandedOrderId === item._id ? "Hide details" : "View full details"}
                    </Text>
                  </TouchableOpacity>
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

                    <SectionTitle icon="create-outline" label="Edit Order Details (Admin)" />
                    <TextInput
                      style={styles.editInput}
                      placeholder="Payment Method"
                      value={getOrderEditForm(item).paymentMethod}
                      onChangeText={(value) =>
                        updateOrderFormField(item._id, "paymentMethod", value, item)
                      }
                    />
                    <TextInput
                      style={styles.editInput}
                      placeholder="Full Name"
                      value={getOrderEditForm(item).fullName}
                      onChangeText={(value) => updateOrderFormField(item._id, "fullName", value, item)}
                    />
                    <TextInput
                      style={styles.editInput}
                      placeholder="Phone"
                      value={getOrderEditForm(item).phone}
                      onChangeText={(value) => updateOrderFormField(item._id, "phone", value, item)}
                    />
                    <TextInput
                      style={styles.editInput}
                      placeholder="Address Line"
                      value={getOrderEditForm(item).line1}
                      onChangeText={(value) => updateOrderFormField(item._id, "line1", value, item)}
                    />
                    <View style={styles.editSplitRow}>
                      <TextInput
                        style={[styles.editInput, styles.editHalfInput]}
                        placeholder="City"
                        value={getOrderEditForm(item).city}
                        onChangeText={(value) => updateOrderFormField(item._id, "city", value, item)}
                      />
                      <TextInput
                        style={[styles.editInput, styles.editHalfInput]}
                        placeholder="State"
                        value={getOrderEditForm(item).state}
                        onChangeText={(value) => updateOrderFormField(item._id, "state", value, item)}
                      />
                    </View>
                    <View style={styles.editSplitRow}>
                      <TextInput
                        style={[styles.editInput, styles.editHalfInput]}
                        placeholder="Postal Code"
                        value={getOrderEditForm(item).postalCode}
                        onChangeText={(value) =>
                          updateOrderFormField(item._id, "postalCode", value, item)
                        }
                      />
                      <TextInput
                        style={[styles.editInput, styles.editHalfInput]}
                        placeholder="Country"
                        value={getOrderEditForm(item).country}
                        onChangeText={(value) => updateOrderFormField(item._id, "country", value, item)}
                      />
                    </View>
                    <TextInput
                      style={styles.editInput}
                      placeholder="Order Note"
                      value={getOrderEditForm(item).note}
                      onChangeText={(value) => updateOrderFormField(item._id, "note", value, item)}
                    />
                    <TouchableOpacity
                      style={styles.saveEditBtn}
                      onPress={() => handleSaveOrderDetails(item)}
                      disabled={busyOrderId === item._id}
                    >
                      <Text style={styles.saveEditBtnText}>
                        {busyOrderId === item._id ? "Saving..." : "Save Order Details"}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.statusButtonsWrap}>
                      {STATUSES.filter((status) => status !== "all").map((status) => (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.smallBtn,
                            item.status === status ? styles.smallBtnActive : null,
                          ]}
                          onPress={() => handleStatus(item._id, status)}
                          disabled={busyOrderId === item._id}
                        >
                          <Text
                            style={[
                              styles.smallBtnText,
                              item.status === status ? styles.smallBtnTextActive : null,
                            ]}
                          >
                            {status}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : null}

                <View style={styles.actionsWrap}>
                  <TouchableOpacity
                    style={styles.dangerBtn}
                    onPress={() => handleDelete(item._id)}
                    disabled={busyOrderId === item._id}
                  >
                    <Ionicons name="trash-outline" size={14} color={c.primary} />
                    <Text style={styles.dangerBtnText}>
                      {busyOrderId === item._id ? "Deleting..." : "Delete Order"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {visibleOrders.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No orders match this filter.</Text>
              </View>
            ) : null}
          </View>
        </View>
        <AppFooter />
      </ScrollView>
    </CustomerScreenShell>
  );
}

function createAdminOrdersStyles(c, shadowPremium) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    maxWidth: Platform.select({ web: layout.maxContentWidth, default: "100%" }),
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  panel: {
    ...adminPanel(c, shadowPremium),
  },
  title: {
    fontSize: typography.h2,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.35,
    color: c.textPrimary,
  },
  subtitle: {
    marginTop: spacing.xs,
    color: c.textSecondary,
    marginBottom: spacing.md,
  },
  successText: {
    color: c.success,
    fontWeight: "600",
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
  errorText: {
    color: c.danger,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: c.surfaceMuted,
    color: c.textPrimary,
    minHeight: 42,
  },
  refreshBtn: {
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    borderRadius: radius.md,
    backgroundColor: c.primarySoft,
    justifyContent: "center",
  },
  refreshBtnText: {
    color: c.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  filterPill: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: c.surface,
  },
  filterPillActive: {
    backgroundColor: c.primarySoft,
    borderColor: c.primaryBorder,
  },
  filterText: {
    color: c.textPrimary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  filterTextActive: {
    color: c.primary,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  card: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: c.surfaceMuted,
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
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft,
  },
  statusBadgeText: {
    color: c.textPrimary,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "capitalize",
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
  primaryActionBtn: {
    borderWidth: 1,
    borderColor: c.primary,
    borderRadius: radius.pill,
    backgroundColor: c.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  primaryActionText: {
    color: c.onPrimary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  secondaryActionBtn: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.pill,
    backgroundColor: c.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  secondaryActionText: {
    color: c.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  editInput: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    backgroundColor: c.surface,
    color: c.textPrimary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 9,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  editSplitRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  editHalfInput: {
    flex: 1,
  },
  saveEditBtn: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: c.primary,
    borderRadius: radius.pill,
    backgroundColor: c.primary,
    alignItems: "center",
    paddingVertical: 9,
  },
  saveEditBtnText: {
    color: c.onPrimary,
    fontSize: 12,
    fontWeight: "700",
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
    marginTop: spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  actionsWrap: {
    marginTop: spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  smallBtn: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: c.surface,
  },
  smallBtnActive: {
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft,
  },
  smallBtnText: {
    color: c.textPrimary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  smallBtnTextActive: {
    color: c.primary,
  },
  dangerBtn: {
    borderWidth: 1,
    borderColor: c.primaryBorder,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: c.primarySoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dangerBtnText: {
    color: c.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    backgroundColor: c.surfaceMuted,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  emptyText: {
    color: c.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  });
}
