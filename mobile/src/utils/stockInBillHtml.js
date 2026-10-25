import { APP_DISPLAY_NAME } from "../content/appContent";
import { KANKREG_PALETTE, ZEEVAN_GOLD, ZEEVAN_GREEN } from "../theme/kankregWeb";
import { htmlEscape } from "./orderInvoiceMeta";

function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Goods-received bill for a booked stock-in receipt. */
export function buildStockInBillHtml(receipt) {
  const lines = Array.isArray(receipt?.lines) ? receipt.lines : [];
  const total = lines.reduce((sum, line) => sum + Math.max(0, Number(line.quantity) || 0), 0);
  const ref = String(receipt?.id || receipt?._id || "").slice(-6).toUpperCase() || "DRAFT";
  const p = KANKREG_PALETTE;
  const rows = lines
    .map((line, index) => {
      const qty = Math.max(0, Number(line.quantity) || 0);
      return `<tr>
        <td>${index + 1}</td>
        <td>
          <strong>${htmlEscape(line.name || "Jar")}</strong>
          <div class="muted">${htmlEscape([line.sku, line.unit].filter(Boolean).join(" · ") || "—")}</div>
        </td>
        <td class="num">${qty}</td>
      </tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${htmlEscape(APP_DISPLAY_NAME)} Stock bill ${htmlEscape(ref)}</title>
    <style>
      body { margin: 0; padding: 28px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; color: ${p.ink}; background: #fff; }
      h1 { margin: 0; font-size: 22px; letter-spacing: -0.3px; }
      .tag { display: inline-block; margin-top: 6px; padding: 3px 8px; border-radius: 999px; background: ${ZEEVAN_GOLD.soft}; color: ${ZEEVAN_GOLD.deep}; font-size: 11px; font-weight: 700; }
      .meta { margin: 16px 0 20px; color: ${p.inkSoft}; font-size: 13px; line-height: 1.5; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid ${p.line}; font-size: 13px; vertical-align: top; }
      th { font-size: 11px; letter-spacing: 0.6px; text-transform: uppercase; color: ${p.inkFaint}; }
      .num { text-align: right; font-weight: 700; }
      .muted { color: ${p.inkFaint}; font-size: 12px; margin-top: 2px; }
      .foot { margin-top: 22px; display: flex; justify-content: space-between; align-items: center; }
      .total { font-size: 16px; font-weight: 700; color: ${ZEEVAN_GREEN.deep}; }
    </style>
  </head>
  <body>
    <h1>${htmlEscape(APP_DISPLAY_NAME)}</h1>
    <div class="tag">Stock-in bill</div>
    <div class="meta">
      Bill ${htmlEscape(ref)}<br />
      ${htmlEscape(fmtDate(receipt?.receivedAt || receipt?.createdAt))}<br />
      ${receipt?.note ? `Note: ${htmlEscape(receipt.note)}<br />` : ""}
      ${receipt?.savedByName ? `Received by ${htmlEscape(receipt.savedByName)}` : ""}
    </div>
    <table>
      <thead><tr><th>#</th><th>Product</th><th class="num">Qty in</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="3">No jars on this bill.</td></tr>`}</tbody>
    </table>
    <div class="foot">
      <span class="muted">Stock added to the shop.</span>
      <span class="total">${total} in</span>
    </div>
  </body>
</html>`;
}
