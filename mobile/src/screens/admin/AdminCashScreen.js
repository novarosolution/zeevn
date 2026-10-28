import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminButton from "../../components/admin/AdminButton";
import AdminInput from "../../components/admin/AdminInput";
import AdminSelect from "../../components/admin/AdminSelect";
import AdminStatTile, { AdminStatGrid } from "../../components/admin/AdminStatTile";
import AdminPagination from "../../components/admin/AdminPagination";
import { useAdminConfirm } from "../../components/admin/AdminDialog";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import { useAuth } from "../../context/AuthContext";
import { useLiveSocket } from "../../context/LiveSocketContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchAdminClosing, saveAdminCashCount, searchAdminCash, searchAdminOrders, updateAdminOrderPayment } from "../../services/adminService";
import { useToast } from "../../context/ToastContext";
import AdminPanel from "../../components/admin/AdminPanel";
import { adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, spacing } from "../../theme/tokens";
import { formatRupees, formatShortDateTime } from "../../utils/adminFormat";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

const COPY = ADMIN_SCREEN_COPY.cash;
const EMPTY = { items: [], total: 0, page: 1, pages: 1, pageSize: 25, counts: { toCollect: 0, amount: 0, byRider: [] } };
const RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All" },
];

export default function AdminCashScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const { on: onLiveEvent } = useLiveSocket();
  const isAdmin = Boolean(user?.isAdmin);
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);
  const { confirm, dialog } = useAdminConfirm();
  const toast = useToast();
  const [cashBusy, setCashBusy] = useState(false);

  const [range, setRange] = useState(RANGE_OPTIONS.some((o) => o.value === route?.params?.range) ? route.params.range : "today");
  const [rider, setRider] = useState(String(route?.params?.rider || ""));
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [counterCash, setCounterCash] = useState({ count: 0, amount: 0 });
  const [counted, setCounted] = useState("");
  const [countedNote, setCountedNote] = useState("");

  const query = useMemo(() => ({ range, rider, q, page, pageSize: 25 }), [range, rider, q, page]);
  const requestRef = useRef(0);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      const id = ++requestRef.current;
      if (!silent) setLoading(true);
      try {
        const [res, walkIns] = await Promise.all([
          searchAdminCash(null, query),
          searchAdminOrders(null, { channel: "walk_in", range: "today", pageSize: 100, sort: "newest" }).catch(() => ({ items: [] })),
        ]);
        if (id !== requestRef.current) return;
        setData(res);
        const live = (walkIns?.items || []).filter((row) => row.status !== "cancelled");
        const cashOnly = live.filter((row) => /cash/i.test(String(row.paymentMethod || "")));
        setCounterCash({
          count: cashOnly.length,
          amount: cashOnly.reduce((n, row) => n + Number(row.totalPrice || 0), 0),
        });
        const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        const sheet = await fetchAdminClosing(null, today).catch(() => null);
        if (sheet) {
          if (sheet.cashCounted != null) setCounted(String(sheet.cashCounted));
          if (sheet.cashNote) setCountedNote(sheet.cashNote);
        }
        setError("");
      } catch (err) {
        if (id === requestRef.current) setError(err?.message || "Couldn't load cash to collect.");
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
    const next = qInput.trim();
    if (next === q) return undefined;
    const timer = setTimeout(() => {
      setQ(next);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [qInput, q]);

  const liveTimer = useRef(null);
  useEffect(() => {
    if (!isAdmin) return undefined;
    const off = onLiveEvent("orders:updated", () => {
      if (liveTimer.current) clearTimeout(liveTimer.current);
      liveTimer.current = setTimeout(() => load({ silent: true }), 800);
    });
    return () => {
      off?.();
      if (liveTimer.current) clearTimeout(liveTimer.current);
    };
  }, [isAdmin, onLiveEvent, load]);

  const onPull = async () => {
    setRefreshing(true);
    try {
      await load({ silent: true });
    } finally {
      setRefreshing(false);
    }
  };

  const markCollected = async (row) => {
    if (!row?._id || busyId) return;
    const title = COPY.confirm.replace("{amount}", formatWholeAmount(row.amountDue)).replace("{ref}", row.publicRef || "this order");
    const ok = await confirm({ title, confirmLabel: "Mark collected" });
    if (!ok) return;
    setBusyId(row._id);
    try {
      await updateAdminOrderPayment(null, row._id, "paid");
      await load({ silent: true });
    } catch (err) {
      setError(err?.message || "Couldn't mark this as collected.");
    } finally {
      setBusyId("");
    }
  };

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.gatePanel}>
              <PremiumErrorBanner severity="warning" title={ADMIN_GATE.title} message={ADMIN_GATE.message} />
              <AdminButton
                label={ADMIN_GATE.backHome}
                variant="primary"
                onPress={() => navigateCustomerRoute(navigation, "Home")}
                style={styles.gateCta}
              />
            </View>
          </SectionReveal>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

  const counts = data.counts || EMPTY.counts;
  const openOrder = (row) => navigation.navigate("AdminOrderDetail", { orderId: String(row._id) });
  const riderTiles = counts.byRider || [];

  return (
    <AdminScreenShell style={styles.screen}>
      <KeyboardAvoidingView style={customerScrollFill} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <KankregScrollPage
          scrollVariant="admin"
          showFooter={false}
          style={customerScrollFill}
          keyboardShouldPersistTaps="handled"
          refreshControl={Platform.OS === "web" ? undefined : <RefreshControl refreshing={refreshing} onRefresh={onPull} />}
        >
          <KankregAdminShell
            navigation={navigation}
            route={route}
            title={COPY.title}
            subtitle={COPY.subtitle}
            headerRight={<AdminButton label="Refresh" icon="refresh-outline" variant="ghost" size="sm" onPress={() => load()} />}
          >
            <View style={styles.panel}>
              <AdminAlerts error={error} onCloseError={() => setError("")} />

              <AdminPanel title="Today" icon="wallet-outline" description="COD still out vs cash already taken at the till.">
                <Text style={styles.muted}>
                  COD to collect {formatRupees(counts.amount)} · Counter cash {formatRupees(counterCash.amount)} ({counterCash.count} bills)
                </Text>
                <AdminButton label="Store selling" variant="ghost" size="sm" icon="receipt-outline" onPress={() => navigation.navigate("AdminStoreSelling")} />
                <AdminInput label="Counted at till" value={counted} onChangeText={setCounted} numeric prefix="₹" />
                <AdminInput label="Note" value={countedNote} onChangeText={setCountedNote} placeholder="Optional" />
                <AdminButton
                  label="Save counted cash"
                  variant="soft"
                  loading={cashBusy}
                  onPress={async () => {
                    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
                    const note = countedNote || `Counted ₹${counted || 0}`;
                    setCashBusy(true);
                    try {
                      await saveAdminCashCount(null, today, {
                        cashCounted: Math.max(0, Number(counted) || 0),
                        cashNote: note,
                      });
                      setCountedNote(note);
                      toast.toastSuccess("Cash count saved on today’s closing.");
                    } catch (err) {
                      setError(err.message || "Could not save cash count.");
                    } finally {
                      setCashBusy(false);
                    }
                  }}
                />
                {countedNote ? <Text style={styles.muted}>{countedNote}</Text> : null}
              </AdminPanel>

              <AdminStatGrid min={compact ? 132 : 170}>
                <AdminStatTile
                  icon="cash-outline"
                  label="To collect"
                  value={formatRupees(counts.amount)}
                  hint={`${counts.toCollect || 0} order${counts.toCollect === 1 ? "" : "s"}`}
                  tone={counts.toCollect ? "gold" : "neutral"}
                  selected={!rider}
                  onPress={() => {
                    setRider("");
                    setPage(1);
                  }}
                  style={compact ? styles.tileWide : undefined}
                />
                {riderTiles.map((tile) => (
                  <AdminStatTile
                    key={tile.id || "none"}
                    icon={tile.id ? "bicycle-outline" : "help-circle-outline"}
                    label={tile.name || "No rider"}
                    value={formatRupees(tile.amount)}
                    hint={`${tile.count} order${tile.count === 1 ? "" : "s"}`}
                    tone={tile.id ? "blue" : "neutral"}
                    selected={rider === (tile.id || "none")}
                    onPress={() => {
                      const key = tile.id || "none";
                      setRider((prev) => (prev === key ? "" : key));
                      setPage(1);
                    }}
                    style={compact ? styles.tilePhone : undefined}
                  />
                ))}
              </AdminStatGrid>

              <View style={[styles.filters, compact && styles.filtersStack]}>
                <AdminSelect
                  value={range}
                  onChange={(value) => {
                    setRange(value || "today");
                    setPage(1);
                  }}
                  options={RANGE_OPTIONS}
                  icon="calendar-outline"
                  style={[styles.filterCell, compact && styles.filterCellPhone]}
                />
                <AdminInput
                  label="Search"
                  value={qInput}
                  onChangeText={setQInput}
                  placeholder="Order, customer, phone"
                  icon="search-outline"
                  style={[styles.filterCell, compact && styles.filterCellPhone]}
                />
              </View>

              {loading ? <Text style={styles.muted}>Loading…</Text> : null}
              {!loading && data.items.length === 0 ? <PremiumEmptyState iconName="cash-outline" title={COPY.empty} compact /> : null}

              {!loading && data.items.length > 0 ? (
                <View style={styles.list}>
                  {!compact ? (
                    <View style={styles.head}>
                      <Text style={[styles.headText, styles.colRef]}>Order</Text>
                      <Text style={[styles.headText, styles.colCust]}>Customer</Text>
                      <Text style={[styles.headText, styles.colRider]}>Rider</Text>
                      <Text style={[styles.headText, styles.colZone]}>Zone</Text>
                      <Text style={[styles.headText, styles.colWhen]}>Delivered</Text>
                      <Text style={[styles.headText, styles.colAmt]}>Due</Text>
                      <Text style={[styles.headText, styles.colAct]} />
                    </View>
                  ) : null}
                  {data.items.map((row) => {
                    const mark = (
                      <View onStartShouldSetResponder={() => true}>
                        <AdminButton
                          label="Mark collected"
                          size="sm"
                          variant="tint"
                          tone="gold"
                          disabled={busyId === row._id}
                          onPress={() => markCollected(row)}
                        />
                      </View>
                    );
                    return (
                      <Pressable
                        key={row._id}
                        onPress={() => openOrder(row)}
                        style={({ pressed }) => [compact ? styles.card : styles.row, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel={`Open ${row.publicRef || "order"}`}
                      >
                        {compact ? (
                          <>
                            <View style={styles.cardTop}>
                              <Text style={styles.ref}>{row.publicRef || "Order"}</Text>
                              <Text style={styles.amount}>{formatRupees(row.amountDue)}</Text>
                            </View>
                            <Text style={styles.strong} numberOfLines={1}>
                              {row.customer}
                            </Text>
                            <Text style={styles.body} numberOfLines={1}>
                              {row.riderName || "No rider"}
                              {row.zone ? ` · ${row.zone}` : ""}
                            </Text>
                            <Text style={styles.muted}>{formatShortDateTime(row.deliveredAt) || "—"}</Text>
                            {mark}
                          </>
                        ) : (
                          <>
                            <Text style={[styles.ref, styles.colRef]} numberOfLines={1}>
                              {row.publicRef || "—"}
                            </Text>
                            <Text style={[styles.body, styles.colCust]} numberOfLines={1}>
                              {row.customer}
                            </Text>
                            <Text style={[styles.body, styles.colRider]} numberOfLines={1}>
                              {row.riderName || "No rider"}
                            </Text>
                            <Text style={[styles.body, styles.colZone]} numberOfLines={1}>
                              {row.zone || "—"}
                            </Text>
                            <Text style={[styles.muted, styles.colWhen]} numberOfLines={1}>
                              {formatShortDateTime(row.deliveredAt) || "—"}
                            </Text>
                            <Text style={[styles.amount, styles.colAmt]}>{formatRupees(row.amountDue)}</Text>
                            <View style={styles.colAct}>{mark}</View>
                          </>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              {data.total > 0 ? (
                <AdminPagination page={data.page} pages={data.pages} total={data.total} pageSize={data.pageSize} onPage={setPage} noun="orders" />
              ) : null}
            </View>
          </KankregAdminShell>
        </KankregScrollPage>
      </KeyboardAvoidingView>
      {dialog}
    </AdminScreenShell>
  );
}

function formatWholeAmount(value) {
  return Math.round(Number(value) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function createStyles(chrome, c, shadowPremium) {
  return StyleSheet.create({
    screen: { flex: 1, width: "100%" },
    panel: { ...adminShellContent(), gap: spacing.sm + 2 },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    filters: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end", gap: 8 },
    filtersStack: { flexDirection: "column", flexWrap: "nowrap", alignItems: "stretch" },
    filterCell: { flexGrow: 1, flexBasis: 180, minWidth: 160, maxWidth: 320 },
    filterCellPhone: { minWidth: "100%", maxWidth: "100%", flexBasis: "100%" },
    tileWide: { flexBasis: "100%", maxWidth: "100%" },
    tilePhone: Platform.OS === "web" ? {} : { flexBasis: "47%", flexGrow: 1, maxWidth: "48%" },
    list: {
      backgroundColor: chrome.card,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      overflow: "hidden",
    },
    head: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 11,
      backgroundColor: chrome.paper,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.line,
    },
    headText: {
      fontSize: 10.5,
      letterSpacing: 0.7,
      textTransform: "uppercase",
      color: chrome.inkFaint,
      fontFamily: fonts.semibold,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    card: { padding: 14, gap: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: chrome.lineSoft },
    cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    pressed: { backgroundColor: chrome.paper },
    ref: { fontSize: 13, color: chrome.ink, fontFamily: fonts.bold },
    strong: { fontSize: 13.5, color: chrome.ink, fontFamily: fonts.semibold },
    body: { fontSize: 13, color: chrome.ink, fontFamily: fonts.regular },
    muted: { fontSize: 12, color: chrome.inkFaint, fontFamily: fonts.medium },
    amount: { fontSize: 14, color: chrome.ink, fontFamily: fonts.semibold },
    colRef: { width: 92 },
    colCust: { flex: 1.2, minWidth: 110 },
    colRider: { flex: 1, minWidth: 90 },
    colZone: { flex: 0.9, minWidth: 80 },
    colWhen: { width: 120 },
    colAmt: { width: 88, textAlign: "right" },
    colAct: { width: 132, alignItems: "flex-end" },
  });
}
