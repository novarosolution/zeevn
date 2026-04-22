import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AppFooter from "../../components/AppFooter";
import CustomerScreenShell from "../../components/CustomerScreenShell";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchAdminOrders, fetchAdminProducts, fetchAdminUsers } from "../../services/adminService";
import { adminModuleSection, adminPanel } from "../../theme/adminLayout";
import { ALCHEMY, FONT_DISPLAY, FONT_DISPLAY_SEMI } from "../../theme/customerAlchemy";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, layout, radius, spacing, typography } from "../../theme/tokens";

const MANAGE_SECTIONS = [
  {
    id: "catalog",
    label: "Catalog & inventory",
    items: [
      {
        title: "Manage products",
        subtitle: "List, edit, and remove items",
        icon: "cube-outline",
        route: "AdminProducts",
      },
      {
        title: "Inventory & stock",
        subtitle: "Set quantities, low-stock view, in / out of stock (admin only)",
        icon: "layers-outline",
        route: "AdminInventory",
      },
      {
        title: "Add product",
        subtitle: "Create new catalog entries",
        icon: "add-circle-outline",
        route: "AdminAddProduct",
      },
      {
        title: "Manage storefront content",
        subtitle: "Hero, sections, layout & links to products",
        icon: "home-outline",
        route: "AdminHomeView",
      },
    ],
  },
  {
    id: "orders",
    label: "Orders & customers",
    items: [
      {
        title: "Manage orders",
        subtitle: "Status, details, and fulfillment",
        icon: "receipt-outline",
        route: "AdminOrders",
      },
      {
        title: "Manage users",
        subtitle: "Roles and account controls",
        icon: "people-outline",
        route: "AdminUsers",
      },
    ],
  },
  {
    id: "growth",
    label: "Marketing & engagement",
    items: [
      {
        title: "Send notification",
        subtitle: "Broadcast messages to customers",
        icon: "notifications-outline",
        route: "AdminNotifications",
      },
      {
        title: "Manage coupons",
        subtitle: "Discount codes and visibility",
        icon: "pricetag-outline",
        route: "AdminCoupons",
      },
      {
        title: "Support inbox",
        subtitle: "Threads and replies",
        icon: "chatbubbles-outline",
        route: "AdminSupport",
      },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    items: [
      {
        title: "Analytics",
        subtitle: "Revenue, stock, carts, and trends",
        icon: "bar-chart-outline",
        route: "AdminAnalytics",
      },
    ],
  },
];

export default function AdminDashboardScreen({ navigation }) {
  const { colors: c, shadowLift, shadowPremium, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createAdminDashboardStyles(c, shadowLift, shadowPremium), [c, shadowLift, shadowPremium]);
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    users: 0,
    admins: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const heroGradient = useMemo(
    () =>
      isDark
        ? ["#0C0A08", "#2A2118", "#14532D"]
        : [ALCHEMY.creamAlt, ALCHEMY.cardBg, "#EDE4D4"],
    [isDark]
  );

  function StatCard({ icon, label, value, warnHighlight }) {
    return (
      <View style={[styles.statCard, warnHighlight ? styles.statCardWarn : null, !isDark ? styles.statCardLight : null]}>
        <View style={[styles.statIconWrap, !isDark ? styles.statIconWrapLight : null]}>
          <Ionicons name={icon} size={18} color={isDark ? c.primary : ALCHEMY.brown} />
        </View>
        <Text style={[styles.statValue, !isDark ? styles.statValueLight : null]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    );
  }

  function ActionRow({ title, subtitle, icon, onPress }) {
    return (
      <TouchableOpacity
        style={[styles.actionRow, !isDark ? styles.actionRowLight : null]}
        onPress={onPress}
        activeOpacity={0.82}
      >
        <View style={[styles.actionIconWrap, !isDark ? styles.actionIconWrapRowLight : null]}>
          <Ionicons name={icon} size={22} color={isDark ? c.primary : ALCHEMY.brown} />
        </View>
        <View style={styles.actionTextCol}>
          <Text style={[styles.actionTitle, !isDark ? styles.actionTitleLight : null]}>{title}</Text>
          <Text style={styles.actionSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
      </TouchableOpacity>
    );
  }

  const loadStats = useCallback(
    async ({ isPullRefresh = false } = {}) => {
      if (isPullRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");
      try {
        const [products, orders, users] = await Promise.all([
          fetchAdminProducts(token),
          fetchAdminOrders(token),
          fetchAdminUsers(token),
        ]);
        setStats({
          products: products.length,
          orders: orders.length,
          users: users.length,
          admins: users.filter((item) => item.isAdmin).length,
          pendingOrders: orders.filter((item) => item.status === "pending").length,
        });
      } catch (err) {
        setError(err.message || "Unable to load admin dashboard.");
      } finally {
        if (isPullRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [token]
  );

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!user.isAdmin) return;
    loadStats();
  }, [user?.isAdmin, loadStats]);

  if (user && !user.isAdmin) {
    return (
      <CustomerScreenShell style={styles.screen}>
        <ScrollView
          style={customerScrollFill}
          contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top, spacing.md) }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.deniedCard}>
            <View style={styles.deniedIconWrap}>
              <Ionicons name="shield-half-outline" size={40} color={c.primary} />
            </View>
            <Text style={styles.deniedTitle}>Admin access required</Text>
            <Text style={styles.deniedSub}>This account does not have admin privileges.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate("Home")}>
              <Ionicons name="home-outline" size={18} color={c.onPrimary} />
              <Text style={styles.primaryBtnText}>Back to home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </CustomerScreenShell>
    );
  }

  return (
    <CustomerScreenShell style={styles.screen}>
      <ScrollView
        style={customerScrollFill}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, Platform.OS === "web" ? spacing.md : spacing.sm) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          Platform.OS === "web" ? undefined : (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadStats({ isPullRefresh: true })}
              tintColor={c.primary}
              colors={[c.primary]}
              progressBackgroundColor={c.surface}
            />
          )
        }
      >
        <LinearGradient colors={heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroGoldHairline} />
          <View style={[styles.heroBlobA, isDark ? null : styles.heroBlobALight]} />
          <View style={[styles.heroBlobB, isDark ? null : styles.heroBlobBLight]} />
          <View style={styles.heroInner}>
            <TouchableOpacity
              style={[styles.heroBack, isDark ? null : styles.heroBackLight]}
              onPress={() => navigation.navigate("Home")}
              activeOpacity={0.88}
            >
              <Ionicons name="arrow-back" size={18} color={isDark ? "#f8fafc" : ALCHEMY.brown} />
              <Text style={[styles.heroBackText, isDark ? null : styles.heroBackTextLight]}>Storefront</Text>
            </TouchableOpacity>
            <View style={styles.heroTitleRow}>
              <View style={[styles.heroShield, isDark ? null : styles.heroShieldLight]}>
                <Ionicons name="shield-checkmark" size={26} color={isDark ? c.primaryBright : ALCHEMY.brown} />
              </View>
              <View style={styles.heroTitleBlock}>
                <Text style={[styles.heroKicker, isDark ? null : styles.heroKickerLight]}>KankreG · Admin</Text>
                <Text style={[styles.heroTitle, isDark ? null : styles.heroTitleLight]}>Control center</Text>
                <Text style={[styles.heroSub, isDark ? null : styles.heroSubLight]}>
                  Catalog, orders, home view, coupons, and support — one premium dashboard.
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={[styles.mainCard, isDark ? null : styles.mainCardLight]}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator color={c.primary} size="large" />
              <Text style={styles.loaderHint}>Loading live stats…</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.sectionOverline, !isDark ? styles.sectionOverlineLight : null]}>Overview</Text>
              <View style={styles.statsRow}>
                <StatCard icon="cube-outline" label="Products" value={stats.products} />
                <StatCard icon="receipt-outline" label="Orders" value={stats.orders} />
                <StatCard icon="people-outline" label="Users" value={stats.users} />
                <StatCard icon="shield-checkmark-outline" label="Admins" value={stats.admins} />
                <StatCard
                  icon="hourglass-outline"
                  label="Pending"
                  value={stats.pendingOrders}
                  warnHighlight={stats.pendingOrders > 0}
                />
              </View>

              {MANAGE_SECTIONS.map((section) => (
                <View key={section.id} style={[adminModuleSection(isDark, c)]}>
                  <Text style={[styles.sectionLabel, !isDark ? styles.sectionLabelLight : null]}>{section.label}</Text>
                  {section.items.map((item) => (
                    <ActionRow
                      key={item.route}
                      title={item.title}
                      subtitle={item.subtitle}
                      icon={item.icon}
                      onPress={() => navigation.navigate(item.route)}
                    />
                  ))}
                </View>
              ))}

              <TouchableOpacity style={styles.refreshBtn} onPress={() => loadStats()} activeOpacity={0.9}>
                <Ionicons name="refresh" size={18} color={c.onPrimary} />
                <Text style={styles.refreshBtnText}>Refresh dashboard</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <AppFooter />
      </ScrollView>
    </CustomerScreenShell>
  );
}

function createAdminDashboardStyles(c, shadowLift, shadowPremium) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      width: "100%",
      alignSelf: "center",
      maxWidth: Platform.select({ web: layout.maxContentWidth, default: "100%" }),
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    hero: {
      borderRadius: radius.xxl,
      overflow: "hidden",
      marginBottom: spacing.lg,
      minHeight: 176,
      position: "relative",
      ...shadowPremium,
    },
    heroGoldHairline: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      backgroundColor: ALCHEMY.gold,
      opacity: 0.95,
      zIndex: 2,
    },
    heroBlobA: {
      position: "absolute",
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: "rgba(212,175,55,0.12)",
      top: -36,
      right: -24,
    },
    heroBlobB: {
      position: "absolute",
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: "rgba(52,211,153,0.14)",
      bottom: 20,
      left: -16,
    },
    heroBlobALight: {
      backgroundColor: "rgba(201, 162, 39, 0.14)",
    },
    heroBlobBLight: {
      backgroundColor: "rgba(116, 79, 28, 0.07)",
    },
    heroInner: {
      padding: spacing.lg,
      paddingVertical: spacing.xl,
    },
    heroBack: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
      marginBottom: spacing.md,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.22)",
      backgroundColor: "rgba(0,0,0,0.2)",
    },
    heroBackText: {
      color: "#f8fafc",
      fontSize: typography.caption,
      fontFamily: fonts.bold,
    },
    heroBackLight: {
      borderColor: ALCHEMY.pillInactive,
      backgroundColor: ALCHEMY.creamAlt,
    },
    heroBackTextLight: {
      color: ALCHEMY.brown,
    },
    heroTitleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md,
    },
    heroShield: {
      width: 52,
      height: 52,
      borderRadius: radius.lg,
      backgroundColor: "rgba(255,255,255,0.1)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    heroShieldLight: {
      backgroundColor: ALCHEMY.creamAlt,
      borderColor: ALCHEMY.pillInactive,
    },
    heroTitleBlock: {
      flex: 1,
      minWidth: 0,
    },
    heroKicker: {
      color: "rgba(248,250,252,0.85)",
      fontSize: typography.overline,
      fontFamily: fonts.bold,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: spacing.xs,
    },
    heroKickerLight: {
      color: ALCHEMY.brownMuted,
      fontFamily: FONT_DISPLAY_SEMI,
    },
    heroTitle: {
      color: "#f8fafc",
      fontSize: typography.h1,
      fontFamily: FONT_DISPLAY,
      letterSpacing: -0.5,
    },
    heroTitleLight: {
      color: ALCHEMY.brown,
    },
    heroSub: {
      marginTop: spacing.sm,
      color: "rgba(248,250,252,0.88)",
      fontSize: typography.bodySmall,
      fontFamily: fonts.regular,
      lineHeight: 20,
    },
    heroSubLight: {
      color: "#5C534A",
    },
    mainCard: {
      ...adminPanel(c, shadowPremium),
    },
    mainCardLight: {
      backgroundColor: ALCHEMY.cardBg,
      borderColor: ALCHEMY.pillInactive,
      borderTopColor: ALCHEMY.gold,
    },
    sectionOverline: {
      fontSize: typography.overline,
      fontFamily: fonts.bold,
      color: c.primary,
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: spacing.sm,
    },
    sectionOverlineLight: {
      color: ALCHEMY.brownMuted,
      fontFamily: FONT_DISPLAY_SEMI,
    },
    errorText: {
      color: c.danger,
      fontFamily: fonts.semibold,
      fontSize: typography.caption,
      marginBottom: spacing.sm,
    },
    loaderWrap: {
      paddingVertical: spacing.xl,
      alignItems: "center",
    },
    loaderHint: {
      marginTop: spacing.sm,
      color: c.textSecondary,
      fontSize: typography.caption,
      fontFamily: fonts.medium,
    },
    statsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    statCard: {
      flexGrow: 1,
      flexBasis: "30%",
      minWidth: 100,
      maxWidth: Platform.OS === "web" ? 160 : "47%",
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.lg,
      alignItems: "center",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xs,
    },
    statCardLight: {
      backgroundColor: ALCHEMY.creamAlt,
      borderColor: ALCHEMY.pillInactive,
    },
    statCardWarn: {
      borderColor: c.primaryBorder,
      backgroundColor: c.primarySoft,
    },
    statIconWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.primaryBorder,
      backgroundColor: c.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.xs,
    },
    statIconWrapLight: {
      borderColor: ALCHEMY.pillInactive,
      backgroundColor: ALCHEMY.creamDeep,
    },
    statValue: {
      color: c.primary,
      fontSize: typography.h2,
      fontFamily: fonts.extrabold,
    },
    statValueLight: {
      color: ALCHEMY.brown,
    },
    statLabel: {
      color: c.textSecondary,
      fontSize: typography.overline + 1,
      fontFamily: fonts.semibold,
      marginTop: 2,
      textAlign: "center",
    },
    sectionLabel: {
      fontSize: typography.caption,
      fontFamily: fonts.bold,
      color: c.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: spacing.sm,
    },
    sectionLabelLight: {
      color: ALCHEMY.brownMuted,
      fontFamily: FONT_DISPLAY_SEMI,
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      marginBottom: spacing.xs,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceMuted,
    },
    actionRowLight: {
      backgroundColor: ALCHEMY.creamAlt,
      borderColor: ALCHEMY.pillInactive,
    },
    actionIconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: c.primarySoft,
      borderWidth: 1,
      borderColor: c.primaryBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    actionIconWrapRowLight: {
      backgroundColor: ALCHEMY.creamDeep,
      borderColor: ALCHEMY.pillInactive,
    },
    actionTextCol: {
      flex: 1,
      minWidth: 0,
    },
    actionTitle: {
      color: c.textPrimary,
      fontFamily: fonts.bold,
      fontSize: typography.body,
    },
    actionTitleLight: {
      fontFamily: FONT_DISPLAY,
      color: ALCHEMY.brown,
    },
    actionSubtitle: {
      marginTop: 2,
      color: c.textSecondary,
      fontSize: typography.caption,
      fontFamily: fonts.regular,
      lineHeight: 18,
    },
    refreshBtn: {
      marginTop: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      backgroundColor: c.primary,
      borderRadius: radius.pill,
      paddingVertical: 14,
    },
    refreshBtnText: {
      color: c.onPrimary,
      fontFamily: fonts.bold,
      fontSize: typography.bodySmall,
    },
    deniedCard: {
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.border,
      borderLeftWidth: 3,
      borderLeftColor: c.accentGold,
      padding: spacing.xl,
      alignItems: "center",
      ...shadowLift,
    },
    deniedIconWrap: {
      marginBottom: spacing.md,
    },
    deniedTitle: {
      fontSize: typography.h2,
      fontFamily: fonts.extrabold,
      color: c.textPrimary,
      textAlign: "center",
    },
    deniedSub: {
      marginTop: spacing.sm,
      color: c.textSecondary,
      fontSize: typography.bodySmall,
      fontFamily: fonts.regular,
      textAlign: "center",
      marginBottom: spacing.lg,
    },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: c.primary,
      paddingVertical: 12,
      paddingHorizontal: spacing.xl,
      borderRadius: radius.pill,
    },
    primaryBtnText: {
      color: c.onPrimary,
      fontFamily: fonts.bold,
      fontSize: typography.bodySmall,
    },
  });
}
