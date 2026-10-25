import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminBadge from "../../components/admin/AdminBadge";
import AdminButton from "../../components/admin/AdminButton";
import AdminSelect from "../../components/admin/AdminSelect";
import AdminStatTile, { AdminStatGrid } from "../../components/admin/AdminStatTile";
import AdminPagination from "../../components/admin/AdminPagination";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import { useAuth } from "../../context/AuthContext";
import { useLiveSocket } from "../../context/LiveSocketContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchAdminDeliveryZones, fetchAdminRiders, searchAdminDispatch } from "../../services/adminService";
import { adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, spacing } from "../../theme/tokens";
import { formatShortDateTime } from "../../utils/adminFormat";

const EMPTY = {
  items: [],
  total: 0,
  page: 1,
  pages: 1,
  pageSize: 25,
  counts: { offers: 0, waiting: 0, accepted: 0, declined: 0, silent: 0, no_rider: 0 },
};

const RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

const TILES = [
  { key: "", label: "Offers", count: (c) => c.offers || 0, tone: "olive", hint: "Asked to take a run" },
  { key: "waiting", label: "Waiting", count: (c) => c.waiting || 0, tone: "gold", hint: "Asked, under 10 min" },
  { key: "silent", label: "Silent", count: (c) => c.silent || 0, tone: "gold", hint: "No answer in 10 min" },
  { key: "accepted", label: "Accepted", count: (c) => c.accepted || 0, tone: "green", hint: "Rider took it" },
  { key: "declined", label: "Declined", count: (c) => c.declined || 0, tone: "red", hint: "Rider said no" },
  { key: "no_rider", label: "No rider", count: (c) => c.no_rider || 0, tone: "blue", hint: "Ready, nobody assigned" },
];

function resultMeta(result) {
  if (result === "accepted") return { label: "Accepted", tone: "green" };
  if (result === "declined") return { label: "Declined", tone: "red" };
  if (result === "silent") return { label: "Silent", tone: "gold" };
  if (result === "no_rider") return { label: "No rider", tone: "blue" };
  if (result === "waiting") return { label: "Waiting", tone: "gold" };
  if (result === "cleared") return { label: "Cleared", tone: "neutral" };
  return { label: result || "—", tone: "neutral" };
}

function secondsLabel(seconds) {
  if (seconds == null || !Number.isFinite(Number(seconds))) return "—";
  return `${Math.max(0, Math.round(Number(seconds)))}s`;
}

export default function AdminDispatchScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const { on: onLiveEvent } = useLiveSocket();
  const isAdmin = Boolean(user?.isAdmin);
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);

  const [range, setRange] = useState(RANGE_OPTIONS.some((o) => o.value === route?.params?.range) ? route.params.range : "today");
  const [zone, setZone] = useState(String(route?.params?.zone || ""));
  const [rider, setRider] = useState(String(route?.params?.rider || ""));
  const [result, setResult] = useState(String(route?.params?.result || ""));
  const [page, setPage] = useState(1);
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [riders, setRiders] = useState([]);
  const [zones, setZones] = useState([]);

  const query = useMemo(() => ({ range, zone, rider, result, page, pageSize: 25 }), [range, zone, rider, result, page]);
  const requestRef = useRef(0);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      const id = ++requestRef.current;
      if (!silent) setLoading(true);
      try {
        const res = await searchAdminDispatch(null, query);
        if (id !== requestRef.current) return;
        setData(res);
        setError("");
      } catch (err) {
        if (id === requestRef.current) setError(err?.message || "Couldn't load dispatch.");
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

  const withPageReset = (setter) => (value) => {
    setter(value || "");
    setPage(1);
  };

  const pickTile = (key) => {
    setResult((prev) => (prev === key ? "" : key));
    setPage(1);
  };

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.gatePanel}>
              <PremiumErrorBanner severity="warning" title={ADMIN_GATE.title} message="This account does not have admin privileges." />
              <AdminButton label={ADMIN_GATE.backHome} icon="home-outline" variant="primary" size="md" onPress={() => navigation.navigate("Home")} style={styles.gateCta} />
            </View>
          </SectionReveal>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

  const counts = data.counts || EMPTY.counts;
  const openOrder = (row) => navigation.navigate("AdminOrderDetail", { orderId: String(row.orderId) });

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
            title={ADMIN_SCREEN_COPY.dispatch.title}
            subtitle={ADMIN_SCREEN_COPY.dispatch.subtitle}
            headerRight={<AdminButton label="Refresh" icon="refresh-outline" variant="primary" size="sm" onPress={() => load()} />}
          >
            <View style={styles.panel}>
              <AdminAlerts error={error} onCloseError={() => setError("")} />

              <AdminStatGrid min={compact ? 132 : 150}>
                {TILES.map((tile) => (
                  <AdminStatTile
                    key={tile.key || "offers"}
                    label={tile.label}
                    value={String(tile.count(counts))}
                    hint={tile.hint}
                    tone={tile.tone}
                    selected={result === tile.key}
                    onPress={() => pickTile(tile.key)}
                    style={compact ? styles.tilePhone : undefined}
                  />
                ))}
              </AdminStatGrid>

              <View style={[styles.filters, compact && styles.filtersStack]}>
                <AdminSelect value={range} onChange={withPageReset(setRange)} options={RANGE_OPTIONS} icon="calendar-outline" style={[styles.filterCell, compact && styles.filterCellPhone]} />
                <AdminSelect
                  value={zone}
                  onChange={withPageReset(setZone)}
                  options={zones.map((z) => ({ value: String(z._id), label: z.name }))}
                  placeholder="All zones"
                  clearLabel="All zones"
                  icon="map-outline"
                  style={[styles.filterCell, compact && styles.filterCellPhone]}
                />
                <AdminSelect
                  value={rider}
                  onChange={withPageReset(setRider)}
                  options={riders.map((r) => ({ value: String(r._id), label: r.name || "Rider" }))}
                  placeholder="All riders"
                  clearLabel="All riders"
                  icon="bicycle-outline"
                  style={[styles.filterCell, compact && styles.filterCellPhone]}
                />
              </View>

              {!loading && data.items.length === 0 ? (
                <PremiumEmptyState iconName="bicycle-outline" title={ADMIN_SCREEN_COPY.dispatch.empty} compact />
              ) : (
                <View style={styles.list}>
                  {!compact ? (
                    <View style={styles.head}>
                      <Text style={[styles.headText, { flex: 1.1 }]}>Time</Text>
                      <Text style={[styles.headText, { width: 92 }]}>Order</Text>
                      <Text style={[styles.headText, { flex: 1 }]}>Zone</Text>
                      <Text style={[styles.headText, { flex: 1.1 }]}>Rider</Text>
                      <Text style={[styles.headText, { width: 64 }]}>How</Text>
                      <Text style={[styles.headText, { width: 96 }]}>Result</Text>
                      <Text style={[styles.headText, { width: 56 }]}>Wait</Text>
                      <Text style={[styles.headText, { flex: 1.2 }]}>Reason</Text>
                    </View>
                  ) : null}
                  {data.items.map((row) => {
                    const pill = resultMeta(row.result);
                    return (
                      <Pressable
                        key={row.id}
                        onPress={() => openOrder(row)}
                        style={({ pressed }) => [compact ? styles.card : styles.row, pressed && styles.pressed]}
                      >
                        {compact ? (
                          <>
                            <View style={styles.cardTop}>
                              <Text style={styles.ref}>{row.publicRef || "Order"}</Text>
                              <AdminBadge label={pill.label} tone={pill.tone} />
                            </View>
                            <Text style={styles.strong} numberOfLines={1}>
                              {row.riderName || "No rider"}
                              {row.assignedBy ? ` · ${row.assignedBy}` : ""}
                            </Text>
                            <Text style={styles.body} numberOfLines={1}>
                              {row.zone || "—"} · {formatShortDateTime(row.at)}
                            </Text>
                            <Text style={styles.sub} numberOfLines={2}>
                              {secondsLabel(row.seconds)}
                              {row.reason ? ` · ${row.reason}` : ""}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Text style={[styles.body, { flex: 1.1 }]} numberOfLines={1}>
                              {formatShortDateTime(row.at)}
                            </Text>
                            <Text style={[styles.ref, { width: 92 }]} numberOfLines={1}>
                              {row.publicRef || "—"}
                            </Text>
                            <Text style={[styles.body, { flex: 1 }]} numberOfLines={1}>
                              {row.zone || "—"}
                            </Text>
                            <Text style={[styles.strong, { flex: 1.1 }]} numberOfLines={1}>
                              {row.riderName || "—"}
                            </Text>
                            <Text style={[styles.sub, { width: 64 }]}>{row.assignedBy || "—"}</Text>
                            <View style={{ width: 96 }}>
                              <AdminBadge label={pill.label} tone={pill.tone} />
                            </View>
                            <Text style={[styles.sub, { width: 56 }]}>{secondsLabel(row.seconds)}</Text>
                            <Text style={[styles.sub, { flex: 1.2 }]} numberOfLines={2}>
                              {row.reason || "—"}
                            </Text>
                          </>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {data.total > 0 ? (
                <AdminPagination page={data.page} pages={data.pages} total={data.total} pageSize={data.pageSize} onPage={setPage} noun="attempts" />
              ) : null}
            </View>
          </KankregAdminShell>
        </KankregScrollPage>
      </KeyboardAvoidingView>
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium) {
  return StyleSheet.create({
    screen: { flex: 1, width: "100%", alignSelf: "center", maxWidth: "100%" },
    panel: { ...adminShellContent(), gap: spacing.sm + 2 },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    filters: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end", gap: 8 },
    filtersStack: { flexDirection: "column", alignItems: "stretch" },
    filterCell: { flexGrow: 1, flexBasis: 148, minWidth: 130, maxWidth: 220 },
    filterCellPhone: { minWidth: "100%", maxWidth: "100%", flexBasis: "100%" },
    tilePhone: { flexBasis: "47%", flexGrow: 1, maxWidth: "48%" },
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
    sub: { fontSize: 11.5, color: chrome.inkFaint, fontFamily: fonts.regular },
  });
}
