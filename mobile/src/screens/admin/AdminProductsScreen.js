import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { deleteAdminProduct, fetchAdminProducts } from "../../services/adminService";
import { adminGatePanel, adminShellContent, useAdminCompactLayout } from "../../theme/adminLayout";
import AdminBadge from "../../components/admin/AdminBadge";
import AdminButton from "../../components/admin/AdminButton";
import AdminDataTable from "../../components/admin/AdminDataTable";
import AdminInput from "../../components/admin/AdminInput";
import AdminPanel from "../../components/admin/AdminPanel";
import AdminStatTile, { AdminStatGrid } from "../../components/admin/AdminStatTile";
import { useAdminConfirm } from "../../components/admin/AdminDialog";
import { buildProductTableColumns } from "../../components/admin/adminTableColumns";
import {
  catalogSummary,
  matchesProductFilter,
  productCoverUri,
  productStockMeta,
} from "../../utils/adminProductHelpers";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, radius, spacing, typography } from "../../theme/tokens";
import { formatRupees } from "../../utils/adminFormat";
import { exportProductsCsv } from "../../utils/adminExports";
import { useToast } from "../../context/ToastContext";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import SectionReveal from "../../components/motion/SectionReveal";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

const COPY = ADMIN_SCREEN_COPY.products;

const TILES = [
  { key: "all", label: "All", icon: "cube-outline", tone: "neutral" },
  { key: "published", label: "Published", icon: "checkmark-circle-outline", tone: "green" },
  { key: "draft", label: "Draft", icon: "document-outline", tone: "gold" },
  { key: "soon", label: "Coming soon", icon: "time-outline", tone: "purple" },
  { key: "low", label: "Low stock", icon: "alert-circle-outline", tone: "gold" },
  { key: "out", label: "Out of stock", icon: "close-circle-outline", tone: "red" },
  { key: "floor", label: "Floor", icon: "storefront-outline", tone: "gold" },
];

function matchesSearch(item, q) {
  if (!q) return true;
  return [item.name, item.sku].some((v) => String(v || "").toLowerCase().includes(q));
}

export default function AdminProductsScreen({ navigation, route }) {
  const { colors: c, shadowPremium } = useTheme();
  const compact = useAdminCompactLayout();
  const styles = useMemo(() => createStyles(c, shadowPremium), [c, shadowPremium]);
  const { user, token } = useAuth();
  const { confirm, dialog } = useAdminConfirm();
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);

  const openProduct = useCallback(
    (product) => navigation.navigate("AdminAddProduct", { product }),
    [navigation]
  );
  const openEmpty = useCallback(() => navigation.navigate("AdminAddProduct", { product: null }), [navigation]);

  const loadProducts = useCallback(async () => {
    try {
      setError("");
      setProducts(await fetchAdminProducts(token));
    } catch (err) {
      setError(err.message || "Failed to load products.");
    } finally {
      setBootLoading(false);
    }
  }, [token]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadProducts();
    } finally {
      setRefreshing(false);
    }
  }, [loadProducts]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadProducts();
  }, [user, loadProducts]);

  const stats = useMemo(() => catalogSummary(products), [products]);
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = products.filter((item) => matchesProductFilter(item, filter) && matchesSearch(item, q));
    if (filter !== "floor") return rows;
    return [...rows].sort((a, b) => (Number(b.stockCounter) || 0) - (Number(a.stockCounter) || 0));
  }, [products, search, filter]);

  const handleDelete = async (item) => {
    const name = String(item?.name || "this jar").trim() || "this jar";
    const ok = await confirm({ title: `Delete ${name}?`, tone: "danger", confirmLabel: "Delete" });
    if (!ok) return;
    try {
      setError("");
      await deleteAdminProduct(token, item._id);
      await loadProducts();
    } catch (err) {
      setError(err.message || "Unable to delete product.");
    }
  };

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.gatePanel}>
              <PremiumErrorBanner severity="warning" title={ADMIN_GATE.title} message={ADMIN_GATE.message} />
              <AdminButton
                label={ADMIN_GATE.backHome}
                icon="home-outline"
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

  const emptyCatalogue = !bootLoading && products.length === 0;
  const emptySearch = !bootLoading && products.length > 0 && filteredProducts.length === 0;
  const countLabel = `${filteredProducts.length} of ${products.length}`;

  return (
    <AdminScreenShell style={styles.screen}>
      <KankregScrollPage
        scrollVariant="admin"
        showFooter={false}
        style={customerScrollFill}
        refreshControl={
          Platform.OS === "web" ? undefined : (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />
          )
        }
      >
        <KankregAdminShell
          navigation={navigation}
          route={route}
          title={COPY.title}
          subtitle={COPY.subtitle}
          headerRight={
            <View style={styles.headerActions}>
              <AdminButton
                label="Export CSV"
                variant="ghost"
                icon="download-outline"
                disabled={!products.length}
                onPress={() =>
                  exportProductsCsv(filteredProducts)
                    .then(() => toast.toastSuccess(`Exported ${filteredProducts.length} products.`))
                    .catch((err) => toast.toastError(err?.message || "Couldn't export products."))
                }
              />
              <AdminButton label="Add product" variant="primary" icon="add-outline" onPress={openEmpty} />
            </View>
          }
        >
          <View style={styles.panel}>
            {error ? (
              <View style={styles.bannerSpacer}>
                <PremiumErrorBanner severity="error" message={error} onClose={() => setError("")} compact />
              </View>
            ) : null}

            <AdminStatGrid min={compact ? 132 : 150}>
              {TILES.map((tile) => {
                const value = tile.key === "all" ? stats.total : stats[tile.key] ?? 0;
                return (
                  <AdminStatTile
                    key={tile.key}
                    icon={tile.icon}
                    label={tile.label}
                    value={String(value)}
                    tone={value > 0 ? tile.tone : "neutral"}
                    selected={filter === tile.key}
                    onPress={() => setFilter(tile.key)}
                    style={compact ? styles.tilePhone : undefined}
                  />
                );
              })}
            </AdminStatGrid>

            <AdminInput
              label="Search"
              value={search}
              onChangeText={setSearch}
              placeholder="Name or SKU"
              icon="search-outline"
            />
            <Text style={styles.count}>{countLabel}</Text>

            {bootLoading ? <Text style={styles.count}>Loading…</Text> : null}

            {emptyCatalogue ? (
              <PremiumEmptyState
                iconName="cube-outline"
                title={COPY.empty}
                ctaLabel="Add product"
                ctaIconLeft="add-outline"
                onCtaPress={openEmpty}
                compact
              />
            ) : null}

            {emptySearch ? (
              <PremiumEmptyState iconName="search-outline" title={COPY.emptySearch} compact />
            ) : null}

            {!bootLoading && filteredProducts.length > 0 && !compact ? (
              <AdminPanel noPadding style={styles.tablePanel} title="Products" meta={countLabel}>
                <AdminDataTable
                  rows={filteredProducts}
                  keyExtractor={(row) => row._id}
                  onRowPress={openProduct}
                  columns={buildProductTableColumns({ onEdit: openProduct, rowPressable: true })}
                />
              </AdminPanel>
            ) : null}

            {!bootLoading && compact
              ? filteredProducts.map((item) => {
                  const meta = productStockMeta(item);
                  const uri = productCoverUri(item);
                  return (
                    <Pressable
                      key={item._id}
                      onPress={() => openProduct(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`Edit ${item.name || "product"}`}
                      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                    >
                      <View style={styles.cardTop}>
                        {uri ? (
                          <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
                        ) : (
                          <View style={[styles.thumb, styles.thumbPlaceholder]}>
                            <Text style={styles.thumbGlyph}>∷</Text>
                          </View>
                        )}
                        <View style={styles.cardHead}>
                          <View style={styles.cardTitleRow}>
                            <Text style={styles.cardTitle} numberOfLines={2}>
                              {item.name}
                            </Text>
                            <AdminBadge label={meta.label} tone={meta.badge || "neutral"} size="sm" />
                          </View>
                          <Text style={styles.cardPrice}>{formatRupees(item.price)}</Text>
                          <Text style={styles.cardMeta} numberOfLines={2}>
                            {[item.sku || "No SKU", item.category || "General", item.unit || "1 pc"].join(" · ")}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.cardActions}>
                        <AdminButton label="Delete" variant="danger" size="sm" onPress={() => handleDelete(item)} />
                      </View>
                    </Pressable>
                  );
                })
              : null}
          </View>
        </KankregAdminShell>
      </KankregScrollPage>
      {dialog}
    </AdminScreenShell>
  );
}

function createStyles(c, shadowPremium) {
  return StyleSheet.create({
    headerActions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
    screen: { flex: 1, width: "100%", alignSelf: "center", maxWidth: "100%" },
    panel: { ...adminShellContent(), gap: spacing.sm, paddingBottom: spacing.xl },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    bannerSpacer: { marginBottom: spacing.xs },
    tilePhone: Platform.OS === "web" ? {} : { flexBasis: "47%", flexGrow: 1, maxWidth: "48%" },
    count: {
      fontSize: typography.caption,
      color: c.textMuted,
      fontFamily: fonts.semibold,
    },
    tablePanel: { marginTop: spacing.xs, paddingHorizontal: 0, paddingBottom: 4 },
    card: {
      width: "100%",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      backgroundColor: c.surface,
      ...Platform.select({ web: shadowPremium, default: {} }),
    },
    cardPressed: { opacity: 0.92 },
    cardTop: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
    thumb: { width: 64, height: 64, borderRadius: radius.lg, backgroundColor: c.surfaceMuted },
    thumbPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    thumbGlyph: { fontSize: 20, color: c.textMuted },
    cardHead: { flex: 1, minWidth: 0 },
    cardTitleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
    cardTitle: { fontWeight: "700", flex: 1, minWidth: 0, fontSize: typography.body, fontFamily: fonts.semibold, color: c.textPrimary },
    cardPrice: { marginTop: spacing.xs, fontSize: typography.bodySmall, fontWeight: "700", fontFamily: fonts.bold, color: c.primary },
    cardMeta: { marginTop: 4, fontSize: typography.caption, fontFamily: fonts.regular, color: c.textSecondary },
    cardActions: { marginTop: spacing.sm, flexDirection: "row", justifyContent: "flex-end" },
  });
}
