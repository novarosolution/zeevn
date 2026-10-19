import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import { AdminOrderStatusBadge, AdminPaymentStatusChip } from "../../components/admin/AdminOrderBadges";
import { useAuth } from "../../context/AuthContext";
import { useLiveSocket } from "../../context/LiveSocketContext";
import { fetchAdminOrders, updateOrderStatus } from "../../services/adminService";
import { ORDER_ADMIN_NEXT_STATUS, getAdminNextStatusLabel } from "../../utils/orderStatus";
import { useTheme } from "../../context/ThemeContext";
import {
  adminBadgeClusterStyle,
  adminCardActionsStyle,
  adminGatePanel,
  adminShellContent,
  adminRecordHeaderRowStyle,
  adminRecordMainColStyle,
  adminToolbarPrimary,
  adminToolbarRow,
  useAdminCompactLayout,
} from "../../theme/adminLayout";
import { FONT_HEADING, FONT_PRICE } from "../../theme/typographyRoles";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, layout, spacing, typography } from "../../theme/tokens";
import { formatOrderPublicRef } from "../../content/appContent";
import { formatINR } from "../../utils/currency";
import {
  ADMIN_ORDER_TABS,
  exportOrdersCsv,
  getOrderItemQty,
  matchesAdminOrderFilter,
} from "../../utils/adminOrderHelpers";
import PremiumInput from "../../components/ui/PremiumInput";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumCard from "../../components/ui/PremiumCard";
import AdminKpiCard, { AdminKpiGrid } from "../../components/admin/AdminKpiCard";
import AdminFilterTabs from "../../components/admin/AdminFilterTabs";
import AdminDataTable from "../../components/admin/AdminDataTable";
import AdminPanel from "../../components/admin/AdminPanel";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminToolbar, { AdminToolbarSlot } from "../../components/admin/AdminToolbar";
import { buildOrderTableColumns } from "../../components/admin/adminTableColumns";

export default function AdminOrdersScreen({ navigation, route }) {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState(route?.params?.query || "");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [renderCount, setRenderCount] = useState(30);
  const [busyId, setBusyId] = useState("");

  const { colors: c, shadowPremium } = useTheme();
  const compactAdmin = useAdminCompactLayout();
  const styles = useMemo(
    () => createAdminOrdersStyles(c, shadowPremium, compactAdmin),
    [c, shadowPremium, compactAdmin]
  );

  const openOrder = useCallback(
    (order) => {
      if (!order?._id) return;
      navigation.navigate("AdminOrderDetail", { orderId: String(order._id) });
    },
    [navigation]
  );

  const loadOrders = useCallback(async () => {
    try {
      setError("");
      const response = await fetchAdminOrders(token);
      setOrders(response);
    } catch (err) {
      setError(err.message || "Failed to load orders.");
    }
  }, [token]);

  const quickStatus = useCallback(
    async (order, status) => {
      if (!order?._id || !status) return;
      const id = String(order._id);
      try {
        setBusyId(id);
        setError("");
        setSuccess("");
        await updateOrderStatus(token, id, status);
        setSuccess(`Order moved to ${String(status).replace(/_/g, " ")}.`);
        await loadOrders();
      } catch (err) {
        setError(err.message || "Unable to update order.");
      } finally {
        setBusyId("");
      }
    },
    [token, loadOrders]
  );

  const quickAdvance = useCallback(
    (order) => {
      const next = ORDER_ADMIN_NEXT_STATUS[String(order?.status || "")];
      if (!next) return;
      quickStatus(order, next);
    },
    [quickStatus]
  );

  const quickCancel = useCallback(
    (order) => {
      Alert.alert("Cancel order", "Customer will see this order as cancelled.", [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel order",
          style: "destructive",
          onPress: () => quickStatus(order, "cancelled"),
        },
      ]);
    },
    [quickStatus]
  );

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadOrders();
  }, [user, loadOrders]);

  const { on: onLiveEvent } = useLiveSocket();
  useEffect(() => {
    if (!user?.isAdmin) return undefined;
    return onLiveEvent("orders:updated", ({ order }) => {
      if (!order?._id) return;
      const orderId = String(order._id);
      setOrders((prev) => {
        const idx = prev.findIndex((item) => String(item._id) === orderId);
        if (idx < 0) return [order, ...prev];
        const next = [...prev];
        next[idx] = { ...next[idx], ...order };
        return next;
      });
    });
  }, [user?.isAdmin, onLiveEvent]);

  const deepLinkedRef = useRef(false);

  useEffect(() => {
    const incomingQuery = String(route?.params?.query || "").trim();
    if (!incomingQuery) return;
    setSearch(incomingQuery);
    setStatusFilter("all");
  }, [route?.params?.query]);

  useEffect(() => {
    const incomingQuery = String(route?.params?.query || "").trim();
    if (!incomingQuery || deepLinkedRef.current || orders.length === 0) return;
    const q = incomingQuery.toLowerCase();
    const match = orders.find(
      (o) =>
        String(o._id).toLowerCase().includes(q) ||
        String(formatOrderPublicRef(o) || "")
          .toLowerCase()
          .includes(q)
    );
    if (match?._id) {
      deepLinkedRef.current = true;
      openOrder(match);
    }
  }, [route?.params?.query, orders, openOrder]);

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (!matchesAdminOrderFilter(order.status, statusFilter)) return false;
      if (!query) return true;
      const idPart = String(order._id || "").toLowerCase();
      const ref = String(formatOrderPublicRef(order) || "").toLowerCase();
      const name = String(order.user?.name || "").toLowerCase();
      const email = String(order.user?.email || "").toLowerCase();
      return idPart.includes(query) || ref.includes(query) || name.includes(query) || email.includes(query);
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
    const newOrders = orders.filter((order) => matchesAdminOrderFilter(order.status, "pending")).length;
    const inKitchen = orders.filter((order) => matchesAdminOrderFilter(order.status, "processing")).length;
    const out = orders.filter((order) => matchesAdminOrderFilter(order.status, "out_for_delivery")).length;
    const delivered = orders.filter((order) => order.status === "delivered").length;
    const cancelled = orders.filter((order) => order.status === "cancelled").length;
    const tabCounts = {
      all: total,
      pending: newOrders,
      processing: inKitchen,
      out_for_delivery: out,
      delivered,
      cancelled,
    };
    return { total, newOrders, inKitchen, delivered, tabCounts };
  }, [orders]);

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.gatePanel}>
              <PremiumErrorBanner
                severity="warning"
                title={ADMIN_GATE.title}
                message="This account does not have admin privileges."
              />
              <PremiumButton
                label={ADMIN_GATE.backHome}
                iconLeft="home-outline"
                variant="primary"
                size="md"
                onPress={() => navigation.navigate("Home")}
                style={styles.gateCta}
              />
            </View>
          </SectionReveal>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

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
            title={ADMIN_SCREEN_COPY.orders.title}
            subtitle={ADMIN_SCREEN_COPY.orders.subtitle}
            headerRight={
              <View style={styles.headerActions}>
                <PremiumButton
                  label="Export"
                  variant="ghost"
                  size="sm"
                  iconLeft="download-outline"
                  onPress={() => exportOrdersCsv(visibleOrders)}
                />
                <PremiumButton
                  label="Refresh"
                  variant="primary"
                  size="sm"
                  iconLeft="refresh-outline"
                  onPress={loadOrders}
                />
              </View>
            }
          >
            <View style={styles.panel}>
              <SectionReveal preset="fade-up" delay={0}>
                <AdminAlerts
                  error={error}
                  success={success}
                  onCloseError={() => setError("")}
                  onCloseSuccess={() => setSuccess("")}
                />

                <AdminPanel
                  title="Pipeline"
                  icon="git-network-outline"
                  meta="Tap a tile to filter"
                  description="Jump straight into pending, kitchen, or delivered views."
                >
                  <AdminKpiGrid compact={compactAdmin}>
                    <AdminKpiCard
                      label="Total"
                      value={stats.total.toLocaleString()}
                      onPress={() => setStatusFilter("all")}
                    />
                    <AdminKpiCard
                      label="Pending"
                      value={String(stats.newOrders)}
                      tone={stats.newOrders > 0 ? "warn" : "default"}
                      onPress={() => setStatusFilter("pending")}
                    />
                    <AdminKpiCard
                      label="Processing"
                      value={String(stats.inKitchen)}
                      onPress={() => setStatusFilter("processing")}
                    />
                    <AdminKpiCard
                      label="Delivered"
                      value={String(stats.delivered)}
                      onPress={() => setStatusFilter("delivered")}
                    />
                  </AdminKpiGrid>
                </AdminPanel>

                <AdminPanel
                  title="Orders desk"
                  icon="search-outline"
                  meta={`${visibleOrders.length} of ${orders.length}`}
                  description="Filter by status, then search by ref, customer, or email."
                >
                  <AdminFilterTabs
                    style={styles.filterTabs}
                    value={ADMIN_ORDER_TABS.some((t) => t.key === statusFilter) ? statusFilter : "all"}
                    onChange={setStatusFilter}
                    items={ADMIN_ORDER_TABS.map((tab) => ({
                      key: tab.key,
                      label: `${tab.label} · ${stats.tabCounts[tab.key] ?? 0}`,
                    }))}
                  />

                  <AdminToolbar>
                    <AdminToolbarSlot flex>
                      <PremiumInput
                        label="Search orders"
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Order ref, id, name, or email"
                        iconLeft="search-outline"
                        iconRight={search ? "close-circle" : undefined}
                        onIconRightPress={search ? () => setSearch("") : undefined}
                        autoCapitalize="none"
                      />
                    </AdminToolbarSlot>
                  </AdminToolbar>
                </AdminPanel>
              </SectionReveal>

              <SectionReveal preset="fade-up" delay={60}>
                <View style={styles.listContent}>
                  {!compactAdmin && renderedOrders.length > 0 ? (
                    <AdminPanel
                      noPadding
                      style={styles.tablePanel}
                      title="Results"
                      icon="list-outline"
                      description="Click a row to open the manage desk."
                    >
                      <AdminDataTable
                        rows={renderedOrders}
                        keyExtractor={(row) => row._id}
                        columns={buildOrderTableColumns({ onView: openOrder, rowPressable: true })}
                        onRowPress={openOrder}
                      />
                    </AdminPanel>
                  ) : null}

                  {!compactAdmin && renderedOrders.length === 0 ? (
                    <PremiumEmptyState
                      iconName="receipt-outline"
                      title="No orders match this view"
                      description="Try another status tab or clear your search."
                      compact
                    />
                  ) : null}

                  {compactAdmin
                    ? renderedOrders.map((item) => {
                        const accentBorder =
                          item.status === "delivered"
                            ? c.secondary
                            : item.status === "cancelled"
                              ? c.danger
                              : ["shipped", "out_for_delivery"].includes(item.status)
                                ? c.primary
                                : c.border;
                        const ref = formatOrderPublicRef(item) || `#${String(item._id).slice(-6).toUpperCase()}`;
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
                                <Text style={styles.cardTitle} numberOfLines={1}>
                                  {ref}
                                </Text>
                                <Text style={styles.cardCustomer} numberOfLines={1}>
                                  {item.user?.name || "Customer"}
                                </Text>
                                <Text style={styles.cardEmail} numberOfLines={1}>
                                  {item.user?.email || "No email"}
                                </Text>
                              </View>
                              <View style={styles.badgeCluster}>
                                <AdminOrderStatusBadge status={item.status} c={c} compact />
                                <AdminPaymentStatusChip paymentStatus={item.paymentStatus} c={c} />
                              </View>
                            </View>
                            <Text style={styles.amountText}>{formatINR(Number(item.totalPrice || 0))}</Text>
                            <Text style={styles.cardMeta}>
                              {getOrderItemQty(item)} items ·{" "}
                              {item.createdAt
                                ? new Date(item.createdAt).toLocaleDateString(undefined, {
                                    day: "numeric",
                                    month: "short",
                                  })
                                : "—"}
                            </Text>
                            <View style={styles.quickActionsRow}>
                              {ORDER_ADMIN_NEXT_STATUS[item.status] ? (
                                <PremiumButton
                                  label={
                                    busyId === String(item._id)
                                      ? "Updating…"
                                      : `Advance · ${getAdminNextStatusLabel(item.status)}`
                                  }
                                  iconLeft="play-forward-outline"
                                  variant="primary"
                                  size="sm"
                                  loading={busyId === String(item._id)}
                                  disabled={Boolean(busyId)}
                                  onPress={() => quickAdvance(item)}
                                  style={styles.quickBtn}
                                />
                              ) : null}
                              {item.status !== "cancelled" && item.status !== "delivered" ? (
                                <PremiumButton
                                  label="Cancel"
                                  iconLeft="close-circle-outline"
                                  variant="danger"
                                  size="sm"
                                  disabled={Boolean(busyId)}
                                  onPress={() => quickCancel(item)}
                                  style={styles.quickBtn}
                                />
                              ) : null}
                              <PremiumButton
                                label="Manage"
                                iconLeft="open-outline"
                                variant="secondary"
                                size="sm"
                                onPress={() => openOrder(item)}
                                style={styles.quickBtn}
                              />
                            </View>
                          </PremiumCard>
                        );
                      })
                    : null}

                  {renderedOrders.length < visibleOrders.length ? (
                    <PremiumButton
                      label={`Load more (${visibleOrders.length - renderedOrders.length} remaining)`}
                      variant="ghost"
                      size="sm"
                      onPress={() => setRenderCount((prev) => prev + 30)}
                      style={styles.loadMoreBtn}
                    />
                  ) : null}

                  {compactAdmin && visibleOrders.length === 0 ? (
                    <PremiumEmptyState
                      iconName="receipt-outline"
                      title="No orders match this filter"
                      description="Try another status tab or clear your search."
                      compact
                    />
                  ) : null}
                </View>
              </SectionReveal>
            </View>
          </KankregAdminShell>
        </KankregScrollPage>
      </KeyboardAvoidingView>
    </AdminScreenShell>
  );
}

function createAdminOrdersStyles(c, shadowPremium, compact = false) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      width: "100%",
      alignSelf: "center",
      maxWidth: "100%",
    },
    panel: adminShellContent(),
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
    orderCardShell: { width: "100%", overflow: "hidden", marginBottom: 2 },
    actionsRow: { ...adminToolbarRow, marginBottom: spacing.xs },
    searchInputWrap: { ...adminToolbarPrimary },
    filterTabs: { marginTop: spacing.sm, marginBottom: spacing.sm },
    listCount: {
      fontSize: typography.caption,
      color: c.textMuted,
      fontFamily: fonts.semibold,
      marginBottom: spacing.sm,
    },
    tablePanel: { marginBottom: spacing.md, paddingHorizontal: 0, paddingBottom: 4 },
    listContent: { gap: spacing.sm, paddingBottom: spacing.xl },
    orderTopRow: adminRecordHeaderRowStyle(compact),
    orderMain: adminRecordMainColStyle(compact),
    badgeCluster: adminBadgeClusterStyle(compact),
    cardTitle: {
      color: c.textPrimary,
      fontFamily: FONT_HEADING,
      fontSize: typography.body + 1,
      letterSpacing: -0.2,
    },
    cardCustomer: {
      marginTop: 4,
      color: c.textPrimary,
      fontFamily: fonts.semibold,
      fontSize: typography.bodySmall,
    },
    cardEmail: {
      marginTop: 2,
      color: c.textSecondary,
      fontFamily: fonts.regular,
      fontSize: typography.caption,
    },
    amountText: {
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      color: c.textPrimary,
      fontFamily: FONT_PRICE,
      fontSize: typography.h3,
      letterSpacing: -0.3,
    },
    cardMeta: {
      marginTop: 4,
      color: c.textSecondary,
      fontSize: typography.caption,
      fontFamily: fonts.regular,
    },
    quickActionsRow: {
      marginTop: spacing.md,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
      ...adminCardActionsStyle(compact),
    },
    quickBtn: {
      flexGrow: 1,
      minWidth: compact ? "100%" : 120,
    },
    loadMoreBtn: { marginTop: spacing.sm },
  });
}
