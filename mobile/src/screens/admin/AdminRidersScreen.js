import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminBadge from "../../components/admin/AdminBadge";
import AdminButton from "../../components/admin/AdminButton";
import AdminInput from "../../components/admin/AdminInput";
import AdminStatTile, { AdminStatGrid } from "../../components/admin/AdminStatTile";
import { useAdminConfirm } from "../../components/admin/AdminDialog";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchAdminRiders, updateDeliveryPartnerRole } from "../../services/adminService";
import { adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, radius, spacing } from "../../theme/tokens";
import { openExternal, telHref } from "../../utils/adminFormat";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

const COPY = ADMIN_SCREEN_COPY.riders;
const TILES = [
  { key: "all", label: "Riders", icon: "bicycle-outline", tone: "neutral" },
  { key: "online", label: "Online", icon: "radio-outline", tone: "green" },
  { key: "run", label: "On a run", icon: "navigate-outline", tone: "blue" },
  { key: "nozone", label: "No zone", icon: "alert-circle-outline", tone: "gold" },
];

function matchesFilter(rider, filter) {
  if (filter === "online") return Boolean(rider.online);
  if (filter === "run") return (rider.active || 0) >= 1;
  if (filter === "nozone") return !(rider.zones || []).length;
  return true;
}

function callPhone(phone) {
  const href = telHref(phone);
  if (!href) return;
  if (Platform.OS === "web") openExternal(href);
  else Linking.openURL(href).catch(() => {});
}

export default function AdminRidersScreen({ navigation, route }) {
  const { user, token } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);
  const { confirm, dialog } = useAdminConfirm();

  const [riders, setRiders] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError("");
      const list = await fetchAdminRiders(token);
      setRiders(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || "Failed to load riders.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    load();
  }, [user, load]);

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
      all: riders.length,
      online: riders.filter((r) => r.online).length,
      run: riders.filter((r) => (r.active || 0) >= 1).length,
      nozone: riders.filter((r) => !(r.zones || []).length).length,
    }),
    [riders]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return riders.filter((r) => {
      if (!matchesFilter(r, filter)) return false;
      if (!q) return true;
      return [r.name, r.phone].some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [riders, search, filter]);

  const openOrders = (rider) => navigation.navigate("AdminOrders", { rider: String(rider._id) });
  const openZone = (zone) => navigation.navigate("AdminDelivery", { zoneId: String(zone._id || zone), panel: "zones" });

  const stopRider = async (rider) => {
    const name = String(rider.name || "this rider").trim() || "this rider";
    const ok = await confirm({ title: COPY.stop.replace("{name}", name), tone: "danger", confirmLabel: "Stop assigning" });
    if (!ok) return;
    setBusyId(rider._id);
    try {
      await updateDeliveryPartnerRole(token, rider._id, false);
      setRiders((prev) => prev.filter((r) => String(r._id) !== String(rider._id)));
    } catch (err) {
      setError(err.message || "Couldn't update this rider.");
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

  const renderZones = (rider) => {
    const zones = rider.zones || [];
    if (!zones.length) return <Text style={styles.muted}>No zone</Text>;
    return (
      <View style={styles.zoneRow}>
        {zones.map((zone) => (
          <Pressable
            key={String(zone._id || zone.name)}
            onPress={() => openZone(zone)}
            style={({ pressed }) => [styles.zoneChip, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Open ${zone.name}`}
          >
            <Text style={styles.zoneText}>{zone.name}</Text>
          </Pressable>
        ))}
      </View>
    );
  };

  const renderRider = (rider) => {
    const phone = String(rider.phone || "").trim();
    const stats = `${rider.active || 0} active · ${rider.awaitingAccept || 0} waiting · ${rider.deliveredToday || 0} today`;
    if (compact) {
      return (
        <Pressable
          key={rider._id}
          onPress={() => openOrders(rider)}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Orders for ${rider.name || "rider"}`}
        >
          <View style={styles.cardTop}>
            <View style={styles.cardHead}>
              <Text style={styles.name}>{rider.name || "—"}</Text>
              {phone ? (
                <Pressable onPress={() => callPhone(phone)} accessibilityRole="link" accessibilityLabel={`Call ${phone}`}>
                  <Text style={styles.phone}>{phone}</Text>
                </Pressable>
              ) : (
                <Text style={styles.muted}>No phone</Text>
              )}
            </View>
            <AdminBadge label={rider.online ? "Online" : "Offline"} tone={rider.online ? "green" : "neutral"} size="sm" />
          </View>
          {renderZones(rider)}
          <Text style={styles.meta}>{stats}</Text>
          <AdminButton
            label="Stop assigning"
            variant="danger"
            size="sm"
            disabled={busyId === rider._id}
            onPress={() => stopRider(rider)}
          />
        </Pressable>
      );
    }

    return (
      <Pressable
        key={rider._id}
        onPress={() => openOrders(rider)}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Orders for ${rider.name || "rider"}`}
      >
        <View style={styles.colName}>
          <Text style={styles.name}>{rider.name || "—"}</Text>
          {phone ? (
            <Pressable onPress={() => callPhone(phone)} accessibilityRole="link" accessibilityLabel={`Call ${phone}`}>
              <Text style={styles.phone}>{phone}</Text>
            </Pressable>
          ) : (
            <Text style={styles.muted}>No phone</Text>
          )}
        </View>
        <View style={styles.colBadge}>
          <AdminBadge label={rider.online ? "Online" : "Offline"} tone={rider.online ? "green" : "neutral"} size="sm" />
        </View>
        <View style={styles.colZones}>{renderZones(rider)}</View>
        <Text style={styles.colNum}>{rider.active || 0}</Text>
        <Text style={styles.colNum}>{rider.awaitingAccept || 0}</Text>
        <Text style={styles.colNum}>{rider.deliveredToday || 0}</Text>
        <AdminButton
          label="Stop"
          variant="danger"
          size="sm"
          disabled={busyId === rider._id}
          onPress={() => stopRider(rider)}
        />
      </Pressable>
    );
  };

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
            <AdminStatGrid min={compact ? 132 : 150}>
              {TILES.map((tile) => (
                <AdminStatTile
                  key={tile.key}
                  icon={tile.icon}
                  label={tile.label}
                  value={String(counts[tile.key] || 0)}
                  tone={counts[tile.key] > 0 ? tile.tone : "neutral"}
                  selected={filter === tile.key}
                  onPress={() => setFilter(tile.key)}
                  style={compact ? styles.tilePhone : undefined}
                />
              ))}
            </AdminStatGrid>
            <AdminInput
              label="Search"
              value={search}
              onChangeText={setSearch}
              placeholder="Name or phone"
              icon="search-outline"
            />
            {loading ? <Text style={styles.muted}>Loading…</Text> : null}
            {!loading && riders.length === 0 ? (
              <PremiumEmptyState iconName="bicycle-outline" title={COPY.empty} compact />
            ) : null}
            {!loading && riders.length > 0 && visible.length === 0 ? (
              <PremiumEmptyState iconName="search-outline" title="No riders match that search" compact />
            ) : null}
            {!loading && visible.length > 0 && !compact ? (
              <View style={styles.head}>
                <Text style={[styles.headText, styles.colName]}>Rider</Text>
                <Text style={[styles.headText, styles.colBadge]}>Status</Text>
                <Text style={[styles.headText, styles.colZones]}>Zones</Text>
                <Text style={[styles.headText, styles.colNum]}>Active</Text>
                <Text style={[styles.headText, styles.colNum]}>Waiting</Text>
                <Text style={[styles.headText, styles.colNum]}>Today</Text>
                <Text style={[styles.headText, { width: 64 }]} />
              </View>
            ) : null}
            {!loading ? visible.map(renderRider) : null}
          </View>
        </KankregAdminShell>
      </KankregScrollPage>
      {dialog}
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium) {
  return StyleSheet.create({
    screen: { flex: 1, width: "100%" },
    panel: { ...adminShellContent(), gap: spacing.sm, paddingBottom: spacing.xl },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    tilePhone: { flexBasis: "47%", flexGrow: 1, maxWidth: "48%" },
    muted: { color: chrome.inkFaint, fontFamily: fonts.medium, fontSize: 12 },
    name: { color: chrome.ink, fontFamily: fonts.semibold, fontSize: 15 },
    phone: { marginTop: 2, color: chrome.inkSoft, fontFamily: fonts.medium, fontSize: 13, textDecorationLine: "underline" },
    meta: { color: chrome.inkSoft, fontFamily: fonts.regular, fontSize: 12 },
    head: { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 6 },
    headText: {
      fontSize: 10,
      letterSpacing: 0.7,
      textTransform: "uppercase",
      color: chrome.inkFaint,
      fontFamily: fonts.semibold,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
    },
    colName: { flex: 1.2, minWidth: 140 },
    colBadge: { width: 88 },
    colZones: { flex: 1, minWidth: 120 },
    colNum: { width: 64, color: chrome.ink, fontFamily: fonts.semibold, fontSize: 13, textAlign: "right" },
    zoneRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    zoneChip: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.md,
      backgroundColor: chrome.paper,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
    },
    zoneText: { color: chrome.ink, fontFamily: fonts.medium, fontSize: 12 },
    card: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      backgroundColor: c.surface,
      gap: spacing.sm,
    },
    cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
    cardHead: { flex: 1, minWidth: 0 },
    pressed: { opacity: 0.72 },
  });
}
