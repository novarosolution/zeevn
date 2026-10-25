import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchAdminProducts, patchAdminProductStock } from "../../services/adminService";
import { ADMIN_FONT, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import AdminStatTile, { AdminStatGrid } from "../../components/admin/AdminStatTile";
import AdminFilterTabs from "../../components/admin/AdminFilterTabs";
import AdminDataTable from "../../components/admin/AdminDataTable";
import AdminPanel from "../../components/admin/AdminPanel";
import AdminBadge from "../../components/admin/AdminBadge";
import AdminProductCell from "../../components/admin/AdminProductCell";
import AdminQtyStepper from "../../components/admin/AdminQtyStepper";
import AdminSwitch from "../../components/admin/AdminSwitch";
import AdminButton, { AdminButtonRow } from "../../components/admin/AdminButton";
import AdminInput from "../../components/admin/AdminInput";
import { buildInventoryTableColumns } from "../../components/admin/adminTableColumns";
import { productCoverUri } from "../../utils/adminProductHelpers";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, layout, radius, spacing, typography } from "../../theme/tokens";
import PremiumLoader from "../../components/ui/PremiumLoader";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumCard from "../../components/ui/PremiumCard";
import SectionReveal from "../../components/motion/SectionReveal";
import { staggerDelay } from "../../theme/motion";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";
import { formatRupees } from "../../utils/adminFormat";

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

function categoryName(p) {
  return String(p.category || "").trim() || "General";
}

function hasPicture(p) {
  if (typeof p.hasCatalogPhoto === "boolean") return p.hasCatalogPhoto;
  if (String(p.image || "").trim()) return true;
  return (Array.isArray(p.images) ? p.images : []).some((img) => String(img || "").trim());
}

function parseQty(value) {
  const n = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function unitLabel(p) {
  return String(p.unit || "").trim() || "—";
}

function stockPill(p) {
  const s = stockState(p);
  if (s.out) return { label: "Out", tone: "red" };
  if (s.low) return { label: "Low", tone: "gold" };
  return { label: "In stock", tone: "green" };
}

export default function AdminInventoryScreen({ navigation, route }) {
  const { colors: c, shadowPremium, isDark } = useTheme();
  const chrome = useAdminChrome();
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(typeof route?.params?.search === "string" ? route.params.search : "");
  const [filter, setFilter] = useState(
    ["all", "in_stock", "low", "out"].includes(route?.params?.filter) ? route.params.filter : "all"
  );
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [draftQty, setDraftQty] = useState({});
  const busyRef = useRef("");

  const styles = useMemo(() => createStyles(c, shadowPremium, isDark), [c, shadowPremium, isDark]);
  const compact = useAdminCompactLayout();

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
    const next = route?.params?.filter;
    if (["all", "in_stock", "low", "out"].includes(next)) setFilter(next);
  }, [route?.params?.filter]);

  useEffect(() => {
    if (typeof route?.params?.search === "string") setSearch(route.params.search);
  }, [route?.params?.search]);

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
    let inStock = 0;
    let out = 0;
    let low = 0;
    let value = 0;
    let missingPicture = 0;
    const byCat = new Map();
    for (const p of products) {
      const s = stockState(p);
      if (s.out) out += 1;
      else {
        inStock += 1;
        value += s.q * (Number(p.price) || 0);
        if (s.low) low += 1;
        if (!hasPicture(p)) missingPicture += 1;
      }
      const name = categoryName(p);
      const row = byCat.get(name) || { name, total: 0, inStock: 0, low: 0, out: 0 };
      row.total += 1;
      if (s.out) row.out += 1;
      else {
        row.inStock += 1;
        if (s.low) row.low += 1;
      }
      byCat.set(name, row);
    }
    return {
      total: products.length,
      inStock,
      out,
      low,
      value,
      missingPicture,
      categories: [...byCat.values()].sort((a, b) => a.name.localeCompare(b.name)),
    };
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
      const cat = categoryName(p).toLowerCase();
      return name.includes(q) || sku.includes(q) || cat.includes(q);
    });
  }, [products, search, filter]);

  const applyPatch = useCallback(
    async (id, body) => {
      if (!id || busyRef.current) return;
      const stockQty = parseQty(body.stockQty);
      const inStock = body.inStock === true;
      busyRef.current = id;
      setBusyId(id);
      setError("");
      try {
        const row = await patchAdminProductStock(token, id, { stockQty, inStock });
        setProducts((prev) => prev.map((p) => (String(p._id) === String(id) ? row : p)));
        setDraftQty((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      } catch (e) {
        setError(e.message || "Update failed.");
      } finally {
        busyRef.current = "";
        setBusyId("");
      }
    },
    [token]
  );

  const onDelta = (p, delta) => {
    const { q } = stockState(p);
    const next = Math.max(0, q + delta);
    if (next === q && (next > 0) === (p.inStock !== false)) return;
    applyPatch(p._id, { stockQty: next, inStock: next > 0 });
  };

  const onToggle = (p, value) => {
    const q = parseQty(p.stockQty);
    if (value) {
      applyPatch(p._id, { stockQty: q < 1 ? 1 : q, inStock: true });
    } else {
      applyPatch(p._id, { stockQty: q, inStock: false });
    }
  };

  const onApplyQty = (p) => {
    const raw = draftQty[p._id] !== undefined ? draftQty[p._id] : p.stockQty;
    const next = parseQty(raw);
    if (next === parseQty(p.stockQty) && (next > 0) === (p.inStock !== false)) {
      setDraftQty((prev) => {
        const copy = { ...prev };
        delete copy[p._id];
        return copy;
      });
      return;
    }
    applyPatch(p._id, { stockQty: next, inStock: next > 0 });
  };

  const openStockIn = (p) => {
    navigation.navigate("AdminStockIn", p?._id ? { productId: String(p._id) } : undefined);
  };

  if (!user) {
    return (
      <AdminScreenShell style={styles.screen}>
        <View style={[styles.denied, { padding: spacing.lg, paddingTop: insets.top + spacing.md, flex: 1 }]}>
          <Text style={styles.deniedTitle}>Sign in</Text>
          <Text style={styles.deniedSub}>Log in with an admin account to manage inventory.</Text>
          <PremiumButton label="Go to login" variant="primary" onPress={() => navigation.navigate("Login")} style={styles.gateCta} />
        </View>
      </AdminScreenShell>
    );
  }

  if (!user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <View style={[styles.denied, customerScrollFill, { padding: spacing.lg, paddingTop: insets.top + spacing.md }]}>
          <Ionicons name="shield-half-outline" size={44} color={c.primary} />
          <Text style={styles.deniedTitle}>Admins only</Text>
          <Text style={styles.deniedSub}>Sign in with an admin account to manage stock.</Text>
          <PremiumButton label={ADMIN_GATE.backHome} variant="primary" onPress={() => navigateCustomerRoute(navigation, "Home")} style={styles.gateCta} />
        </View>
      </AdminScreenShell>
    );
  }

  return (
    <AdminScreenShell style={styles.screen}>
      <KankregAdminShell
        navigation={navigation}
        route={route}
        title={ADMIN_SCREEN_COPY.inventory.title}
        subtitle={ADMIN_SCREEN_COPY.inventory.subtitle}
        headerRight={
          <AdminButton label="Refresh" icon="refresh-outline" variant="ghost" size="sm" onPress={() => load({ silent: false })} />
        }
      >
      <FlatList
        data={compact ? visible : []}
        keyExtractor={(i) => i._id}
        style={[customerScrollFill, styles.inventoryList]}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing.xl + spacing.lg },
        ]}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <AdminStatGrid min={compact ? 132 : 150}>
              <AdminStatTile
                icon="cube-outline"
                label="Products"
                value={String(stats.total)}
                selected={filter === "all"}
                onPress={() => setFilter("all")}
                style={compact ? styles.tilePhone : undefined}
              />
              <AdminStatTile
                icon="checkmark-circle-outline"
                label="In stock"
                value={String(stats.inStock)}
                tone="green"
                selected={filter === "in_stock"}
                onPress={() => setFilter("in_stock")}
                style={compact ? styles.tilePhone : undefined}
              />
              <AdminStatTile
                icon="alert-circle-outline"
                label="Low"
                value={String(stats.low)}
                tone={stats.low > 0 ? "gold" : "neutral"}
                selected={filter === "low"}
                onPress={() => setFilter("low")}
                style={compact ? styles.tilePhone : undefined}
              />
              <AdminStatTile
                icon="close-circle-outline"
                label="Out"
                value={String(stats.out)}
                tone={stats.out > 0 ? "red" : "neutral"}
                selected={filter === "out"}
                onPress={() => setFilter("out")}
                style={compact ? styles.tilePhone : undefined}
              />
              <AdminStatTile
                icon="cash-outline"
                label="Stock value"
                value={formatRupees(stats.value)}
                style={compact ? styles.tilePhone : undefined}
              />
            </AdminStatGrid>

            {stats.categories.length ? (
              <AdminPanel title="By category" icon="pricetags-outline" meta={`${stats.categories.length}`}>
                {stats.categories.map((row, index) => (
                  <Pressable
                    key={row.name}
                    onPress={() => setSearch(row.name)}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.catRow,
                      compact && styles.catRowStack,
                      index === stats.categories.length - 1 && styles.catRowLast,
                      pressed && styles.catRowPressed,
                    ]}
                  >
                    <Text style={styles.catName} numberOfLines={1}>
                      {row.name}
                    </Text>
                    <Text style={styles.catMeta} numberOfLines={1}>
                      {row.total} · {row.inStock} in · {row.low} low · {row.out} out
                    </Text>
                  </Pressable>
                ))}
              </AdminPanel>
            ) : null}

            {stats.missingPicture > 0 ? (
              <AdminPanel title="Needs a picture" icon="image-outline">
                <Pressable
                  onPress={() => navigation.navigate("AdminProducts")}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.catRow, styles.catRowLast, pressed && styles.catRowPressed]}
                >
                  <Text style={styles.catName}>Needs a picture</Text>
                  <Text style={styles.catMeta}>
                    {stats.missingPicture} in-stock {stats.missingPicture === 1 ? "product has" : "products have"} no photo
                  </Text>
                </Pressable>
              </AdminPanel>
            ) : null}

            <AdminButtonRow style={{ marginBottom: 8 }}>
              <AdminButton label="Stock in" icon="download-outline" variant="primary" size="sm" onPress={() => openStockIn()} />
              <AdminButton label="History" icon="time-outline" variant="soft" size="sm" onPress={() => navigation.navigate("AdminStockHistory")} />
              <AdminButton label="Invoices" icon="document-text-outline" variant="soft" size="sm" onPress={() => navigation.navigate("AdminOrders")} />
            </AdminButtonRow>

            <AdminPanel title="Find stock" icon="search-outline" meta={`${visible.length} of ${products.length}`}>
              <AdminFilterTabs
                value={filter}
                onChange={setFilter}
                items={FILTERS.map((f) => ({ key: f.id, label: f.label }))}
              />
              <AdminInput
                label="Search name or SKU"
                value={search}
                onChangeText={setSearch}
                icon="search-outline"
                autoCapitalize="none"
                placeholder="Ghee, tel, SKU…"
              />
            </AdminPanel>

            {error ? (
              <View style={styles.bannerSpacer}>
                <PremiumErrorBanner severity="error" message={error} onClose={() => setError("")} compact />
              </View>
            ) : null}

            {loading ? (
              <View style={styles.loadRow}>
                <PremiumLoader size="sm" caption="Loading inventory…" inline />
              </View>
            ) : null}
            {!compact && visible.length > 0 ? (
              <AdminPanel
                noPadding
                title="Adjust qty"
                icon="layers-outline"
                description="Plus or minus updates stock immediately."
                style={{ marginBottom: spacing.md }}
              >
                <AdminDataTable
                  rows={visible}
                  keyExtractor={(row) => row._id}
                  columns={buildInventoryTableColumns({
                    onDelta,
                    onApplyQty,
                    onToggle,
                    onStockIn: openStockIn,
                    onDraft: (row, t) => setDraftQty((o) => ({ ...o, [row._id]: t })),
                    draftQty,
                    busyId,
                    stockPill,
                  })}
                />
              </AdminPanel>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !loading && (compact || visible.length === 0) ? (
            <View style={styles.emptyWrap}>
              <PremiumEmptyState
                iconName="file-tray-outline"
                title={products.length === 0 ? ADMIN_SCREEN_COPY.inventory.empty : ADMIN_SCREEN_COPY.inventory.emptySearch}
                ctaLabel={products.length === 0 ? "Add product" : undefined}
                ctaIconLeft={products.length === 0 ? "add-outline" : undefined}
                onCtaPress={products.length === 0 ? () => navigation.navigate("AdminAddProduct") : undefined}
                compact
              />
            </View>
          ) : null
        }
        renderItem={({ item: p, index: rowIndex }) => {
          const s = stockState(p);
          const busy = busyId === p._id;
          const pill = stockPill(p);
          const dval =
            draftQty[p._id] !== undefined
              ? draftQty[p._id]
              : String(Math.max(0, Number(p.stockQty) || 0));
          return (
            <SectionReveal delay={staggerDelay(Math.min(rowIndex, 10))} preset="fade-up">
            <View
              style={[
                styles.rowCard,
                { borderColor: chrome.line, backgroundColor: chrome.card },
                s.out ? styles.rowWarn : null,
              ]}
            >
              <View style={styles.rowTop}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AdminProductCell name={p.name} imageUri={productCoverUri(p)} />
                  <Text style={styles.pSku}>
                    {p.sku ? `SKU: ${p.sku}` : "No SKU"} · {categoryName(p)} · {unitLabel(p)}
                  </Text>
                </View>
                <AdminBadge label={pill.label} tone={pill.tone} size="sm" />
              </View>

              <View style={styles.qtyRow}>
                <AdminQtyStepper
                  value={dval}
                  busy={busy}
                  onMinus={() => onDelta(p, -1)}
                  onPlus={() => onDelta(p, 1)}
                  onChange={(t) => setDraftQty((o) => ({ ...o, [p._id]: t }))}
                  onCommit={() => onApplyQty(p)}
                />

                <View style={styles.switchBlock}>
                  <Text style={styles.switchLab}>On/Off</Text>
                  <AdminSwitch
                    value={p.inStock !== false}
                    disabled={busy}
                    accessibilityLabel="On/Off"
                    onChange={(v) => onToggle(p, v)}
                  />
                </View>
              </View>
              <AdminButtonRow>
                <AdminButton label="In" icon="download-outline" variant="gold" size="xs" onPress={() => openStockIn(p)} />
                <AdminButton label="Out" icon="remove-outline" variant="soft" size="xs" onPress={() => onDelta(p, -1)} disabled={busy || s.q < 1} />
              </AdminButtonRow>
            </View>
            </SectionReveal>
          );
        }}
        ListFooterComponent={
          products.length > 0 ? (
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
                  <Text style={[styles.footCtaT, { color: c.textPrimary }]}>Add product</Text>
                  <Text style={[styles.footCtaD, { color: c.textSecondary }]}>Set initial stock in the form.</Text>
                </View>
              </View>
            </PremiumCard>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
      </KankregAdminShell>
    </AdminScreenShell>
  );
}

function createStyles(c, shadowPremium, isDark) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      width: "100%",
      alignSelf: "center",
      maxWidth: "100%"},
    listContent: {
      paddingHorizontal: Platform.select({ web: spacing.xl, default: spacing.lg })},
    headerBlock: { marginBottom: spacing.sm, gap: spacing.sm },
    tilePhone: { flexBasis: "47%", flexGrow: 1, maxWidth: "48%" },
    catRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    catRowStack: { flexDirection: "column", alignItems: "flex-start", gap: 2 },
    catRowLast: { borderBottomWidth: 0, paddingBottom: 2 },
    catRowPressed: { opacity: 0.72 },
    catName: { flex: 1, minWidth: 0, fontFamily: fonts.semibold, color: c.textPrimary, fontSize: typography.bodySmall },
    catMeta: { flexShrink: 0, fontFamily: fonts.medium, color: c.textMuted, fontSize: typography.caption },
    topHead: { marginBottom: spacing.xs },
    titleBlock: { marginBottom: spacing.md },
    titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
    h1: {
      fontSize: typography.h1,
      fontFamily: ADMIN_FONT.semibold,
      fontWeight: "600",
      color: c.textPrimary,
      letterSpacing: -0.4},
    subH: {
      marginTop: 6,
      color: c.textSecondary,
      fontSize: typography.bodySmall,
      fontFamily: fonts.regular,
      lineHeight: 20},
    inventoryList: { flex: 1, width: "100%" },
    statsScrollContent: { flexDirection: "row", gap: spacing.sm, paddingBottom: spacing.xs },
    statsRowScroll: { flexWrap: "nowrap" },
    statPillScroll: { flex: 0, minWidth: 120 },
    statsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginBottom: spacing.md},
    statPill: {
      minWidth: 100,
      flex: 1,
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.sm,
      alignItems: "center",
      gap: 4},
    statVal: { fontFamily: fonts.extrabold, color: c.primary, fontSize: typography.h2 },
    statLab: { fontSize: 10, fontFamily: fonts.bold, color: c.textMuted, textTransform: "uppercase" },
    bannerSpacer: { marginBottom: spacing.sm },
    filterShell: { marginBottom: spacing.md },
    sectionKicker: {
      fontSize: 10,
      fontFamily: fonts.extrabold,
      letterSpacing: 1,
      marginBottom: spacing.sm},
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.md },
    searchRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
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
          boxShadow: isDark
            ? "0 10px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.06)"
            : "0 10px 24px rgba(28, 25, 23, 0.08), inset 0 1px 0 rgba(255,255,255,0.72)",
          transition: "box-shadow 0.18s ease, border-color 0.18s ease, transform 0.18s ease"},
        default: {}})},
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
      fontSize: typography.body},
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
    deniedTitle: { fontSize: typography.h2, fontFamily: ADMIN_FONT.semibold, fontWeight: "600", color: c.textPrimary, marginTop: spacing.md },
    deniedSub: { color: c.textSecondary, textAlign: "center", paddingHorizontal: spacing.xl, fontFamily: fonts.regular },
    gateCta: { marginTop: spacing.md }});
}
