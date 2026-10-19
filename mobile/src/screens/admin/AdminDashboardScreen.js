import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import { Platform, RefreshControl, StyleSheet, Text, View } from "react-native";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminKpiCard, { AdminKpiGrid } from "../../components/admin/AdminKpiCard";
import AdminPanel from "../../components/admin/AdminPanel";
import AdminDataTable from "../../components/admin/AdminDataTable";
import AdminCategoryBar from "../../components/admin/AdminCategoryBar";
import AdminRevenueBars from "../../components/admin/AdminRevenueBars";
import AdminStatusPill, { orderStatusTone } from "../../components/admin/AdminStatusPill";
import AdminToolsGrid from "../../components/admin/AdminToolsGrid";
import { useAuth } from "../../context/AuthContext";
import {
  fetchAdminAnalytics,
  fetchAdminOpsSummary,
  fetchAdminOrders,
} from "../../services/adminService";
import { useTheme } from "../../context/ThemeContext";
import {
  adminShellContent,
  adminTwoColAside,
  adminTwoColMain,
  adminTwoColStyle,
  useAdminCompactLayout,
} from "../../theme/adminLayout";
import { formatOrderPublicRef } from "../../content/appContent";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, layout, spacing } from "../../theme/tokens";
import { formatINR } from "../../utils/currency";
import { getOrderItemQty } from "../../utils/adminOrderHelpers";
import { getOrderStatusLabel } from "../../utils/orderStatus";
import PremiumLoader from "../../components/ui/PremiumLoader";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumButton from "../../components/ui/PremiumButton";
import SectionReveal from "../../components/motion/SectionReveal";

function formatCompactINR(value) {
  const n = Number(value) || 0;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1).replace(/\.0$/, "")}L`;
  if (n >= 1000) return `₹${Math.round(n / 1000)}k`;
  return formatINR(n);
}

function paymentLabel(order) {
  const m = String(order.paymentMethod || order.paymentMode || "").toLowerCase();
  if (m.includes("cod") || m.includes("cash")) return "COD";
  if (m.includes("razor")) return "Razorpay";
  return order.paymentMethod || "—";
}

/** "Mon, 8 Jun" → "8" for compact unique chart axis labels */
function shortTrendLabel(label) {
  const text = String(label || "");
  const afterComma = text.split(",")[1];
  if (afterComma) {
    const day = afterComma.trim().split(/\s+/)[0];
    if (day) return day;
  }
  return text.slice(0, 3);
}

export default function AdminDashboardScreen({ navigation, route }) {
  const compact = useAdminCompactLayout();
  const { user, token } = useAuth();
  const { colors: c } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [ops, setOps] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  const welcomeSub = useMemo(() => {
    const d = new Date();
    const day = d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
    return `Welcome back, ${user?.name?.split(" ")?.[0] || "Admin"} · ${day}`;
  }, [user?.name]);

  const loadDashboard = useCallback(
    async ({ isPullRefresh = false } = {}) => {
      if (isPullRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const [a, orders, opsSummary] = await Promise.all([
          fetchAdminAnalytics(token, { range: "30d" }),
          fetchAdminOrders(token),
          fetchAdminOpsSummary(token).catch(() => null),
        ]);
        setAnalytics(a);
        setOps(opsSummary);
        const sorted = [...(orders || [])].sort(
          (x, y) => new Date(y.createdAt || 0) - new Date(x.createdAt || 0)
        );
        setRecentOrders(sorted.slice(0, 6));
      } catch (err) {
        setError(err.message || "Unable to load admin dashboard.");
      } finally {
        if (isPullRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadDashboard();
  }, [user?.isAdmin, loadDashboard]);

  const opsKpis = useMemo(() => {
    const k = ops?.kpis || {};
    return {
      open: String(k.openOrders ?? "—"),
      pendingAccept: String(k.pendingAccept ?? "—"),
      out: String(k.outForDelivery ?? "—"),
      lowStock: String(k.lowStock ?? "—"),
      partnersOnline: String(k.partnersOnline ?? "—"),
      needsReassign: String(k.declinedUnassigned ?? "—"),
    };
  }, [ops]);

  const kpis = useMemo(() => {
    const rev30 = analytics?.activity?.revenueLast30Days ?? analytics?.revenue?.total ?? 0;
    const orders30 = analytics?.activity?.ordersLast30Days ?? analytics?.totals?.orders ?? 0;
    const aov = analytics?.revenue?.averageOrderValue ?? (orders30 ? rev30 / orders30 : 0);
    const cancelled = analytics?.funnel?.cancelledOrders ?? 0;
    const totalOrders = analytics?.totals?.orders ?? 0;
    const refundRate = totalOrders ? ((cancelled / totalOrders) * 100).toFixed(1) : "0";
    return {
      revenue: formatCompactINR(rev30),
      orders: orders30.toLocaleString(),
      aov: formatINR(Math.round(aov)),
      refund: `${refundRate}%`,
    };
  }, [analytics]);

  const attention = Array.isArray(ops?.attention) ? ops.attention : [];

  const chartData = useMemo(() => {
    const series = analytics?.trends?.last14Days || analytics?.trends?.last7Days;
    if (!series) return { labels: [], values: [] };
    return {
      labels: (series.labels || []).map(shortTrendLabel),
      values: series.revenues || series.orderCounts || [],
    };
  }, [analytics]);

  const categories = useMemo(() => {
    const cats = analytics?.inventory?.topCategories || [];
    const total = cats.reduce((s, x) => s + Number(x.count || 0), 0) || 1;
    return cats.slice(0, 4).map((c) => ({
      name: c.name,
      percent: Math.round((Number(c.count || 0) / total) * 100),
    }));
  }, [analytics]);

  const orderColumns = useMemo(
    () => [
      {
        key: "ref",
        label: "Order",
        flex: 1.1,
        strong: true,
        render: (row) => formatOrderPublicRef(row) || "—",
      },
      { key: "customer", label: "Customer", flex: 1.2, render: (row) => row.userName || row.shippingAddress?.name || "Guest" },
      {
        key: "items",
        label: "Qty",
        width: 56,
        render: (row) => String(getOrderItemQty(row)),
      },
      {
        key: "total",
        label: "Total",
        flex: 0.9,
        strong: true,
        render: (row) => formatINR(row.totalPrice || 0),
      },
      { key: "payment", label: "Payment", flex: 0.8, render: (row) => paymentLabel(row) },
      {
        key: "status",
        label: "Status",
        flex: 1,
        render: (row) => (
          <AdminStatusPill
            label={getOrderStatusLabel(row.status)}
            tone={orderStatusTone(row.status)}
          />
        ),
      },
    ],
    []
  );

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <View style={styles.denied}>
            <PremiumErrorBanner
              severity="warning"
              title={ADMIN_GATE.title}
              message="This account does not have admin privileges."
            />
            <PremiumButton
              label={ADMIN_GATE.backHome}
              iconLeft="home-outline"
              variant="primary"
              onPress={() => navigation.navigate("Home")}
            />
          </View>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

  return (
    <AdminScreenShell style={styles.screen}>
      <KankregScrollPage
        scrollVariant="admin"
        showFooter={false}
        style={customerScrollFill}
        refreshControl={
          Platform.OS === "web" ? undefined : (
            <RefreshControl refreshing={refreshing} onRefresh={() => loadDashboard({ isPullRefresh: true })} />
          )
        }
      >
        <KankregAdminShell
          navigation={navigation}
          route={route || { name: "AdminDashboard" }}
          title={ADMIN_SCREEN_COPY.dashboard.title}
          subtitle={welcomeSub}
          headerRight={
            <View style={styles.headerActions}>
              <PremiumButton
                label="Zones"
                iconLeft="bicycle-outline"
                variant="ghost"
                size="sm"
                onPress={() => navigation.navigate("AdminDelivery")}
              />
              <PremiumButton
                label="Orders"
                iconLeft="receipt-outline"
                variant="secondary"
                size="sm"
                onPress={() => navigation.navigate("AdminOrders")}
              />
              <PremiumButton
                label="Analytics"
                iconLeft="bar-chart-outline"
                variant="primary"
                size="sm"
                onPress={() => navigation.navigate("AdminAnalytics")}
              />
            </View>
          }
        >
          {error ? (
            <PremiumErrorBanner severity="error" message={error} compact style={styles.banner} />
          ) : null}

          {loading ? (
            <PremiumLoader caption="Loading command…" />
          ) : (
            <View style={styles.desk}>
              <SectionReveal preset="fade-up">
                <AdminPanel
                  title="Needs attention"
                  icon="alert-circle-outline"
                  description="Stuck accepts and unassigned live runs surface here first."
                  meta={attention.length ? `${attention.length} items` : "All clear"}
                  action="All orders"
                  onAction={() => navigation.navigate("AdminOrders")}
                >
                  {!attention.length ? (
                    <Text style={[styles.muted, { color: c.textMuted }]}>
                      No stuck accepts or unassigned live runs.
                    </Text>
                  ) : (
                    attention.map((item) => (
                      <PremiumButton
                        key={String(item._id)}
                        label={`${formatOrderPublicRef(item) || String(item._id).slice(-6)} · ${item.reason}`}
                        variant="subtle"
                        size="sm"
                        fullWidth
                        iconRight="chevron-forward-outline"
                        onPress={() =>
                          navigation.navigate("AdminOrderDetail", {
                            orderId: String(item._id),
                          })
                        }
                        style={styles.attentionBtn}
                        textStyle={styles.attentionBtnText}
                      />
                    ))
                  )}
                </AdminPanel>
              </SectionReveal>

              <SectionReveal preset="fade-up" delay={40}>
                <AdminPanel
                  title="Live ops"
                  icon="flash-outline"
                  meta="Tap a tile to jump"
                  description="Open runs, accepts, stock, and rider GPS — one tap into the desk."
                >
                  <AdminKpiGrid compact={compact}>
                    <AdminKpiCard
                      label="Open orders"
                      value={opsKpis.open}
                      tone={Number(opsKpis.open) > 0 ? "hot" : "default"}
                      onPress={() => navigation.navigate("AdminOrders")}
                    />
                    <AdminKpiCard
                      label="Awaiting accept"
                      value={opsKpis.pendingAccept}
                      tone={Number(opsKpis.pendingAccept) > 0 ? "warn" : "default"}
                      onPress={() => navigation.navigate("AdminOrders")}
                    />
                    <AdminKpiCard
                      label="Out for delivery"
                      value={opsKpis.out}
                      onPress={() => navigation.navigate("AdminOrders")}
                    />
                    <AdminKpiCard
                      label="Low stock"
                      value={opsKpis.lowStock}
                      tone={Number(opsKpis.lowStock) > 0 ? "warn" : "default"}
                      onPress={() => navigation.navigate("AdminInventory")}
                    />
                    <AdminKpiCard
                      label="Riders live GPS"
                      value={opsKpis.partnersOnline}
                      onPress={() => navigation.navigate("AdminDelivery")}
                    />
                    <AdminKpiCard
                      label="Need reassign"
                      value={opsKpis.needsReassign}
                      tone={Number(opsKpis.needsReassign) > 0 ? "hot" : "default"}
                      onPress={() => navigation.navigate("AdminOrders")}
                    />
                  </AdminKpiGrid>
                </AdminPanel>
              </SectionReveal>

              <SectionReveal preset="fade-up" delay={60}>
                <AdminPanel
                  title="Last 30 days"
                  icon="trending-up-outline"
                  meta="Store pulse"
                  description="Revenue, orders, and cancel rate for the rolling month."
                  action="Analytics"
                  onAction={() => navigation.navigate("AdminAnalytics")}
                >
                  <AdminKpiGrid compact={compact} columns={4}>
                    <AdminKpiCard label="Revenue" value={kpis.revenue} onPress={() => navigation.navigate("AdminAnalytics")} />
                    <AdminKpiCard label="Orders" value={kpis.orders} onPress={() => navigation.navigate("AdminOrders")} />
                    <AdminKpiCard label="Avg. order" value={kpis.aov} />
                    <AdminKpiCard label="Cancel rate" value={kpis.refund} />
                  </AdminKpiGrid>
                </AdminPanel>
              </SectionReveal>

              <View style={[adminTwoColStyle(compact), styles.cols, compact && styles.colsCompact]}>
                <View style={adminTwoColMain(compact)}>
                  <SectionReveal preset="fade-up" delay={80}>
                    <AdminPanel title="Revenue" icon="cash-outline" meta="Last 14 days" description="Daily revenue bars for the last two weeks.">
                      <AdminRevenueBars labels={chartData.labels} values={chartData.values} />
                    </AdminPanel>
                  </SectionReveal>
                </View>
                <View style={adminTwoColAside(compact)}>
                  <SectionReveal preset="fade-up" delay={100}>
                    <AdminPanel title="Top categories" icon="pie-chart-outline" description="Share of catalogue by category.">
                      {categories.length ? (
                        categories.map((cat, idx) => (
                          <AdminCategoryBar key={`${cat.name}-${idx}`} name={cat.name} percent={cat.percent} />
                        ))
                      ) : (
                        <Text style={[styles.muted, { color: c.textMuted }]}>No category data yet</Text>
                      )}
                    </AdminPanel>
                  </SectionReveal>
                </View>
              </View>

              <SectionReveal preset="fade-up" delay={120}>
                <AdminPanel
                  title="Recent orders"
                  icon="receipt-outline"
                  description="Latest six orders — open a row to manage status and tracking."
                  action="View all"
                  onAction={() => navigation.navigate("AdminOrders")}
                  style={styles.ordersPanel}
                  noPadding
                >
                  <AdminDataTable
                    columns={orderColumns}
                    rows={recentOrders}
                    compact={compact}
                    onRowPress={(row) =>
                      navigation.navigate("AdminOrderDetail", {
                        orderId: String(row._id || row.id || ""),
                      })
                    }
                  />
                </AdminPanel>
              </SectionReveal>

              <SectionReveal preset="fade-up" delay={140}>
                <AdminToolsGrid navigation={navigation} current="AdminDashboard" compact={compact} />
              </SectionReveal>
            </View>
          )}
        </KankregAdminShell>
      </KankregScrollPage>
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    maxWidth: "100%",
  },
  denied: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  desk: adminShellContent(),
  banner: { marginBottom: spacing.md },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  cols: { marginTop: 0 },
  colsCompact: { marginTop: 0 },
  ordersPanel: { paddingHorizontal: 0, paddingBottom: 6 },
  attentionBtn: { marginBottom: 6, justifyContent: "flex-start" },
  attentionBtnText: { fontFamily: fonts.medium, fontSize: 12, textAlign: "left" },
  muted: {
    fontSize: 13,
    paddingVertical: spacing.sm,
  },
});
