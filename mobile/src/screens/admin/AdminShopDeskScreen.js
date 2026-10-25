import React, { useCallback, useState } from "react";
import { Platform, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminPanel from "../../components/admin/AdminPanel";
import AdminKpiCard, { AdminKpiGrid } from "../../components/admin/AdminKpiCard";
import AdminStatusPill from "../../components/admin/AdminStatusPill";
import AdminSwitch from "../../components/admin/AdminSwitch";
import AdminButton from "../../components/admin/AdminButton";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { fetchAdminStoreOps, updateAdminStoreOps } from "../../services/adminService";
import { useAdminDesk } from "../../services/adminDeskStore";
import { adminShellContent, useAdminCompactLayout } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, spacing } from "../../theme/tokens";
import { formatRupees, formatWhole } from "../../utils/adminFormat";
import PremiumLoader from "../../components/ui/PremiumLoader";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumButton from "../../components/ui/PremiumButton";

const COPY = ADMIN_SCREEN_COPY.shopDesk;
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const CLOSED_FALLBACK = "We are not taking orders right now. Please check back soon.";

function formatOpenTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" });
}

function todayHours(hours) {
  const day = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", weekday: "short" });
  const idx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day);
  const row = (hours || []).find((h) => Number(h.day) === idx) || { open: "09:00", close: "21:00", closed: false };
  return { ...row, label: DAYS[idx] || "Today" };
}

function clock(hhmm) {
  const [h, m] = String(hhmm || "09:00").split(":").map(Number);
  const d = new Date(Date.UTC(2026, 0, 1, h || 0, m || 0));
  return d.toLocaleTimeString("en-IN", { timeZone: "UTC", hour: "numeric", minute: "2-digit" });
}

export default function AdminShopDeskScreen({ navigation, route }) {
  const compact = useAdminCompactLayout();
  const { user } = useAuth();
  const toast = useToast();
  const { summary, loading, error, refresh } = useAdminDesk();
  const [hours, setHours] = useState(null);
  const [busy, setBusy] = useState("");
  const [pulling, setPulling] = useState(false);

  const loadHours = useCallback(async () => {
    try {
      const ops = await fetchAdminStoreOps();
      setHours(ops?.ops?.hours || []);
    } catch {
      setHours((prev) => prev || []);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
      loadHours();
    }, [refresh, loadHours])
  );

  const onPull = async () => {
    setPulling(true);
    await Promise.all([refresh(), loadHours()]);
    setPulling(false);
  };

  const patchOps = async (key, value) => {
    setBusy(key);
    try {
      await updateAdminStoreOps(null, { ops: { [key]: value } });
      await refresh();
      await loadHours();
    } catch (err) {
      toast.toastError(err?.message || "Couldn't update the shop.");
    } finally {
      setBusy("");
    }
  };

  const goOrders = (tab, extra = {}) => navigation.navigate("AdminOrders", { tab, ...extra });

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

  const store = summary?.store || {};
  const orders = summary?.orders || {};
  const today = orders.today || {};
  const todayRow = todayHours(hours);
  const open = Boolean(store.open);
  const accepting = store.acceptingOrders !== false;
  const followHours = Boolean(store.autoSchedule);
  const message = store.message || (open ? "" : CLOSED_FALLBACK);
  const opensAt = formatOpenTime(store.nextOpenAt);
  const cols = compact ? 2 : 3;

  const queue = [
    { key: "unpaid", label: "Unpaid", icon: "card-outline", hint: "Collect", value: orders.unpaid, tab: "unpaid" },
    { key: "new", label: "New", icon: "sparkles-outline", hint: "Confirm", value: orders.new, tab: "new" },
    { key: "packing", label: "Packing", icon: "cube-outline", hint: "Pack now", value: orders.packing, tab: "packing" },
    { key: "ready", label: "Ready", icon: "bag-check-outline", hint: "Need a rider", value: orders.ready, tab: "ready" },
    { key: "onRoute", label: "On the way", icon: "bicycle-outline", hint: "With rider", value: orders.onRoute, tab: "onroute" },
    { key: "today", label: "Today’s orders", icon: "receipt-outline", hint: "Since midnight", value: today.count, tab: "all", extra: { range: "today" } },
    { key: "revenue", label: "Today’s revenue", icon: "cash-outline", hint: "Since midnight", value: today.revenue, rupees: true, tab: "all", extra: { range: "today" } },
  ];

  const side = [
    orders.attention > 0 && { key: "attention", label: "Orders that need a person", value: orders.attention, go: () => goOrders("attention") },
    orders.cashDue > 0 && { key: "cash", label: "COD still to collect", value: orders.cashDue, go: () => navigation.navigate("AdminCash") },
    summary?.support?.awaitingReply > 0 && {
      key: "support",
      label: "Support waiting for a reply",
      value: summary.support.awaitingReply,
      go: () => navigation.navigate("AdminSupport"),
    },
    summary?.catalog?.lowStock > 0 && {
      key: "low",
      label: "Low stock",
      value: summary.catalog.lowStock,
      go: () => navigation.navigate("AdminInventory", { filter: "low" }),
    },
    summary?.catalog?.outOfStock > 0 && {
      key: "out",
      label: "Out of stock",
      value: summary.catalog.outOfStock,
      go: () => navigation.navigate("AdminInventory", { filter: "out" }),
    },
    summary?.riders?.total > 0 && {
      key: "riders",
      label: "Riders online",
      value: `${summary.riders.online || 0} of ${summary.riders.total}`,
      go: () => navigation.navigate("AdminRiders"),
    },
  ].filter(Boolean);

  return (
    <AdminScreenShell style={styles.screen}>
      <KankregScrollPage
        scrollVariant="admin"
        showFooter={false}
        style={customerScrollFill}
        refreshControl={Platform.OS === "web" ? undefined : <RefreshControl refreshing={pulling} onRefresh={onPull} />}
      >
        <KankregAdminShell navigation={navigation} route={route || { name: "AdminShopDesk" }} title={COPY.title} subtitle={COPY.subtitle}>
          {error && !summary ? <PremiumErrorBanner severity="error" message={error} compact style={styles.banner} /> : null}
          {loading && !summary ? (
            <PremiumLoader caption="Loading shop desk…" />
          ) : (
            <View style={styles.desk}>
              <AdminPanel title="Shop status" icon="storefront-outline">
                <View style={styles.statusRow}>
                  <AdminStatusPill label={open ? "Open" : "Closed"} tone={open ? "success" : "warn"} />
                  {store.reason ? <Text style={styles.reason}>{store.reason}</Text> : null}
                </View>
                {message ? <Text style={styles.message}>{message}</Text> : null}
                {opensAt ? <Text style={styles.hours}>Opens {opensAt}</Text> : null}
                <Text style={styles.hours}>
                  {todayRow.closed
                    ? `${todayRow.label} · closed`
                    : `${todayRow.label} · ${clock(todayRow.open)} – ${clock(todayRow.close)} · Asia/Kolkata`}
                </Text>
                <AdminButton label="Edit hours" variant="ghost" icon="time-outline" onPress={() => navigation.navigate("AdminSettings")} />
              </AdminPanel>

              <AdminPanel title="Counter" icon="toggle-outline" description="These two switches are the day counter. Hours stay on Settings.">
                <View style={styles.switchRow}>
                  <View style={styles.switchCopy}>
                    <Text style={styles.switchTitle}>Accepting orders</Text>
                    <Text style={styles.switchHint}>Off stops checkout. Customers see the closed message.</Text>
                  </View>
                  <AdminSwitch
                    value={accepting}
                    disabled={busy === "acceptingOrders"}
                    tone={accepting ? "green" : "red"}
                    accessibilityLabel="Accepting orders"
                    onChange={(on) => patchOps("acceptingOrders", on)}
                  />
                </View>
                <View style={styles.switchRow}>
                  <View style={styles.switchCopy}>
                    <Text style={styles.switchTitle}>Follow opening hours</Text>
                    <Text style={styles.switchHint}>Uses Sunday–Saturday hours. Default 09:00–21:00.</Text>
                  </View>
                  <AdminSwitch
                    value={followHours}
                    disabled={busy === "autoSchedule"}
                    accessibilityLabel="Follow opening hours"
                    onChange={(on) => patchOps("autoSchedule", on)}
                  />
                </View>
              </AdminPanel>

              <AdminPanel title="Today’s queue" icon="list-outline" description="Cancelled orders are left out of today’s totals.">
                <AdminKpiGrid compact={compact} columns={cols}>
                  {queue.map((tile) => (
                    <AdminKpiCard
                      key={tile.key}
                      icon={tile.icon}
                      label={tile.label}
                      hint={tile.hint}
                      value={tile.rupees ? formatRupees(tile.value) : formatWhole(tile.value)}
                      tone={tile.value > 0 && tile.key !== "revenue" && tile.key !== "today" ? "hot" : "default"}
                      onPress={() => goOrders(tile.tab, tile.extra)}
                    />
                  ))}
                </AdminKpiGrid>
              </AdminPanel>

              {side.length ? (
                <AdminPanel title="Needs a look" icon="alert-circle-outline">
                  {side.map((row) => (
                    <Pressable key={row.key} onPress={row.go} style={styles.sideRow} accessibilityRole="button">
                      <Text style={styles.sideLabel}>{row.label}</Text>
                      <Text style={styles.sideValue}>{typeof row.value === "number" ? formatWhole(row.value) : row.value}</Text>
                    </Pressable>
                  ))}
                </AdminPanel>
              ) : null}
            </View>
          )}
        </KankregAdminShell>
      </KankregScrollPage>
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, width: "100%", maxWidth: "100%", alignSelf: "center" },
  denied: { padding: spacing.lg, gap: spacing.md },
  desk: adminShellContent(),
  banner: { marginBottom: spacing.md },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  reason: { fontFamily: fonts.medium, fontSize: 13, textTransform: "capitalize" },
  message: { fontSize: 14, lineHeight: 20, marginBottom: 6 },
  hours: { fontSize: 13, marginBottom: 6, fontFamily: fonts.medium },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16, paddingVertical: 10 },
  switchCopy: { flex: 1, minWidth: 0, gap: 3 },
  switchTitle: { fontFamily: fonts.semibold, fontSize: 14 },
  switchHint: { fontSize: 12.5, lineHeight: 18, opacity: 0.72 },
  sideRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(31,51,31,0.08)" },
  sideLabel: { fontSize: 13.5, flex: 1, paddingRight: 12 },
  sideValue: { fontFamily: fonts.semibold, fontSize: 14 },
});
