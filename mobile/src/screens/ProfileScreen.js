import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import KankregScrollPage from "../components/kankreg/KankregScrollPage";
import KankregInfoCard from "../components/kankreg/KankregInfoCard";
import KankregKvGrid from "../components/kankreg/KankregKvGrid";
import KankregKpiStrip from "../components/kankreg/KankregKpiStrip";
import { KankregPageWrap } from "../components/kankreg/KankregPageChrome";

import BottomNavBar from "../components/BottomNavBar";
import AuthGateShell from "../components/AuthGateShell";
import CustomerScreenShell from "../components/CustomerScreenShell";
import KankregCustomerPageHeader from "../components/kankreg/KankregCustomerPageHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { resetNavigationToHome } from "../navigation/resetToHome";
import { fetchMyNotifications, fetchMyOrders } from "../services/userService";
import { customerScrollFill } from "../theme/screenLayout";
import { KANKREG_PAGE_SECTION_GAP } from "../theme/kankregScreenStyles";
import { ALCHEMY } from "../theme/customerAlchemy";
import { formatINRCompact } from "../utils/currency";
import { fonts, icon as glyphSize, radius, spacing, typography } from "../theme/tokens";
import { PROFILE_SCREEN } from "../content/appContent";
import PremiumErrorBanner from "../components/ui/PremiumErrorBanner";
import PremiumCard from "../components/ui/PremiumCard";
import SkeletonBlock from "../components/ui/SkeletonBlock";
import SectionReveal from "../components/motion/SectionReveal";
import KankregProfileGrid from "../components/kankreg/KankregProfileGrid";
import NativeProfileCard from "../components/native/NativeProfileCard";
import NativeMenuList from "../components/native/NativeMenuList";
import { FIGMA } from "../theme/figmaApp";

/**
 * `MMM YYYY` (e.g. "Jan 2026") for the member-since line. Returns "" when the
 * timestamp is missing or invalid so the meta row hides instead of showing
 * "Invalid Date".
 */
function formatMemberSince(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  } catch (_e) {
    return "";
  }
}

function membershipTag(points, deliveredCount) {
  const tier = deliveredCount > 12 ? "Platinum" : deliveredCount > 5 ? "Gold" : "Silver";
  return `${tier} member · ${points.toLocaleString("en-IN")} pts`;
}

export default function ProfileScreen({ navigation }) {
  const { colors: c, isDark } = useTheme();
  const { isAuthenticated, token, user, logout, isAuthLoading, refreshProfile } = useAuth();
  const { toastInfo } = useToast();
  const profileStyles = useMemo(() => createProfileStyles(c, isDark), [c, isDark]);

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const loadProfile = useCallback(
    async ({ silent } = {}) => {
      const startedAt = Date.now();
      try {
        if (!silent) setLoading(true);
        setError("");
        const [profile, myOrders, myNotifications] = await Promise.all([
          refreshProfile(),
          fetchMyOrders(token),
          fetchMyNotifications(token),
        ]);
        setName(profile.name || "");
        setPhone(profile.phone || "");
        setAvatarUrl((profile.avatar || "").trim());
        setDefaultAddress(profile.defaultAddress || null);
        setOrders(myOrders);
        setNotifications(myNotifications);
      } catch (err) {
        setError(err.message || "Unable to load profile data.");
      } finally {
        if (!silent) {
          const elapsed = Date.now() - startedAt;
          const minimumSkeletonMs = 360;
          if (elapsed < minimumSkeletonMs) {
            await new Promise((resolve) => setTimeout(resolve, minimumSkeletonMs - elapsed));
          }
        }
        if (!silent) setLoading(false);
      }
    },
    [refreshProfile, token]
  );

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return;
    loadProfile();
  }, [isAuthLoading, isAuthenticated, loadProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadProfile({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadProfile]);
  const handleSignOut = useCallback(async () => {
    if (isSigningOut) return;
    try {
      setIsSigningOut(true);
      await logout();
      toastInfo("You've been signed out.", { title: "Signed out" });
      resetNavigationToHome(navigation);
    } finally {
      setIsSigningOut(false);
    }
  }, [isSigningOut, logout, navigation, toastInfo]);

  const memberSince = useMemo(() => formatMemberSince(user?.createdAt), [user?.createdAt]);
  const deliveredOrders = useMemo(
    () => orders.filter((item) => item.status === "delivered").length,
    [orders]
  );
  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );
  const hasAddress = Boolean(defaultAddress?.line1);
  const fullAvatar = (avatarUrl || user?.avatar || "").trim();
  const displayName = (name || user?.name || "").trim() || PROFILE_SCREEN.fallbackName;
  const phoneText = (phone || user?.phone || "").trim();
  const rewardPoints = Math.max(0, Number(user?.rewardPoints ?? 0));
  const memberTagBase = membershipTag(rewardPoints, deliveredOrders);
  const memberTag =
    unreadNotifications > 0 ? `${memberTagBase} · ${unreadNotifications} new` : memberTagBase;
  const nativeMemberBadge = `${memberTagBase.toUpperCase()} · ${rewardPoints.toLocaleString("en-IN")} PTS`;
  const isNativeApp = Platform.OS !== "web";
  const savedTotal = useMemo(
    () =>
      orders
        .filter((o) => o.status === "delivered")
        .reduce((sum, o) => sum + Number(o.totalPrice || 0), 0),
    [orders]
  );
  const addressLines = useMemo(() => {
    if (!hasAddress) return "";
    return [
      displayName,
      String(defaultAddress?.line1 || "").trim(),
      [defaultAddress?.city, defaultAddress?.state, defaultAddress?.pincode].filter(Boolean).join(", "),
      phoneText || undefined,
    ]
      .filter(Boolean)
      .join("\n");
  }, [hasAddress, displayName, defaultAddress, phoneText]);

  if (isAuthLoading) {
    return <AuthGateShell navigation={navigation} />;
  }
  if (!isAuthenticated) {
    return <AuthGateShell signedOut navigation={navigation} />;
  }

  const personalDetailsBlock = (
    <SectionReveal delay={60} preset="fade-up">
      <KankregInfoCard
        title="Personal details"
        actionLabel="Edit"
        onAction={() => navigation.navigate("EditProfile")}
      >
        <KankregKvGrid
          rows={[
            { key: "name", label: "Full name", value: displayName },
            { key: "phone", label: "Phone", value: phoneText || PROFILE_SCREEN.emptyPhone },
            { key: "email", label: "Email", value: user?.email || "—" },
            { key: "since", label: "Member since", value: memberSince || "—" },
          ]}
        />
      </KankregInfoCard>
    </SectionReveal>
  );

  const addressBlock = (
    <SectionReveal delay={100} preset="fade-up">
      <KankregInfoCard
        title={hasAddress ? PROFILE_SCREEN.addressTitle : PROFILE_SCREEN.addressMissingTitle}
        actionLabel={hasAddress ? "Manage" : "Add"}
        onAction={() => navigation.navigate("ManageAddress")}
      >
        <Text style={profileStyles.addressBody}>
          {hasAddress ? addressLines : PROFILE_SCREEN.addressMissingHint}
        </Text>
      </KankregInfoCard>
    </SectionReveal>
  );

  const kpiBlock = (
    <KankregKpiStrip
      items={[
        {
          key: "orders",
          label: "Orders",
          value: String(orders.length),
          onPress: () => navigation.navigate("MyOrders"),
        },
        {
          key: "saved",
          label: "Saved",
          value: formatINRCompact(savedTotal),
          onPress: () => navigation.navigate("MyOrders", { initialFilter: "delivered" }),
        },
        {
          key: "points",
          label: "Points",
          value: rewardPoints.toLocaleString("en-IN"),
          onPress: () => navigation.navigate("RedeemRewards"),
        },
      ]}
    />
  );

  const adminBlock = user?.isAdmin ? (
    <SectionReveal delay={290} preset="fade-up">
      <PremiumCard
        goldAccent
        onPress={() => navigation.navigate("AdminDashboard")}
        padding="md"
        style={profileStyles.ribbonCard}
        accessibilityLabel="Open admin dashboard"
      >
        <View style={profileStyles.ribbonRow}>
          <View style={profileStyles.ribbonIconWrap}>
            <Ionicons name="shield-checkmark" size={glyphSize.md} color={ALCHEMY.brown} />
          </View>
          <View style={profileStyles.ribbonTextCol}>
            <Text style={profileStyles.ribbonTitle}>{PROFILE_SCREEN.adminRibbonTitle}</Text>
            <Text style={profileStyles.ribbonHint}>{PROFILE_SCREEN.adminRibbonHint}</Text>
          </View>
          <Ionicons name="chevron-forward" size={glyphSize.sm} color={c.textMuted} />
        </View>
      </PremiumCard>
    </SectionReveal>
  ) : null;

  const deliveryBlock = user?.isDeliveryPartner ? (
    <SectionReveal delay={320} preset="fade-up">
      <PremiumCard
        onPress={() => navigation.navigate("DeliveryDashboard")}
        padding="md"
        style={profileStyles.ribbonCard}
        accessibilityLabel="Open delivery dashboard"
      >
        <View style={profileStyles.ribbonRow}>
          <View style={[profileStyles.ribbonIconWrap, profileStyles.ribbonIconWrapDelivery]}>
            <Ionicons name="bicycle" size={glyphSize.md} color={c.secondaryDark} />
          </View>
          <View style={profileStyles.ribbonTextCol}>
            <Text style={profileStyles.ribbonTitle}>{PROFILE_SCREEN.deliveryRibbonTitle}</Text>
            <Text style={profileStyles.ribbonHint}>{PROFILE_SCREEN.deliveryRibbonHint}</Text>
          </View>
          <Ionicons name="chevron-forward" size={glyphSize.sm} color={c.textMuted} />
        </View>
      </PremiumCard>
    </SectionReveal>
  ) : null;

  return (
    <CustomerScreenShell style={profileStyles.screen}>
      <KankregScrollPage
        scrollVariant="inner"
        style={customerScrollFill}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
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
          <ProfileSkeleton styles={profileStyles} />
        ) : isNativeApp ? (
          <View style={profileStyles.nativeWrap}>
            <KankregCustomerPageHeader
              eyebrow={PROFILE_SCREEN.pageEyebrow}
              title={PROFILE_SCREEN.pageTitle}
              showBack={false}
            />
            {error ? (
              <View style={profileStyles.nativeError}>
                <PremiumErrorBanner severity="error" message={error} />
              </View>
            ) : null}
            <NativeProfileCard
              name={displayName}
              email={user?.email}
              avatarUrl={fullAvatar}
              memberTag={nativeMemberBadge}
            />
            {adminBlock}
            {deliveryBlock}
            <NativeMenuList
              navigation={navigation}
              onSignOut={handleSignOut}
              signingOut={isSigningOut}
            />
          </View>
        ) : (
          <KankregPageWrap gap={KANKREG_PAGE_SECTION_GAP}>
            <KankregCustomerPageHeader
              eyebrow={PROFILE_SCREEN.pageEyebrow}
              title={PROFILE_SCREEN.pageTitle}
              subtitle={PROFILE_SCREEN.pageSubtitle}
              navigation={navigation}
              showBack={false}
              showBrand={false}
              showHairline
            />

            {error ? (
              <View style={profileStyles.errorBannerWrap}>
                <PremiumErrorBanner severity="error" message={error} />
              </View>
            ) : null}

            <KankregProfileGrid
              navigation={navigation}
              user={user}
              avatarUrl={fullAvatar}
              memberTag={memberTag}
              activeKey="overview"
              onSignOut={handleSignOut}
              signingOut={isSigningOut}
            >
              {personalDetailsBlock}
              {addressBlock}
              {kpiBlock}
              {adminBlock}
              {deliveryBlock}
            </KankregProfileGrid>
          </KankregPageWrap>
        )}
</KankregScrollPage>
      <BottomNavBar />
    </CustomerScreenShell>
  );
}

function ProfileSkeleton({ styles: ps }) {
  return (
    <KankregPageWrap gap={KANKREG_PAGE_SECTION_GAP}>
      <SkeletonBlock width="40%" height={14} rounded="sm" />
      <SkeletonBlock width="55%" height={28} rounded="md" style={{ marginTop: spacing.sm }} />
      <View style={ps.skeletonProfGrid}>
        <SkeletonBlock width={280} height={320} rounded="xl" style={ps.skeletonSide} />
        <View style={ps.skeletonMain}>
          <SkeletonBlock width="100%" height={180} rounded="xl" />
          <SkeletonBlock width="100%" height={140} rounded="xl" style={{ marginTop: spacing.md }} />
          <View style={ps.skeletonKpiRow}>
            <SkeletonBlock width="30%" height={88} rounded="lg" />
            <SkeletonBlock width="30%" height={88} rounded="lg" />
            <SkeletonBlock width="30%" height={88} rounded="lg" />
          </View>
        </View>
      </View>
    </KankregPageWrap>
  );
}

function createProfileStyles(c, isDark) {
  return StyleSheet.create({
    screen: {
      flex: 1,
    },
    nativeWrap: {
      paddingHorizontal: FIGMA.gutter,
      paddingBottom: spacing.lg,
    },
    nativeError: {
      marginBottom: spacing.sm,
    },
    ribbonCard: {
      marginBottom: spacing.md,
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 14px 30px rgba(0,0,0,0.28)"
            : "0 10px 24px rgba(22, 69, 51, 0.08)",
        },
        default: {},
      }),
    },
    ribbonRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    ribbonIconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: ALCHEMY.goldSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(31, 92, 71, 0.32)",
      alignItems: "center",
      justifyContent: "center",
    },
    ribbonIconWrapDelivery: {
      backgroundColor: c.secondarySoft,
      borderColor: c.secondaryBorder,
    },
    ribbonTextCol: {
      flex: 1,
      minWidth: 0,
    },
    ribbonTitle: {
      color: c.textPrimary,
      fontSize: typography.body,
      fontFamily: fonts.extrabold,
      letterSpacing: -0.1,
    },
    ribbonHint: {
      marginTop: 2,
      color: c.textMuted,
      fontSize: typography.caption,
      fontFamily: fonts.medium,
    },
    errorBannerWrap: {
      marginBottom: spacing.md + 4,
      width: "100%",
      alignSelf: "center",
    },
    addressBody: {
      fontSize: typography.bodySmall,
      lineHeight: 24,
      color: isDark ? c.textSecondary : ALCHEMY.inkSoft,
    },
    skeletonProfGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xl,
      marginTop: spacing.lg,
    },
    skeletonSide: {
      flexShrink: 0,
    },
    skeletonMain: {
      flex: 1,
      minWidth: 200,
      gap: spacing.md,
    },
    skeletonKpiRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
      justifyContent: "space-between",
    },
  });
}
