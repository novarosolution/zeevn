import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, RefreshControl, StyleSheet, Text, View } from "react-native";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import { formatOrderPublicRef } from "../../content/appContent";
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
  fetchAdminDeskSummary,
  fetchAdminOpsSummary,
  searchAdminOrders,
} from "../../services/adminService";
import { useTheme } from "../../context/ThemeContext";
import {
  adminShellContent,
  adminTwoColAside,
  adminTwoColMain,
  adminTwoColStyle,
  useAdminCompactLayout,
} from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, spacing } from "../../theme/tokens";
import { formatINR, formatINRCompact } from "../../utils/currency";
import { getOrderItemQty } from "../../utils/adminOrderHelpers";
import { getOrderStatusLabel } from "../../utils/orderStatus";
import AdminButton from "../../components/admin/AdminButton";
import PremiumLoader from "../../components/ui/PremiumLoader";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import SectionReveal from "../../components/motion/SectionReveal";

function countStatuses(byStatus, names) {
  return names.reduce((total, status) => total + (Number(byStatus?.[status]) || 0), 0);
}

function paymentLabel(order) {
  const method = String(order.paymentMethod || "");
  if (method === "Cash on Delivery") return "COD";
  if (method.toLowerCase().includes("youpi")) return "YouPI";
  if (method.toLowerCase().includes("razor")) return "Razorpay";
  return method || "—";
}

function shortDay(label) {
  const afterComma = String(label || "").split(",")[1];
  return afterComma ? afterComma.trim().split(/\s+/)[0] : String(label || "").slice(0, 3);
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
  const [desk, setDesk] = useState(null);
  const [orders, setOrders] = useState([]);

  const load = useCallback(
    async ({ pull = false } = {}) => {
      if (pull) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const [a, orderPage, opsSummary, deskSummary] = await Promise.all([
          fetchAdminAnalytics(token, { range: "30d" }),
          searchAdminOrders(token, { pageSize: 6, page: 1 }),
          fetchAdminOpsSummary(token),
          fetchAdminDeskSummary(token),
        ]);
        setAnalytics(a);
        setOps(opsSummary);
        setDesk(deskSummary);
        setOrders(Array.isArray(orderPage?.items) ? orderPage.items : []);
      } catch (err) {
        setError(err.message || "Unable to load the dashboard.");
      } finally {
        setRefreshing(false);
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (!user?.isAdmin) return;
    load();
  }, [user?.isAdmin, load]);

  const go = (name, params) => navigation.navigate(name, params);
  const k = ops?.kpis || {};
  const byStatus = desk?.orders?.byStatus || {};
  const shopOpen = desk?.store?.open !== false;
  const today = desk?.orders?.today || {};
  const attention = (Array.isArray(ops?.attention) ? ops.attention : []).slice(0, 8);

  const deliveredToday = Number(desk?.orders?.deliveredToday) || 0;

  const kpis = useMemo(() => {
    const revenue = analytics?.revenue?.total ?? 0;
    const count = analytics?.totals?.orders ?? 0;
    const cancelled = analytics?.funnel?.cancelledOrders ?? 0;
    const aov = analytics?.revenue?.averageOrderValue ?? 0;
    return {
      revenue: formatINRCompact(revenue),
      orders: Number(count).toLocaleString("en-IN"),
      aov: formatINR(Math.round(aov)),
      cancel: count ? `${((cancelled / count) * 100).toFixed(1)}%` : "0%",
    };
  }, [analytics]);

  const chart = useMemo(() => {
    const series = analytics?.trends?.rangeSeries;
    const labels = series?.labels || [];
    const revenues = series?.revenues || [];
    const start = Math.max(0, labels.length - 14);
    return {
      labels: labels.slice(start).map(shortDay),
      values: revenues.slice(start),
    };
  }, [analytics]);

  const categories = useMemo(() => {
    const cats = analytics?.inventory?.topCategories || [];
    const total = cats.reduce((sum, row) => sum + Number(row.count || 0), 0) || 1;
    return cats.slice(0, 4).map((row) => ({
      name: row.name,
      percent: Math.round((Number(row.count || 0) / total) * 100),
    }));
  }, [analytics]);

  const recent = orders.slice(0, 6);
  const orderColumns = useMemo(
    () => [
      { key: "ref", label: "Order", flex: 1.1, render: (row) => formatOrderPublicRef(row) || "—" },
      {
        key: "customer",
        label: "Customer",
        flex: 1.2,
        render: (row) => row.user?.name || row.shippingAddress?.fullName || "Guest",
      },
      { key: "items", label: "Qty", width: 56, render: (row) => String(getOrderItemQty(row)) },
      { key: "total", label: "Total", flex: 0.9, render: (row) => formatINR(row.totalPrice || 0) },
      { key: "payment", label: "Payment", flex: 0.8, render: (row) => paymentLabel(row) },
      {
        key: "status",
        label: "Status",
        flex: 1,
        render: (row) => <AdminStatusPill label={getOrderStatusLabel(row.status)} tone={orderStatusTone(row.status)} />,
      },
    ],
    []
  );

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <View style={styles.denied}>
            <PremiumErrorBanner severity="warning" title={ADMIN_GATE.title} message="This account does not have admin privileges." />
            <AdminButton label={ADMIN_GATE.backHome} icon="home-outline" variant="primary" onPress={() => go("Home")} />
          </View>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

  const tone = (n) => (Number(n) > 0 ? "warn" : "default");

  return (
    <AdminScreenShell style={styles.screen}>
      <KankregScrollPage
        scrollVariant="admin"
        showFooter={false}
        style={customerScrollFill}
        refreshControl={Platform.OS === "web" ? undefined : <RefreshControl refreshing={refreshing} onRefresh={() => load({ pull: true })} />}
      >
        <KankregAdminShell
          navigation={navigation}
          route={route || { name: "AdminDashboard" }}
          title={ADMIN_SCREEN_COPY.dashboard.title}
          subtitle={ADMIN_SCREEN_COPY.dashboard.subtitle}
        >
          {error ? <PremiumErrorBanner severity="error" message={error} compact style={styles.banner} /> : null}
          {loading && !ops ? (
            <PremiumLoader caption="Loading overview…" />
          ) : (
            <View style={styles.desk}>
              <SectionReveal preset="fade-up">
                <AdminPanel
                  title="Needs you"
                  icon="flash-outline"
                  meta={shopOpen ? "Shop open" : "Shop closed"}
                  description="Gold or red tiles need work. Tap one to open it."
                  action={shopOpen ? undefined : "Open shop"}
                  onAction={shopOpen ? undefined : () => go("AdminSettings")}
                >
                  <AdminKpiGrid compact={compact}>
                    <AdminKpiCard icon="sparkles-outline" label="New orders" hint={countStatuses(byStatus, ["pending"]) ? "Confirm now" : "None waiting"} value={String(countStatuses(byStatus, ["pending"]))} tone={tone(countStatuses(byStatus, ["pending"]))} onPress={() => go("AdminOrders", { tab: "new" })} />
                    <AdminKpiCard icon="cube-outline" label="Packing" hint="Being packed" value={String(countStatuses(byStatus, ["confirmed", "preparing", "paid"]))} onPress={() => go("AdminOrders", { tab: "packing" })} />
                    <AdminKpiCard icon="bicycle-outline" label="Out for delivery" hint="With a rider" value={String(k.outForDelivery ?? 0)} onPress={() => go("AdminOrders", { tab: "onroute" })} />
                    <AdminKpiCard icon="person-add-outline" label="Need a rider" hint={k.pendingAccept ? "Assign a rider" : "All assigned"} value={String(k.pendingAccept ?? 0)} tone={tone(k.pendingAccept)} onPress={() => go("AdminDispatch")} />
                    <AdminKpiCard icon="alert-circle-outline" label="Low stock" hint={k.lowStock ? "Top up soon" : "Healthy"} value={String(k.lowStock ?? 0)} tone={tone(k.lowStock)} onPress={() => go("AdminInventory", { filter: "low" })} />
                    <AdminKpiCard icon="close-circle-outline" label="Out of stock" hint={k.outOfStock ? "Restock" : "All in stock"} value={String(k.outOfStock ?? 0)} tone={tone(k.outOfStock)} onPress={() => go("AdminInventory", { filter: "out" })} />
                    <AdminKpiCard icon="chatbubble-ellipses-outline" label="Support" hint={desk?.support?.awaitingReply ? "Reply" : "Caught up"} value={String(desk?.support?.awaitingReply ?? 0)} tone={tone(desk?.support?.awaitingReply)} onPress={() => go("AdminSupport")} />
                    <AdminKpiCard icon="cash-outline" label="Cash due" hint={desk?.orders?.cashDue ? "Collect COD" : "Nothing due"} value={String(desk?.orders?.cashDue ?? 0)} tone={Number(desk?.orders?.cashDue) > 0 ? "hot" : "default"} onPress={() => go("AdminCash")} />
                  </AdminKpiGrid>
                </AdminPanel>
              </SectionReveal>

              <SectionReveal preset="fade-up" delay={20}>
                <AdminPanel
                  title="Today"
                  icon="sunny-outline"
                  description="Since midnight. Cancelled orders are left out."
                >
                  <AdminKpiGrid compact={compact}>
                    <AdminKpiCard icon="receipt-outline" label="Orders" hint="Today" value={String(today.count ?? 0)} onPress={() => go("AdminOrders", { range: "today" })} />
                    <AdminKpiCard icon="cash-outline" label="Revenue" hint="Today" value={formatINRCompact(today.revenue || 0)} onPress={() => go("AdminOrders", { range: "today" })} />
                    <AdminKpiCard icon="storefront-outline" label="Counter" hint="Walk-in today" value={formatINRCompact(desk?.orders?.counterToday?.revenue || 0)} onPress={() => go("AdminOrders", { tab: "counter" })} />
                    <AdminKpiCard icon="cash-outline" label="Open till" hint="Take a walk-in" value="POS" onPress={() => go("AdminCounter")} />
                    <AdminKpiCard icon="checkmark-done-outline" label="Delivered" hint="Done today" value={String(deliveredToday)} onPress={() => go("AdminOrders", { tab: "delivered" })} />
                    <AdminKpiCard icon="navigate-outline" label="Riders online" hint="On the map" value={String(k.partnersOnline ?? 0)} onPress={() => go("AdminRiderMap")} />
                  </AdminKpiGrid>
                </AdminPanel>
              </SectionReveal>

              {attention.length ? (
                <SectionReveal preset="fade-up" delay={40}>
                  <AdminPanel title="Needs attention" icon="alert-circle-outline" meta={`${attention.length}`} action="Orders" onAction={() => go("AdminOrders", { tab: "attention" })}>
                    {attention.map((item) => (
                      <AdminButton
                        key={String(item._id)}
                        label={`${formatOrderPublicRef(item) || "Order"} · ${item.reason}`}
                        variant="soft"
                        size="sm"
                        fullWidth
                        iconRight="chevron-forward"
                        onPress={() => go("AdminOrderDetail", { orderId: String(item._id) })}
                        style={styles.attentionBtn}
                        textStyle={styles.attentionBtnText}
                      />
                    ))}
                  </AdminPanel>
                </SectionReveal>
              ) : null}

              <SectionReveal preset="fade-up" delay={50}>
                <AdminPanel title="Last 30 days" icon="trending-up-outline" action="Analytics" onAction={() => go("AdminAnalytics")}>
                  <AdminKpiGrid compact={compact}>
                    <AdminKpiCard icon="trending-up-outline" label="Revenue" hint="30 days" value={kpis.revenue} onPress={() => go("AdminAnalytics")} />
                    <AdminKpiCard icon="receipt-outline" label="Orders" hint="30 days" value={kpis.orders} onPress={() => go("AdminOrders")} />
                    <AdminKpiCard icon="pricetag-outline" label="Avg. order" hint="Per order" value={kpis.aov} />
                    <AdminKpiCard icon="close-circle-outline" label="Cancel rate" hint="Cancelled" value={kpis.cancel} />
                  </AdminKpiGrid>
                </AdminPanel>
              </SectionReveal>

              <View style={[adminTwoColStyle(compact), styles.cols]}>
                <View style={adminTwoColMain(compact)}>
                  <AdminPanel title="Revenue" icon="cash-outline" meta="Last 14 days" description="One bar per day. Tallest day is gold.">
                    <AdminRevenueBars labels={chart.labels} values={chart.values} />
                  </AdminPanel>
                </View>
                <View style={adminTwoColAside(compact)}>
                  <AdminPanel title="Top categories" icon="pie-chart-outline">
                    {categories.length ? (
                      categories.map((cat) => <AdminCategoryBar key={cat.name} name={cat.name} percent={cat.percent} />)
                    ) : (
                      <Text style={[styles.muted, { color: c.textMuted }]}>No category data yet</Text>
                    )}
                  </AdminPanel>
                </View>
              </View>

              <AdminPanel title="Recent orders" icon="receipt-outline" action="View all" onAction={() => go("AdminOrders")} noPadding>
                <AdminDataTable
                  columns={orderColumns}
                  rows={recent}
                  compact={compact}
                  onRowPress={(row) => go("AdminOrderDetail", { orderId: String(row._id || "") })}
                />
              </AdminPanel>

              <AdminToolsGrid navigation={navigation} current="AdminDashboard" compact={compact} />
            </View>
          )}
        </KankregAdminShell>
      </KankregScrollPage>
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, width: "100%", alignSelf: "center", maxWidth: "100%" },
  denied: { padding: spacing.lg, gap: spacing.md },
  desk: adminShellContent(),
  banner: { marginBottom: spacing.md },
  cols: { marginTop: 0 },
  attentionBtn: { marginBottom: 6, justifyContent: "flex-start" },
  attentionBtnText: { fontFamily: fonts.medium, fontSize: 12, textAlign: "left" },
  muted: { fontSize: 13, paddingVertical: spacing.sm },
});
