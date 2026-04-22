import React, { useMemo, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AppFooter from "../components/AppFooter";
import BottomNavBar from "../components/BottomNavBar";
import CustomerScreenShell from "../components/CustomerScreenShell";
import ScreenPageHeader from "../components/ScreenPageHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { resetNavigationToHome } from "../navigation/resetToHome";
import { registerForPushNotifications } from "../services/pushNotificationService";
import { customerPageScrollBase, customerPanel, customerScrollFill } from "../theme/screenLayout";
import { ALCHEMY } from "../theme/customerAlchemy";
import { fonts, radius, spacing, typography } from "../theme/tokens";

function SettingsItem({ icon, title, subtitle, onPress, danger = false, styles, c }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.88}>
      <View style={[styles.itemIconWrap, danger ? styles.itemIconWrapDanger : null]}>
        <Ionicons name={icon} size={18} color={danger ? c.danger : c.secondary} />
      </View>
      <View style={styles.itemTextWrap}>
        <Text style={[styles.itemTitle, danger ? styles.itemTitleDanger : null]}>{title}</Text>
        {subtitle ? <Text style={styles.itemSubtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, token, user, logout } = useAuth();
  const [permissionMsg, setPermissionMsg] = useState("");
  const [error, setError] = useState("");
  const { colors: c, shadowPremium, mode, setMode, isDark } = useTheme();
  const styles = useMemo(() => createSettingsStyles(c, shadowPremium, isDark), [c, shadowPremium, isDark]);

  const themeSubtitle =
    mode === "system" ? "Match system" : mode === "dark" ? "Dark mode" : "Light mode";

  const cycleTheme = () => {
    setMode(mode === "light" ? "dark" : mode === "dark" ? "system" : "light");
  };

  const handleEnableNotifications = async () => {
    try {
      setError("");
      setPermissionMsg("");
      const result = await registerForPushNotifications(token);
      if (result.enabled) {
        setPermissionMsg("Notifications are enabled.");
      } else {
        setPermissionMsg("Notification permission is not granted.");
      }
    } catch (err) {
      setError(err.message || "Unable to update notification permission.");
    }
  };

  return (
    <CustomerScreenShell style={styles.screen}>
      <ScrollView
        style={customerScrollFill}
        contentContainerStyle={[
          customerPageScrollBase,
          { paddingTop: Math.max(insets.top, Platform.OS === "web" ? spacing.md : spacing.sm) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenPageHeader
          navigation={navigation}
          title="Settings"
          subtitle="Theme, notifications & profile"
          showBack={false}
        />
        <View style={styles.panel}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {permissionMsg ? <Text style={styles.successText}>{permissionMsg}</Text> : null}

          <Text style={[styles.sectionTitle, styles.sectionTitleFirst]}>Appearance</Text>
          <SettingsItem
            icon="contrast-outline"
            title="Theme"
            subtitle={themeSubtitle}
            onPress={cycleTheme}
            styles={styles}
            c={c}
          />

          <Text style={styles.sectionTitle}>Account</Text>
          <SettingsItem
            icon="create-outline"
            title="Edit profile"
            subtitle="Name, phone & delivery"
            onPress={() => navigation.navigate("EditProfile")}
            styles={styles}
            c={c}
          />
          <SettingsItem
            icon="person-outline"
            title="Account overview"
            subtitle="Orders & shortcuts"
            onPress={() => navigation.navigate("Profile")}
            styles={styles}
            c={c}
          />
          <SettingsItem
            icon="location-outline"
            title="Delivery address"
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

          <Text style={styles.sectionTitle}>Notifications</Text>
          <SettingsItem
            icon="notifications-outline"
            title="Push notifications"
            onPress={handleEnableNotifications}
            styles={styles}
            c={c}
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

          {isAuthenticated && user?.isAdmin ? (
            <>
              <Text style={styles.sectionTitle}>Admin</Text>
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
            </>
          ) : null}

          <Text style={styles.sectionTitle}>Session</Text>
          <SettingsItem
            icon="log-out-outline"
            title="Log out"
            danger
            onPress={async () => {
              await logout();
              resetNavigationToHome(navigation);
            }}
            styles={styles}
            c={c}
          />
        </View>
        <AppFooter />
      </ScrollView>
      <BottomNavBar />
    </CustomerScreenShell>
  );
}

function createSettingsStyles(c, shadowPremium, isDark) {
  const itemBorder = isDark ? c.border : ALCHEMY.pillInactive;
  const itemBg = isDark ? c.surface : ALCHEMY.cardBg;
  return StyleSheet.create({
    screen: {
      flex: 1,
    },
    panel: {
      ...customerPanel(c, shadowPremium),
      marginBottom: spacing.md,
      overflow: "hidden",
    },
    sectionTitle: {
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      color: c.textMuted,
      fontSize: typography.overline,
      fontFamily: fonts.bold,
      textTransform: "uppercase",
      letterSpacing: 1.05,
    },
    sectionTitleFirst: {
      marginTop: 0,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: itemBorder,
      backgroundColor: itemBg,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      minHeight: 50,
      marginBottom: spacing.xs,
      ...Platform.select({
        web: {
          boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.2)" : "0 2px 10px rgba(61, 42, 18, 0.05)",
        },
        default: {},
      }),
    },
    itemIconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.secondarySoft,
      borderWidth: 1,
      borderColor: c.secondaryBorder,
    },
    itemIconWrapDanger: {
      backgroundColor: "rgba(220, 38, 38, 0.08)",
    },
    itemTextWrap: {
      flex: 1,
    },
    itemTitle: {
      color: c.textPrimary,
      fontSize: typography.bodySmall,
      fontFamily: fonts.bold,
    },
    itemTitleDanger: {
      color: c.danger,
    },
    itemSubtitle: {
      marginTop: 2,
      color: c.textSecondary,
      fontSize: typography.caption,
      fontFamily: fonts.regular,
    },
    errorText: {
      color: c.danger,
      fontFamily: fonts.semibold,
      marginBottom: spacing.sm,
    },
    successText: {
      color: c.success,
      fontFamily: fonts.semibold,
      marginBottom: spacing.sm,
    },
  });
}
