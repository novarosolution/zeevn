import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminButton from "../../components/admin/AdminButton";
import AdminFilterTabs from "../../components/admin/AdminFilterTabs";
import AdminInput from "../../components/admin/AdminInput";
import AdminPanel from "../../components/admin/AdminPanel";
import AdminRevenueBars from "../../components/admin/AdminRevenueBars";
import AdminCategoryBar from "../../components/admin/AdminCategoryBar";
import AdminStatusPill, { orderStatusTone } from "../../components/admin/AdminStatusPill";
import AdminStatTile, { AdminStatGrid } from "../../components/admin/AdminStatTile";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumLoader from "../../components/ui/PremiumLoader";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchAdminAnalytics } from "../../services/adminService";
import { ADMIN_FONT, adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { spacing } from "../../theme/tokens";
import { formatRupees } from "../../utils/adminFormat";
import { exportAnalyticsCsv } from "../../utils/adminAnalyticsCsv";
import { printAdminHtml } from "../../utils/printAdminHtml";
import { ALL_ORDER_STATUSES, getOrderStatusLabel } from "../../utils/orderStatus";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

const COPY = ADMIN_SCREEN_COPY.analytics;
const CUSTOM_REQUIRED = "Both from and to are required for a custom date range (YYYY-MM-DD).";

const RANGE_TABS = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "custom", label: "Custom" },
];

function shortDay(label) {
  const afterComma = String(label || "").split(",")[1];
  return afterComma ? afterComma.trim().split(/\s+/)[0] : String(label || "").slice(0, 3);
}

export default function AdminAnalyticsScreen({ navigation, route }) {
  const { user, token } = useAuth();
  const { toastSuccess, toastError } = useToast();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium, compact), [chrome, c, shadowPremium, compact]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [rangePreset, setRangePreset] = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const hasData = useRef(false);

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
      } else {
        q.preset = rangePreset;
      }
      const data = await fetchAdminAnalytics(token, q);
      hasData.current = true;
      setAnalytics(data);
    } catch (err) {
      setError(err.message || "Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  }, [token, rangePreset, customFrom, customTo]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    if (rangePreset === "custom") return;
    loadAnalytics();
  }, [user?.isAdmin, rangePreset, loadAnalytics]);

  const handleExportCsv = useCallback(async () => {
    if (!analytics) return;
    try {
      await exportAnalyticsCsv(analytics);
      toastSuccess("CSV exported.", { title: "CSV ready" });
    } catch (err) {
      toastError(err.message || "Could not export CSV.", { title: "Export failed" });
    }
  }, [analytics, toastSuccess, toastError]);

  const printDayBook = useCallback(async () => {
    if (!analytics) return;
    const online = analytics.channels?.online || {};
    const counter = analytics.channels?.counter || {};
    const range = RANGE_TABS.find((tab) => tab.key === rangePreset)?.label || "Range";
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Zeevan day book</title>
      <style>body{font-family:system-ui,sans-serif;padding:24px;color:#1a2118}h1{font-size:20px;margin:0 0 4px}p{color:#5c6658;margin:0 0 16px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:8px 0;border-bottom:1px solid #e6e3d8}th{color:#7a8474;font-size:12px}</style></head>
      <body><h1>Zeevan day book</h1><p>${range}</p>
      <table><thead><tr><th>Channel</th><th>Bills</th><th>Revenue</th></tr></thead><tbody>
      <tr><td>Online</td><td>${online.count || 0}</td><td>₹${Number(online.revenue || 0).toLocaleString("en-IN")}</td></tr>
      <tr><td>Counter</td><td>${counter.count || 0}</td><td>₹${Number(counter.revenue || 0).toLocaleString("en-IN")}</td></tr>
      <tr><td>Total</td><td>${Number(online.count || 0) + Number(counter.count || 0)}</td><td>₹${Number(analytics.revenue?.total || 0).toLocaleString("en-IN")}</td></tr>
      </tbody></table></body></html>`;
    try {
      await printAdminHtml(html);
    } catch (err) {
      toastError(err.message || "Could not print the day book.");
    }
  }, [analytics, rangePreset, toastError]);

  const series = analytics?.trends?.rangeSeries;
  const chart = useMemo(() => {
    const labels = series?.labels || [];
    const revenues = series?.revenues || [];
    return {
      labels: labels.map(shortDay),
      values: revenues,
    };
  }, [series]);

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.gatePanel}>
              <PremiumErrorBanner severity="warning" title={ADMIN_GATE.title} message={ADMIN_GATE.message} />
              <AdminButton label={ADMIN_GATE.backHome} variant="primary" onPress={() => navigateCustomerRoute(navigation, "Home")} style={styles.gateCta} />
            </View>
          </SectionReveal>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

  const orders = Number(analytics?.totals?.orders || 0);
  const hasChart = orders > 0 && chart.labels.length > 0;
  const rangeLabel = RANGE_TABS.find((tab) => tab.key === rangePreset)?.label || "Range";
  const tileStyle = compact ? styles.tilePhone : undefined;
  const statusRows = ALL_ORDER_STATUSES.filter((status) => Number(analytics?.statusBreakdown?.[status] || 0) > 0);
  const topProducts = analytics?.topProducts || [];
  const topQty = Math.max(1, ...topProducts.map((item) => Number(item.qty) || 0));
  const coupons = analytics?.coupons;
  const showCoupons = Number(coupons?.couponOrders || 0) > 0 || (coupons?.topCoupons || []).length > 0;

  return (
    <AdminScreenShell style={styles.screen}>
      <KankregScrollPage scrollVariant="admin" showFooter={false} style={customerScrollFill} showsVerticalScrollIndicator={false}>
        <KankregAdminShell
          navigation={navigation}
          route={route}
          title={COPY.title}
          subtitle={COPY.subtitle}
          headerRight={
            <View style={{ flexDirection: "row", gap: 8 }}>
              <AdminButton label="Print day book" icon="print-outline" variant="ghost" size="sm" onPress={printDayBook} disabled={!analytics} />
              <AdminButton label="CSV" icon="download-outline" variant="ghost" size="sm" onPress={handleExportCsv} disabled={!analytics} />
            </View>
          }
        >
          <View style={styles.panel}>
            <AdminAlerts error={error} onCloseError={() => setError("")} />

            <AdminPanel title="Range" icon="calendar-outline" description="Pick a period. Numbers below follow it.">
              <AdminFilterTabs items={RANGE_TABS} value={rangePreset} onChange={setRangePreset} />
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
                  <AdminStatTile icon="receipt-outline" label="Orders" value={String(orders)} hint="In this range" style={tileStyle} />
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
                    style={tileStyle}
                  />
                  <AdminStatTile
                    icon="checkmark-done-outline"
                    label="Delivered / cancelled"
                    value={`${analytics.funnel?.deliveredOrders || 0} / ${analytics.funnel?.cancelledOrders || 0}`}
                    hint={`${analytics.funnel?.deliveryRatePercent ?? 0}% delivered`}
                    style={tileStyle}
                  />
                  <AdminStatTile
                    icon="globe-outline"
                    label="Online"
                    value={formatRupees(analytics.channels?.online?.revenue || 0)}
                    hint={`${analytics.channels?.online?.count || 0} orders`}
                    style={tileStyle}
                  />
                  <AdminStatTile
                    icon="storefront-outline"
                    label="Store selling"
                    value={formatRupees(analytics.channels?.counter?.revenue || 0)}
                    hint={`${analytics.channels?.counter?.count || 0} bills`}
                    tone="gold"
                    style={tileStyle}
                    onPress={() => navigation.navigate("AdminStoreSelling")}
                  />
                </AdminStatGrid>

                <AdminPanel title="Day book" icon="book-outline" description="Online vs counter in this period." action="Print" onAction={printDayBook}>
                  <AdminCategoryBar
                    name="Online"
                    percent={
                      (analytics.channels?.online?.revenue || 0) + (analytics.channels?.counter?.revenue || 0) > 0
                        ? Math.round(
                            ((analytics.channels?.online?.revenue || 0) /
                              ((analytics.channels?.online?.revenue || 0) + (analytics.channels?.counter?.revenue || 0))) *
                              100
                          )
                        : 0
                    }
                    meta={formatRupees(analytics.channels?.online?.revenue || 0)}
                  />
                  <AdminCategoryBar
                    name="Counter"
                    percent={
                      (analytics.channels?.online?.revenue || 0) + (analytics.channels?.counter?.revenue || 0) > 0
                        ? Math.round(
                            ((analytics.channels?.counter?.revenue || 0) /
                              ((analytics.channels?.online?.revenue || 0) + (analytics.channels?.counter?.revenue || 0))) *
                              100
                          )
                        : 0
                    }
                    meta={formatRupees(analytics.channels?.counter?.revenue || 0)}
                  />
                </AdminPanel>

                <AdminPanel
                  title="Revenue"
                  icon="cash-outline"
                  meta={rangeLabel}
                  description="One bar per day. The tallest day is gold."
                >
                  {hasChart ? (
                    <AdminRevenueBars labels={chart.labels} values={chart.values} />
                  ) : (
                    <Text style={styles.empty}>No orders in this period.</Text>
                  )}
                </AdminPanel>

                {statusRows.length ? (
                  <AdminPanel title="Orders by status" icon="list-outline" description="How this period’s orders sit now.">
                    {statusRows.map((status) => (
                      <View key={status} style={styles.row}>
                        <View style={styles.rowMain}>
                          <AdminStatusPill label={getOrderStatusLabel(status)} tone={orderStatusTone(status)} />
                        </View>
                        <Text style={styles.rowValue}>
                          {analytics.statusBreakdown?.[status] || 0} · {formatRupees(analytics.revenue?.byStatus?.[status] || 0)}
                        </Text>
                      </View>
                    ))}
                  </AdminPanel>
                ) : null}

                <AdminPanel title="Top products" icon="cube-outline" description="Most jars sold in this period.">
                  {topProducts.length ? (
                    topProducts.map((item, index) => (
                      <AdminCategoryBar
                        key={`${item.key || item.name}-${index}`}
                        name={item.name}
                        percent={Math.round((Number(item.qty) / topQty) * 100)}
                        meta={`${item.qty} · ${formatRupees(item.revenue)}`}
                      />
                    ))
                  ) : (
                    <Text style={styles.empty}>No orders in this period.</Text>
                  )}
                </AdminPanel>

                {showCoupons ? (
                  <AdminPanel title="Coupons" icon="pricetag-outline">
                    <View style={styles.row}>
                      <Text style={styles.rowLabel}>Orders with a code</Text>
                      <Text style={styles.rowValue}>{coupons.couponOrders || 0}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.rowLabel}>Total discount</Text>
                      <Text style={styles.rowValue}>{formatRupees(coupons.totalDiscount || 0)}</Text>
                    </View>
                    {(coupons.topCoupons || []).map((item) => (
                      <View key={item.code} style={styles.row}>
                        <Text style={styles.rowLabel}>{item.code}</Text>
                        <Text style={styles.rowValue}>
                          {item.orders} · {formatRupees(item.discount)}
                        </Text>
                      </View>
                    ))}
                  </AdminPanel>
                ) : null}
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
    custom: { gap: 8, marginTop: 8 },
    tilePhone: { flexBasis: "47%", flexGrow: 1, maxWidth: "48%" },
    empty: { fontSize: 13.5, color: chrome.inkSoft, fontFamily: ADMIN_FONT.medium },
    row: {
      flexDirection: compact ? "column" : "row",
      alignItems: compact ? "flex-start" : "center",
      justifyContent: "space-between",
      gap: 8,
      paddingVertical: 11,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
    },
    rowMain: { flex: 1, minWidth: 0 },
    rowLabel: { flex: 1, fontSize: 13.5, color: chrome.ink, fontFamily: ADMIN_FONT.medium },
    rowValue: { fontSize: 13.5, color: chrome.inkSoft, fontFamily: ADMIN_FONT.semibold },
  });
}
