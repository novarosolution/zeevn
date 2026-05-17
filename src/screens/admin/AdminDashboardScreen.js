import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchAdminOrders, fetchAdminProducts, fetchAdminUsers } from "../../services/adminService";
import { ADMIN_MANAGE_SECTIONS as MANAGE_SECTIONS } from "../../constants/adminNav";
import { OPS_ADMIN_OVERVIEW } from "../../constants/opsNav";
import OpsLayout from "../../components/ops/OpsLayout";
import OpsStatCard from "../../components/ops/OpsStatCard";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";
import { OPS_UI } from "../../content/appContent";
import { fonts, icon } from "../../theme/tokens";

const SECTION_GROUP_ICONS = {
  catalog: "library-outline",
  orders: "people-circle-outline",
  growth: "megaphone-outline",
  insights: "sparkles-outline",
};

export default function AdminDashboardScreen({ navigation }) {
  const { semanticPalette, TYPE, SPACING } = useTheme();
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

  const loadStats = useCallback(
    async ({ isPullRefresh = false } = {}) => {
      if (isPullRefresh) setRefreshing(true);
      else setLoading(true);
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
        if (isPullRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadStats();
  }, [user?.isAdmin, loadStats]);

  const quickActions = useMemo(
    () => [
      { route: "AdminOrders", label: OPS_UI.stats.orders, icon: "receipt-outline", badge: stats.pendingOrders },
      { route: "AdminProducts", label: OPS_UI.stats.products, icon: "cube-outline" },
      { route: "AdminAnalytics", label: "Analytics", icon: "bar-chart-outline" },
      { route: "AdminNotifications", label: "Notify", icon: "notifications-outline" },
    ],
    [stats.pendingOrders]
  );

  const refreshControl =
    Platform.OS === "web" ? undefined : (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={() => loadStats({ isPullRefresh: true })}
        tintColor={semanticPalette.ink}
        colors={[semanticPalette.ink]}
      />
    );

  if (user && !user.isAdmin) {
    return (
      <OpsLayout
        navigation={navigation}
        mode="admin"
        activeRoute={OPS_ADMIN_OVERVIEW.route}
        sectionTitle="Access"
      >
        <EmptyState
          iconName="shield-outline"
          title={OPS_UI.accessTitle}
          description={OPS_UI.accessDescription}
          ctaLabel={OPS_UI.backHomeCta}
          onCtaPress={() => navigation.navigate("Home")}
        />
      </OpsLayout>
    );
  }

  return (
    <OpsLayout
      navigation={navigation}
      mode="admin"
      activeRoute={OPS_ADMIN_OVERVIEW.route}
      sectionTitle={OPS_UI.overviewTitle}
      refreshControl={refreshControl}
      headerRight={
        <Button
          variant="ghost"
          size="sm"
          label={OPS_UI.refreshCta}
          iconLeft={<Ionicons name="refresh-outline" size={icon.sm} color={semanticPalette.ink} />}
          onPress={() => loadStats()}
        />
      }
    >
      {error ? (
        <Text style={{ color: semanticPalette.sale, marginBottom: SPACING.md, fontFamily: fonts.medium }}>
          {error}
        </Text>
      ) : null}

      {loading ? (
        <View style={{ gap: SPACING.md }}>
          <Skeleton height={88} />
          <Skeleton height={120} />
        </View>
      ) : (
        <>
          <View style={styles.statGrid}>
            <OpsStatCard label={OPS_UI.stats.products} value={String(stats.products)} caption={OPS_UI.stats.productsCaption} />
            <OpsStatCard label={OPS_UI.stats.orders} value={String(stats.orders)} caption={OPS_UI.stats.ordersCaption} />
            <OpsStatCard label={OPS_UI.stats.users} value={String(stats.users)} caption={OPS_UI.stats.usersCaption} />
            <OpsStatCard label={OPS_UI.stats.admins} value={String(stats.admins)} caption={OPS_UI.stats.adminsCaption} />
            <OpsStatCard
              label={OPS_UI.stats.pending}
              value={String(stats.pendingOrders)}
              caption={stats.pendingOrders > 0 ? OPS_UI.stats.pendingAttention : OPS_UI.stats.pendingClear}
            />
          </View>

          <Text
            style={{
              fontFamily: fonts.semibold,
              fontSize: TYPE.micro.fontSize,
              letterSpacing: 1.1,
              textTransform: "uppercase",
              color: semanticPalette.inkMuted,
              marginBottom: SPACING.sm,
            }}
          >
            {OPS_UI.quickOpen}
          </Text>
          <View style={[styles.quickRow, { gap: SPACING.md }]}>
            {quickActions.map((qa) => (
              <Card
                key={qa.route}
                onPress={() => navigation.navigate(qa.route)}
                padding="md"
                style={styles.quickTile}
                accessibilityLabel={`Open ${qa.label}`}
              >
                <View style={styles.quickIcon}>
                  <Ionicons name={qa.icon} size={icon.md} color={semanticPalette.accent} />
                  {qa.badge > 0 ? (
                    <Badge variant="warning" size="sm" style={styles.quickBadge}>
                      {qa.badge > 99 ? "99+" : String(qa.badge)}
                    </Badge>
                  ) : null}
                </View>
                <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.small.fontSize, color: semanticPalette.ink }}>
                  {qa.label}
                </Text>
              </Card>
            ))}
          </View>

          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: SPACING.sm, marginTop: SPACING.md }}>
            <Button variant="ghost" size="sm" label={OPS_UI.expandAll} onPress={() => setOpenSections(Object.fromEntries(MANAGE_SECTIONS.map((s) => [s.id, true])))} />
            <Button variant="ghost" size="sm" label={OPS_UI.collapseAll} onPress={() => setOpenSections(Object.fromEntries(MANAGE_SECTIONS.map((s) => [s.id, false])))} />
          </View>

          <Text
            style={{
              fontFamily: fonts.semibold,
              fontSize: TYPE.micro.fontSize,
              letterSpacing: 1.1,
              textTransform: "uppercase",
              color: semanticPalette.inkMuted,
              marginTop: SPACING.lg,
              marginBottom: SPACING.xs,
            }}
          >
            {OPS_UI.allTools}
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.caption.fontSize, color: semanticPalette.inkSoft, marginBottom: SPACING.md }}>
            {OPS_UI.allToolsHint}
          </Text>

          {MANAGE_SECTIONS.map((section) => {
            const open = openSections[section.id] !== false;
            const groupIcon = SECTION_GROUP_ICONS[section.id] || "folder-outline";
            return (
              <Card key={section.id} padding="none" style={{ marginBottom: SPACING.md, overflow: "hidden" }}>
                <Pressable
                  onPress={() => toggleSection(section.id)}
                  style={({ pressed, hovered }) => [
                    styles.sectionHead,
                    { padding: SPACING.base },
                    hovered && Platform.OS === "web" ? { backgroundColor: semanticPalette.surfaceAlt } : null,
                    pressed ? { opacity: 0.9 } : null,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${section.label}, ${section.items.length} tools`}
                  accessibilityState={{ expanded: open }}
                >
                  <Ionicons name={groupIcon} size={icon.md} color={semanticPalette.accent} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }}>
                      {section.label}
                    </Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.caption.fontSize, color: semanticPalette.inkSoft }}>
                      {section.items.length} shortcuts
                    </Text>
                  </View>
                  {section.id === "orders" && stats.pendingOrders > 0 ? (
                    <Badge variant="warning" size="sm">
                      {stats.pendingOrders}
                    </Badge>
                  ) : null}
                  <Ionicons name={open ? "chevron-up" : "chevron-down"} size={icon.sm} color={semanticPalette.inkMuted} />
                </Pressable>
                {open
                  ? section.items.map((item, idx) => (
                      <Pressable
                        key={item.route}
                        onPress={() => navigation.navigate(item.route)}
                        style={({ pressed, hovered }) => [
                          styles.toolRow,
                          {
                            paddingVertical: SPACING.sm,
                            paddingHorizontal: SPACING.base,
                            borderTopWidth: idx === 0 ? 0 : StyleSheet.hairlineWidth,
                            borderTopColor: semanticPalette.line,
                          },
                          hovered && Platform.OS === "web" ? { backgroundColor: semanticPalette.surfaceAlt } : null,
                          pressed ? { opacity: 0.9 } : null,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={item.title}
                      >
                        <Ionicons name={item.icon} size={icon.sm} color={semanticPalette.inkMuted} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.small.fontSize, color: semanticPalette.ink }}>
                            {item.title}
                          </Text>
                          <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.caption.fontSize, color: semanticPalette.inkSoft }} numberOfLines={1}>
                            {item.subtitle}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={icon.sm} color={semanticPalette.inkMuted} />
                      </Pressable>
                    ))
                  : null}
              </Card>
            );
          })}
        </>
      )}
    </OpsLayout>
  );
}

const styles = StyleSheet.create({
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  quickTile: {
    minWidth: 120,
    flexGrow: 1,
    flexBasis: "22%",
    alignItems: "center",
  },
  quickIcon: {
    position: "relative",
    marginBottom: 8,
  },
  quickBadge: {
    position: "absolute",
    top: -6,
    right: -10,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toolRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
