import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminButton from "../../components/admin/AdminButton";
import AdminInput from "../../components/admin/AdminInput";
import AdminPanel from "../../components/admin/AdminPanel";
import AdminStatTile, { AdminStatGrid } from "../../components/admin/AdminStatTile";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumChip from "../../components/ui/PremiumChip";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumLoader from "../../components/ui/PremiumLoader";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchAdminAnalytics } from "../../services/adminService";
import { adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, radius, spacing } from "../../theme/tokens";
import { formatRupees } from "../../utils/adminFormat";
import { exportAnalyticsCsv } from "../../utils/adminAnalyticsCsv";
import { exportAnalyticsReport } from "../../utils/adminAnalyticsPdf";
import { ALL_ORDER_STATUSES, getOrderStatusLabel } from "../../utils/orderStatus";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

const COPY = ADMIN_SCREEN_COPY.analytics;
const CUSTOM_REQUIRED = "Both from and to are required for a custom date range (YYYY-MM-DD).";

const RANGE_CHIPS = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "1y", label: "1 year" },
  { key: "mtd", label: "Month to date" },
  { key: "ytd", label: "Year to date" },
  { key: "all", label: "All" },
  { key: "full", label: "Full history" },
  { key: "custom", label: "Custom" },
];

const BUCKET_CHIPS = [
  { key: "auto", label: "Auto" },
  { key: "day", label: "Daily" },
  { key: "month", label: "Monthly" },
];

function hexToRgb(hex) {
  const h = String(hex || "").replace("#", "");
  if (h.length !== 6) return { r: 31, g: 51, b: 31 };
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

function sparseAxisLabels(labels, maxVisible = 6, compactLen = 6) {
  const source = Array.isArray(labels) ? labels : [];
  if (!source.length) return [];
  const step = Math.max(1, Math.ceil(source.length / maxVisible));
  return source.map((label, index) => {
    if (index % step !== 0) return "";
    const text = String(label || "").trim();
    return text.length > compactLen ? text.slice(0, compactLen) : text;
  });
}

export default function AdminAnalyticsScreen({ navigation, route }) {
  const { user, token } = useAuth();
  const { toastSuccess, toastError } = useToast();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const { width } = useKankregLayout();
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium, compact), [chrome, c, shadowPremium, compact]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [rangePreset, setRangePreset] = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [bucket, setBucket] = useState("auto");
  const hasData = useRef(false);

  const chartWidth = Math.max(280, width - (compact ? 40 : 64));
  const chartConfig = useMemo(() => {
    const rgb = hexToRgb(c.primary);
    const labelRgb = hexToRgb(chrome.ink);
    return {
      backgroundGradientFrom: chrome.card,
      backgroundGradientTo: chrome.card,
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(${labelRgb.r}, ${labelRgb.g}, ${labelRgb.b}, ${opacity})`,
      strokeWidth: 2,
      propsForDots: { r: "3", strokeWidth: "2", stroke: c.primary },
    };
  }, [c.primary, chrome.card, chrome.ink]);

  const loadAnalytics = useCallback(async () => {
    if (rangePreset === "custom" && (!customFrom.trim() || !customTo.trim())) {
      setError(CUSTOM_REQUIRED);
      setLoading(false);
      return;
    }
    try {
      setLoading((prev) => prev && !hasData.current);
      setError("");
      const q = {};
      if (rangePreset === "custom") {
        q.from = customFrom.trim();
        q.to = customTo.trim();
      } else if (rangePreset !== "full") {
        q.preset = rangePreset;
      }
      if (bucket !== "auto") q.bucket = bucket;
      const data = await fetchAdminAnalytics(token, q);
      hasData.current = true;
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
  }, [user?.isAdmin, rangePreset, bucket]);

  const handleExportPdf = useCallback(async () => {
    if (!analytics) return;
    try {
      await exportAnalyticsReport(analytics);
      toastSuccess("Report exported.", { title: "PDF ready" });
    } catch (err) {
      toastError(err.message || "Could not export report.", { title: "Export failed" });
    }
  }, [analytics, toastSuccess, toastError]);

  const handleExportCsv = useCallback(async () => {
    if (!analytics) return;
    try {
      await exportAnalyticsCsv(analytics);
      toastSuccess("CSV exported.", { title: "CSV ready" });
    } catch (err) {
      toastError(err.message || "Could not export CSV.", { title: "Export failed" });
    }
  }, [analytics, toastSuccess, toastError]);

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.gatePanel}>
              <PremiumErrorBanner severity="warning" title={ADMIN_GATE.title} message={ADMIN_GATE.message} />
              <PremiumButton label={ADMIN_GATE.backHome} variant="primary" onPress={() => navigateCustomerRoute(navigation, "Home")} style={styles.gateCta} />
            </View>
          </SectionReveal>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

  const orders = Number(analytics?.totals?.orders || 0);
  const series = analytics?.trends?.rangeSeries;
  const hasChart = orders > 0 && Array.isArray(series?.labels) && series.labels.length > 0;
  const tileStyle = compact ? styles.tilePhone : undefined;

  return (
    <AdminScreenShell style={styles.screen}>
      <KankregScrollPage scrollVariant="admin" showFooter={false} style={customerScrollFill} showsVerticalScrollIndicator={false}>
        <KankregAdminShell
          navigation={navigation}
          route={route}
          title={COPY.title}
          subtitle={COPY.subtitle}
          headerRight={
            <View style={styles.headerActions}>
              <AdminButton label="CSV" icon="download-outline" variant="ghost" size="sm" onPress={handleExportCsv} disabled={!analytics} />
              <AdminButton label="PDF" icon="document-text-outline" variant="ghost" size="sm" onPress={handleExportPdf} disabled={!analytics} />
            </View>
          }
        >
          <View style={styles.panel}>
            <AdminAlerts error={error} onCloseError={() => setError("")} />

            <AdminPanel title="Range" icon="calendar-outline" description="Sold jars, revenue, coupons, and stock value for this shop.">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                {RANGE_CHIPS.map((item) => (
                  <PremiumChip
                    key={item.key}
                    label={item.label}
                    tone="gold"
                    size="sm"
                    selected={rangePreset === item.key}
                    onPress={() => setRangePreset(item.key)}
                    style={styles.chip}
                  />
                ))}
              </ScrollView>
              <Text style={styles.fieldLabel}>Chart buckets</Text>
              <View style={styles.bucketRow}>
                {BUCKET_CHIPS.map((item) => (
                  <PremiumChip
                    key={item.key}
                    label={item.label}
                    tone="neutral"
                    size="sm"
                    selected={bucket === item.key}
                    onPress={() => setBucket(item.key)}
                    style={styles.chip}
                  />
                ))}
              </View>
              {rangePreset === "custom" ? (
                <View style={styles.custom}>
                  <AdminInput label="From" value={customFrom} onChangeText={setCustomFrom} placeholder="YYYY-MM-DD" icon="calendar-outline" />
                  <AdminInput label="To" value={customTo} onChangeText={setCustomTo} placeholder="YYYY-MM-DD" icon="calendar-outline" />
                  <AdminButton label="Apply range" variant="primary" onPress={loadAnalytics} />
                </View>
              ) : null}
            </AdminPanel>

            {loading && !analytics ? <PremiumLoader size="sm" caption="Loading analytics…" /> : null}

            {analytics ? (
              <>
                <AdminStatGrid min={compact ? 148 : 180}>
                  <AdminStatTile icon="receipt-outline" label="Orders" value={String(orders)} hint="Created in this range" style={tileStyle} />
                  <AdminStatTile
                    icon="cash-outline"
                    label="Revenue"
                    value={formatRupees(analytics.revenue?.total || 0)}
                    hint={`Delivered ${formatRupees(analytics.revenue?.delivered || 0)}`}
                    tone="gold"
                    style={tileStyle}
                  />
                  <AdminStatTile
                    icon="calculator-outline"
                    label="Average order"
                    value={formatRupees(analytics.revenue?.averageOrderValue || 0)}
                    hint={orders ? "Revenue ÷ orders" : "₹0 when there are none"}
                    style={tileStyle}
                  />
                  <AdminStatTile
                    icon="checkmark-done-outline"
                    label="Delivered / cancelled"
                    value={`${analytics.funnel?.deliveredOrders || 0} / ${analytics.funnel?.cancelledOrders || 0}`}
                    hint={`${analytics.funnel?.deliveryRatePercent ?? 0}% delivery rate`}
                    style={tileStyle}
                  />
                </AdminStatGrid>

                <AdminPanel title="Trend" icon="trending-up-outline">
                  {hasChart ? (
                    <>
                      <Text style={styles.chartCaption}>Orders per bucket</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <LineChart
                          data={{
                            labels: sparseAxisLabels(series.labels),
                            datasets: [{ data: series.orderCounts.map((n) => chartInt(n)) }],
                          }}
                          width={Math.max(chartWidth, series.labels.length * 28)}
                          height={200}
                          fromZero
                          bezier
                          chartConfig={chartConfig}
                          style={styles.chart}
                        />
                      </ScrollView>
                      <Text style={styles.chartCaption}>Revenue per bucket</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <LineChart
                          data={{
                            labels: sparseAxisLabels(series.labels),
                            datasets: [{ data: series.revenues.map((n) => chartInt(n)) }],
                          }}
                          width={Math.max(chartWidth, series.labels.length * 28)}
                          height={200}
                          fromZero
                          bezier
                          chartConfig={chartConfig}
                          style={styles.chart}
                        />
                      </ScrollView>
                    </>
                  ) : (
                    <Text style={styles.empty}>No orders in this period.</Text>
                  )}
                </AdminPanel>

                <AdminPanel title="Orders by status" icon="list-outline">
                  {ALL_ORDER_STATUSES.map((status) => (
                    <View key={status} style={styles.row}>
                      <Text style={styles.rowLabel}>{getOrderStatusLabel(status)}</Text>
                      <Text style={styles.rowValue}>
                        {analytics.statusBreakdown?.[status] || 0} · {formatRupees(analytics.revenue?.byStatus?.[status] || 0)}
                      </Text>
                    </View>
                  ))}
                </AdminPanel>

                <AdminPanel title="Top products" icon="cube-outline" description="Every order in the range, not only delivered.">
                  {(analytics.topProducts || []).length ? (
                    (analytics.topProducts || []).map((item, index) => (
                      <View key={`${item.key || item.name}-${index}`} style={styles.row}>
                        <Text style={styles.rowLabel} numberOfLines={2}>
                          {item.name}
                        </Text>
                        <Text style={styles.rowValue}>
                          {item.qty} jars · {formatRupees(item.revenue)}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.empty}>No orders in this period.</Text>
                  )}
                </AdminPanel>

                <AdminPanel title="Coupons" icon="pricetag-outline">
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Orders with a code</Text>
                    <Text style={styles.rowValue}>{analytics.coupons?.couponOrders || 0}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Total discount</Text>
                    <Text style={styles.rowValue}>{formatRupees(analytics.coupons?.totalDiscount || 0)}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Average discount</Text>
                    <Text style={styles.rowValue}>{formatRupees(analytics.coupons?.averageDiscountPerCouponOrder || 0)}</Text>
                  </View>
                  {(analytics.coupons?.topCoupons || []).map((item) => (
                    <View key={item.code} style={styles.row}>
                      <Text style={styles.rowLabel}>{item.code}</Text>
                      <Text style={styles.rowValue}>
                        {item.orders} · {formatRupees(item.discount)}
                      </Text>
                    </View>
                  ))}
                </AdminPanel>

                <AdminPanel title="Stock" icon="layers-outline" description="Does not follow the date range.">
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Low stock</Text>
                    <Text style={styles.rowValue}>{analytics.inventory?.lowStockProducts || 0}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Out of stock</Text>
                    <Text style={styles.rowValue}>{analytics.inventory?.outOfStockProducts || 0}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>In stock</Text>
                    <Text style={styles.rowValue}>{analytics.inventory?.inStockProducts || 0}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Stock value</Text>
                    <Text style={styles.rowValue}>{formatRupees(analytics.inventory?.inventoryRetailValue || 0)}</Text>
                  </View>
                </AdminPanel>

                <AdminPanel title="Carts right now" icon="cart-outline">
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Customers with a cart</Text>
                    <Text style={styles.rowValue}>{analytics.carts?.usersWithActiveCart || 0}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Items</Text>
                    <Text style={styles.rowValue}>{analytics.carts?.totalCartItems || 0}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Estimated value</Text>
                    <Text style={styles.rowValue}>{formatRupees(analytics.carts?.estimatedCartValue || 0)}</Text>
                  </View>
                </AdminPanel>
              </>
            ) : null}
          </View>
        </KankregAdminShell>
      </KankregScrollPage>
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium, compact) {
  return StyleSheet.create({
    screen: { flex: 1, width: "100%", alignSelf: "center", maxWidth: "100%" },
    panel: { ...adminShellContent(), gap: spacing.sm },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    headerActions: { flexDirection: "row", gap: 8 },
    chipScroll: { flexDirection: "row", gap: 8, paddingRight: 8 },
    chip: { marginRight: 0 },
    bucketRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    fieldLabel: {
      marginTop: 10,
      marginBottom: 6,
      fontSize: 11.5,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      color: chrome.inkFaint,
      fontFamily: fonts.semibold,
    },
    custom: { gap: 8, marginTop: 8 },
    tilePhone: { flexBasis: "47%", flexGrow: 1, maxWidth: "48%" },
    chartCaption: { fontSize: 12.5, color: chrome.inkFaint, fontFamily: fonts.semibold, marginBottom: 6, marginTop: 8 },
    chart: { borderRadius: radius.md },
    empty: { fontSize: 13.5, color: chrome.inkSoft, fontFamily: fonts.medium },
    row: {
      flexDirection: compact ? "column" : "row",
      alignItems: compact ? "flex-start" : "center",
      justifyContent: "space-between",
      gap: 4,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
    },
    rowLabel: { flex: 1, fontSize: 13.5, color: chrome.ink, fontFamily: fonts.medium },
    rowValue: { fontSize: 13.5, color: chrome.inkSoft, fontFamily: fonts.semibold },
  });
}
