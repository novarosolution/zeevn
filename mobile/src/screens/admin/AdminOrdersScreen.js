import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminButton from "../../components/admin/AdminButton";
import AdminFilterTabs from "../../components/admin/AdminFilterTabs";
import AdminInput from "../../components/admin/AdminInput";
import AdminPagination from "../../components/admin/AdminPagination";
import AdminSelect from "../../components/admin/AdminSelect";
import AdminStatTile, { AdminStatGrid } from "../../components/admin/AdminStatTile";
import AdminToolbar from "../../components/admin/AdminToolbar";
import { AdminDialog, useAdminConfirm } from "../../components/admin/AdminDialog";
import AdminBulkBar from "../../components/admin/orders/AdminBulkBar";
import AdminOrderDrawer from "../../components/admin/orders/AdminOrderDrawer";
import AdminOrdersTable from "../../components/admin/orders/AdminOrdersTable";
import useOrderActions from "../../components/admin/orders/useOrderActions";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import { useAuth } from "../../context/AuthContext";
import { useLiveSocket } from "../../context/LiveSocketContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import {
  bulkAssignAdminOrderRider,
  bulkUpdateAdminOrderStatus,
  fetchAdminDeliveryZones,
  fetchAdminRiders,
  searchAdminOrders,
  updateAdminOrderPayment,
} from "../../services/adminService";
import { refreshAdminDesk } from "../../services/adminDeskStore";
import { adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, spacing } from "../../theme/tokens";
import { exportOrdersCsv } from "../../utils/adminOrderHelpers";
import { isCod, orderRef } from "../../utils/adminOrderUi";
import { formatRupees, plural } from "../../utils/adminFormat";

const EMPTY = {
  items: [],
  total: 0,
  page: 1,
  pages: 1,
  pageSize: 25,
  counts: { all: 0, byStatus: {}, attention: 0, cashDue: 0 },
  totals: { count: 0, revenue: 0 },
};

/** Pipeline stages shown as the big tiles. `status` is the bucket the API understands. */
const PIPELINE = [
  { key: "new", label: "New", icon: "sparkles-outline", tone: "gold", status: "new", hint: "Confirm these first", count: (b) => b.pending || 0 },
  { key: "packing", label: "Packing", icon: "cube-outline", tone: "olive", status: "packing", hint: "Being packed", count: (b) => (b.confirmed || 0) + (b.paid || 0) + (b.preparing || 0) },
  { key: "ready", label: "Ready", icon: "bag-check-outline", tone: "teal", status: "ready", hint: "Waiting for a rider", count: (b) => b.ready_for_pickup || 0 },
  { key: "onroute", label: "On the way", icon: "bicycle-outline", tone: "blue", status: "onroute", hint: "With a rider now", count: (b) => (b.out_for_delivery || 0) + (b.shipped || 0) },
  { key: "delivered", label: "Delivered", icon: "checkmark-done-outline", tone: "green", status: "delivered", hint: "Completed", count: (b) => b.delivered || 0 },
];
const SIDE_TABS = {
  all: {},
  attention: { attention: true },
  unpaid: { status: "unpaid" },
  cash: { payment: "cod_due" },
  counter: { channel: "walk_in" },
  cancelled: { status: "cancelled" },
};
const TAB_FILTER = Object.fromEntries([
  ...PIPELINE.map((p) => [p.key, { status: p.status }]),
  ...Object.entries(SIDE_TABS),
  ["active", { status: "active" }],
]);

function tabFromParams(params) {
  if (TAB_FILTER[params?.tab]) return params.tab;
  if (TAB_FILTER[params?.filter]) return params.filter;
  if (TAB_FILTER[params?.status]) return params.status;
  return "all";
}

const RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];
const PAYMENT_OPTIONS = [
  { value: "paid", label: "Paid", icon: "checkmark-circle-outline" },
  { value: "pending", label: "Unpaid", icon: "time-outline" },
  { value: "cod", label: "Cash on delivery", icon: "cash-outline" },
  { value: "online", label: "Online / UPI", icon: "card-outline" },
  { value: "cod_due", label: "Cash to collect", icon: "alert-circle-outline" },
  { value: "refunded", label: "Refunded", icon: "return-down-back-outline" },
  { value: "failed", label: "Failed", icon: "close-circle-outline" },
];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "amount_high", label: "Highest value" },
  { value: "amount_low", label: "Lowest value" },
];

export default function AdminOrdersScreen({ navigation, route }) {
  const { user } = useAuth();
  const toast = useToast();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const { confirm, dialog } = useAdminConfirm();
  const { on: onLiveEvent } = useLiveSocket();
  const isAdmin = Boolean(user?.isAdmin);

  const incomingQuery = String(route?.params?.query || "").trim();
  const [tab, setTab] = useState(tabFromParams(route?.params));
  const [qInput, setQInput] = useState(incomingQuery);
  const [q, setQ] = useState(incomingQuery);
  const [range, setRange] = useState(RANGE_OPTIONS.some((o) => o.value === route?.params?.range) ? route.params.range : "all");
  const [zone, setZone] = useState(String(route?.params?.zone || ""));
  const [rider, setRider] = useState(String(route?.params?.rider || ""));
  const [payment, setPayment] = useState(String(route?.params?.payment || ""));
  const insets = useSafeAreaInsets();
  const [bulkNote, setBulkNote] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [riders, setRiders] = useState([]);
  const [zones, setZones] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [openId, setOpenId] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [report, setReport] = useState(null);
  const [tableWidth, setTableWidth] = useState(0);

  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);
  const useCards = compact || (tableWidth > 0 && tableWidth < 900);

  /* ------------------------------- query / load ------------------------------ */

  const query = useMemo(() => {
    const f = TAB_FILTER[tab] || {};
    const params = {
      q,
      range: range === "all" ? "" : range,
      zone,
      rider,
      payment: f.payment || payment,
      status: f.status || "",
      attention: f.attention ? 1 : "",
      channel: f.channel || "",
      sort,
      page,
      pageSize,
    };
    return params;
  }, [tab, q, range, zone, rider, payment, sort, page, pageSize]);

  const requestRef = useRef(0);
  const load = useCallback(
    async ({ silent = false } = {}) => {
      const id = ++requestRef.current;
      if (!silent) setLoading(true);
      try {
        const res = await searchAdminOrders(null, query);
        if (id !== requestRef.current) return;
        setData(res);
        setError("");
        if (res.page !== query.page) setPage(res.page);
      } catch (err) {
        if (id === requestRef.current) setError(err?.message || "Couldn't load orders.");
      } finally {
        if (id === requestRef.current) setLoading(false);
      }
    },
    [query]
  );

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchAdminRiders().then(setRiders).catch(() => {});
    fetchAdminDeliveryZones().then(setZones).catch(() => {});
  }, [isAdmin]);

  const refreshAll = useCallback(async () => {
    await load({ silent: true });
    refreshAdminDesk({ force: true });
    fetchAdminRiders().then(setRiders).catch(() => {});
  }, [load]);

  // Debounced search → query.
  useEffect(() => {
    const next = qInput.trim();
    if (next === q) return undefined;
    const timer = setTimeout(() => {
      setQ(next);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [qInput, q]);

  // Live: refresh the page a moment after any order event, plus a slow safety refresh.
  const liveTimer = useRef(null);
  useEffect(() => {
    if (!isAdmin) return undefined;
    const off = onLiveEvent("orders:updated", () => {
      if (liveTimer.current) clearTimeout(liveTimer.current);
      liveTimer.current = setTimeout(() => load({ silent: true }), 800);
    });
    const poll = setInterval(() => load({ silent: true }), 60 * 1000);
    return () => {
      off?.();
      clearInterval(poll);
      if (liveTimer.current) clearTimeout(liveTimer.current);
    };
  }, [isAdmin, onLiveEvent, load]);

  // Deep link from elsewhere: /admin/orders with a search → open the first match. Tab/zone/rider stay as passed.
  const deepLinked = useRef(false);
  useEffect(() => {
    if (!incomingQuery) return;
    deepLinked.current = false;
  }, [incomingQuery]);
  useEffect(() => {
    if (!incomingQuery || deepLinked.current || loading || q !== incomingQuery) return;
    deepLinked.current = true;
    if (data.items[0]?._id) setOpenId(String(data.items[0]._id));
  }, [incomingQuery, loading, q, data.items]);

  // Opened (or re-opened) with a ready-made view — Dashboard, Shop desk, Zones, Users.
  const viewKey = [
    route?.params?.rider,
    route?.params?.zone,
    route?.params?.payment,
    route?.params?.tab,
    route?.params?.range,
    route?.params?.query,
    route?.params?.filter,
    route?.params?.status,
  ].map((v) => String(v || "")).join("|");
  const lastViewKey = useRef(viewKey);
  useEffect(() => {
    if (lastViewKey.current === viewKey) return;
    lastViewKey.current = viewKey;
    setRider(String(route?.params?.rider || ""));
    setZone(String(route?.params?.zone || ""));
    setPayment(String(route?.params?.payment || ""));
    setTab(tabFromParams(route?.params));
    setRange(RANGE_OPTIONS.some((o) => o.value === route?.params?.range) ? route.params.range : "all");
    const nextQuery = String(route?.params?.query || "").trim();
    setQInput(nextQuery);
    setQ(nextQuery);
    setPage(1);
  }, [viewKey, route?.params]);

  /* -------------------------------- selection -------------------------------- */

  const clearSelection = useCallback(() => {
    setSelected(new Set());
    setBulkNote("");
  }, []);
  const toggleOne = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const key = String(id);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);
  const toggleAll = useCallback(
    (on) => setSelected(on ? new Set(data.items.map((o) => String(o._id))) : new Set()),
    [data.items]
  );

  // A different slice of orders invalidates what was ticked.
  useEffect(() => {
    clearSelection();
  }, [tab, q, range, zone, rider, payment, sort, page, pageSize, clearSelection]);

  /* --------------------------------- filters --------------------------------- */

  const pickTab = (key) => {
    setTab((prev) => (prev === key && key !== "all" ? "all" : key));
    setPage(1);
  };
  const withPageReset = (setter) => (value) => {
    setter(value || "");
    setPage(1);
  };
  const isFiltered = tab !== "all" || Boolean(q) || range !== "all" || Boolean(zone) || Boolean(rider) || Boolean(payment);
  const clearFilters = () => {
    setTab("all");
    setQInput("");
    setQ("");
    setRange("all");
    setZone("");
    setRider("");
    setPayment("");
    setPage(1);
  };

  /* --------------------------------- actions --------------------------------- */

  const actions = useOrderActions({ toast, confirm, onChanged: refreshAll });
  const openOrder = useCallback((order) => setOpenId(String(order._id)), []);
  const openFull = useCallback((order) => navigation.navigate("AdminOrderDetail", { orderId: String(order._id) }), [navigation]);

  const selectedOrders = useMemo(() => data.items.filter((o) => selected.has(String(o._id))), [data.items, selected]);
  const cashDueSelected = useMemo(
    () => selectedOrders.filter((o) => o.status === "delivered" && isCod(o) && o.paymentStatus === "pending"),
    [selectedOrders]
  );

  const showBulkResult = (title, res) => {
    const byId = new Map(data.items.map((o) => [String(o._id), o]));
    const skipped = (res?.results || []).filter((r) => !r.ok).map((r) => ({ ref: byId.get(String(r.id)) ? orderRef(byId.get(String(r.id))) : String(r.id).slice(-6), reason: r.reason }));
    if (res?.updated) toast.toastSuccess(`${title}: ${plural(res.updated, "order")} done${skipped.length ? `, ${skipped.length} skipped` : ""}.`);
    if (skipped.length) setReport({ title: res?.updated ? `${plural(res.updated, "order")} done, ${skipped.length} skipped` : "Nothing changed", skipped });
  };

  const bulkMove = async (target) => {
    if (!target || !selected.size) return;
    const ids = [...selected];
    const ok = await confirm({
      title: `${target.label} — ${plural(ids.length, "order")}?`,
      message: target.danger
        ? "Customers will see these orders as cancelled, and reserved stock goes back on the shelf."
        : "Orders that can't make this move are skipped, and you'll see why.",
      tone: target.danger ? "danger" : undefined,
      confirmLabel: target.label,
    });
    if (!ok) return;
    setBulkBusy(true);
    try {
      const res = await bulkUpdateAdminOrderStatus(null, ids, target.to, bulkNote);
      showBulkResult(target.label, res);
      clearSelection();
      await refreshAll();
    } catch (err) {
      toast.toastError(err?.message || "Couldn't update those orders.");
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkAssign = async (riderId, riderName) => {
    if (!selected.size) return;
    setBulkBusy(true);
    try {
      const res = await bulkAssignAdminOrderRider(null, [...selected], riderId);
      showBulkResult(riderId ? `Assigned to ${riderName || "rider"}` : "Riders released", res);
      clearSelection();
      await refreshAll();
    } catch (err) {
      toast.toastError(err?.message || "Couldn't assign those orders.");
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkCollectCash = async () => {
    if (!cashDueSelected.length) return;
    setBulkBusy(true);
    let done = 0;
    try {
      for (const order of cashDueSelected) {
        await updateAdminOrderPayment(null, order._id, "paid", "Cash collected");
        done += 1;
      }
      toast.toastSuccess(`${plural(done, "order")} marked as cash collected.`);
      clearSelection();
    } catch (err) {
      toast.toastError(`${err?.message || "Couldn't update payments."}${done ? ` (${done} saved before that)` : ""}`);
    } finally {
      setBulkBusy(false);
      await refreshAll();
    }
  };

  const exportAll = async () => {
    setExporting(true);
    try {
      const all = [];
      let pageNo = 1;
      let pages = 1;
      do {
        const res = await searchAdminOrders(null, { ...query, page: pageNo, pageSize: 100 });
        all.push(...res.items);
        pages = res.pages;
        pageNo += 1;
      } while (pageNo <= pages && pageNo <= 20);
      await exportOrdersCsv(all);
      toast.toastSuccess(`Exported ${plural(all.length, "order")}.`);
    } catch (err) {
      toast.toastError(err?.message || "Couldn't export orders.");
    } finally {
      setExporting(false);
    }
  };

  /* ---------------------------------- render ---------------------------------- */

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.gatePanel}>
              <PremiumErrorBanner severity="warning" title={ADMIN_GATE.title} message="This account does not have admin privileges." />
              <AdminButton
                label={ADMIN_GATE.backHome}
                icon="home-outline"
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

  const byStatus = data.counts.byStatus || {};
  const seedOrder = openId ? data.items.find((o) => String(o._id) === openId) : undefined;
  const sideItems = [
    { key: "all", label: "All", count: data.counts.all },
    { key: "attention", label: "Needs attention", count: data.counts.attention, tone: "red" },
    { key: "unpaid", label: "Unpaid", count: byStatus.pending_payment || 0, tone: "gold" },
    { key: "cash", label: "Cash to collect", count: data.counts.cashDue, tone: "gold" },
    { key: "counter", label: "Counter", count: data.counts.walkIn || 0, tone: "gold" },
    { key: "cancelled", label: "Cancelled", count: byStatus.cancelled || 0 },
  ];

  const onPull = async () => {
    setRefreshing(true);
    try {
      await load({ silent: true });
    } finally {
      setRefreshing(false);
    }
  };

  const bulkBar = selected.size > 0 ? (
    <AdminBulkBar
      count={selected.size}
      cashDueCount={cashDueSelected.length}
      riders={riders}
      busy={bulkBusy}
      note={bulkNote}
      onNote={setBulkNote}
      onMove={bulkMove}
      onAssign={bulkAssign}
      onCollectCash={bulkCollectCash}
      onClear={clearSelection}
    />
  ) : null;

  return (
    <AdminScreenShell style={styles.screen}>
      <KeyboardAvoidingView style={customerScrollFill} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <KankregScrollPage
          scrollVariant="admin"
          showFooter={false}
          style={customerScrollFill}
          keyboardShouldPersistTaps="handled"
          stickyFooterExtra={compact && selected.size ? 96 : 0}
          refreshControl={Platform.OS === "web" ? undefined : <RefreshControl refreshing={refreshing} onRefresh={onPull} />}
        >
          <KankregAdminShell
            navigation={navigation}
            route={route}
            title={ADMIN_SCREEN_COPY.orders.title}
            subtitle={ADMIN_SCREEN_COPY.orders.subtitle}
            headerRight={
              <View style={styles.headerActions}>
                <AdminButton label="Store selling" icon="storefront-outline" variant="soft" size="sm" onPress={() => navigation.navigate("AdminStoreSelling")} />
                <AdminButton label="Export" icon="download-outline" variant="soft" size="sm" loading={exporting} onPress={exportAll} />
                <AdminButton label="Refresh" icon="refresh-outline" variant="primary" size="sm" onPress={() => load()} />
              </View>
            }
          >
            <View style={styles.panel}>
              <AdminAlerts error={error} onCloseError={() => setError("")} />

              {/* pipeline */}
              <AdminStatGrid min={compact ? 132 : 158}>
                {PIPELINE.map((stage) => (
                  <AdminStatTile
                    key={stage.key}
                    icon={stage.icon}
                    label={stage.label}
                    value={String(stage.count(byStatus))}
                    hint={stage.hint}
                    tone={stage.tone}
                    selected={tab === stage.key}
                    onPress={() => pickTab(stage.key)}
                    style={compact && Platform.OS !== "web" ? styles.tilePhone : undefined}
                  />
                ))}
              </AdminStatGrid>

              <AdminFilterTabs items={sideItems} value={SIDE_TABS[tab] ? tab : ""} onChange={pickTab} />

              <AdminToolbar stacked={compact} style={styles.filterBar}>
                <View style={[styles.filters, compact && styles.filtersStack]}>
                  <View style={[styles.searchCell, compact && styles.filterCellPhone]}>
                    <AdminInput
                      value={qInput}
                      onChangeText={setQInput}
                      placeholder="Search order #, customer, phone"
                      icon="search-outline"
                      autoCapitalize="none"
                    />
                  </View>
                  <AdminSelect value={range} onChange={withPageReset(setRange)} options={RANGE_OPTIONS} icon="calendar-outline" style={[styles.filterCell, compact && styles.filterCellPhone]} />
                  <AdminSelect
                    value={zone}
                    onChange={withPageReset(setZone)}
                    options={[...zones.map((z) => ({ value: String(z._id), label: z.name, hint: z.isActive ? undefined : "Paused" })), { value: "none", label: "Outside zones" }]}
                    placeholder="All zones"
                    clearLabel="All zones"
                    icon="map-outline"
                    style={[styles.filterCell, compact && styles.filterCellPhone]}
                  />
                  <AdminSelect
                    value={rider}
                    onChange={withPageReset(setRider)}
                    options={[{ value: "unassigned", label: "Unassigned", icon: "person-remove-outline" }, ...riders.map((r) => ({ value: String(r._id), label: r.name || "Rider", meta: r.active ? `${r.active} active` : undefined }))]}
                    placeholder="All riders"
                    clearLabel="All riders"
                    icon="bicycle-outline"
                    style={[styles.filterCell, compact && styles.filterCellPhone]}
                  />
                  <AdminSelect
                    value={payment}
                    onChange={withPageReset(setPayment)}
                    options={PAYMENT_OPTIONS}
                    placeholder="All payments"
                    clearLabel="All payments"
                    icon="wallet-outline"
                    style={[styles.filterCell, compact && styles.filterCellPhone]}
                  />
                  <AdminSelect value={sort} onChange={withPageReset(setSort)} options={SORT_OPTIONS} icon="swap-vertical-outline" style={[styles.filterCell, compact && styles.filterCellPhone]} />
                </View>
              </AdminToolbar>

              {/* selection bar or summary line */}
              {selected.size > 0 && !compact ? (
                bulkBar
              ) : (
                <View style={styles.summaryRow}>
                  <Text style={styles.summary}>
                    <Text style={styles.summaryStrong}>{plural(data.total, "order")}</Text>
                    {data.total ? ` · ${formatRupees(data.totals.revenue)} value` : ""}
                    {isFiltered ? " · filtered" : ""}
                  </Text>
                  {isFiltered ? <AdminButton label="Clear filters" icon="close-circle-outline" variant="ghost" size="xs" onPress={clearFilters} /> : null}
                </View>
              )}

              {/* list */}
              <View onLayout={(e) => setTableWidth(e.nativeEvent.layout.width)} style={loading && data.items.length ? styles.dim : null}>
                {!loading && data.items.length === 0 ? (
                  <PremiumEmptyState
                    iconName="receipt-outline"
                    title={tab === "counter" ? "No walk-in bills" : isFiltered ? ADMIN_SCREEN_COPY.orders.emptyFilter : ADMIN_SCREEN_COPY.orders.empty}
                    description={tab === "counter" ? "Open the till to take the first counter bill." : isFiltered ? "Try another tab, widen the date range or clear the search." : "New orders appear here the moment a customer checks out."}
                    ctaLabel={tab === "counter" ? "Open till" : isFiltered ? "Clear filters" : undefined}
                    onCtaPress={tab === "counter" ? () => navigation.navigate("AdminCounter") : isFiltered ? clearFilters : undefined}
                    compact
                  />
                ) : (
                  <AdminOrdersTable
                    orders={data.items}
                    loading={loading}
                    compact={useCards}
                    selected={selected}
                    onToggle={toggleOne}
                    onToggleAll={toggleAll}
                    onOpen={openOrder}
                    onFullOpen={openFull}
                    riders={riders}
                    busyId={actions.busyId}
                    actions={actions}
                  />
                )}
              </View>

              {data.total > 0 ? (
                <AdminPagination
                  page={data.page}
                  pages={data.pages}
                  total={data.total}
                  pageSize={data.pageSize}
                  onPage={setPage}
                  onPageSize={(n) => {
                    setPageSize(n);
                    setPage(1);
                  }}
                  pageSizes={[5, 10, 25, 50, 100]}
                />
              ) : null}
            </View>
          </KankregAdminShell>
        </KankregScrollPage>
        {compact && selected.size > 0 ? (
          <View style={[styles.bulkDock, { paddingBottom: Math.max(insets.bottom, 10) }]}>{bulkBar}</View>
        ) : null}
      </KeyboardAvoidingView>

      <AdminOrderDrawer
        orderId={openId}
        seed={seedOrder}
        riders={riders}
        onClose={() => setOpenId(null)}
        onChanged={refreshAll}
        onFullOpen={openFull}
      />
      {dialog}
      <AdminDialog
        visible={Boolean(report)}
        title={report?.title || ""}
        icon="information-circle-outline"
        confirmLabel="Got it"
        hideCancel
        onConfirm={() => setReport(null)}
        onCancel={() => setReport(null)}
      >
        <View style={styles.reportList}>
          {(report?.skipped || []).slice(0, 12).map((row, index) => (
            <View key={`${row.ref}-${index}`} style={styles.reportRow}>
              <Text style={styles.reportRef}>{row.ref}</Text>
              <Text style={styles.reportReason} numberOfLines={2}>
                {row.reason}
              </Text>
            </View>
          ))}
          {(report?.skipped || []).length > 12 ? <Text style={styles.reportReason}>…and {report.skipped.length - 12} more</Text> : null}
        </View>
      </AdminDialog>
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium) {
  return StyleSheet.create({
    screen: { flex: 1, width: "100%", alignSelf: "center", maxWidth: "100%" },
    panel: { ...adminShellContent(), gap: spacing.sm + 2 },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
    filterBar: { width: "100%", alignItems: "stretch" },
    filters: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end", gap: 8, width: "100%" },
    filtersStack: { flexDirection: "column", flexWrap: "nowrap", alignItems: "stretch" },
    searchCell: { flexGrow: 1, flexBasis: 280, minWidth: 220 },
    filterCell: { flexGrow: 1, flexBasis: 148, minWidth: 130, maxWidth: 220 },
    filterCellPhone: { minWidth: "100%", maxWidth: "100%", flexBasis: "100%" },
    tilePhone: Platform.OS === "web" ? {} : { flexBasis: "47%", flexGrow: 1, maxWidth: "48%" },
    bulkDock: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: chrome.line,
      backgroundColor: chrome.paper,
      paddingHorizontal: 12,
      paddingTop: 8,
    },
    summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 40, paddingHorizontal: 2 },
    summary: { fontSize: 13, color: chrome.inkSoft, fontFamily: fonts.regular },
    summaryStrong: { color: chrome.ink, fontFamily: fonts.bold },
    dim: { opacity: 0.55 },
    reportList: { marginTop: 12, gap: 8 },
    reportRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 10,
      borderRadius: 10,
      backgroundColor: chrome.paper,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.lineSoft,
    },
    reportRef: { fontSize: 12.5, color: chrome.ink, fontFamily: fonts.bold },
    reportReason: { flex: 1, fontSize: 12.5, color: chrome.inkSoft, fontFamily: fonts.regular },
  });
}
