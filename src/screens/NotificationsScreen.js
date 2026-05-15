import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, RefreshControl, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppFooter from "../components/AppFooter";
import BottomNavBar from "../components/BottomNavBar";
import AuthGateShell from "../components/AuthGateShell";
import CustomerScreenShell from "../components/CustomerScreenShell";
import ScreenPageHeader from "../components/ScreenPageHeader";
import MotionScrollView from "../components/motion/MotionScrollView";
import SectionReveal from "../components/motion/SectionReveal";
import { staggerDelay } from "../theme/motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  archiveMyNotification,
  fetchMyNotificationsIncludingArchived,
  markMyNotificationRead,
  unarchiveMyNotification,
} from "../services/userService";
import {
  customerInnerPageScrollContent,
  customerPanel,
  customerScrollFill,
} from "../theme/screenLayout";
import { ALCHEMY } from "../theme/customerAlchemy";
import { fonts, radius, spacing, typography } from "../theme/tokens";
import PremiumLoader from "../components/ui/PremiumLoader";
import PremiumEmptyState from "../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../components/ui/PremiumErrorBanner";
import PremiumChip from "../components/ui/PremiumChip";
import SkeletonBlock from "../components/ui/SkeletonBlock";
import PremiumButton from "../components/ui/PremiumButton";
import PremiumCard from "../components/ui/PremiumCard";
import { APP_LOADING_UI, NOTIFICATIONS_SCREEN, fillPlaceholders } from "../content/appContent";

function UnreadDot({ color }) {
  return (
    <View style={{ width: 12, height: 12, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute",
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: color,
          opacity: 0.45,
          pointerEvents: "none",
        }}
      />
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

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
  const { width } = useWindowDimensions();
  const isCompactWeb = Platform.OS === "web" && width < 760;
  const { colors: c, shadowPremium, shadowLift, isDark } = useTheme();
  const styles = useMemo(
    () => createNotificationsStyles(c, shadowPremium, shadowLift, isDark, { isCompactWeb }),
    [c, shadowPremium, shadowLift, isDark, isCompactWeb]
  );
  const insets = useSafeAreaInsets();
  const { isAuthenticated, token, isAuthLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const activeNotifications = useMemo(
    () => notifications.filter((n) => !n.isArchived),
    [notifications]
  );
  const archivedNotifications = useMemo(
    () => notifications.filter((n) => n.isArchived),
    [notifications]
  );
  const unreadCount = useMemo(
    () => activeNotifications.filter((n) => !n.isRead).length,
    [activeNotifications]
  );
  const filteredNotifications = useMemo(() => {
    if (filter === "unread") return activeNotifications.filter((n) => !n.isRead);
    if (filter === "archived") return archivedNotifications;
    return activeNotifications;
  }, [filter, activeNotifications, archivedNotifications]);
  const notificationSections = useMemo(() => {
    const groups = groupByDate(filteredNotifications);
    return [
      { key: "today", label: NOTIFICATIONS_SCREEN.sectionToday, items: groups.today },
      { key: "week", label: NOTIFICATIONS_SCREEN.sectionThisWeek, items: groups.week },
      { key: "earlier", label: NOTIFICATIONS_SCREEN.sectionEarlier, items: groups.earlier },
    ].filter((s) => s.items.length > 0);
  }, [filteredNotifications]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      navigation.navigate("Login");
    }
  }, [isAuthLoading, isAuthenticated, navigation]);

  const loadNotifications = useCallback(async (opts = {}) => {
    const { silent } = opts;
    const startedAt = Date.now();
    try {
      if (!silent) setLoading(true);
      setError("");
      const data = await fetchMyNotificationsIncludingArchived(token);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || NOTIFICATIONS_SCREEN.errorLoad);
    } finally {
      if (!silent) {
        const elapsed = Date.now() - startedAt;
        const minimumLoaderMs = 320;
        if (elapsed < minimumLoaderMs) {
          await new Promise((resolve) => setTimeout(resolve, minimumLoaderMs - elapsed));
        }
        setLoading(false);
      }
    }
  }, [token]);

  const onPullRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadNotifications({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadNotifications]);

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
      setError(err.message || NOTIFICATIONS_SCREEN.errorOpen);
    }
  };

  const handleArchiveToggle = async (notification) => {
    try {
      setError("");
      if (notification.isArchived) {
        await unarchiveMyNotification(token, notification._id);
      } else {
        await archiveMyNotification(token, notification._id);
      }
      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id ? { ...item, isArchived: !notification.isArchived } : item
        )
      );
    } catch (err) {
      setError(err.message || NOTIFICATIONS_SCREEN.errorUpdate);
    }
  };

  if (isAuthLoading || !isAuthenticated) {
    return <AuthGateShell />;
  }

  return (
    <CustomerScreenShell style={styles.screen}>
      <MotionScrollView
        style={customerScrollFill}
        contentContainerStyle={customerInnerPageScrollContent(insets)}
        showsVerticalScrollIndicator={false}
        refreshControl={
          Platform.OS === "web" ? undefined : (
            <RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} tintColor={c.primary} colors={[c.primary]} />
          )
        }
      >
        <ScreenPageHeader
          navigation={navigation}
          title={NOTIFICATIONS_SCREEN.pageTitle}
          subtitle={NOTIFICATIONS_SCREEN.pageSubtitle}
          right={
            Platform.OS !== "web" ? (
              <PremiumButton
                label={NOTIFICATIONS_SCREEN.refreshCta}
                iconLeft="refresh-outline"
                variant="ghost"
                size="sm"
                onPress={() => loadNotifications()}
              />
            ) : undefined
          }
        />
        {error ? (
          <SectionReveal preset="fade-up" delay={40}>
            <View style={styles.bannerWrap}>
              <PremiumErrorBanner severity="error" message={error} compact />
            </View>
          </SectionReveal>
        ) : null}

        {loading ? (
          <View style={styles.loaderWrap}>
            <View style={styles.loadingChipRow}>
              <SkeletonBlock width={72} height={32} rounded="pill" />
              <SkeletonBlock width={92} height={32} rounded="pill" />
            </View>
            <SkeletonBlock width="100%" height={86} rounded="lg" />
            <SkeletonBlock width="100%" height={86} rounded="lg" />
            <SkeletonBlock width="100%" height={86} rounded="lg" />
            <PremiumLoader size="sm" caption={APP_LOADING_UI.inline.notifications} />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.panel}>
            <PremiumEmptyState
              iconName="notifications-off-outline"
              title={NOTIFICATIONS_SCREEN.emptyAllTitle}
              description={NOTIFICATIONS_SCREEN.emptyAllDescription}
            />
          </View>
        ) : (
          (() => {
            let cardIdx = 0;
            return (
              <>
                <View style={styles.filterRow}>
                  <PremiumChip
                    label={fillPlaceholders(NOTIFICATIONS_SCREEN.filterAllWithCount, {
                      count: activeNotifications.length,
                    })}
                    tone={filter === "all" ? "gold" : "neutral"}
                    selected={filter === "all"}
                    size="lg"
                    onPress={() => setFilter("all")}
                  />
                  <PremiumChip
                    label={
                      unreadCount > 0
                        ? fillPlaceholders(NOTIFICATIONS_SCREEN.filterUnreadWithCount, { count: unreadCount })
                        : NOTIFICATIONS_SCREEN.filterUnreadOnly
                    }
                    tone={filter === "unread" ? "info" : "neutral"}
                    selected={filter === "unread"}
                    size="lg"
                    onPress={() => setFilter("unread")}
                  />
                  <PremiumChip
                    label={fillPlaceholders(NOTIFICATIONS_SCREEN.filterArchivedWithCount, {
                      count: archivedNotifications.length,
                    })}
                    tone={filter === "archived" ? "info" : "neutral"}
                    selected={filter === "archived"}
                    size="lg"
                    onPress={() => setFilter("archived")}
                  />
                </View>
                <Text style={styles.filterMetaText}>
                  {filter === "archived"
                    ? NOTIFICATIONS_SCREEN.filterHintArchived
                    : NOTIFICATIONS_SCREEN.filterHintActive}
                </Text>
                {filteredNotifications.length === 0 ? (
                  <View style={styles.panel}>
                    <PremiumEmptyState
                      iconName="checkmark-done-outline"
                      title={NOTIFICATIONS_SCREEN.emptyUnreadTitle}
                      description={NOTIFICATIONS_SCREEN.emptyUnreadDescription}
                    />
                  </View>
                ) : null}
                {notificationSections.map((section) => (
                  <View key={section.key} style={styles.groupBlock}>
                    <Text style={styles.groupHeading}>{section.label}</Text>
                    {section.items.map((item) => {
                      const localIdx = cardIdx++;
                      return (
                        <SectionReveal
                          key={item._id}
                          preset="fade-up"
                          index={localIdx}
                          delay={staggerDelay(localIdx, { initialDelay: 60 })}
                        >
                          <PremiumCard
                            onPress={() => handleOpenNotification(item)}
                            variant={!item.isRead ? "accent" : "list"}
                            padding="md"
                            style={[styles.noticeCard, !item.isRead ? styles.noticeCardUnread : null]}
                          >
                            <View style={styles.noticeHeader}>
                              <Text style={styles.noticeTitle}>{item.title}</Text>
                              {!item.isRead ? <UnreadDot color={c.primary} /> : null}
                            </View>
                            <Text style={styles.noticeText}>{item.message}</Text>
                            <Text style={styles.noticeTime}>
                              {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                            </Text>
                            <View style={styles.noticeActionRow}>
                              <PremiumChip
                                label={item.isArchived ? NOTIFICATIONS_SCREEN.actionRestore : NOTIFICATIONS_SCREEN.actionArchive}
                                tone="neutral"
                                size="sm"
                                onPress={() => handleArchiveToggle(item)}
                              />
                            </View>
                          </PremiumCard>
                        </SectionReveal>
                      );
                    })}
                  </View>
                ))}
              </>
            );
          })()
        )}
        <AppFooter />
      </MotionScrollView>
      <BottomNavBar />
    </CustomerScreenShell>
  );
}

function createNotificationsStyles(c, shadowPremium, shadowLift, isDark, layoutFlags = {}) {
  const { isCompactWeb = false } = layoutFlags;
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
    ...customerPanel(c, shadowPremium, isDark),
    marginBottom: spacing.md + 2,
    overflow: Platform.OS === "web" ? "visible" : "hidden",
    ...Platform.select({
      web: {
        borderRadius: radius.xxl,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: isDark ? "rgba(220, 38, 38, 0.14)" : "rgba(63, 63, 70, 0.1)",
      },
      default: {},
    }),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: isCompactWeb ? "flex-start" : "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    flexWrap: isCompactWeb ? "wrap" : "nowrap",
  },
  title: {
    color: c.textPrimary,
    fontSize: typography.h2 + 1,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.3,
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    gap: 5,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    ...Platform.select({
      web: {
        boxShadow: isDark ? "0 10px 20px rgba(0,0,0,0.24)" : "0 8px 16px rgba(24, 24, 27, 0.1)",
      },
      default: {},
    }),
  },
  refreshBtnText: {
    color: c.primary,
    fontSize: typography.caption,
    fontFamily: fonts.bold,
  },
  loaderWrap: {
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loadingChipRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  filterMetaText: {
    marginTop: -2,
    marginBottom: spacing.sm,
    color: c.textMuted,
    fontSize: typography.caption,
    fontFamily: fonts.regular,
    lineHeight: 18,
  },
  groupBlock: {
    marginBottom: spacing.sm + 2,
  },
  groupHeading: {
    fontFamily: fonts.extrabold,
    fontSize: typography.overline,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: c.textMuted,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  bannerWrap: {
    marginTop: spacing.sm,
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
    ...Platform.select({
      web: {
        boxShadow: isDark
          ? "0 14px 30px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.03)"
          : "0 12px 26px rgba(24, 24, 27, 0.09), inset 0 1px 0 rgba(255,255,255,0.85)",
      },
      default: {},
    }),
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
    minWidth: 0,
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
  noticeActionRow: {
    marginTop: spacing.xs,
    flexDirection: "row",
    justifyContent: "flex-end",
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
    maxWidth: 360,
  },
  errorText: {
    color: c.danger,
    marginTop: spacing.xs,
    fontFamily: fonts.semibold,
    fontSize: typography.caption,
  },
  });
}
