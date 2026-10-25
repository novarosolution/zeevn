import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminButton from "../../components/admin/AdminButton";
import AdminDeliveryMap from "../../components/admin/AdminDeliveryMap";
import AdminFilterTabs from "../../components/admin/AdminFilterTabs";
import AdminInput from "../../components/admin/AdminInput";
import AdminStatTile, { AdminStatGrid } from "../../components/admin/AdminStatTile";
import { useAdminConfirm } from "../../components/admin/AdminDialog";
import ZoneCard from "../../components/admin/zones/ZoneCard";
import ZoneEditor from "../../components/admin/zones/ZoneEditor";
import ZoneRiders from "../../components/admin/zones/ZoneRiders";
import ZoneShops from "../../components/admin/zones/ZoneShops";
import { mapOrdersFrom, polygonPoints } from "../../components/admin/zones/zoneHelpers";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import SkeletonBlock from "../../components/ui/SkeletonBlock";
import { useAuth } from "../../context/AuthContext";
import { useLiveSocket } from "../../context/LiveSocketContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import {
  checkAdminDeliveryCoverage,
  createAdminDeliveryZone,
  deleteAdminDeliveryZone,
  fetchAdminDeliveryZones,
  fetchAdminRiders,
  fetchAdminStoreSettings,
  fetchAdminZoneStats,
  searchAdminOrders,
  updateAdminDeliveryZone,
  updateAdminStoreSettings,
} from "../../services/adminService";
import { adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { getAdminTone } from "../../theme/adminTones";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, spacing } from "../../theme/tokens";
import { adminStatusMeta, customerOf, orderRef } from "../../utils/adminOrderUi";
import { formatRupees } from "../../utils/adminFormat";

const DEFAULT_SHOP = { _id: "local", latitude: 23.2156, longitude: 72.6369, maxRadiusKm: 25, label: "Zeevan farm shop", isActive: true };
const LAYER_LABELS = [
  { key: "zones", label: "Zones" },
  { key: "riders", label: "Riders" },
  { key: "orders", label: "Live orders" },
];

/** Shops as the form edits them (strings for number inputs), from the API document. */
function shopsFromSettings(settings) {
  const rows =
    Array.isArray(settings?.stores) && settings.stores.length
      ? settings.stores.map((s) => ({ ...s }))
      : settings
        ? [
            {
              _id: settings._id || "primary",
              latitude: Number(settings.latitude) || DEFAULT_SHOP.latitude,
              longitude: Number(settings.longitude) || DEFAULT_SHOP.longitude,
              maxRadiusKm: Number(settings.maxRadiusKm) || DEFAULT_SHOP.maxRadiusKm,
              label: settings.label || DEFAULT_SHOP.label,
              isActive: true,
            },
          ]
        : [{ ...DEFAULT_SHOP }];
  return rows.slice(0, 1);
}

const isLocalId = (id) => String(id).startsWith("new-") || id === "local" || id === "primary";

export default function AdminDeliveryScreen({ navigation, route }) {
  const { user } = useAuth();
  const toast = useToast();
  const { colors: c, shadowPremium, isDark } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const { width: winW, height: winH } = useWindowDimensions();
  const { useSidebarLayout } = useKankregLayout();
  const { confirm, dialog } = useAdminConfirm();
  const { on: onLiveEvent } = useLiveSocket();
  const isAdmin = Boolean(user?.isAdmin);
  const stacked = compact || winW < (useSidebarLayout ? 1180 : 1000);
  const webMap = Platform.OS === "web";
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);

  /* ------------------------------- data state ------------------------------- */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [zones, setZones] = useState([]);
  const [riders, setRiders] = useState([]);
  const [stats, setStats] = useState({ zones: {}, uncovered: { orders: 0, revenue: 0 } });
  const [liveOrders, setLiveOrders] = useState([]);
  const [stores, setStores] = useState([{ ...DEFAULT_SHOP }]);
  const [savedShops, setSavedShops] = useState("");
  const [minutesPerKm, setMinutesPerKm] = useState("3");
  const [storeId, setStoreId] = useState(DEFAULT_SHOP._id);

  /* -------------------------------- ui state -------------------------------- */
  const [panel, setPanel] = useState(["zones", "riders", "shops"].includes(route?.params?.panel) ? route.params.panel : "zones");
  const [editing, setEditing] = useState(null); // null | "new" | zone id
  const [mode, setMode] = useState("select"); // select | draw | pin | test
  const [selectedZoneId, setSelectedZoneId] = useState(
    route?.params?.zoneId || route?.params?.zone ? String(route.params.zoneId || route.params.zone) : null
  );
  const [selectedRiderId, setSelectedRiderId] = useState(null);
  const [areaDraft, setAreaDraft] = useState([]);
  const [layers, setLayers] = useState({ zones: true, riders: true, orders: true });
  const [fitKey, setFitKey] = useState(0);
  const [focus, setFocus] = useState({ point: null, key: 0 });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [busyZoneId, setBusyZoneId] = useState("");
  const [shopsBusy, setShopsBusy] = useState(false);
  const [testPoint, setTestPoint] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testBusy, setTestBusy] = useState(false);
  const [testPin, setTestPin] = useState("");

  const store = stores.find((s) => String(s._id) === String(storeId)) || stores[0];
  const editingZone = editing && editing !== "new" ? zones.find((z) => String(z._id) === editing) : null;

  /* --------------------------------- loading -------------------------------- */

  const applySettings = useCallback((settings, { keepSelection = false } = {}) => {
    const rows = shopsFromSettings(settings);
    setStores(rows);
    setMinutesPerKm(String(Number(settings?.minutesPerKm) || 3));
    setSavedShops(JSON.stringify({ stores: rows, minutes: String(Number(settings?.minutesPerKm) || 3) }));
    setStoreId((prev) => (keepSelection && rows.some((s) => String(s._id) === String(prev)) ? prev : String(rows[0]._id)));
  }, []);

  const loadZonesAndStats = useCallback(async () => {
    const [z, st] = await Promise.all([fetchAdminDeliveryZones(), fetchAdminZoneStats(null, 30).catch(() => null)]);
    setZones(Array.isArray(z) ? z : []);
    if (st) setStats(st);
  }, []);

  const loadLiveOrders = useCallback(async () => {
    try {
      const res = await searchAdminOrders(null, { status: "active", pageSize: 100 });
      setLiveOrders(
        mapOrdersFrom(res.items || [], orderRef, (o) => customerOf(o).name, (s) => adminStatusMeta(s).label)
      );
    } catch {
      // The orders layer is a bonus — the desk still works without it.
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    let alive = true;
    (async () => {
      try {
        const [z, r, s, st] = await Promise.all([
          fetchAdminDeliveryZones(),
          fetchAdminRiders(),
          fetchAdminStoreSettings(),
          fetchAdminZoneStats(null, 30).catch(() => null),
        ]);
        if (!alive) return;
        setZones(Array.isArray(z) ? z : []);
        setRiders(Array.isArray(r) ? r : []);
        applySettings(s);
        if (st) setStats(st);
        setFitKey((k) => k + 1);
      } catch (err) {
        if (alive) setError(err?.message || "Unable to load delivery ops.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    loadLiveOrders();
    return () => {
      alive = false;
    };
  }, [isAdmin, applySettings, loadLiveOrders]);

  useEffect(() => {
    const z = route?.params?.zoneId || route?.params?.zone;
    if (!z) return;
    setSelectedZoneId(String(z));
    setPanel("zones");
  }, [route?.params?.zoneId, route?.params?.zone]);

  // Riders move — refresh their pins every 20 s. Orders change — refresh on live events.
  useEffect(() => {
    if (!isAdmin) return undefined;
    const ridersTimer = setInterval(() => fetchAdminRiders().then(setRiders).catch(() => {}), 20 * 1000);
    const ordersTimer = setInterval(loadLiveOrders, 60 * 1000);
    let eventTimer = null;
    const off = onLiveEvent("orders:updated", () => {
      if (eventTimer) clearTimeout(eventTimer);
      eventTimer = setTimeout(() => {
        loadLiveOrders();
        fetchAdminRiders().then(setRiders).catch(() => {});
      }, 900);
    });
    return () => {
      clearInterval(ridersTimer);
      clearInterval(ordersTimer);
      if (eventTimer) clearTimeout(eventTimer);
      off?.();
    };
  }, [isAdmin, onLiveEvent, loadLiveOrders]);

  /* ------------------------------ derived values ----------------------------- */

  const kpis = useMemo(
    () => ({
      live: zones.filter((z) => z.isActive !== false).length,
      total: zones.length,
      online: riders.filter((r) => r.online).length,
      riders: riders.length,
      onRoad: riders.reduce((sum, r) => sum + (r.active || 0), 0),
      outside: stats.uncovered?.orders || 0,
    }),
    [zones, riders, stats]
  );

  // While a zone is being edited the map shows the working draft instead of its saved outline.
  const zonesForMap = useMemo(
    () => (editing ? zones.map((z) => (String(z._id) === editing ? { ...z, polygon: [] } : z)) : zones),
    [zones, editing]
  );

  const shopsDirty = useMemo(() => JSON.stringify({ stores, minutes: String(minutesPerKm) }) !== savedShops, [stores, minutesPerKm, savedShops]);

  /* ---------------------------------- zones --------------------------------- */

  /** One place for changing the map tool, so the test pin and its result never outlive the Test mode. */
  const switchMode = (next) => {
    setMode(next);
    if (next !== "test") {
      setTestPoint(null);
      setTestResult(null);
    }
  };

  const startEdit = (zone) => {
    setPanel("zones");
    setEditing(String(zone._id));
    setSelectedZoneId(String(zone._id));
    setAreaDraft(polygonPoints(zone));
    switchMode("select");
    setEditError("");
    setFitKey((k) => k + 1);
  };
  const startNew = () => {
    setPanel("zones");
    setEditing("new");
    setSelectedZoneId(null);
    setAreaDraft([]);
    switchMode(Platform.OS === "web" ? "draw" : "select");
    setEditError("");
  };
  const cancelEdit = () => {
    setEditing(null);
    setAreaDraft([]);
    setMode("select");
    setEditError("");
  };

  const saveZone = async (payload) => {
    setSaving(true);
    setEditError("");
    try {
      const saved = editingZone ? await updateAdminDeliveryZone(null, editingZone._id, payload) : await createAdminDeliveryZone(null, payload);
      toast.toastSuccess(editingZone ? `${payload.name} saved.` : `${payload.name} created.`, { title: editingZone ? "Zone updated" : "Zone created" });
      cancelEdit();
      await loadZonesAndStats();
      if (saved?._id) setSelectedZoneId(String(saved._id));
      setFitKey((k) => k + 1);
    } catch (err) {
      setEditError(err?.message || "Couldn't save this zone.");
    } finally {
      setSaving(false);
    }
  };

  const deleteZone = async () => {
    if (!editingZone) return;
    const live = stats.zones?.[String(editingZone._id)]?.active || 0;
    const ok = await confirm({
      title: `Delete “${editingZone.name}”?`,
      message: live
        ? `${live} live order${live === 1 ? " is" : "s are"} still in this zone — they keep their zone name, but new customers here may no longer be deliverable.`
        : "Customers in this area will no longer be deliverable unless a shop radius covers them.",
      tone: "danger",
      confirmLabel: "Delete zone",
    });
    if (!ok) return;
    setSaving(true);
    try {
      await deleteAdminDeliveryZone(null, editingZone._id);
      toast.toastSuccess(`${editingZone.name} deleted.`);
      cancelEdit();
      setSelectedZoneId(null);
      await loadZonesAndStats();
    } catch (err) {
      setEditError(err?.message || "Couldn't delete this zone.");
    } finally {
      setSaving(false);
    }
  };

  const toggleZone = async (zone) => {
    const next = zone.isActive === false;
    setBusyZoneId(String(zone._id));
    setZones((list) => list.map((z) => (String(z._id) === String(zone._id) ? { ...z, isActive: next } : z)));
    try {
      await updateAdminDeliveryZone(null, zone._id, { isActive: next });
      toast.toastSuccess(next ? `${zone.name} is live again.` : `${zone.name} paused — customers there can't order.`);
    } catch (err) {
      setZones((list) => list.map((z) => (String(z._id) === String(zone._id) ? { ...z, isActive: !next } : z)));
      toast.toastError(err?.message || "Couldn't change that zone.");
    } finally {
      setBusyZoneId("");
    }
  };

  /* ----------------------------------- map ---------------------------------- */

  const runCoverageTest = async ({ lat, lng, postalCode }) => {
    setTestBusy(true);
    try {
      const quote = await checkAdminDeliveryCoverage(null, { lat, lng, postalCode, itemsTotal: 0 });
      setTestResult(quote);
      if (lat != null) setTestPoint({ lat, lng, covered: Boolean(quote.serviceable) });
      else setTestPoint(null);
    } catch (err) {
      toast.toastError(err?.message || "Couldn't check that address.");
    } finally {
      setTestBusy(false);
    }
  };

  const handleMapClick = (pt) => {
    if (mode === "draw") {
      setAreaDraft((d) => [...d, pt]);
    } else if (mode === "pin") {
      if (store) setStores((list) => list.map((s) => (String(s._id) === String(store._id) ? { ...s, latitude: pt.lat, longitude: pt.lng } : s)));
      setMode("select");
    } else if (mode === "test") {
      setTestPoint({ ...pt, covered: null });
      runCoverageTest({ lat: pt.lat, lng: pt.lng });
    } else if (!editing) {
      setSelectedZoneId(null);
      setSelectedRiderId(null);
    }
  };

  const selectZone = (zoneId) => {
    if (editing) return;
    setSelectedZoneId(String(zoneId));
    setPanel("zones");
  };

  const pickRider = (rider) => {
    const id = String(rider._id);
    setSelectedRiderId(id);
    setPanel("riders");
    if (rider.location) setFocus((f) => ({ point: { lat: rider.location.latitude, lng: rider.location.longitude }, key: f.key + 1 }));
  };

  /* ---------------------------------- shops --------------------------------- */

  const patchStore = (id, changes) => setStores((list) => list.map((s) => (String(s._id) === String(id) ? { ...s, ...changes } : s)));
  const saveShops = async () => {
    const minutes = Number(minutesPerKm);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      toast.toastError("Minutes per km must be above 0.");
      return;
    }
    setShopsBusy(true);
    try {
      const saved = await updateAdminStoreSettings(null, {
        minutesPerKm: minutes,
        stores: stores.slice(0, 1).map((s) => ({
          _id: isLocalId(s._id) ? undefined : s._id,
          label: s.label,
          latitude: Number(s.latitude),
          longitude: Number(s.longitude),
          maxRadiusKm: Number(s.maxRadiusKm) || 0,
          isActive: s.isActive !== false,
        })),
      });
      const keep = saved?.stores?.find((s) => s.label === store?.label && Number(s.latitude) === Number(store?.latitude));
      applySettings(saved);
      if (keep) setStoreId(String(keep._id));
      toast.toastSuccess("Shops saved.");
    } catch (err) {
      toast.toastError(err?.message || "Couldn't save the shops.");
    } finally {
      setShopsBusy(false);
    }
  };
  const resetShops = () => {
    try {
      const snapshot = JSON.parse(savedShops);
      setStores(snapshot.stores);
      setMinutesPerKm(snapshot.minutes);
    } catch {
      // nothing saved yet
    }
  };

  /* ----------------------------------- gate --------------------------------- */

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.gatePanel}>
              <PremiumErrorBanner severity="warning" title={ADMIN_GATE.title} message={ADMIN_GATE.message} />
              <AdminButton label={ADMIN_GATE.backHome} icon="home-outline" variant="primary" size="md" onPress={() => navigation.navigate("Home")} style={styles.gateCta} />
            </View>
          </SectionReveal>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

  const mapHeight = stacked ? 400 : Math.max(520, Math.min(760, winH - 250));
  const hint =
    mode === "draw"
      ? areaDraft.length >= 3
        ? "Looks good — drag points to fine-tune, then save the zone."
        : "Click the map to add corners — you need at least 3."
      : mode === "pin"
        ? `Click where “${store?.label || "the shop"}” should be.`
        : mode === "test"
          ? "Click anywhere to check if delivery works there."
          : "";
  const toolTabs = [
    { key: "select", label: "Browse" },
    { key: "test", label: "Test an address" },
  ];
  const sideTabs = [
    { key: "zones", label: "Zones", count: zones.length },
    { key: "riders", label: "Riders", count: riders.length },
    { key: "shops", label: "Shops", count: stores.length },
  ];

  const sideContent = editing ? (
    <ZoneEditor
      key={editing}
      zone={editingZone}
      riders={riders}
      points={areaDraft}
      drawing={mode === "draw"}
      saving={saving}
      error={editError}
      canDraw={webMap}
      onToggleDraw={() => setMode((m) => (m === "draw" ? "select" : "draw"))}
      onUndo={() => setAreaDraft((d) => d.slice(0, -1))}
      onClearArea={() => setAreaDraft([])}
      onSave={saveZone}
      onCancel={cancelEdit}
      onDelete={deleteZone}
    />
  ) : (
    <View style={styles.sideStack}>
      <AdminFilterTabs items={sideTabs} value={panel} onChange={setPanel} />
      {panel === "zones" ? (
        zones.length ? (
          <View style={styles.cardList}>
            {zones.map((zone) => (
              <ZoneCard
                key={String(zone._id)}
                zone={zone}
                stats={stats.zones?.[String(zone._id)]}
                riders={riders}
                selected={String(zone._id) === String(selectedZoneId)}
                busy={busyZoneId === String(zone._id)}
                onSelect={(z) => {
                  if (!webMap) {
                    startEdit(z);
                    return;
                  }
                  setSelectedZoneId(String(z._id));
                  setFitKey((k) => k + 1);
                }}
                onEdit={startEdit}
                onToggle={toggleZone}
              />
            ))}
            {kpis.outside > 0 ? (
              <View style={[styles.notice, { backgroundColor: getAdminTone("gold", isDark).bg, borderColor: getAdminTone("gold", isDark).border }]}>
                <Ionicons name="information-circle-outline" size={16} color={getAdminTone("gold", isDark).fg} />
                <Text style={[styles.noticeText, { color: getAdminTone("gold", isDark).fg }]}>
                  {kpis.outside} order{kpis.outside === 1 ? "" : "s"} in the last 30 days were served outside every drawn zone (shop radius).
                </Text>
              </View>
            ) : null}
          </View>
        ) : (
          <PremiumEmptyState
            iconName="map-outline"
            title={ADMIN_SCREEN_COPY.delivery.emptyZones}
            ctaLabel="Create zone"
            onCtaPress={startNew}
            compact
          />
        )
      ) : null}
      {panel === "riders" ? (
        <ZoneRiders
          riders={riders}
          selectedId={selectedRiderId}
          onSelect={pickRider}
          onShowOrders={(rider) => navigation.navigate("AdminOrders", { rider: String(rider._id) })}
          onManage={() => navigation.navigate("AdminUsers")}
        />
      ) : null}
      {panel === "shops" ? (
        <ZoneShops
          stores={stores}
          storeId={storeId}
          minutesPerKm={minutesPerKm}
          dirty={shopsDirty}
          busy={shopsBusy}
          pinMode={mode === "pin"}
          canPin={webMap}
          onSelect={(shop) => {
            setStoreId(String(shop._id));
            setFocus((f) => ({ point: { lat: Number(shop.latitude), lng: Number(shop.longitude) }, key: f.key + 1 }));
          }}
          onChangeStore={patchStore}
          onChangeMinutes={setMinutesPerKm}
          onPinMode={() => setMode((m) => (m === "pin" ? "select" : "pin"))}
          onSave={saveShops}
          onReset={resetShops}
        />
      ) : null}
    </View>
  );

  const mapColumn = (
    <View style={[styles.mapCol, stacked && styles.mapColStacked]}>
      <View style={styles.mapBar}>
        <AdminFilterTabs items={toolTabs} value={mode === "test" ? "test" : mode === "select" ? "select" : ""} onChange={switchMode} style={styles.toolTabs} />
        <View style={styles.layerRow}>
          {LAYER_LABELS.map((layer) => (
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
      </View>

      <View style={styles.mapFrame}>
        <AdminDeliveryMap
          store={store}
          stores={stores}
          radiusKm={Number(store?.maxRadiusKm) || 0}
          zones={zonesForMap}
          draft={areaDraft}
          hint={hint}
          mode={mode}
          editingId={editing && editing !== "new" ? editing : undefined}
          selectedZoneId={selectedZoneId}
          riders={riders}
          selectedRiderId={selectedRiderId}
          orders={liveOrders}
          testPoint={testPoint}
          layers={layers}
          fitKey={fitKey}
          focusPoint={focus.point}
          focusKey={focus.key}
          height={mapHeight}
          onMapClick={handleMapClick}
          onRemovePoint={(i) => setAreaDraft((d) => d.filter((_, idx) => idx !== i))}
          onMovePoint={(i, pt) => setAreaDraft((d) => d.map((p, idx) => (idx === i ? pt : p)))}
          onSelectZone={selectZone}
          onSelectRider={(id) => pickRider(riders.find((r) => String(r._id) === String(id)) || { _id: id })}
          onSelectOrder={(order) => navigation.navigate("AdminOrders", { query: order.label.split(" · ")[0] })}
        />
        {mode === "test" || testResult ? (
          <CoverageCard
            chrome={chrome}
            isDark={isDark}
            result={testResult}
            busy={testBusy}
            pin={testPin}
            onPin={setTestPin}
            onCheckPin={() => runCoverageTest({ postalCode: testPin })}
            onClose={() => switchMode("select")}
            hasPoint={Boolean(testPoint)}
          />
        ) : null}
      </View>

      <View style={styles.legend}>
        <LegendDot color="#244424" label="Live zone" styles={styles} />
        <LegendDot color="#8A8478" label="Paused" styles={styles} />
        <LegendDot color="#2FA36B" label="Rider online" styles={styles} round />
        <LegendDot color="#C9A227" label="New order" styles={styles} round />
        <LegendDot color="#3D6B8C" label="On the way" styles={styles} round />
        <LegendDot color="#B8442F" label="Needs attention" styles={styles} round />
      </View>
    </View>
  );

  return (
    <AdminScreenShell style={styles.screen}>
      <KankregScrollPage scrollVariant="admin" showFooter={false} style={customerScrollFill} keyboardShouldPersistTaps="handled">
        <KankregAdminShell
          navigation={navigation}
          route={route || { name: "AdminDelivery" }}
          title={ADMIN_SCREEN_COPY.delivery.title}
          subtitle={ADMIN_SCREEN_COPY.delivery.subtitle}
            headerRight={<AdminButton label="Create zone" icon="add" variant="primary" size="sm" onPress={startNew} />}
        >
          <View style={styles.desk}>
            <AdminAlerts error={error} onCloseError={() => setError("")} />

            <AdminStatGrid min={compact ? 140 : 170}>
              <AdminStatTile icon="map-outline" label="Zones live" value={`${kpis.live}/${kpis.total}`} hint={kpis.total - kpis.live ? `${kpis.total - kpis.live} paused` : "All delivering"} tone="olive" onPress={() => setPanel("zones")} selected={panel === "zones" && !editing} />
              <AdminStatTile icon="bicycle-outline" label="Riders online" value={`${kpis.online}/${kpis.riders}`} hint="Sharing location now" tone="green" onPress={() => setPanel("riders")} selected={panel === "riders" && !editing} />
              <AdminStatTile icon="navigate-outline" label="On the road" value={String(kpis.onRoad)} hint="Orders with riders" tone="blue" />
              <AdminStatTile icon="alert-circle-outline" label="Outside zones" value={String(kpis.outside)} hint="Orders, last 30 days" tone={kpis.outside ? "gold" : "neutral"} />
            </AdminStatGrid>

            {loading ? (
              <View style={[styles.split, stacked && styles.splitStacked]}>
                <View style={[styles.side, stacked && styles.sideStacked]}>
                  <SkeletonBlock width="100%" height={150} rounded="lg" />
                  <SkeletonBlock width="100%" height={150} rounded="lg" />
                </View>
                {webMap ? (
                  <View style={[styles.mapCol, stacked && styles.mapColStacked]}>
                    <SkeletonBlock width="100%" height={mapHeight} rounded="lg" />
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={[styles.split, stacked && styles.splitStacked]}>
                {webMap && stacked ? mapColumn : null}
                <View style={[styles.side, stacked && styles.sideStacked]}>
                  {!webMap && !editing ? <Text style={styles.phoneHint}>The outline is drawn on the web admin.</Text> : null}
                  {sideContent}
                </View>
                {webMap && !stacked ? mapColumn : null}
              </View>
            )}
          </View>
        </KankregAdminShell>
      </KankregScrollPage>
      {dialog}
    </AdminScreenShell>
  );
}

function LegendDot({ color, label, styles, round }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }, round && styles.legendRound]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

/** Floating result card on the map for "Test an address". */
function CoverageCard({ chrome, isDark, result, busy, pin, onPin, onCheckPin, onClose, hasPoint }) {
  const ok = result?.serviceable;
  const tone = getAdminTone(result ? (ok ? "green" : "red") : "neutral", isDark);
  return (
    <View style={[coverageStyles.card, { backgroundColor: chrome.card, borderColor: chrome.line }]}>
      <View style={coverageStyles.head}>
        <Text style={[coverageStyles.title, { color: chrome.ink }]}>Test an address</Text>
        <AdminButton icon="close" size="xs" variant="ghost" title="Close" onPress={onClose} />
      </View>
      {!result && !busy ? (
        <Text style={[coverageStyles.muted, { color: chrome.inkFaint }]}>Click the map — or type a pincode below — to see what a customer there would be told.</Text>
      ) : null}
      {busy ? <Text style={[coverageStyles.muted, { color: chrome.inkFaint }]}>Checking…</Text> : null}
      {result && !busy ? (
        <View style={[coverageStyles.result, { backgroundColor: tone.bg, borderColor: tone.border }]}>
          <View style={coverageStyles.resultTop}>
            <Ionicons name={ok ? "checkmark-circle" : "close-circle"} size={18} color={tone.solid} />
            <Text style={[coverageStyles.resultTitle, { color: tone.fg }]}>{ok ? `Delivers here${result.zoneName ? ` · ${result.zoneName}` : ""}` : "Not deliverable here"}</Text>
          </View>
          {ok ? (
            <Text style={[coverageStyles.resultText, { color: chrome.ink }]}>
              {Number(result.fee) ? `${formatRupees(result.fee)} delivery` : "Free delivery"}
              {result.freeAbove && Number(result.fee) ? ` (free above ${formatRupees(result.freeAbove)})` : ""}
              {result.etaLabel ? ` · about ${result.etaLabel}` : ""}
              {result.distanceLabel ? ` · ${result.distanceLabel} from ${result.storeName || "the shop"}` : ""}
            </Text>
          ) : (
            <Text style={[coverageStyles.resultText, { color: chrome.ink }]}>{result.message || "No zone or shop radius covers this spot."}</Text>
          )}
        </View>
      ) : null}
      <View style={coverageStyles.pinRow}>
        <AdminInput value={pin} onChangeText={(t) => onPin(t.replace(/\D/g, "").slice(0, 6))} placeholder="Pincode" integer maxLength={6} style={{ flex: 1 }} />
        <AdminButton label="Check" size="md" variant="soft" disabled={pin.length !== 6 || busy} onPress={onCheckPin} />
      </View>
      {!hasPoint && result ? <Text style={[coverageStyles.muted, { color: chrome.inkFaint }]}>{"Pincode checks can't know the exact pin, so they use pincode and city lists only."}</Text> : null}
    </View>
  );
}

const coverageStyles = StyleSheet.create({
  card: {
    position: "absolute",
    left: 12,
    bottom: 12,
    width: 340,
    maxWidth: "88%",
    padding: 14,
    gap: 10,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({ web: { boxShadow: "0 18px 44px -12px rgba(20,24,16,0.4), 0 2px 8px rgba(20,24,16,0.08)", zIndex: 1000 }, default: {} }),
  },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 14, fontFamily: fonts.bold },
  muted: { fontSize: 12, lineHeight: 17, fontFamily: fonts.regular },
  result: { padding: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, gap: 4 },
  resultTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  resultTitle: { flex: 1, fontSize: 13.5, fontFamily: fonts.bold },
  resultText: { fontSize: 12.5, lineHeight: 18, fontFamily: fonts.regular },
  pinRow: { flexDirection: "row", alignItems: "center", gap: 8 },
});

function createStyles(chrome, c, shadowPremium) {
  return StyleSheet.create({
    screen: { flex: 1, width: "100%", alignSelf: "center", maxWidth: "100%" },
    desk: { ...adminShellContent(), gap: spacing.sm + 4 },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    split: { flexDirection: "row", alignItems: "flex-start", gap: 18 },
    splitStacked: { flexDirection: "column", alignItems: "stretch", gap: 14 },
    side: { width: 420, flexShrink: 0, gap: 12 },
    sideStacked: { width: "100%" },
    sideStack: { gap: 12 },
    cardList: { gap: 10 },
    mapCol: { flex: 1, minWidth: 0, gap: 10, ...Platform.select({ web: { position: "sticky", top: 84, alignSelf: "flex-start" }, default: {} }) },
    mapColStacked: { width: "100%", ...Platform.select({ web: { position: "relative", top: 0 }, default: {} }) },
    mapBar: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 },
    toolTabs: { alignSelf: "flex-start" },
    layerRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
    mapFrame: {
      position: "relative",
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      ...Platform.select({ web: { boxShadow: "0 1px 1px rgba(31,51,31,0.03), 0 14px 34px -22px rgba(31,51,31,0.3)" }, default: {} }),
    },
    legend: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 14, paddingHorizontal: 4 },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    legendSwatch: { width: 12, height: 8, borderRadius: 2 },
    legendRound: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 11.5, color: chrome.inkSoft, fontFamily: fonts.regular },
    notice: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
    noticeText: { flex: 1, fontSize: 12.5, lineHeight: 18, fontFamily: fonts.medium },
    phoneHint: { fontSize: 13, lineHeight: 18, color: chrome.inkSoft, fontFamily: fonts.medium },
  });
}
