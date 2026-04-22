import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppFooter from "../components/AppFooter";
import CustomerScreenShell from "../components/CustomerScreenShell";
import { useAuth } from "../context/AuthContext";
import {
  createAdminProduct,
  deleteAdminOrder,
  deleteAdminProduct,
  deleteAdminUser,
  fetchAdminOrders,
  fetchAdminProducts,
  fetchAdminUsers,
  updateAdminProduct,
  updateAdminRole,
  updateOrderStatus,
} from "../services/adminService";
import { useTheme } from "../context/ThemeContext";
import { ALCHEMY, FONT_DISPLAY } from "../theme/customerAlchemy";
import { fonts, layout, radius, spacing, typography } from "../theme/tokens";
import { formatINRWhole } from "../utils/currency";

const TABS = {
  products: "Products",
  orders: "Orders",
  users: "Users",
};

export default function AdminScreen({ navigation }) {
  const { colors: c, shadowPremium, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createAdminScreenStyles(c, shadowPremium, isDark), [c, shadowPremium, isDark]);
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [editingProductId, setEditingProductId] = useState(null);

  const isAdmin = Boolean(user?.isAdmin);

  const headerStats = useMemo(
    () => [
      { label: "Products", value: products.length },
      { label: "Orders", value: orders.length },
      { label: "Users", value: users.length },
    ],
    [orders.length, products.length, users.length]
  );

  useEffect(() => {
    if (!isAdmin) {
      navigation.navigate("Home");
      return;
    }

    loadAll();
  }, [isAdmin]);

  useEffect(() => {
    setSearchQuery("");
    setOrderFilter("all");
  }, [activeTab]);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      const [productsRes, ordersRes, usersRes] = await Promise.all([
        fetchAdminProducts(token),
        fetchAdminOrders(token),
        fetchAdminUsers(token),
      ]);
      setProducts(productsRes);
      setOrders(ordersRes);
      setUsers(usersRes);
    } catch (err) {
      setError(err.message || "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!name.trim() || !price.trim()) {
      setError("Product name and price are required.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      const payload = {
        name: name.trim(),
        price: Number(price),
        image: image.trim(),
        description: description.trim(),
      };

      if (editingProductId) {
        await updateAdminProduct(token, editingProductId, payload);
        setSuccess("Product updated.");
      } else {
        await createAdminProduct(token, payload);
        setSuccess("Product created.");
      }

      setName("");
      setPrice("");
      setImage("");
      setDescription("");
      setEditingProductId(null);
      await loadAll();
    } catch (err) {
      setError(err.message || "Unable to save product.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      setActionLoading(true);
      await deleteAdminProduct(token, productId);
      setSuccess("Product deleted.");
      await loadAll();
    } catch (err) {
      setError(err.message || "Unable to delete product.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOrderStatus = async (orderId, status) => {
    try {
      setActionLoading(true);
      await updateOrderStatus(token, orderId, status);
      setSuccess("Order status updated.");
      await loadAll();
    } catch (err) {
      setError(err.message || "Unable to update order status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (userId, value) => {
    try {
      setActionLoading(true);
      await updateAdminRole(token, userId, value);
      setSuccess("User role updated.");
      await loadAll();
    } catch (err) {
      setError(err.message || "Unable to update user role.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      setActionLoading(true);
      await deleteAdminOrder(token, orderId);
      setSuccess("Order deleted.");
      await loadAll();
    } catch (err) {
      setError(err.message || "Unable to delete order.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setActionLoading(true);
      await deleteAdminUser(token, userId);
      setSuccess("User deleted.");
      await loadAll();
    } catch (err) {
      setError(err.message || "Unable to delete user.");
    } finally {
      setActionLoading(false);
    }
  };

  const beginEditProduct = (product) => {
    setEditingProductId(product._id);
    setName(product.name || "");
    setPrice(String(product.price ?? ""));
    setImage(product.image || "");
    setDescription(product.description || "");
  };

  const cancelEditProduct = () => {
    setEditingProductId(null);
    setName("");
    setPrice("");
    setImage("");
    setDescription("");
  };

  const visibleProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    return products.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const visibleUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (item) =>
        item.name.toLowerCase().includes(query) || String(item.email).toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const visibleOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus = orderFilter === "all" ? true : order.status === orderFilter;
      if (!matchesStatus) return false;

      if (!query) return true;

      const orderId = order._id.toLowerCase();
      const userName = String(order.user?.name || "").toLowerCase();
      const userEmail = String(order.user?.email || "").toLowerCase();
      return orderId.includes(query) || userName.includes(query) || userEmail.includes(query);
    });
  }, [orders, searchQuery, orderFilter]);

  if (!isAdmin) {
    return null;
  }

  return (
    <CustomerScreenShell style={styles.screen}>
      <View style={{ paddingTop: Math.max(insets.top, Platform.OS === "web" ? spacing.md : spacing.sm) }}>
        <LinearGradient
          colors={isDark ? [c.surfaceMuted, "#1a1714"] : [ALCHEMY.creamAlt, ALCHEMY.cardBg]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroStrip}
        >
          <View style={styles.heroGoldLine} />
          <TouchableOpacity
            style={styles.backPill}
            onPress={() => (navigation.canGoBack?.() ? navigation.goBack() : navigation.navigate("Home"))}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={22} color={isDark ? c.textPrimary : ALCHEMY.brown} />
            <Text style={[styles.backPillText, { color: isDark ? c.textPrimary : ALCHEMY.brown }]}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, isDark ? null : styles.titleLight]}>Admin console</Text>
          <Text style={[styles.subtitle, isDark ? null : styles.subtitleLight]}>
            Manage products, orders, and user roles.
          </Text>
        </LinearGradient>
      </View>
      <View style={styles.container}>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        <View style={styles.statsRow}>
          {headerStats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.tabsRow}>
          {Object.entries(TABS).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[styles.tabButton, activeTab === key ? styles.tabButtonActive : null]}
              onPress={() => setActiveTab(key)}
            >
              <Text style={[styles.tabButtonText, activeTab === key ? styles.tabButtonTextActive : null]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.topActionRow}>
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${TABS[activeTab].toLowerCase()}...`}
            placeholderTextColor={c.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.refreshBtn} onPress={loadAll}>
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {activeTab === "orders" ? (
          <ScrollableOrderFilters orderFilter={orderFilter} setOrderFilter={setOrderFilter} styles={styles} />
        ) : null}

        {actionLoading ? (
          <View style={styles.actionLoader}>
            <ActivityIndicator color={c.primary} />
          </View>
        ) : null}

        {loading ? (
          <Text style={styles.loadingText}>Loading admin data...</Text>
        ) : (
          <>
            {activeTab === "products" ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {editingProductId ? "Edit Product" : "Create Product"}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  placeholderTextColor={c.textMuted}
                  value={name}
                  onChangeText={setName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Price"
                  placeholderTextColor={c.textMuted}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Image URL"
                  placeholderTextColor={c.textMuted}
                  value={image}
                  onChangeText={setImage}
                />
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Description"
                  placeholderTextColor={c.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />
                <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateProduct}>
                  <Text style={styles.primaryBtnText}>
                    {editingProductId ? "Update Product" : "Add Product"}
                  </Text>
                </TouchableOpacity>
                {editingProductId ? (
                  <TouchableOpacity style={styles.cancelBtn} onPress={cancelEditProduct}>
                    <Text style={styles.cancelBtnText}>Cancel Edit</Text>
                  </TouchableOpacity>
                ) : null}

                <FlatList
                  data={visibleProducts}
                  keyExtractor={(item) => item._id}
                  contentContainerStyle={styles.listContent}
                  renderItem={({ item }) => (
                    <View style={styles.listCard}>
                      <Text style={styles.listTitle}>{item.name}</Text>
                      <Text style={styles.listMeta}>{formatINRWhole(item.price)}</Text>
                      <View style={styles.rowActions}>
                        <TouchableOpacity style={styles.smallActionBtn} onPress={() => beginEditProduct(item)}>
                          <Text style={styles.smallActionBtnText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.dangerBtn}
                          onPress={() => handleDeleteProduct(item._id)}
                        >
                          <Text style={styles.dangerBtnText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                />
              </View>
            ) : null}

            {activeTab === "orders" ? (
              <FlatList
                data={visibleOrders}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                  <View style={styles.listCard}>
                    <Text style={styles.listTitle}>Order #{item._id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.listMeta}>
                      {item.user?.name || "User"} • {formatINRWhole(item.totalPrice)} • {item.status}
                    </Text>
                    <Text style={styles.listMeta}>Items: {item.products?.length || 0}</Text>
                    <View style={styles.rowActions}>
                      {["pending", "paid", "shipped", "delivered", "cancelled"].map((status) => (
                        <TouchableOpacity
                          key={status}
                          style={styles.smallActionBtn}
                          onPress={() => handleOrderStatus(item._id, status)}
                        >
                          <Text style={styles.smallActionBtnText}>{status}</Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        style={styles.dangerBtn}
                        onPress={() => handleDeleteOrder(item._id)}
                      >
                        <Text style={styles.dangerBtnText}>Delete Order</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            ) : null}

            {activeTab === "users" ? (
              <FlatList
                data={visibleUsers}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                  <View style={styles.listCard}>
                    <Text style={styles.listTitle}>{item.name}</Text>
                    <Text style={styles.listMeta}>{item.email}</Text>
                    <Text style={styles.listMeta}>
                      Role: {item.isAdmin ? "Admin" : "Customer"}
                    </Text>
                    <View style={styles.rowActions}>
                      <TouchableOpacity
                        style={styles.smallActionBtn}
                        onPress={() => handleRoleChange(item._id, true)}
                      >
                        <Text style={styles.smallActionBtnText}>Make Admin</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.smallActionBtn}
                        onPress={() => handleRoleChange(item._id, false)}
                      >
                        <Text style={styles.smallActionBtnText}>Remove Admin</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.dangerBtn}
                        onPress={() => handleDeleteUser(item._id)}
                      >
                        <Text style={styles.dangerBtnText}>Delete User</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            ) : null}
          </>
        )}
      </View>
      <AppFooter />
    </CustomerScreenShell>
  );
}

function createAdminScreenStyles(c, shadowPremium, isDark) {
  const hairline = isDark ? c.border : ALCHEMY.pillInactive;
  const cardBg = isDark ? c.surface : ALCHEMY.cardBg;
  return StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    width: "100%",
    alignSelf: "center",
    maxWidth: Platform.select({ web: layout.maxContentWidth, default: "100%" }),
  },
  heroStrip: {
    position: "relative",
    borderRadius: radius.xxl,
    padding: spacing.lg,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: hairline,
    ...shadowPremium,
  },
  heroGoldLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: ALCHEMY.gold,
    opacity: 0.95,
  },
  backPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: hairline,
    backgroundColor: isDark ? "rgba(255,255,255,0.06)" : ALCHEMY.creamAlt,
  },
  backPillText: {
    fontFamily: fonts.bold,
    fontSize: typography.caption,
  },
  container: {
    flex: 1,
    backgroundColor: cardBg,
    borderWidth: 1,
    borderColor: hairline,
    borderLeftWidth: 3,
    borderLeftColor: isDark ? c.accentGold : ALCHEMY.brown,
    borderTopWidth: 2,
    borderTopColor: isDark ? c.primaryBorder : ALCHEMY.gold,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadowPremium,
  },
  title: {
    color: c.textPrimary,
    fontSize: typography.h2,
    fontFamily: FONT_DISPLAY,
    letterSpacing: -0.4,
  },
  titleLight: {
    color: ALCHEMY.brown,
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    color: c.textSecondary,
    fontSize: typography.bodySmall,
    fontFamily: fonts.regular,
  },
  subtitleLight: {
    color: "#5C534A",
  },
  errorText: {
    color: c.danger,
    marginBottom: spacing.sm,
    fontFamily: fonts.semibold,
    fontSize: typography.caption,
  },
  successText: {
    color: c.success,
    marginBottom: spacing.sm,
    fontFamily: fonts.semibold,
    fontSize: typography.caption,
  },
  topActionRow: {
    flexDirection: "row",
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
    minHeight: 44,
    backgroundColor: c.surfaceMuted,
    fontFamily: fonts.regular,
    fontSize: typography.bodySmall,
    color: c.textPrimary,
  },
  refreshBtn: {
    backgroundColor: c.primarySoft,
    borderColor: c.primaryBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
  refreshBtnText: {
    color: c.primary,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.md,
    flexWrap: "wrap",
  },
  filterPill: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: c.surface,
  },
  filterPillActive: {
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft,
  },
  filterPillText: {
    color: c.textPrimary,
    fontSize: typography.overline + 1,
    fontFamily: fonts.bold,
    textTransform: "capitalize",
  },
  filterPillTextActive: {
    color: c.primary,
  },
  actionLoader: {
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: c.surfaceMuted,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  statValue: {
    color: c.primary,
    fontFamily: fonts.extrabold,
    fontSize: typography.h2,
  },
  statLabel: {
    color: c.textSecondary,
    fontSize: typography.caption,
    fontFamily: fonts.semibold,
  },
  tabsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.pill,
    alignItems: "center",
    paddingVertical: 9,
    backgroundColor: c.surface,
  },
  tabButtonActive: {
    backgroundColor: c.primarySoft,
    borderColor: c.primaryBorder,
  },
  tabButtonText: {
    color: c.textPrimary,
    fontFamily: fonts.bold,
    fontSize: typography.bodySmall,
  },
  tabButtonTextActive: {
    color: c.primary,
  },
  loadingText: {
    textAlign: "center",
    color: c.textSecondary,
    marginTop: spacing.lg,
    fontFamily: fonts.medium,
    fontSize: typography.bodySmall,
  },
  section: {
    flex: 1,
  },
  sectionTitle: {
    color: c.textPrimary,
    fontFamily: fonts.bold,
    fontSize: typography.body,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    minHeight: 44,
    marginBottom: spacing.sm,
    backgroundColor: c.surfaceMuted,
    fontFamily: fonts.regular,
    fontSize: typography.bodySmall,
    color: c.textPrimary,
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  primaryBtn: {
    backgroundColor: c.primary,
    borderRadius: radius.pill,
    alignItems: "center",
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: c.onPrimary,
    fontFamily: fonts.bold,
    fontSize: typography.bodySmall,
  },
  cancelBtn: {
    marginTop: spacing.xs,
    alignItems: "center",
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: c.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: typography.caption,
  },
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  listCard: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: c.surfaceMuted,
  },
  listTitle: {
    color: c.textPrimary,
    fontFamily: fonts.bold,
    fontSize: typography.bodySmall,
  },
  listMeta: {
    marginTop: 3,
    color: c.textSecondary,
    fontSize: typography.caption,
    fontFamily: fonts.regular,
  },
  rowActions: {
    marginTop: spacing.sm,
    flexDirection: "row",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  smallActionBtn: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: c.surface,
  },
  smallActionBtnText: {
    color: c.textPrimary,
    fontSize: typography.overline + 1,
    fontFamily: fonts.bold,
  },
  dangerBtn: {
    backgroundColor: c.primarySoft,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  dangerBtnText: {
    color: c.primary,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
  },
  });
}

function ScrollableOrderFilters({ orderFilter, setOrderFilter, styles }) {
  const statuses = ["all", "pending", "paid", "shipped", "delivered", "cancelled"];

  return (
    <View style={styles.filterRow}>
      {statuses.map((status) => (
        <TouchableOpacity
          key={status}
          style={[styles.filterPill, orderFilter === status ? styles.filterPillActive : null]}
          onPress={() => setOrderFilter(status)}
        >
          <Text
            style={[
              styles.filterPillText,
              orderFilter === status ? styles.filterPillTextActive : null,
            ]}
          >
            {status}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
