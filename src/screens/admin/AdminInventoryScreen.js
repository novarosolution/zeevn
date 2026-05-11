import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppFooter from "../../components/AppFooter";
import AdminBackLink from "../../components/admin/AdminBackLink";
import AdminPageHeading from "../../components/admin/AdminPageHeading";
import CustomerScreenShell from "../../components/CustomerScreenShell";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchAdminProducts, patchAdminProductStock } from "../../services/adminService";
import { adminModuleSection } from "../../theme/adminLayout";
import { ALCHEMY, FONT_DISPLAY } from "../../theme/customerAlchemy";
import { adminInnerPageScrollContent, customerScrollFill } from "../../theme/screenLayout";
import { fonts, layout, radius, spacing, typography } from "../../theme/tokens";
import PremiumLoader from "../../components/ui/PremiumLoader";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumInput from "../../components/ui/PremiumInput";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumChip from "../../components/ui/PremiumChip";
import PremiumCard from "../../components/ui/PremiumCard";
import { ADMIN_SCREEN_COPY } from "../../content/appContent";

/** Counts as “low stock” when qty is 1..LOW_STOCK_MAX and still sellable. */
const LOW_STOCK_MAX = 5;

const FILTERS = [
  { id: "all", label: "All" },
  { id: "in_stock", label: "In stock" },
  { id: "low", label: "Low" },
  { id: "out", label: "Out" },
];

function stockState(p) {
  const q = Math.max(0, Number(p.stockQty) || 0);
  const out = p.inStock === false || q < 1;
  const available = !out;
  const low = !out && q >= 1 && q <= LOW_STOCK_MAX;
  return { q, out, available, low };
}

export default function AdminInventoryScreen({ navigation }) {
  const { colors: c, shadowPremium, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [draftQty, setDraftQty] = useState({});

  const styles = useMemo(() => createStyles(c, shadowPremium), [c, shadowPremium]);

  const load = useCallback(async (opts = {}) => {
    const { silent = false } = opts;
    setError("");
    if (!silent) setLoading(true);
    try {
      const data = await fetchAdminProducts(token);
      setProducts(data);
    } catch (e) {
      setError(e.message || "Failed to load inventory.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    if (!user.isAdmin) {
      setLoading(false);
      return;
    }
    load({ silent: false });
  }, [user, load]);

  const stats = useMemo(() => {
    const total = products.length;
    let out = 0;
    let low = 0;
    for (const p of products) {
      const s = stockState(p);
      if (s.out) out += 1;
      if (s.low) low += 1;
    }
    return { total, out, low };
  }, [products]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const s = stockState(p);
      if (filter === "in_stock" && s.out) return false;
      if (filter === "out" && !s.out) return false;
      if (filter === "low" && !s.low) return false;
      if (!q) return true;
      const name = String(p.name || "").toLowerCase();
      const sku = String(p.sku || "").toLowerCase();
      return name.includes(q) || sku.includes(q);
    });
  }, [products, search, filter]);

  const applyPatch = useCallback(
    async (id, body) => {
      setBusyId(id);
      setError("");
      try {
        await patchAdminProductStock(token, id, body);
        setDraftQty((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        await load({ silent: true });
      } catch (e) {
        setError(e.message || "Update failed.");
      } finally {
        setBusyId("");
      }
    },
    [token, load]
  );

  const onDelta = (p, delta) => {
    const { q } = stockState(p);
    const next = Math.max(0, q + delta);
    applyPatch(p._id, { stockQty: next, inStock: next > 0 });
  };

  const onToggle = (p, value) => {
    const q = Math.max(0, Number(p.stockQty) || 0);
    if (value) {
      applyPatch(p._id, { inStock: true, stockQty: q < 1 ? 1 : q });
    } else {
      applyPatch(p._id, { inStock: false });
    }
  };

  const onApplyQty = (p) => {
    const raw = String(draftQty[p._id] !== undefined ? draftQty[p._id] : p.stockQty ?? 0);
    const next = Math.max(0, parseInt(raw, 10) || 0);
    applyPatch(p._id, { stockQty: next, inStock: next > 0 });
  };

  if (!user) {
    return (
      <CustomerScreenShell style={styles.screen} variant="admin">
        <View style={[styles.denied, { padding: spacing.lg, paddingTop: insets.top + spacing.md, flex: 1 }]}>
          <Text style={styles.deniedTitle}>Sign in</Text>
          <Text style={styles.deniedSub}>Log in with an admin account to manage inventory.</Text>
          <PremiumButton label="Go to login" variant="primary" onPress={() => navigation.navigate("Login")} style={styles.gateCta} />
        </View>
      </CustomerScreenShell>
    );
  }

  if (!user.isAdmin) {
    return (
      <CustomerScreenShell style={styles.screen} variant="admin">
        <View style={[styles.denied, customerScrollFill, { padding: spacing.lg, paddingTop: insets.top + spacing.md }]}>
          <Ionicons name="shield-half-outline" size={44} color={c.primary} />
          <Text style={styles.deniedTitle}>Admins only</Text>
          <Text style={styles.deniedSub}>Sign in with an admin account to manage stock.</Text>
          <PremiumButton label="Back to home" variant="primary" onPress={() => navigation.navigate("Home")} style={styles.gateCta} />
        </View>
      </CustomerScreenShell>
    );
  }

  return (
    <CustomerScreenShell style={styles.screen} variant="admin">
      <FlatList
        data={visible}
        keyExtractor={(i) => i._id}
        style={customerScrollFill}
        contentContainerStyle={adminInnerPageScrollContent(insets, { paddingBottom: spacing.xxl + 20 })}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.topHead}>
              <AdminBackLink navigation={navigation} />
            </View>
            <View style={styles.titleBlock}>
              <AdminPageHeading
                title={ADMIN_SCREEN_COPY.inventory.title}
                subtitle={ADMIN_SCREEN_COPY.inventory.subtitle}
              />
            </View>

            <View style={styles.statsRow}>
              {[
                { icon: "cube-outline", label: "SKUs", value: String(stats.total), warn: false },
                { icon: "alert-circle-outline", label: "Out / zero", value: String(stats.out), warn: stats.out > 0 },
                { icon: "trending-down-outline", label: `Low (≤${LOW_STOCK_MAX})`, value: String(stats.low), warn: stats.low > 0 },
              ].map((s) => (
                <View
                  key={s.label}
                  style={[
                    styles.statPill,
                    s.warn ? { borderColor: c.primaryBorder, backgroundColor: c.primarySoft } : { borderColor: c.border },
                  ]}
                >
                  <Ionicons name={s.icon} size={16} color={c.primary} />
                  <Text style={styles.statVal}>{s.value}</Text>
                  <Text style={styles.statLab}>{s.label}</Text>
                </View>
              ))}
            </View>

            {error ? (
              <View style={styles.bannerSpacer}>
                <PremiumErrorBanner severity="error" message={error} onClose={() => setError("")} compact />
              </View>
            ) : null}

            <View style={[adminModuleSection(isDark, c), styles.filterShell]}>
              <Text style={[styles.sectionKicker, { color: c.textMuted }]}>FILTER</Text>
              <View style={styles.chips}>
                {FILTERS.map((f) => {
                  const active = filter === f.id;
                  return (
                    <PremiumChip
                      key={f.id}
                      label={f.label}
                      tone={active ? "gold" : "neutral"}
                      size="sm"
                      selected={active}
                      onPress={() => setFilter(f.id)}
                    />
                  );
                })}
              </View>
              <View style={styles.searchRow}>
                <View style={styles.searchInputFlex}>
                  <PremiumInput
                    label={ADMIN_SCREEN_COPY.inventory.searchLabel}
                    value={search}
                    onChangeText={setSearch}
                    iconLeft="search-outline"
                    iconRight={search ? "close-circle" : undefined}
                    onIconRightPress={search ? () => setSearch("") : undefined}
                    autoCapitalize="none"
                  />
                </View>
                <PremiumButton
                  label={ADMIN_SCREEN_COPY.refreshCta}
                  iconLeft="refresh-outline"
                  variant="secondary"
                  size="sm"
                  onPress={() => load({ silent: false })}
                  accessibilityLabel="Refresh inventory"
                />
              </View>
            </View>

            {loading ? (
              <View style={styles.loadRow}>
                <PremiumLoader size="sm" caption="Loading inventory…" inline />
              </View>
            ) : null}
            <Text style={styles.listCount}>
              {visible.length} of {products.length} products
            </Text>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <PremiumEmptyState
                iconName="file-tray-outline"
                title="No products match this view"
                description="Try another filter or clear your search."
                compact
              />
            </View>
          ) : null
        }
        renderItem={({ item: p }) => {
          const s = stockState(p);
          const busy = busyId === p._id;
          const dval =
            draftQty[p._id] !== undefined
              ? draftQty[p._id]
              : String(Math.max(0, Number(p.stockQty) || 0));
          return (
            <View
              style={[
                styles.rowCard,
                { borderColor: c.border, backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt },
                s.out ? styles.rowWarn : null,
              ]}
            >
              <View style={styles.rowTop}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.pName} numberOfLines={2}>
                    {p.name}
                  </Text>
                  <Text style={styles.pSku}>{p.sku ? `SKU: ${p.sku}` : "No SKU"}</Text>
                </View>
                {s.low ? <PremiumChip label="Low" tone="gold" size="xs" /> : null}
                {s.out ? <PremiumChip label="Out" tone="red" size="xs" /> : null}
              </View>

              <View style={styles.qtyRow}>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => onDelta(p, -1)}
                    disabled={busy}
                    accessibilityLabel="Decrease stock"
                  >
                    <Ionicons name="remove" size={20} color={c.textPrimary} />
                  </TouchableOpacity>
                  <TextInput
                    style={[
                      styles.qtyField,
                      { color: c.textPrimary, borderColor: c.border, backgroundColor: c.surface },
                    ]}
                    value={dval}
                    keyboardType="number-pad"
                    editable={!busy}
                    onChangeText={(t) => setDraftQty((o) => ({ ...o, [p._id]: t }))}
                    onSubmitEditing={() => onApplyQty(p)}
                    onBlur={() => onApplyQty(p)}
                  />
                  <TouchableOpacity style={styles.stepBtn} onPress={() => onDelta(p, 1)} disabled={busy} accessibilityLabel="Increase stock">
                    <Ionicons name="add" size={20} color={c.textPrimary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.switchBlock}>
                  <Text style={styles.switchLab}>Available</Text>
                  <Switch
                    value={p.inStock !== false}
                    onValueChange={(v) => onToggle(p, v)}
                    disabled={busy}
                    trackColor={{ false: c.border, true: c.primarySoft }}
                    thumbColor={c.surface}
                    ios_backgroundColor={c.border}
                  />
                </View>
              </View>

              <View style={styles.rowFoot}>
                {busy ? (
                  <View style={styles.busyInline}>
                    <PremiumLoader size="sm" inline />
                  </View>
                ) : null}
                <PremiumButton
                  label="Edit full product"
                  iconLeft="create-outline"
                  variant="ghost"
                  size="sm"
                  onPress={() => navigation.navigate("AdminAddProduct", { product: p })}
                />
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <View>
            <PremiumCard
              padding="lg"
              interactive
              onPress={() => navigation.navigate("AdminAddProduct")}
              goldAccent
              style={[styles.footCta, { marginTop: spacing.lg }]}
            >
              <View style={styles.footCtaInner}>
                <Ionicons name="add-circle-outline" size={24} color={c.primary} />
                <View style={styles.footCtaTextCol}>
                  <Text style={[styles.footCtaT, { color: c.textPrimary }]}>Add new product</Text>
                  <Text style={[styles.footCtaD, { color: c.textSecondary }]}>Set initial stock in the form.</Text>
                </View>
              </View>
            </PremiumCard>
            <AppFooter />
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </CustomerScreenShell>
  );
}

function createStyles(c, shadowPremium) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      width: "100%",
      alignSelf: "center",
      maxWidth: Platform.select({ web: layout.maxContentWidth + 96, default: "100%" }),
    },
    listContent: {
      paddingHorizontal: Platform.select({ web: spacing.xl, default: spacing.lg }),
    },
    headerBlock: { marginBottom: spacing.sm },
    topHead: { marginBottom: spacing.xs },
    titleBlock: { marginBottom: spacing.md },
    titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
    h1: {
      fontSize: typography.h1,
      fontFamily: FONT_DISPLAY,
      color: c.textPrimary,
      letterSpacing: -0.4,
    },
    subH: {
      marginTop: 6,
      color: c.textSecondary,
      fontSize: typography.bodySmall,
      fontFamily: fonts.regular,
      lineHeight: 20,
    },
    statsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    statPill: {
      minWidth: 100,
      flex: 1,
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.sm,
      alignItems: "center",
      gap: 4,
    },
    statVal: { fontFamily: fonts.extrabold, color: c.primary, fontSize: typography.h2 },
    statLab: { fontSize: 10, fontFamily: fonts.bold, color: c.textMuted, textTransform: "uppercase" },
    bannerSpacer: { marginBottom: spacing.sm },
    filterShell: { marginBottom: spacing.md },
    sectionKicker: {
      fontSize: 10,
      fontFamily: fonts.extrabold,
      letterSpacing: 1,
      marginBottom: spacing.sm,
    },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.md },
    searchRow: { flexDirection: "row", alignItems: "flex-end", flexWrap: "wrap", gap: spacing.sm },
    searchInputFlex: { flex: 1, minWidth: 0 },
    loadRow: { marginBottom: spacing.sm },
    busyInline: { marginRight: 8 },
    listCount: { fontSize: typography.caption, color: c.textMuted, fontFamily: fonts.semibold, marginBottom: spacing.sm },
    rowCard: {
      borderWidth: 1,
      borderRadius: radius.xl,
      padding: spacing.md,
      marginBottom: spacing.sm,
      ...shadowPremium,
      ...Platform.select({
        web: {
          boxShadow: "0 10px 24px rgba(28, 25, 23, 0.08), inset 0 1px 0 rgba(255,255,255,0.72)",
          transition: "box-shadow 0.18s ease, border-color 0.18s ease, transform 0.18s ease",
        },
        default: {},
      }),
    },
    rowWarn: { borderLeftWidth: 3, borderLeftColor: c.danger },
    rowTop: { flexDirection: "row", alignItems: "flex-start", gap: spacing.xs, marginBottom: spacing.sm },
    pName: { fontFamily: fonts.bold, color: c.textPrimary, fontSize: typography.body },
    pSku: { marginTop: 4, fontSize: 11, color: c.textMuted, fontFamily: fonts.regular },
    qtyRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between", gap: spacing.md },
    stepper: { flexDirection: "row", alignItems: "center", gap: 0 },
    stepBtn: { padding: 8, borderRadius: radius.md, backgroundColor: c.surface },
    qtyField: {
      minWidth: 64,
      maxWidth: 88,
      textAlign: "center",
      borderWidth: 1,
      borderRadius: radius.md,
      paddingVertical: 8,
      fontFamily: fonts.extrabold,
      fontSize: typography.body,
    },
    switchBlock: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    switchLab: { color: c.textSecondary, fontSize: typography.caption, fontFamily: fonts.semibold },
    rowFoot: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    footCta: { marginBottom: 0 },
    footCtaInner: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    footCtaTextCol: { flex: 1, minWidth: 0 },
    footCtaT: { fontWeight: "700", fontSize: typography.body, fontFamily: fonts.bold },
    footCtaD: { fontSize: typography.caption, marginTop: 2, fontFamily: fonts.regular },
    emptyWrap: { marginBottom: spacing.md },
    denied: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm },
    deniedTitle: { fontSize: typography.h2, fontFamily: FONT_DISPLAY, color: c.textPrimary, marginTop: spacing.md },
    deniedSub: { color: c.textSecondary, textAlign: "center", paddingHorizontal: spacing.xl, fontFamily: fonts.regular },
    gateCta: { marginTop: spacing.md },
  });
}
