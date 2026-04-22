import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BarChart, LineChart, PieChart } from "react-native-chart-kit";
import AppFooter from "../../components/AppFooter";
import CustomerScreenShell from "../../components/CustomerScreenShell";
import AdminBackLink from "../../components/admin/AdminBackLink";
import { useAuth } from "../../context/AuthContext";
import { fetchAdminAnalytics } from "../../services/adminService";
import { useTheme } from "../../context/ThemeContext";
import { ALCHEMY, FONT_DISPLAY, FONT_DISPLAY_SEMI } from "../../theme/customerAlchemy";
import { adminPanel } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, layout, radius, spacing, typography } from "../../theme/tokens";
import { formatINR } from "../../utils/currency";

function hexToRgb(hex) {
  const h = String(hex || "").replace("#", "");
  if (h.length !== 6) return { r: 184, g: 134, b: 11 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export default function AdminAnalyticsScreen({ navigation }) {
  const { user, token } = useAuth();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors: c, shadowLift: themeShadowLift, shadowPremium: themeShadowPremium, isDark } =
    useTheme();
  const styles = useMemo(
    () => createAdminAnalyticsStyles(c, themeShadowLift, themeShadowPremium, isDark),
    [c, themeShadowLift, themeShadowPremium, isDark]
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const chartWidth = Math.min(760, Math.max(280, width - spacing.lg * 3));

  const statusColors = useMemo(
    () => [c.primary, c.secondary, c.accentGold, "#0ea5e9", "#22c55e", "#7D6B5A"],
    [c.primary, c.secondary, c.accentGold]
  );

  const chartConfig = useMemo(() => {
    const rgb = hexToRgb(c.primary);
    const labelRgb = hexToRgb(isDark ? "#FAFAF9" : "#1C1917");
    return {
      backgroundGradientFrom: c.surface,
      backgroundGradientTo: c.surface,
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(${labelRgb.r}, ${labelRgb.g}, ${labelRgb.b}, ${opacity})`,
      strokeWidth: 2,
      barPercentage: 0.62,
      propsForDots: {
        r: "4",
        strokeWidth: "2",
        stroke: c.secondary,
      },
    };
  }, [c.surface, c.primary, c.secondary, isDark]);

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError("");
      const data = await fetchAdminAnalytics(token);
      setAnalytics(data);
    } catch (err) {
      setError(err.message || "Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadAnalytics();
  }, [user?.isAdmin]);

  function SectionHeader({ title, icon }) {
    return (
      <View style={styles.sectionHeader}>
        {icon ? (
          <View style={styles.sectionIconWrap}>
            <Ionicons name={icon} size={15} color={isDark ? c.primary : ALCHEMY.brown} />
          </View>
        ) : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
    );
  }

  function StatRow({ label, value, isLast }) {
    return (
      <View style={[styles.statRow, isLast && styles.statRowLast]}>
        <Text style={styles.statRowLabel} numberOfLines={2}>
          {label}
        </Text>
        <Text style={styles.statRowValue}>{value}</Text>
      </View>
    );
  }

  function MetricCard({ label, value, icon }) {
    return (
      <View style={styles.metricCard}>
        <View style={styles.metricIconWrap}>
          <Ionicons name={icon} size={14} color={isDark ? c.primary : ALCHEMY.brown} />
        </View>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
    );
  }

  function StatusBreakdownRow({ label, count, total, color }) {
    const pct = total > 0 ? (Number(count) / total) * 100 : 0;
    return (
      <View style={styles.statusBlock}>
        <View style={styles.statusBlockTop}>
          <Text style={styles.statusBlockLabel} numberOfLines={1}>
            {label}
          </Text>
          <Text style={styles.statusBlockValue}>{count}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(100, pct)}%`, backgroundColor: color }]} />
        </View>
      </View>
    );
  }

  const statusEntries = analytics ? Object.entries(analytics.statusBreakdown || {}) : [];
  const statusTotal = statusEntries.reduce((sum, [, c]) => sum + Number(c || 0), 0);

  if (user && !user.isAdmin) {
    return (
      <CustomerScreenShell style={styles.screen}>
        <ScrollView style={customerScrollFill} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.panel}>
            <Text style={styles.title}>Admin Access Required</Text>
            <Text style={styles.subtitle}>This account does not have admin privileges.</Text>
            <TouchableOpacity style={styles.refreshBtnPrimary} onPress={() => navigation.navigate("Home")}>
              <Text style={styles.refreshBtnPrimaryText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </CustomerScreenShell>
    );
  }

  const hairline = isDark ? c.border : ALCHEMY.pillInactive;
  const heroColors = isDark
    ? [c.surfaceMuted, "#1a1714"]
    : [ALCHEMY.creamAlt, ALCHEMY.cardBg];

  return (
    <CustomerScreenShell style={styles.screen}>
    <ScrollView style={customerScrollFill} contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top, Platform.OS === "web" ? spacing.md : spacing.sm) }]} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={heroColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.heroGradient, { borderColor: hairline }]}>
        {!isDark ? <View style={styles.heroGoldHairline} /> : null}
        <AdminBackLink navigation={navigation} />
        <View style={styles.heroTitleRow}>
          <View style={[styles.heroIconWrap, !isDark && styles.heroIconWrapLight]}>
            <Ionicons name="analytics" size={26} color={isDark ? c.primary : ALCHEMY.brown} />
          </View>
          <View style={styles.heroTextCol}>
            <Text style={[styles.title, !isDark && styles.titleLight]}>Analytics</Text>
            <Text style={[styles.subtitle, !isDark && styles.subtitleLight]}>
              Full snapshot: revenue, trends, catalog, carts, coupons, and order mix.
            </Text>
          </View>
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity style={[styles.refreshBtnPrimary, !isDark && styles.refreshBtnWarm]} onPress={loadAnalytics} activeOpacity={0.85}>
          <Ionicons name="refresh" size={18} color="#FFFCF8" style={styles.refreshBtnIcon} />
          <Text style={styles.refreshBtnPrimaryText}>Refresh data</Text>
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={styles.loaderHint}>Loading metrics…</Text>
        </View>
      ) : analytics ? (
        <>
          <View style={styles.panel}>
            <SectionHeader title="Totals" icon="grid-outline" />
            <View style={styles.metricGrid}>
              <MetricCard icon="receipt-outline" label="Orders" value={analytics.totals?.orders || 0} />
              <MetricCard icon="cube-outline" label="Products" value={analytics.totals?.products || 0} />
              <MetricCard icon="people-outline" label="Users" value={analytics.totals?.users || 0} />
              <MetricCard icon="shield-checkmark-outline" label="Admins" value={analytics.totals?.admins || 0} />
            </View>
          </View>

          <View style={styles.panel}>
            <SectionHeader title="Recent activity" icon="pulse-outline" />
            <View style={styles.statList}>
              <StatRow label="Orders (last 7 days)" value={String(analytics.activity?.ordersLast7Days ?? 0)} />
              <StatRow label="Orders (last 30 days)" value={String(analytics.activity?.ordersLast30Days ?? 0)} />
              <StatRow label="Revenue (last 7 days)" value={formatINR(analytics.activity?.revenueLast7Days || 0)} />
              <StatRow label="Revenue (last 30 days)" value={formatINR(analytics.activity?.revenueLast30Days || 0)} />
              <StatRow label="New users (last 7 days)" value={String(analytics.activity?.newUsersLast7Days ?? 0)} />
              <StatRow label="New users (last 30 days)" value={String(analytics.activity?.newUsersLast30Days ?? 0)} isLast />
            </View>
          </View>

          <View style={styles.panel}>
            <SectionHeader title="Revenue" icon="cash-outline" />
            <View style={styles.statList}>
              <StatRow label="Total revenue (all orders)" value={formatINR(analytics.revenue?.total || 0)} />
              <StatRow label="Delivered revenue" value={formatINR(analytics.revenue?.delivered || 0)} />
              <StatRow
                label="Excluding cancelled"
                value={formatINR((analytics.revenue?.excludingCancelled ?? analytics.revenue?.total) || 0)}
              />
              <StatRow label="Avg. order value" value={formatINR(analytics.revenue?.averageOrderValue || 0)} isLast />
            </View>
            <Text style={styles.subSectionLabel}>Revenue by order status</Text>
            <View style={styles.statList}>
              {["pending", "paid", "shipped", "delivered", "cancelled"].map((status, idx) => (
                <StatRow
                  key={status}
                  label={status}
                  value={formatINR(analytics.revenue?.byStatus?.[status] || 0)}
                  isLast={idx === 4}
                />
              ))}
            </View>
            <View style={styles.chartWrap}>
              <BarChart
                data={{
                  labels: ["Pend", "Paid", "Ship", "Del", "X"],
                  datasets: [
                    {
                      data: ["pending", "paid", "shipped", "delivered", "cancelled"].map((s) =>
                        Number(analytics.revenue?.byStatus?.[s] || 0)
                      ),
                    },
                  ],
                }}
                width={chartWidth}
                height={220}
                fromZero
                showValuesOnTopOfBars
                withInnerLines={false}
                chartConfig={chartConfig}
                style={styles.chart}
                yAxisLabel=""
                yAxisSuffix=""
              />
            </View>
          </View>

          <View style={styles.panel}>
            <SectionHeader title="Conversion & coupons" icon="ribbon-outline" />
            <View style={styles.statList}>
              <StatRow label="Delivered orders" value={String(analytics.funnel?.deliveredOrders ?? 0)} />
              <StatRow label="Cancelled orders" value={String(analytics.funnel?.cancelledOrders ?? 0)} />
              <StatRow label="Delivery rate" value={`${analytics.funnel?.deliveryRatePercent ?? 0}%`} />
              <StatRow label="Coupon penetration" value={`${analytics.funnel?.couponPenetrationPercent ?? 0}%`} isLast />
            </View>
          </View>

          {(analytics.trends?.last7Days?.labels || []).length > 0 ? (
            <View style={styles.panel}>
              <SectionHeader title="7-day trend" icon="trending-up-outline" />
              <Text style={styles.chartCaption}>Orders per day</Text>
              <View style={styles.chartWrap}>
                <LineChart
                  data={{
                    labels: analytics.trends.last7Days.labels,
                    datasets: [{ data: analytics.trends.last7Days.orderCounts.map((n) => Number(n || 0)) }],
                  }}
                  width={chartWidth}
                  height={200}
                  fromZero
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              </View>
              <Text style={styles.chartCaption}>Revenue per day</Text>
              <View style={styles.chartWrap}>
                <LineChart
                  data={{
                    labels: analytics.trends.last7Days.labels,
                    datasets: [{ data: analytics.trends.last7Days.revenues.map((n) => Number(n || 0)) }],
                  }}
                  width={chartWidth}
                  height={200}
                  fromZero
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              </View>
            </View>
          ) : null}

          {(analytics.trends?.last14Days?.labels || []).length > 0 ? (
            <View style={styles.panel}>
              <SectionHeader title="14-day order volume" icon="calendar-outline" />
              <View style={styles.chartWrap}>
                <BarChart
                  data={{
                    labels: analytics.trends.last14Days.labels.map((lb) => String(lb).slice(0, 5)),
                    datasets: [{ data: analytics.trends.last14Days.orderCounts.map((n) => Number(n || 0)) }],
                  }}
                  width={chartWidth}
                  height={240}
                  fromZero
                  chartConfig={chartConfig}
                  style={styles.chart}
                  withInnerLines={false}
                  showValuesOnTopOfBars={false}
                />
              </View>
            </View>
          ) : null}

          <View style={styles.panel}>
            <SectionHeader title="Coupon insights" icon="pricetag-outline" />
            <View style={styles.statList}>
              <StatRow label="Orders with coupon" value={String(analytics.coupons?.couponOrders || 0)} />
              <StatRow label="Total discount given" value={formatINR(analytics.coupons?.totalDiscount || 0)} />
              <StatRow
                label="Avg. discount per coupon order"
                value={formatINR(analytics.coupons?.averageDiscountPerCouponOrder || 0)}
                isLast
              />
            </View>
            {(analytics.coupons?.topCoupons || []).length > 0 ? (
              <>
                <View style={styles.chartWrap}>
                  <BarChart
                    data={{
                      labels: (analytics.coupons?.topCoupons || []).slice(0, 6).map((item) =>
                        String(item.code || "").slice(0, 6)
                      ),
                      datasets: [
                        {
                          data: (analytics.coupons?.topCoupons || []).slice(0, 6).map((item) => Number(item.orders || 0)),
                        },
                      ],
                    }}
                    width={chartWidth}
                    height={220}
                    fromZero
                    showValuesOnTopOfBars
                    withInnerLines={false}
                    chartConfig={chartConfig}
                    style={styles.chart}
                    yAxisLabel=""
                  />
                </View>
                {(analytics.coupons?.topCoupons || []).map((item, index) => (
                  <View key={`${item.code}-${index}`} style={styles.listCard}>
                    <View style={styles.listCardRank}>
                      <Text style={styles.listCardRankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.listCardBody}>
                      <Text style={styles.listCardTitle}>{item.code}</Text>
                      <Text style={styles.listCardMeta}>
                        {item.orders} orders · {formatINR(item.discount)} discount
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            ) : (
              <View style={styles.emptyHint}>
                <Ionicons name="information-circle-outline" size={20} color={c.textMuted} />
                <Text style={styles.emptyHintText}>No coupon usage data yet.</Text>
              </View>
            )}
          </View>

          <View style={styles.panel}>
            <SectionHeader title="Catalog & stock" icon="layers-outline" />
            <View style={styles.statList}>
              <StatRow label="SKUs in stock" value={String(analytics.inventory?.inStockProducts ?? 0)} />
              <StatRow label="Low stock (≤5 units)" value={String(analytics.inventory?.lowStockProducts || 0)} />
              <StatRow label="Out of stock" value={String(analytics.inventory?.outOfStockProducts || 0)} />
              <StatRow
                label="Inventory value (qty × price)"
                value={formatINR(analytics.inventory?.inventoryRetailValue || 0)}
                isLast
              />
            </View>
            {(analytics.inventory?.topCategories || []).length > 0 ? (
              <>
                <Text style={styles.subSectionLabel}>Products by category</Text>
                <View style={styles.categoryTable}>
                  {(analytics.inventory.topCategories || []).map((cat, idx) => (
                    <View
                      key={cat.name}
                      style={[
                        styles.categoryRow,
                        idx === (analytics.inventory.topCategories || []).length - 1 && styles.categoryRowLast,
                      ]}
                    >
                      <Text style={styles.categoryRowName} numberOfLines={1}>
                        {cat.name}
                      </Text>
                      <Text style={styles.categoryRowCount}>{cat.count}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </View>

          <View style={styles.panel}>
            <SectionHeader title="Carts" icon="cart-outline" />
            <View style={styles.statList}>
              <StatRow label="Users with items in cart" value={String(analytics.carts?.usersWithActiveCart || 0)} />
              <StatRow label="Total cart line items" value={String(analytics.carts?.totalCartItems || 0)} />
              <StatRow label="Estimated cart value" value={formatINR(analytics.carts?.estimatedCartValue || 0)} isLast />
            </View>
          </View>

          <View style={styles.panel}>
            <SectionHeader title="Order status" icon="pie-chart-outline" />
            {statusEntries.length === 0 ? (
              <View style={styles.emptyHint}>
                <Ionicons name="information-circle-outline" size={20} color={c.textMuted} />
                <Text style={styles.emptyHintText}>No order data.</Text>
              </View>
            ) : (
              <>
                {statusEntries.map(([status, count], index) => (
                  <StatusBreakdownRow
                    key={status}
                    label={status}
                    count={count}
                    total={statusTotal}
                    color={statusColors[index % statusColors.length]}
                  />
                ))}
                <View style={styles.chartWrap}>
                  <PieChart
                    data={statusEntries.map(([status, count], index) => ({
                      name: status,
                      population: Number(count || 0),
                      color: statusColors[index % statusColors.length],
                      legendFontColor: c.textPrimary,
                      legendFontSize: 11,
                    }))}
                    width={chartWidth}
                    height={230}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="4"
                    absolute
                  />
                </View>
              </>
            )}
          </View>

          <View style={styles.panel}>
            <SectionHeader title="Top products" icon="trophy-outline" />
            {(analytics.topProducts || []).length === 0 ? (
              <View style={styles.emptyHint}>
                <Ionicons name="information-circle-outline" size={20} color={c.textMuted} />
                <Text style={styles.emptyHintText}>No sales data yet.</Text>
              </View>
            ) : (
              <>
                <View style={styles.chartWrap}>
                  <BarChart
                    data={{
                      labels: (analytics.topProducts || []).slice(0, 6).map((item) =>
                        String(item.name || "Item").slice(0, 6)
                      ),
                      datasets: [
                        {
                          data: (analytics.topProducts || []).slice(0, 6).map((item) => Number(item.qty || 0)),
                        },
                      ],
                    }}
                    width={chartWidth}
                    height={230}
                    fromZero
                    showValuesOnTopOfBars
                    withInnerLines={false}
                    chartConfig={chartConfig}
                    style={styles.chart}
                    yAxisLabel=""
                  />
                </View>
                {(analytics.topProducts || []).map((item, index) => (
                  <View key={`${item.key}-${index}`} style={styles.listCard}>
                    <View style={styles.listCardRank}>
                      <Text style={styles.listCardRankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.listCardBody}>
                      <Text style={styles.listCardTitle} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.listCardMeta}>
                        {item.qty} qty · {formatINR(item.revenue)} revenue
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        </>
      ) : null}
      <AppFooter />
    </ScrollView>
    </CustomerScreenShell>
  );
}

function createAdminAnalyticsStyles(c, themeShadowLift, themeShadowPremium, isDark) {
  const cardBg = isDark ? c.surface : ALCHEMY.cardBg;
  const hairline = isDark ? c.border : ALCHEMY.pillInactive;
  return StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    width: "100%",
    alignSelf: "center",
    maxWidth: Platform.select({ web: layout.maxContentWidth, default: "100%" }),
  },
  heroGradient: {
    position: "relative",
    borderRadius: radius.xxl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    ...themeShadowPremium,
  },
  heroGoldHairline: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: ALCHEMY.gold,
    opacity: 0.95,
    zIndex: 2,
  },
  panel: {
    ...adminPanel(c, themeShadowPremium),
    marginBottom: spacing.md,
    backgroundColor: cardBg,
    borderColor: hairline,
    borderTopColor: isDark ? c.primaryBorder : ALCHEMY.gold,
  },
  heroTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  heroIconWrapLight: {
    borderColor: ALCHEMY.pillInactive,
    backgroundColor: ALCHEMY.creamAlt,
  },
  heroTextCol: {
    flex: 1,
    minWidth: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: isDark ? c.primaryBorder : ALCHEMY.pillInactive,
    backgroundColor: isDark ? c.primarySoft : ALCHEMY.creamAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: typography.h2,
    fontFamily: FONT_DISPLAY,
    color: c.textPrimary,
    letterSpacing: -0.35,
  },
  titleLight: {
    color: ALCHEMY.brown,
  },
  subtitle: {
    marginTop: spacing.xs,
    color: c.textSecondary,
    fontSize: typography.body,
    lineHeight: 20,
  },
  subtitleLight: {
    color: "#5C534A",
  },
  subSectionLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontSize: typography.caption,
    fontFamily: FONT_DISPLAY_SEMI,
    color: c.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  chartCaption: {
    fontSize: typography.caption,
    fontFamily: fonts.semibold,
    color: c.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  categoryTable: {
    borderWidth: 1,
    borderColor: hairline,
    borderRadius: radius.md,
    overflow: "hidden",
    marginBottom: spacing.xs,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
    backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt,
  },
  categoryRowLast: {
    borderBottomWidth: 0,
  },
  categoryRowName: {
    flex: 1,
    color: c.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: typography.bodySmall,
    marginRight: spacing.md,
  },
  categoryRowCount: {
    color: isDark ? c.primary : ALCHEMY.brown,
    fontFamily: fonts.extrabold,
    fontSize: typography.bodySmall,
  },
  sectionTitle: {
    color: c.textPrimary,
    fontSize: typography.h3,
    fontFamily: FONT_DISPLAY,
    letterSpacing: -0.25,
    flex: 1,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metricCard: {
    minWidth: 110,
    flex: 1,
    borderWidth: 1,
    borderColor: hairline,
    borderRadius: radius.md,
    backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: "center",
  },
  metricIconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    backgroundColor: c.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  metricValue: {
    color: isDark ? c.primary : ALCHEMY.brown,
    fontSize: typography.h3,
    fontFamily: fonts.extrabold,
  },
  metricLabel: {
    marginTop: 2,
    color: c.textSecondary,
    fontSize: typography.caption,
    fontWeight: "600",
    textAlign: "center",
  },
  statList: {
    borderWidth: 1,
    borderColor: hairline,
    borderRadius: radius.md,
    backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: hairline,
  },
  statRowLast: {
    borderBottomWidth: 0,
  },
  statRowLabel: {
    flex: 1,
    color: c.textSecondary,
    fontSize: typography.bodySmall,
    fontWeight: "600",
  },
  statRowValue: {
    color: c.textPrimary,
    fontSize: typography.bodySmall,
    fontWeight: "800",
    textAlign: "right",
  },
  listCard: {
    flexDirection: "row",
    alignItems: "stretch",
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    backgroundColor: c.surfaceMuted,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  listCardRank: {
    width: 36,
    backgroundColor: c.primarySoft,
    borderRightWidth: 1,
    borderRightColor: c.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  listCardRankText: {
    fontSize: typography.body,
    fontWeight: "800",
    color: c.primaryDark,
  },
  listCardBody: {
    flex: 1,
    padding: spacing.sm,
    paddingVertical: spacing.md,
  },
  listCardTitle: {
    color: c.textPrimary,
    fontWeight: "700",
    fontSize: typography.bodySmall,
  },
  listCardMeta: {
    marginTop: 4,
    color: c.textSecondary,
    fontSize: typography.caption,
  },
  chartWrap: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    backgroundColor: c.surface,
    overflow: "hidden",
    ...themeShadowLift,
  },
  chart: {
    borderRadius: radius.md,
  },
  refreshBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    backgroundColor: c.primary,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  refreshBtnWarm: {
    backgroundColor: ALCHEMY.brown,
  },
  refreshBtnIcon: {
    marginTop: 1,
  },
  refreshBtnPrimaryText: {
    color: c.onPrimary,
    fontSize: typography.body,
    fontWeight: "700",
  },
  loaderWrap: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
    gap: spacing.sm,
  },
  loaderHint: {
    color: c.textMuted,
    fontSize: typography.caption,
    fontWeight: "600",
  },
  errorText: {
    color: c.danger,
    marginBottom: spacing.sm,
    fontWeight: "600",
    fontSize: typography.bodySmall,
  },
  emptyHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  emptyHintText: {
    color: c.textMuted,
    fontSize: typography.bodySmall,
    fontWeight: "600",
    flex: 1,
  },
  statusBlock: {
    marginBottom: spacing.md,
  },
  statusBlockTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    gap: spacing.sm,
  },
  statusBlockLabel: {
    flex: 1,
    color: c.textPrimary,
    fontSize: typography.bodySmall,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  statusBlockValue: {
    color: c.textSecondary,
    fontSize: typography.bodySmall,
    fontWeight: "800",
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: c.border,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.pill,
  },
  });
}
