import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { formatINR } from "./currency";
import { ALL_ORDER_STATUSES, getOrderStatusLabel } from "./orderStatus";

/** Build HTML for print/PDF (tables + minimal styling). */
export function buildAnalyticsReportHtml(analytics) {
  const generated = new Date().toLocaleString();
  const range = analytics?.range;
  let rangeTitle = "Full history (legacy dashboard)";
  if (range?.filtered) {
    const parts = [range.preset || "custom", range.bucket ? `${range.bucket} buckets` : ""].filter(Boolean);
    if (range.from && range.to) {
      parts.push(`${String(range.from).slice(0, 10)} → ${String(range.to).slice(0, 10)}`);
    }
    rangeTitle = parts.join(" · ");
  }

  const rows = (label, value) =>
    `<tr><td style="padding:6px 10px;border:1px solid #e5e7eb;">${escapeHtml(label)}</td><td style="padding:6px 10px;border:1px solid #e5e7eb;text-align:right;font-weight:600;">${escapeHtml(
      String(value)
    )}</td></tr>`;

  const revByStatus = ALL_ORDER_STATUSES.map((s) =>
    rows(`Revenue · ${getOrderStatusLabel(s)}`, formatINR(analytics?.revenue?.byStatus?.[s] || 0))
  ).join("");

  const topProducts = (analytics?.topProducts || [])
    .slice(0, 15)
    .map(
      (p, i) =>
        `<tr><td style="padding:4px 8px;border:1px solid #e5e7eb;">${i + 1}</td><td style="padding:4px 8px;border:1px solid #e5e7eb;">${escapeHtml(
          String(p.name || "")
        )}</td><td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;">${p.qty ?? 0}</td><td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:right;">${formatINR(
          p.revenue || 0
        )}</td></tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Zeevan Analytics</title></head>
<body style="font-family:system-ui,-apple-system,sans-serif;padding:24px;color:#1c1917;background:#fafaf9;">
  <h1 style="margin:0 0 8px;font-size:22px;">Zeevan · Analytics report</h1>
  <p style="margin:0 0 4px;color:#57534e;font-size:13px;">${escapeHtml(rangeTitle)}</p>
  <p style="margin:0 0 24px;color:#78716c;font-size:12px;">Generated ${escapeHtml(generated)}</p>

  <h2 style="font-size:15px;margin:16px 0 8px;">Summary</h2>
  <table style="border-collapse:collapse;width:100%;max-width:560px;font-size:13px;">
    ${rows("Total revenue", formatINR(analytics?.revenue?.total || 0))}
    ${rows("Orders", String(analytics?.totals?.orders ?? 0))}
    ${rows("Products (catalog)", String(analytics?.totals?.products ?? 0))}
    ${rows(range?.filtered ? "Users (in period)" : "Users", String(analytics?.totals?.users ?? 0))}
    ${rows("Avg. order value", formatINR(analytics?.revenue?.averageOrderValue || 0))}
    ${rows("Delivered revenue", formatINR(analytics?.revenue?.delivered || 0))}
  </table>

  <h2 style="font-size:15px;margin:16px 0 8px;">Revenue by status</h2>
  <table style="border-collapse:collapse;width:100%;max-width:560px;font-size:13px;">${revByStatus}</table>

  <h2 style="font-size:15px;margin:16px 0 8px;">Top products</h2>
  <table style="border-collapse:collapse;width:100%;max-width:640px;font-size:12px;">
    <tr style="background:#f5f5f4;"><th style="padding:6px;border:1px solid #e5e7eb;">#</th><th style="padding:6px;border:1px solid #e5e7eb;">Name</th><th style="padding:6px;border:1px solid #e5e7eb;">Qty</th><th style="padding:6px;border:1px solid #e5e7eb;">Revenue</th></tr>
    ${topProducts || `<tr><td colspan="4" style="padding:8px;">No product data.</td></tr>`}
  </table>

  <p style="margin-top:32px;font-size:11px;color:#a8a29e;">Zeevan admin analytics · Confidential</p>
</body></html>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Opens print dialog (web) or shares PDF file (iOS/Android). */
export async function exportAnalyticsReport(analytics) {
  const html = buildAnalyticsReportHtml(analytics);

  if (Platform.OS === "web") {
    if (typeof globalThis.window === "undefined") return;
    const w = globalThis.window.open("", "_blank");
    if (!w) throw new Error("Popup blocked — allow pop-ups to print.");
    w.document.write(html);
    w.document.close();
    w.focus();
    // Let layout settle before print
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
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Export analytics PDF",
    });
  }
}
