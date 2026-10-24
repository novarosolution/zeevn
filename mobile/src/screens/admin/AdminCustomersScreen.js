import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminAvatar from "../../components/admin/AdminAvatar";
import AdminBadge from "../../components/admin/AdminBadge";
import AdminButton from "../../components/admin/AdminButton";
import AdminFilterTabs from "../../components/admin/AdminFilterTabs";
import AdminInput from "../../components/admin/AdminInput";
import AdminStatTile, { AdminStatGrid } from "../../components/admin/AdminStatTile";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchAdminUsers, searchAdminOrders } from "../../services/adminService";
import { adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, radius, spacing } from "../../theme/tokens";
import { formatRupees, formatShortDate } from "../../utils/adminFormat";
import { adminStatusMeta, orderRef } from "../../utils/adminOrderUi";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

const COPY = ADMIN_SCREEN_COPY.customers;
const TABS = [
  { key: "all", label: "All" },
  { key: "ordered", label: "Ordered" },
  { key: "never", label: "Never ordered" },
  { key: "address", label: "Has address" },
];

function hasAddress(user) {
  return Boolean(String(user?.defaultAddress?.line1 || "").trim());
}

function contactOf(user) {
  return String(user?.phone || "").trim() || String(user?.email || "").trim() || "—";
}

function addressLine(user) {
  const a = user?.defaultAddress || {};
  if (!String(a.line1 || "").trim()) return "No address yet.";
  return [a.houseNumber, a.line1, a.landmark, a.city, a.postalCode].map((part) => String(part || "").trim()).filter(Boolean).join(", ");
}

function matchesTab(user, tab) {
  if (tab === "ordered") return (user.orderCount || 0) >= 1;
  if (tab === "never") return (user.orderCount || 0) < 1;
  if (tab === "address") return hasAddress(user);
  return true;
}

export default function AdminCustomersScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const isAdmin = Boolean(user?.isAdmin);
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);

  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [selectedId, setSelectedId] = useState(String(route?.params?.userId || ""));
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setError("");
      const list = await fetchAdminUsers(null, { isAdmin: false });
      setCustomers(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || "Couldn't load customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    load();
  }, [isAdmin, load]);

  useEffect(() => {
    if (route?.params?.userId) setSelectedId(String(route.params.userId));
  }, [route?.params?.userId]);

  const selected = useMemo(
    () => customers.find((row) => String(row._id) === String(selectedId)) || null,
    [customers, selectedId]
  );

  useEffect(() => {
    if (!selected?._id) {
      setOrders([]);
      return undefined;
    }
    let alive = true;
    setOrdersLoading(true);
    searchAdminOrders(null, { user: selected._id, pageSize: 100, sort: "newest" })
      .then((res) => {
        if (alive) setOrders(Array.isArray(res?.items) ? res.items : []);
      })
      .catch(() => {
        if (alive) setOrders([]);
      })
      .finally(() => {
        if (alive) setOrdersLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [selected?._id]);

  const onPull = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const tiles = useMemo(
    () => ({
      all: customers.length,
      ordered: customers.filter((row) => (row.orderCount || 0) >= 1).length,
      address: customers.filter(hasAddress).length,
    }),
    [customers]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((row) => {
      if (!matchesTab(row, tab)) return false;
      if (!q) return true;
      return [row.name, row.email, row.phone].some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [customers, search, tab]);

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.gatePanel}>
              <PremiumErrorBanner severity="warning" title={ADMIN_GATE.title} message={ADMIN_GATE.message} />
              <PremiumButton
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

  if (selected) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage
          scrollVariant="admin"
          showFooter={false}
          style={customerScrollFill}
          refreshControl={
            Platform.OS === "web" ? undefined : (
              <RefreshControl refreshing={refreshing} onRefresh={onPull} tintColor={c.primary} colors={[c.primary]} />
            )
          }
        >
          <KankregAdminShell
            navigation={navigation}
            route={route}
            title={selected.name || "Customer"}
            subtitle={COPY.subtitle}
            headerRight={<AdminButton label="Customers" icon="chevron-back" variant="ghost" size="sm" onPress={() => setSelectedId("")} />}
          >
            <View style={styles.panel}>
              <AdminAlerts error={error} onCloseError={() => setError("")} />
              <View style={styles.detailHead}>
                <AdminAvatar name={selected.name} uri={selected.avatar} size={48} />
                <View style={styles.detailWho}>
                  <Text style={styles.name}>{selected.name || "—"}</Text>
                  <Text style={styles.meta}>{selected.email || "—"}</Text>
                  <Text style={styles.meta}>{selected.phone || "No phone"}</Text>
                  <Text style={styles.muted}>Joined {formatShortDate(selected.createdAt) || "—"}</Text>
                </View>
                {selected.isDeliveryPartner ? (
                  <Pressable onPress={() => navigation.navigate("AdminRiders")} accessibilityRole="button" accessibilityLabel="Open Riders">
                    <AdminBadge label="Rider" tone="green" size="sm" />
                  </Pressable>
                ) : null}
              </View>
              <Text style={styles.body}>{addressLine(selected)}</Text>
              <Text style={styles.meta}>Reward points {selected.rewardPoints || 0}</Text>

              <Text style={styles.section}>Orders</Text>
              {ordersLoading ? <Text style={styles.muted}>Loading…</Text> : null}
              {!ordersLoading && orders.length === 0 ? <Text style={styles.muted}>No orders yet.</Text> : null}
              {orders.map((order) => {
                const pill = adminStatusMeta(order.status);
                return (
                  <Pressable
                    key={order._id}
                    onPress={() => navigation.navigate("AdminOrderDetail", { orderId: String(order._id) })}
                    style={({ pressed }) => [styles.orderRow, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${orderRef(order)}`}
                  >
                    <Text style={styles.ref}>{orderRef(order)}</Text>
                    <Text style={styles.muted}>{formatShortDate(order.createdAt) || "—"}</Text>
                    <AdminBadge label={pill.label} tone={pill.tone} size="sm" />
                    <Text style={styles.amount}>{formatRupees(order.totalPrice)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </KankregAdminShell>
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
            <RefreshControl refreshing={refreshing} onRefresh={onPull} tintColor={c.primary} colors={[c.primary]} />
          )
        }
      >
        <KankregAdminShell
          navigation={navigation}
          route={route}
          title={COPY.title}
          subtitle={COPY.subtitle}
          headerRight={<AdminButton label="Refresh" icon="refresh-outline" variant="ghost" size="sm" onPress={load} />}
        >
          <View style={styles.panel}>
            <AdminAlerts error={error} onCloseError={() => setError("")} />
            <AdminStatGrid min={compact ? 100 : 160}>
              <AdminStatTile
                icon="people-outline"
                label="Customers"
                value={String(tiles.all)}
                tone="neutral"
                selected={tab === "all"}
                onPress={() => setTab("all")}
                style={compact ? styles.tileRow : undefined}
              />
              <AdminStatTile
                icon="receipt-outline"
                label="Ordered"
                value={String(tiles.ordered)}
                tone={tiles.ordered ? "green" : "neutral"}
                selected={tab === "ordered"}
                onPress={() => setTab("ordered")}
                style={compact ? styles.tileRow : undefined}
              />
              <AdminStatTile
                icon="home-outline"
                label="Has address"
                value={String(tiles.address)}
                tone={tiles.address ? "blue" : "neutral"}
                selected={tab === "address"}
                onPress={() => setTab("address")}
                style={compact ? styles.tileRow : undefined}
              />
            </AdminStatGrid>
            <AdminFilterTabs items={TABS} value={tab} onChange={setTab} />
            <AdminInput label="Search" value={search} onChangeText={setSearch} placeholder="Name, email, or phone" icon="search-outline" />

            {loading ? <Text style={styles.muted}>Loading…</Text> : null}
            {!loading && customers.length === 0 ? <PremiumEmptyState iconName="people-outline" title={COPY.empty} compact /> : null}
            {!loading && customers.length > 0 && visible.length === 0 ? (
              <PremiumEmptyState iconName="search-outline" title={COPY.emptySearch} compact />
            ) : null}

            {!loading && visible.length > 0 && !compact ? (
              <View style={styles.list}>
                <View style={styles.head}>
                  <Text style={[styles.headText, styles.colWho]}>Customer</Text>
                  <Text style={[styles.headText, styles.colCity]}>City</Text>
                  <Text style={[styles.headText, styles.colNum]}>Orders</Text>
                  <Text style={[styles.headText, styles.colAmt]}>Spent</Text>
                  <Text style={[styles.headText, styles.colNum]}>Points</Text>
                </View>
                {visible.map((row) => (
                  <Pressable
                    key={row._id}
                    onPress={() => setSelectedId(String(row._id))}
                    style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${row.name || "customer"}`}
                  >
                    <View style={[styles.who, styles.colWho]}>
                      <AdminAvatar name={row.name} uri={row.avatar} size={32} />
                      <View style={styles.whoText}>
                        <Text style={styles.name}>{row.name || "—"}</Text>
                        <Text style={styles.meta}>{contactOf(row)}</Text>
                      </View>
                    </View>
                    <Text style={[styles.body, styles.colCity]} numberOfLines={1}>
                      {row.defaultAddress?.city || "—"}
                    </Text>
                    <Text style={styles.colNum}>{row.orderCount || 0}</Text>
                    <Text style={styles.colAmt}>{formatRupees(row.spent)}</Text>
                    <Text style={styles.colNum}>{row.rewardPoints || 0}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {!loading && compact
              ? visible.map((row) => (
                  <Pressable
                    key={row._id}
                    onPress={() => setSelectedId(String(row._id))}
                    style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${row.name || "customer"}`}
                  >
                    <View style={styles.cardTop}>
                      <AdminAvatar name={row.name} uri={row.avatar} size={40} />
                      <View style={styles.whoText}>
                        <Text style={styles.name}>{row.name || "—"}</Text>
                        <Text style={styles.meta}>{contactOf(row)}</Text>
                        <Text style={styles.muted}>{row.defaultAddress?.city || "—"}</Text>
                      </View>
                    </View>
                    <Text style={styles.meta}>
                      {row.orderCount || 0} orders · {formatRupees(row.spent)} · {row.rewardPoints || 0} pts
                    </Text>
                  </Pressable>
                ))
              : null}
          </View>
        </KankregAdminShell>
      </KankregScrollPage>
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium) {
  return StyleSheet.create({
    screen: { flex: 1, width: "100%" },
    panel: { ...adminShellContent(), gap: spacing.sm },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    tileRow: { flexBasis: "31%", flexGrow: 1, maxWidth: "33%" },
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
    },
    card: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      backgroundColor: c.surface,
      gap: 6,
    },
    cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    pressed: { opacity: 0.72 },
    who: { flexDirection: "row", alignItems: "center", gap: 10 },
    whoText: { flex: 1, minWidth: 0 },
    name: { color: chrome.ink, fontFamily: fonts.semibold, fontSize: 15 },
    meta: { color: chrome.inkSoft, fontFamily: fonts.regular, fontSize: 12 },
    muted: { color: chrome.inkFaint, fontFamily: fonts.medium, fontSize: 12 },
    body: { color: chrome.ink, fontFamily: fonts.regular, fontSize: 13 },
    ref: { color: chrome.ink, fontFamily: fonts.bold, fontSize: 13, width: 92 },
    amount: { color: chrome.ink, fontFamily: fonts.semibold, fontSize: 13 },
    section: { marginTop: spacing.sm, color: chrome.ink, fontFamily: fonts.semibold, fontSize: 14 },
    detailHead: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
    detailWho: { flex: 1, minWidth: 0, gap: 2 },
    orderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
    },
    colWho: { flex: 1.6, minWidth: 180 },
    colCity: { flex: 0.8, minWidth: 80 },
    colNum: { width: 64, color: chrome.ink, fontFamily: fonts.semibold, fontSize: 13, textAlign: "right" },
    colAmt: { width: 88, color: chrome.ink, fontFamily: fonts.semibold, fontSize: 13, textAlign: "right" },
  });
}
