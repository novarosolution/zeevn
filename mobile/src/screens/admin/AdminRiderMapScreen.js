import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, Platform, Pressable, RefreshControl, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminBadge from "../../components/admin/AdminBadge";
import AdminButton from "../../components/admin/AdminButton";
import AdminDeliveryMap from "../../components/admin/AdminDeliveryMap";
import { mapOrdersFrom } from "../../components/admin/zones/zoneHelpers";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import { useAuth } from "../../context/AuthContext";
import { useLiveSocket } from "../../context/LiveSocketContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchAdminRiders, fetchAdminStoreSettings, searchAdminOrders } from "../../services/adminService";
import { adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, radius, spacing } from "../../theme/tokens";
import { mapsHref, openExternal, timeAgo } from "../../utils/adminFormat";
import { adminStatusMeta, customerOf, orderRef } from "../../utils/adminOrderUi";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

const COPY = ADMIN_SCREEN_COPY.riderMap;
const FALLBACK_SHOP = { _id: "local", latitude: 23.2156, longitude: 72.6369, label: "Zeevan farm shop", maxRadiusKm: 0, isActive: true };
const LIVE_STATUS = "ready_for_pickup,shipped,out_for_delivery";
const LAYERS = [
  { key: "riders", label: "Riders" },
  { key: "orders", label: "Orders" },
];

function realPoint(loc) {
  if (!loc) return null;
  const lat = Number(loc.latitude ?? loc.lat);
  const lng = Number(loc.longitude ?? loc.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) <= 0.2 || Math.abs(lng) <= 0.2) return null;
  return { latitude: lat, longitude: lng, updatedAt: loc.updatedAt, ageSeconds: loc.ageSeconds };
}

function shopFromSettings(settings) {
  const row = Array.isArray(settings?.stores) && settings.stores.length ? settings.stores[0] : settings;
  const pin = realPoint(row);
  return {
    _id: row?._id || FALLBACK_SHOP._id,
    latitude: pin?.latitude ?? FALLBACK_SHOP.latitude,
    longitude: pin?.longitude ?? FALLBACK_SHOP.longitude,
    label: row?.label || FALLBACK_SHOP.label,
    maxRadiusKm: 0,
    isActive: true,
  };
}

function seenLabel(rider) {
  if (rider.online) return "Online";
  const at = rider.location?.updatedAt;
  if (at) return `last seen ${timeAgo(at)}`;
  return "No GPS yet";
}

function openRiderMaps(rider) {
  const loc = realPoint(rider.location);
  if (!loc) return;
  const href = mapsHref(loc);
  if (!href) return;
  if (Platform.OS === "web") openExternal(href);
  else Linking.openURL(href).catch(() => {});
}

export default function AdminRiderMapScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const { on: onLiveEvent } = useLiveSocket();
  const { height: winH } = useWindowDimensions();
  const isAdmin = Boolean(user?.isAdmin);
  const showMap = Platform.OS === "web" && !compact;
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);

  const [riders, setRiders] = useState([]);
  const [shop, setShop] = useState(FALLBACK_SHOP);
  const [orders, setOrders] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [layers, setLayers] = useState({ riders: true, orders: true });
  const [focus, setFocus] = useState({ point: null, key: 0 });
  const [fitKey, setFitKey] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRiders = useCallback(async () => {
    const list = await fetchAdminRiders();
    setRiders(Array.isArray(list) ? list : []);
  }, []);

  const loadOrders = useCallback(async () => {
    const res = await searchAdminOrders(null, { status: LIVE_STATUS, pageSize: 100, channel: "online" });
    setOrders(mapOrdersFrom(res.items || [], orderRef, (o) => customerOf(o).name, (s) => adminStatusMeta(s).label));
  }, []);

  const load = useCallback(async () => {
    try {
      setError("");
      const [settings] = await Promise.all([
        fetchAdminStoreSettings().catch(() => null),
        loadRiders(),
        loadOrders(),
      ]);
      setShop(shopFromSettings(settings));
      setFitKey((k) => k + 1);
    } catch (err) {
      setError(err.message || "Couldn't load rider locations.");
    } finally {
      setLoading(false);
    }
  }, [loadRiders, loadOrders]);

  useEffect(() => {
    if (!isAdmin) return;
    load();
  }, [isAdmin, load]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    const timer = setInterval(() => {
      loadRiders().catch(() => {});
      loadOrders().catch(() => {});
    }, 20 * 1000);
    let eventTimer = null;
    const off = onLiveEvent("orders:updated", () => {
      if (eventTimer) clearTimeout(eventTimer);
      eventTimer = setTimeout(() => {
        loadRiders().catch(() => {});
        loadOrders().catch(() => {});
      }, 900);
    });
    return () => {
      clearInterval(timer);
      if (eventTimer) clearTimeout(eventTimer);
      off?.();
    };
  }, [isAdmin, onLiveEvent, loadRiders, loadOrders]);

  const onPull = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const ridersForMap = useMemo(
    () =>
      riders.map((rider) => {
        const loc = realPoint(rider.location);
        return {
          ...rider,
          location: loc,
          lastSeenLabel: loc && !rider.online && loc.updatedAt ? timeAgo(loc.updatedAt) : rider.online ? "online" : "",
        };
      }),
    [riders]
  );

  const pickRider = (rider) => {
    const id = String(rider._id);
    setSelectedId(id);
    const loc = realPoint(rider.location);
    if (showMap && loc) {
      setFocus((f) => ({ point: { lat: loc.latitude, lng: loc.longitude }, key: f.key + 1 }));
      return;
    }
    if (!showMap && loc) openRiderMaps(rider);
  };

  const mapHeight = Math.max(520, Math.min(760, winH - 250));

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

  const list = (
    <View style={styles.list}>
      {loading ? <Text style={styles.muted}>Loading…</Text> : null}
      {!loading && riders.length === 0 ? <PremiumEmptyState iconName="navigate-outline" title={COPY.empty} compact /> : null}
      {riders.map((rider) => {
        const on = String(rider._id) === String(selectedId);
        const loc = realPoint(rider.location);
        const zones = (rider.zones || []).map((z) => z.name).filter(Boolean).join(", ") || "No zone";
        const runs = rider.active === 1 ? "1 active run" : `${rider.active || 0} active runs`;
        return (
          <Pressable
            key={rider._id}
            onPress={() => pickRider(rider)}
            style={({ pressed }) => [styles.card, on && styles.cardOn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`${rider.name || "Rider"}. ${seenLabel(rider)}`}
          >
            <View style={styles.cardTop}>
              <Text style={styles.name}>{rider.name || "—"}</Text>
              <AdminBadge
                label={seenLabel(rider)}
                tone={rider.online ? "green" : loc ? "gold" : "neutral"}
                size="sm"
              />
            </View>
            <Text style={styles.meta}>{zones}</Text>
            <Text style={styles.meta}>{runs}</Text>
          </Pressable>
        );
      })}
    </View>
  );

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
          <View style={styles.desk}>
            <AdminAlerts error={error} onCloseError={() => setError("")} />
            <View style={[styles.split, !showMap && styles.splitPhone]}>
              {showMap ? (
                <View style={styles.mapCol}>
                  <View style={styles.layerRow}>
                    {LAYERS.map((layer) => (
                      <AdminButton
                        key={layer.key}
                        label={layer.label}
                        icon={layers[layer.key] ? "eye-outline" : "eye-off-outline"}
                        size="xs"
                        variant={layers[layer.key] ? "tint" : "ghost"}
                        tone="olive"
                        onPress={() => setLayers((l) => ({ ...l, [layer.key]: !l[layer.key] }))}
                      />
                    ))}
                  </View>
                  <View style={styles.mapFrame}>
                    <AdminDeliveryMap
                      store={shop}
                      stores={[shop]}
                      radiusKm={0}
                      zones={[]}
                      mode="select"
                      riders={ridersForMap}
                      selectedRiderId={selectedId}
                      orders={orders}
                      layers={{ zones: false, riders: layers.riders, orders: layers.orders }}
                      fitKey={fitKey}
                      focusPoint={focus.point}
                      focusKey={focus.key}
                      height={mapHeight}
                      onSelectRider={(id) => {
                        const rider = riders.find((r) => String(r._id) === String(id));
                        if (rider) pickRider(rider);
                      }}
                      onSelectOrder={(order) => navigation.navigate("AdminOrderDetail", { orderId: String(order._id) })}
                    />
                  </View>
                </View>
              ) : null}
              <View style={[styles.side, !showMap && styles.sidePhone, { maxWidth: showMap ? 360 : undefined }]}>{list}</View>
            </View>
          </View>
        </KankregAdminShell>
      </KankregScrollPage>
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium) {
  return StyleSheet.create({
    screen: { flex: 1, width: "100%" },
    desk: { ...adminShellContent(), gap: spacing.sm },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    split: { flexDirection: "row", alignItems: "flex-start", gap: 18 },
    splitPhone: { flexDirection: "column" },
    mapCol: {
      flex: 1,
      minWidth: 0,
      gap: 10,
      ...Platform.select({ web: { position: "sticky", top: 84, alignSelf: "flex-start" }, default: {} }),
    },
    layerRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
    mapFrame: {
      position: "relative",
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
    },
    side: { width: 340, flexShrink: 0, gap: spacing.sm },
    sidePhone: { width: "100%" },
    list: { gap: spacing.sm },
    card: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      backgroundColor: c.surface,
      gap: 4,
    },
    cardOn: { borderColor: chrome.ink, borderWidth: 1.5 },
    cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
    name: { flex: 1, color: chrome.ink, fontFamily: fonts.semibold, fontSize: 15 },
    meta: { color: chrome.inkSoft, fontFamily: fonts.regular, fontSize: 12 },
    muted: { color: chrome.inkFaint, fontFamily: fonts.medium, fontSize: 12 },
    pressed: { opacity: 0.72 },
  });
}
