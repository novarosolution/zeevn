import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { formatRupees } from "./adminFormat";
import { ALL_ORDER_STATUSES, getOrderStatusLabel } from "./orderStatus";

function csvEscape(val) {
  const s = String(val ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvLine(cells) {
  return `${cells.map(csvEscape).join(",")}\r\n`;
}

/** CSV of the figures on the Analytics screen for the selected range. */
export function buildAnalyticsCsv(analytics) {
  const rows = [];
  const range = analytics?.range;
  rows.push(csvLine(["zeevan_export", "analytics"]));
  rows.push(csvLine(["generated_at", new Date().toISOString()]));
  rows.push(
    csvLine([
      "range",
      String(range?.preset || "full"),
      String(range?.bucket || ""),
      String(range?.from || ""),
      String(range?.to || ""),
    ])
  );
  rows.push(csvLine([]));
  rows.push(csvLine(["section", "metric", "value"]));
  const add = (section, metric, value) => rows.push(csvLine([section, metric, String(value)]));

  add("tiles", "orders", analytics?.totals?.orders ?? 0);
  add("tiles", "revenue", formatRupees(analytics?.revenue?.total ?? 0));
  add("tiles", "delivered_revenue", formatRupees(analytics?.revenue?.delivered ?? 0));
  add("tiles", "average_order", formatRupees(analytics?.revenue?.averageOrderValue ?? 0));
  add("tiles", "delivered_count", analytics?.funnel?.deliveredOrders ?? 0);
  add("tiles", "cancelled_count", analytics?.funnel?.cancelledOrders ?? 0);
  add("tiles", "delivery_rate_percent", analytics?.funnel?.deliveryRatePercent ?? 0);

  rows.push(csvLine([]));
  rows.push(csvLine(["section", "status", "count", "revenue"]));
  for (const status of ALL_ORDER_STATUSES) {
    rows.push(
      csvLine([
        "status",
        getOrderStatusLabel(status),
        analytics?.statusBreakdown?.[status] ?? 0,
        formatRupees(analytics?.revenue?.byStatus?.[status] ?? 0),
      ])
    );
  }

  rows.push(csvLine([]));
  rows.push(csvLine(["section", "name", "jars", "line_revenue"]));
  for (const product of analytics?.topProducts || []) {
    rows.push(csvLine(["products", product?.name ?? "", product?.qty ?? 0, formatRupees(product?.revenue ?? 0)]));
  }

  add("coupons", "orders_with_code", analytics?.coupons?.couponOrders ?? 0);
  add("coupons", "total_discount", formatRupees(analytics?.coupons?.totalDiscount ?? 0));
  add("coupons", "average_discount", formatRupees(analytics?.coupons?.averageDiscountPerCouponOrder ?? 0));
  rows.push(csvLine(["section", "code", "orders", "discount"]));
  for (const coupon of analytics?.coupons?.topCoupons || []) {
    rows.push(csvLine(["top_codes", coupon?.code ?? "", coupon?.orders ?? 0, formatRupees(coupon?.discount ?? 0)]));
  }

  add("stock", "low", analytics?.inventory?.lowStockProducts ?? 0);
  add("stock", "out", analytics?.inventory?.outOfStockProducts ?? 0);
  add("stock", "in_stock", analytics?.inventory?.inStockProducts ?? 0);
  add("stock", "value", formatRupees(analytics?.inventory?.inventoryRetailValue ?? 0));

  add("carts", "customers", analytics?.carts?.usersWithActiveCart ?? 0);
  add("carts", "items", analytics?.carts?.totalCartItems ?? 0);
  add("carts", "estimated_value", formatRupees(analytics?.carts?.estimatedCartValue ?? 0));

  const series = analytics?.trends?.rangeSeries;
  if (series?.labels?.length) {
    rows.push(csvLine([]));
    rows.push(csvLine(["section", "label", "orders", "revenue"]));
    series.labels.forEach((label, index) => {
      rows.push(
        csvLine(["trend", label ?? "", series.orderCounts?.[index] ?? 0, formatRupees(series.revenues?.[index] ?? 0)])
      );
    });
  }

  return rows.join("");
}

export async function exportAnalyticsCsv(analytics) {
  const csv = buildAnalyticsCsv(analytics);
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const filename = `zeevan-analytics-${stamp}.csv`;

  if (Platform.OS === "web") {
    if (typeof globalThis.window === "undefined") return;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = globalThis.document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const base = FileSystem.cacheDirectory;
  if (!base) throw new Error("Cache directory is not available.");
  const uri = `${base}${filename}`;
  await FileSystem.writeAsStringAsync(uri, csv, { encoding: "utf8" });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "text/csv", dialogTitle: "Export analytics CSV" });
  }
}
