import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppFooter from "../components/AppFooter";
import BottomNavBar from "../components/BottomNavBar";
import AuthGateShell from "../components/AuthGateShell";
import CustomerScreenShell from "../components/CustomerScreenShell";
import ScreenPageHeader from "../components/ScreenPageHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { resetNavigationToHome } from "../navigation/resetToHome";
import { fetchMyNotifications, fetchMyOrders } from "../services/userService";
import {
  customerInnerPageScrollContent,
  customerScrollFill,
  customerWebStickyTop,
} from "../theme/screenLayout";
import { ALCHEMY, FONT_DISPLAY, FONT_DISPLAY_SEMI } from "../theme/customerAlchemy";
import { fonts, icon as glyphSize, layout, radius, spacing, typography } from "../theme/tokens";
import { PROFILE_SCREEN } from "../content/appContent";
import PremiumErrorBanner from "../components/ui/PremiumErrorBanner";
import PremiumButton from "../components/ui/PremiumButton";
import PremiumCard from "../components/ui/PremiumCard";
import PremiumChip from "../components/ui/PremiumChip";
import PremiumStatCard from "../components/ui/PremiumStatCard";
import GoldHairline from "../components/ui/GoldHairline";
import SkeletonBlock from "../components/ui/SkeletonBlock";
import PremiumSectionHeader from "../components/ui/PremiumSectionHeader";
import ProfileQuickActionsList from "../components/profile/ProfileQuickActionsList";
import MotionScrollView from "../components/motion/MotionScrollView";
import SectionReveal from "../components/motion/SectionReveal";
import useCountUp from "../hooks/useCountUp";
import useReducedMotion from "../hooks/useReducedMotion";

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

/**
 * Derives the role chip label + tone from auth flags. Admins win over delivery
 * partner; customers get a neutral chip.
 */
function resolveRole(user) {
  if (user?.isAdmin) return { label: PROFILE_SCREEN.roleAdmin, tone: "gold", icon: "shield-checkmark" };
  if (user?.isDeliveryPartner) return { label: PROFILE_SCREEN.roleDelivery, tone: "green", icon: "bicycle" };
  return { label: PROFILE_SCREEN.roleCustomer, tone: "neutral", icon: "sparkles" };
}

function StatTile({ iconName, value, label, tone, active, reducedMotion, onPress }) {
  const target = Number.isFinite(value) ? value : 0;
  const animated = useCountUp({ target, active, reducedMotion, duration: 1200 });
  return (
    <View style={styles.heroStatCol}>
      <PremiumStatCard
        iconName={iconName}
        label={label}
        value={String(Math.round(animated))}
        tone={tone}
        align="center"
        onPress={onPress}
        compact
      />
    </View>
  );
}

const styles = StyleSheet.create({
  heroStatCol: {
    flex: 1,
    minWidth: 0,
  },
});

export default function ProfileScreen({ navigation }) {
  const { colors: c, isDark } = useTheme();
  const { isAuthenticated, token, user, logout, isAuthLoading, refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 1180;
  const useStickyHeroCol = Platform.OS === "web" && width >= 1320;
  const profileStyles = useMemo(
    () => createProfileStyles(c, isDark, { isDesktop, useStickyHeroCol }),
    [c, isDark, isDesktop, useStickyHeroCol]
  );
  const reducedMotion = useReducedMotion();

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
      resetNavigationToHome(navigation);
    } finally {
      setIsSigningOut(false);
    }
  }, [isSigningOut, logout, navigation]);

  const ringPulse = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion) {
      ringPulse.value = 0;
      return undefined;
    }
    ringPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
        withTiming(0, { duration: 2200, easing: Easing.bezier(0.65, 0, 0.35, 1) }),
      ),
      -1,
      false,
    );
  }, [reducedMotion, ringPulse]);
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.32 + ringPulse.value * 0.5,
    transform: [{ scale: 1 + ringPulse.value * 0.06 }],
  }));

  const role = useMemo(() => resolveRole(user), [user]);
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

  if (isAuthLoading) {
    return <AuthGateShell />;
  }
  if (!isAuthenticated) {
    return <AuthGateShell signedOut navigation={navigation} />;
  }

  const heroBlock = (
    <SectionReveal delay={60} preset="fade-up">
      <View style={profileStyles.heroCardOuter}>
        <LinearGradient
          colors={
            isDark
              ? [c.surfaceMuted, c.surface, c.backgroundGradientEnd]
              : [ALCHEMY.creamAlt, c.surface, c.backgroundGradientEnd]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={profileStyles.heroGradient}
        >
          <View style={[profileStyles.heroGoldOrb, profileStyles.peNone]} />
          <View style={[profileStyles.heroGoldOrbAlt, profileStyles.peNone]} />

          <View style={profileStyles.heroAvatarBlock}>
            <View style={profileStyles.avatarOuter}>
              <Animated.View style={[profileStyles.avatarBreathRing, ringStyle, profileStyles.peNone]} />
              <Pressable
                onPress={() => navigation.navigate("EditProfile")}
                style={({ hovered, pressed }) => [
                  profileStyles.avatarRing,
                  hovered && Platform.OS === "web" ? profileStyles.avatarRingHover : null,
                  pressed ? profileStyles.avatarRingPressed : null,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Change profile photo"
              >
                <View style={profileStyles.avatarWrap}>
                  {fullAvatar ? (
                    <Image
                      source={{ uri: fullAvatar }}
                      style={profileStyles.avatarImage}
                      contentFit="cover"
                    />
                  ) : (
                    <Ionicons name="person" size={glyphSize.display} color={c.textMuted} />
                  )}
                </View>
                <View style={profileStyles.avatarPip}>
                  <Ionicons name="pencil" size={11} color={c.onPrimary} />
                </View>
              </Pressable>
            </View>
          </View>

          <Text style={profileStyles.heroEyebrow}>{PROFILE_SCREEN.eyebrow.toUpperCase()}</Text>
          <View style={profileStyles.heroTitleRow}>
            <Text style={profileStyles.heroTitle} numberOfLines={2}>
              {displayName}
            </Text>
          </View>
          <View style={profileStyles.heroChipRow}>
            <PremiumChip
              label={role.label}
              iconLeft={role.icon}
              tone={role.tone}
              size="md"
              selected
            />
            {memberSince ? (
              <Text style={profileStyles.heroMemberSince} numberOfLines={1}>
                {`${PROFILE_SCREEN.memberSincePrefix} ${memberSince}`}
              </Text>
            ) : null}
          </View>

          <View style={profileStyles.heroContactRow}>
            {user?.email ? (
              <View style={profileStyles.heroContactItem}>
                <View style={profileStyles.heroContactIconWrap}>
                  <Ionicons name="mail-outline" size={glyphSize.micro} color={c.primary} />
                </View>
                <Text style={profileStyles.heroContactText} numberOfLines={1}>
                  {user.email}
                </Text>
              </View>
            ) : null}
            <View style={profileStyles.heroContactItem}>
              <View style={profileStyles.heroContactIconWrap}>
                <Ionicons name="call-outline" size={glyphSize.micro} color={c.primary} />
              </View>
              <Text style={profileStyles.heroContactText} numberOfLines={1}>
                {phoneText || PROFILE_SCREEN.emptyPhone}
              </Text>
            </View>
          </View>

          <View style={profileStyles.heroActionRow}>
            <PremiumButton
              label="Edit profile"
              iconLeft="create-outline"
              variant="primary"
              size="md"
              onPress={() => navigation.navigate("EditProfile")}
              style={profileStyles.heroPrimaryBtn}
            />
            <PremiumButton
              label={hasAddress ? "Manage address" : "Add address"}
              iconLeft="location-outline"
              variant="secondary"
              size="md"
              onPress={() => navigation.navigate("ManageAddress")}
              style={profileStyles.heroSecondaryBtn}
            />
          </View>

          <GoldHairline marginVertical={spacing.lg} withDot />

          <View style={profileStyles.heroStats}>
            <StatTile
              iconName="receipt-outline"
              value={orders.length}
              label="Orders"
              tone="gold"
              active={!loading}
              reducedMotion={reducedMotion}
              onPress={() => navigation.navigate("MyOrders")}
            />
            <StatTile
              iconName="checkmark-circle-outline"
              value={deliveredOrders}
              label="Delivered"
              tone="green"
              active={!loading}
              reducedMotion={reducedMotion}
              onPress={() => navigation.navigate("MyOrders")}
            />
            <StatTile
              iconName="notifications-outline"
              value={unreadNotifications}
              label="Unread"
              tone="rose"
              active={!loading}
              reducedMotion={reducedMotion}
              onPress={() => navigation.navigate("Notifications")}
            />
          </View>
        </LinearGradient>
      </View>
    </SectionReveal>
  );

  const addressBlock = (
    <SectionReveal delay={130} preset="fade-up">
      {hasAddress ? (
        <PremiumCard goldAccent variant="accent" style={profileStyles.addressCard}>
          <View style={profileStyles.addressHead}>
            <View style={profileStyles.addressIconWrap}>
              <Ionicons name="location-outline" size={glyphSize.md} color={c.secondary} />
            </View>
            <View style={profileStyles.addressTitleCol}>
              <Text style={profileStyles.addressEyebrow}>{PROFILE_SCREEN.addressEyebrow}</Text>
              <Text style={profileStyles.addressTitle} numberOfLines={2}>
                {PROFILE_SCREEN.addressTitle}
              </Text>
            </View>
            <View style={profileStyles.addressRibbon}>
              <Text style={profileStyles.addressRibbonText}>{PROFILE_SCREEN.addressDefaultRibbon}</Text>
            </View>
          </View>
          <Text style={profileStyles.addressLine1} numberOfLines={2}>
            {String(defaultAddress?.line1 || "").trim()}
          </Text>
          {defaultAddress?.city || defaultAddress?.state ? (
            <Text style={profileStyles.addressLineMuted} numberOfLines={1}>
              {[defaultAddress?.city, defaultAddress?.state, defaultAddress?.pincode]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          ) : null}
          <View style={profileStyles.addressActionRow}>
            <PremiumButton
              label={PROFILE_SCREEN.addressChangeCta}
              iconLeft="create-outline"
              variant="ghost"
              size="sm"
              onPress={() => navigation.navigate("ManageAddress")}
            />
          </View>
        </PremiumCard>
      ) : (
        <PremiumCard goldAccent variant="accent" style={profileStyles.addressCard}>
          <View style={profileStyles.addressHead}>
            <View style={profileStyles.addressIconWrap}>
              <Ionicons name="map-outline" size={glyphSize.md} color={c.secondary} />
            </View>
            <View style={profileStyles.addressTitleCol}>
              <Text style={profileStyles.addressEyebrow}>{PROFILE_SCREEN.addressEyebrow}</Text>
              <Text style={profileStyles.addressTitle} numberOfLines={2}>
                {PROFILE_SCREEN.addressMissingTitle}
              </Text>
            </View>
          </View>
          <Text style={profileStyles.addressMissingHint} numberOfLines={3}>
            {PROFILE_SCREEN.addressMissingHint}
          </Text>
          <View style={profileStyles.addressActionRow}>
            <PremiumButton
              label={PROFILE_SCREEN.addressAddCta}
              iconLeft="add-circle-outline"
              variant="primary"
              size="sm"
              onPress={() => navigation.navigate("ManageAddress")}
            />
          </View>
        </PremiumCard>
      )}
    </SectionReveal>
  );

  const accountOptions = [
    {
      key: "edit-profile",
      title: "Edit profile",
      hint: "Name and photo",
      iconName: "create-outline",
      tone: "accent",
      onPress: () => navigation.navigate("EditProfile"),
    },
    {
      key: "address",
      title: "Manage address",
      hint: hasAddress ? "Address saved" : "Add location",
      iconName: "location-outline",
      tone: "accent",
      onPress: () => navigation.navigate("ManageAddress"),
    },
    {
      key: "orders",
      title: "My orders",
      hint: `${orders.length} total`,
      iconName: "bag-handle-outline",
      onPress: () => navigation.navigate("MyOrders"),
    },
    {
      key: "redeem-rewards",
      title: "Redeem rewards",
      hint: `${Math.max(0, Number(user?.rewardPoints ?? 0))} points`,
      iconName: "gift-outline",
      tone: "accent",
      onPress: () => navigation.navigate("RedeemRewards"),
    },
    {
      key: "notifications",
      title: "Notifications",
      hint: unreadNotifications > 0 ? `${unreadNotifications} unread` : "All caught up",
      iconName: "notifications-outline",
      tone: unreadNotifications > 0 ? "accent" : "normal",
      rightSlot:
        unreadNotifications > 0 ? (
          <PremiumChip label={String(unreadNotifications)} tone="gold" size="sm" selected />
        ) : null,
      onPress: () => navigation.navigate("Notifications"),
    },
    {
      key: "settings",
      title: "Settings",
      hint: "Theme and alerts",
      iconName: "settings-outline",
      onPress: () => navigation.navigate("Settings"),
    },
    {
      key: "support",
      title: "Support",
      hint: "Help and contact",
      iconName: "chatbubble-ellipses-outline",
      onPress: () => navigation.navigate("Support"),
    },
  ];

  const accountOptionsBlock = (
    <SectionReveal delay={170} preset="fade-up">
      <PremiumCard variant="panel" style={profileStyles.accountHubCard} contentStyle={profileStyles.accountHubContent}>
        <PremiumSectionHeader
          overline={PROFILE_SCREEN.quickActionsEyebrow}
          title={PROFILE_SCREEN.quickActionsTitle}
          subtitle={PROFILE_SCREEN.quickActionsSubtitle}
          compact
        />
        <ProfileQuickActionsList profileStyles={profileStyles} items={accountOptions} />
      </PremiumCard>
    </SectionReveal>
  );

  const membershipBlock = (
    <SectionReveal delay={210} preset="fade-up">
      <PremiumCard goldAccent gradient variant="hero" style={profileStyles.membershipCard}>
        <View style={profileStyles.membershipTop}>
          <View style={profileStyles.membershipIconWrap}>
            <Ionicons name="diamond-outline" size={glyphSize.md} color={ALCHEMY.brown} />
          </View>
          <View style={profileStyles.membershipTitleCol}>
            <Text style={profileStyles.membershipEyebrow}>Premium membership</Text>
            <Text style={profileStyles.membershipTitle}>Exclusive account benefits</Text>
          </View>
          <PremiumChip
            label={deliveredOrders > 12 ? "Platinum" : deliveredOrders > 5 ? "Gold" : "Classic"}
            tone="gold"
            size="sm"
            selected
          />
        </View>
        <Text style={profileStyles.membershipSub}>Priority support and faster checkout experience.</Text>
        <View style={profileStyles.membershipCtaRow}>
          <PremiumButton
            label="View benefits"
            iconLeft="sparkles-outline"
            variant="secondary"
            size="sm"
            onPress={() => navigation.navigate("Settings")}
          />
          <PremiumButton
            label="My orders"
            iconLeft="bag-handle-outline"
            variant="ghost"
            size="sm"
            onPress={() => navigation.navigate("MyOrders")}
          />
        </View>
      </PremiumCard>
    </SectionReveal>
  );

  const loyaltyBlock = (
    <SectionReveal delay={250} preset="fade-up">
      <PremiumCard variant="panel" style={profileStyles.loyaltyCard}>
        <View style={profileStyles.loyaltyHead}>
          <View style={profileStyles.loyaltyBadgeRow}>
            <View style={profileStyles.loyaltyIconWrap}>
              <Ionicons name="sparkles-outline" size={glyphSize.md} color={c.primary} />
            </View>
            <View>
              <Text style={profileStyles.loyaltyEyebrow}>Loyalty rewards</Text>
              <Text style={profileStyles.loyaltyPoints}>{Math.max(0, Number(user?.rewardPoints ?? 0))} pts</Text>
            </View>
          </View>
        </View>
        <Text style={profileStyles.loyaltyHint}>
          Claim points on delivered orders in My Orders, then redeem here for coupon codes at checkout.
        </Text>
        <View style={profileStyles.loyaltyCtaRow}>
          <PremiumButton
            label="Redeem rewards"
            iconLeft="sparkles-outline"
            variant="primary"
            size="sm"
            onPress={() => navigation.navigate("RedeemRewards")}
          />
          <PremiumButton
            label="Earn points"
            iconLeft="gift-outline"
            variant="ghost"
            size="sm"
            onPress={() => navigation.navigate("MyOrders", { initialFilter: "delivered", source: "rewards" })}
          />
          <PremiumButton
            label="Notifications"
            iconLeft="notifications-outline"
            variant="subtle"
            size="sm"
            onPress={() => navigation.navigate("Notifications")}
          />
        </View>
      </PremiumCard>
    </SectionReveal>
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
          <View style={profileStyles.ribbonChevronWrap}>
            <Ionicons name="chevron-forward" size={glyphSize.sm} color={c.textMuted} />
          </View>
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
          <View style={profileStyles.ribbonChevronWrap}>
            <Ionicons name="chevron-forward" size={glyphSize.sm} color={c.textMuted} />
          </View>
        </View>
      </PremiumCard>
    </SectionReveal>
  ) : null;

  const dangerBlock = (
    <SectionReveal delay={350} preset="fade-up">
      <View style={profileStyles.dangerPanel}>
        <View style={profileStyles.dangerHeader}>
          <View style={profileStyles.dangerIconWrap}>
            <Ionicons name="lock-closed-outline" size={glyphSize.sm} color={c.danger} />
          </View>
          <Text style={profileStyles.dangerTitle}>{PROFILE_SCREEN.dangerTitle}</Text>
        </View>
        <Text style={profileStyles.dangerHint}>{PROFILE_SCREEN.dangerHint}</Text>
        <PremiumButton
          label={isSigningOut ? "Signing out..." : PROFILE_SCREEN.signOutLabel}
          iconLeft="log-out-outline"
          variant="danger"
          size="md"
          fullWidth
          disabled={isSigningOut}
          loading={isSigningOut}
          textStyle={profileStyles.signOutText}
          onPress={handleSignOut}
          style={profileStyles.signOutBtn}
        />
      </View>
    </SectionReveal>
  );

  return (
    <CustomerScreenShell style={profileStyles.screen}>
      <MotionScrollView
        style={customerScrollFill}
        contentContainerStyle={customerInnerPageScrollContent(
          insets,
          Platform.OS === "web" ? { paddingBottom: spacing.sm } : {}
        )}
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
        ) : (
          <>
            <ScreenPageHeader
              navigation={navigation}
              title={PROFILE_SCREEN.pageTitle}
              subtitle={PROFILE_SCREEN.pageSubtitle}
              showBack={false}
              showBrand={false}
            />

            <View style={isDesktop ? profileStyles.profileGridRow : null}>
              <View style={isDesktop ? profileStyles.profileLeftCol : null}>{heroBlock}</View>

              <View style={[isDesktop ? profileStyles.profileRightCol : null, profileStyles.profileStack]}>
                {error ? (
                  <View style={profileStyles.errorBannerWrap}>
                    <PremiumErrorBanner severity="error" message={error} />
                  </View>
                ) : null}

                {addressBlock}
                <GoldHairline marginVertical={spacing.md} />
                {accountOptionsBlock}
                {membershipBlock}
                {loyaltyBlock}
                {adminBlock}
                {deliveryBlock}
                {dangerBlock}
              </View>
            </View>
          </>
        )}
        <AppFooter webTight={Platform.OS === "web"} />
      </MotionScrollView>
      <BottomNavBar />
    </CustomerScreenShell>
  );
}

function ProfileSkeleton({ styles: ps }) {
  return (
    <View style={ps.skeletonWrap}>
      <View style={ps.skeletonHeroCard}>
        <View style={ps.skeletonAvatarCol}>
          <SkeletonBlock width={104} height={104} rounded="pill" />
        </View>
        <View style={ps.skeletonHeroBlock}>
          <SkeletonBlock width="38%" height={12} rounded="sm" />
          <SkeletonBlock width="74%" height={26} rounded="md" />
          <SkeletonBlock width="56%" height={14} rounded="sm" />
        </View>
        <View style={ps.skeletonStatsRow}>
          <SkeletonBlock width="32%" height={104} rounded="xl" />
          <SkeletonBlock width="32%" height={104} rounded="xl" />
          <SkeletonBlock width="32%" height={104} rounded="xl" />
        </View>
      </View>
      <SkeletonBlock width="100%" height={108} rounded="xl" style={ps.skeletonRibbon} />
      <View style={ps.skeletonGrid}>
        {Array.from({ length: 6 }).map((_, idx) => (
          <View key={idx} style={ps.skeletonGridCell}>
            <SkeletonBlock width="100%" height={132} rounded="xl" />
          </View>
        ))}
      </View>
      <SkeletonBlock width="100%" height={132} rounded="xl" style={ps.skeletonDanger} />
    </View>
  );
}

function createProfileStyles(c, isDark, layoutFlags = {}) {
  const { isDesktop = false, useStickyHeroCol = false } = layoutFlags;
  const surfaceCard = isDark ? c.surface : ALCHEMY.cardBg;
  const goldRing = isDark ? "rgba(220, 38, 38, 0.55)" : ALCHEMY.gold;
  const goldRingMuted = isDark ? "rgba(220, 38, 38, 0.32)" : "rgba(220, 38, 38, 0.5)";
  const cardLift = Platform.select({
    web: {
      boxShadow: isDark
        ? "0 24px 56px rgba(0,0,0,0.44), 0 10px 24px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.05)"
        : "0 18px 42px rgba(24, 24, 27, 0.11), 0 6px 16px rgba(28, 25, 23, 0.06), inset 0 1px 0 rgba(255,253,251,0.96)",
    },
    ios: {
      shadowColor: "#18181B",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: isDark ? 0.28 : 0.08,
      shadowRadius: 20,
    },
    android: { elevation: isDark ? 6 : 4 },
    default: {},
  });

  return StyleSheet.create({
    heroParallaxWrap: {
      borderRadius: radius.xxl,
    },
    screen: {
      flex: 1,
    },
    profileGridRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.xl + 2,
    },
    profileLeftCol: {
      flex: 5,
      minWidth: 0,
      ...Platform.select({
        web: {
          ...(useStickyHeroCol
            ? {
                position: "sticky",
                top: customerWebStickyTop(spacing.lg + 2),
                alignSelf: "flex-start",
              }
            : {}),
        },
        default: {},
      }),
    },
    profileRightCol: {
      flex: 6,
      minWidth: 0,
    },
    profileStack: {
      gap: spacing.md,
      ...Platform.select({
        web: {
          width: isDesktop ? undefined : "100%",
        },
        default: {},
      }),
    },

    heroCardOuter: {
      marginBottom: spacing.lg + 4,
      borderRadius: radius.xxl,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? c.border : "rgba(100, 116, 139, 0.12)",
      borderTopWidth: 2,
      borderTopColor: isDark ? "rgba(220, 38, 38, 0.55)" : "rgba(185, 28, 28, 0.52)",
      ...cardLift,
      ...Platform.select({
        web: {
          maxWidth: layout.maxContentWidth,
          alignSelf: "center",
          width: "100%",
        },
        default: {},
      }),
    },
    heroGradient: {
      paddingTop: spacing.xl,
      paddingHorizontal: spacing.xl - 2,
      paddingBottom: spacing.xl + 2,
      position: "relative",
      overflow: "hidden",
    },
    heroGoldOrb: {
      position: "absolute",
      top: -64,
      left: -56,
      width: 250,
      height: 250,
      borderRadius: 125,
      backgroundColor: isDark ? c.heroGlow || "rgba(185, 28, 28, 0.16)" : "rgba(185, 28, 28, 0.18)",
      opacity: 0.76,
      ...Platform.select({
        web: { filter: "blur(28px)" },
        default: {},
      }),
    },
    heroGoldOrbAlt: {
      position: "absolute",
      bottom: -80,
      right: -64,
      width: 248,
      height: 248,
      borderRadius: 124,
      backgroundColor: isDark ? c.heroGlowSecondary || "rgba(220, 38, 38, 0.08)" : "rgba(220, 38, 38, 0.12)",
      opacity: 0.72,
      ...Platform.select({
        web: { filter: "blur(34px)" },
        default: {},
      }),
    },

    heroAvatarBlock: {
      alignItems: "center",
      marginTop: spacing.md,
      marginBottom: spacing.md,
    },
    avatarOuter: {
      position: "relative",
      width: 124,
      height: 124,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarBreathRing: {
      position: "absolute",
      top: -4,
      left: -4,
      right: -4,
      bottom: -4,
      borderRadius: 9999,
      borderWidth: 2,
      borderColor: goldRingMuted,
      ...Platform.select({
        web: { filter: "blur(2px)" },
        default: {},
      }),
    },
    avatarRing: {
      width: 116,
      height: 116,
      padding: 5,
      borderRadius: 9999,
      backgroundColor: surfaceCard,
      borderWidth: 2,
      borderColor: goldRing,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        ios: {
          shadowColor: c.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.22,
          shadowRadius: 12,
        },
        android: { elevation: 5 },
        web: {
          cursor: "pointer",
          transition: "transform 0.22s ease, box-shadow 0.22s ease",
        },
        default: {},
      }),
    },
    avatarRingHover: {
      ...Platform.select({
        web: {
          transform: [{ translateY: -1.5 }, { scale: 1.02 }],
          boxShadow: isDark
            ? "0 14px 30px rgba(0,0,0,0.46)"
            : "0 14px 28px rgba(24, 24, 27, 0.16)",
        },
        default: {},
      }),
    },
    avatarRingPressed: {
      opacity: 0.95,
      transform: [{ scale: 0.985 }],
    },
    avatarWrap: {
      width: "100%",
      height: "100%",
      borderRadius: 9999,
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
    avatarPip: {
      position: "absolute",
      right: -2,
      bottom: -2,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.primary,
      borderWidth: 2,
      borderColor: surfaceCard,
      alignItems: "center",
      justifyContent: "center",
    },

    heroEyebrow: {
      textAlign: "center",
      color: ALCHEMY.gold,
      fontSize: typography.overline,
      fontFamily: fonts.extrabold,
      letterSpacing: 1.7,
      marginBottom: 6,
    },
    heroTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    heroTitle: {
      color: c.textPrimary,
      fontSize: typography.h1 - 2,
      fontFamily: FONT_DISPLAY,
      letterSpacing: -0.55,
      textAlign: "center",
      lineHeight: typography.h1 + 2,
    },
    heroChipRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm + 2,
      marginTop: spacing.xs + 2,
      marginBottom: 0,
      flexWrap: "wrap",
    },
    heroMemberSince: {
      color: isDark ? "rgba(255, 252, 248, 0.74)" : c.textSecondary,
      fontSize: typography.caption,
      fontFamily: fonts.semibold,
      letterSpacing: 0.4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(220, 38, 38, 0.26)" : "rgba(63, 63, 70, 0.15)",
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 253, 251, 0.82)",
    },

    heroContactRow: {
      marginTop: spacing.md,
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm + 2,
    },
    heroContactItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: spacing.sm + 3,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.72)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(220, 38, 38, 0.18)" : "rgba(63, 63, 70, 0.1)",
      maxWidth: "100%",
      flexShrink: 1,
    },
    heroContactIconWrap: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(220, 38, 38, 0.18)" : "rgba(220, 38, 38, 0.1)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(248, 113, 113, 0.28)" : "rgba(220, 38, 38, 0.12)",
    },
    heroContactText: {
      color: isDark ? "rgba(255, 252, 248, 0.76)" : c.textSecondary,
      fontSize: typography.caption,
      fontFamily: fonts.medium,
      flexShrink: 1,
    },
    heroActionRow: {
      marginTop: spacing.md + 2,
      flexDirection: "row",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    heroPrimaryBtn: {
      minWidth: 154,
    },
    heroSecondaryBtn: {
      minWidth: 154,
    },

    heroStats: {
      flexDirection: "row",
      gap: spacing.md,
      alignItems: "stretch",
      marginTop: spacing.xs,
      padding: spacing.sm,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(220, 38, 38, 0.18)" : "rgba(63, 63, 70, 0.1)",
      backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.6)",
    },

    addressCard: {
      marginBottom: 0,
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 16px 34px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)"
            : "0 12px 28px rgba(24, 24, 27, 0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
        },
        default: {},
      }),
    },
    addressHead: {
      flexDirection: "row",
      alignItems: "flex-start",
      flexWrap: "wrap",
      gap: spacing.sm + 2,
      marginBottom: spacing.sm,
    },
    addressIconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.lg,
      backgroundColor: c.secondarySoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.secondaryBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    addressTitleCol: {
      flex: 1,
      minWidth: 0,
    },
    addressEyebrow: {
      color: ALCHEMY.gold,
      fontSize: typography.overline,
      fontFamily: fonts.extrabold,
      letterSpacing: 1.4,
      marginBottom: 2,
    },
    addressTitle: {
      color: c.textPrimary,
      fontSize: typography.body,
      fontFamily: fonts.extrabold,
      letterSpacing: -0.2,
    },
    addressRibbon: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: ALCHEMY.goldSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(185, 28, 28, 0.32)",
      marginLeft: "auto",
      maxWidth: "100%",
    },
    addressRibbonText: {
      color: isDark ? ALCHEMY.goldBright : ALCHEMY.brown,
      fontSize: typography.overline,
      fontFamily: fonts.extrabold,
      letterSpacing: 1.2,
    },
    addressLine1: {
      color: c.textPrimary,
      fontSize: typography.bodySmall,
      fontFamily: fonts.semibold,
      lineHeight: 20,
    },
    addressLineMuted: {
      marginTop: 2,
      color: c.textSecondary,
      fontSize: typography.caption,
      fontFamily: fonts.regular,
    },
    addressMissingHint: {
      color: c.textSecondary,
      fontSize: typography.caption,
      fontFamily: fonts.regular,
      lineHeight: 20,
    },
    addressActionRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginTop: spacing.sm + 2,
    },

    quickActionsHeader: {
      marginBottom: spacing.sm + 2,
    },
    accountHubCard: {
      marginBottom: 0,
      borderTopWidth: 2,
      borderTopColor: isDark ? "rgba(220, 38, 38, 0.18)" : "rgba(185, 28, 28, 0.22)",
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 18px 40px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.03)"
            : "0 14px 30px rgba(24, 24, 27, 0.09), inset 0 1px 0 rgba(255,255,255,0.92)",
        },
        default: {},
      }),
    },
    accountHubContent: {
      paddingTop: spacing.md + 2,
    },
    accountOptionsList: {
      marginTop: spacing.xs,
    },
    accountOptionDivider: {
      marginVertical: spacing.xs + 2,
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
      opacity: isDark ? 0.55 : 0.45,
    },
    quickActionsEyebrow: {
      color: ALCHEMY.gold,
      fontSize: typography.overline,
      fontFamily: fonts.extrabold,
      letterSpacing: 1.6,
    },
    quickActionsTitle: {
      marginTop: 2,
      color: c.textPrimary,
      fontSize: typography.h3,
      fontFamily: FONT_DISPLAY,
      letterSpacing: -0.3,
    },
    quickActionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm + 2,
      marginTop: spacing.xs,
    },
    membershipCard: {
      marginBottom: 0,
      borderTopWidth: 2,
      borderTopColor: isDark ? "rgba(255, 224, 163, 0.28)" : "rgba(185, 28, 28, 0.26)",
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 20px 44px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.04)"
            : "0 16px 34px rgba(24, 24, 27, 0.1), inset 0 1px 0 rgba(255,255,255,0.92)",
        },
        default: {},
      }),
    },
    membershipTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    membershipIconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.lg,
      backgroundColor: "rgba(255, 236, 191, 0.72)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(185, 28, 28, 0.22)",
      alignItems: "center",
      justifyContent: "center",
    },
    membershipTitleCol: {
      flex: 1,
      minWidth: 0,
    },
    membershipEyebrow: {
      color: ALCHEMY.gold,
      fontSize: typography.overline,
      fontFamily: fonts.extrabold,
      letterSpacing: 1.4,
      textTransform: "uppercase",
    },
    membershipTitle: {
      color: c.textPrimary,
      fontFamily: FONT_DISPLAY,
      fontSize: typography.h3,
      letterSpacing: -0.25,
    },
    membershipSub: {
      marginTop: 6,
      color: c.textSecondary,
      fontSize: typography.caption,
      lineHeight: 19,
      fontFamily: fonts.medium,
    },
    membershipCtaRow: {
      marginTop: spacing.md,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    loyaltyCard: {
      marginBottom: 0,
      borderTopWidth: 2,
      borderTopColor: isDark ? "rgba(220, 38, 38, 0.14)" : "rgba(185, 28, 28, 0.18)",
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 16px 34px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)"
            : "0 12px 28px rgba(24, 24, 27, 0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
        },
        default: {},
      }),
    },
    loyaltyHead: {
      alignItems: "flex-start",
      gap: spacing.sm + 2,
    },
    loyaltyBadgeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    loyaltyIconWrap: {
      width: 42,
      height: 42,
      borderRadius: radius.lg,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.primarySoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.primaryBorder,
    },
    loyaltyEyebrow: {
      color: c.textMuted,
      fontSize: typography.overline,
      fontFamily: fonts.bold,
      textTransform: "uppercase",
      letterSpacing: 1.05,
    },
    loyaltyPoints: {
      marginTop: 2,
      color: c.primary,
      fontFamily: FONT_DISPLAY_SEMI,
      fontSize: typography.h4,
    },
    loyaltyHint: {
      marginTop: 6,
      color: c.textSecondary,
      fontSize: typography.caption,
      lineHeight: 18,
      fontFamily: fonts.medium,
    },
    loyaltyCtaRow: {
      marginTop: spacing.md,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    quickActionCell: {
      flexGrow: 1,
      flexBasis: "46%",
      minWidth: 152,
      maxWidth: "100%",
    },
    quickActionCellDesktop: {
      flexBasis: "31%",
      minWidth: 170,
    },
    quickActionCard: {
      height: "100%",
    },
    quickActionContent: {
      minHeight: 124,
      padding: spacing.md,
    },
    quickActionTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    quickActionIconPlate: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      alignItems: "center",
      justifyContent: "center",
    },
    quickActionBadge: {
      minWidth: 24,
      height: 22,
      paddingHorizontal: 7,
      borderRadius: 11,
      backgroundColor: c.primarySoft,
      borderWidth: 1,
      borderColor: c.primaryBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    quickActionBadgeText: {
      color: c.primaryDark,
      fontSize: 11,
      fontFamily: fonts.extrabold,
      fontVariant: ["tabular-nums"],
    },
    quickActionTitle: {
      marginTop: spacing.sm + 2,
      color: c.textPrimary,
      fontSize: typography.body,
      fontFamily: FONT_DISPLAY,
      letterSpacing: -0.2,
    },
    quickActionHint: {
      marginTop: 4,
      color: c.textMuted,
      fontSize: typography.caption,
      fontFamily: fonts.medium,
      lineHeight: 18,
    },
    quickActionFooter: {
      marginTop: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
    },
    secondaryShortcutRow: {
      marginTop: spacing.xs,
      flexDirection: "row",
    },
    secondaryShortcutCard: {
      width: "100%",
    },
    secondaryShortcutContent: {
      minHeight: 108,
      padding: spacing.md,
    },

    ribbonCard: {
      marginBottom: 0,
      borderTopWidth: 2,
      borderTopColor: isDark ? "rgba(220, 38, 38, 0.16)" : "rgba(185, 28, 28, 0.18)",
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 14px 30px rgba(0,0,0,0.28)"
            : "0 10px 24px rgba(24, 24, 27, 0.08)",
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
      width: 46,
      height: 46,
      borderRadius: radius.lg,
      backgroundColor: ALCHEMY.goldSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(185, 28, 28, 0.32)",
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
    ribbonChevronWrap: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.82)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },

    dangerPanel: {
      marginTop: spacing.xs,
      marginBottom: spacing.xl,
      padding: spacing.lg,
      borderRadius: radius.xxl,
      backgroundColor: isDark ? "rgba(127, 29, 29, 0.14)" : "rgba(220, 38, 38, 0.06)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(248, 113, 113, 0.32)" : "rgba(220, 38, 38, 0.2)",
      borderTopWidth: 2,
      borderTopColor: isDark ? "rgba(248, 113, 113, 0.55)" : "rgba(220, 38, 38, 0.4)",
    },
    dangerHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 6,
    },
    dangerIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(248, 113, 113, 0.18)" : "rgba(220, 38, 38, 0.1)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(248, 113, 113, 0.32)" : "rgba(220, 38, 38, 0.22)",
    },
    dangerTitle: {
      color: c.textPrimary,
      fontSize: typography.body,
      fontFamily: fonts.extrabold,
      letterSpacing: -0.1,
    },
    dangerHint: {
      color: c.textSecondary,
      fontSize: typography.caption,
      fontFamily: fonts.regular,
      lineHeight: 19,
      marginBottom: spacing.md,
    },
    signOutBtn: {
      alignSelf: "stretch",
    },
    signOutText: {
      color: c.danger,
      fontSize: typography.bodySmall,
      fontFamily: fonts.bold,
      letterSpacing: 0.25,
    },

    errorBannerWrap: {
      marginBottom: spacing.md + 4,
      maxWidth: layout.maxContentWidth,
      width: "100%",
      alignSelf: "center",
    },

    skeletonWrap: {
      flex: 1,
      paddingVertical: spacing.lg,
      gap: spacing.md,
    },
    skeletonHeroCard: {
      padding: spacing.lg,
      borderRadius: radius.xxl,
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(255, 253, 251, 0.6)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(63, 63, 70, 0.06)",
      gap: spacing.md,
      alignItems: "center",
    },
    skeletonAvatarCol: {
      alignItems: "center",
      marginBottom: spacing.sm,
    },
    skeletonHeroBlock: {
      gap: 8,
      alignItems: "center",
      width: "100%",
    },
    skeletonStatsRow: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    skeletonRibbon: {
      marginTop: spacing.xs,
    },
    skeletonGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm + 2,
      marginTop: spacing.xs,
    },
    skeletonGridCell: {
      flexGrow: 1,
      flexBasis: "46%",
      minWidth: 152,
    },
    skeletonDanger: {
      marginTop: spacing.md,
    },
    peNone: {
      pointerEvents: "none",
    },
  });
}
