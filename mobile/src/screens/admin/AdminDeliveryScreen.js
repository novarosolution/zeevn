import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, RefreshControl, StyleSheet, Text, View } from "react-native";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminPanel from "../../components/admin/AdminPanel";
import AdminFilterTabs from "../../components/admin/AdminFilterTabs";
import AdminKpiCard, { AdminKpiGrid } from "../../components/admin/AdminKpiCard";
import PremiumLoader from "../../components/ui/PremiumLoader";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumChip from "../../components/ui/PremiumChip";
import PremiumInput from "../../components/ui/PremiumInput";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useTheme } from "../../context/ThemeContext";
import AdminDeliveryMap from "../../components/admin/AdminDeliveryMap";
import {
  createAdminDeliveryZone,
  deleteAdminDeliveryZone,
  fetchAdminDeliveryPartners,
  fetchAdminDeliveryZones,
  fetchAdminStoreSettings,
  updateAdminDeliveryZone,
  updateAdminStoreSettings,
} from "../../services/adminService";
import { adminShellContent, useAdminCompactLayout } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, spacing } from "../../theme/tokens";
import { formatINR } from "../../utils/currency";

function ZoneCreateFields({ name, setName, pins, setPins, fee, setFee, draftLen, busy, onSave }) {
  return (
    <View style={styles.formGap}>
      <PremiumInput label="Zone name" value={name} onChangeText={setName} placeholder="e.g. Gandhinagar" tone="warm" />
      <PremiumInput
        label="Pincodes (optional)"
        value={pins}
        onChangeText={setPins}
        placeholder="380001, 380015"
        tone="warm"
      />
      <PremiumInput
        label="Delivery fee (₹)"
        value={fee}
        onChangeText={setFee}
        keyboardType="number-pad"
        tone="warm"
      />
      <PremiumButton
        label={busy ? "Saving…" : draftLen >= 3 ? `Save zone · ${draftLen} points` : "Save zone"}
        iconLeft="save-outline"
        loading={busy}
        disabled={busy}
        onPress={onSave}
      />
    </View>
  );
}

export default function AdminDeliveryScreen({ navigation, route }) {
  const compact = useAdminCompactLayout();
  const { user, token } = useAuth();
  const { toastSuccess } = useToast();
  const { colors: c } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [zones, setZones] = useState([]);
  const [partners, setPartners] = useState([]);
  const [name, setName] = useState("");
  const [pins, setPins] = useState("");
  const [fee, setFee] = useState("49");
  const [busy, setBusy] = useState(false);
  const [stores, setStores] = useState([
    { _id: "local", latitude: 23.2156, longitude: 72.6369, maxRadiusKm: 25, label: "Zeevan farm shop" },
  ]);
  const [storeId, setStoreId] = useState("local");
  const [minutesPerKm, setMinutesPerKm] = useState(3);
  const [mode, setMode] = useState("store");
  const [draft, setDraft] = useState([]);
  const [desk, setDesk] = useState("map");
  const store = stores.find((s) => String(s._id) === String(storeId)) || stores[0];

  const load = useCallback(
    async ({ isPullRefresh = false } = {}) => {
      if (isPullRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const [z, p, s] = await Promise.all([
          fetchAdminDeliveryZones(token),
          fetchAdminDeliveryPartners(token),
          fetchAdminStoreSettings(token),
        ]);
        setZones(Array.isArray(z) ? z : []);
        setPartners(Array.isArray(p) ? p : []);
        if (s) {
          const rows = Array.isArray(s.stores) && s.stores.length
            ? s.stores
            : [
                {
                  _id: s._id || "primary",
                  latitude: Number(s.latitude) || 23.2156,
                  longitude: Number(s.longitude) || 72.6369,
                  maxRadiusKm: Number(s.maxRadiusKm) || 25,
                  label: s.label || "Zeevan farm shop",
                  isActive: true,
                },
              ];
          setStores(rows);
          setStoreId(String(rows[0]._id || "primary"));
          setMinutesPerKm(Number(s.minutesPerKm) || 3);
        }
      } catch (err) {
        setError(err.message || "Unable to load delivery ops.");
      } finally {
        if (isPullRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (!user?.isAdmin) return;
    load();
  }, [user?.isAdmin, load]);

  const kpis = useMemo(() => {
    const activeZones = zones.filter((z) => z.isActive !== false).length;
    const online = partners.filter((p) => p.lastLocationAgeSeconds != null && p.lastLocationAgeSeconds < 900)
      .length;
    const activeRuns = partners.reduce((s, p) => s + Number(p.activeOrderCount || 0), 0);
    return { activeZones, partners: partners.length, online, activeRuns };
  }, [zones, partners]);

  const patchStore = (id, patch) => {
    setStores((list) => list.map((s) => (String(s._id) === String(id) ? { ...s, ...patch } : s)));
  };

  const handleMapClick = (pt) => {
    if (mode === "store") {
      if (store) patchStore(store._id, { latitude: pt.lat, longitude: pt.lng });
      return;
    }
    setDraft((d) => [...d, pt]);
  };

  const handleAddStore = () => {
    const next = {
      _id: `new-${Date.now()}`,
      label: `Shop ${stores.length + 1}`,
      latitude: Number(store?.latitude) || 23.2156,
      longitude: Number(store?.longitude) || 72.6369,
      maxRadiusKm: Number(store?.maxRadiusKm) || 25,
      isActive: true,
    };
    setStores((list) => [...list, next]);
    setStoreId(next._id);
    setMode("store");
  };

  const handleDeleteStore = () => {
    if (stores.length < 2 || !store) return;
    const rest = stores.filter((s) => String(s._id) !== String(store._id));
    setStores(rest);
    setStoreId(String(rest[0]._id));
  };

  const handleSaveStore = async () => {
    try {
      setBusy(true);
      setError("");
      const saved = await updateAdminStoreSettings(token, {
        minutesPerKm: Number(minutesPerKm) || 3,
        stores: stores.map((s) => ({
          _id: String(s._id).startsWith("new-") || s._id === "local" || s._id === "primary" ? undefined : s._id,
          label: s.label,
          latitude: Number(s.latitude),
          longitude: Number(s.longitude),
          maxRadiusKm: Number(s.maxRadiusKm) || 0,
          isActive: s.isActive !== false,
        })),
      });
      if (saved?.stores?.length) {
        const keep =
          saved.stores.find((s) => s.label === store?.label && Number(s.latitude) === Number(store?.latitude)) ||
          saved.stores[0];
        setStores(saved.stores);
        setStoreId(String(keep._id));
        setMinutesPerKm(Number(saved.minutesPerKm) || 3);
      }
    } catch (err) {
      setError(err.message || "Could not save shops.");
    } finally {
      setBusy(false);
    }
  };

  const handleCreateZone = async () => {
    const postalCodes = String(pins || "")
      .split(/[,\s]+/)
      .map((x) => x.trim())
      .filter(Boolean);
    const typedName = name.trim();
    const zoneName = typedName || `Zone ${zones.length + 1}`;
    if (!postalCodes.length && draft.length < 3 && !typedName) {
      setError("Name the zone, add a pincode, or tap Create zone and draw 3+ points.");
      return;
    }
    try {
      setBusy(true);
      setError("");
      await createAdminDeliveryZone(token, {
        name: zoneName,
        postalCodes,
        cities: !postalCodes.length && draft.length < 3 ? [typedName] : [],
        polygon: draft,
        deliveryFee: Number(fee) || 0,
        freeAbove: 1499,
        isActive: true,
      });
      setName("");
      setPins("");
      setDraft([]);
      const z = await fetchAdminDeliveryZones(token);
      setZones(Array.isArray(z) ? z : []);
      setDesk("zones");
      toastSuccess(`${zoneName} saved.`, { title: "Zone created" });
    } catch (err) {
      setError(err.message || "Could not create zone.");
    } finally {
      setBusy(false);
    }
  };

  const mapHint =
    mode === "store"
      ? ADMIN_SCREEN_COPY.delivery.stepPin
      : draft.length >= 3
        ? ADMIN_SCREEN_COPY.delivery.stepSave
        : ADMIN_SCREEN_COPY.delivery.stepDraw;

  const handleToggleZone = async (zone) => {
    try {
      setBusy(true);
      setError("");
      await updateAdminDeliveryZone(token, zone._id, { isActive: zone.isActive === false });
      const z = await fetchAdminDeliveryZones(token);
      setZones(Array.isArray(z) ? z : []);
    } catch (err) {
      setError(err.message || "Could not update zone.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteZone = async (zoneId) => {
    try {
      setBusy(true);
      setError("");
      await deleteAdminDeliveryZone(token, zoneId);
      const z = await fetchAdminDeliveryZones(token);
      setZones(Array.isArray(z) ? z : []);
    } catch (err) {
      setError(err.message || "Could not delete zone.");
    } finally {
      setBusy(false);
    }
  };

  const handleAttachArea = async (zoneId) => {
    if (draft.length < 3) {
      setError("Draw the area first — tap 3+ points on the map.");
      return;
    }
    try {
      setBusy(true);
      setError("");
      await updateAdminDeliveryZone(token, zoneId, { polygon: draft });
      setDraft([]);
      const z = await fetchAdminDeliveryZones(token);
      setZones(Array.isArray(z) ? z : []);
    } catch (err) {
      setError(err.message || "Could not save area.");
    } finally {
      setBusy(false);
    }
  };

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <View style={styles.denied}>
            <PremiumErrorBanner severity="warning" title={ADMIN_GATE.title} message={ADMIN_GATE.message} />
            <PremiumButton label={ADMIN_GATE.backHome} onPress={() => navigation.navigate("Home")} />
          </View>
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
            <RefreshControl refreshing={refreshing} onRefresh={() => load({ isPullRefresh: true })} />
          )
        }
      >
        <KankregAdminShell
          navigation={navigation}
          route={route || { name: "AdminDelivery" }}
          title={ADMIN_SCREEN_COPY.delivery.title}
          subtitle={ADMIN_SCREEN_COPY.delivery.subtitle}
        >
          {error ? <PremiumErrorBanner severity="error" message={error} compact style={styles.banner} /> : null}

          {loading ? (
            <PremiumLoader caption="Loading zones & riders…" />
          ) : (
            <View style={styles.desk}>
              <AdminKpiGrid compact={compact} columns={4}>
                <AdminKpiCard
                  label="Active zones"
                  value={String(kpis.activeZones)}
                  onPress={() => setDesk("zones")}
                />
                <AdminKpiCard
                  label="Partners"
                  value={String(kpis.partners)}
                  onPress={() => setDesk("riders")}
                />
                <AdminKpiCard
                  label="GPS recent"
                  value={String(kpis.online)}
                  tone={Number(kpis.online) > 0 ? "default" : "warn"}
                  onPress={() => setDesk("riders")}
                />
                <AdminKpiCard
                  label="Active runs"
                  value={String(kpis.activeRuns)}
                  tone={Number(kpis.activeRuns) > 0 ? "hot" : "default"}
                  onPress={() => setDesk("riders")}
                />
              </AdminKpiGrid>

              <AdminFilterTabs
                value={desk}
                onChange={setDesk}
                items={[
                  { key: "map", label: "Map" },
                  { key: "zones", label: zones.length ? `Zones · ${zones.length}` : "Zones" },
                  { key: "riders", label: partners.length ? `Riders · ${partners.length}` : "Riders" },
                ]}
              />

              {desk === "map" ? (
                <View style={styles.formGap}>
                  <AdminPanel
                    title="Coverage map"
                    icon="navigate-outline"
                    meta={mode === "draw" ? `${draft.length} points` : `${minutesPerKm} min / km`}
                    description={mapHint}
                  >
                    <View style={styles.formGap}>
                      <View style={styles.modeRow}>
                        <PremiumChip
                          label="Move shop pin"
                          selected={mode === "store"}
                          onPress={() => setMode("store")}
                          size="sm"
                        />
                        <PremiumChip
                          label="Create zone"
                          selected={mode === "draw"}
                          onPress={() => setMode("draw")}
                          size="sm"
                        />
                        <PremiumChip label="Add shop" size="sm" onPress={handleAddStore} />
                        {draft.length ? (
                          <PremiumChip label="Undo" onPress={() => setDraft((d) => d.slice(0, -1))} size="sm" />
                        ) : null}
                        {draft.length ? (
                          <PremiumChip label="Clear" onPress={() => setDraft([])} size="sm" />
                        ) : null}
                      </View>
                      <AdminDeliveryMap
                        store={store}
                        stores={stores}
                        radiusKm={Number(store?.maxRadiusKm) || 0}
                        zones={zones}
                        draft={draft}
                        hint={mapHint}
                        mode={mode}
                        onMapClick={handleMapClick}
                      />
                      {draft.length >= 3 ? (
                        <PremiumButton
                          label={busy ? "Saving…" : `Save zone · ${draft.length} points`}
                          iconLeft="save-outline"
                          loading={busy}
                          disabled={busy}
                          onPress={handleCreateZone}
                        />
                      ) : null}
                    </View>
                  </AdminPanel>

                  <AdminPanel
                    title="Create zone"
                    icon="add-circle-outline"
                    meta={draft.length >= 3 ? `${draft.length} points ready` : "Name it, or just save after 3 taps"}
                    description="Tap Create zone, draw the area, then save. Pincodes are optional."
                  >
                    <ZoneCreateFields
                      name={name}
                      setName={setName}
                      pins={pins}
                      setPins={setPins}
                      fee={fee}
                      setFee={setFee}
                      draftLen={draft.length}
                      busy={busy}
                      onSave={handleCreateZone}
                    />
                  </AdminPanel>

                  <AdminPanel title="Shops" icon="storefront-outline" meta={`${stores.length} · time = km × minutes`}>
                        <View style={styles.formGap}>
                          <View style={styles.modeRow}>
                            {stores.map((s, i) => (
                              <PremiumChip
                                key={String(s._id || i)}
                                label={s.label || `Shop ${i + 1}`}
                                selected={String(s._id) === String(store?._id)}
                                onPress={() => {
                                  setStoreId(String(s._id));
                                  setMode("store");
                                }}
                                size="sm"
                              />
                            ))}
                          </View>
                          <PremiumInput
                            label="Shop name"
                            value={store?.label || ""}
                            onChangeText={(v) => store && patchStore(store._id, { label: v })}
                            tone="warm"
                          />
                          <View style={styles.storeGrid}>
                            <PremiumInput
                              label="Minutes per km"
                              value={String(minutesPerKm)}
                              onChangeText={setMinutesPerKm}
                              keyboardType="decimal-pad"
                              tone="warm"
                            />
                            <PremiumInput
                              label="Max radius (km)"
                              value={String(store?.maxRadiusKm ?? "")}
                              onChangeText={(v) => store && patchStore(store._id, { maxRadiusKm: v })}
                              keyboardType="decimal-pad"
                              tone="warm"
                            />
                          </View>
                          <PremiumButton
                            label={busy ? "Saving…" : "Save shops"}
                            iconLeft="save-outline"
                            loading={busy}
                            disabled={busy}
                            onPress={handleSaveStore}
                          />
                          {stores.length > 1 ? (
                            <PremiumButton
                              label="Remove this shop"
                              variant="ghost"
                              disabled={busy}
                              onPress={handleDeleteStore}
                            />
                          ) : null}
                        </View>
                  </AdminPanel>
                </View>
              ) : null}

              {desk === "zones" ? (
                <View style={styles.formGap}>
                <AdminPanel
                  title="Create zone"
                  icon="add-circle-outline"
                  meta={draft.length >= 3 ? `${draft.length} points ready` : "Save now, or draw on Map first"}
                  description="Name the zone and save. Need a shape? Open Map, tap Create zone, draw 3+ points."
                  action="Draw on map"
                  onAction={() => {
                    setMode("draw");
                    setDesk("map");
                  }}
                >
                  <ZoneCreateFields
                    name={name}
                    setName={setName}
                    pins={pins}
                    setPins={setPins}
                    fee={fee}
                    setFee={setFee}
                    draftLen={draft.length}
                    busy={busy}
                    onSave={handleCreateZone}
                  />
                </AdminPanel>
                <AdminPanel
                  title="Zones"
                  icon="location-outline"
                  meta={`${zones.length} total`}
                  description="Turn a zone off, attach a drawn area, or delete it."
                >
                  {!zones.length ? (
                    <Text style={[styles.muted, { color: c.textMuted }]}>
                      {ADMIN_SCREEN_COPY.delivery.emptyZones}
                    </Text>
                  ) : (
                    zones.map((z) => (
                      <View key={String(z._id)} style={[styles.row, { borderColor: c.border }]}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={[styles.rowTitle, { color: c.textPrimary }]} numberOfLines={1}>
                            {z.name}
                          </Text>
                          <Text style={[styles.rowMeta, { color: c.textMuted }]} numberOfLines={2}>
                            {(z.postalCodes || []).slice(0, 6).join(", ")}
                            {(z.postalCodes || []).length > 6 ? "…" : ""}
                          </Text>
                        </View>
                        <View style={styles.rowRight}>
                          <PremiumChip
                            label={z.isActive === false ? "Off" : "Active"}
                            tone={z.isActive === false ? "neutral" : "green"}
                            size="sm"
                            selected={z.isActive !== false}
                            onPress={() => handleToggleZone(z)}
                          />
                          {(z.polygon || []).length >= 3 ? (
                            <PremiumChip label="Mapped" tone="green" size="sm" selected />
                          ) : (
                            <PremiumChip
                              label="Use drawn area"
                              size="sm"
                              onPress={() => handleAttachArea(z._id)}
                            />
                          )}
                          <PremiumChip label="Delete" size="sm" onPress={() => handleDeleteZone(z._id)} />
                          <Text style={[styles.fee, { color: c.textPrimary }]}>
                            {formatINR(Number(z.deliveryFee || 0))}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </AdminPanel>
                </View>
              ) : null}

              {desk === "riders" ? (
                <AdminPanel
                  title="Riders"
                  icon="bicycle-outline"
                  meta="Enable partners in Users"
                  description="Live GPS and active run counts."
                  action="Users"
                  onAction={() => navigation.navigate("AdminUsers")}
                >
                  {!partners.length ? (
                    <Text style={[styles.muted, { color: c.textMuted }]}>
                      {ADMIN_SCREEN_COPY.delivery.emptyPartners}
                    </Text>
                  ) : (
                    partners.map((p) => (
                      <View key={String(p._id)} style={[styles.row, { borderColor: c.border }]}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={[styles.rowTitle, { color: c.textPrimary }]} numberOfLines={1}>
                            {p.name || "Partner"}
                          </Text>
                          <Text style={[styles.rowMeta, { color: c.textMuted }]} numberOfLines={1}>
                            {p.phone || p.email || "—"} · {p.activeOrderCount || 0} active
                          </Text>
                        </View>
                        <PremiumChip
                          label={
                            p.lastLocationAgeSeconds != null && p.lastLocationAgeSeconds < 900
                              ? "Live GPS"
                              : "Offline"
                          }
                          tone={
                            p.lastLocationAgeSeconds != null && p.lastLocationAgeSeconds < 900
                              ? "green"
                              : "neutral"
                          }
                          size="sm"
                          selected
                        />
                      </View>
                    ))
                  )}
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
  screen: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    maxWidth: "100%",
  },
  desk: adminShellContent(),
  denied: { padding: spacing.lg, gap: spacing.md },
  banner: { marginBottom: spacing.md },
  deskCols: { gap: spacing.md },
  formGap: { gap: spacing.sm },
  modeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  storeGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, flex: 1 },
  muted: { fontSize: 13, paddingVertical: spacing.sm, fontFamily: fonts.regular },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowTitle: { fontFamily: fonts.semibold, fontSize: 14 },
  rowMeta: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  rowRight: { alignItems: "flex-end", gap: 4 },
  fee: { fontFamily: fonts.semibold, fontSize: 13 },
});
