import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, RefreshControl, StyleSheet, Text, View } from "react-native";
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
import AdminSwitch from "../../components/admin/AdminSwitch";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumLoader from "../../components/ui/PremiumLoader";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchAdminUsers, updateAdminRole, updateDeliveryPartnerRole } from "../../services/adminService";
import { ADMIN_FONT, adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { radius, spacing } from "../../theme/tokens";
import { formatRupees } from "../../utils/adminFormat";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

const COPY = ADMIN_SCREEN_COPY.users;
const TABS = [
  { key: "all", label: "All" },
  { key: "admins", label: "Admins" },
  { key: "riders", label: "Riders" },
  { key: "customers", label: "Customers" },
];

function matchesTab(row, tab) {
  if (tab === "admins") return Boolean(row.isAdmin);
  if (tab === "riders") return Boolean(row.isDeliveryPartner);
  if (tab === "customers") return !row.isAdmin;
  return true;
}

function matchesSearch(row, q) {
  if (!q) return true;
  return [row.name, row.email, row.phone].some((value) => String(value || "").toLowerCase().includes(q));
}

export default function AdminUsersScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const isAdmin = Boolean(user?.isAdmin);
  const meId = String(user?.id || user?._id || "");
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium, compact), [chrome, c, shadowPremium, compact]);

  const [people, setPeople] = useState([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const list = await fetchAdminUsers(null);
      setPeople(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const onPull = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const counts = useMemo(
    () => ({
      all: people.length,
      admins: people.filter((row) => row.isAdmin).length,
      riders: people.filter((row) => row.isDeliveryPartner).length,
      customers: people.filter((row) => !row.isAdmin).length,
    }),
    [people]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return people.filter((row) => matchesTab(row, tab) && matchesSearch(row, q));
  }, [people, search, tab]);

  const setAdmin = async (row, next) => {
    if (String(row._id) === meId && !next) {
      setError("You can’t remove your own admin access.");
      return;
    }
    setBusyId(String(row._id));
    setPeople((list) => list.map((item) => (String(item._id) === String(row._id) ? { ...item, isAdmin: next } : item)));
    try {
      await updateAdminRole(null, row._id, next);
      await load();
    } catch (err) {
      setPeople((list) => list.map((item) => (String(item._id) === String(row._id) ? { ...item, isAdmin: row.isAdmin } : item)));
      setError(err.message || "Couldn't update admin access.");
    } finally {
      setBusyId("");
    }
  };

  const setRider = async (row, next) => {
    setBusyId(String(row._id));
    setPeople((list) => list.map((item) => (String(item._id) === String(row._id) ? { ...item, isDeliveryPartner: next } : item)));
    try {
      await updateDeliveryPartnerRole(null, row._id, next);
    } catch (err) {
      setPeople((list) => list.map((item) => (String(item._id) === String(row._id) ? { ...item, isDeliveryPartner: row.isDeliveryPartner } : item)));
      setError(err.message || "Couldn't update rider access.");
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
              <AdminButton label={ADMIN_GATE.backHome} variant="primary" onPress={() => navigateCustomerRoute(navigation, "Home")} style={styles.gateCta} />
            </View>
          </SectionReveal>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

  const tabs = TABS.map((item) => ({ ...item, count: counts[item.key] }));

  const renderRow = (row) => {
    const id = String(row._id);
    const self = id === meId;
    const adminOn = Boolean(row.isAdmin);
    const riderOn = Boolean(row.isDeliveryPartner);
    const busy = busyId === id;
    const pills = (
      <View style={styles.pills}>
        {adminOn ? <AdminBadge label="Admin" tone="gold" size="sm" /> : null}
        {riderOn ? <AdminBadge label="Rider" tone="green" size="sm" /> : null}
      </View>
    );
    const switches = (
      <View style={compact ? styles.cardSwitches : styles.rowSwitches}>
        <View style={styles.switchItem}>
          <Text style={styles.switchLabel}>Admin</Text>
          <AdminSwitch value={adminOn} onChange={(next) => setAdmin(row, next)} disabled={busy || self} accessibilityLabel={`Admin ${row.name || row.email}`} />
        </View>
        <View style={styles.switchItem}>
          <Text style={styles.switchLabel}>Rider</Text>
          <AdminSwitch value={riderOn} onChange={(next) => setRider(row, next)} disabled={busy} accessibilityLabel={`Rider ${row.name || row.email}`} />
        </View>
      </View>
    );
    const stats = !adminOn ? (
      <Text style={styles.meta}>
        {Number(row.orderCount) || 0} orders · {formatRupees(row.spent || 0)}
      </Text>
    ) : null;

    if (compact) {
      return (
        <View key={id} style={styles.card}>
          <Text style={styles.name} numberOfLines={1}>
            {row.name || "Unnamed"}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {row.email || "—"}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {row.phone || "No phone"}
          </Text>
          {pills}
          {stats}
          {switches}
        </View>
      );
    }

    return (
      <View key={id} style={styles.row}>
        <View style={{ flex: 1.3, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>
            {row.name || "Unnamed"}
          </Text>
          {pills}
        </View>
        <Text style={[styles.meta, { flex: 1.3 }]} numberOfLines={1}>
          {row.email || "—"}
        </Text>
        <Text style={[styles.meta, { flex: 0.9 }]} numberOfLines={1}>
          {row.phone || "—"}
        </Text>
        <Text style={[styles.meta, { width: 140 }]}>{adminOn ? "—" : `${Number(row.orderCount) || 0} · ${formatRupees(row.spent || 0)}`}</Text>
        {switches}
      </View>
    );
  };

  return (
    <AdminScreenShell style={styles.screen}>
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
          headerRight={<AdminButton label="Refresh" icon="refresh-outline" variant="ghost" size="sm" onPress={load} />}
        >
          <View style={styles.panel}>
            <AdminAlerts error={error} onCloseError={() => setError("")} />
            <AdminFilterTabs items={tabs} value={tab} onChange={setTab} />
            <AdminInput
              label="Search"
              value={search}
              onChangeText={setSearch}
              placeholder="Name, email, or phone"
              icon="search-outline"
              autoCapitalize="none"
            />

            {loading ? <PremiumLoader size="sm" caption="Loading users…" /> : null}
            {!loading && visible.length === 0 ? <PremiumEmptyState iconName="people-outline" title={COPY.empty} compact /> : null}
            {!loading && visible.length > 0 ? (
              <View style={styles.list}>
                {!compact ? (
                  <View style={styles.head}>
                    <Text style={[styles.headText, { flex: 1.3 }]}>Name</Text>
                    <Text style={[styles.headText, { flex: 1.3 }]}>Email</Text>
                    <Text style={[styles.headText, { flex: 0.9 }]}>Phone</Text>
                    <Text style={[styles.headText, { width: 140 }]}>Orders</Text>
                    <Text style={[styles.headText, { width: 148 }]}>Access</Text>
                  </View>
                ) : null}
                {visible.map(renderRow)}
              </View>
            ) : null}
          </View>
        </KankregAdminShell>
      </KankregScrollPage>
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium, compact) {
  return StyleSheet.create({
    screen: { flex: 1, width: "100%", alignSelf: "center", maxWidth: "100%" },
    panel: { ...adminShellContent(), gap: spacing.sm },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
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
      fontFamily: ADMIN_FONT.semibold,
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
    name: { fontSize: 14, color: chrome.ink, fontFamily: ADMIN_FONT.semibold },
    meta: { fontSize: 12.5, color: chrome.inkSoft, fontFamily: ADMIN_FONT.regular },
    pills: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: compact ? 2 : 4 },
    rowSwitches: { width: 148, flexDirection: "row", alignItems: "center", gap: 10 },
    cardSwitches: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 8 },
    switchItem: { flexDirection: "row", alignItems: "center", gap: 8 },
    switchLabel: { fontSize: 12, color: chrome.inkSoft, fontFamily: ADMIN_FONT.medium },
  });
}
