import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppFooter from "../components/AppFooter";
import CustomerScreenShell from "../components/CustomerScreenShell";
import PremiumCard from "../components/ui/PremiumCard";
import SectionReveal from "../components/motion/SectionReveal";
import useReducedMotion from "../hooks/useReducedMotion";
import useCountUp from "../hooks/useCountUp";
import { staggerDelay } from "../theme/motion";
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
import { customerScrollPaddingTop } from "../theme/screenLayout";
import { fonts, layout, radius, spacing, typography } from "../theme/tokens";
import { formatINRWhole } from "../utils/currency";
import { ALL_ORDER_STATUSES, getOrderStatusLabel } from "../utils/orderStatus";
import PremiumLoader from "../components/ui/PremiumLoader";
import PremiumErrorBanner from "../components/ui/PremiumErrorBanner";
import PremiumInput from "../components/ui/PremiumInput";
import PremiumEmptyState from "../components/ui/PremiumEmptyState";
import PremiumButton from "../components/ui/PremiumButton";

const TABS = {
  products: "Products",
  orders: "Orders",
  users: "Users",
};

function AnimatedStatValue({ value, active, reducedMotion, styles }) {
  const tweened = useCountUp({
    target: Number(value || 0),
    active,
    reducedMotion,
    duration: 900,
  });
  return <Text style={styles.statValue}>{Math.round(tweened)}</Text>;
}

function ModuleTile({ icon, label, description, onPress, color, reducedMotion, styles, c }) {
  const tilt = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: tilt.value * -3 },
      { scale: 1 + tilt.value * 0.015 },
    ],
  }));
  const onHoverIn = () => {
    if (Platform.OS === "web" && !reducedMotion) {
      tilt.value = withTiming(1, { duration: 220, easing: Easing.bezier(0.22, 1, 0.36, 1) });
    }
  };
  const onHoverOut = () => {
    tilt.value = withTiming(0, { duration: 220, easing: Easing.bezier(0.22, 1, 0.36, 1) });
  };
  const webHoverProps = Platform.OS === "web"
    ? { onMouseEnter: onHoverIn, onMouseLeave: onHoverOut }
    : {};
  return (
    <Animated.View style={[styles.moduleTileWrap, animatedStyle]} {...webHoverProps}>
      <PremiumCard onPress={onPress} interactive padding="lg" goldAccent style={styles.moduleTileCard}>
        <View style={[styles.moduleTileIcon, { backgroundColor: color || c.primarySoft }]}>
          <Ionicons name={icon} size={22} color={c.primaryDark} />
        </View>
        <Text style={styles.moduleTileLabel}>{label}</Text>
        {description ? <Text style={styles.moduleTileDescription}>{description}</Text> : null}
      </PremiumCard>
    </Animated.View>
  );
}

export default function AdminScreen({ navigation }) {
  const { colors: c, shadowPremium, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
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
  }, [isAdmin, navigation, loadAll]);

  useEffect(() => {
    setSearchQuery("");
    setOrderFilter("all");
  }, [activeTab]);

  const loadAll = useCallback(async () => {
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
  }, [token]);

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
    return (
      <CustomerScreenShell style={styles.screen}>
        <View style={{ paddingTop: customerScrollPaddingTop(insets) }}>
          <View style={styles.panel}>
            <Text style={styles.title}>Admin Access Required</Text>
            <Text style={styles.subtitle}>This account does not have admin privileges.</Text>
            <PremiumButton
              label="Back to home"
              iconLeft="home-outline"
              variant="subtle"
              size="md"
              onPress={() => navigation.navigate("Home")}
            />
          </View>
        </View>
      </CustomerScreenShell>
    );
  }

  return (
    <CustomerScreenShell style={styles.screen}>
      <View style={{ paddingTop: customerScrollPaddingTop(insets) }}>
        <LinearGradient
          colors={isDark ? [c.surfaceMuted, c.background] : [ALCHEMY.creamAlt, c.surface]}
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
        <SectionReveal preset="fade-up" delay={40}>
          <View style={styles.moduleGridSection}>
            <Text style={styles.moduleGridTitle}>Quick modules</Text>
            <View style={styles.moduleGridRow}>
              {[
                { icon: "speedometer-outline", label: "Dashboard", description: "Overview & KPIs", route: "AdminDashboard" },
                { icon: "cube-outline", label: "Products", description: "Catalog & inventory", route: "AdminProducts" },
                { icon: "receipt-outline", label: "Orders", description: "Track & fulfill", route: "AdminOrders" },
                { icon: "people-outline", label: "Users", description: "Roles & access", route: "AdminUsers" },
                { icon: "stats-chart-outline", label: "Analytics", description: "Sales insights", route: "AdminAnalytics" },
                { icon: "ticket-outline", label: "Coupons", description: "Promo codes", route: "AdminCoupons" },
                { icon: "megaphone-outline", label: "Broadcasts", description: "Push & inbox", route: "AdminNotifications" },
                { icon: "chatbox-ellipses-outline", label: "Support", description: "Customer chat", route: "AdminSupport" },
              ].map((mod, idx) => (
                <SectionReveal
                  key={mod.label}
                  preset="fade-up"
                  index={idx}
                  delay={staggerDelay(idx, { initialDelay: 40, gap: 60 })}
                  style={width >= 768 ? styles.moduleGridCellWide : styles.moduleGridCellMobile}
                >
                  <ModuleTile
                    icon={mod.icon}
                    label={mod.label}
                    description={mod.description}
                    onPress={() => navigation.navigate(mod.route)}
                    reducedMotion={reducedMotion}
                    styles={styles}
                    c={c}
                  />
                </SectionReveal>
              ))}
            </View>
          </View>
        </SectionReveal>

        {error ? (
          <View style={styles.bannerWrap}>
            <PremiumErrorBanner severity="error" message={error} compact />
          </View>
        ) : null}
        {success ? (
          <View style={styles.bannerWrap}>
            <PremiumErrorBanner severity="success" message={success} compact />
          </View>
        ) : null}

        <View style={styles.statsRow}>
          {headerStats.map((stat, idx) => (
            <SectionReveal
              key={stat.label}
              preset="fade-up"
              index={idx}
              delay={staggerDelay(idx, { initialDelay: 60, gap: 70 })}
              style={styles.statTileFlex}
            >
              <View style={styles.statCard}>
                <AnimatedStatValue
                  value={stat.value}
                  active={!loading}
                  reducedMotion={reducedMotion}
                  styles={styles}
                />
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            </SectionReveal>
          ))}
        </View>

        <SectionReveal preset="fade-up" delay={staggerDelay(3, { initialDelay: 60, gap: 70 })}>
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
        </SectionReveal>

        <View style={styles.topActionRow}>
          <View style={styles.searchInputWrap}>
            <PremiumInput
              label={`Search ${TABS[activeTab].toLowerCase()}`}
              value={searchQuery}
              onChangeText={setSearchQuery}
              iconLeft="search-outline"
              iconRight={searchQuery ? "close-circle" : undefined}
              onIconRightPress={searchQuery ? () => setSearchQuery("") : undefined}
              autoCapitalize="none"
            />
          </View>
          <PremiumButton
            label="Refresh"
            iconLeft="refresh-outline"
            variant="primary"
            size="sm"
            onPress={loadAll}
            style={styles.refreshBtn}
          />
        </View>

        {activeTab === "orders" ? (
          <ScrollableOrderFilters orderFilter={orderFilter} setOrderFilter={setOrderFilter} styles={styles} />
        ) : null}

        {actionLoading ? (
          <View style={styles.actionLoader}>
            <PremiumLoader size="sm" inline />
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingWrap}>
            <PremiumLoader size="md" caption="Loading admin data…" />
          </View>
        ) : (
          <>
            {activeTab === "products" ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {editingProductId ? "Edit Product" : "Create Product"}
                </Text>
                <View style={styles.adminFieldGap}>
                  <PremiumInput
                    label="Name"
                    value={name}
                    onChangeText={setName}
                    iconLeft="cube-outline"
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.adminFieldGap}>
                  <PremiumInput
                    label="Price"
                    value={price}
                    onChangeText={setPrice}
                    iconLeft="pricetag-outline"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.adminFieldGap}>
                  <PremiumInput
                    label="Image URL"
                    value={image}
                    onChangeText={setImage}
                    iconLeft="image-outline"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <View style={styles.adminFieldGap}>
                  <PremiumInput
                    label="Description"
                    value={description}
                    onChangeText={setDescription}
                    iconLeft="text-outline"
                    multiline
                    numberOfLines={3}
                  />
                </View>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateProduct} accessibilityRole="button">
                  <Text style={styles.primaryBtnText}>
                    {editingProductId ? "Update Product" : "Add Product"}
                  </Text>
                </TouchableOpacity>
                {editingProductId ? (
                  <TouchableOpacity style={styles.cancelBtn} onPress={cancelEditProduct} accessibilityRole="button">
                    <Text style={styles.cancelBtnText}>Cancel Edit</Text>
                  </TouchableOpacity>
                ) : null}

                {visibleProducts.length === 0 ? (
                  <PremiumEmptyState
                    iconName="cube-outline"
                    title={searchQuery ? "No matching products" : "No products yet"}
                    description={searchQuery ? "Try a different keyword or clear the search." : "Use the form above to add your first product."}
                    compact
                  />
                ) : (
                  <FlatList
                    data={visibleProducts}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                      <View style={styles.listCard}>
                        <Text style={styles.listTitle}>{item.name}</Text>
                        <Text style={styles.listMeta}>{formatINRWhole(item.price)}</Text>
                        <View style={styles.rowActions}>
                          <TouchableOpacity style={styles.smallActionBtn} onPress={() => beginEditProduct(item)} accessibilityRole="button">
                            <Text style={styles.smallActionBtnText}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.dangerBtn}
                            onPress={() => handleDeleteProduct(item._id)}
                            accessibilityRole="button"
                          >
                            <Text style={styles.dangerBtnText}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  />
                )}
              </View>
            ) : null}

            {activeTab === "orders" ? (
              visibleOrders.length === 0 ? (
                <PremiumEmptyState
                  iconName="receipt-outline"
                  title={searchQuery || orderFilter !== "all" ? "No matching orders" : "No orders yet"}
                  description={searchQuery || orderFilter !== "all" ? "Try a different filter or clear the search." : "Customer orders will appear here when they come in."}
                  compact
                />
              ) : (
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
                        {ALL_ORDER_STATUSES.map((status) => (
                          <TouchableOpacity
                            key={status}
                            style={styles.smallActionBtn}
                            onPress={() => handleOrderStatus(item._id, status)}
                            accessibilityRole="button"
                          >
                            <Text style={styles.smallActionBtnText} numberOfLines={1}>
                              {getOrderStatusLabel(status)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                          style={styles.dangerBtn}
                          onPress={() => handleDeleteOrder(item._id)}
                          accessibilityRole="button"
                        >
                          <Text style={styles.dangerBtnText}>Delete Order</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                />
              )
            ) : null}

            {activeTab === "users" ? (
              visibleUsers.length === 0 ? (
                <PremiumEmptyState
                  iconName="people-outline"
                  title={searchQuery ? "No matching users" : "No users yet"}
                  description={searchQuery ? "Try a different keyword or clear the search." : "Customer accounts will appear here once they register."}
                  compact
                />
              ) : (
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
                          accessibilityRole="button"
                        >
                          <Text style={styles.smallActionBtnText}>Make Admin</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.smallActionBtn}
                          onPress={() => handleRoleChange(item._id, false)}
                          accessibilityRole="button"
                        >
                          <Text style={styles.smallActionBtnText}>Remove Admin</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.dangerBtn}
                          onPress={() => handleDeleteUser(item._id)}
                          accessibilityRole="button"
                        >
                          <Text style={styles.dangerBtnText}>Delete User</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                />
              )
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
    paddingHorizontal: spacing.lg + 2,
    width: "100%",
    alignSelf: "center",
    maxWidth: Platform.select({ web: layout.maxContentWidth + 96, default: "100%" }),
  },
  heroStrip: {
    position: "relative",
    borderRadius: radius.xxl,
    padding: spacing.lg + 2,
    paddingBottom: spacing.md,
    marginBottom: spacing.lg,
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
    borderRadius: radius.xl + 2,
    padding: spacing.lg + 2,
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
  moduleGridSection: {
    marginBottom: spacing.lg,
  },
  moduleGridTitle: {
    fontSize: typography.overline,
    letterSpacing: 1,
    fontFamily: fonts.bold,
    textTransform: "uppercase",
    color: c.textMuted,
    marginBottom: spacing.sm,
  },
  moduleGridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  moduleGridCellWide: {
    width: "48%",
  },
  moduleGridCellMobile: {
    width: "100%",
  },
  moduleTileWrap: {
    width: "100%",
  },
  moduleTileCard: {
    minHeight: 116,
    gap: spacing.xs,
  },
  moduleTileIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: c.primaryBorder,
    marginBottom: spacing.xs,
  },
  moduleTileLabel: {
    fontFamily: fonts.extrabold,
    fontSize: typography.body,
    color: c.textPrimary,
    letterSpacing: -0.2,
  },
  moduleTileDescription: {
    fontSize: typography.caption,
    fontFamily: fonts.medium,
    color: c.textSecondary,
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
    alignItems: "flex-end",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchInputWrap: {
    flex: 1,
    minWidth: 0,
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: c.primary,
    borderColor: c.primaryBorder,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: "center",
  },
  refreshBtnText: {
    color: c.onPrimary,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
    letterSpacing: 0.4,
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
    marginBottom: spacing.md + 2,
  },
  statTileFlex: {
    flex: 1,
    minWidth: 0,
  },
  statCard: {
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
  loadingWrap: {
    paddingTop: spacing.lg,
    alignItems: "center",
  },
  bannerWrap: {
    marginBottom: spacing.sm,
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
  adminFieldGap: {
    marginBottom: spacing.sm,
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
  const statuses = ["all", ...ALL_ORDER_STATUSES];

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
            {status === "all" ? "All" : getOrderStatusLabel(status)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
