import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
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
import MotionScrollView from "../../components/motion/MotionScrollView";
import { adminInnerPageScrollContent, customerScrollFill } from "../../theme/screenLayout";
import { ADMIN_MANAGE_SECTIONS as MANAGE_SECTIONS } from "../../constants/adminNav";
import { fonts, layout, semanticRadius, spacing, typography } from "../../theme/tokens";
import PremiumLoader from "../../components/ui/PremiumLoader";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumCard from "../../components/ui/PremiumCard";
import PremiumStatCard from "../../components/ui/PremiumStatCard";
import AdminBackLink from "../../components/admin/AdminBackLink";
import AdminPageHeading from "../../components/admin/AdminPageHeading";

/** Group icon shown on each collapsible admin module header. */
const SECTION_GROUP_ICONS = {
  catalog: "library-outline",
  orders: "people-circle-outline",
  growth: "megaphone-outline",
  insights: "sparkles-outline",
};

export default function AdminDashboardScreen({ navigation }) {
  const { colors: c, shadowLift, shadowPremium, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createAdminDashboardStyles(c, shadowLift, shadowPremium, isDark),
    [c, shadowLift, shadowPremium, isDark]
  );
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
  const [openSections, setOpenSections] = useState(() =>
    Object.fromEntries(MANAGE_SECTIONS.map((s) => [s.id, true]))
  );

  const toggleSection = useCallback((id) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const setAllSectionsOpen = useCallback((open) => {
    setOpenSections(Object.fromEntries(MANAGE_SECTIONS.map((s) => [s.id, open])));
  }, []);

  const heroGradient = useMemo(
    () =>
      isDark
        ? [c.background, c.surfaceMuted, c.surfaceElevated ?? c.surface]
        : [ALCHEMY.creamAlt, c.surface, c.backgroundGradientEnd],
    [isDark, c]
  );

  function StatCard({ icon, label, value, warnHighlight }) {
    return (
      <PremiumStatCard
        compact
        align="center"
        iconName={icon}
        label={label}
        value={String(value)}
        tone={warnHighlight ? "rose" : "gold"}
        style={styles.statPremiumTile}
      />
    );
  }

  function ActionRow({ title, subtitle, icon, onPress, isLast }) {
    return (
      <TouchableOpacity
        style={[
          styles.actionRow,
          !isDark ? styles.actionRowLight : null,
          isLast ? styles.actionRowLast : null,
        ]}
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

  function ManageSectionBlock({ section }) {
    const open = openSections[section.id] !== false;
    const groupIcon = SECTION_GROUP_ICONS[section.id] || "folder-outline";
    return (
      <View style={[adminModuleSection(isDark, c), styles.manageSectionWrap]}>
        <Pressable
          onPress={() => toggleSection(section.id)}
          style={({ pressed }) => [
            styles.sectionHeaderRow,
            !isDark ? styles.sectionHeaderRowLight : null,
            pressed ? styles.sectionHeaderPressed : null,
          ]}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${section.label}, ${section.items.length} tools. ${open ? "Collapse" : "Expand"}`}
        >
          <View style={[styles.sectionHeaderIcon, !isDark ? styles.sectionHeaderIconLight : null]}>
            <Ionicons name={groupIcon} size={22} color={isDark ? c.primaryBright : ALCHEMY.brown} />
          </View>
          <View style={styles.sectionHeaderTextCol}>
            <Text style={[styles.sectionHeaderTitle, !isDark ? styles.sectionHeaderTitleLight : null]}>
              {section.label}
            </Text>
            <Text style={styles.sectionHeaderMeta}>
              {section.items.length} {section.items.length === 1 ? "shortcut" : "shortcuts"}
            </Text>
          </View>
          <View
            style={[
              styles.sectionBadge,
              section.id === "orders" && stats.pendingOrders > 0 ? styles.sectionBadgeHot : null,
            ]}
          >
            <Text style={styles.sectionBadgeText}>{section.items.length}</Text>
          </View>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={22} color={c.textMuted} />
        </Pressable>
        {open ? (
          <View style={styles.sectionBody}>
            {section.items.map((item, idx) => (
              <ActionRow
                key={item.route}
                title={item.title}
                subtitle={item.subtitle}
                icon={item.icon}
                onPress={() => navigation.navigate(item.route)}
                isLast={idx === section.items.length - 1}
              />
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  const quickActions = useMemo(
    () => [
      {
        route: "AdminOrders",
        label: "Orders",
        icon: "receipt-outline",
        badge: stats.pendingOrders,
      },
      { route: "AdminProducts", label: "Products", icon: "cube-outline", badge: null },
      { route: "AdminAnalytics", label: "Analytics", icon: "bar-chart-outline", badge: null },
      { route: "AdminNotifications", label: "Notify", icon: "notifications-outline", badge: null },
    ],
    [stats.pendingOrders]
  );

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
  }, [user, user?.isAdmin, loadStats]);

  if (user && !user.isAdmin) {
    return (
      <CustomerScreenShell style={styles.screen} variant="admin">
        <MotionScrollView
          style={customerScrollFill}
          contentContainerStyle={adminInnerPageScrollContent(insets)}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.deniedCard}>
            <PremiumErrorBanner
              severity="warning"
              title="Admin access required"
              message="This account does not have admin privileges."
            />
            <PremiumButton
              label="Back to home"
              iconLeft="home-outline"
              variant="primary"
              size="md"
              onPress={() => navigation.navigate("Home")}
              style={styles.deniedCta}
            />
          </View>
        </MotionScrollView>
      </CustomerScreenShell>
    );
  }

  return (
    <CustomerScreenShell style={styles.screen} variant="admin">
      <MotionScrollView
        style={customerScrollFill}
        contentContainerStyle={adminInnerPageScrollContent(insets)}
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
            <AdminBackLink navigation={navigation} label="Storefront" target="Home" />
            <AdminPageHeading
              title="Control center"
              subtitle="Catalog, orders, users, and analytics."
            />
          </View>
        </LinearGradient>

        <View style={[styles.mainCard, isDark ? null : styles.mainCardLight]}>
          {error ? (
            <View style={styles.bannerSpacer}>
              <PremiumErrorBanner severity="error" message={error} compact />
            </View>
          ) : null}

          {loading ? (
            <View style={styles.loaderWrap}>
              <PremiumLoader size="md" caption="Loading live stats…" hint="Pull to refresh." />
            </View>
          ) : (
            <>
              <View style={styles.overviewHeaderRow}>
                <Text style={[styles.sectionOverline, !isDark ? styles.sectionOverlineLight : null]}>Overview</Text>
                <View style={styles.expandToggleRow}>
                  <PremiumButton
                    label="Expand all"
                    iconLeft="expand-outline"
                    variant="ghost"
                    size="sm"
                    onPress={() => setAllSectionsOpen(true)}
                  />
                  <PremiumButton
                    label="Collapse all"
                    iconLeft="contract-outline"
                    variant="subtle"
                    size="sm"
                    onPress={() => setAllSectionsOpen(false)}
                  />
                </View>
              </View>

              {Platform.OS === "web" ? (
                <View style={styles.statsRowWrap}>
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
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.statsScrollInner}
                  style={styles.statsScroll}
                >
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
                </ScrollView>
              )}

              <Text style={[styles.quickOverline, !isDark ? styles.sectionOverlineLight : null]}>Quick open</Text>
              {Platform.OS === "web" ? (
                <View style={styles.quickGrid}>
                  {quickActions.map((qa) => (
                    <PremiumCard
                      key={qa.route}
                      interactive
                      padding="md"
                      variant="muted"
                      onPress={() => navigation.navigate(qa.route)}
                      accessibilityLabel={`Open ${qa.label}`}
                      style={[styles.quickTileCard, styles.quickTileCardWeb, !isDark ? styles.quickTileCardLight : null]}
                    >
                      <View style={[styles.quickIconWrap, !isDark ? styles.quickIconWrapLight : null]}>
                        <Ionicons name={qa.icon} size={22} color={isDark ? c.primary : ALCHEMY.brown} />
                        {qa.badge != null && qa.badge > 0 ? (
                          <View style={styles.quickBadge}>
                            <Text style={styles.quickBadgeText}>{qa.badge > 99 ? "99+" : qa.badge}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={[styles.quickLabel, !isDark ? styles.quickLabelLight : null]} numberOfLines={1}>
                        {qa.label}
                      </Text>
                    </PremiumCard>
                  ))}
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.quickScrollInner}
                  style={styles.quickScroll}
                >
                  {quickActions.map((qa) => (
                    <PremiumCard
                      key={qa.route}
                      interactive
                      padding="md"
                      variant="muted"
                      onPress={() => navigation.navigate(qa.route)}
                      accessibilityLabel={`Open ${qa.label}`}
                      style={[styles.quickTileCard, !isDark ? styles.quickTileCardLight : null]}
                    >
                      <View style={[styles.quickIconWrap, !isDark ? styles.quickIconWrapLight : null]}>
                        <Ionicons name={qa.icon} size={22} color={isDark ? c.primary : ALCHEMY.brown} />
                        {qa.badge != null && qa.badge > 0 ? (
                          <View style={styles.quickBadge}>
                            <Text style={styles.quickBadgeText}>{qa.badge > 99 ? "99+" : qa.badge}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={[styles.quickLabel, !isDark ? styles.quickLabelLight : null]} numberOfLines={1}>
                        {qa.label}
                      </Text>
                    </PremiumCard>
                  ))}
                </ScrollView>
              )}

              <Text style={[styles.modulesOverline, !isDark ? styles.sectionOverlineLight : null]}>All tools by area</Text>
              <Text style={styles.modulesHint}>Tap a section header to expand or collapse.</Text>

              {MANAGE_SECTIONS.map((section) => (
                <ManageSectionBlock key={section.id} section={section} />
              ))}

              <View style={styles.footerActions}>
                <PremiumButton
                  label="Refresh stats"
                  iconLeft="refresh-outline"
                  variant="primary"
                  size="md"
                  onPress={() => loadStats()}
                  style={styles.refreshBtn}
                />
              </View>
            </>
          )}
        </View>

        <AppFooter />
      </MotionScrollView>
    </CustomerScreenShell>
  );
}

function createAdminDashboardStyles(c, shadowLift, shadowPremium, isDark) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      width: "100%",
      alignSelf: "center",
      maxWidth: Platform.select({ web: layout.maxContentWidth + 96, default: "100%" }),
    },
    hero: {
      borderRadius: semanticRadius.panel,
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
      backgroundColor: c.primary,
      opacity: 0.95,
      zIndex: 2,
    },
    heroBlobA: {
      position: "absolute",
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: isDark ? "rgba(248,113,113,0.14)" : "rgba(220,38,38,0.12)",
      top: -36,
      right: -24,
    },
    heroBlobB: {
      position: "absolute",
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: isDark ? "rgba(96,165,250,0.12)" : "rgba(37,99,235,0.1)",
      bottom: 20,
      left: -16,
    },
    heroBlobALight: {
      backgroundColor: "rgba(185, 28, 28, 0.14)",
    },
    heroBlobBLight: {
      backgroundColor: "rgba(63, 63, 70, 0.07)",
    },
    heroInner: {
      padding: Platform.select({ web: spacing.xl, default: spacing.lg }),
      paddingVertical: Platform.select({ web: spacing.xl + 4, default: spacing.xl }),
    },
    heroBack: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
      marginBottom: spacing.md,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: semanticRadius.full,
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
      backgroundColor: c.frostTint || ALCHEMY.creamAlt,
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
      borderRadius: semanticRadius.control,
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
      maxWidth: 720,
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
      maxWidth: 560,
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
      borderTopColor: c.primary,
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
    overviewHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      marginBottom: spacing.sm,
      flexWrap: "wrap",
    },
    expandToggleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    expandChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: spacing.sm,
      borderRadius: semanticRadius.full,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surfaceMuted,
    },
    expandChipText: {
      fontSize: typography.caption,
      fontFamily: fonts.semibold,
    },
    quickOverline: {
      fontSize: typography.overline,
      fontFamily: fonts.bold,
      color: c.primary,
      letterSpacing: 1,
      textTransform: "uppercase",
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    quickScroll: {
      marginHorizontal: -4,
      marginBottom: spacing.lg,
    },
    quickScrollInner: {
      flexDirection: "row",
      gap: spacing.sm,
      paddingHorizontal: 4,
      paddingBottom: 2,
    },
    quickTileCard: {
      width: 116,
      minHeight: 116,
      alignItems: "center",
      justifyContent: "center",
    },
    quickTileCardWeb: {
      width: "auto",
      minWidth: 150,
      flex: 1,
    },
    quickTileCardLight: {
      opacity: 1,
    },
    quickIconWrap: {
      position: "relative",
      width: 48,
      height: 48,
      borderRadius: semanticRadius.control,
      backgroundColor: c.primarySoft,
      borderWidth: 1,
      borderColor: c.primaryBorder,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.xs,
    },
    quickIconWrapLight: {
      backgroundColor: ALCHEMY.creamDeep,
      borderColor: ALCHEMY.pillInactive,
    },
    quickBadge: {
      position: "absolute",
      top: -6,
      right: -6,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: c.danger,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
      borderWidth: 2,
      borderColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt,
    },
    quickBadgeText: {
      color: "#fff",
      fontSize: 10,
      fontFamily: fonts.extrabold,
    },
    quickLabel: {
      fontSize: typography.caption,
      fontFamily: fonts.bold,
      color: c.textPrimary,
      textAlign: "center",
    },
    quickLabelLight: {
      color: ALCHEMY.brown,
      fontFamily: FONT_DISPLAY_SEMI,
    },
    quickGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    modulesOverline: {
      fontSize: typography.overline,
      fontFamily: fonts.bold,
      color: c.primary,
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: spacing.xs,
    },
    modulesHint: {
      fontSize: typography.caption,
      fontFamily: fonts.regular,
      color: c.textSecondary,
      marginBottom: spacing.md,
      lineHeight: 18,
      maxWidth: 560,
    },
    manageSectionWrap: {
      marginBottom: spacing.lg,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      marginHorizontal: -spacing.sm - 4,
      marginTop: -spacing.sm,
      borderRadius: semanticRadius.card,
    },
    sectionHeaderRowLight: {},
    sectionHeaderPressed: {
      opacity: Platform.OS === "web" ? 0.92 : 0.88,
    },
    sectionHeaderIcon: {
      width: 44,
      height: 44,
      borderRadius: semanticRadius.control,
      backgroundColor: "rgba(255,255,255,0.08)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.12)",
      alignItems: "center",
      justifyContent: "center",
    },
    sectionHeaderIconLight: {
      backgroundColor: ALCHEMY.creamDeep,
      borderColor: ALCHEMY.pillInactive,
    },
    sectionHeaderTextCol: {
      flex: 1,
      minWidth: 0,
    },
    sectionHeaderTitle: {
      color: c.textPrimary,
      fontFamily: fonts.bold,
      fontSize: typography.body,
    },
    sectionHeaderTitleLight: {
      fontFamily: FONT_DISPLAY,
      color: ALCHEMY.brown,
    },
    sectionHeaderMeta: {
      marginTop: 2,
      fontSize: typography.caption,
      fontFamily: fonts.regular,
      color: c.textSecondary,
    },
    sectionBadge: {
      minWidth: 28,
      height: 28,
      paddingHorizontal: 8,
      borderRadius: semanticRadius.full,
      backgroundColor: c.primarySoft,
      borderWidth: 1,
      borderColor: c.primaryBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    sectionBadgeHot: {
      borderWidth: 2,
      borderColor: c.danger,
    },
    sectionBadgeText: {
      fontSize: typography.caption,
      fontFamily: fonts.extrabold,
      color: c.primary,
    },
    sectionBody: {
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      marginTop: spacing.xs,
    },
    footerActions: {
      marginTop: spacing.md,
      alignItems: "stretch",
    },
    bannerSpacer: {
      marginBottom: spacing.sm,
    },
    loaderWrap: {
      paddingVertical: spacing.xl,
      alignItems: "center",
    },
    statsRowWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    statsScroll: {
      marginBottom: spacing.lg,
      marginHorizontal: -4,
    },
    statsScrollInner: {
      flexDirection: "row",
      gap: spacing.sm,
      paddingHorizontal: 4,
      paddingBottom: 2,
    },
    statPremiumTile: {
      flexGrow: 1,
      flexBasis: "30%",
      minWidth: 108,
      flexShrink: 0,
      maxWidth: Platform.OS === "web" ? 168 : 140,
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
      marginBottom: spacing.sm,
      borderRadius: semanticRadius.control,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceMuted,
      ...Platform.select({
        web: {
          boxShadow: "0 8px 18px rgba(24, 24, 27, 0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
          transition: "background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
        },
        default: {},
      }),
    },
    actionRowLast: {
      marginBottom: 0,
    },
    actionRowLight: {
      backgroundColor: ALCHEMY.creamAlt,
      borderColor: ALCHEMY.pillInactive,
    },
    actionIconWrap: {
      width: 44,
      height: 44,
      borderRadius: semanticRadius.control,
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
      paddingVertical: spacing.md,
    },
    refreshBtnText: {
      color: c.onPrimary,
      fontFamily: fonts.bold,
      fontSize: typography.bodySmall,
    },
    deniedCard: {
      backgroundColor: c.surface,
      borderRadius: semanticRadius.card,
      borderWidth: 1,
      borderColor: c.border,
      borderLeftWidth: 3,
      borderLeftColor: c.accentGold,
      padding: spacing.xl,
      alignItems: "stretch",
      ...shadowLift,
    },
    deniedCta: {
      marginTop: spacing.md,
      alignSelf: "center",
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
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
    },
    primaryBtnText: {
      color: c.onPrimary,
      fontFamily: fonts.bold,
      fontSize: typography.bodySmall,
    },
  });
}
