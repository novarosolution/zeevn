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
import AdminInput from "../../components/admin/AdminInput";
import AdminPagination from "../../components/admin/AdminPagination";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { searchAdminReturns } from "../../services/adminService";
import { adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, spacing } from "../../theme/tokens";
import { FONT_PRICE } from "../../theme/typographyRoles";
import { formatRupees, timeAgo } from "../../utils/adminFormat";

const EMPTY = { items: [], total: 0, page: 1, pages: 1, pageSize: 25, counts: { pending: 0, approved: 0, rejected: 0, all: 0 } };
const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

function statusTone(status) {
  if (status === "approved") return "green";
  if (status === "rejected") return "red";
  return "gold";
}

export default function AdminReturnsScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const isAdmin = Boolean(user?.isAdmin);
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);

  const [tab, setTab] = useState(TABS.some((t) => t.key === route?.params?.tab) ? route.params.tab : "pending");
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const query = useMemo(
    () => ({ q, status: tab === "all" ? "" : tab, page, pageSize: 25 }),
    [q, tab, page]
  );
  const requestRef = useRef(0);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      const id = ++requestRef.current;
      if (!silent) setLoading(true);
      try {
        const res = await searchAdminReturns(null, query);
        if (id !== requestRef.current) return;
        setData(res);
        setError("");
      } catch (err) {
        if (id === requestRef.current) setError(err?.message || "Couldn't load returns.");
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

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.gatePanel}>
              <PremiumErrorBanner severity="warning" title={ADMIN_GATE.title} message="This account does not have admin privileges." />
              <PremiumButton label={ADMIN_GATE.backHome} iconLeft="home-outline" variant="primary" size="md" onPress={() => navigation.navigate("Home")} style={styles.gateCta} />
            </View>
          </SectionReveal>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

  const counts = data.counts || {};
  const tabs = TABS.map((item) => ({
    ...item,
    count: item.key === "all" ? counts.all : counts[item.key],
    tone: item.key === "pending" ? "gold" : undefined,
  }));
  const emptyTitle = tab === "pending" ? ADMIN_SCREEN_COPY.returns.emptyPending : ADMIN_SCREEN_COPY.returns.empty;

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
            title={ADMIN_SCREEN_COPY.returns.title}
            subtitle={ADMIN_SCREEN_COPY.returns.subtitle}
            headerRight={<AdminButton label="Refresh" icon="refresh-outline" variant="primary" size="sm" onPress={() => load()} />}
          >
            <View style={styles.panel}>
              <AdminAlerts error={error} onCloseError={() => setError("")} />
              <AdminFilterTabs
                items={tabs}
                value={tab}
                onChange={(key) => {
                  setTab(key);
                  setPage(1);
                }}
              />
              <AdminInput
                value={qInput}
                onChangeText={setQInput}
                placeholder="Search order # or customer"
                icon="search-outline"
                autoCapitalize="none"
              />

              {!loading && data.items.length === 0 ? (
                <PremiumEmptyState iconName="return-down-back-outline" title={emptyTitle} compact />
              ) : (
                <View style={styles.list}>
                  {!compact ? (
                    <View style={styles.head}>
                      <Text style={[styles.headText, { flex: 1.1 }]}>Order</Text>
                      <Text style={[styles.headText, { flex: 1.2 }]}>Customer</Text>
                      <Text style={[styles.headText, { flex: 1.6 }]}>Jars</Text>
                      <Text style={[styles.headText, { width: 88 }]}>Amount</Text>
                      <Text style={[styles.headText, { width: 100 }]}>Status</Text>
                      <Text style={[styles.headText, { width: 88 }]}>Age</Text>
                    </View>
                  ) : null}
                  {data.items.map((row) => (
                    <Pressable
                      key={row._id}
                      onPress={() => navigation.navigate("AdminReturnDetail", { returnId: String(row._id) })}
                      style={({ pressed }) => [compact ? styles.card : styles.row, pressed && styles.pressed]}
                    >
                      {compact ? (
                        <>
                          <View style={styles.cardTop}>
                            <Text style={styles.ref}>{row.publicRef || "Return"}</Text>
                            <Text style={styles.total}>{formatRupees(row.amount)}</Text>
                          </View>
                          <Text style={styles.strong} numberOfLines={1}>
                            {row.customerName}
                          </Text>
                          <Text style={styles.body} numberOfLines={2}>
                            {row.jars}
                          </Text>
                          <View style={styles.cardBadges}>
                            <AdminBadge label={row.status} tone={statusTone(row.status)} />
                            <Text style={styles.sub}>{timeAgo(row.createdAt)}</Text>
                          </View>
                        </>
                      ) : (
                        <>
                          <Text style={[styles.ref, { flex: 1.1 }]} numberOfLines={1}>
                            {row.publicRef || "—"}
                          </Text>
                          <Text style={[styles.strong, { flex: 1.2 }]} numberOfLines={1}>
                            {row.customerName}
                          </Text>
                          <Text style={[styles.body, { flex: 1.6 }]} numberOfLines={2}>
                            {row.jars}
                          </Text>
                          <Text style={[styles.total, { width: 88 }]}>{formatRupees(row.amount)}</Text>
                          <View style={{ width: 100 }}>
                            <AdminBadge label={row.status} tone={statusTone(row.status)} />
                          </View>
                          <Text style={[styles.sub, { width: 88 }]}>{timeAgo(row.createdAt)}</Text>
                        </>
                      )}
                    </Pressable>
                  ))}
                </View>
              )}

              {data.total > 0 ? (
                <AdminPagination page={data.page} pages={data.pages} total={data.total} pageSize={data.pageSize} onPage={setPage} noun="returns" />
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
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    card: { padding: 14, gap: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: chrome.lineSoft },
    cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    cardBadges: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
    pressed: { backgroundColor: chrome.paper },
    ref: { fontSize: 13, color: chrome.ink, fontFamily: fonts.bold },
    strong: { fontSize: 13.5, color: chrome.ink, fontFamily: fonts.semibold },
    body: { fontSize: 13, color: chrome.ink, fontFamily: fonts.regular },
    sub: { fontSize: 11.5, color: chrome.inkFaint, fontFamily: fonts.regular },
    total: { fontFamily: FONT_PRICE, fontSize: 14.5, color: chrome.ink, fontWeight: "600" },
  });
}
