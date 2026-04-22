import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AppFooter from "../components/AppFooter";
import BottomNavBar from "../components/BottomNavBar";
import AuthGateShell from "../components/AuthGateShell";
import CustomerScreenShell from "../components/CustomerScreenShell";
import ScreenPageHeader from "../components/ScreenPageHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import { reorderMyOrderRequest, updateMyOrderAddressRequest } from "../services/orderService";
import { fetchMyOrders } from "../services/userService";
import { customerPageScrollBase, customerPanel, customerScrollFill } from "../theme/screenLayout";
import { ALCHEMY } from "../theme/customerAlchemy";
import { fonts, radius, spacing, typography } from "../theme/tokens";
import { formatINR } from "../utils/currency";

export default function MyOrdersScreen({ navigation }) {
  const { colors: c, shadowPremium, isDark } = useTheme();
  const styles = useMemo(() => createMyOrdersStyles(c, shadowPremium, isDark), [c, shadowPremium, isDark]);
  const insets = useSafeAreaInsets();
  const { isAuthenticated, token, isAuthLoading } = useAuth();
  const { refreshCartFromServer } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [orders, setOrders] = useState([]);
  const [reorderingOrderId, setReorderingOrderId] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState("");
  const [editingOrderId, setEditingOrderId] = useState("");
  const [savingOrderId, setSavingOrderId] = useState("");
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    note: "",
  });

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      navigation.navigate("Login");
    }
  }, [isAuthLoading, isAuthenticated, navigation]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchMyOrders(token);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return;
    loadOrders();
  }, [isAuthLoading, isAuthenticated, loadOrders]);

  function StatusChip({ status }) {
    const isDelivered = status === "delivered";
    const isCancelled = status === "cancelled";
    return (
      <View
        style={[
          styles.statusChip,
          isDelivered ? styles.statusChipSuccess : null,
          isCancelled ? styles.statusChipDanger : null,
        ]}
      >
        <Text style={styles.statusChipText}>{status}</Text>
      </View>
    );
  }

  const handleReorder = async (orderId) => {
    try {
      setReorderingOrderId(orderId);
      setError("");
      setSuccess("");
      const result = await reorderMyOrderRequest(token, orderId);
      await refreshCartFromServer();
      setSuccess(result.message || "Reorder added to cart.");
      navigation.navigate("Cart");
    } catch (err) {
      setError(err.message || "Unable to reorder.");
    } finally {
      setReorderingOrderId("");
    }
  };

  const canEditAddress = (order) => {
    if (!order) return false;
    if (!["pending", "paid"].includes(order.status)) return false;
    const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
    return elapsedMs <= 5 * 60 * 1000;
  };

  const openEditAddress = (order) => {
    setEditingOrderId(order._id);
    setAddressForm({
      fullName: order.shippingAddress?.fullName || "",
      phone: order.shippingAddress?.phone || "",
      line1: order.shippingAddress?.line1 || "",
      city: order.shippingAddress?.city || "",
      state: order.shippingAddress?.state || "",
      postalCode: order.shippingAddress?.postalCode || "",
      country: order.shippingAddress?.country || "",
      note: order.shippingAddress?.note || "",
    });
  };

  const handleSaveAddress = async (orderId) => {
    try {
      setSavingOrderId(orderId);
      setError("");
      setSuccess("");
      await updateMyOrderAddressRequest(token, orderId, addressForm);
      setSuccess("Order address updated successfully.");
      setEditingOrderId("");
      await loadOrders();
    } catch (err) {
      setError(err.message || "Unable to update order address.");
    } finally {
      setSavingOrderId("");
    }
  };

  if (isAuthLoading || !isAuthenticated) {
    return <AuthGateShell />;
  }

  return (
    <CustomerScreenShell style={styles.screen}>
      <ScrollView
        style={customerScrollFill}
        contentContainerStyle={[
          customerPageScrollBase,
          { paddingTop: Math.max(insets.top, Platform.OS === "web" ? spacing.md : spacing.sm) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenPageHeader
          navigation={navigation}
          title="My orders"
          subtitle="Track deliveries & reorder"
          right={
            <TouchableOpacity
              onPress={loadOrders}
              style={[styles.headerRefreshBtn, { borderColor: c.primaryBorder, backgroundColor: c.primarySoft }]}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Refresh orders"
            >
              <Ionicons name="refresh" size={20} color={c.primary} />
            </TouchableOpacity>
          }
        />
        {error || success ? (
          <View style={styles.flashBar}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {success ? <Text style={styles.successText}>{success}</Text> : null}
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator color={c.secondary} />
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.panel}>
            <View style={styles.emptyVisual}>
              <Ionicons name="file-tray-outline" size={48} color={c.primaryBorder} />
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptyText}>When you place an order, it will show up here with live status.</Text>
            </View>
          </View>
        ) : (
          orders.map((item) => (
            <View key={item._id} style={styles.panel}>
              <View style={styles.orderTitleRow}>
                <Text style={styles.orderTitle}>Order #{String(item._id).slice(-6).toUpperCase()}</Text>
                <StatusChip status={item.status} />
              </View>
              <Text style={styles.meta}>{formatINR(item.totalPrice)}</Text>
              <Text style={styles.meta}>
                Items: {(item.products || []).length} • Qty: {(item.products || []).reduce((sum, p) => sum + Number(p.quantity || 0), 0)}
              </Text>
              <Text style={styles.meta}>
                {item.shippingAddress?.city}, {item.shippingAddress?.state}
              </Text>
              {item.coupon?.code ? (
                <Text style={styles.meta}>
                  Coupon: {item.coupon.code} (-{formatINR(item.coupon.discountAmount || 0)})
                </Text>
              ) : null}
              {(item.products || []).slice(0, 4).map((productItem, index) => (
                <Text key={`${item._id}-${index}`} style={styles.itemLine}>
                  - {productItem.name} x {productItem.quantity}
                </Text>
              ))}
              {(item.products || []).length > 4 ? (
                <Text style={styles.meta}>+{(item.products || []).length - 4} more</Text>
              ) : null}
              <View style={styles.rowButtons}>
                <TouchableOpacity
                  style={styles.outlineBtn}
                  onPress={() =>
                    setExpandedOrderId((current) => (current === item._id ? "" : item._id))
                  }
                >
                  <Ionicons
                    name={expandedOrderId === item._id ? "chevron-up-outline" : "chevron-down-outline"}
                    size={14}
                    color={c.textPrimary}
                  />
                  <Text style={styles.outlineBtnText}>
                    {expandedOrderId === item._id ? "Hide Details" : "Full Details"}
                  </Text>
                </TouchableOpacity>
                {canEditAddress(item) ? (
                  <TouchableOpacity style={styles.outlineBtn} onPress={() => openEditAddress(item)}>
                    <Ionicons name="location-outline" size={14} color={c.textPrimary} />
                    <Text style={styles.outlineBtnText}>Change Address (5 min)</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {expandedOrderId === item._id ? (
                <View style={styles.detailBox}>
                  <Text style={styles.detailTitle}>Price Breakdown</Text>
                  <Text style={styles.meta}>Items: {formatINR(item.priceBreakdown?.itemsTotal || 0)}</Text>
                  <Text style={styles.meta}>Delivery: {formatINR(item.priceBreakdown?.deliveryFee || 0)}</Text>
                  <Text style={styles.meta}>Platform Fee: {formatINR(item.priceBreakdown?.platformFee || 0)}</Text>
                  <Text style={styles.meta}>Discount: -{formatINR(item.priceBreakdown?.discountAmount || 0)}</Text>
                  <Text style={styles.meta}>Payment Method: {item.paymentMethod || "Cash on Delivery"}</Text>
                  <Text style={styles.meta}>
                    Address: {item.shippingAddress?.line1 || ""}, {item.shippingAddress?.city || ""},{" "}
                    {item.shippingAddress?.state || ""}, {item.shippingAddress?.postalCode || ""},{" "}
                    {item.shippingAddress?.country || ""}
                  </Text>
                </View>
              ) : null}
              {editingOrderId === item._id ? (
                <View style={styles.editBox}>
                  <Text style={styles.detailTitle}>Update Address (allowed only first 5 minutes)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor={c.textMuted}
                    value={addressForm.fullName}
                    onChangeText={(value) => setAddressForm((current) => ({ ...current, fullName: value }))}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone"
                    placeholderTextColor={c.textMuted}
                    value={addressForm.phone}
                    onChangeText={(value) => setAddressForm((current) => ({ ...current, phone: value }))}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Address Line"
                    placeholderTextColor={c.textMuted}
                    value={addressForm.line1}
                    onChangeText={(value) => setAddressForm((current) => ({ ...current, line1: value }))}
                  />
                  <View style={styles.splitRow}>
                    <TextInput
                      style={[styles.input, styles.halfInput]}
                      placeholder="City"
                      placeholderTextColor={c.textMuted}
                      value={addressForm.city}
                      onChangeText={(value) => setAddressForm((current) => ({ ...current, city: value }))}
                    />
                    <TextInput
                      style={[styles.input, styles.halfInput]}
                      placeholder="State"
                      placeholderTextColor={c.textMuted}
                      value={addressForm.state}
                      onChangeText={(value) => setAddressForm((current) => ({ ...current, state: value }))}
                    />
                  </View>
                  <View style={styles.splitRow}>
                    <TextInput
                      style={[styles.input, styles.halfInput]}
                      placeholder="Postal Code"
                      placeholderTextColor={c.textMuted}
                      value={addressForm.postalCode}
                      onChangeText={(value) => setAddressForm((current) => ({ ...current, postalCode: value }))}
                    />
                    <TextInput
                      style={[styles.input, styles.halfInput]}
                      placeholder="Country"
                      placeholderTextColor={c.textMuted}
                      value={addressForm.country}
                      onChangeText={(value) => setAddressForm((current) => ({ ...current, country: value }))}
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Note (optional)"
                    placeholderTextColor={c.textMuted}
                    value={addressForm.note}
                    onChangeText={(value) => setAddressForm((current) => ({ ...current, note: value }))}
                  />
                  <View style={styles.rowButtons}>
                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={() => handleSaveAddress(item._id)}
                      disabled={savingOrderId === item._id}
                    >
                      <Text style={styles.primaryBtnText}>
                        {savingOrderId === item._id ? "Saving..." : "Save Address"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.outlineBtn} onPress={() => setEditingOrderId("")}>
                      <Text style={styles.outlineBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
              <TouchableOpacity
                style={[styles.reorderBtn, reorderingOrderId === item._id ? styles.reorderBtnDisabled : null]}
                onPress={() => handleReorder(item._id)}
                disabled={reorderingOrderId === item._id}
              >
                <Ionicons name="refresh-outline" size={14} color={c.onPrimary} />
                <Text style={styles.reorderBtnText}>
                  {reorderingOrderId === item._id ? "Adding..." : "Reorder In-Stock Items"}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        <AppFooter />
      </ScrollView>
      <BottomNavBar />
    </CustomerScreenShell>
  );
}

function createMyOrdersStyles(c, shadowPremium, isDark) {
  const outlineBg = isDark ? c.surfaceMuted : ALCHEMY.cardBg;
  const outlineBorder = isDark ? c.border : ALCHEMY.pillInactive;
  return StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerRefreshBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  flashBar: {
    marginBottom: spacing.md,
  },
  panel: {
    ...customerPanel(c, shadowPremium),
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  loaderWrap: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  orderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  orderTitle: {
    color: c.textPrimary,
    fontFamily: fonts.extrabold,
    fontSize: typography.bodySmall,
  },
  statusChip: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusChipSuccess: {
    borderColor: c.secondaryBorder,
    backgroundColor: c.secondarySoft,
  },
  statusChipDanger: {
    borderColor: c.danger,
    backgroundColor: c.surfaceMuted,
  },
  statusChipText: {
    color: c.textPrimary,
    fontSize: typography.overline,
    fontFamily: fonts.bold,
    textTransform: "capitalize",
  },
  meta: {
    marginTop: 4,
    color: c.textSecondary,
    fontSize: typography.caption,
    fontFamily: fonts.regular,
  },
  itemLine: {
    marginTop: 4,
    color: c.textPrimary,
    fontSize: typography.caption,
    fontFamily: fonts.semibold,
  },
  rowButtons: {
    marginTop: spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  outlineBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: outlineBorder,
    borderRadius: radius.lg,
    backgroundColor: outlineBg,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  outlineBtnText: {
    color: c.textPrimary,
    fontSize: typography.caption,
    fontFamily: fonts.bold,
  },
  detailBox: {
    marginTop: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: outlineBorder,
    borderRadius: radius.lg,
    backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt,
    padding: spacing.md,
  },
  editBox: {
    marginTop: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.primaryBorder,
    borderRadius: radius.lg,
    backgroundColor: c.primarySoft,
    padding: spacing.md,
  },
  detailTitle: {
    color: c.textPrimary,
    fontSize: typography.caption,
    fontFamily: fonts.extrabold,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.lg,
    backgroundColor: c.surface,
    color: c.textPrimary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    fontSize: typography.caption,
    fontFamily: fonts.regular,
    minHeight: 42,
    marginBottom: spacing.xs,
  },
  splitRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  halfInput: {
    flex: 1,
  },
  primaryBtn: {
    borderWidth: 1,
    borderColor: c.primary,
    borderRadius: radius.pill,
    backgroundColor: c.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  primaryBtnText: {
    color: c.onPrimary,
    fontSize: typography.caption,
    fontFamily: fonts.bold,
  },
  reorderBtn: {
    marginTop: spacing.sm,
    backgroundColor: c.primary,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  reorderBtnDisabled: {
    opacity: 0.7,
  },
  reorderBtnText: {
    color: c.onPrimary,
    fontSize: typography.caption,
    fontFamily: fonts.bold,
  },
  emptyVisual: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  emptyTitle: {
    marginTop: spacing.md,
    fontSize: typography.h3,
    fontFamily: fonts.extrabold,
    color: c.textPrimary,
  },
  emptyText: {
    marginTop: spacing.sm,
    color: c.textSecondary,
    textAlign: "center",
    fontSize: typography.body,
    fontFamily: fonts.regular,
    lineHeight: 22,
    maxWidth: 280,
  },
  errorText: {
    color: c.danger,
    fontFamily: fonts.semibold,
    fontSize: typography.caption,
  },
  successText: {
    color: c.success,
    marginTop: spacing.xs,
    fontFamily: fonts.semibold,
    fontSize: typography.caption,
  },
  });
}
