import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { formatRupees } from "./adminFormat";
import { ALL_ORDER_STATUSES, getOrderStatusLabel } from "./orderStatus";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label, value) {
  return `<tr><td style="padding:6px 10px;border:1px solid #e5e7eb;">${escapeHtml(label)}</td><td style="padding:6px 10px;border:1px solid #e5e7eb;text-align:right;font-weight:600;">${escapeHtml(
    String(value)
  )}</td></tr>`;
}

/** PDF of the figures on the Analytics screen for the selected range. */
export function buildAnalyticsReportHtml(analytics) {
  const range = analytics?.range;
  const rangeTitle = [range?.preset || "full", range?.bucket ? `${range.bucket} buckets` : ""]
    .concat(range?.from && range?.to ? [`${String(range.from).slice(0, 10)} → ${String(range.to).slice(0, 10)}`] : [])
    .filter(Boolean)
    .join(" · ");

  const statusRows = ALL_ORDER_STATUSES.map((status) =>
    row(
      getOrderStatusLabel(status),
      `${analytics?.statusBreakdown?.[status] || 0} · ${formatRupees(analytics?.revenue?.byStatus?.[status] || 0)}`
    )
  ).join("");

  const products = (analytics?.topProducts || [])
    .map((item) =>
      row(item.name || "Item", `${item.qty || 0} jars · ${formatRupees(item.revenue || 0)}`)
    )
    .join("");

  const codes = (analytics?.coupons?.topCoupons || [])
    .map((item) => row(item.code || "", `${item.orders || 0} · ${formatRupees(item.discount || 0)}`))
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Zeevan Analytics</title></head>
<body style="font-family:system-ui,-apple-system,sans-serif;padding:24px;color:#1c1917;background:#fafaf9;">
  <h1 style="margin:0 0 8px;font-size:22px;">Zeevan · Analytics</h1>
  <p style="margin:0 0 4px;color:#57534e;font-size:13px;">${escapeHtml(rangeTitle)}</p>
  <p style="margin:0 0 24px;color:#78716c;font-size:12px;">Generated ${escapeHtml(new Date().toLocaleString())}</p>

  <h2 style="font-size:15px;margin:16px 0 8px;">Tiles</h2>
  <table style="border-collapse:collapse;width:100%;max-width:560px;font-size:13px;">
    ${row("Orders", String(analytics?.totals?.orders ?? 0))}
    ${row("Revenue", formatRupees(analytics?.revenue?.total || 0))}
    ${row("Delivered revenue", formatRupees(analytics?.revenue?.delivered || 0))}
    ${row("Average order", formatRupees(analytics?.revenue?.averageOrderValue || 0))}
    ${row("Delivered / cancelled", `${analytics?.funnel?.deliveredOrders || 0} / ${analytics?.funnel?.cancelledOrders || 0}`)}
    ${row("Delivery rate", `${analytics?.funnel?.deliveryRatePercent ?? 0}%`)}
  </table>

  <h2 style="font-size:15px;margin:16px 0 8px;">Orders by status</h2>
  <table style="border-collapse:collapse;width:100%;max-width:560px;font-size:13px;">${statusRows}</table>

  <h2 style="font-size:15px;margin:16px 0 8px;">Top products</h2>
  <table style="border-collapse:collapse;width:100%;max-width:560px;font-size:13px;">${
    products || row("No orders in this period.", "")
  }</table>

  <h2 style="font-size:15px;margin:16px 0 8px;">Coupons</h2>
  <table style="border-collapse:collapse;width:100%;max-width:560px;font-size:13px;">
    ${row("Orders with a code", String(analytics?.coupons?.couponOrders ?? 0))}
    ${row("Total discount", formatRupees(analytics?.coupons?.totalDiscount || 0))}
    ${row("Average discount", formatRupees(analytics?.coupons?.averageDiscountPerCouponOrder || 0))}
    ${codes}
  </table>

  <h2 style="font-size:15px;margin:16px 0 8px;">Stock</h2>
  <table style="border-collapse:collapse;width:100%;max-width:560px;font-size:13px;">
    ${row("Low stock", String(analytics?.inventory?.lowStockProducts ?? 0))}
    ${row("Out of stock", String(analytics?.inventory?.outOfStockProducts ?? 0))}
    ${row("In stock", String(analytics?.inventory?.inStockProducts ?? 0))}
    ${row("Stock value", formatRupees(analytics?.inventory?.inventoryRetailValue || 0))}
  </table>

  <h2 style="font-size:15px;margin:16px 0 8px;">Carts right now</h2>
  <table style="border-collapse:collapse;width:100%;max-width:560px;font-size:13px;">
    ${row("Customers with a cart", String(analytics?.carts?.usersWithActiveCart ?? 0))}
    ${row("Items", String(analytics?.carts?.totalCartItems ?? 0))}
    ${row("Estimated value", formatRupees(analytics?.carts?.estimatedCartValue || 0))}
  </table>

  <p style="margin-top:32px;font-size:11px;color:#a8a29e;">Zeevan admin analytics</p>
</body></html>`;
}

export async function exportAnalyticsReport(analytics) {
  const html = buildAnalyticsReportHtml(analytics);

  if (Platform.OS === "web") {
    if (typeof globalThis.window === "undefined") return;
    const w = globalThis.window.open("", "_blank");
    if (!w) throw new Error("Popup blocked — allow pop-ups to print.");
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => {
      try {
        w.print();
      } catch {
        /* ignore */
      }
    }, 250);
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Export analytics PDF" });
  }
}
