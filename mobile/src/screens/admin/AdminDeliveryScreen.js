import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, RefreshControl, StyleSheet, Text, View } from "react-native";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminPanel from "../../components/admin/AdminPanel";
import AdminKpiCard, { AdminKpiGrid } from "../../components/admin/AdminKpiCard";
import PremiumLoader from "../../components/ui/PremiumLoader";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumChip from "../../components/ui/PremiumChip";
import PremiumInput from "../../components/ui/PremiumInput";
import SectionReveal from "../../components/motion/SectionReveal";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import AdminDeliveryMap from "../../components/admin/AdminDeliveryMap";
import {
  createAdminDeliveryZone,
  fetchAdminDeliveryPartners,
  fetchAdminDeliveryZones,
  fetchAdminStoreSettings,
  updateAdminDeliveryZone,
  updateAdminStoreSettings,
} from "../../services/adminService";
import {
  adminShellContent,
  adminTwoColAside,
  adminTwoColMain,
  adminTwoColStyle,
  useAdminCompactLayout,
} from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, spacing } from "../../theme/tokens";
import { formatINR } from "../../utils/currency";

export default function AdminDeliveryScreen({ navigation, route }) {
  const compact = useAdminCompactLayout();
  const { user, token } = useAuth();
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
  const [store, setStore] = useState({ latitude: 23.2156, longitude: 72.6369, minutesPerKm: 3, maxRadiusKm: 25, label: "Zeevan farm shop" });
  const [mode, setMode] = useState("store");
  const [draft, setDraft] = useState([]);

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
          setStore({
            latitude: Number(s.latitude) || 23.2156,
            longitude: Number(s.longitude) || 72.6369,
            minutesPerKm: Number(s.minutesPerKm) || 3,
            maxRadiusKm: Number(s.maxRadiusKm) || 25,
            label: s.label || "Zeevan farm shop",
          });
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

  const handleMapClick = (pt) => {
    if (mode === "store") {
      setStore((s) => ({ ...s, latitude: pt.lat, longitude: pt.lng }));
      return;
    }
    setDraft((d) => [...d, pt]);
  };

  const handleSaveStore = async () => {
    try {
      setBusy(true);
      setError("");
      const saved = await updateAdminStoreSettings(token, {
        latitude: Number(store.latitude),
        longitude: Number(store.longitude),
        minutesPerKm: Number(store.minutesPerKm),
        maxRadiusKm: Number(store.maxRadiusKm),
        label: store.label,
      });
      if (saved) setStore((s) => ({ ...s, ...saved }));
    } catch (err) {
      setError(err.message || "Could not save shop pin.");
    } finally {
      setBusy(false);
    }
  };

  const handleCreateZone = async () => {
    const postalCodes = String(pins || "")
      .split(/[,\s]+/)
      .map((x) => x.trim())
      .filter(Boolean);
    if (!name.trim()) {
      setError("Zone name is required.");
      return;
    }
    if (!postalCodes.length && draft.length < 3) {
      setError("Add pincodes or draw the area (3+ taps) on the map.");
      return;
    }
    try {
      setBusy(true);
      setError("");
      await createAdminDeliveryZone(token, {
        name: name.trim(),
        postalCodes,
        polygon: draft,
        deliveryFee: Number(fee) || 0,
        freeAbove: 1499,
        isActive: true,
      });
      setName("");
      setPins("");
      setDraft([]);
      await load();
    } catch (err) {
      setError(err.message || "Could not create zone.");
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
      await load();
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
              <SectionReveal preset="fade-up">
                <AdminPanel
                  title="Coverage pulse"
                  icon="map-outline"
                  meta="Live desk"
                  description="Active zones, partners online, and live delivery runs."
                >
                  <AdminKpiGrid compact={compact}>
                    <AdminKpiCard label="Active zones" value={String(kpis.activeZones)} />
                    <AdminKpiCard label="Partners" value={String(kpis.partners)} />
                    <AdminKpiCard
                      label="GPS recent"
                      value={String(kpis.online)}
                      tone={Number(kpis.online) > 0 ? "default" : "warn"}
                    />
                    <AdminKpiCard
                      label="Active runs"
                      value={String(kpis.activeRuns)}
                      tone={Number(kpis.activeRuns) > 0 ? "hot" : "default"}
                    />
                  </AdminKpiGrid>
                </AdminPanel>
              </SectionReveal>

              <SectionReveal preset="fade-up" delay={20}>
                <AdminPanel
                  title="Shop pin & coverage"
                  icon="navigate-outline"
                  meta={`${store.minutesPerKm} min / km`}
                  description="Tap the map to drop the shop. Draw mode traces the delivery line. Time = distance × minutes per km."
                >
                  <View style={styles.formGap}>
                    <View style={styles.modeRow}>
                      <PremiumChip
                        label="Set shop pin"
                        selected={mode === "store"}
                        onPress={() => setMode("store")}
                        size="sm"
                      />
                      <PremiumChip
                        label="Draw area"
                        selected={mode === "draw"}
                        onPress={() => setMode("draw")}
                        size="sm"
                      />
                      {draft.length ? (
                        <PremiumChip label="Undo point" onPress={() => setDraft((d) => d.slice(0, -1))} size="sm" />
                      ) : null}
                      {draft.length ? (
                        <PremiumChip label="Clear line" onPress={() => setDraft([])} size="sm" />
                      ) : null}
                    </View>
                    <AdminDeliveryMap
                      store={store}
                      radiusKm={store.maxRadiusKm}
                      zones={zones}
                      draft={draft}
                      onMapClick={handleMapClick}
                    />
                    <View style={styles.storeGrid}>
                      <PremiumInput
                        label="Minutes per km"
                        value={String(store.minutesPerKm)}
                        onChangeText={(v) => setStore((s) => ({ ...s, minutesPerKm: v }))}
                        keyboardType="decimal-pad"
                        tone="warm"
                      />
                      <PremiumInput
                        label="Max radius (km)"
                        value={String(store.maxRadiusKm)}
                        onChangeText={(v) => setStore((s) => ({ ...s, maxRadiusKm: v }))}
                        keyboardType="decimal-pad"
                        tone="warm"
                      />
                    </View>
                    <PremiumButton
                      label={busy ? "Saving…" : "Save shop pin"}
                      iconLeft="save-outline"
                      loading={busy}
                      disabled={busy}
                      onPress={handleSaveStore}
                    />
                  </View>
                </AdminPanel>
              </SectionReveal>

              <View style={[adminTwoColStyle(compact), styles.deskCols]}>
                <View style={adminTwoColMain(compact)}>
                  <SectionReveal preset="fade-up" delay={40}>
                    <AdminPanel
                      title="Add zone"
                      icon="add-circle-outline"
                      meta={draft.length >= 3 ? `${draft.length} map points` : "Pincodes or drawn area"}
                      description="Name the area. Use pincodes and/or the red line on the map."
                    >
                      <View style={styles.formGap}>
                        <PremiumInput label="Zone name" value={name} onChangeText={setName} tone="warm" />
                        <PremiumInput
                          label="Pincodes"
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
                          label={busy ? "Saving…" : "Create zone"}
                          iconLeft="add-outline"
                          loading={busy}
                          disabled={busy}
                          onPress={handleCreateZone}
                        />
                      </View>
                    </AdminPanel>
                  </SectionReveal>

                  <SectionReveal preset="fade-up" delay={80}>
                    <AdminPanel
                      title="Zones"
                      icon="location-outline"
                      meta={`${zones.length} total`}
                      description="Toggle coverage and review fees per zone."
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
                                selected
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
                              <Text style={[styles.fee, { color: c.textPrimary }]}>
                                {formatINR(Number(z.deliveryFee || 0))}
                              </Text>
                            </View>
                          </View>
                        ))
                      )}
                    </AdminPanel>
                  </SectionReveal>
                </View>

                <View style={adminTwoColAside(compact)}>
                  <SectionReveal preset="fade-up" delay={100}>
                    <AdminPanel
                      title="Riders"
                      icon="bicycle-outline"
                      meta="Enable partners in Users"
                      description="Live GPS and active run counts for delivery partners."
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
                  </SectionReveal>
                </View>
              </View>
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
  storeGrid: { flexDirection: "row", gap: spacing.sm },
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
