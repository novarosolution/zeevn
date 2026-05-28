import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import OpsAdminScreen from "../../components/ops/OpsAdminScreen";
import OpsDataTable from "../../components/ops/OpsDataTable";
import OpsStatCard from "../../components/ops/OpsStatCard";
import OrderStatusBadge from "../../components/ops/OrderStatusBadge";
import PaymentStatusBadge from "../../components/ops/PaymentStatusBadge";
import OpsListSkeleton from "../../components/ops/OpsListSkeleton";
import {
  deleteAdminOrder,
  fetchAdminOrders,
  fetchAdminUsers,
  updateAdminOrderDetails,
  updateOrderStatus,
} from "../../services/adminService";
import { useTheme } from "../../context/ThemeContext";
import { adminPanel } from "../../theme/adminLayout";
import { fonts, getSemanticColors, layout, radius, spacing } from "../../theme/tokens";
import { formatINR } from "../../utils/currency";
import {
  ALL_ORDER_STATUSES,
  ORDER_ADMIN_NEXT_STATUS,
  getOrderStatusLabel,
  getAdminNextStatusLabel,
} from "../../utils/orderStatus";
import Input from "../../components/ui/Input";
import ErrorBanner from "../../components/ui/ErrorBanner";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Chip from "../../components/ui/Chip";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

const STATUSES = ["all", ...ALL_ORDER_STATUSES];

export default function AdminOrdersScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const useTable = Platform.OS === "web" && width >= 768;
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
  const [confirmDeleteOrderId, setConfirmDeleteOrderId] = useState("");
  const [renderCount, setRenderCount] = useState(30);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const { colors: c, shadowPremium, semanticPalette, SPACING } = useTheme();
  const semantic = useMemo(() => getSemanticColors(c), [c]);
  const styles = useMemo(
    () => createAdminOrdersStyles(c, shadowPremium, semantic),
    [c, shadowPremium, semantic]
  );
  const loadOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      setError("");
      const [response, users] = await Promise.all([
        fetchAdminOrders(token),
        fetchAdminUsers(token).catch(() => []),
      ]);
      setOrders(response);
      setDeliveryPartners((users || []).filter((u) => u.isDeliveryPartner));
    } catch (err) {
      setError(err.message || "Failed to load orders.");
    } finally {
      setOrdersLoading(false);
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
      setConfirmDeleteOrderId("");
    }
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

  function SectionTitle({ icon, label }) {
    return (
      <View style={styles.sectionTitleRow}>
        <Ionicons name={icon} size={14} color={semanticPalette.inkMuted} />
        <Text style={[styles.sectionTitleText, { color: semanticPalette.ink }]}>{label}</Text>
      </View>
    );
  }

  const orderColumns = useMemo(
    () => [
      {
        key: "id",
        label: "Order",
        flex: 0.8,
        sortable: true,
        sortValue: (row) => row._id,
        render: (row) => (
          <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: semanticPalette.ink }}>
            #{String(row._id).slice(-6).toUpperCase()}
          </Text>
        ),
      },
      {
        key: "customer",
        label: "Customer",
        flex: 1.2,
        sortable: true,
        sortValue: (row) => row.user?.name || "",
        render: (row) => (
          <View>
            <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: semanticPalette.ink }} numberOfLines={1}>
              {row.user?.name || "User"}
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: semanticPalette.inkSoft }} numberOfLines={1}>
              {row.user?.email || "—"}
            </Text>
          </View>
        ),
      },
      {
        key: "status",
        label: "Status",
        flex: 1,
        sortable: true,
        sortValue: (row) => row.status,
        render: (row) => (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            <OrderStatusBadge status={row.status} context="admin" />
            <PaymentStatusBadge paymentStatus={row.paymentStatus} />
          </View>
        ),
      },
      {
        key: "total",
        label: "Total",
        flex: 0.7,
        sortable: true,
        sortValue: (row) => Number(row.totalPrice || 0),
        render: (row) => (
          <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: semanticPalette.ink }}>
            {formatINR(Number(row.totalPrice || 0))}
          </Text>
        ),
      },
      {
        key: "actions",
        label: "",
        flex: 1.1,
        minWidth: 160,
        render: (row) => (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            <Button
              label={expandedOrderId === row._id ? "Hide" : "View"}
              variant="secondary"
              size="sm"
              onPress={() => setExpandedOrderId((current) => (current === row._id ? "" : row._id))}
            />
            <Button
              label="Delete"
              variant="destructive"
              size="sm"
              loading={busyOrderId === row._id}
              disabled={busyOrderId === row._id}
              onPress={() => setConfirmDeleteOrderId(row._id)}
            />
          </View>
        ),
      },
    ],
    [busyOrderId, expandedOrderId, semanticPalette.ink, semanticPalette.inkSoft]
  );

  return (
    <OpsAdminScreen navigation={navigation} activeRoute="AdminOrders" sectionTitle="Manage orders">
          {error ? (
            <View style={styles.bannerSpacer}>
              <ErrorBanner severity="error" message={error} onClose={() => setError("")} compact />
            </View>
          ) : null}
          {success ? (
            <View style={styles.bannerSpacer}>
              <ErrorBanner severity="success" message={success} onClose={() => setSuccess("")} compact />
            </View>
          ) : null}

          <View style={[styles.statsGrid, { gap: SPACING.sm }]}>
            <OpsStatCard label="Total" value={String(stats.total)} style={{ flex: 1, minWidth: 100 }} />
            <OpsStatCard label="New" value={String(stats.newOrders)} style={{ flex: 1, minWidth: 100 }} />
            <OpsStatCard label="In kitchen" value={String(stats.inKitchen)} style={{ flex: 1, minWidth: 100 }} />
            <OpsStatCard label="Out / pickup" value={String(stats.outForDelivery)} style={{ flex: 1, minWidth: 100 }} />
            <OpsStatCard label="Delivered" value={String(stats.delivered)} style={{ flex: 1, minWidth: 100 }} />
          </View>

          <View style={styles.actionsRow}>
            <View style={styles.searchInputWrap}>
              <Input
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
            <Button
              label="Refresh"
              iconLeft="refresh-outline"
              variant="secondary"
              size="sm"
              onPress={loadOrders}
              style={styles.refreshBtn}
            />
          </View>

          {Platform.OS === "web" ? (
            <View style={styles.filtersRow}>
              {STATUSES.map((status) => (
                <Chip
                  key={status}
                  label={status === "all" ? "All" : getOrderStatusLabel(status)}
                  tone="gold"
                  size="sm"
                  selected={statusFilter === status}
                  onPress={() => setStatusFilter(status)}
                />
              ))}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersRow}
            >
              {STATUSES.map((status) => (
                <Chip
                  key={status}
                  label={status === "all" ? "All" : getOrderStatusLabel(status)}
                  tone="gold"
                  size="sm"
                  selected={statusFilter === status}
                  onPress={() => setStatusFilter(status)}
                />
              ))}
            </ScrollView>
          )}

          {ordersLoading && orders.length === 0 ? <OpsListSkeleton rows={5} /> : null}

          {useTable && !ordersLoading && renderedOrders.length > 0 ? (
            <View style={{ marginBottom: SPACING.md }}>
              <OpsDataTable
                columns={orderColumns}
                data={renderedOrders}
                keyExtractor={(row) => row._id}
                pageSize={15}
                emptyMessage="No orders to show."
              />
            </View>
          ) : null}

          <View style={styles.listContent}>
            {!ordersLoading &&
            renderedOrders.map((item) => {
              if (useTable && item._id !== expandedOrderId) return null;
              if (useTable && !expandedOrderId) return null;
              const accentBorder = semanticPalette.lineSoft;
              return (
              <Card
                key={item._id}
                variant="muted"
                padding="md"
                style={[styles.orderCardShell, { borderLeftWidth: 3, borderLeftColor: accentBorder }]}
              >
                <View style={styles.orderTopRow}>
                  <View style={styles.orderMain}>
                    <Text style={styles.cardTitle}>Order #{item._id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.cardMeta}>
                      {item.user?.name || "User"} • {item.user?.email || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.badgeCluster}>
                    <OrderStatusBadge status={item.status} context="admin" />
                    <PaymentStatusBadge paymentStatus={item.paymentStatus} />
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
                    <Button
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
                  <Button
                    label={expandedOrderId === item._id ? "Hide details" : "View full details"}
                    iconLeft={expandedOrderId === item._id ? "chevron-up-outline" : "chevron-down-outline"}
                    variant="secondary"
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
                        <Chip
                          label="Unassign"
                          tone="neutral"
                          size="sm"
                          selected={!getOrderEditForm(item).assignedDeliveryUserId}
                          onPress={() => handleAssignDeliveryPartner(item, "")}
                        />
                        {deliveryPartners.map((dp) => {
                          const sel = getOrderEditForm(item).assignedDeliveryUserId === String(dp._id);
                          return (
                            <Chip
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
                      <Input
                        label="Payment method"
                        value={getOrderEditForm(item).paymentMethod}
                        onChangeText={(value) =>
                          updateOrderFormField(item._id, "paymentMethod", value, item)
                        }
                        iconLeft="card-outline"
                      />
                    </View>
                    <View style={styles.orderFieldGap}>
                      <Input
                        label="Full name"
                        value={getOrderEditForm(item).fullName}
                        onChangeText={(value) => updateOrderFormField(item._id, "fullName", value, item)}
                        iconLeft="person-outline"
                      />
                    </View>
                    <View style={styles.orderFieldGap}>
                      <Input
                        label="Phone"
                        value={getOrderEditForm(item).phone}
                        onChangeText={(value) => updateOrderFormField(item._id, "phone", value, item)}
                        keyboardType="phone-pad"
                        iconLeft="call-outline"
                      />
                    </View>
                    <View style={styles.orderFieldGap}>
                      <Input
                        label="Address line"
                        value={getOrderEditForm(item).line1}
                        onChangeText={(value) => updateOrderFormField(item._id, "line1", value, item)}
                        iconLeft="home-outline"
                      />
                    </View>
                    <View style={styles.editSplitRow}>
                      <View style={[styles.orderFieldGap, styles.orderHalfField]}>
                        <Input
                          label="City"
                          value={getOrderEditForm(item).city}
                          onChangeText={(value) => updateOrderFormField(item._id, "city", value, item)}
                        />
                      </View>
                      <View style={[styles.orderFieldGap, styles.orderHalfField]}>
                        <Input
                          label="State"
                          value={getOrderEditForm(item).state}
                          onChangeText={(value) => updateOrderFormField(item._id, "state", value, item)}
                        />
                      </View>
                    </View>
                    <View style={styles.editSplitRow}>
                      <View style={[styles.orderFieldGap, styles.orderHalfField]}>
                        <Input
                          label="Postal code"
                          value={getOrderEditForm(item).postalCode}
                          onChangeText={(value) =>
                            updateOrderFormField(item._id, "postalCode", value, item)
                          }
                          keyboardType="number-pad"
                        />
                      </View>
                      <View style={[styles.orderFieldGap, styles.orderHalfField]}>
                        <Input
                          label="Country"
                          value={getOrderEditForm(item).country}
                          onChangeText={(value) => updateOrderFormField(item._id, "country", value, item)}
                        />
                      </View>
                    </View>
                    <View style={styles.orderFieldGap}>
                      <Input
                        label="Order note"
                        value={getOrderEditForm(item).note}
                        onChangeText={(value) => updateOrderFormField(item._id, "note", value, item)}
                        iconLeft="document-outline"
                      />
                    </View>
                    <SectionTitle icon="document-text-outline" label="Invoice tools" />
                    <Text style={styles.cardMeta}>
                      Invoice editing is coming soon. Order status, payment state, and delivery assignment still work as usual.
                    </Text>
                    <Button
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
                    {Platform.OS === "web" ? (
                      <View style={[styles.statusButtonsWrap, styles.statusButtonsWrapWeb]}>
                        {STATUSES.filter((status) => status !== "all").map((status) => (
                          <Chip
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
                      </View>
                    ) : (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusButtonsWrap}>
                        {STATUSES.filter((status) => status !== "all").map((status) => (
                          <Chip
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
                    )}
                  </View>
                ) : null}

                <View style={styles.actionsWrap}>
                  <Button
                    label={busyOrderId === item._id ? "Deleting…" : "Delete order"}
                    iconLeft="trash-outline"
                    variant="destructive"
                    size="sm"
                    loading={busyOrderId === item._id}
                    disabled={busyOrderId === item._id}
                    onPress={() => setConfirmDeleteOrderId(item._id)}
                  />
                </View>
              </Card>
            );
            })}
            {renderedOrders.length < visibleOrders.length && !useTable ? (
              <Button
                label={`Load more (${visibleOrders.length - renderedOrders.length} remaining)`}
                variant="ghost"
                size="sm"
                onPress={() => setRenderCount((prev) => prev + 30)}
                style={styles.loadMoreBtn}
              />
            ) : null}
            {!ordersLoading && visibleOrders.length === 0 ? (
              <EmptyState
                iconName="receipt-outline"
                title="No orders match this filter"
                description="Try another status chip or clear your search."
                compact
              />
            ) : null}
          </View>
                  <ConfirmDialog
        visible={Boolean(confirmDeleteOrderId)}
        title="Delete this order?"
        message="This permanently deletes the order record. This action cannot be undone."
        confirmLabel="Delete order"
        confirmVariant="danger"
        busy={busyOrderId === confirmDeleteOrderId}
        onCancel={() => setConfirmDeleteOrderId("")}
        onConfirm={() => handleDelete(confirmDeleteOrderId)}
      />
    </OpsAdminScreen>
  );
}

function createAdminOrdersStyles(c, shadowPremium, semantic) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    maxWidth: Platform.select({ web: layout.maxContentWidth + 96, default: "100%" }),
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
    borderTopWidth: 1,
    borderTopColor: semantic.border.accent,
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
    borderColor: semantic.border.subtle,
    borderRadius: radius.md,
    backgroundColor: semantic.bg.muted,
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
    paddingRight: Platform.select({ web: 0, default: spacing.md }),
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
    borderTopColor: semantic.border.divider,
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
  statusButtonsWrapWeb: {
    flexWrap: "wrap",
    paddingBottom: 0,
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
