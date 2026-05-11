import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { formatINR } from "./currency";
import { ALL_ORDER_STATUSES, getOrderStatusLabel } from "./orderStatus";

function csvEscape(val) {
  const s = String(val ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvLine(cells) {
  return `${cells.map(csvEscape).join(",")}\r\n`;
}

/** Builds a CSV snapshot from the same analytics payload used by charts / PDF. */
export function buildAnalyticsCsv(analytics) {
  const rows = [];
  const range = analytics?.range;
  const generated = new Date().toISOString();

  rows.push(csvLine(["zeevan_export", "analytics_v1"]));
  rows.push(csvLine(["generated_at", generated]));

  if (range?.filtered) {
    rows.push(
      csvLine([
        "range_filtered",
        String(range.preset || ""),
        String(range.bucket || ""),
        String(range.from || ""),
        String(range.to || ""),
      ])
    );
  } else {
    rows.push(csvLine(["range_mode", "legacy_full_history"]));
  }

  rows.push(csvLine([]));

  rows.push(csvLine(["section", "metric", "value"]));
  const add = (section, metric, value) => rows.push(csvLine([section, metric, String(value)]));

  add("summary", "total_revenue_inr", formatINR(analytics?.revenue?.total ?? 0));
  add("summary", "orders", analytics?.totals?.orders ?? 0);
  add("summary", "products_catalog", analytics?.totals?.products ?? 0);
  add(
    "summary",
    range?.filtered ? "users_in_period" : "users",
    analytics?.totals?.users ?? 0
  );
  add("summary", "admins_in_scope", analytics?.totals?.admins ?? 0);
  add("summary", "average_order_value_inr", formatINR(analytics?.revenue?.averageOrderValue ?? 0));
  add("summary", "delivered_revenue_inr", formatINR(analytics?.revenue?.delivered ?? 0));
  add("summary", "revenue_ex_cancelled_inr", formatINR(analytics?.revenue?.excludingCancelled ?? 0));

  if (range?.filtered) {
    add("activity_filtered", "orders_in_period", analytics?.activity?.ordersInPeriod ?? "");
    add("activity_filtered", "revenue_in_period_inr", formatINR(analytics?.activity?.revenueInPeriod ?? 0));
    add("activity_filtered", "new_users_in_period", analytics?.activity?.newUsersInPeriod ?? "");
  } else {
    add("activity", "orders_last_7_days", analytics?.activity?.ordersLast7Days ?? "");
    add("activity", "orders_last_30_days", analytics?.activity?.ordersLast30Days ?? "");
    add("activity", "revenue_last_7_days_inr", formatINR(analytics?.activity?.revenueLast7Days ?? 0));
    add("activity", "revenue_last_30_days_inr", formatINR(analytics?.activity?.revenueLast30Days ?? 0));
    add("activity", "new_users_last_7_days", analytics?.activity?.newUsersLast7Days ?? "");
    add("activity", "new_users_last_30_days", analytics?.activity?.newUsersLast30Days ?? "");
  }

  add("funnel", "delivered_orders", analytics?.funnel?.deliveredOrders ?? 0);
  add("funnel", "cancelled_orders", analytics?.funnel?.cancelledOrders ?? 0);
  add("funnel", "delivery_rate_percent", analytics?.funnel?.deliveryRatePercent ?? 0);
  add("funnel", "coupon_penetration_percent", analytics?.funnel?.couponPenetrationPercent ?? 0);

  add("inventory", "low_stock_products", analytics?.inventory?.lowStockProducts ?? 0);
  add("inventory", "out_of_stock_products", analytics?.inventory?.outOfStockProducts ?? 0);
  add("inventory", "in_stock_products", analytics?.inventory?.inStockProducts ?? 0);
  add("inventory", "inventory_retail_value_inr", formatINR(analytics?.inventory?.inventoryRetailValue ?? 0));

  add("carts", "users_with_active_cart", analytics?.carts?.usersWithActiveCart ?? 0);
  add("carts", "total_cart_items", analytics?.carts?.totalCartItems ?? 0);
  add("carts", "estimated_cart_value_inr", formatINR(analytics?.carts?.estimatedCartValue ?? 0));

  add("coupons", "coupon_orders", analytics?.coupons?.couponOrders ?? 0);
  add("coupons", "total_discount_inr", formatINR(analytics?.coupons?.totalDiscount ?? 0));
  add(
    "coupons",
    "avg_discount_per_coupon_order_inr",
    formatINR(analytics?.coupons?.averageDiscountPerCouponOrder ?? 0)
  );

  rows.push(csvLine([]));
  rows.push(csvLine(["section", "status", "revenue_inr"]));
  for (const s of ALL_ORDER_STATUSES) {
    rows.push(
      csvLine(["revenue_by_status", getOrderStatusLabel(s), formatINR(analytics?.revenue?.byStatus?.[s] ?? 0)])
    );
  }

  rows.push(csvLine([]));
  rows.push(csvLine(["section", "status", "order_count"]));
  const breakdown = analytics?.statusBreakdown || {};
  for (const [status, count] of Object.entries(breakdown)) {
    rows.push(csvLine(["status_breakdown", status, count]));
  }

  rows.push(csvLine([]));
  rows.push(csvLine(["section", "rank", "name", "qty", "revenue_inr"]));
  const topProducts = Array.isArray(analytics?.topProducts) ? analytics.topProducts : [];
  topProducts.forEach((p, i) => {
    rows.push(
      csvLine([
        "top_products",
        i + 1,
        p?.name ?? "",
        p?.qty ?? 0,
        formatINR(p?.revenue ?? 0),
      ])
    );
  });

  rows.push(csvLine([]));
  rows.push(csvLine(["section", "code", "orders", "discount_inr"]));
  const topCoupons = Array.isArray(analytics?.coupons?.topCoupons) ? analytics.coupons.topCoupons : [];
  topCoupons.forEach((c) => {
    rows.push(csvLine(["top_coupons", c?.code ?? "", c?.orders ?? 0, formatINR(c?.discount ?? 0)]));
  });

  const rs = analytics?.trends?.rangeSeries;
  if (rs && Array.isArray(rs.labels)) {
    rows.push(csvLine([]));
    rows.push(csvLine(["section", "label", "orders", "revenue_inr"]));
    const n = rs.labels.length;
    for (let i = 0; i < n; i += 1) {
      rows.push(
        csvLine([
          "trend_range_series",
          rs.labels[i] ?? "",
          rs.orderCounts?.[i] ?? 0,
          formatINR(rs.revenues?.[i] ?? 0),
        ])
      );
    }
  }

  const t7 = analytics?.trends?.last7Days;
  if (t7 && Array.isArray(t7.labels) && t7.labels.length) {
    rows.push(csvLine([]));
    rows.push(csvLine(["section", "label", "orders", "revenue_inr"]));
    const n = t7.labels.length;
    for (let i = 0; i < n; i += 1) {
      rows.push(
        csvLine([
          "trend_last_7_days",
          t7.labels[i] ?? "",
          t7.orderCounts?.[i] ?? 0,
          formatINR(t7.revenues?.[i] ?? 0),
        ])
      );
    }
  }

  const t14 = analytics?.trends?.last14Days;
  if (t14 && Array.isArray(t14.labels) && t14.labels.length) {
    rows.push(csvLine([]));
    rows.push(csvLine(["section", "label", "orders", "revenue_inr"]));
    const n = t14.labels.length;
    for (let i = 0; i < n; i += 1) {
      rows.push(
        csvLine([
          "trend_last_14_days",
          t14.labels[i] ?? "",
          t14.orderCounts?.[i] ?? 0,
          formatINR(t14.revenues?.[i] ?? 0),
        ])
      );
    }
  }

  return rows.join("");
}

/** Web: Blob download. Native: cache file + share sheet (same idea as PDF export). */
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
  if (!base) {
    throw new Error("Cache directory is not available.");
  }
  const uri = `${base}${filename}`;
  await FileSystem.writeAsStringAsync(uri, csv, { encoding: "utf8" });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: "text/csv",
      dialogTitle: "Export analytics CSV",
    });
  }
}
