import React, { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useKankregLayout } from "../theme/kankregBreakpoints";
import { Ionicons } from "@expo/vector-icons";
import KankregScrollPage from "../components/kankreg/KankregScrollPage";
import { KankregPageWrap } from "../components/kankreg/KankregPageChrome";
import { KANKREG_PAGE_SECTION_GAP } from "../theme/kankregScreenStyles";

import BottomNavBar from "../components/BottomNavBar";
import CustomerScreenShell from "../components/CustomerScreenShell";
import KankregCustomerPageHeader from "../components/kankreg/KankregCustomerPageHeader";
import SectionReveal from "../components/motion/SectionReveal";
import { staggerDelay } from "../theme/motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { resetNavigationToHome } from "../navigation/resetToHome";
import { registerForPushNotifications } from "../services/pushNotificationService";
import {
  customerPanel,
  customerScrollFill} from "../theme/screenLayout";
import { fonts, icon as glyphSize, radius, spacing, typography } from "../theme/tokens";
import PremiumErrorBanner from "../components/ui/PremiumErrorBanner";
import PremiumCard from "../components/ui/PremiumCard";
import PremiumSectionHeader from "../components/ui/PremiumSectionHeader";
import PremiumSwitch from "../components/ui/PremiumSwitch";
import CollapsibleSection from "../components/ui/CollapsibleSection";
import { SETTINGS_SCREEN } from "../content/appContent";
import AppIconPicker from "../components/settings/AppIconPicker";
import NativeMenuList from "../components/native/NativeMenuList";
import NativeCard from "../components/native/NativeCard";
import { FIGMA } from "../theme/figmaApp";

function SettingsItem({ icon, title, subtitle, onPress, danger = false, styles, c }) {
  const [hovered, setHovered] = useState(false);
  const webHandlers = Platform.OS === "web"
    ? {
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false)}
    : {};
  return (
    <View {...webHandlers}>
      <PremiumCard
        onPress={onPress}
        variant={danger ? "danger" : "list"}
        padding="md"
        style={[styles.item, hovered ? styles.itemHover : null]}
        contentStyle={styles.itemContent}
      >
        {Platform.OS === "web" && hovered ? <View style={[styles.itemHoverSweep, styles.peNone]} /> : null}
        <View style={[styles.itemIconWrap, danger ? styles.itemIconWrapDanger : null]}>
          <Ionicons name={icon} size={glyphSize.sm} color={danger ? c.danger : c.secondary} />
        </View>
        <View style={styles.itemTextWrap}>
          <Text style={[styles.itemTitle, danger ? styles.itemTitleDanger : null]}>{title}</Text>
          {subtitle ? <Text style={styles.itemSubtitle}>{subtitle}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={glyphSize.xs} color={c.textMuted} style={styles.itemChevron} />
      </PremiumCard>
    </View>
  );
}

export default function SettingsScreen({ navigation }) {
    const { isXs, isSm } = useKankregLayout();
  const isCompactWeb = Platform.OS === "web" && (isXs || isSm);
  const { isAuthenticated, token, user, logout } = useAuth();
  const [permissionMsg, setPermissionMsg] = useState("");
  const [iconMsg, setIconMsg] = useState("");
  const [iconMsgSeverity, setIconMsgSeverity] = useState("success");
  const [error, setError] = useState("");
  const { colors: c, shadowPremium, mode, setMode, isDark } = useTheme();
  const styles = useMemo(
    () => createSettingsStyles(c, shadowPremium, isDark, { isCompactWeb }),
    [c, shadowPremium, isDark, isCompactWeb]
  );

  const themeSubtitle =
    mode === "system" ? "Match system" : mode === "dark" ? "Dark mode" : "Light mode";
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [marketingUpdates, setMarketingUpdates] = useState(false);

  const cycleTheme = () => {
    setMode(mode === "light" ? "dark" : mode === "dark" ? "system" : "light");
  };

  const handleAppIconStatus = (message, severity = "success") => {
    setIconMsg(message);
    setIconMsgSeverity(severity);
    setError("");
  };

  const handleEnableNotifications = async () => {
    try {
      setError("");
      setPermissionMsg("");
      const result = await registerForPushNotifications(token);
      if (result.enabled) {
        setPermissionMsg("Notifications on.");
      } else {
        setPermissionMsg("Notifications off—enable in system settings.");
      }
    } catch (err) {
      setError(err.message || "Unable to update notification permission.");
    }
  };
  const handleSavedPayments = () => {
    setError("");
    setPermissionMsg("Saved payments soon—see Support for help.");
    navigation.navigate("Support");
  };

  let groupIndex = 0;
  const isNativeApp = Platform.OS !== "web";

  const nativeMenuItems = [
    { key: "edit", label: "Edit profile", icon: "create-outline", route: "EditProfile" },
    { key: "profile", label: "Account overview", icon: "person-outline", route: "Profile" },
    { key: "address", label: "Manage address", icon: "location-outline", route: "ManageAddress" },
    { key: "orders", label: "My orders", icon: "bag-handle-outline", route: "MyOrders" },
    { key: "notifications", label: "Notification inbox", icon: "mail-unread-outline", route: "Notifications" },
    { key: "support", label: "Help & support", icon: "chatbubble-ellipses-outline", route: "Support" },
  ];

  const handleNativeSignOut = async () => {
    try {
      await logout();
      resetNavigationToHome(navigation);
    } catch (err) {
      setError(err.message || "Could not sign out.");
    }
  };

  if (isNativeApp) {
    return (
      <CustomerScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" style={customerScrollFill} showsVerticalScrollIndicator={false}>
          <View style={styles.nativeWrap}>
            <KankregCustomerPageHeader
              eyebrow={SETTINGS_SCREEN.pageEyebrow}
              title={SETTINGS_SCREEN.pageTitle}
              showBack={false}
            />
            {error ? (
              <View style={styles.bannerWrap}>
                <PremiumErrorBanner severity="error" message={error} compact />
              </View>
            ) : null}
            {permissionMsg ? (
              <View style={styles.bannerWrap}>
                <PremiumErrorBanner severity="success" message={permissionMsg} compact />
              </View>
            ) : null}
            <NativeCard style={styles.nativeCard}>
              <Pressable style={styles.nativeRow} onPress={cycleTheme}>
                <Ionicons name="contrast-outline" size={17} color={isDark ? c.primaryBright : FIGMA.gold} />
                <Text style={styles.nativeRowLabel}>Theme</Text>
                <Text style={styles.nativeRowMeta}>{themeSubtitle}</Text>
              </Pressable>
              <Pressable style={styles.nativeRow} onPress={handleEnableNotifications}>
                <Ionicons name="notifications-outline" size={17} color={isDark ? c.primaryBright : FIGMA.gold} />
                <Text style={styles.nativeRowLabel}>Push notifications</Text>
                <Text style={styles.nativeRowChevron}>›</Text>
              </Pressable>
            </NativeCard>
            {iconMsg ? (
              <View style={styles.bannerWrap}>
                <PremiumErrorBanner severity={iconMsgSeverity} message={iconMsg} compact />
              </View>
            ) : null}
            <NativeCard style={styles.nativeIconCard}>
              <AppIconPicker onStatus={handleAppIconStatus} />
            </NativeCard>
            <NativeMenuList
              navigation={navigation}
              items={nativeMenuItems}
              onSignOut={isAuthenticated ? handleNativeSignOut : undefined}
            />
          </View>
        </KankregScrollPage>
        <BottomNavBar />
      </CustomerScreenShell>
    );
  }

  return (
    <CustomerScreenShell style={styles.screen}>
      <KankregScrollPage
        scrollVariant="inner"
        style={customerScrollFill}
        showsVerticalScrollIndicator={false}
      >
        <KankregPageWrap gap={KANKREG_PAGE_SECTION_GAP}>
        <KankregCustomerPageHeader
          eyebrow={SETTINGS_SCREEN.pageEyebrow}
          title={SETTINGS_SCREEN.pageTitle}
          subtitle={SETTINGS_SCREEN.pageSubtitle}
          navigation={navigation}
          showBack={false}
          showHairline
        />
        <SectionReveal preset="fade-up" delay={40}>
        <View style={styles.panel}>
          {error ? (
            <View style={styles.bannerWrap}>
              <PremiumErrorBanner severity="error" message={error} compact />
            </View>
          ) : null}
          {permissionMsg ? (
            <View style={styles.bannerWrap}>
              <PremiumErrorBanner severity="success" message={permissionMsg} compact />
            </View>
          ) : null}

          <SectionReveal preset="fade-up" index={groupIndex} delay={staggerDelay(groupIndex++, { initialDelay: 80 })}>
            <CollapsibleSection title={SETTINGS_SCREEN.appearanceGroup} subtitle={SETTINGS_SCREEN.appearanceGroupSub}>
              <PremiumSectionHeader
                overline={SETTINGS_SCREEN.appearanceGroup}
                title={SETTINGS_SCREEN.themeSectionTitle}
                subtitle={SETTINGS_SCREEN.themeSectionSub}
                compact
              />
              <SettingsItem
                icon="contrast-outline"
                title="Theme"
                subtitle={themeSubtitle}
                onPress={cycleTheme}
                styles={styles}
                c={c}
              />
              {iconMsg ? (
                <View style={styles.bannerWrap}>
                  <PremiumErrorBanner severity={iconMsgSeverity} message={iconMsg} compact />
                </View>
              ) : null}
              <AppIconPicker onStatus={handleAppIconStatus} />
            </CollapsibleSection>
          </SectionReveal>

          <SectionReveal preset="fade-up" index={groupIndex} delay={staggerDelay(groupIndex++, { initialDelay: 80 })}>
            <CollapsibleSection title={SETTINGS_SCREEN.accountGroup} subtitle={SETTINGS_SCREEN.accountGroupSub}>
              <PremiumSectionHeader
                overline={SETTINGS_SCREEN.accountGroup}
                title={SETTINGS_SCREEN.accountSectionTitle}
                subtitle={SETTINGS_SCREEN.accountSectionSub}
                compact
              />
              <SettingsItem
                icon="create-outline"
                title="Edit profile"
                subtitle="Name & phone"
                onPress={() => navigation.navigate("EditProfile")}
                styles={styles}
                c={c}
              />
              <SettingsItem
                icon="person-outline"
                title="Account overview"
                subtitle="Orders"
                onPress={() => navigation.navigate("Profile")}
                styles={styles}
                c={c}
              />
              <SettingsItem
                icon="location-outline"
                title="Manage address"
                onPress={() => navigation.navigate("ManageAddress")}
                styles={styles}
                c={c}
              />
              <SettingsItem
                icon="bag-handle-outline"
                title="My orders"
                onPress={() => navigation.navigate("MyOrders")}
                styles={styles}
                c={c}
              />
              <SettingsItem
                icon="card-outline"
                title="Saved Payments"
                subtitle="Coming soon · Help in Support"
                onPress={handleSavedPayments}
                styles={styles}
                c={c}
              />
            </CollapsibleSection>
          </SectionReveal>

          <SectionReveal preset="fade-up" index={groupIndex} delay={staggerDelay(groupIndex++, { initialDelay: 80 })}>
            <CollapsibleSection title={SETTINGS_SCREEN.notificationsGroup} subtitle={SETTINGS_SCREEN.notificationsGroupSub}>
              <PremiumSectionHeader
                overline={SETTINGS_SCREEN.notificationsGroup}
                title={SETTINGS_SCREEN.alertsSectionTitle}
                subtitle={SETTINGS_SCREEN.alertsSectionSub}
                compact
              />
              <SettingsItem
                icon="notifications-outline"
                title="Push notifications"
                onPress={handleEnableNotifications}
                styles={styles}
                c={c}
              />
              <PremiumSwitch
                label="Order updates"
                hint={SETTINGS_SCREEN.orderUpdatesHint}
                value={orderUpdates}
                onChange={setOrderUpdates}
              />
              <PremiumSwitch
                label="Offers and promos"
                hint={SETTINGS_SCREEN.marketingHint}
                value={marketingUpdates}
                onChange={setMarketingUpdates}
              />
              <SettingsItem
                icon="mail-unread-outline"
                title="Notification inbox"
                onPress={() => navigation.navigate("Notifications")}
                styles={styles}
                c={c}
              />
              <SettingsItem
                icon="chatbubble-ellipses-outline"
                title="Support"
                onPress={() => navigation.navigate("Support")}
                styles={styles}
                c={c}
              />
            </CollapsibleSection>
          </SectionReveal>

          {isAuthenticated && user?.isDeliveryPartner ? (
            <SectionReveal preset="fade-up" index={groupIndex} delay={staggerDelay(groupIndex++, { initialDelay: 80 })}>
              <CollapsibleSection title={SETTINGS_SCREEN.deliveryGroup} subtitle={SETTINGS_SCREEN.deliveryGroupSub}>
                <SettingsItem
                  icon="bicycle-outline"
                  title="Delivery dashboard"
                  subtitle="Your orders"
                  onPress={() => navigation.navigate("DeliveryDashboard")}
                  styles={styles}
                  c={c}
                />
              </CollapsibleSection>
            </SectionReveal>
          ) : null}

          {isAuthenticated && user?.isAdmin ? (
            <SectionReveal preset="fade-up" index={groupIndex} delay={staggerDelay(groupIndex++, { initialDelay: 80 })}>
              <CollapsibleSection title={SETTINGS_SCREEN.adminGroup} subtitle={SETTINGS_SCREEN.adminGroupSub}>
                <SettingsItem
                  icon="speedometer-outline"
                  title="Dashboard"
                  onPress={() => navigation.navigate("AdminDashboard")}
                  styles={styles}
                  c={c}
                />
                <SettingsItem
                  icon="cube-outline"
                  title="Products"
                  onPress={() => navigation.navigate("AdminProducts")}
                  styles={styles}
                  c={c}
                />
                <SettingsItem
                  icon="receipt-outline"
                  title="Orders"
                  onPress={() => navigation.navigate("AdminOrders")}
                  styles={styles}
                  c={c}
                />
                <SettingsItem
                  icon="people-outline"
                  title="Users"
                  onPress={() => navigation.navigate("AdminUsers")}
                  styles={styles}
                  c={c}
                />
                <SettingsItem
                  icon="megaphone-outline"
                  title="Broadcasts"
                  onPress={() => navigation.navigate("AdminNotifications")}
                  styles={styles}
                  c={c}
                />
                <SettingsItem
                  icon="stats-chart-outline"
                  title="Analytics"
                  onPress={() => navigation.navigate("AdminAnalytics")}
                  styles={styles}
                  c={c}
                />
                <SettingsItem
                  icon="ticket-outline"
                  title="Coupons"
                  onPress={() => navigation.navigate("AdminCoupons")}
                  styles={styles}
                  c={c}
                />
                <SettingsItem
                  icon="chatbox-ellipses-outline"
                  title="Support inbox"
                  onPress={() => navigation.navigate("AdminSupport")}
                  styles={styles}
                  c={c}
                />
              </CollapsibleSection>
            </SectionReveal>
          ) : null}

          <SectionReveal preset="fade-up" index={groupIndex} delay={staggerDelay(groupIndex++, { initialDelay: 80 })}>
            <View style={styles.dangerZone}>
              <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger zone</Text>
              <Text style={styles.sectionHelper}>You will need to sign back in for orders & address.</Text>
              <SettingsItem
                icon="log-out-outline"
                title="Log out"
                subtitle="End your session on this device"
                danger
                onPress={async () => {
                  await logout();
                  resetNavigationToHome(navigation);
                }}
                styles={styles}
                c={c}
              />
            </View>
          </SectionReveal>
        </View>
        </SectionReveal>
        </KankregPageWrap>
</KankregScrollPage>
      <BottomNavBar />
    </CustomerScreenShell>
  );
}

function createSettingsStyles(c, shadowPremium, isDark, layoutFlags = {}) {
  const { isCompactWeb = false } = layoutFlags;
  return StyleSheet.create({
    screen: {
      flex: 1},
    nativeWrap: {
      paddingHorizontal: FIGMA.gutter,
      paddingBottom: spacing.lg,
    },
    nativeCard: {
      marginBottom: 14,
      paddingVertical: 4,
    },
    nativeIconCard: {
      marginBottom: 14,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
    },
    nativeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? c.border : FIGMA.line,
    },
    nativeRowLabel: {
      flex: 1,
      fontFamily: fonts.semibold,
      fontSize: 13,
      color: c.textPrimary,
    },
    nativeRowMeta: {
      fontFamily: fonts.regular,
      fontSize: 11,
      color: c.textMuted,
    },
    nativeRowChevron: {
      fontSize: 16,
      color: c.textMuted,
    },
    panel: {
      ...customerPanel(c, shadowPremium, isDark),
      marginBottom: spacing.md + 2,
      overflow: Platform.OS === "web" ? "visible" : "hidden",
      ...Platform.select({
        web: {
          borderRadius: radius.xxl,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: isDark ? "rgba(52, 211, 153, 0.14)" : "rgba(22, 69, 51, 0.1)"},
        default: {}})},
    sectionTitle: {
      marginTop: spacing.md + 2,
      marginBottom: spacing.xs,
      color: c.textMuted,
      fontSize: typography.overline,
      fontFamily: fonts.bold,
      textTransform: "uppercase",
      letterSpacing: 1.05},
    sectionTitleFirst: {
      marginTop: 0},
    sectionHelper: {
      marginTop: -2,
      marginBottom: spacing.sm + 2,
      color: c.textMuted,
      fontSize: typography.caption,
      fontFamily: fonts.regular,
      lineHeight: 18},
    dangerZone: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? "rgba(248, 113, 113, 0.32)" : "rgba(220, 38, 38, 0.18)"},
    dangerTitle: {
      color: c.danger},
    item: {
      marginBottom: spacing.xs + 2},
    itemContent: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
      minHeight: 50,
      position: "relative",
      flexWrap: "nowrap"},
    itemHover: {
      ...Platform.select({
        web: {
          borderColor: c.primaryBorder,
          transform: [{ translateY: -1.5 }],
          boxShadow: isDark ? "0 16px 32px rgba(0,0,0,0.34)" : "0 14px 28px rgba(22, 69, 51, 0.14)"},
        default: {}})},
    itemHoverSweep: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      ...Platform.select({
        web: {
          background: isDark
            ? "linear-gradient(110deg, rgba(232,200,90,0) 30%, rgba(232,200,90,0.10) 50%, rgba(232,200,90,0) 70%)"
            : "linear-gradient(110deg, rgba(199,154,58,0) 30%, rgba(199,154,58,0.12) 50%, rgba(199,154,58,0) 70%)"},
        default: {}})},
    itemIconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.secondarySoft,
      borderWidth: 1,
      borderColor: c.secondaryBorder},
    itemIconWrapDanger: {
      backgroundColor: "rgba(220, 38, 38, 0.08)"},
    itemTextWrap: {
      flex: 1,
      minWidth: 0,
      paddingRight: spacing.xs},
    itemTitle: {
      color: c.textPrimary,
      fontSize: typography.body,
      fontFamily: fonts.bold},
    itemTitleDanger: {
      color: c.danger},
    itemSubtitle: {
      marginTop: 2,
      color: c.textSecondary,
      fontSize: typography.caption,
      fontFamily: fonts.regular,
      lineHeight: 18},
    itemChevron: {
      marginTop: isCompactWeb ? 2 : 0,
      alignSelf: isCompactWeb ? "flex-start" : "center"},
    bannerWrap: {
      marginBottom: spacing.sm},
    peNone: {
      pointerEvents: "none"}});
}
