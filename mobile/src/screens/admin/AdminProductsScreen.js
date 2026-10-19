import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import { Alert, Platform, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { deleteAdminProduct, fetchAdminProducts } from "../../services/adminService";
import { adminGatePanel, adminShellContent, adminToolbarPrimary, adminToolbarRow, useAdminCompactLayout } from "../../theme/adminLayout";
import AdminPanel from "../../components/admin/AdminPanel";
import AdminToolbar, { AdminToolbarSlot } from "../../components/admin/AdminToolbar";
import AdminKpiCard, { AdminKpiGrid } from "../../components/admin/AdminKpiCard";
import AdminDataTable from "../../components/admin/AdminDataTable";
import AdminFilterTabs from "../../components/admin/AdminFilterTabs";
import AdminStatusPill from "../../components/admin/AdminStatusPill";
import { buildProductTableColumns } from "../../components/admin/adminTableColumns";
import {
  PRODUCT_FILTER_TABS,
  catalogSummary,
  matchesProductFilter,
  productCoverUri,
  productStockMeta,
} from "../../utils/adminProductHelpers";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, layout, radius, spacing, typography } from "../../theme/tokens";
import { formatINR } from "../../utils/currency";
import PremiumInput from "../../components/ui/PremiumInput";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumCard from "../../components/ui/PremiumCard";
import PremiumChip from "../../components/ui/PremiumChip";
import SectionReveal from "../../components/motion/SectionReveal";
import SkeletonBlock from "../../components/ui/SkeletonBlock";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

export default function AdminProductsScreen({ navigation, route }) {
  const { colors: c, shadowPremium } = useTheme();
  const compact = useAdminCompactLayout();
  const styles = useMemo(() => createAdminProductsStyles(c, shadowPremium), [c, shadowPremium]);
  const { user, token } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [renderCount, setRenderCount] = useState(40);

  const openProduct = useCallback(
    (product) => navigation.navigate("AdminAddProduct", { product }),
    [navigation]
  );

  const loadProducts = useCallback(async () => {
    try {
      setError("");
      const response = await fetchAdminProducts(token);
      setProducts(response);
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

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((item) => {
      if (!matchesProductFilter(item, filter)) return false;
      if (!q) return true;
      return [item.name, item.category, item.sku, item.brand, item.homeSection]
        .map((v) => String(v || "").toLowerCase())
        .some((v) => v.includes(q));
    });
  }, [products, search, filter]);

  const stats = useMemo(() => catalogSummary(products), [products]);
  const tabCounts = useMemo(() => {
    const counts = { all: products.length };
    for (const tab of PRODUCT_FILTER_TABS) {
      if (tab.key === "all") continue;
      counts[tab.key] = products.filter((p) => matchesProductFilter(p, tab.key)).length;
    }
    return counts;
  }, [products]);
  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, renderCount),
    [filteredProducts, renderCount]
  );

  useEffect(() => {
    setRenderCount(40);
  }, [search, filter]);

  const handleDelete = (id, name) => {
    Alert.alert("Delete product", `Remove "${name || "this product"}" from the catalog?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setError("");
            await deleteAdminProduct(token, id);
            await loadProducts();
          } catch (err) {
            setError(err.message || "Unable to delete product.");
          }
        },
      },
    ]);
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
          title={ADMIN_SCREEN_COPY.products.title}
          subtitle={ADMIN_SCREEN_COPY.products.subtitle}
          headerRight={
            <View style={styles.headerActions}>
              <PremiumButton
                label="Refresh"
                variant="ghost"
                size="sm"
                iconLeft="refresh-outline"
                onPress={loadProducts}
              />
              <PremiumButton
                label="Add product"
                variant="primary"
                size="sm"
                iconLeft="add-outline"
                onPress={() => navigation.navigate("AdminAddProduct")}
              />
            </View>
          }
        >
          <View style={styles.panel}>
            {error ? (
              <View style={styles.bannerSpacer}>
                <PremiumErrorBanner severity="error" message={error} onClose={() => setError("")} compact />
              </View>
            ) : null}

            <SectionReveal preset="fade-up" delay={0}>
              <AdminPanel
                title="Catalog pulse"
                icon="cube-outline"
                meta="Tap to filter"
                description="Published, low stock, and draft SKUs at a glance."
              >
                <AdminKpiGrid compact={compact}>
                  <AdminKpiCard label="Total SKUs" value={String(stats.total)} onPress={() => setFilter("all")} />
                  <AdminKpiCard
                    label="Published"
                    value={String(stats.inStock)}
                    onPress={() => setFilter("published")}
                  />
                  <AdminKpiCard
                    label="Low stock"
                    value={String(stats.low)}
                    tone={stats.low > 0 ? "warn" : "default"}
                    onPress={() => setFilter("low")}
                  />
                  <AdminKpiCard
                    label="Out / draft"
                    value={String(stats.out + stats.draft)}
                    tone={stats.out + stats.draft > 0 ? "hot" : "default"}
                    onPress={() => setFilter("out")}
                  />
                </AdminKpiGrid>
              </AdminPanel>

              <AdminPanel
                title="Find products"
                icon="search-outline"
                meta={`${filteredProducts.length} of ${products.length}`}
                description="Filter tabs + search — open a row to edit pricing and media."
              >
                <AdminFilterTabs
                  style={styles.filterTabs}
                  value={filter}
                  onChange={setFilter}
                  items={PRODUCT_FILTER_TABS.map((tab) => ({
                    key: tab.key,
                    label: `${tab.label} · ${tabCounts[tab.key] ?? 0}`,
                  }))}
                />

                <AdminToolbar>
                  <AdminToolbarSlot flex>
                    <PremiumInput
                      label="Search catalog"
                      value={search}
                      onChangeText={setSearch}
                      placeholder="Name, SKU, brand, category"
                      iconLeft="search-outline"
                      iconRight={search ? "close-circle" : undefined}
                      onIconRightPress={search ? () => setSearch("") : undefined}
                      autoCapitalize="none"
                    />
                  </AdminToolbarSlot>
                  <PremiumButton
                    label="Stock desk"
                    variant="ghost"
                    size="sm"
                    iconLeft="layers-outline"
                    onPress={() => navigation.navigate("AdminInventory")}
                  />
                </AdminToolbar>
              </AdminPanel>
            </SectionReveal>

            <View style={styles.listContent}>
              {bootLoading
                ? [0, 1, 2].map((i) => (
                    <SkeletonBlock key={i} width="100%" height={96} rounded="lg" style={styles.productCard} />
                  ))
                : null}

              {!bootLoading && filteredProducts.length > 0 && !compact ? (
                <AdminPanel noPadding style={styles.tablePanel} title="Catalog" meta="Click a row to edit">
                  <AdminDataTable
                    rows={visibleProducts}
                    keyExtractor={(row) => row._id}
                    onRowPress={openProduct}
                    columns={buildProductTableColumns({ onEdit: openProduct, rowPressable: true })}
                  />
                </AdminPanel>
              ) : null}

              {!bootLoading && filteredProducts.length === 0 ? (
                <PremiumEmptyState
                  iconName="cube-outline"
                  title={search.trim() || filter !== "all" ? "No matching products" : "No products yet"}
                  description={
                    search.trim() || filter !== "all"
                      ? "Try another filter or clear your search."
                      : "Add your first product to open the shop."
                  }
                  ctaLabel={search.trim() || filter !== "all" ? undefined : "Add product"}
                  ctaIconLeft="add-outline"
                  onCtaPress={
                    search.trim() || filter !== "all" ? undefined : () => navigation.navigate("AdminAddProduct")
                  }
                  compact
                />
              ) : null}

              {!bootLoading && compact
                ? visibleProducts.map((item, idx) => {
                    const meta = productStockMeta(item);
                    const uri = productCoverUri(item);
                    return (
                      <SectionReveal key={item._id} preset="fade-up" delay={Math.min(idx * 24, 120)}>
                        <PremiumCard padding="md" variant="elevated" style={styles.productCard}>
                          <View style={styles.cardTop}>
                            {uri ? (
                              <Image source={{ uri }} style={styles.thumb} contentFit="cover" transition={120} />
                            ) : (
                              <View style={[styles.thumb, styles.thumbPlaceholder, { borderColor: c.border }]}>
                                <Text style={[styles.thumbGlyph, { color: c.textMuted }]}>∷</Text>
                              </View>
                            )}
                            <View style={styles.cardHead}>
                              <View style={styles.cardTitleRow}>
                                <Text style={[styles.cardTitle, { color: c.textPrimary }]} numberOfLines={2}>
                                  {item.name}
                                </Text>
                                <AdminStatusPill label={meta.label} tone={meta.pill} />
                              </View>
                              <Text style={[styles.cardPrice, { color: c.primary }]}>{formatINR(item.price)}</Text>
                              <Text style={[styles.cardMeta, { color: c.textSecondary }]} numberOfLines={1}>
                                {item.category || "Uncategorized"}
                                {item.sku ? ` · ${item.sku}` : ""}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.cardActions}>
                            <PremiumButton label="Edit" variant="primary" size="sm" onPress={() => openProduct(item)} />
                            <PremiumButton
                              label="Delete"
                              variant="danger"
                              size="sm"
                              onPress={() => handleDelete(item._id, item.name)}
                            />
                          </View>
                        </PremiumCard>
                      </SectionReveal>
                    );
                  })
                : null}

              {!bootLoading && visibleProducts.length < filteredProducts.length ? (
                <PremiumButton
                  label={`Load more (${filteredProducts.length - visibleProducts.length} remaining)`}
                  variant="ghost"
                  size="sm"
                  onPress={() => setRenderCount((prev) => prev + 40)}
                  fullWidth
                />
              ) : null}
            </View>
          </View>
        </KankregAdminShell>
      </KankregScrollPage>
    </AdminScreenShell>
  );
}

function createAdminProductsStyles(c, shadowPremium) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      width: "100%",
      alignSelf: "center",
      maxWidth: "100%",
    },
    panel: adminShellContent(),
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    bannerSpacer: { marginBottom: spacing.sm },
    filterTabs: { marginVertical: spacing.sm },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
    actionsRow: { ...adminToolbarRow, marginBottom: spacing.sm },
    searchInputWrap: { ...adminToolbarPrimary },
    listCount: {
      fontSize: typography.caption,
      color: c.textMuted,
      fontFamily: fonts.semibold,
      marginBottom: spacing.sm,
    },
    listContent: { gap: spacing.sm, paddingBottom: spacing.xl },
    tablePanel: { marginBottom: spacing.md, paddingHorizontal: 0, paddingBottom: 4 },
    productCard: {
      width: "100%",
      ...Platform.select({ web: shadowPremium, default: {} }),
    },
    cardTop: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
    thumb: { width: 64, height: 64, borderRadius: radius.lg, backgroundColor: c.surfaceMuted },
    thumbPlaceholder: { alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth },
    thumbGlyph: { fontSize: 20 },
    cardHead: { flex: 1, minWidth: 0 },
    cardTitleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
    cardTitle: { fontWeight: "700", flex: 1, minWidth: 0, fontSize: typography.body, fontFamily: fonts.semibold },
    cardPrice: { marginTop: spacing.xs, fontSize: typography.bodySmall, fontWeight: "700", fontFamily: fonts.bold },
    cardMeta: { marginTop: 4, fontSize: typography.caption, fontFamily: fonts.regular },
    cardActions: { marginTop: spacing.md, flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  });
}
