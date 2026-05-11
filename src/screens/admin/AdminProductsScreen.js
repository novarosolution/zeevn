import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import AppFooter from "../../components/AppFooter";
import CustomerScreenShell from "../../components/CustomerScreenShell";
import AdminBackLink from "../../components/admin/AdminBackLink";
import AdminPageHeading from "../../components/admin/AdminPageHeading";
import { useAuth } from "../../context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { deleteAdminProduct, fetchAdminProducts } from "../../services/adminService";
import { adminPanel } from "../../theme/adminLayout";
import { adminInnerPageScrollContent, customerScrollFill } from "../../theme/screenLayout";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { layout, radius, spacing, typography } from "../../theme/tokens";
import { formatINR } from "../../utils/currency";
import PremiumInput from "../../components/ui/PremiumInput";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumCard from "../../components/ui/PremiumCard";
import PremiumChip from "../../components/ui/PremiumChip";
import MotionScrollView from "../../components/motion/MotionScrollView";
import SectionReveal from "../../components/motion/SectionReveal";

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
  const { colors: c, shadowPremium } = useTheme();
  const styles = useMemo(() => createAdminProductsStyles(c, shadowPremium), [c, shadowPremium]);
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [renderCount, setRenderCount] = useState(40);

  const loadProducts = useCallback(async () => {
    try {
      setError("");
      const response = await fetchAdminProducts(token);
      setProducts(response);
    } catch (err) {
      setError(err.message || "Failed to load products.");
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

  if (user && !user.isAdmin) {
    return (
      <CustomerScreenShell style={styles.screen} variant="admin">
        <MotionScrollView
          style={customerScrollFill}
          contentContainerStyle={adminInnerPageScrollContent(insets)}
          showsVerticalScrollIndicator={false}
        >
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.panel}>
              <AdminBackLink navigation={navigation} />
              <PremiumErrorBanner
                severity="warning"
                title="Admin access required"
                message="Sign in with an admin account to manage the catalog."
              />
              <PremiumButton
                label="Back to Home"
                variant="primary"
                onPress={() => navigation.navigate("Home")}
                style={styles.gateCta}
              />
            </View>
          </SectionReveal>
        </MotionScrollView>
      </CustomerScreenShell>
    );
  }

  const handleDelete = async (id) => {
    try {
      setError("");
      await deleteAdminProduct(token, id);
      await loadProducts();
    } catch (err) {
      setError(err.message || "Unable to delete product.");
    }
  };

  return (
    <CustomerScreenShell style={styles.screen} variant="admin">
      <MotionScrollView
        style={customerScrollFill}
        contentContainerStyle={adminInnerPageScrollContent(insets)}
        showsVerticalScrollIndicator={false}
        refreshControl={
          Platform.OS === "web" ? undefined : (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />
          )
        }
      >
        <View style={styles.panel}>
          <AdminBackLink navigation={navigation} />
          <AdminPageHeading
            title="Manage Products"
            subtitle="Search, stock visibility, and quick edits."
          />
          {error ? (
            <View style={styles.bannerSpacer}>
              <PremiumErrorBanner severity="error" message={error} onClose={() => setError("")} compact />
            </View>
          ) : null}

          <SectionReveal preset="fade-up" delay={0}>
            <PremiumCard padding="md" variant="elevated" goldAccent style={styles.summaryCard}>
              <Text style={[styles.summaryEyebrow, { color: c.textMuted }]}>Catalog snapshot</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryCell}>
                  <Text style={[styles.summaryValue, { color: c.textPrimary }]}>{stats.total}</Text>
                  <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>Total SKUs</Text>
                </View>
                <View style={styles.summaryCell}>
                  <Text style={[styles.summaryValue, { color: c.secondaryDark }]}>{stats.inStock}</Text>
                  <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>Healthy</Text>
                </View>
                <View style={styles.summaryCell}>
                  <Text style={[styles.summaryValue, { color: ALCHEMY.gold }]}>{stats.low}</Text>
                  <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>Low stock</Text>
                </View>
                <View style={styles.summaryCell}>
                  <Text style={[styles.summaryValue, { color: c.danger }]}>{stats.out}</Text>
                  <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>Out</Text>
                </View>
              </View>
            </PremiumCard>
          </SectionReveal>

          <View style={styles.actionsRow}>
            <View style={styles.searchInputWrap}>
              <PremiumInput
                label="Search catalog"
                value={search}
                onChangeText={setSearch}
                iconLeft="search-outline"
                iconRight={search ? "close-circle" : undefined}
                onIconRightPress={search ? () => setSearch("") : undefined}
                autoCapitalize="none"
              />
            </View>
            <PremiumButton label="Refresh" variant="secondary" size="md" onPress={loadProducts} />
          </View>

          <View style={styles.ctaRow}>
            <PremiumButton
              label="Inventory & stock"
              variant="secondary"
              iconLeft="layers-outline"
              onPress={() => navigation.navigate("AdminInventory")}
              style={styles.ctaFlex}
            />
            <PremiumButton
              label="Add product"
              variant="primary"
              iconLeft="add"
              onPress={() => navigation.navigate("AdminAddProduct")}
              style={styles.ctaFlex}
            />
          </View>

          <View style={styles.listContent}>
            {filteredProducts.length === 0 ? (
              <PremiumEmptyState
                iconName="cube-outline"
                title={search.trim() ? "No matching products" : "No products in catalog"}
                description={search.trim() ? "Try another search term." : "Add a product to get started."}
                ctaLabel={search.trim() ? undefined : "Add product"}
                ctaIconLeft="add-outline"
                onCtaPress={search.trim() ? undefined : () => navigation.navigate("AdminAddProduct")}
                compact
              />
            ) : null}
            {visibleProducts.map((item, idx) => {
              const chip = productStockChip(item);
              const uri = coverUri(item);
              const photoCount = (item.images || []).length || (item.image ? 1 : 0);
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
                          <PremiumChip label={chip.label} tone={chip.tone} size="sm" />
                        </View>
                        <Text style={[styles.cardPrice, { color: c.primary }]}>{formatINR(item.price)}</Text>
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
                      <PremiumButton
                        label="Edit"
                        variant="ghost"
                        size="sm"
                        onPress={() => navigation.navigate("AdminAddProduct", { product: item })}
                      />
                      <PremiumButton label="Delete" variant="danger" size="sm" onPress={() => handleDelete(item._id)} />
                    </View>
                  </PremiumCard>
                </SectionReveal>
              );
            })}
            {visibleProducts.length < filteredProducts.length ? (
              <PremiumButton
                label={`Load more (${filteredProducts.length - visibleProducts.length} remaining)`}
                variant="subtle"
                size="md"
                onPress={() => setRenderCount((prev) => prev + 40)}
                fullWidth
              />
            ) : null}
          </View>
        </View>
        <AppFooter />
      </MotionScrollView>
    </CustomerScreenShell>
  );
}

function createAdminProductsStyles(c, shadowPremium) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      width: "100%",
      alignSelf: "center",
      maxWidth: Platform.select({ web: layout.maxContentWidth + 72, default: "100%" }),
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
      backgroundColor: c.surfaceMuted,
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
