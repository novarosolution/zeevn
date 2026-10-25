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
import AdminFilterTabs from "../../components/admin/AdminFilterTabs";
import AdminProductCell from "../../components/admin/AdminProductCell";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchAdminReorders, saveAdminStockInDraft } from "../../services/adminService";
import { adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, spacing } from "../../theme/tokens";
import { FONT_PRICE } from "../../theme/typographyRoles";

const COPY = ADMIN_SCREEN_COPY.reorders;
const TABS = [
  { key: "needs", label: "Needs" },
  { key: "low", label: "Low or out" },
  { key: "all", label: "All" },
];
const PERIODS = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
];
const COVERS = [
  { key: "3", label: "3 days" },
  { key: "7", label: "7 days" },
];

function rateLabel(n) {
  const v = Number(n) || 0;
  if (Math.abs(v - Math.round(v)) < 0.05) return String(Math.round(v));
  return v.toFixed(1);
}

function matchesTab(row, tab) {
  if (tab === "needs") return row.suggest >= 1 || row.belowMin;
  if (tab === "low") return row.out || row.low || row.belowMin;
  return true;
}

export default function AdminReordersScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const isAdmin = Boolean(user?.isAdmin);
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium, compact), [chrome, c, shadowPremium, compact]);

  const [period, setPeriod] = useState(route?.params?.period === 30 || route?.params?.period === "30" ? "30" : "7");
  const [cover, setCover] = useState(route?.params?.cover === 7 || route?.params?.cover === "7" ? "7" : "3");
  const [tab, setTab] = useState(TABS.some((t) => t.key === route?.params?.tab) ? route.params.tab : "needs");
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ needs: 0, low: 0, all: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(false);
  const requestRef = useRef(0);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      const id = ++requestRef.current;
      if (!silent) setLoading(true);
      try {
        const res = await fetchAdminReorders(null, { period, cover });
        if (id !== requestRef.current) return;
        setItems(Array.isArray(res.items) ? res.items : []);
        setCounts(res.counts || { needs: 0, low: 0, all: 0 });
        setError("");
      } catch (err) {
        if (id === requestRef.current) setError(err?.message || "Couldn't load reorders.");
      } finally {
        if (id === requestRef.current) setLoading(false);
      }
    },
    [period, cover]
  );

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const onPull = async () => {
    setRefreshing(true);
    try {
      await load({ silent: true });
    } finally {
      setRefreshing(false);
    }
  };

  const visible = useMemo(() => items.filter((row) => matchesTab(row, tab)), [items, tab]);
  const needs = useMemo(() => items.filter((row) => row.suggest >= 1), [items]);

  const bookDelivery = async () => {
    if (!needs.length || booking) return;
    setBooking(true);
    setError("");
    try {
      const draft = await saveAdminStockInDraft(null, {
        note: "Suggested reorder",
        lines: needs.map((row) => ({ product: row.id, quantity: row.suggest })),
      });
      navigation.navigate("AdminStockIn", { receiptId: String(draft._id), tab: "draft" });
    } catch (err) {
      setError(err?.message || "Couldn't open a delivery draft.");
    } finally {
      setBooking(false);
    }
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

  const tabs = TABS.map((item) => ({
    ...item,
    count: counts[item.key],
    tone: item.key === "needs" && counts.needs > 0 ? "gold" : item.key === "low" && counts.low > 0 ? "red" : undefined,
  }));
  const emptyTitle = tab === "needs" ? COPY.emptyNeeds : tab === "low" ? COPY.emptyLow : COPY.emptyAll;

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
            headerRight={
              <View style={styles.headerActions}>
                {needs.length ? (
                  <AdminButton label="Book a delivery" icon="download-outline" variant="primary" size="sm" loading={booking} onPress={bookDelivery} />
                ) : null}
                <AdminButton label="Refresh" icon="refresh-outline" variant="soft" size="sm" onPress={() => load()} />
              </View>
            }
          >
            <View style={styles.panel}>
              <AdminAlerts error={error} onCloseError={() => setError("")} />
              <View style={compact ? styles.segmentsStack : styles.segmentsRow}>
                <View style={styles.segmentBlock}>
                  <Text style={styles.segmentLabel}>Period</Text>
                  <AdminFilterTabs items={PERIODS} value={period} onChange={setPeriod} />
                </View>
                <View style={styles.segmentBlock}>
                  <Text style={styles.segmentLabel}>Cover</Text>
                  <AdminFilterTabs items={COVERS} value={cover} onChange={setCover} />
                </View>
              </View>
              <AdminFilterTabs items={tabs} value={tab} onChange={setTab} />

              {!loading && visible.length === 0 ? (
                <PremiumEmptyState iconName="refresh-outline" title={emptyTitle} compact />
              ) : (
                <View style={styles.list}>
                  {!compact ? (
                    <View style={styles.head}>
                      <Text style={[styles.headText, { flex: 1.8 }]}>Product</Text>
                      <Text style={[styles.headText, { width: 64 }]}>On hand</Text>
                      <Text style={[styles.headText, { width: 56 }]}>Sold</Text>
                      <Text style={[styles.headText, { width: 64 }]}>/ day</Text>
                      <Text style={[styles.headText, { width: 64 }]}>Suggest</Text>
                      <Text style={[styles.headText, { flex: 1.6 }]}>Why</Text>
                    </View>
                  ) : null}
                  {visible.map((row) => (
                    <View key={row.id} style={compact ? styles.card : styles.row}>
                      {compact ? (
                        <>
                          <View style={styles.cardTop}>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <AdminProductCell name={row.name} imageUri={row.image} />
                              <Text style={styles.sub} numberOfLines={1}>
                                {row.sku || "No SKU"}
                                {row.unit ? ` · ${row.unit}` : ""}
                              </Text>
                            </View>
                            <Text style={styles.suggest}>{row.suggest}</Text>
                          </View>
                          <Text style={styles.meta}>
                            On hand {row.onHand} · web {row.online ?? "—"} · floor {row.counter ?? "—"} · sold {row.sold} · {rateLabel(row.perDay)} a day
                          </Text>
                          <Text style={styles.reason}>{row.reason}</Text>
                          {row.out ? <AdminBadge label="Out" tone="red" size="sm" /> : row.low ? <AdminBadge label="Low" tone="gold" size="sm" /> : null}
                          {row.belowMin ? <AdminBadge label="Below min" tone="gold" size="sm" /> : null}
                        </>
                      ) : (
                        <>
                          <View style={{ flex: 1.8, minWidth: 0 }}>
                            <AdminProductCell name={row.name} imageUri={row.image} />
                            <Text style={styles.sub} numberOfLines={1}>
                              {row.sku || "No SKU"}
                              {row.unit ? ` · ${row.unit}` : ""}
                            </Text>
                          </View>
                          <Text style={[styles.body, { width: 64 }]}>{row.onHand}</Text>
                          <Text style={[styles.body, { width: 56 }]}>{row.sold}</Text>
                          <Text style={[styles.body, { width: 64 }]}>{rateLabel(row.perDay)}</Text>
                          <Text style={[styles.suggest, { width: 64 }]}>{row.suggest}</Text>
                          <View style={{ flex: 1.6 }}>
                            <Text style={styles.reason}>{row.reason}</Text>
                            {row.belowMin ? <AdminBadge label="Below min" tone="gold" size="sm" /> : null}
                          </View>
                        </>
                      )}
                    </View>
                  ))}
                </View>
              )}
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
    panel: { ...adminShellContent(), gap: spacing.sm + 2 },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
    segmentsRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    segmentsStack: { gap: 10 },
    segmentBlock: { flexGrow: 1, minWidth: compact ? "100%" : 220, gap: 6 },
    segmentLabel: {
      fontSize: 10.5,
      letterSpacing: 0.7,
      textTransform: "uppercase",
      color: chrome.inkFaint,
      fontFamily: fonts.semibold,
    },
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
      gap: 12,
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
      alignItems: "flex-start",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
    },
    card: { padding: 14, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: chrome.lineSoft },
    cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
    body: { fontSize: 13, color: chrome.ink, fontFamily: fonts.regular },
    sub: { marginTop: 2, fontSize: 11.5, color: chrome.inkFaint, fontFamily: fonts.regular },
    meta: { fontSize: 12.5, color: chrome.inkSoft, fontFamily: fonts.regular },
    reason: { fontSize: 12.5, lineHeight: 18, color: chrome.inkSoft, fontFamily: fonts.regular },
    suggest: { fontFamily: FONT_PRICE, fontSize: 18, color: chrome.ink, fontWeight: "600" },
  });
}
