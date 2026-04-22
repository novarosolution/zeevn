import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AppFooter from "../components/AppFooter";
import BottomNavBar from "../components/BottomNavBar";
import AuthGateShell from "../components/AuthGateShell";
import CustomerScreenShell from "../components/CustomerScreenShell";
import ScreenPageHeader from "../components/ScreenPageHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { fetchMyNotifications, markMyNotificationRead } from "../services/userService";
import { customerPageScrollBase, customerPanel, customerScrollFill } from "../theme/screenLayout";
import { ALCHEMY } from "../theme/customerAlchemy";
import { fonts, radius, spacing, typography } from "../theme/tokens";

export default function NotificationsScreen({ navigation }) {
  const { colors: c, shadowPremium, shadowLift, isDark } = useTheme();
  const styles = useMemo(() => createNotificationsStyles(c, shadowPremium, shadowLift, isDark), [c, shadowPremium, shadowLift, isDark]);
  const insets = useSafeAreaInsets();
  const { isAuthenticated, token, isAuthLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      navigation.navigate("Login");
    }
  }, [isAuthLoading, isAuthenticated, navigation]);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchMyNotifications(token);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return;
    loadNotifications();
  }, [isAuthLoading, isAuthenticated, loadNotifications]);

  const handleOpenNotification = async (notification) => {
    try {
      if (!notification?.isRead) {
        await markMyNotificationRead(token, notification._id);
      }
      setNotifications((current) =>
        current.map((item) => (item._id === notification._id ? { ...item, isRead: true } : item))
      );
    } catch (err) {
      setError(err.message || "Unable to open notification.");
    }
  };

  if (isAuthLoading || !isAuthenticated) {
    return <AuthGateShell />;
  }

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
        <ScreenPageHeader navigation={navigation} title="Notifications" subtitle="Offers & order updates" />
        <View style={styles.panel}>
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <View style={styles.titleIconWrap}>
                <Ionicons name="mail-unread-outline" size={22} color={c.secondary} />
              </View>
              <Text style={styles.title}>Notifications</Text>
            </View>
            <TouchableOpacity style={styles.refreshBtn} onPress={loadNotifications}>
              <Ionicons name="refresh" size={16} color={c.secondary} />
              <Text style={styles.refreshBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator color={c.primary} />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.panel}>
            <View style={styles.emptyVisual}>
              <Ionicons name="notifications-off-outline" size={48} color={c.primaryBorder} />
              <Text style={styles.emptyTitle}>You’re all caught up</Text>
              <Text style={styles.emptyText}>No messages yet. We’ll notify you when something arrives.</Text>
            </View>
          </View>
        ) : (
          notifications.map((item) => (
            <TouchableOpacity
              key={item._id}
              style={[styles.noticeCard, !item.isRead ? styles.noticeCardUnread : null]}
              onPress={() => handleOpenNotification(item)}
            >
              <View style={styles.noticeHeader}>
                <Text style={styles.noticeTitle}>{item.title}</Text>
                {!item.isRead ? <View style={styles.unreadDot} /> : null}
              </View>
              <Text style={styles.noticeText}>{item.message}</Text>
              <Text style={styles.noticeTime}>
                {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
              </Text>
            </TouchableOpacity>
          ))
        )}
        <AppFooter />
      </ScrollView>
      <BottomNavBar />
    </CustomerScreenShell>
  );
}

function createNotificationsStyles(c, shadowPremium, shadowLift, isDark) {
  return StyleSheet.create({
  screen: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  titleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: c.primarySoft,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  panel: {
    ...customerPanel(c, shadowPremium),
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  title: {
    color: c.textPrimary,
    fontSize: typography.h3,
    fontFamily: fonts.extrabold,
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  refreshBtnText: {
    color: c.primary,
    fontSize: typography.caption,
    fontFamily: fonts.bold,
  },
  loaderWrap: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  noticeCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? c.border : ALCHEMY.pillInactive,
    borderTopWidth: 2,
    borderTopColor: isDark ? c.primaryBorder : ALCHEMY.gold,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: isDark ? c.surface : ALCHEMY.cardBg,
    marginBottom: spacing.sm,
    ...shadowLift,
  },
  noticeCardUnread: {
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft,
    borderTopColor: isDark ? c.primaryBright : ALCHEMY.brown,
  },
  noticeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  noticeTitle: {
    flex: 1,
    color: c.textPrimary,
    fontSize: typography.bodySmall,
    fontFamily: fonts.bold,
  },
  noticeText: {
    marginTop: 4,
    color: c.textSecondary,
    fontSize: typography.caption,
    fontFamily: fonts.regular,
    lineHeight: 18,
  },
  noticeTime: {
    marginTop: 6,
    color: c.textMuted,
    fontSize: typography.overline + 1,
    fontFamily: fonts.semibold,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: c.primary,
  },
  emptyVisual: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  emptyTitle: {
    marginTop: spacing.md,
    fontSize: typography.h3,
    fontFamily: fonts.extrabold,
    color: c.textPrimary,
  },
  emptyText: {
    marginTop: spacing.sm,
    color: c.textSecondary,
    textAlign: "center",
    fontSize: typography.body,
    fontFamily: fonts.regular,
    lineHeight: 22,
    maxWidth: 280,
  },
  errorText: {
    color: c.danger,
    marginTop: spacing.xs,
    fontFamily: fonts.semibold,
    fontSize: typography.caption,
  },
  });
}
