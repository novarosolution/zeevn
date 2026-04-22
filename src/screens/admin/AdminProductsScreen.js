import React, { useEffect, useMemo, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppFooter from "../../components/AppFooter";
import CustomerScreenShell from "../../components/CustomerScreenShell";
import AdminBackLink from "../../components/admin/AdminBackLink";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { deleteAdminProduct, fetchAdminProducts } from "../../services/adminService";
import { adminPanel } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, layout, radius, spacing, typography } from "../../theme/tokens";
import { formatINR } from "../../utils/currency";

const LOW_STOCK_MAX = 5;

function productStockPill(p, c) {
  const q = Math.max(0, Number(p.stockQty) || 0);
  if (p.inStock === false || q < 1) {
    return { label: "Out", key: "out", bg: "rgba(220, 38, 38, 0.12)", border: c.danger, text: c.danger };
  }
  if (q <= LOW_STOCK_MAX) {
    return { label: "Low", key: "low", bg: c.primarySoft, border: c.primaryBorder, text: c.primaryDark };
  }
  return { label: "In stock", key: "ok", bg: c.secondarySoft, border: c.secondaryBorder, text: c.secondaryDark };
}

export default function AdminProductsScreen({ navigation }) {
  const { colors: c, shadowPremium } = useTheme();
  const styles = useMemo(() => createAdminProductsStyles(c, shadowPremium), [c, shadowPremium]);
  const { user, token } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  async function loadProducts() {
    try {
      setError("");
      const response = await fetchAdminProducts(token);
      setProducts(response);
    } catch (err) {
      setError(err.message || "Failed to load products.");
    }
  }

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!user.isAdmin) return;
    loadProducts();
  }, [user?.isAdmin]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const searchText = search.toLowerCase();
    return products.filter((item) =>
      [item.name, item.category, item.homeSection, item.productType, item.showOnHome ? "show" : "hide"]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(searchText))
    );
  }, [products, search]);

  if (user && !user.isAdmin) {
    return (
      <CustomerScreenShell style={styles.screen}>
        <ScrollView style={customerScrollFill} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.panel}>
            <Text style={styles.title}>Admin Access Required</Text>
            <Text style={styles.subtitle}>This account does not have admin privileges.</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate("Home")}>
              <Text style={styles.addBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    <CustomerScreenShell style={styles.screen}>
        <ScrollView style={customerScrollFill} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.panel}>
            <AdminBackLink navigation={navigation} />
            <Text style={styles.title}>Manage Products</Text>
          <Text style={styles.subtitle}>Edit catalog and manage product lifecycle.</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actionsRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor={c.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            <TouchableOpacity style={styles.refreshBtn} onPress={loadProducts}>
              <Text style={styles.refreshBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.ctaRow}>
            <TouchableOpacity style={styles.invBtn} onPress={() => navigation.navigate("AdminInventory")}>
              <Ionicons name="layers-outline" size={20} color={c.secondary} />
              <Text style={styles.invBtnText}>Inventory & stock</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate("AdminAddProduct")}>
              <Ionicons name="add" size={22} color={c.onPrimary} />
              <Text style={styles.addBtnText}>Add product</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listContent}>
            {filteredProducts.map((item) => (
              <View key={item._id} style={styles.card}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  {(() => {
                    const pill = productStockPill(item, c);
                    return (
                      <View style={[styles.stockPill, { backgroundColor: pill.bg, borderColor: pill.border }]}>
                        <Text style={[styles.stockPillText, { color: pill.text }]}>{pill.label}</Text>
                      </View>
                    );
                  })()}
                </View>
                <Text style={styles.cardMeta}>Price: {formatINR(item.price)}</Text>
                <Text style={styles.cardMeta}>Home Section: {item.homeSection || "Prime Products"}</Text>
                <Text style={styles.cardMeta}>Product Type: {item.productType || item.category || "General"}</Text>
                <Text style={styles.cardMeta}>Home Visible: {item.showOnHome === false ? "No" : "Yes"}</Text>
                <Text style={styles.cardMeta}>Home Order: {Number.isFinite(Number(item.homeOrder)) ? Number(item.homeOrder) : 0}</Text>
                <Text style={styles.cardMeta}>
                  Stock: {item.inStock === false ? "Out of stock" : "In stock"} ({Math.max(0, Number(item.stockQty) || 0)})
                </Text>
                {item.brand ? <Text style={styles.cardMeta}>Brand: {item.brand}</Text> : null}
                {item.sku ? <Text style={styles.cardMeta}>SKU: {item.sku}</Text> : null}
                <Text style={styles.cardMeta}>Photos: {(item.images || []).length || (item.image ? 1 : 0)}</Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.smallBtn}
                    onPress={() => navigation.navigate("AdminAddProduct", { product: item })}
                  >
                    <Text style={styles.smallBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dangerBtn} onPress={() => handleDelete(item._id)}>
                    <Text style={styles.dangerBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
        <AppFooter />
      </ScrollView>
    </CustomerScreenShell>
  );
}

function createAdminProductsStyles(c, shadowPremium) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      width: "100%",
      alignSelf: "center",
      maxWidth: Platform.select({ web: layout.maxContentWidth, default: "100%" }),
    },
    scrollContent: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    panel: {
      ...adminPanel(c, shadowPremium),
    },
    title: {
      color: c.textPrimary,
      fontSize: typography.h2,
      fontFamily: fonts.extrabold,
      letterSpacing: -0.35,
    },
    subtitle: {
      marginTop: spacing.xs,
      color: c.textSecondary,
      marginBottom: spacing.md,
    },
    errorText: {
      color: c.danger,
      fontWeight: "600",
      marginBottom: spacing.sm,
    },
    actionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    searchInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      backgroundColor: c.surfaceMuted,
      color: c.textPrimary,
    },
    refreshBtn: {
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: c.primaryBorder,
      borderRadius: radius.md,
      backgroundColor: c.primarySoft,
      justifyContent: "center",
      paddingVertical: 10,
    },
    refreshBtnText: {
      color: c.primary,
      fontWeight: "700",
      fontSize: 12,
    },
    ctaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
    invBtn: {
      flex: 1,
      minWidth: 140,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: c.secondarySoft,
      borderWidth: 1,
      borderColor: c.secondaryBorder,
      borderRadius: radius.pill,
      paddingVertical: 11,
    },
    invBtnText: { color: c.secondary, fontWeight: "700" },
    addBtn: {
      flex: 1,
      minWidth: 140,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: c.primary,
      borderRadius: radius.pill,
      paddingVertical: 11,
    },
    addBtnText: {
      color: c.onPrimary,
      fontWeight: "700",
    },
    listContent: {
      gap: spacing.sm,
      paddingBottom: spacing.xl,
    },
    card: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      padding: spacing.md,
      backgroundColor: c.surfaceMuted,
    },
    cardTitleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
    cardTitle: {
      color: c.textPrimary,
      fontWeight: "700",
      flex: 1,
      minWidth: 0,
    },
    stockPill: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0 },
    stockPillText: { fontSize: 10, fontWeight: "800" },
    cardMeta: {
      marginTop: 4,
      color: c.textSecondary,
      fontSize: 12,
    },
    cardActions: {
      marginTop: spacing.sm,
      flexDirection: "row",
      gap: spacing.sm,
    },
    smallBtn: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 7,
      backgroundColor: c.surface,
    },
    smallBtnText: {
      color: c.textPrimary,
      fontWeight: "700",
      fontSize: 12,
    },
    dangerBtn: {
      borderWidth: 1,
      borderColor: c.danger,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 7,
      backgroundColor: "rgba(220, 38, 38, 0.08)",
    },
    dangerBtnText: {
      color: c.danger,
      fontWeight: "700",
      fontSize: 12,
    },
  });
}
