import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, RefreshControl, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Screen from "../components/ui/Screen";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";
import AppFooter from "../components/AppFooter";
import BottomNavBar from "../components/BottomNavBar";
import AuthGateShell from "../components/AuthGateShell";
import NotificationFilterPills from "../components/notifications/NotificationFilterPills";
import NotificationListItem from "../components/notifications/NotificationListItem";
import NetworkErrorState from "../components/utility/NetworkErrorState";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { fonts } from "../theme/tokens";
import {
  archiveMyNotification,
  fetchMyNotificationsIncludingArchived,
  markMyNotificationRead,
} from "../services/userService";
import { NOTIFICATIONS_SCREEN } from "../content/appContent";
import { getNotificationCategory } from "../utils/notificationCategory";
import useRouteMeta from "../hooks/useRouteMeta";

function groupByDate(items) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;
  const groups = { today: [], week: [], earlier: [] };
  items.forEach((item) => {
    const ts = new Date(item.createdAt || 0).getTime() || 0;
    if (ts >= startOfToday) groups.today.push(item);
    else if (ts >= startOfWeek) groups.week.push(item);
    else groups.earlier.push(item);
  });
  return groups;
}

export default function NotificationsScreen({ navigation }) {
  useRouteMeta("notifications");
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const { isAuthenticated, token, isAuthLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [category, setCategory] = useState("all");

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) navigation.navigate("Login");
  }, [isAuthLoading, isAuthenticated, navigation]);

  const loadNotifications = useCallback(async (opts = {}) => {
    const { silent } = opts;
    try {
      if (!silent) setLoading(true);
      setError("");
      const data = await fetchMyNotificationsIncludingArchived(token);
      setNotifications(Array.isArray(data) ? data.filter((n) => !n.isArchived) : []);
    } catch (err) {
      setError(err.message || NOTIFICATIONS_SCREEN.errorLoad);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthLoading && isAuthenticated) loadNotifications();
    }, [isAuthLoading, isAuthenticated, loadNotifications])
  );

  const onPullRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadNotifications({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadNotifications]);

  const filtered = useMemo(() => {
    if (category === "all") return notifications;
    return notifications.filter((n) => getNotificationCategory(n) === category);
  }, [category, notifications]);

  const sections = useMemo(() => {
    const groups = groupByDate(filtered);
    return [
      { key: "today", label: NOTIFICATIONS_SCREEN.sectionToday, items: groups.today },
      { key: "week", label: NOTIFICATIONS_SCREEN.sectionThisWeek, items: groups.week },
      { key: "earlier", label: NOTIFICATIONS_SCREEN.sectionEarlier, items: groups.earlier },
    ].filter((s) => s.items.length > 0);
  }, [filtered]);

  const handleOpen = async (notification) => {
    try {
      if (!notification?.isRead) {
        await markMyNotificationRead(token, notification._id);
        setNotifications((current) =>
          current.map((item) => (item._id === notification._id ? { ...item, isRead: true } : item))
        );
      }
    } catch (err) {
      setError(err.message || NOTIFICATIONS_SCREEN.errorOpen);
    }
  };

  const handleDismiss = async (notification) => {
    try {
      setError("");
      await archiveMyNotification(token, notification._id);
      setNotifications((current) => current.filter((item) => item._id !== notification._id));
    } catch (err) {
      setError(err.message || NOTIFICATIONS_SCREEN.errorUpdate);
    }
  };

  if (isAuthLoading || !isAuthenticated) {
    return <AuthGateShell />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Screen
        navigation={navigation}
        title={NOTIFICATIONS_SCREEN.pageTitle}
        breadcrumbLabel={NOTIFICATIONS_SCREEN.pageTitle}
        refreshControl={
          Platform.OS === "web" ? undefined : (
            <RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} tintColor={semanticPalette.ink} />
          )
        }
      >
        <NotificationFilterPills active={category} onChange={setCategory} />

        {error && !loading ? (
          <View style={{ marginBottom: SPACING.lg }}>
            <NetworkErrorState onRetry={() => loadNotifications()} description={error} />
          </View>
        ) : null}

        {loading ? (
          <View style={{ gap: SPACING.md }}>
            <Skeleton height={88} />
            <Skeleton height={88} />
            <Skeleton height={88} />
          </View>
        ) : filtered.length === 0 && !error ? (
          <EmptyState
            iconName="notifications-off-outline"
            title={NOTIFICATIONS_SCREEN.emptyAllTitle}
            description={NOTIFICATIONS_SCREEN.emptyAllDescription}
          />
        ) : (
          sections.map((section) => (
            <View key={section.key} style={{ marginBottom: SPACING.lg }}>
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: TYPE.micro.fontSize,
                  letterSpacing: 1.4,
                  textTransform: "uppercase",
                  color: semanticPalette.inkMuted,
                  marginBottom: SPACING.sm,
                }}
              >
                {section.label}
              </Text>
              {section.items.map((item) => (
                <NotificationListItem
                  key={item._id}
                  item={item}
                  onPress={() => handleOpen(item)}
                  onDismiss={() => handleDismiss(item)}
                />
              ))}
            </View>
          ))
        )}

        <AppFooter webTight />
      </Screen>
      <BottomNavBar />
    </View>
  );
}
