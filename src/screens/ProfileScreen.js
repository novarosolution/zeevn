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
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppFooter from "../components/AppFooter";
import BottomNavBar from "../components/BottomNavBar";
import AuthGateShell from "../components/AuthGateShell";
import CustomerScreenShell from "../components/CustomerScreenShell";
import ScreenPageHeader from "../components/ScreenPageHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { resetNavigationToHome } from "../navigation/resetToHome";
import { fetchMyNotifications, fetchMyOrders, fetchUserProfile } from "../services/userService";
import { customerPageScrollBase, customerScrollFill } from "../theme/screenLayout";
import { ALCHEMY, FONT_DISPLAY, FONT_DISPLAY_SEMI } from "../theme/customerAlchemy";
import { fonts, radius, spacing, typography } from "../theme/tokens";
import { BRAND_LOGO_SIZE } from "../constants/brand";
import BrandLogo from "../components/BrandLogo";

export default function ProfileScreen({ navigation }) {
  const { colors: c, shadowPremium, shadowLift, isDark } = useTheme();
  const styles = useMemo(
    () => createProfileStyles(c, shadowPremium, shadowLift, isDark),
    [c, shadowPremium, shadowLift, isDark]
  );
  const { isAuthenticated, token, user, logout, isAuthLoading } = useAuth();
  const insets = useSafeAreaInsets();

  const profileHeroGradient = useMemo(
    () =>
      isDark
        ? [c.surfaceMuted, "#1E1A16", "#152A22"]
        : [ALCHEMY.creamAlt, ALCHEMY.cardBg, ALCHEMY.creamDeep],
    [isDark, c.surfaceMuted]
  );

  function ProfileSection({ title, first, children }) {
    return (
      <View style={[styles.sectionCard, first ? styles.sectionCardFirst : null]}>
        <View style={[styles.sectionCardHead, isDark ? styles.sectionCardHeadBgDark : styles.sectionCardHeadBgLight]}>
          <View style={[styles.sectionCardHeadAccent, { backgroundColor: isDark ? c.primary : ALCHEMY.gold }]} />
          <Text style={[styles.sectionCardTitle, { color: c.textSecondary }]}>{title}</Text>
        </View>
        <View style={styles.sectionCardBody}>{children}</View>
      </View>
    );
  }

  function StatCard({ icon, value, label }) {
    return (
      <View style={styles.statCard}>
        <View style={styles.statCardIconBadge}>
          <Ionicons name={icon} size={15} color={isDark ? c.primaryDark : ALCHEMY.brown} />
        </View>
        <Text style={styles.statCardValue} numberOfLines={1}>
          {value}
        </Text>
        <Text style={styles.statCardLabel}>{label}</Text>
      </View>
    );
  }
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [hasAddress, setHasAddress] = useState(false);

  const loadProfile = useCallback(
    async ({ silent } = {}) => {
      try {
        if (!silent) setLoading(true);
        setError("");
        const [profile, myOrders, myNotifications] = await Promise.all([
          fetchUserProfile(token),
          fetchMyOrders(token),
          fetchMyNotifications(token),
        ]);
        setName(profile.name || "");
        setPhone(profile.phone || "");
        setAvatarUrl((profile.avatar || "").trim());
        setHasAddress(Boolean(profile.defaultAddress?.line1));
        setOrders(myOrders);
        setNotifications(myNotifications);
      } catch (err) {
        setError(err.message || "Unable to load profile data.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return;
    loadProfile();
  }, [isAuthLoading, isAuthenticated, loadProfile]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadProfile({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadProfile]);

  const deliveredOrders = orders.filter((item) => item.status === "delivered").length;
  const unreadNotifications = notifications.filter((item) => !item.isRead).length;

  if (isAuthLoading) {
    return <AuthGateShell />;
  }
  if (!isAuthenticated) {
    return <AuthGateShell signedOut navigation={navigation} />;
  }

  return (
    <CustomerScreenShell style={styles.screen}>
      <ScrollView
        style={customerScrollFill}
        contentContainerStyle={[
          customerPageScrollBase,
          {
            paddingTop: Math.max(insets.top, Platform.OS === "web" ? spacing.md : spacing.sm),
            paddingBottom: Platform.OS === "web" ? spacing.xxl : 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={c.primary}
            colors={[c.primary]}
          />
        }
      >
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={c.primary} />
            <Text style={styles.loaderHint}>Loading your account…</Text>
          </View>
        ) : (
          <>
          <ScreenPageHeader
            navigation={navigation}
            title="Account"
            subtitle="Your orders, address & preferences"
            showBack={false}
            showBrand={false}
            right={
              <TouchableOpacity
                onPress={() => navigation.navigate("Settings")}
                style={styles.headerIconBtn}
                hitSlop={12}
                accessibilityLabel="Open settings"
              >
                <Ionicons name="settings-outline" size={20} color={c.primaryDark} />
              </TouchableOpacity>
            }
          />

          <View style={styles.heroCardOuter}>
            <LinearGradient
              colors={profileHeroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroCardTop}>
                <View style={styles.heroBrandRow}>
                  <BrandLogo width={BRAND_LOGO_SIZE.headerCompact} height={BRAND_LOGO_SIZE.headerCompact} style={styles.heroMiniLogo} />
                  <Text style={styles.heroKicker}>Your profile</Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate("EditProfile")}
                  style={[styles.heroEditChip, !isDark && styles.heroEditChipWarm]}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Edit profile"
                >
                  <Ionicons name="create-outline" size={14} color="#FFFCF8" />
                  <Text style={styles.heroEditChipText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.heroRow}>
                <TouchableOpacity
                  onPress={() => navigation.navigate("EditProfile")}
                  style={styles.avatarRing}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Change profile photo"
                >
                  <View style={styles.avatarWrap}>
                    {(avatarUrl || user?.avatar || "").trim() ? (
                      <Image
                        source={{ uri: (avatarUrl || user?.avatar || "").trim() }}
                        style={styles.avatarImage}
                        contentFit="cover"
                      />
                    ) : (
                      <Ionicons name="person" size={34} color={c.textMuted} />
                    )}
                  </View>
                </TouchableOpacity>
                <View style={styles.heroTextWrap}>
                  <Text style={styles.heroTitle} numberOfLines={2}>
                    {(name || user?.name || "").trim() || "Welcome"}
                  </Text>
                  <View style={[styles.heroAccent, { backgroundColor: isDark ? c.primary : ALCHEMY.gold }]} />
                  {user?.email ? (
                    <View style={styles.heroMetaRow}>
                      <Ionicons name="mail-outline" size={14} color={c.textSecondary} />
                      <Text style={styles.heroEmail} numberOfLines={1}>
                        {user.email}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.heroMetaRow}>
                    <Ionicons name="call-outline" size={14} color={c.textSecondary} />
                    <Text style={styles.heroSubtitle} numberOfLines={2}>
                      {(phone || user?.phone || "").trim() || "Add phone in Edit profile"}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.heroStats}>
                <StatCard icon="receipt-outline" value={String(orders.length)} label="Orders" />
                <StatCard icon="checkmark-circle-outline" value={String(deliveredOrders)} label="Delivered" />
                <StatCard icon="notifications-outline" value={String(unreadNotifications)} label="Unread" />
              </View>
            </LinearGradient>
          </View>

          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

          <ProfileSection title="Account" first>
            <TouchableOpacity
              style={styles.groupRow}
              onPress={() => navigation.navigate("EditProfile")}
              activeOpacity={0.88}
            >
              <View style={[styles.actionIconWrap, styles.actionIconWrapPrimary]}>
                <MaterialCommunityIcons name="account-edit-outline" size={21} color={c.primaryDark} />
              </View>
              <View style={styles.actionTextCol}>
                <Text style={styles.actionTitle}>Edit profile</Text>
                <Text style={styles.actionSub}>Name, phone & photo</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
            </TouchableOpacity>
            <View style={styles.groupDivider} />
            <TouchableOpacity
              style={styles.groupRow}
              onPress={() => navigation.navigate("ManageAddress")}
              activeOpacity={0.88}
            >
              <View style={[styles.actionIconWrap, styles.actionIconWrapSecondary]}>
                <Ionicons name="location-outline" size={20} color={c.secondaryDark} />
              </View>
              <View style={styles.actionTextCol}>
                <Text style={styles.actionTitle}>Delivery address</Text>
                <Text style={styles.actionSub}>{hasAddress ? "Saved on file" : "Add where we deliver"}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
            </TouchableOpacity>
          </ProfileSection>

          <ProfileSection title="Activity">
            <TouchableOpacity style={styles.activityRow} onPress={() => navigation.navigate("MyOrders")} activeOpacity={0.88}>
              <View style={[styles.activityIconWrap, styles.activityIconWrapOrders]}>
                <Ionicons name="bag-handle-outline" size={20} color={c.primaryDark} />
              </View>
              <View style={styles.activityTextCol}>
                <Text style={styles.activityTitle}>My orders</Text>
                <Text style={styles.activityMeta}>
                  {orders.length} {orders.length === 1 ? "order" : "orders"} in your history
                </Text>
              </View>
              <Text style={styles.activityCta}>View all</Text>
              <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
            </TouchableOpacity>
            <View style={styles.groupDivider} />
            <TouchableOpacity
              style={styles.activityRow}
              onPress={() => navigation.navigate("Notifications")}
              activeOpacity={0.88}
            >
              <View style={[styles.activityIconWrap, styles.activityIconWrapBell]}>
                <Ionicons name="notifications-outline" size={20} color={c.secondaryDark} />
              </View>
              <View style={styles.activityTextCol}>
                <Text style={styles.activityTitle}>Notifications</Text>
                <Text style={styles.activityMeta}>Offers & order updates</Text>
              </View>
              <View style={styles.linkRowRight}>
                {unreadNotifications > 0 ? (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{unreadNotifications}</Text>
                  </View>
                ) : null}
                <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
              </View>
            </TouchableOpacity>
          </ProfileSection>

          <ProfileSection title="Help">
            <View style={styles.helpTilesRow}>
              <TouchableOpacity
                style={styles.helpTile}
                onPress={() => navigation.navigate("Settings")}
                activeOpacity={0.88}
              >
                <View style={[styles.quickIconCircle, styles.quickIconCircleSettings]}>
                  <Ionicons name="settings-outline" size={22} color={c.primaryDark} />
                </View>
                <Text style={styles.helpTileTitle}>Settings</Text>
                <Text style={styles.helpTileSub}>App & notifications</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.helpTile} onPress={() => navigation.navigate("Support")} activeOpacity={0.88}>
                <View style={[styles.quickIconCircle, styles.quickIconCircleSupport]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={22} color={c.secondaryDark} />
                </View>
                <Text style={styles.helpTileTitle}>Support</Text>
                <Text style={styles.helpTileSub}>Help & contact</Text>
              </TouchableOpacity>
            </View>
          </ProfileSection>

          {user?.isAdmin ? (
            <TouchableOpacity
              style={styles.adminRow}
              onPress={() => navigation.navigate("AdminDashboard")}
              activeOpacity={0.9}
            >
              <View style={styles.adminIconWrap}>
                <Ionicons name="shield-checkmark" size={18} color={c.textSecondary} />
              </View>
              <Text style={styles.adminRowText}>Admin dashboard</Text>
              <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.logoutFull}
            onPress={async () => {
              await logout();
              resetNavigationToHome(navigation);
            }}
            activeOpacity={0.88}
          >
            <Ionicons name="log-out-outline" size={20} color={c.danger} />
            <Text style={styles.logoutFullText}>Log out</Text>
          </TouchableOpacity>
          </>
        )}
        <AppFooter />
      </ScrollView>
      <BottomNavBar />
    </CustomerScreenShell>
  );
}

function createProfileStyles(c, shadowPremium, shadowLift, isDark) {
  const surfaceCard = isDark ? c.surface : ALCHEMY.cardBg;
  const hairline = isDark ? c.border : ALCHEMY.pillInactive;
  return StyleSheet.create({
    screen: {
      flex: 1,
    },
    loaderWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 200,
      gap: spacing.md,
    },
    loaderHint: {
      fontSize: typography.bodySmall,
      fontFamily: fonts.medium,
      color: c.textSecondary,
    },
    linkRowRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    unreadBadge: {
      minWidth: 24,
      height: 24,
      borderRadius: 12,
      paddingHorizontal: 7,
      backgroundColor: c.primarySoft,
      borderWidth: 1,
      borderColor: c.primaryBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    unreadBadgeText: {
      color: c.primaryDark,
      fontSize: typography.caption,
      fontFamily: fonts.extrabold,
    },
    sectionCard: {
      marginBottom: spacing.md,
      borderRadius: radius.xl,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: hairline,
      borderTopWidth: 2,
      borderTopColor: isDark ? c.primaryBorder : ALCHEMY.gold,
      backgroundColor: surfaceCard,
      ...shadowPremium,
    },
    sectionCardFirst: {
      marginTop: spacing.xs,
    },
    sectionCardHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: hairline,
    },
    sectionCardHeadBgLight: {
      backgroundColor: ALCHEMY.creamAlt,
    },
    sectionCardHeadBgDark: {
      backgroundColor: "rgba(255,255,255,0.05)",
    },
    sectionCardHeadAccent: {
      width: 3,
      height: 16,
      borderRadius: 2,
      opacity: 0.95,
    },
    sectionCardTitle: {
      fontSize: 12,
      fontFamily: fonts.bold,
      letterSpacing: 0.85,
      textTransform: "uppercase",
    },
    sectionCardBody: {
      paddingBottom: 2,
    },
    groupRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      minHeight: 50,
      paddingVertical: 13,
      paddingHorizontal: spacing.md,
    },
    groupDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
      marginLeft: spacing.md + 44 + spacing.md,
    },
    activityRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      minHeight: 52,
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
    },
    activityIconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    activityIconWrapOrders: {
      backgroundColor: c.primarySoft,
      borderWidth: 1,
      borderColor: c.primaryBorder,
    },
    activityIconWrapBell: {
      backgroundColor: c.secondarySoft,
      borderWidth: 1,
      borderColor: c.secondaryBorder,
    },
    activityTextCol: {
      flex: 1,
      minWidth: 0,
    },
    activityTitle: {
      fontSize: typography.body,
      fontFamily: FONT_DISPLAY,
      color: c.textPrimary,
      letterSpacing: -0.25,
    },
    activityMeta: {
      marginTop: 3,
      fontSize: typography.caption,
      fontFamily: fonts.medium,
      color: c.textMuted,
    },
    activityCta: {
      flexShrink: 0,
      fontSize: typography.caption,
      fontFamily: fonts.bold,
      color: c.primary,
    },
    helpTilesRow: {
      flexDirection: "row",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    helpTile: {
      flex: 1,
      minWidth: 0,
      alignItems: "center",
      gap: spacing.xs,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: hairline,
      backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt,
    },
    helpTileTitle: {
      fontSize: typography.bodySmall,
      fontFamily: fonts.bold,
      color: c.textPrimary,
      textAlign: "center",
    },
    helpTileSub: {
      marginTop: 4,
      fontSize: 11,
      fontFamily: fonts.medium,
      color: c.textMuted,
      textAlign: "center",
    },
    quickIconCircle: {
      width: 48,
      height: 48,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    quickIconCircleSettings: {
      backgroundColor: c.primarySoft,
      borderWidth: 1,
      borderColor: c.primaryBorder,
    },
    quickIconCircleSupport: {
      backgroundColor: c.secondarySoft,
      borderWidth: 1,
      borderColor: c.secondaryBorder,
    },
    adminRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      marginBottom: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: surfaceCard,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: hairline,
      borderTopWidth: 2,
      borderTopColor: isDark ? c.primaryBorder : ALCHEMY.gold,
      borderRadius: radius.xl,
      ...shadowPremium,
    },
    adminIconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    adminRowText: {
      flex: 1,
      fontSize: typography.body,
      fontFamily: fonts.bold,
      color: c.textPrimary,
    },
    logoutFull: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingVertical: 16,
      marginBottom: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: "rgba(220, 38, 38, 0.35)",
      backgroundColor: c.surfaceMuted,
    },
    logoutFullText: {
      fontSize: typography.body,
      fontFamily: fonts.bold,
      color: c.danger,
    },
    heroCardOuter: {
      marginBottom: spacing.md,
      borderRadius: radius.xl,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: hairline,
      borderTopWidth: 2,
      borderTopColor: isDark ? c.primaryBorder : ALCHEMY.gold,
      ...shadowPremium,
    },
    heroGradient: {
      padding: spacing.lg,
      paddingBottom: spacing.lg + 2,
    },
    heroCardTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.md,
    },
    heroBrandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      flex: 1,
      minWidth: 0,
    },
    heroMiniLogo: {
      flexShrink: 0,
    },
    heroKicker: {
      fontSize: typography.overline,
      fontFamily: FONT_DISPLAY_SEMI,
      color: c.textMuted,
      letterSpacing: 1.4,
      textTransform: "uppercase",
    },
    heroEditChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: radius.pill,
      backgroundColor: c.primary,
      borderWidth: 1,
      borderColor: c.primaryDark,
    },
    heroEditChipWarm: {
      backgroundColor: ALCHEMY.brown,
      borderColor: ALCHEMY.brownMuted,
    },
    heroEditChipText: {
      fontSize: typography.caption,
      fontFamily: fonts.bold,
      color: "#FFFCF8",
    },
    heroRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    avatarRing: {
      padding: 4,
      borderRadius: 22,
      backgroundColor: surfaceCard,
      borderWidth: 2,
      borderColor: isDark ? c.primaryBright : ALCHEMY.gold,
      ...Platform.select({
        ios: {
          shadowColor: c.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.22,
          shadowRadius: 8,
        },
        android: { elevation: 4 },
        default: {},
      }),
    },
    avatarWrap: {
      width: 82,
      height: 82,
      borderRadius: 18,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.border,
    },
    avatarImage: {
      width: "100%",
      height: "100%",
    },
    heroTextWrap: {
      flex: 1,
      minWidth: 0,
    },
    heroTitle: {
      color: c.textPrimary,
      fontSize: typography.h2,
      fontFamily: FONT_DISPLAY,
      letterSpacing: -0.35,
    },
    heroAccent: {
      width: 48,
      height: 3,
      borderRadius: radius.pill,
      marginTop: 8,
      marginBottom: 10,
      opacity: 0.9,
    },
    heroMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 4,
      minWidth: 0,
    },
    heroEmail: {
      flex: 1,
      color: c.textSecondary,
      fontSize: typography.caption,
      fontFamily: fonts.medium,
    },
    heroSubtitle: {
      flex: 1,
      color: c.textSecondary,
      fontSize: typography.bodySmall,
      fontFamily: fonts.regular,
      lineHeight: 20,
    },
    heroStats: {
      marginTop: spacing.lg,
      flexDirection: "row",
      gap: spacing.sm,
    },
    statCard: {
      flex: 1,
      minHeight: 92,
      justifyContent: "center",
      backgroundColor: isDark ? c.surface : ALCHEMY.creamAlt,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: hairline,
      borderTopWidth: 2,
      borderTopColor: isDark ? c.primaryBorder : ALCHEMY.gold,
      padding: spacing.md,
      ...shadowLift,
    },
    statCardIconBadge: {
      width: 28,
      height: 28,
      borderRadius: radius.pill,
      backgroundColor: c.primarySoft,
      borderWidth: 1,
      borderColor: c.primaryBorder,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.xs,
    },
    statCardValue: {
      fontSize: 22,
      fontFamily: fonts.extrabold,
      color: isDark ? c.primaryDark : ALCHEMY.brown,
      letterSpacing: -0.4,
    },
    statCardLabel: {
      marginTop: 4,
      fontSize: 10,
      fontFamily: fonts.semibold,
      color: c.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.35,
    },
    errorBanner: {
      color: c.danger,
      fontFamily: fonts.semibold,
      fontSize: typography.caption,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    headerIconBtn: {
      padding: 8,
      borderRadius: radius.pill,
      backgroundColor: c.primarySoft,
      borderWidth: 1,
      borderColor: c.primaryBorder,
    },
    actionIconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    actionIconWrapPrimary: {
      borderWidth: 1,
      borderColor: c.primaryBorder,
      backgroundColor: c.primarySoft,
    },
    actionIconWrapSecondary: {
      borderWidth: 1,
      borderColor: c.secondaryBorder,
      backgroundColor: c.secondarySoft,
    },
    actionTextCol: {
      flex: 1,
      minWidth: 0,
    },
    actionTitle: {
      fontSize: typography.body,
      fontFamily: fonts.bold,
      color: c.textPrimary,
    },
    actionSub: {
      marginTop: 3,
      fontSize: typography.caption,
      fontFamily: fonts.medium,
      color: c.textSecondary,
    },
  });
}
