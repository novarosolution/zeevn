import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, RefreshControl, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { useAuth } from "../../context/AuthContext";
import OpsAdminScreen from "../../components/ops/OpsAdminScreen";
import OpsDataTable from "../../components/ops/OpsDataTable";
import OpsListSkeleton from "../../components/ops/OpsListSkeleton";
import OpsStatCard from "../../components/ops/OpsStatCard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { deleteAdminProduct, fetchAdminProducts } from "../../services/adminService";
import { adminPanel } from "../../theme/adminLayout";
import { getSemanticColors, layout, radius, spacing, typography, fonts } from "../../theme/tokens";
import { formatINR } from "../../utils/currency";
import Input from "../../components/ui/Input";
import ErrorBanner from "../../components/ui/ErrorBanner";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Chip from "../../components/ui/Chip";
import Badge from "../../components/ui/Badge";

const LOW_STOCK_MAX = 5;

function productStockChip(p) {
  const q = Math.max(0, Number(p.stockQty) || 0);
  if (p.inStock === false || q < 1) {
    return { label: "Out", tone: "red" };
  }
  if (q <= LOW_STOCK_MAX) {
    return { label: "Low", tone: "gold" };
  }
  return { label: "In stock", tone: "green" };
}

function catalogSummary(products) {
  let inStock = 0;
  let low = 0;
  let out = 0;
  for (const p of products) {
    const chip = productStockChip(p);
    if (chip.tone === "red") out += 1;
    else if (chip.tone === "gold") low += 1;
    else inStock += 1;
  }
  return { total: products.length, inStock, low, out };
}

function coverUri(p) {
  const imgs = Array.isArray(p.images) ? p.images : [];
  const first = imgs.find((u) => String(u || "").trim());
  if (first) return String(first).trim();
  if (p.image && String(p.image).trim()) return String(p.image).trim();
  return "";
}

export default function AdminProductsScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const useTable = Platform.OS === "web" && width >= 768;
  const { colors: c, shadowPremium, isDark, semanticPalette, SPACING } = useTheme();
  const semantic = useMemo(() => getSemanticColors(c), [c]);
  const styles = useMemo(
    () => createAdminProductsStyles(c, shadowPremium, isDark, semantic),
    [c, shadowPremium, isDark, semantic]
  );
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [renderCount, setRenderCount] = useState(40);
  const [productsLoading, setProductsLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      setError("");
      const response = await fetchAdminProducts(token);
      setProducts(response);
    } catch (err) {
      setError(err.message || "Failed to load products.");
    } finally {
      setProductsLoading(false);
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
    if (!user) {
      return;
    }
    if (!user.isAdmin) return;
    loadProducts();
  }, [user, loadProducts]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const searchText = search.toLowerCase();
    return products.filter((item) =>
      [item.name, item.category, item.homeSection, item.productType, item.showOnHome ? "show" : "hide"]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(searchText))
    );
  }, [products, search]);

  const stats = useMemo(() => catalogSummary(products), [products]);

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, renderCount),
    [filteredProducts, renderCount]
  );

  useEffect(() => {
    setRenderCount(40);
  }, [search]);

  const handleDelete = async (id) => {
    try {
      setError("");
      await deleteAdminProduct(token, id);
      await loadProducts();
    } catch (err) {
      setError(err.message || "Unable to delete product.");
    }
  };

  const productColumns = useMemo(
    () => [
      {
        key: "name",
        label: "Product",
        flex: 1.4,
        sortable: true,
        sortValue: (row) => row.name || "",
        render: (row) => (
          <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: semanticPalette.ink }} numberOfLines={2}>
            {row.name}
          </Text>
        ),
      },
      {
        key: "price",
        label: "Price",
        flex: 0.7,
        sortable: true,
        sortValue: (row) => Number(row.price || 0),
        render: (row) => (
          <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: semanticPalette.ink }}>
            {formatINR(row.price)}
          </Text>
        ),
      },
      {
        key: "stock",
        label: "Qty",
        flex: 0.5,
        sortable: true,
        sortValue: (row) => Number(row.stockQty || 0),
        render: (row) => (
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: semanticPalette.inkSoft }}>
            {Math.max(0, Number(row.stockQty) || 0)}
          </Text>
        ),
      },
      {
        key: "status",
        label: "Stock",
        flex: 0.7,
        render: (row) => {
          const chip = productStockChip(row);
          return (
            <Badge variant={chip.tone === "red" ? "sale" : chip.tone === "gold" ? "brass" : "success"} size="sm">
              {chip.label}
            </Badge>
          );
        },
      },
      {
        key: "actions",
        label: "",
        flex: 1,
        minWidth: 140,
        render: (row) => (
          <View style={{ flexDirection: "row", gap: 6 }}>
            <Button
              label="Edit"
              variant="secondary"
              size="sm"
              onPress={() => navigation.navigate("AdminAddProduct", { product: row })}
            />
            <Button label="Delete" variant="destructive" size="sm" onPress={() => handleDelete(row._id)} />
          </View>
        ),
      },
    ],
    [navigation, semanticPalette.ink, semanticPalette.inkSoft]
  );

  return (
    <OpsAdminScreen navigation={navigation} activeRoute="AdminProducts" sectionTitle="Manage products">
          {error ? (
            <View style={styles.bannerSpacer}>
              <ErrorBanner severity="error" message={error} onClose={() => setError("")} compact />
            </View>
          ) : null}

          <View style={[styles.summaryGrid, { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.md }]}>
            <OpsStatCard label="Total SKUs" value={String(stats.total)} style={{ flex: 1, minWidth: 120 }} />
            <OpsStatCard label="Healthy" value={String(stats.inStock)} style={{ flex: 1, minWidth: 120 }} />
            <OpsStatCard label="Low stock" value={String(stats.low)} style={{ flex: 1, minWidth: 120 }} />
            <OpsStatCard label="Out" value={String(stats.out)} style={{ flex: 1, minWidth: 120 }} />
          </View>
          
          <View style={styles.actionsRow}>
            <View style={styles.searchInputWrap}>
              <Input
                label="Search catalog"
                value={search}
                onChangeText={setSearch}
                iconLeft="search-outline"
                iconRight={search ? "close-circle" : undefined}
                onIconRightPress={search ? () => setSearch("") : undefined}
                autoCapitalize="none"
              />
            </View>
            <Button label="Refresh" variant="secondary" size="md" onPress={loadProducts} />
          </View>

          <View style={styles.ctaRow}>
            <Button
              label="Inventory & stock"
              variant="secondary"
              iconLeft="layers-outline"
              onPress={() => navigation.navigate("AdminInventory")}
              style={styles.ctaFlex}
            />
            <Button
              label="Add product"
              variant="primary"
              iconLeft="add"
              onPress={() => navigation.navigate("AdminAddProduct")}
              style={styles.ctaFlex}
            />
          </View>

          <View style={styles.listContent}>
            {productsLoading && products.length === 0 ? <OpsListSkeleton rows={5} /> : null}
            {useTable && !productsLoading && visibleProducts.length > 0 ? (
              <OpsDataTable
                columns={productColumns}
                data={visibleProducts}
                keyExtractor={(row) => row._id}
                pageSize={20}
                emptyMessage="No products to show."
              />
            ) : null}
            {!productsLoading && filteredProducts.length === 0 ? (
              <EmptyState
                iconName="cube-outline"
                title={search.trim() ? "No matching products" : "No products in catalog"}
                description={search.trim() ? "Try another search term." : "Add a product to get started."}
                ctaLabel={search.trim() ? undefined : "Add product"}
                ctaIconLeft="add-outline"
                onCtaPress={search.trim() ? undefined : () => navigation.navigate("AdminAddProduct")}
                compact
              />
            ) : null}
            {!productsLoading && !useTable &&
            visibleProducts.map((item, idx) => {
              const chip = productStockChip(item);
              const uri = coverUri(item);
              const photoCount = (item.images || []).length || (item.image ? 1 : 0);
              return (
                <Card key={item._id} padding="md" variant="elevated" style={styles.productCard}>
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
                          <Chip label={chip.label} tone={chip.tone} size="sm" />
                        </View>
                        <Text style={[styles.cardPrice, { color: semanticPalette.ink }]}>{formatINR(item.price)}</Text>
                      </View>
                    </View>

                    <View style={styles.metaGrid}>
                      <Text style={[styles.metaCell, { color: c.textSecondary }]} numberOfLines={1}>
                        Section · {item.homeSection || "—"}
                      </Text>
                      <Text style={[styles.metaCell, { color: c.textSecondary }]} numberOfLines={1}>
                        Type · {item.productType || item.category || "—"}
                      </Text>
                      <Text style={[styles.metaCell, { color: c.textSecondary }]} numberOfLines={1}>
                        Home · {item.showOnHome === false ? "Hidden" : "Visible"}
                      </Text>
                      <Text style={[styles.metaCell, { color: c.textSecondary }]} numberOfLines={1}>
                        Sort · {Number.isFinite(Number(item.homeOrder)) ? Number(item.homeOrder) : 0}
                      </Text>
                      <Text style={[styles.metaCell, { color: c.textSecondary }]} numberOfLines={1}>
                        Qty · {Math.max(0, Number(item.stockQty) || 0)}
                      </Text>
                      <Text style={[styles.metaCell, { color: c.textSecondary }]} numberOfLines={1}>
                        Photos · {photoCount}
                      </Text>
                    </View>
                    {item.brand || item.sku ? (
                      <Text style={[styles.brandSku, { color: c.textMuted }]} numberOfLines={1}>
                        {[item.brand, item.sku].filter(Boolean).join(" · ")}
                      </Text>
                    ) : null}

                    <View style={styles.cardActions}>
                      <Button
                        label="Edit"
                        variant="secondary"
                        size="sm"
                        onPress={() => navigation.navigate("AdminAddProduct", { product: item })}
                      />
                      <Button label="Delete" variant="destructive" size="sm" onPress={() => handleDelete(item._id)} />
                    </View>
                  </Card>
                              );
            })}
            {visibleProducts.length < filteredProducts.length && !useTable ? (
              <Button
                label={`Load more (${filteredProducts.length - visibleProducts.length} remaining)`}
                variant="subtle"
                size="md"
                onPress={() => setRenderCount((prev) => prev + 40)}
                fullWidth
              />
            ) : null}
          </View>
          </OpsAdminScreen>
  );
}

function createAdminProductsStyles(c, shadowPremium, isDark, semantic) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      width: "100%",
      alignSelf: "center",
      maxWidth: Platform.select({ web: layout.maxContentWidth + 96, default: "100%" }),
    },
    panel: {
      ...adminPanel(c, shadowPremium),
    },
    gateCta: {
      marginTop: spacing.md,
      alignSelf: "flex-start",
    },
    bannerSpacer: {
      marginBottom: spacing.sm,
    },
    summaryCard: {
      marginBottom: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: semantic.border.subtle,
    },
    summaryEyebrow: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: spacing.sm,
    },
    summaryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
    },
    summaryCell: {
      flexGrow: 1,
      flexBasis: "40%",
      minWidth: 120,
    },
    summaryValue: {
      fontSize: typography.h3,
      fontWeight: "800",
    },
    summaryLabel: {
      marginTop: 2,
      fontSize: typography.caption,
    },
    actionsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "flex-end",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    searchInputWrap: {
      flex: 1,
      minWidth: 0,
    },
    ctaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
    ctaFlex: { flex: 1, minWidth: 140 },
    listContent: {
      gap: spacing.sm,
      paddingBottom: spacing.xl,
    },
    productCard: {
      width: "100%",
      borderTopWidth: 1,
      borderTopColor: semantic.border.accent,
      ...Platform.select({
        web: shadowPremium,
        default: {},
      }),
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
    },
    thumb: {
      width: 56,
      height: 56,
      borderRadius: radius.md,
      backgroundColor: semantic.bg.muted,
    },
    thumbPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
    },
    thumbGlyph: {
      fontSize: 20,
    },
    cardHead: {
      flex: 1,
      minWidth: 0,
    },
    cardTitleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    cardTitle: {
      fontWeight: "800",
      flex: 1,
      minWidth: 0,
      fontSize: typography.body,
    },
    cardPrice: {
      marginTop: spacing.xs,
      fontSize: typography.bodySmall,
      fontWeight: "800",
    },
    metaGrid: {
      marginTop: spacing.sm,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    metaCell: {
      flexGrow: 1,
      flexBasis: "45%",
      minWidth: 128,
      fontSize: 12,
    },
    brandSku: {
      marginTop: spacing.xs,
      fontSize: typography.caption,
    },
    cardActions: {
      marginTop: spacing.sm,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      alignItems: "center",
    },
  });
}
