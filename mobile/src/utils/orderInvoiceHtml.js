import {
  APP_DISPLAY_NAME,
  APP_TAGLINE,
  APP_WORDMARK_SUBLINE,
  SUPPORT_EMAIL_DISPLAY,
} from "../content/appContent";
import { KANKREG_PALETTE, ZEEVAN_GOLD, ZEEVAN_GREEN } from "../theme/kankregWeb";
import {
  formatPaymentStatusLabel,
  getPaymentBadge,
  htmlEscape,
  resolveInvoiceNumber,
  resolveOrderRef,
} from "./orderInvoiceMeta";

function fmtInr(n) {
  return `&#8377; ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(value, fallback = "&mdash;") {
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(value) {
  if (!value) return "&mdash;";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "&mdash;";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Premium Zeevan-branded tax invoice HTML (print / expo-print). */
export function buildOrderInvoiceHtml(order) {
  const invoiceNumber = resolveInvoiceNumber(order);
  const orderRef = resolveOrderRef(order);
  const issueDate = order?.invoice?.issueDate || order?.createdAt;
  const dueDate = order?.invoice?.dueDate || "";
  const itemsTotal = Number(order?.priceBreakdown?.itemsTotal || 0);
  const deliveryFee = Number(order?.priceBreakdown?.deliveryFee || 0);
  const platformFee = Number(order?.priceBreakdown?.platformFee || 0);
  const discountAmount = Number(order?.priceBreakdown?.discountAmount || 0);
  const taxAmount = Number(order?.invoice?.taxAmount || 0);
  const taxRate = Number(order?.invoice?.taxRatePercent || 0);
  const totalAmount = Number(order?.totalPrice || 0);
  const paymentBadge = getPaymentBadge(order?.paymentStatus);
  const isPaid = paymentBadge.tone === "paid";
  const itemsCount = (order?.products || []).reduce((s, p) => s + Number(p.quantity || 0), 0);

  const lineItems = (order?.products || [])
    .map((p, idx) => {
      const qty = Number(p.quantity || 0);
      const price = Number(p.price || 0);
      const amount = qty * price;
      return `
        <tr>
          <td class="lineNo">${idx + 1}</td>
          <td class="lineName">
            <div class="lineNameMain">${htmlEscape(p.name)}</div>
            ${p.variantLabel ? `<div class="lineVariant">${htmlEscape(p.variantLabel)}</div>` : ""}
          </td>
          <td class="numCol">${qty}</td>
          <td class="numCol">${fmtInr(price)}</td>
          <td class="numCol amountCol">${fmtInr(amount)}</td>
        </tr>
      `;
    })
    .join("");

  const p = KANKREG_PALETTE;
  const g = ZEEVAN_GREEN;
  const gold = ZEEVAN_GOLD;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${htmlEscape(APP_DISPLAY_NAME)} Invoice ${htmlEscape(invoiceNumber)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;700&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style>
      :root {
        --green: ${g.base};
        --green-bright: ${g.bright};
        --green-deep: ${g.deep};
        --gold: ${gold.base};
        --gold-bright: ${gold.bright};
        --gold-deep: ${gold.deep};
        --ink: ${p.ink};
        --ink-soft: ${p.inkSoft};
        --muted: ${p.inkFaint};
        --paper: #FFFEFC;
        --cream: ${p.paper};
        --line: ${p.line};
        --line-strong: ${p.lineSoft};
        --green-soft: rgba(92, 104, 52, 0.1);
        --gold-soft: rgba(220, 172, 116, 0.14);
        --danger: ${p.danger};
        --danger-soft: rgba(184, 68, 47, 0.08);
        --paid: #15803D;
        --paid-soft: #ECFDF3;
        --refunded: #1E3A8A;
        --refunded-soft: #EFF4FF;
      }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      body {
        background: radial-gradient(circle at 12% 6%, ${p.paper} 0%, ${p.paper2} 48%, #E8E0D0 100%);
        color: var(--ink);
        font-family: "Hanken Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
        font-feature-settings: "tnum" 1, "lnum" 1;
        padding: 24px;
      }
      .sheet {
        position: relative;
        max-width: 820px;
        margin: 0 auto;
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: 22px;
        overflow: hidden;
        box-shadow:
          0 30px 60px rgba(30, 32, 24, 0.1),
          0 8px 18px rgba(30, 32, 24, 0.05),
          inset 0 1px 0 rgba(255, 255, 255, 0.95);
      }
      .sheet::before {
        content: "";
        position: absolute;
        inset: 0 0 auto 0;
        height: 6px;
        background: linear-gradient(90deg, var(--green-deep) 0%, var(--green) 40%, var(--gold) 100%);
      }
      .sheet::after {
        content: "${htmlEscape(APP_DISPLAY_NAME)}";
        position: absolute;
        right: 28px;
        bottom: 32px;
        font-family: "Fraunces", Georgia, serif;
        font-size: 88px;
        font-weight: 700;
        color: rgba(36, 68, 36, 0.045);
        letter-spacing: -2px;
        line-height: 1;
        pointer-events: none;
        user-select: none;
      }
      .letterhead {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 24px;
        padding: 32px 36px 22px;
        border-bottom: 1px solid var(--line);
        background: linear-gradient(180deg, #FFFFFF 0%, #FFFCF6 100%);
      }
      .brandCol { max-width: 58%; }
      .wordmark {
        font-family: "Fraunces", Georgia, serif;
        font-size: 34px;
        line-height: 1;
        font-weight: 700;
        color: var(--ink);
        letter-spacing: -0.6px;
      }
      .wordmark .accent { color: var(--green-deep); }
      .wordmark .gold { color: var(--gold-deep); }
      .tagline {
        margin-top: 8px;
        font-size: 11px;
        color: var(--muted);
        letter-spacing: 0.55px;
        text-transform: uppercase;
        font-weight: 600;
      }
      .hairline {
        margin-top: 14px;
        height: 2px;
        width: 88px;
        background: linear-gradient(90deg, var(--gold-bright), var(--green-deep));
        border-radius: 2px;
      }
      .companyMeta {
        margin-top: 12px;
        font-size: 11.5px;
        color: var(--ink-soft);
        line-height: 1.65;
      }
      .invoiceCard {
        min-width: 248px;
        border: 1px solid var(--line);
        background: linear-gradient(165deg, #FFFFFF 0%, var(--gold-soft) 100%);
        border-radius: 16px;
        padding: 16px 18px;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.9);
      }
      .invoiceTag {
        display: inline-block;
        background: var(--green-soft);
        color: var(--green-deep);
        border: 1px solid rgba(36, 68, 36, 0.18);
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1.15px;
        margin-bottom: 12px;
      }
      .invoiceCard .row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        font-size: 12px;
        margin-bottom: 6px;
        color: var(--ink);
      }
      .invoiceCard .row:last-child { margin-bottom: 0; }
      .invoiceCard .key {
        color: var(--muted);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.45px;
        font-size: 9.5px;
      }
      .invoiceCard .val { font-weight: 700; color: var(--ink); }
      .invoiceCard .invNumber {
        font-family: "Fraunces", Georgia, serif;
        font-size: 17px;
        font-weight: 700;
        letter-spacing: -0.25px;
        color: var(--green-deep);
      }
      .statusPill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: 10px;
        padding: 5px 12px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.45px;
        text-transform: uppercase;
        border: 1px solid var(--line);
      }
      .statusPill::before {
        content: "";
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: currentColor;
      }
      .statusPill.paid { background: var(--paid-soft); color: var(--paid); border-color: rgba(21,128,61,0.25); }
      .statusPill.pending { background: var(--gold-soft); color: var(--gold-deep); }
      .statusPill.failed { background: var(--danger-soft); color: var(--danger); }
      .statusPill.refunded { background: var(--refunded-soft); color: var(--refunded); }

      .body { padding: 26px 36px 36px; }
      .metaGrid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
        margin-bottom: 24px;
      }
      .metaCard {
        border: 1px solid var(--line);
        background: var(--paper);
        border-radius: 14px;
        padding: 16px;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.9);
      }
      .metaCard .label {
        font-size: 9.5px;
        font-weight: 700;
        letter-spacing: 1.3px;
        text-transform: uppercase;
        color: var(--green-deep);
        margin-bottom: 8px;
      }
      .metaCard .heading {
        font-family: "Fraunces", Georgia, serif;
        font-size: 15px;
        font-weight: 700;
        color: var(--ink);
        margin-bottom: 6px;
      }
      .metaCard .line {
        font-size: 12px;
        color: var(--ink-soft);
        margin-bottom: 3px;
        line-height: 1.55;
      }
      .metaCard .line.muted { color: var(--muted); }

      .sectionTitle {
        font-family: "Fraunces", Georgia, serif;
        font-size: 16px;
        font-weight: 700;
        color: var(--ink);
        margin: 8px 0 12px;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .sectionTitle::before {
        content: "";
        width: 14px;
        height: 2px;
        background: linear-gradient(90deg, var(--gold), var(--green-deep));
        border-radius: 2px;
      }
      table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        border: 1px solid var(--line);
        border-radius: 14px;
        overflow: hidden;
      }
      thead th {
        background: linear-gradient(180deg, #F4F8F0 0%, #E8F0E0 100%);
        color: var(--green-deep);
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.9px;
        text-align: left;
        padding: 11px 14px;
        border-bottom: 1px solid var(--line);
      }
      tbody td {
        padding: 12px 14px;
        font-size: 12.5px;
        color: var(--ink);
        border-bottom: 1px solid var(--line);
        vertical-align: top;
      }
      tbody tr:last-child td { border-bottom: 0; }
      tbody tr:nth-child(even) td { background: #FDFBF6; }
      .lineNo { color: var(--muted); width: 28px; font-weight: 700; }
      .lineNameMain { font-weight: 700; color: var(--ink); }
      .lineVariant { margin-top: 2px; font-size: 11px; color: var(--muted); font-style: italic; }
      .numCol { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
      .amountCol { font-weight: 700; color: var(--green-deep); }

      .summaryRow {
        display: grid;
        grid-template-columns: 1fr 320px;
        gap: 16px;
        margin-top: 20px;
      }
      .paymentBlock {
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 16px 18px;
        background: var(--paper);
      }
      .paymentBlock .label {
        font-size: 9.5px;
        font-weight: 700;
        letter-spacing: 1.3px;
        text-transform: uppercase;
        color: var(--green-deep);
        margin-bottom: 10px;
      }
      .paymentBlock .pmRow {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        margin-bottom: 5px;
        color: var(--ink-soft);
      }
      .paymentBlock .pmRow .key { color: var(--muted); }
      .paymentBlock .pmRow .val { font-weight: 700; color: var(--ink); font-variant-numeric: tabular-nums; }

      .totals {
        border: 1px solid rgba(36, 68, 36, 0.2);
        border-radius: 14px;
        background: linear-gradient(165deg, #FFFFFF 0%, var(--gold-soft) 100%);
        padding: 14px 16px 12px;
        box-shadow: 0 8px 20px rgba(30, 32, 24, 0.05);
      }
      .totals .ttRow {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        font-size: 12.5px;
        color: var(--ink-soft);
        margin-bottom: 8px;
      }
      .totals .ttRow .key { color: var(--muted); }
      .totals .ttRow .val { font-weight: 700; font-variant-numeric: tabular-nums; }
      .totals .ttRow.discount .val { color: var(--paid); }
      .totals .ttRow.grand {
        margin-top: 6px;
        padding-top: 12px;
        border-top: 1.5px dashed var(--line);
      }
      .totals .ttRow.grand .key {
        font-family: "Fraunces", Georgia, serif;
        font-weight: 700;
        font-size: 13px;
        color: var(--ink);
      }
      .totals .ttRow.grand .val {
        font-weight: 800;
        font-size: 22px;
        color: var(--green-deep);
        letter-spacing: -0.4px;
      }
      .amountWords {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px dashed var(--line);
        font-size: 11px;
        color: var(--muted);
        font-style: italic;
      }
      .note {
        margin-top: 18px;
        border: 1px solid var(--line);
        background: var(--cream);
        border-radius: 12px;
        padding: 12px 14px;
        font-size: 12px;
        color: var(--ink-soft);
        line-height: 1.55;
      }
      .footer {
        margin-top: 28px;
        padding-top: 16px;
        border-top: 1px solid var(--line);
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 16px;
      }
      .footer .thanks {
        font-family: "Fraunces", Georgia, serif;
        font-size: 15px;
        font-weight: 700;
        color: var(--ink);
      }
      .footer .small {
        font-size: 10.5px;
        color: var(--muted);
        line-height: 1.6;
        text-align: right;
      }
      .footer .small strong { color: var(--ink); }
      @media print {
        @page { size: A4; margin: 10mm; }
        body { padding: 0; background: #fff; }
        .sheet { box-shadow: none; border: 0; border-radius: 0; }
        .sheet::after { display: none; }
      }
      @media (max-width: 720px) {
        body { padding: 12px; }
        .letterhead { flex-direction: column; padding: 24px 20px 18px; }
        .invoiceCard { width: 100%; min-width: 0; }
        .body { padding: 20px; }
        .metaGrid { grid-template-columns: 1fr; }
        .summaryRow { grid-template-columns: 1fr; }
        .footer { flex-direction: column; align-items: flex-start; }
        .footer .small { text-align: left; }
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="letterhead">
        <div class="brandCol">
          <div class="wordmark">${htmlEscape(APP_DISPLAY_NAME)}<span class="gold">.</span></div>
          <div class="tagline">${htmlEscape(APP_TAGLINE)} &middot; ${htmlEscape(APP_WORDMARK_SUBLINE)}</div>
          <div class="hairline"></div>
          <div class="companyMeta">
            Crafted essentials, delivered with care.<br/>
            ${htmlEscape(SUPPORT_EMAIL_DISPLAY)}
          </div>
        </div>
        <div class="invoiceCard">
          <div class="invoiceTag">Tax Invoice</div>
          <div class="row">
            <span class="key">Invoice No.</span>
            <span class="invNumber">${htmlEscape(invoiceNumber)}</span>
          </div>
          <div class="row">
            <span class="key">Issue Date</span>
            <span class="val">${fmtDate(issueDate)}</span>
          </div>
          <div class="row">
            <span class="key">Due Date</span>
            <span class="val">${dueDate ? fmtDate(dueDate) : "On receipt"}</span>
          </div>
          <div class="row">
            <span class="key">Order Ref</span>
            <span class="val">#${htmlEscape(orderRef)}</span>
          </div>
          <div class="statusPill ${paymentBadge.tone}">${htmlEscape(paymentBadge.label)}</div>
        </div>
      </div>

      <div class="body">
        <div class="metaGrid">
          <div class="metaCard">
            <div class="label">Bill To</div>
            <div class="heading">${htmlEscape(order?.shippingAddress?.fullName || "Customer")}</div>
            <div class="line">${htmlEscape(order?.shippingAddress?.phone || "")}</div>
            <div class="line muted">${htmlEscape(order?.shippingAddress?.line1 || "")}</div>
            <div class="line muted">${htmlEscape(order?.shippingAddress?.city || "")}${order?.shippingAddress?.city && order?.shippingAddress?.state ? ", " : ""}${htmlEscape(order?.shippingAddress?.state || "")} ${htmlEscape(order?.shippingAddress?.postalCode || "")}</div>
            <div class="line muted">${htmlEscape(order?.shippingAddress?.country || "")}</div>
          </div>
          <div class="metaCard">
            <div class="label">Ship To</div>
            <div class="heading">Same as billing</div>
            <div class="line muted">Delivered to your selected address.</div>
            ${order?.shippingAddress?.note ? `<div class="line"><strong>Note:</strong> ${htmlEscape(order.shippingAddress.note)}</div>` : ""}
          </div>
          <div class="metaCard">
            <div class="label">Order</div>
            <div class="heading">${itemsCount} item${itemsCount === 1 ? "" : "s"}</div>
            <div class="line">Placed: ${fmtDateTime(order?.createdAt)}</div>
            <div class="line">Status: <strong>${htmlEscape(String(order?.status || "pending").replace(/_/g, " "))}</strong></div>
            <div class="line">Method: <strong>${htmlEscape(order?.paymentMethod || "Cash on Delivery")}</strong></div>
          </div>
        </div>

        <div class="sectionTitle">Invoice Items</div>
        <table>
          <thead>
            <tr>
              <th class="numCol" style="text-align:left;">#</th>
              <th>Product</th>
              <th class="numCol">Qty</th>
              <th class="numCol">Unit price</th>
              <th class="numCol">Amount</th>
            </tr>
          </thead>
          <tbody>${lineItems || `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:18px;">No items</td></tr>`}</tbody>
        </table>

        <div class="summaryRow">
          <div class="paymentBlock">
            <div class="label">Payment</div>
            <div class="pmRow"><span class="key">Method</span><span class="val">${htmlEscape(order?.paymentMethod || "Cash on Delivery")}</span></div>
            <div class="pmRow"><span class="key">Status</span><span class="val">${htmlEscape(formatPaymentStatusLabel(order?.paymentStatus))}</span></div>
            ${order?.razorpay?.paymentId ? `<div class="pmRow"><span class="key">Payment ID</span><span class="val">${htmlEscape(order.razorpay.paymentId)}</span></div>` : ""}
            ${order?.razorpay?.orderId ? `<div class="pmRow"><span class="key">Gateway order</span><span class="val">${htmlEscape(order.razorpay.orderId)}</span></div>` : ""}
            ${isPaid && order?.updatedAt ? `<div class="pmRow"><span class="key">Paid on</span><span class="val">${fmtDate(order.updatedAt)}</span></div>` : ""}
          </div>
          <div class="totals">
            <div class="ttRow"><span class="key">Items total</span><span class="val">${fmtInr(itemsTotal)}</span></div>
            <div class="ttRow"><span class="key">Delivery fee</span><span class="val">${fmtInr(deliveryFee)}</span></div>
            <div class="ttRow"><span class="key">Platform fee</span><span class="val">${fmtInr(platformFee)}</span></div>
            ${discountAmount > 0 ? `<div class="ttRow discount"><span class="key">Discount</span><span class="val">− ${fmtInr(discountAmount)}</span></div>` : ""}
            <div class="ttRow"><span class="key">Tax${taxRate > 0 ? ` (${taxRate}%)` : ""}</span><span class="val">${fmtInr(taxAmount)}</span></div>
            <div class="ttRow grand"><span class="key">Total payable</span><span class="val">${fmtInr(totalAmount)}</span></div>
            <div class="amountWords">${isPaid ? "Settled on the date noted above." : "Amount payable on or before the due date."}</div>
          </div>
        </div>

        ${order?.invoice?.notes ? `<div class="note"><strong>Invoice note:</strong> ${htmlEscape(order.invoice.notes)}</div>` : ""}

        <div class="footer">
          <div>
            <div class="thanks">Thank you for shopping with ${htmlEscape(APP_DISPLAY_NAME)}.</div>
            <div class="small">Questions? ${htmlEscape(SUPPORT_EMAIL_DISPLAY)}</div>
          </div>
          <div class="small">
            <strong>${htmlEscape(APP_DISPLAY_NAME)} &middot; Premium grocery</strong><br/>
            Computer-generated tax invoice &middot; No signature required.
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;
}
