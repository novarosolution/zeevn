import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BarChart, LineChart, PieChart } from "react-native-chart-kit";
import AppFooter from "../../components/AppFooter";
import CustomerScreenShell from "../../components/CustomerScreenShell";
import AdminBackLink from "../../components/admin/AdminBackLink";
import AdminPageHeading from "../../components/admin/AdminPageHeading";
import { useAuth } from "../../context/AuthContext";
import { fetchAdminAnalytics } from "../../services/adminService";
import { useTheme } from "../../context/ThemeContext";
import { ALCHEMY, FONT_DISPLAY, FONT_DISPLAY_SEMI } from "../../theme/customerAlchemy";
import { adminPanel } from "../../theme/adminLayout";
import MotionScrollView from "../../components/motion/MotionScrollView";
import { adminInnerPageScrollContent, customerScrollFill } from "../../theme/screenLayout";
import { fonts, radius, semanticRadius, spacing, typography } from "../../theme/tokens";
import { formatINR } from "../../utils/currency";
import { exportAnalyticsReport } from "../../utils/adminAnalyticsPdf";
import { exportAnalyticsCsv } from "../../utils/adminAnalyticsCsv";
import { ALL_ORDER_STATUSES, getOrderStatusLabel } from "../../utils/orderStatus";
import PremiumLoader from "../../components/ui/PremiumLoader";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumCard from "../../components/ui/PremiumCard";
import PremiumSectionHeader from "../../components/ui/PremiumSectionHeader";
import PremiumStatCard from "../../components/ui/PremiumStatCard";
import PremiumChip from "../../components/ui/PremiumChip";
import PremiumInput from "../../components/ui/PremiumInput";
import SectionReveal from "../../components/motion/SectionReveal";

function hexToRgb(hex) {
  const h = String(hex || "").replace("#", "");
  if (h.length !== 6) return { r: 184, g: 134, b: 11 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function chartInt(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? Math.round(num) : 0;
}

function safePercent(part, whole) {
  const p = Number(part || 0);
  const w = Number(whole || 0);
  if (!Number.isFinite(p) || !Number.isFinite(w) || w <= 0) return 0;
  return Math.round((p / w) * 100);
}

function compactStatusLabel(status) {
  const full = getOrderStatusLabel(status);
  if (full.length <= 7) return full;
  return `${full.slice(0, 6)}…`;
}

function sparseAxisLabels(labels, maxVisible = 6, compactLen = 3) {
  const source = Array.isArray(labels) ? labels : [];
  if (source.length === 0) return [];
  const step = Math.max(1, Math.ceil(source.length / maxVisible));
  return source.map((label, index) => {
    if (index % step !== 0) return "";
    const text = String(label || "").trim();
    return text.length > compactLen ? text.slice(0, compactLen) : text;
  });
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
  const [rangePreset, setRangePreset] = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [bucket, setBucket] = useState("auto");
  const isCompact = width < 420;
  const chartWidth = Math.min(720, Math.max(300, width - spacing.lg * (isCompact ? 3 : 4)));

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

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const q = {};
      if (rangePreset === "legacy") {
        /* no params → backend legacy snapshot */
      } else if (rangePreset === "custom") {
        q.from = customFrom.trim();
        q.to = customTo.trim();
      } else {
        q.preset = rangePreset;
      }
      if (bucket !== "auto") q.bucket = bucket;
      const data = await fetchAdminAnalytics(token, q);
      setAnalytics(data);
    } catch (err) {
      setError(err.message || "Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  }, [token, rangePreset, customFrom, customTo, bucket]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    if (rangePreset === "custom") return;
    loadAnalytics();
  }, [user?.isAdmin, rangePreset, bucket, loadAnalytics]);

  const applyCustomRange = useCallback(() => {
    if (!customFrom.trim() || !customTo.trim()) {
      setError("Enter both dates (YYYY-MM-DD).");
      return;
    }
    setError("");
    loadAnalytics();
  }, [customFrom, customTo, loadAnalytics]);

  const handleExportPdf = useCallback(async () => {
    if (!analytics) return;
    try {
      await exportAnalyticsReport(analytics);
    } catch (err) {
      setError(err.message || "Could not export report.");
    }
  }, [analytics]);

  const handleExportCsv = useCallback(async () => {
    if (!analytics) return;
    try {
      await exportAnalyticsCsv(analytics);
    } catch (err) {
      setError(err.message || "Could not export CSV.");
    }
  }, [analytics]);

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

  function MetricCard({ label, value, icon, tone = "gold" }) {
    return (
      <PremiumStatCard
        compact
        iconName={icon}
        label={label}
        value={String(value)}
        tone={tone}
        style={styles.metricStatTile}
      />
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

  function ChartFrame({ children }) {
    return (
      <View style={styles.chartWrap}>
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chartScrollContent}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  const statusEntries = analytics ? Object.entries(analytics.statusBreakdown || {}) : [];
  const statusTotal = statusEntries.reduce((sum, [, c]) => sum + Number(c || 0), 0);
  const advancedInsights = useMemo(() => {
    if (!analytics) {
      return {
        revenuePerUser: 0,
        revenuePerOrder: 0,
        cartToOrderPercent: 0,
        topProductRevenueSharePercent: 0,
        lowOrOutStockPercent: 0,
        newUserSharePercent: 0,
      };
    }
    const filtered = Boolean(analytics.range?.filtered);
    const totalRevenue = Number(analytics.revenue?.total || 0);
    const totalUsers = Number(analytics.totals?.users || 0);
    const totalOrders = Number(analytics.totals?.orders || 0);
    const activeCartUsers = Number(analytics.carts?.usersWithActiveCart || 0);
    const topProducts = Array.isArray(analytics.topProducts) ? analytics.topProducts : [];
    const topProductsRevenue = topProducts.reduce((sum, item) => sum + Number(item?.revenue || 0), 0);
    const lowStock = Number(analytics.inventory?.lowStockProducts || 0);
    const outOfStock = Number(analytics.inventory?.outOfStockProducts || 0);
    const inStock = Number(analytics.inventory?.inStockProducts || 0);
    const totalKnownStock = inStock + lowStock + outOfStock;
    const newUsersForShare = filtered
      ? Number(analytics.activity?.newUsersInPeriod ?? 0)
      : Number(analytics.activity?.newUsersLast30Days || 0);
    return {
      revenuePerUser: totalUsers > 0 ? totalRevenue / totalUsers : 0,
      revenuePerOrder: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      cartToOrderPercent: safePercent(activeCartUsers, totalOrders),
      topProductRevenueSharePercent: safePercent(topProductsRevenue, totalRevenue),
      lowOrOutStockPercent: safePercent(lowStock + outOfStock, totalKnownStock),
      newUserSharePercent: safePercent(newUsersForShare, totalUsers),
    };
  }, [analytics]);

  if (user && !user.isAdmin) {
    return (
      <CustomerScreenShell style={styles.screen} variant="admin">
        <MotionScrollView
          style={customerScrollFill}
          contentContainerStyle={adminInnerPageScrollContent(insets)}
          showsVerticalScrollIndicator={false}
        >
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.deniedGate}>
              <PremiumErrorBanner
                severity="warning"
                title="Admin access required"
                message="This account does not have admin privileges."
              />
              <PremiumButton
                label="Back to home"
                iconLeft="home-outline"
                variant="primary"
                onPress={() => navigation.navigate("Home")}
                style={styles.gateCta}
              />
            </View>
          </SectionReveal>
        </MotionScrollView>
      </CustomerScreenShell>
    );
  }

  const hairline = isDark ? c.border : ALCHEMY.pillInactive;
  const heroColors = isDark
    ? [c.surfaceMuted, "#1a1714"]
    : [ALCHEMY.creamAlt, ALCHEMY.cardBg];
  const isFiltered = Boolean(analytics?.range?.filtered);

  return (
    <CustomerScreenShell style={styles.screen} variant="admin">
      <MotionScrollView
        style={customerScrollFill}
        contentContainerStyle={adminInnerPageScrollContent(insets)}
        showsVerticalScrollIndicator={false}
      >
      <LinearGradient colors={heroColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.heroGradient, { borderColor: hairline }]}>
        {!isDark ? <View style={styles.heroGoldHairline} /> : null}
        <AdminBackLink navigation={navigation} />
        <AdminPageHeading
          title="Analytics"
          subtitle="Revenue, trends, catalog health, carts, and coupons. Filter by period or export PDF / CSV."
          right={
            <View style={styles.heroActionsRow}>
              <PremiumButton
                label="Refresh"
                iconLeft="refresh-outline"
                variant="primary"
                size="sm"
                onPress={loadAnalytics}
                style={styles.heroActionBtn}
              />
              <PremiumButton
                label="Export PDF"
                iconLeft="document-text-outline"
                variant="secondary"
                size="sm"
                onPress={handleExportPdf}
                disabled={!analytics}
                style={styles.heroActionBtn}
              />
              <PremiumButton
                label="Export CSV"
                iconLeft="download-outline"
                variant="secondary"
                size="sm"
                onPress={handleExportCsv}
                disabled={!analytics}
                style={styles.heroActionBtn}
              />
            </View>
          }
        />
        {error ? (
          <View style={styles.bannerSpacer}>
            <PremiumErrorBanner severity="error" message={error} compact />
          </View>
        ) : null}
      </LinearGradient>

      <PremiumCard variant="muted" padding="md" style={styles.filterCard}>
        <Text style={[styles.filterTitle, { color: c.textSecondary }]}>Date range</Text>
        {Platform.OS === "web" ? (
          <View style={styles.filterChipScroll}>
            {[
              { key: "today", label: "Today" },
              { key: "7d", label: "7d" },
              { key: "30d", label: "30d" },
              { key: "90d", label: "90d" },
              { key: "1y", label: "1y" },
              { key: "mtd", label: "MTD" },
              { key: "ytd", label: "YTD" },
              { key: "all", label: "All" },
              { key: "legacy", label: "Full history" },
              { key: "custom", label: "Custom" },
            ].map((item) => (
              <PremiumChip
                key={item.key}
                label={item.label}
                tone="gold"
                size="sm"
                selected={rangePreset === item.key}
                onPress={() => setRangePreset(item.key)}
                style={styles.filterChip}
              />
            ))}
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipScroll}>
            {[
              { key: "today", label: "Today" },
              { key: "7d", label: "7d" },
              { key: "30d", label: "30d" },
              { key: "90d", label: "90d" },
              { key: "1y", label: "1y" },
              { key: "mtd", label: "MTD" },
              { key: "ytd", label: "YTD" },
              { key: "all", label: "All" },
              { key: "legacy", label: "Full history" },
              { key: "custom", label: "Custom" },
            ].map((item) => (
              <PremiumChip
                key={item.key}
                label={item.label}
                tone="gold"
                size="sm"
                selected={rangePreset === item.key}
                onPress={() => setRangePreset(item.key)}
                style={styles.filterChip}
              />
            ))}
          </ScrollView>
        )}
        <Text style={[styles.filterTitle, { color: c.textSecondary, marginTop: spacing.sm }]}>Chart buckets</Text>
        <View style={styles.bucketRow}>
          {[
            { key: "auto", label: "Auto" },
            { key: "day", label: "Daily" },
            { key: "month", label: "Monthly" },
          ].map((item) => (
            <PremiumChip
              key={item.key}
              label={item.label}
              tone="neutral"
              size="sm"
              selected={bucket === item.key}
              onPress={() => setBucket(item.key)}
              style={styles.filterChip}
            />
          ))}
        </View>
        {rangePreset === "custom" ? (
          <View style={styles.customRangeBlock}>
            <View style={styles.customInputs}>
              <View style={styles.customInputGrow}>
                <PremiumInput
                  label="From (YYYY-MM-DD)"
                  value={customFrom}
                  onChangeText={setCustomFrom}
                  iconLeft="calendar-outline"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.customInputGrow}>
                <PremiumInput
                  label="To (YYYY-MM-DD)"
                  value={customTo}
                  onChangeText={setCustomTo}
                  iconLeft="calendar-outline"
                  autoCapitalize="none"
                />
              </View>
            </View>
            <PremiumButton label="Apply range" variant="primary" size="sm" onPress={applyCustomRange} fullWidth />
          </View>
        ) : null}
        {analytics?.range?.filtered ? (
          <Text style={[styles.rangeFootnote, { color: c.textMuted }]}>
            {analytics.range.preset} · {analytics.range.bucket} buckets
            {analytics.range.from && analytics.range.to
              ? ` · ${String(analytics.range.from).slice(0, 10)} → ${String(analytics.range.to).slice(0, 10)}`
              : ""}
          </Text>
        ) : analytics && !analytics.range ? (
          <Text style={[styles.rangeFootnote, { color: c.textMuted }]}>Legacy snapshot · rolling 7/14-day charts</Text>
        ) : null}
      </PremiumCard>

      {loading ? (
        <View style={styles.loaderWrap}>
          <PremiumLoader size="md" caption="Loading metrics…" hint="Charts and revenue data will appear here." />
        </View>
      ) : analytics ? (
        <>
          <PremiumCard variant="muted" padding="lg" style={styles.sectionCard}>
            <PremiumSectionHeader title="Overview" compact />
            <View style={styles.summaryGrid}>
              <PremiumStatCard
                compact
                iconName="cash-outline"
                label="Total revenue"
                value={formatINR(analytics.revenue?.total || 0)}
                tone="gold"
                style={styles.summaryStatTile}
              />
              <PremiumStatCard
                compact
                iconName="trending-up-outline"
                label={isFiltered ? "Delivered (period)" : "30-day revenue"}
                value={formatINR(
                  isFiltered ? analytics.revenue?.delivered || 0 : analytics.activity?.revenueLast30Days || 0
                )}
                tone="green"
                style={styles.summaryStatTile}
              />
              <PremiumStatCard
                compact
                iconName="checkmark-done-outline"
                label="Delivery rate"
                value={`${analytics.funnel?.deliveryRatePercent ?? 0}%`}
                tone="gold"
                style={styles.summaryStatTile}
              />
              <PremiumStatCard
                compact
                iconName="cart-outline"
                label="Active carts"
                value={String(analytics.carts?.usersWithActiveCart || 0)}
                tone="green"
                style={styles.summaryStatTile}
              />
            </View>
          </PremiumCard>

          <PremiumCard variant="muted" padding="lg" style={styles.sectionCard}>
            <PremiumSectionHeader title="Advanced insights" compact />
            <View style={styles.metricGrid}>
              <MetricCard
                icon="person-circle-outline"
                label="Revenue / user"
                value={formatINR(advancedInsights.revenuePerUser)}
              />
              <MetricCard
                icon="receipt-outline"
                label="Revenue / order"
                value={formatINR(advancedInsights.revenuePerOrder)}
              />
              <MetricCard
                icon="cart-outline"
                label="Cart vs orders"
                value={`${advancedInsights.cartToOrderPercent}%`}
              />
              <MetricCard
                icon="star-outline"
                label="Top SKU share"
                value={`${advancedInsights.topProductRevenueSharePercent}%`}
              />
            </View>
            <View style={styles.statList}>
              <StatRow
                label="Low + out of stock pressure"
                value={`${advancedInsights.lowOrOutStockPercent}%`}
              />
              <StatRow
                label={isFiltered ? "New users (period share)" : "New users contribution (30 days)"}
                value={`${advancedInsights.newUserSharePercent}%`}
                isLast
              />
            </View>
          </PremiumCard>

          <PremiumCard variant="muted" padding="lg" style={styles.sectionCard}>
            <PremiumSectionHeader title="Totals" compact />
            <View style={styles.metricGrid}>
              <MetricCard icon="receipt-outline" label="Orders" value={analytics.totals?.orders || 0} />
              <MetricCard icon="cube-outline" label="Products" value={analytics.totals?.products || 0} />
              <MetricCard
                icon="people-outline"
                label={isFiltered ? "Users (period)" : "Users"}
                value={analytics.totals?.users || 0}
              />
              <MetricCard icon="shield-checkmark-outline" label="Admins" value={analytics.totals?.admins || 0} />
            </View>
          </PremiumCard>

          <PremiumCard variant="muted" padding="lg" style={styles.sectionCard}>
            <PremiumSectionHeader title={isFiltered ? "Period activity" : "Recent activity"} compact />
            <View style={styles.statList}>
              {isFiltered ? (
                <>
                  <StatRow label="Orders in period" value={String(analytics.activity?.ordersInPeriod ?? 0)} />
                  <StatRow label="Revenue in period" value={formatINR(analytics.activity?.revenueInPeriod || 0)} />
                  <StatRow
                    label="New users registered (period)"
                    value={String(analytics.activity?.newUsersInPeriod ?? 0)}
                    isLast
                  />
                </>
              ) : (
                <>
                  <StatRow label="Orders (last 7 days)" value={String(analytics.activity?.ordersLast7Days ?? 0)} />
                  <StatRow label="Orders (last 30 days)" value={String(analytics.activity?.ordersLast30Days ?? 0)} />
                  <StatRow label="Revenue (last 7 days)" value={formatINR(analytics.activity?.revenueLast7Days || 0)} />
                  <StatRow label="Revenue (last 30 days)" value={formatINR(analytics.activity?.revenueLast30Days || 0)} />
                  <StatRow label="New users (last 7 days)" value={String(analytics.activity?.newUsersLast7Days ?? 0)} />
                  <StatRow label="New users (last 30 days)" value={String(analytics.activity?.newUsersLast30Days ?? 0)} isLast />
                </>
              )}
            </View>
          </PremiumCard>

          <PremiumCard variant="muted" padding="lg" style={styles.sectionCard}>
            <PremiumSectionHeader title="Revenue" compact />
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
              {ALL_ORDER_STATUSES.map((status, idx) => (
                <StatRow
                  key={status}
                  label={getOrderStatusLabel(status)}
                  value={formatINR(analytics.revenue?.byStatus?.[status] || 0)}
                  isLast={idx === ALL_ORDER_STATUSES.length - 1}
                />
              ))}
            </View>
            <ChartFrame>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <BarChart
                  data={{
                    labels: ALL_ORDER_STATUSES.map((s) => compactStatusLabel(s)),
                    datasets: [
                      {
                        data: ALL_ORDER_STATUSES.map((s) => chartInt(analytics.revenue?.byStatus?.[s])),
                      },
                    ],
                  }}
                  width={Math.max(chartWidth, ALL_ORDER_STATUSES.length * 82)}
                  height={220}
                  fromZero
                  showValuesOnTopOfBars
                  withInnerLines={false}
                  chartConfig={chartConfig}
                  style={styles.chart}
                  yAxisLabel=""
                  yAxisSuffix=""
                />
              </ScrollView>
            </ChartFrame>
          </PremiumCard>

          <PremiumCard variant="muted" padding="lg" style={styles.sectionCard}>
            <PremiumSectionHeader title="Conversion & coupons" compact />
            <View style={styles.statList}>
              <StatRow label="Delivered orders" value={String(analytics.funnel?.deliveredOrders ?? 0)} />
              <StatRow label="Cancelled orders" value={String(analytics.funnel?.cancelledOrders ?? 0)} />
              <StatRow label="Delivery rate" value={`${analytics.funnel?.deliveryRatePercent ?? 0}%`} />
              <StatRow label="Coupon penetration" value={`${analytics.funnel?.couponPenetrationPercent ?? 0}%`} isLast />
            </View>
          </PremiumCard>

          {(analytics.trends?.rangeSeries?.labels || []).length >= 2 ? (
            <PremiumCard variant="muted" padding="lg" style={styles.sectionCard}>
              <PremiumSectionHeader
                title={`Orders trend (${analytics.range?.bucket || "day"})`}
                compact
              />
              <Text style={styles.chartCaption}>Orders per bucket</Text>
              <ChartFrame>
                <LineChart
                  data={{
                    labels: sparseAxisLabels(analytics.trends.rangeSeries.labels, 8, 3),
                    datasets: [{ data: analytics.trends.rangeSeries.orderCounts.map((n) => chartInt(n)) }],
                  }}
                  width={chartWidth}
                  height={200}
                  fromZero
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              </ChartFrame>
              <Text style={styles.chartCaption}>Revenue per bucket</Text>
              <ChartFrame>
                <LineChart
                  data={{
                    labels: sparseAxisLabels(analytics.trends.rangeSeries.labels, 8, 3),
                    datasets: [{ data: analytics.trends.rangeSeries.revenues.map((n) => chartInt(n)) }],
                  }}
                  width={chartWidth}
                  height={200}
                  fromZero
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              </ChartFrame>
            </PremiumCard>
          ) : null}

          {!isFiltered && (analytics.trends?.last7Days?.labels || []).length > 0 ? (
            <PremiumCard variant="muted" padding="lg" style={styles.sectionCard}>
              <PremiumSectionHeader title="7-day trend" compact />
              <Text style={styles.chartCaption}>Orders per day</Text>
              <ChartFrame>
                <LineChart
                  data={{
                    labels: sparseAxisLabels(analytics.trends.last7Days.labels, 7, 3),
                    datasets: [{ data: analytics.trends.last7Days.orderCounts.map((n) => chartInt(n)) }],
                  }}
                  width={chartWidth}
                  height={200}
                  fromZero
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              </ChartFrame>
              <Text style={styles.chartCaption}>Revenue per day</Text>
              <ChartFrame>
                <LineChart
                  data={{
                    labels: sparseAxisLabels(analytics.trends.last7Days.labels, 7, 3),
                    datasets: [{ data: analytics.trends.last7Days.revenues.map((n) => chartInt(n)) }],
                  }}
                  width={chartWidth}
                  height={200}
                  fromZero
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              </ChartFrame>
            </PremiumCard>
          ) : null}

          {!isFiltered && (analytics.trends?.last14Days?.labels || []).length > 0 ? (
            <PremiumCard variant="muted" padding="lg" style={styles.sectionCard}>
              <PremiumSectionHeader title="14-day order volume" compact />
              <ChartFrame>
                <BarChart
                  data={{
                    labels: sparseAxisLabels(analytics.trends.last14Days.labels, 7, 3),
                    datasets: [{ data: analytics.trends.last14Days.orderCounts.map((n) => chartInt(n)) }],
                  }}
                  width={chartWidth}
                  height={240}
                  fromZero
                  chartConfig={chartConfig}
                  style={styles.chart}
                  withInnerLines={false}
                  showValuesOnTopOfBars={false}
                />
              </ChartFrame>
            </PremiumCard>
          ) : null}

          <PremiumCard variant="muted" padding="lg" style={styles.sectionCard}>
            <PremiumSectionHeader title="Coupon insights" compact />
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
                <ChartFrame>
                  <BarChart
                    data={{
                      labels: (analytics.coupons?.topCoupons || []).slice(0, 6).map((item) =>
                        String(item.code || "").slice(0, 6)
                      ),
                      datasets: [
                        {
                          data: (analytics.coupons?.topCoupons || []).slice(0, 6).map((item) => chartInt(item.orders)),
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
                </ChartFrame>
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
          </PremiumCard>

          <PremiumCard variant="muted" padding="lg" style={styles.sectionCard}>
            <PremiumSectionHeader title="Catalog & stock" compact />
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
          </PremiumCard>

          <PremiumCard variant="muted" padding="lg" style={styles.sectionCard}>
            <PremiumSectionHeader title="Carts" compact />
            <View style={styles.statList}>
              <StatRow label="Users with items in cart" value={String(analytics.carts?.usersWithActiveCart || 0)} />
              <StatRow label="Total cart line items" value={String(analytics.carts?.totalCartItems || 0)} />
              <StatRow label="Estimated cart value" value={formatINR(analytics.carts?.estimatedCartValue || 0)} isLast />
            </View>
          </PremiumCard>

          <PremiumCard variant="muted" padding="lg" style={styles.sectionCard}>
            <PremiumSectionHeader title="Order status" compact />
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
                <ChartFrame>
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
                </ChartFrame>
              </>
            )}
          </PremiumCard>

          <PremiumCard variant="muted" padding="lg" style={styles.sectionCard}>
            <PremiumSectionHeader title="Top products" compact />
            {(analytics.topProducts || []).length === 0 ? (
              <View style={styles.emptyHint}>
                <Ionicons name="information-circle-outline" size={20} color={c.textMuted} />
                <Text style={styles.emptyHintText}>No sales data yet.</Text>
              </View>
            ) : (
              <>
                <ChartFrame>
                  <BarChart
                    data={{
                      labels: (analytics.topProducts || []).slice(0, 6).map((item) =>
                        String(item.name || "Item").slice(0, 6)
                      ),
                      datasets: [
                        {
                          data: (analytics.topProducts || []).slice(0, 6).map((item) => chartInt(item.qty)),
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
                </ChartFrame>
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
          </PremiumCard>
        </>
      ) : null}
      <AppFooter />
      </MotionScrollView>
    </CustomerScreenShell>
  );
}

function createAdminAnalyticsStyles(c, themeShadowLift, themeShadowPremium, isDark) {
  const cardBg = isDark ? c.surface : ALCHEMY.cardBg;
  const hairline = isDark ? c.border : ALCHEMY.pillInactive;
  return StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    maxWidth: Platform.select({ web: 1336, default: "100%" }),
  },
  heroGradient: {
    position: "relative",
    borderRadius: radius.xxl,
    padding: Platform.select({ web: spacing.lg + 4, default: spacing.lg }),
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
    backgroundColor: c.primary,
    opacity: 0.95,
    zIndex: 2,
  },
  deniedGate: {
    ...adminPanel(c, themeShadowPremium, isDark),
    marginBottom: spacing.md,
    backgroundColor: cardBg,
    borderColor: hairline,
    borderTopColor: isDark ? c.primaryBorder : c.primary,
    ...Platform.select({
      web: {
        padding: spacing.lg + 6,
      },
      default: {},
    }),
  },
  sectionCard: {
    marginBottom: spacing.md,
    width: "100%",
  },
  summaryStatTile: {
    flexGrow: 1,
    flexBasis: Platform.select({ web: 240, default: "47%" }),
    minWidth: 150,
  },
  metricStatTile: {
    minWidth: 110,
    flex: 1,
  },
  gateCta: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
  },
  heroActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: 0,
  },
  heroActionBtn: {
    flex: 1,
    minWidth: 130,
  },
  filterCard: {
    marginBottom: spacing.md,
  },
  filterTitle: {
    fontSize: typography.caption,
    fontFamily: fonts.semibold,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  filterChipScroll: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    alignItems: "center",
  },
  filterChip: {
    marginBottom: 4,
  },
  bucketRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    alignItems: "center",
  },
  customRangeBlock: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  customInputs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  customInputGrow: {
    flex: 1,
    minWidth: 140,
  },
  rangeFootnote: {
    marginTop: spacing.sm,
    fontSize: typography.caption,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  summaryPill: {
    flexGrow: 1,
    flexBasis: Platform.select({ web: 240, default: "47%" }),
    minWidth: 150,
    borderWidth: 1,
    borderColor: hairline,
    borderRadius: radius.lg,
    backgroundColor: isDark ? c.surface : c.surfaceElevated,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderTopWidth: 2,
    borderTopColor: isDark ? c.primaryBorder : c.primary,
    ...themeShadowLift,
  },
  summaryPillSecondary: {
    borderTopColor: c.secondary,
  },
  summaryPillIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: hairline,
  },
  summaryPillText: {
    flex: 1,
    minWidth: 0,
  },
  summaryPillLabel: {
    color: c.textSecondary,
    fontSize: typography.caption,
    fontFamily: fonts.semibold,
  },
  summaryPillValue: {
    marginTop: 2,
    color: c.textPrimary,
    fontSize: typography.h3,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.3,
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
    backgroundColor: c.frostTint || ALCHEMY.creamAlt,
  },
  heroTextCol: {
    flex: 1,
    minWidth: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md + 2,
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
    ...Platform.select({
      web: { fontSize: typography.h3 + 1 },
      default: {},
    }),
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
    borderRadius: semanticRadius.card,
    backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: "center",
    ...Platform.select({
      web: {
        boxShadow: isDark
          ? "0 10px 24px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.04)"
          : "0 10px 22px rgba(24, 24, 27, 0.08), inset 0 1px 0 rgba(255,255,255,0.88)",
      },
      default: {},
    }),
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
    borderRadius: semanticRadius.card,
    backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: 11,
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
    borderRadius: semanticRadius.card,
    backgroundColor: c.surface,
    marginBottom: spacing.sm,
    overflow: "hidden",
    ...Platform.select({
      web: {
        boxShadow: isDark
          ? "0 10px 22px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.03)"
          : "0 8px 18px rgba(24, 24, 27, 0.08), inset 0 1px 0 rgba(255,255,255,0.88)",
      },
      default: {},
    }),
  },
  listCardRank: {
    width: 36,
    backgroundColor: isDark ? c.primarySoft : ALCHEMY.goldSoft,
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
    borderRadius: semanticRadius.card,
    backgroundColor: c.surface,
    overflow: "hidden",
    paddingVertical: Platform.select({ web: spacing.xs, default: 0 }),
    ...themeShadowLift,
    ...Platform.select({
      web: {
        boxShadow: isDark
          ? "0 14px 34px rgba(0,0,0,0.3)"
          : "0 12px 30px rgba(24, 24, 27, 0.1), inset 0 1px 0 rgba(255,255,255,0.85)",
      },
      default: {},
    }),
  },
  chartScrollContent: {
    minWidth: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  chart: {
    borderRadius: radius.md,
  },
  bannerSpacer: {
    marginBottom: spacing.sm,
  },
  loaderWrap: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
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
