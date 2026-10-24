import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminKpiCard, { AdminKpiGrid } from "../../components/admin/AdminKpiCard";
import AdminPanel from "../../components/admin/AdminPanel";
import AdminDataTable from "../../components/admin/AdminDataTable";
import AdminRevenueBars from "../../components/admin/AdminRevenueBars";
import AdminFilterTabs from "../../components/admin/AdminFilterTabs";
import AdminButton from "../../components/admin/AdminButton";
import AdminInput from "../../components/admin/AdminInput";
import AdminSelect from "../../components/admin/AdminSelect";
import AdminStatusPill from "../../components/admin/AdminStatusPill";
import AdminPagination from "../../components/admin/AdminPagination";
import { useAuth } from "../../context/AuthContext";
import { fetchAdminOverview } from "../../services/adminService";
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
import { formatRupees, formatWhole, timeAgo } from "../../utils/adminFormat";
import { getOrderStatusLabel } from "../../utils/orderStatus";
import PremiumLoader from "../../components/ui/PremiumLoader";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumButton from "../../components/ui/PremiumButton";
import SectionReveal from "../../components/motion/SectionReveal";

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 days" },
  { value: "last30", label: "Last 30 days" },
  { value: "thisMonth", label: "This month" },
  { value: "lastMonth", label: "Last month" },
  { value: "thisYear", label: "This year" },
  { value: "custom", label: "Custom dates" },
];

const READ_KEY = "@zeevan_overview_alerts_read";
const PAGE = 10;
const COPY = ADMIN_SCREEN_COPY.dashboard;
const DONUT = ["#244424", "#3C6248", "#C4A056", "#8A5A12", "#9A3B2F", "#5C6834", "#7A7460"];

function deltaLabel(n) {
  if (!Number.isFinite(n) || n === 0) return "Same as yesterday now";
  const abs = Math.abs(n);
  return `${n > 0 ? "+" : "−"}${formatWhole(abs)} vs yesterday now`;
}

function StatusDonut({ slices }) {
  const total = slices.reduce((s, x) => s + x.count, 0) || 1;
  return (
    <View style={styles.stackBar} accessibilityRole="image" accessibilityLabel="Orders by status">
      {slices.map((s, i) => (
        <View
          key={s.status}
          style={{ flexGrow: s.count / total, flexBasis: 0, height: 14, backgroundColor: s.color || DONUT[i % DONUT.length] }}
        />
      ))}
    </View>
  );
}

export default function AdminDashboardScreen({ navigation, route }) {
  const compact = useAdminCompactLayout();
  const { user, token } = useAuth();
  const { colors: c } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [group, setGroup] = useState("daily");
  const [storeId, setStoreId] = useState("all");
  const [readIds, setReadIds] = useState([]);
  const [storeQ, setStoreQ] = useState("");
  const [storeQLive, setStoreQLive] = useState("");
  const [storeStatus, setStoreStatus] = useState("any");
  const [storeSort, setStoreSort] = useState("name");
  const [storePage, setStorePage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setStoreQ(storeQLive.trim().toLowerCase()), 280);
    return () => clearTimeout(t);
  }, [storeQLive]);

  useEffect(() => {
    AsyncStorage.getItem(READ_KEY)
      .then((raw) => setReadIds(raw ? JSON.parse(raw) : []))
      .catch(() => {});
  }, []);

  const load = useCallback(
    async ({ pull = false } = {}) => {
      if (pull) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const query = { period, group };
        if (period === "custom") {
          query.from = customFrom;
          query.to = customTo;
        }
        setData(await fetchAdminOverview(token, query));
      } catch (err) {
        setError(err.message || "Unable to load overview.");
      } finally {
        setRefreshing(false);
        setLoading(false);
      }
    },
    [token, period, group, customFrom, customTo]
  );

  useEffect(() => {
    if (!user?.isAdmin) return;
    if (period === "custom" && (!customFrom || !customTo)) return;
    load();
  }, [user?.isAdmin, load, period, group]);

  const markRead = async (id) => {
    const next = [...new Set([...readIds, id])];
    setReadIds(next);
    await AsyncStorage.setItem(READ_KEY, JSON.stringify(next)).catch(() => {});
  };

  const go = (name, params) => navigation.navigate(name, params);

  const storeOptions = useMemo(() => {
    const rows = data?.stores || [];
    return [{ value: "all", label: "All stores" }, ...rows.map((s) => ({ value: s.id, label: s.name }))];
  }, [data?.stores]);

  const onStorePick = (id) => {
    setStoreId(id);
    setStorePage(1);
  };

  const storesView = useMemo(() => {
    let rows = [...(data?.stores || [])];
    if (storeId !== "all") rows = rows.filter((s) => s.id === storeId);
    if (storeStatus === "active") rows = rows.filter((s) => s.active);
    if (storeStatus === "inactive") rows = rows.filter((s) => !s.active);
    if (storeQ) {
      rows = rows.filter((s) => `${s.name} ${s.id}`.toLowerCase().includes(storeQ));
    }
    rows.sort((a, b) => {
      if (storeSort === "problems") return Number(!b.active) - Number(!a.active);
      return String(a.name).localeCompare(String(b.name));
    });
    return rows;
  }, [data?.stores, storeId, storeStatus, storeQ, storeSort]);

  const storePages = Math.max(1, Math.ceil(storesView.length / PAGE));
  const storeRows = storesView.slice((storePage - 1) * PAGE, storePage * PAGE);

  const alerts = (data?.alerts || []).filter((a) => !readIds.includes(a.id));
  const kpiCols = compact ? 2 : 4;
  const today = data?.today || {};
  const attn = data?.attention || {};
  const biz = data?.business || {};

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <View style={styles.denied}>
            <PremiumErrorBanner severity="warning" title={ADMIN_GATE.title} message="This account does not have admin privileges." />
            <PremiumButton label={ADMIN_GATE.backHome} iconLeft="home-outline" variant="primary" onPress={() => navigation.navigate("Home")} />
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
        refreshControl={Platform.OS === "web" ? undefined : <RefreshControl refreshing={refreshing} onRefresh={() => load({ pull: true })} />}
      >
        <KankregAdminShell navigation={navigation} route={route || { name: "AdminDashboard" }} title={COPY.title} subtitle={COPY.subtitle}>
          {error ? <PremiumErrorBanner severity="error" message={error} compact style={styles.banner} /> : null}
          {loading && !data ? (
            <PremiumLoader caption="Loading overview…" />
          ) : (
            <View style={styles.desk}>
              <View style={[styles.filterBar, compact && styles.filterStack]}>
                <AdminSelect compact label="Period" value={period} onChange={setPeriod} options={PERIODS} minMenuWidth={180} />
                {storeOptions.length > 2 ? (
                  <AdminSelect compact label="Store" value={storeId} onChange={onStorePick} options={storeOptions} minMenuWidth={180} />
                ) : null}
                <AdminFilterTabs
                  value={group}
                  onChange={setGroup}
                  items={[
                    { key: "daily", label: "Daily" },
                    { key: "weekly", label: "Weekly" },
                    { key: "monthly", label: "Monthly" },
                  ]}
                />
                <AdminButton label="Refresh" icon="refresh-outline" onPress={() => load({ pull: true })} loading={refreshing} />
                <AdminButton label="Analytics" icon="stats-chart-outline" variant="ghost" onPress={() => go("AdminAnalytics")} />
              </View>

              {period === "custom" ? (
                <View style={[styles.filterBar, compact && styles.filterStack]}>
                  <AdminInput label="From" value={customFrom} onChangeText={setCustomFrom} placeholder="YYYY-MM-DD" />
                  <AdminInput label="To" value={customTo} onChangeText={setCustomTo} placeholder="YYYY-MM-DD" />
                  <AdminButton label="Apply" variant="primary" onPress={() => load()} disabled={!customFrom || !customTo} />
                </View>
              ) : null}

              <SectionReveal preset="fade-up">
                <AdminPanel title="Today" icon="sunny-outline" description="Compared with yesterday at this same time.">
                  <AdminKpiGrid compact={compact} columns={kpiCols}>
                    <AdminKpiCard
                      label="Sales today"
                      value={formatRupees(today.sales)}
                      delta={deltaLabel(today.salesDelta)}
                      deltaUp={(today.salesDelta || 0) >= 0}
                      onPress={() => go("AdminOrders", { range: "today" })}
                    />
                    <AdminKpiCard
                      label="Orders today"
                      value={formatWhole(today.orders)}
                      delta={deltaLabel(today.ordersDelta)}
                      deltaUp={(today.ordersDelta || 0) >= 0}
                      onPress={() => go("AdminOrders", { range: "today" })}
                    />
                    <AdminKpiCard
                      label="Orders to deliver"
                      value={formatWhole(today.toDeliver)}
                      tone={today.toDeliver > 0 ? "hot" : "default"}
                      onPress={() => go("AdminOrders", { tab: "active" })}
                    />
                  </AdminKpiGrid>
                </AdminPanel>
              </SectionReveal>

              <SectionReveal preset="fade-up" delay={20}>
                <AdminPanel title="Needs your attention" icon="alert-circle-outline">
                  <AdminKpiGrid compact={compact} columns={kpiCols}>
                    {attn.cashDue > 0 ? (
                      <AdminKpiCard label="Cash still due" value={formatWhole(attn.cashDue)} tone="hot" onPress={() => go("AdminCash")} />
                    ) : null}
                    {attn.support > 0 ? (
                      <AdminKpiCard label="Support to reply" value={formatWhole(attn.support)} tone="warn" onPress={() => go("AdminSupport")} />
                    ) : null}
                    <AdminKpiCard
                      label="Low stock"
                      value={formatWhole(attn.lowStock)}
                      tone={attn.lowStock > 0 ? "warn" : "default"}
                      onPress={() => go("AdminInventory", { filter: "low" })}
                    />
                    <AdminKpiCard
                      label="Out of stock"
                      value={formatWhole(attn.outOfStock)}
                      tone={attn.outOfStock > 0 ? "hot" : "default"}
                      onPress={() => go("AdminInventory", { filter: "out" })}
                    />
                    {attn.inactiveStores > 0 ? (
                      <AdminKpiCard label="Inactive shops" value={formatWhole(attn.inactiveStores)} tone="warn" onPress={() => go("AdminDelivery")} />
                    ) : null}
                  </AdminKpiGrid>
                </AdminPanel>
              </SectionReveal>

              <SectionReveal preset="fade-up" delay={40}>
                <AdminPanel title="Your business" icon="business-outline">
                  <AdminKpiGrid compact={compact} columns={kpiCols}>
                    <AdminKpiCard
                      label="Stores"
                      value={formatWhole(biz.stores)}
                      delta={biz.inactiveStores ? `${biz.inactiveStores} inactive` : undefined}
                      deltaUp={false}
                      onPress={() => go("AdminDelivery")}
                    />
                    <AdminKpiCard label="Active stores" value={formatWhole(biz.activeStores)} onPress={() => go("AdminDelivery")} />
                    <AdminKpiCard label="Active products" value={formatWhole(biz.activeProducts)} onPress={() => go("AdminProducts")} />
                    <AdminKpiCard label="Active variants" value={formatWhole(biz.activeVariants)} onPress={() => go("AdminProducts")} />
                    <AdminKpiCard label="Stock lines" value={formatWhole(biz.stockLines)} onPress={() => go("AdminInventory")} />
                    <AdminKpiCard label="Stock value" value={formatRupees(biz.stockValue)} onPress={() => go("AdminInventory")} />
                  </AdminKpiGrid>
                </AdminPanel>
              </SectionReveal>

              <View style={[adminTwoColStyle(compact), compact && styles.stack]}>
                <View style={adminTwoColMain(compact)}>
                  <AdminPanel
                    title={`Sales · ${formatRupees(data?.sales?.booked)} booked`}
                    icon="trending-up-outline"
                    description="Booked excludes cancelled, unpaid, and failed payments. Delivered is already completed."
                    action="Analytics"
                    onAction={() => go("AdminAnalytics")}
                  >
                    {data?.sales?.chart?.length ? (
                      <AdminRevenueBars
                        labels={(data.sales.chart || []).map((r) => r.label)}
                        values={(data.sales.chart || []).map((r) => r.booked)}
                      />
                    ) : (
                      <View style={styles.emptyBox}>
                        <Text style={[styles.empty, { color: c.textMuted }]}>{COPY.emptySales}</Text>
                        <AdminButton label={COPY.emptySalesLink} variant="ghost" onPress={() => setPeriod("last30")} />
                      </View>
                    )}
                  </AdminPanel>
                </View>
                <View style={adminTwoColAside(compact)}>
                  <AdminPanel title="Alerts" icon="notifications-outline" meta={alerts.length ? `${alerts.length}` : "None"}>
                    {alerts.length ? (
                      alerts.map((alert) => (
                        <Pressable
                          key={alert.id}
                          onPress={() => {
                            markRead(alert.id);
                            if (alert.href) go(alert.href, alert.hrefParams);
                          }}
                          style={[styles.alert, alert.level === "danger" && styles.alertHot, alert.level === "warn" && styles.alertWarn]}
                        >
                          <Text style={styles.alertTitle}>{alert.title}</Text>
                          <Text style={[styles.alertText, { color: c.textSecondary }]}>{alert.text}</Text>
                        </Pressable>
                      ))
                    ) : (
                      <Text style={[styles.empty, { color: c.textMuted }]}>Nothing waiting.</Text>
                    )}
                  </AdminPanel>
                </View>
              </View>

              <View style={[adminTwoColStyle(compact), compact && styles.stack]}>
                <View style={adminTwoColMain(compact)}>
                  <AdminPanel
                    title="Store performance"
                    icon="storefront-outline"
                    action={COPY.addStore}
                    onAction={() => go("AdminDelivery")}
                  >
                    {data?.stores?.length ? (
                      <AdminDataTable
                        compact={compact}
                        columns={[
                          { key: "name", label: "Store", flex: 1.4, strong: true, render: (r) => (r.main ? `${r.name} · Main` : r.name) },
                          { key: "sales", label: "Sales", flex: 1, render: () => formatRupees(data?.sales?.booked) },
                          { key: "orders", label: "Orders", width: 72, render: () => formatWhole(data?.sales?.bookedOrders) },
                          { key: "stock", label: "Stock value", flex: 1, render: () => formatRupees(biz.stockValue) },
                          {
                            key: "status",
                            label: "Status",
                            flex: 0.8,
                            render: (r) => <AdminStatusPill label={r.active ? "Active" : "Inactive"} tone={r.active ? "success" : "warn"} />,
                          },
                        ]}
                        rows={storeId === "all" ? data.stores : data.stores.filter((s) => s.id === storeId)}
                        onRowPress={() => go("AdminDelivery")}
                      />
                    ) : (
                      <View style={styles.emptyBox}>
                        <Text style={[styles.empty, { color: c.textMuted }]}>{COPY.emptyStores}</Text>
                        <AdminButton label={COPY.addStore} variant="ghost" onPress={() => go("AdminDelivery")} />
                      </View>
                    )}
                  </AdminPanel>
                </View>
                <View style={adminTwoColAside(compact)}>
                  <AdminPanel title="Orders by status" icon="pie-chart-outline" action="Orders desk" onAction={() => go("AdminOrders")}>
                    {data?.ordersByStatus?.length ? (
                      <View style={styles.stack}>
                        <StatusDonut
                          slices={(data.ordersByStatus || []).map((s, i) => ({
                            ...s,
                            color: DONUT[i % DONUT.length],
                          }))}
                        />
                        <View style={{ gap: 6 }}>
                          {(data.ordersByStatus || []).map((row) => (
                            <Text key={row.status} style={[styles.alertText, { color: c.textPrimary }]}>
                              {getOrderStatusLabel(row.status)} · {formatWhole(row.count)}
                            </Text>
                          ))}
                        </View>
                      </View>
                    ) : (
                      <Text style={[styles.empty, { color: c.textMuted }]}>{COPY.emptyOrders}</Text>
                    )}
                  </AdminPanel>
                </View>
              </View>

              <View style={[adminTwoColStyle(compact), compact && styles.stack]}>
                <View style={adminTwoColMain(compact)}>
                  <AdminPanel
                    title="Inventory"
                    icon="cube-outline"
                    action="Inventory dashboard"
                    onAction={() => go("AdminInventory")}
                  >
                    <AdminKpiGrid compact={compact} columns={3}>
                      <AdminKpiCard label="In stock" value={formatWhole(data?.inventory?.inStock)} onPress={() => go("AdminInventory", { filter: "in_stock" })} />
                      <AdminKpiCard label="Low stock" value={formatWhole(data?.inventory?.lowStock)} tone="warn" onPress={() => go("AdminInventory", { filter: "low" })} />
                      <AdminKpiCard label="Out of stock" value={formatWhole(data?.inventory?.outOfStock)} tone="hot" onPress={() => go("AdminInventory", { filter: "out" })} />
                    </AdminKpiGrid>
                    <Text style={[styles.hint, { color: c.textMuted }]}>On hand stays per unit — kg, litre, piece and pack are not added together.</Text>
                    {(data?.inventory?.onHand || []).map((row) => (
                      <Text key={row.unit} style={[styles.alertText, { color: c.textPrimary }]}>
                        {formatWhole(row.qty)} {row.unit}
                      </Text>
                    ))}
                    <AdminButton label="Central inventory" variant="ghost" onPress={() => go("AdminInventory")} />
                  </AdminPanel>
                </View>
                <View style={adminTwoColAside(compact)}>
                  <AdminPanel title="Top products" icon="star-outline" description="Delivered only.">
                    {data?.topProducts?.length ? (
                      <AdminDataTable
                        compact={compact}
                        columns={[
                          { key: "name", label: "Product", flex: 1.4, strong: true },
                          { key: "quantity", label: "Qty", width: 56 },
                          { key: "revenue", label: "Revenue", flex: 1, render: (r) => formatRupees(r.revenue) },
                        ]}
                        rows={data.topProducts}
                      />
                    ) : (
                      <Text style={[styles.empty, { color: c.textMuted }]}>{COPY.emptyTop}</Text>
                    )}
                  </AdminPanel>
                </View>
              </View>

              <AdminPanel title="Stores" icon="map-outline" description="Shop pins. Sales stay on the whole business — stock is not split per shop.">
                <View style={[styles.filterBar, compact && styles.filterStack]}>
                  <AdminInput label="Search" value={storeQLive} onChangeText={setStoreQLive} placeholder="Name or ID" />
                  <AdminSelect
                    compact
                    label="Status"
                    value={storeStatus}
                    onChange={(v) => {
                      setStoreStatus(v);
                      setStorePage(1);
                    }}
                    options={[
                      { value: "any", label: "Any status" },
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                    ]}
                  />
                  <AdminSelect
                    compact
                    label="Sort"
                    value={storeSort}
                    onChange={setStoreSort}
                    options={[
                      { value: "name", label: "Name" },
                      { value: "problems", label: "Most stock problems" },
                    ]}
                  />
                </View>
                {storeRows.length ? (
                  <AdminDataTable
                    compact={compact}
                    columns={[
                      {
                        key: "name",
                        label: "Store",
                        flex: 1.6,
                        strong: true,
                        render: (r) => `${r.name}${r.main ? " · Main" : ""}`,
                      },
                      {
                        key: "manager",
                        label: "Manager",
                        flex: 0.8,
                        render: () => <Text style={{ color: "#8A5A12", fontFamily: fonts.semibold }}>None</Text>,
                      },
                      {
                        key: "active",
                        label: "Status",
                        flex: 0.8,
                        render: (r) => <AdminStatusPill label={r.active ? "Active" : "Inactive"} tone={r.active ? "success" : "warn"} />,
                      },
                      { key: "delivery", label: "Delivery", width: 80, render: (r) => (r.deliveryOn ? "On" : "Off") },
                      { key: "radius", label: "Radius", width: 72, render: (r) => `${r.radiusKm || 0} km` },
                    ]}
                    rows={storeRows}
                    onRowPress={() => go("AdminDelivery")}
                  />
                ) : (
                  <View style={styles.emptyBox}>
                    <Text style={[styles.empty, { color: c.textMuted }]}>{COPY.emptyStores}</Text>
                    <AdminButton label={COPY.addStore} variant="ghost" onPress={() => go("AdminDelivery")} />
                  </View>
                )}
                <AdminPagination
                  page={storePage}
                  pages={storePages}
                  total={storesView.length}
                  pageSize={PAGE}
                  onPage={setStorePage}
                  noun="stores"
                />
              </AdminPanel>

              {attn.cashDue > 0 ? (
                <AdminPanel title="Store cash" icon="cash-outline" action="Collect" onAction={() => go("AdminCash")}>
                  <AdminKpiCard label="Outstanding COD" value={formatWhole(data?.cash?.outstandingOrders)} tone="hot" onPress={() => go("AdminCash")} />
                </AdminPanel>
              ) : null}

              <View style={[compact ? styles.stack : styles.three]}>
                <AdminPanel title="Products and categories" icon="pricetag-outline" style={styles.colPanel}>
                  <Text style={[styles.alertText, { color: c.textPrimary }]}>
                    {formatWhole(data?.catalog?.products)} products · {formatWhole(data?.catalog?.active)} active · {formatWhole(data?.catalog?.inactive)} inactive
                  </Text>
                  <Text style={[styles.alertText, { color: c.textPrimary }]}>{formatWhole(data?.catalog?.activeVariants)} active variants</Text>
                  <Text style={[styles.alertText, { color: c.textPrimary }]}>{formatWhole(data?.catalog?.noPicture)} without a picture</Text>
                  {(data?.catalog?.categories || []).slice(0, 8).map((cat) => (
                    <Text key={cat.name} style={[styles.alertText, { color: c.textSecondary }]}>
                      {cat.name} · {cat.active}/{cat.total} active
                    </Text>
                  ))}
                  <View style={styles.linkRow}>
                    <AdminButton label="Product Management" variant="ghost" onPress={() => go("AdminProducts")} />
                    <AdminButton label="Add product" variant="ghost" onPress={() => go("AdminAddProduct")} />
                  </View>
                </AdminPanel>
                <AdminPanel title="Delivery areas" icon="navigate-outline" action="Delivery Area Management" onAction={() => go("AdminDelivery")} style={styles.colPanel}>
                  <Text style={[styles.alertText, { color: c.textPrimary }]}>Delivery overall {data?.delivery?.shopOpen ? "On" : "Off"}</Text>
                  <Text style={[styles.alertText, { color: c.textPrimary }]}>
                    {formatWhole(data?.delivery?.storesDelivering)} delivering · {formatWhole(data?.delivery?.storesNotDelivering)} not
                  </Text>
                  <Text style={[styles.alertText, { color: c.textPrimary }]}>
                    {formatWhole(data?.delivery?.activeZones)} active zones · {formatWhole(data?.delivery?.pinCount)} PINs · {formatWhole(data?.delivery?.localityCount)} localities
                  </Text>
                  <Text style={[styles.alertText, { color: c.textPrimary }]}>{formatWhole(data?.delivery?.drawnAreas)} drawn areas</Text>
                </AdminPanel>
                <AdminPanel title="Recent activity" icon="time-outline" action="Orders" onAction={() => go("AdminOrders")} style={styles.colPanel}>
                  {(data?.activity || []).length ? (
                    (data.activity || []).map((row) => (
                      <Pressable key={row.id} onPress={() => go("AdminOrderDetail", { orderId: row.id })} style={styles.activity}>
                        <Text style={styles.alertTitle}>{getOrderStatusLabel(row.action)}</Text>
                        <Text style={[styles.alertText, { color: c.textMuted }]}>
                          {row.who || "System"} · {timeAgo(row.at)}
                        </Text>
                      </Pressable>
                    ))
                  ) : (
                    <Text style={[styles.empty, { color: c.textMuted }]}>No recent order changes.</Text>
                  )}
                </AdminPanel>
              </View>
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
  filterBar: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end", gap: 10 },
  filterStack: { flexDirection: "column", alignItems: "stretch" },
  stack: { flexDirection: "column" },
  three: { flexDirection: "row", flexWrap: "wrap", gap: 12, alignItems: "stretch" },
  colPanel: { flexGrow: 1, flexBasis: 260, minWidth: 240 },
  emptyBox: { gap: 8, paddingVertical: 8 },
  empty: { fontSize: 13, fontFamily: fonts.medium },
  hint: { fontSize: 12, marginTop: 10, marginBottom: 6 },
  alert: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: "rgba(31,51,31,0.08)", marginBottom: 8, gap: 2 },
  alertHot: { borderColor: "rgba(154,59,47,0.28)", backgroundColor: "rgba(154,59,47,0.06)" },
  alertWarn: { borderColor: "rgba(138,90,18,0.28)", backgroundColor: "rgba(138,90,18,0.06)" },
  alertTitle: { fontFamily: fonts.semibold, fontSize: 13 },
  alertText: { fontSize: 12.5, lineHeight: 18 },
  stackBar: { flexDirection: "row", height: 14, borderRadius: 99, overflow: "hidden", marginBottom: 10 },
  linkRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  activity: { paddingVertical: 6, gap: 2 },
});
