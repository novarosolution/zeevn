import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
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
import PremiumChip from "../../components/ui/PremiumChip";
import AdminEmptyState from "../../components/admin/AdminEmptyState";
import AdminNotice from "../../components/admin/AdminNotice";
import AdminLoader from "../../components/admin/AdminLoader";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchAdminLogs } from "../../services/adminService";
import { adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, radius, spacing } from "../../theme/tokens";
import { formatShortDateTime } from "../../utils/adminFormat";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

const COPY = ADMIN_SCREEN_COPY.logs;
const EMPTY = { items: [], total: 0, page: 1, pages: 1, pageSize: 25 };

const RANGES = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
];

const TABS = [
  { key: "all", label: "All" },
  { key: "orders", label: "Orders" },
  { key: "catalog", label: "Catalog" },
  { key: "riders", label: "Riders" },
  { key: "shop", label: "Shop" },
  { key: "people", label: "People" },
];

const ACTION_CHIPS = [
  { key: "", label: "All actions" },
  { key: "walk-in", label: "Walk-in" },
  { key: "Transferred", label: "Transfers" },
  { key: "Stock out", label: "Stock out" },
];

export default function AdminLogsScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const isAdmin = Boolean(user?.isAdmin);
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium, compact), [chrome, c, shadowPremium, compact]);

  const [range, setRange] = useState("today");
  const [tab, setTab] = useState("all");
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const requestRef = useRef(0);

  const query = useMemo(
    () => ({ range, tab: tab === "all" ? "" : tab, q, page, pageSize: 25 }),
    [range, tab, q, page]
  );

  const load = useCallback(
    async ({ silent = false } = {}) => {
      const id = ++requestRef.current;
      if (!silent) setLoading(true);
      try {
        const res = await fetchAdminLogs(null, query);
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
        if (id === requestRef.current) setError(err.message || "Unable to load logs.");
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

  const onPull = async () => {
    setRefreshing(true);
    try {
      await load({ silent: true });
    } finally {
      setRefreshing(false);
    }
  };

  const openRow = (row) => {
    if (!row?.href?.screen) return;
    navigation.navigate(row.href.screen, row.href.params || {});
  };

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.gatePanel}>
              <AdminNotice severity="warning" title={ADMIN_GATE.title} message={ADMIN_GATE.message} />
              <AdminButton label={ADMIN_GATE.backHome} variant="primary" onPress={() => navigateCustomerRoute(navigation, "Home")} style={styles.gateCta} />
            </View>
          </SectionReveal>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

  const renderRow = (row) => {
    const canOpen = Boolean(row.href?.screen);
    const body = (
      <>
        <Text style={styles.action} numberOfLines={2}>
          {row.action}
        </Text>
        <Text style={styles.subject} numberOfLines={1}>
          {row.subject || "—"}
        </Text>
        <Text style={styles.who} numberOfLines={1}>
          {row.adminName || "Admin"}
        </Text>
      </>
    );

    if (compact) {
      return (
        <Pressable
          key={row.id}
          onPress={canOpen ? () => openRow(row) : undefined}
          disabled={!canOpen}
          style={({ pressed }) => [styles.card, canOpen && pressed && styles.pressed]}
          accessibilityRole={canOpen ? "button" : undefined}
          accessibilityLabel={canOpen ? `${row.action} ${row.subject}` : undefined}
        >
          <View style={styles.cardCopy}>{body}</View>
          <Text style={styles.when}>{formatShortDateTime(row.at)}</Text>
        </Pressable>
      );
    }

    return (
      <Pressable
        key={row.id}
        onPress={canOpen ? () => openRow(row) : undefined}
        disabled={!canOpen}
        style={({ pressed }) => [styles.row, canOpen && pressed && styles.pressed]}
        accessibilityRole={canOpen ? "button" : undefined}
      >
        <Text style={[styles.who, { flex: 1 }]} numberOfLines={1}>
          {row.adminName || "Admin"}
        </Text>
        <Text style={[styles.action, { flex: 1.6 }]} numberOfLines={2}>
          {row.action}
        </Text>
        <Text style={[styles.subject, { flex: 1.3 }]} numberOfLines={1}>
          {row.subject || "—"}
        </Text>
        <Text style={[styles.when, { width: 120, textAlign: "right" }]}>{formatShortDateTime(row.at)}</Text>
      </Pressable>
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

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.chipScroll}>
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
                items={TABS}
                value={tab}
                onChange={(key) => {
                  setTab(key);
                  setPage(1);
                }}
              />

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.chipScroll}>
                {ACTION_CHIPS.map((item) => (
                  <PremiumChip
                    key={item.key || "all-actions"}
                    label={item.label}
                    tone="gold"
                    size="sm"
                    selected={q === item.key}
                    onPress={() => {
                      setQInput(item.key);
                      setQ(item.key);
                      setPage(1);
                    }}
                  />
                ))}
              </ScrollView>

              <AdminInput
                label="Search"
                value={qInput}
                onChangeText={setQInput}
                placeholder="Action or subject"
                icon="search-outline"
                autoCapitalize="none"
              />

              {loading ? <AdminLoader size="sm" caption="Loading logs…" /> : null}
              {!loading && data.items.length === 0 ? <AdminEmptyState iconName="time-outline" title={COPY.empty} compact /> : null}
              {!loading && data.items.length > 0 ? (
                <View style={styles.list}>
                  {!compact ? (
                    <View style={styles.head}>
                      <Text style={[styles.headText, { flex: 1 }]}>Who</Text>
                      <Text style={[styles.headText, { flex: 1.6 }]}>Action</Text>
                      <Text style={[styles.headText, { flex: 1.3 }]}>Subject</Text>
                      <Text style={[styles.headText, { width: 120, textAlign: "right" }]}>Time</Text>
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
                  noun="rows"
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
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    card: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
    },
    cardCopy: { flex: 1, minWidth: 0, gap: 3 },
    action: { fontSize: 14, color: chrome.ink, fontFamily: fonts.semibold },
    subject: { fontSize: 13, color: chrome.inkSoft, fontFamily: fonts.regular },
    who: { fontSize: 12, color: chrome.inkFaint, fontFamily: fonts.medium },
    when: { fontSize: compact ? 12 : 12.5, color: chrome.inkSoft, fontFamily: fonts.medium, flexShrink: 0 },
    pressed: { opacity: 0.7 },
  });
}
