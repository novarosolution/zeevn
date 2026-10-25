import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminBadge from "../../components/admin/AdminBadge";
import AdminButton from "../../components/admin/AdminButton";
import AdminFilterTabs from "../../components/admin/AdminFilterTabs";
import AdminInput from "../../components/admin/AdminInput";
import AdminPagination from "../../components/admin/AdminPagination";
import PremiumChip from "../../components/ui/PremiumChip";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumLoader from "../../components/ui/PremiumLoader";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchAdminStockHistory } from "../../services/adminService";
import { adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, radius, spacing } from "../../theme/tokens";
import { formatShortDateTime } from "../../utils/adminFormat";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

const COPY = ADMIN_SCREEN_COPY.stockHistory;
const EMPTY = { items: [], total: 0, page: 1, pages: 1, pageSize: 25 };

const RANGES = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "all", label: "All" },
];

const LOCATIONS = [
  { key: "all", label: "All piles" },
  { key: "online", label: "Online" },
  { key: "counter", label: "Floor" },
];

const WHYS = [
  { key: "all", label: "All" },
  { key: "manual", label: "Manual" },
  { key: "stock-in", label: "Stock in" },
  { key: "sale", label: "Sale" },
  { key: "cancel", label: "Cancel" },
  { key: "return", label: "Return" },
  { key: "transfer", label: "Transfer" },
  { key: "stock-out", label: "Stock out" },
  { key: "walk-in", label: "Walk-in" },
];

function whyLabel(why) {
  return WHYS.find((item) => item.key === why)?.label || why || "";
}

function whyTone(why) {
  if (why === "stock-in" || why === "cancel" || why === "return") return "green";
  if (why === "sale" || why === "walk-in" || why === "stock-out") return "red";
  if (why === "manual" || why === "transfer") return "gold";
  return "neutral";
}

function formatDelta(n) {
  const v = Number(n) || 0;
  return v > 0 ? `+${v}` : String(v);
}

export default function AdminStockHistoryScreen({ navigation, route }) {
  const { user, token } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium, compact), [chrome, c, shadowPremium, compact]);

  const [range, setRange] = useState("7d");
  const [why, setWhy] = useState(route?.params?.why && route.params.why !== "all" ? route.params.why : "all");
  const [location, setLocation] = useState("all");
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const query = useMemo(
    () => ({
      range,
      why: why === "all" ? "" : why,
      location: location === "all" ? "" : location,
      q,
      page,
      pageSize: 25,
    }),
    [range, why, location, q, page]
  );
  const requestRef = useRef(0);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      const id = ++requestRef.current;
      if (!silent) setLoading(true);
      try {
        const res = await fetchAdminStockHistory(token, query);
        if (id !== requestRef.current) return;
        setData({
          items: Array.isArray(res?.items) ? res.items : [],
          total: Number(res?.total) || 0,
          page: Number(res?.page) || 1,
          pages: Number(res?.pages) || 1,
          pageSize: Number(res?.pageSize) || 25,
        });
        setError("");
      } catch (err) {
        if (id === requestRef.current) setError(err.message || "Unable to load stock history.");
      } finally {
        if (id === requestRef.current) setLoading(false);
      }
    },
    [token, query]
  );

  useEffect(() => {
    if (user?.isAdmin) load();
  }, [user?.isAdmin, load]);

  useEffect(() => {
    const next = qInput.trim();
    if (next === q) return undefined;
    const timer = setTimeout(() => {
      setQ(next);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [qInput, q]);

  const onPull = async () => {
    setRefreshing(true);
    try {
      await load({ silent: true });
    } finally {
      setRefreshing(false);
    }
  };

  const openProduct = (row) => {
    const search = String(row.sku || row.name || "").trim();
    if (search) navigation.navigate("AdminInventory", { search });
  };

  const openOrder = (row) => {
    if (row.orderId) navigation.navigate("AdminOrderDetail", { orderId: String(row.orderId) });
  };

  const openReceipt = (row) => {
    if (row.receiptId) navigation.navigate("AdminStockIn", { receiptId: String(row.receiptId) });
  };

  const openTransfer = (row) => {
    if (row.transferId) navigation.navigate("AdminTransfers", { transferId: String(row.transferId) });
  };

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.gatePanel}>
              <PremiumErrorBanner severity="warning" title={ADMIN_GATE.title} message={ADMIN_GATE.message} />
              <AdminButton label={ADMIN_GATE.backHome} variant="primary" onPress={() => navigateCustomerRoute(navigation, "Home")} style={styles.gateCta} />
            </View>
          </SectionReveal>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

  const renderRow = (row) => {
    const up = Number(row.change) > 0;
    const deltaColor = up ? chrome.green : chrome.danger;
    const productLabel = row.name || "Jar";
    const skuLine = row.sku ? row.sku : "";
    const extra = row.orderRef || row.receiptNote || "";

    if (compact) {
      return (
        <View key={row.id} style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.when}>{formatShortDateTime(row.at)}</Text>
            <Text style={[styles.delta, { color: deltaColor }]}>{formatDelta(row.change)}</Text>
          </View>
          <Pressable onPress={() => openProduct(row)} accessibilityRole="button" accessibilityLabel={`Open stock for ${productLabel}`}>
            <Text style={styles.product} numberOfLines={1}>
              {productLabel}
            </Text>
            {skuLine ? (
              <Text style={styles.meta} numberOfLines={1}>
                {skuLine}
              </Text>
            ) : null}
          </Pressable>
          <Text style={styles.body}>
            {row.before} → {row.after}
          </Text>
          <View style={styles.cardBadges}>
            <AdminBadge label={whyLabel(row.why)} tone={whyTone(row.why)} size="sm" />
            <AdminBadge label={row.location === "counter" ? "Floor" : "Online"} tone="neutral" size="sm" />
            <Text style={styles.meta} numberOfLines={1}>
              {row.who || "—"}
            </Text>
          </View>
          {row.orderRef ? (
            <Pressable onPress={() => openOrder(row)} accessibilityRole="button" accessibilityLabel={`Open ${row.orderRef}`}>
              <Text style={styles.link}>{row.orderRef}</Text>
            </Pressable>
          ) : null}
          {row.why === "stock-in" && row.receiptId ? (
            <Pressable onPress={() => openReceipt(row)} accessibilityRole="button" accessibilityLabel="Open stock-in receipt">
              <Text style={styles.link}>{row.receiptNote || "Open receipt"}</Text>
            </Pressable>
          ) : row.why === "transfer" && row.transferId ? (
            <Pressable onPress={() => openTransfer(row)} accessibilityRole="button" accessibilityLabel="Open transfer">
              <Text style={styles.link}>Open transfer</Text>
            </Pressable>
          ) : extra && !row.orderRef ? (
            <Text style={styles.meta} numberOfLines={2}>
              {extra}
            </Text>
          ) : null}
        </View>
      );
    }

    return (
      <View key={row.id} style={styles.row}>
        <Text style={[styles.cell, styles.when, { flex: 1.15 }]} numberOfLines={2}>
          {formatShortDateTime(row.at)}
        </Text>
        <Pressable
          style={{ flex: 1.5, minWidth: 0 }}
          onPress={() => openProduct(row)}
          accessibilityRole="button"
          accessibilityLabel={`Open stock for ${productLabel}`}
        >
          <Text style={styles.product} numberOfLines={1}>
            {productLabel}
          </Text>
          {skuLine ? (
            <Text style={styles.meta} numberOfLines={1}>
              {skuLine}
            </Text>
          ) : null}
        </Pressable>
        <Text style={[styles.num, { width: 56 }]}>{row.before}</Text>
        <Text style={[styles.delta, { width: 64, color: deltaColor }]}>{formatDelta(row.change)}</Text>
        <Text style={[styles.num, { width: 56 }]}>{row.after}</Text>
        <View style={{ width: 88 }}>
          <AdminBadge label={whyLabel(row.why)} tone={whyTone(row.why)} size="sm" />
        </View>
        <View style={{ width: 72 }}>
          <AdminBadge label={row.location === "counter" ? "Floor" : "Online"} tone="neutral" size="sm" />
        </View>
        <Text style={[styles.body, { flex: 0.9 }]} numberOfLines={1}>
          {row.who || "—"}
        </Text>
        {row.orderRef ? (
          <Pressable style={{ width: 88 }} onPress={() => openOrder(row)} accessibilityRole="button">
            <Text style={styles.link} numberOfLines={1}>
              {row.orderRef}
            </Text>
          </Pressable>
        ) : row.why === "transfer" && row.transferId ? (
          <Pressable style={{ width: 88 }} onPress={() => openTransfer(row)} accessibilityRole="button">
            <Text style={styles.link} numberOfLines={1}>
              Transfer
            </Text>
          </Pressable>
        ) : row.why === "stock-in" && row.receiptId ? (
          <Pressable style={{ width: 88 }} onPress={() => openReceipt(row)} accessibilityRole="button">
            <Text style={styles.link} numberOfLines={1}>
              Receipt
            </Text>
          </Pressable>
        ) : (
          <Text style={[styles.meta, { width: 88 }]}>—</Text>
        )}
      </View>
    );
  };

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

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                {RANGES.map((item) => (
                  <PremiumChip
                    key={item.key}
                    label={item.label}
                    tone="gold"
                    size="sm"
                    selected={range === item.key}
                    onPress={() => {
                      setRange(item.key);
                      setPage(1);
                    }}
                  />
                ))}
              </ScrollView>

              <AdminFilterTabs
                items={LOCATIONS}
                value={location}
                onChange={(key) => {
                  setLocation(key);
                  setPage(1);
                }}
              />

              <AdminFilterTabs
                items={WHYS}
                value={why}
                onChange={(key) => {
                  setWhy(key);
                  setPage(1);
                }}
              />

              <AdminInput
                label="Search"
                value={qInput}
                onChangeText={setQInput}
                placeholder="Name, SKU, or order ref"
                icon="search-outline"
                autoCapitalize="none"
              />

              {loading ? <PremiumLoader size="sm" caption="Loading stock history…" /> : null}
              {!loading && data.items.length === 0 ? (
                <PremiumEmptyState iconName="time-outline" title={COPY.empty} compact />
              ) : null}
              {!loading && data.items.length > 0 ? (
                <View style={styles.list}>
                  {!compact ? (
                    <View style={styles.head}>
                      <Text style={[styles.headText, { flex: 1.15 }]}>Time</Text>
                      <Text style={[styles.headText, { flex: 1.5 }]}>Product</Text>
                      <Text style={[styles.headText, { width: 56 }]}>Before</Text>
                      <Text style={[styles.headText, { width: 64 }]}>Change</Text>
                      <Text style={[styles.headText, { width: 56 }]}>After</Text>
                      <Text style={[styles.headText, { width: 88 }]}>Why</Text>
                      <Text style={[styles.headText, { width: 72 }]}>Pile</Text>
                      <Text style={[styles.headText, { flex: 0.9 }]}>Who</Text>
                      <Text style={[styles.headText, { width: 88 }]}>Order</Text>
                    </View>
                  ) : null}
                  {data.items.map(renderRow)}
                </View>
              ) : null}

              {data.total > 0 ? (
                <AdminPagination
                  page={data.page}
                  pages={data.pages}
                  total={data.total}
                  pageSize={data.pageSize}
                  onPage={setPage}
                  noun="changes"
                />
              ) : null}
            </View>
          </KankregAdminShell>
        </KankregScrollPage>
      </KeyboardAvoidingView>
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium, compact) {
  return StyleSheet.create({
    screen: { flex: 1, width: "100%", alignSelf: "center", maxWidth: "100%" },
    panel: { ...adminShellContent(), gap: spacing.sm },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    chipScroll: { flexDirection: "row", gap: 8, paddingRight: 8 },
    list: {
      backgroundColor: chrome.card,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      overflow: "hidden",
    },
    head: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: chrome.paper,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.line,
    },
    headText: {
      fontSize: 10.5,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      color: chrome.inkFaint,
      fontFamily: fonts.semibold,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
    },
    card: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
    },
    cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    cardBadges: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    when: { fontSize: compact ? 12 : 12.5, color: chrome.inkSoft, fontFamily: fonts.medium },
    product: {
      fontSize: 13.5,
      color: chrome.ink,
      fontFamily: fonts.semibold,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    body: { fontSize: 13, color: chrome.ink, fontFamily: fonts.regular },
    meta: { fontSize: 12, color: chrome.inkFaint, fontFamily: fonts.regular },
    num: { fontSize: 13.5, color: chrome.ink, fontFamily: fonts.semibold },
    delta: { fontSize: 14, fontFamily: fonts.bold },
    link: {
      fontSize: 13,
      color: chrome.goldDeep,
      fontFamily: fonts.semibold,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    cell: { minWidth: 0 },
  });
}
