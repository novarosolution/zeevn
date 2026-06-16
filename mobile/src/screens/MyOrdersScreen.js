import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View} from "react-native";
import SectionReveal from "../components/motion/SectionReveal";
import KankregScrollPage from "../components/kankreg/KankregScrollPage";

import BottomNavBar from "../components/BottomNavBar";
import AuthGateShell from "../components/AuthGateShell";
import CustomerScreenShell from "../components/CustomerScreenShell";
import { useAuth } from "../context/AuthContext";
import { useLiveSocket } from "../context/LiveSocketContext";
import { useOrderCelebration } from "../context/OrderCelebrationContext";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import {
  claimMyOrderRewardRequest,
  reorderMyOrderRequest,
  updateMyOrderAddressRequest} from "../services/orderService";
import { fetchMyOrders } from "../services/userService";
import {
  customerPanel,
  customerScrollFill} from "../theme/screenLayout";
import { getKankregChromeTop } from "../components/kankreg/KankregSiteHeader";
import { ALCHEMY } from "../theme/customerAlchemy";
import { FONT_HEADING, FONT_HEADING_SEMI, FONT_BODY_SEMIBOLD, FONT_PRICE } from "../theme/typographyRoles";
import { fonts, layout, lineHeight, radius, semanticRadius, spacing, typography } from "../theme/tokens";
import PremiumEmptyState from "../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../components/ui/PremiumErrorBanner";
import SkeletonBlock from "../components/ui/SkeletonBlock";
import PremiumButton from "../components/ui/PremiumButton";
import PremiumSectionHeader from "../components/ui/PremiumSectionHeader";
import {
  isCancelledOrder,
  isDeliveredOrder,
  ORDER_STATUSES_ALLOW_ADDRESS_EDIT} from "../utils/orderStatus";
import OrderListItem from "../components/orders/OrderListItem";
import OrdersPageSummary from "../components/orders/OrdersPageSummary";
import KankregOrdersFilterRow from "../components/kankreg/KankregOrdersFilterRow";
import KankregCustomerPageHeader from "../components/kankreg/KankregCustomerPageHeader";
import { FIGMA } from "../theme/figmaApp";
import { useKankregLayout } from "../theme/kankregBreakpoints";
import { MY_ORDERS_UI } from "../content/appContent";
import { getOrdersPageEyebrow } from "../utils/orderDisplay";

function formatPaymentStatusLabel(ps) {
  const s = String(ps || "pending").toLowerCase();
  if (s === "paid") return "Paid";
  if (s === "pending") return "Pending";
  if (s === "failed") return "Failed";
  if (s === "refunded") return "Refunded";
  return String(ps || "—");
}

function htmlEscape(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildInvoiceHtml(order) {
  const orderIdShort = String(order?._id || "").slice(-6).toUpperCase();
  const invoiceNumber =
    order?.invoice?.number ||
    `INV-${new Date(order?.createdAt || Date.now()).toISOString().slice(0, 10).replace(/-/g, "")}-${orderIdShort}`;
  const issueDate = order?.invoice?.issueDate || order?.createdAt;
  const dueDate = order?.invoice?.dueDate || "";
  const itemsTotal = Number(order?.priceBreakdown?.itemsTotal || 0);
  const deliveryFee = Number(order?.priceBreakdown?.deliveryFee || 0);
  const platformFee = Number(order?.priceBreakdown?.platformFee || 0);
  const discountAmount = Number(order?.priceBreakdown?.discountAmount || 0);
  const taxAmount = Number(order?.invoice?.taxAmount || 0);
  const totalAmount = Number(order?.totalPrice || 0);
  const fmt = (n) =>
    `&#8377; ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const paymentStatus = String(order?.paymentStatus || "").toLowerCase();
  const isPaid = paymentStatus === "paid";
  const isFailed = paymentStatus === "failed";
  const isRefunded = paymentStatus === "refunded";
  const paymentBadge = isPaid
    ? { label: "Paid in full", cls: "paid" }
    : isRefunded
      ? { label: "Refunded", cls: "refunded" }
      : isFailed
        ? { label: "Payment failed", cls: "failed" }
        : { label: "Payment pending", cls: "pending" };

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
          <td class="numCol">${fmt(price)}</td>
          <td class="numCol amountCol">${fmt(amount)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Zeevan Invoice ${htmlEscape(invoiceNumber)}</title>
        <style>
          :root {
            --gold: #C79A3A;
            --gold-bright: #E7C85A;
            --gold-deep: #8A5A12;
            --brown-ink: #2D1D0B;
            --ink: #1B1612;
            --muted: #6E6254;
            --soft: #FAF5EC;
            --line: #E7DCC8;
            --line-strong: #D7C8AC;
            --paper: #FFFEFC;
            --green: #15803D;
            --green-soft: #ECFDF3;
            --red: #B91C1C;
            --red-soft: #FEF2F2;
            --blue: #1E3A8A;
            --blue-soft: #EFF4FF;
          }
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; }
          body {
            background: radial-gradient(circle at 18% 8%, #FDF7EC 0%, #F8F4EC 42%, #F2EBE0 100%);
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
              0 30px 60px rgba(45, 29, 11, 0.12),
              0 8px 18px rgba(45, 29, 11, 0.06),
              inset 0 1px 0 rgba(255, 255, 255, 0.95);
          }
          .sheet::before {
            content: "";
            position: absolute;
            inset: 0 0 auto 0;
            height: 7px;
            background: linear-gradient(90deg, var(--gold-bright) 0%, var(--gold) 35%, var(--gold-deep) 100%);
          }
          .sheet::after {
            content: "Zeevan";
            position: absolute;
            right: 32px;
            bottom: 36px;
            font-family: "Fraunces_700Bold", Georgia, serif;
            font-size: 90px;
            font-weight: 800;
            color: rgba(138, 90, 18, 0.05);
            letter-spacing: -2px;
            line-height: 1;
            pointer-events: none;
            user-select: none;
          }
          .body { font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; }
          .letterhead {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 24px;
            padding: 32px 36px 22px;
            border-bottom: 1px solid var(--line);
            background: linear-gradient(180deg, #FFFFFF 0%, #FFFCF6 100%);
            position: relative;
          }
          .brandCol { max-width: 58%; }
          .wordmark {
            font-family: "Fraunces_700Bold", Georgia, serif;
            font-size: 36px;
            line-height: 1;
            font-weight: 800;
            color: var(--brown-ink);
            letter-spacing: -0.5px;
            display: flex;
            align-items: baseline;
            gap: 8px;
          }
          .wordmark .accent { color: var(--gold-deep); }
          .tagline {
            margin-top: 8px;
            font-size: 12px;
            color: var(--muted);
            letter-spacing: 0.4px;
            text-transform: uppercase;
            font-weight: 600;
            font-family: "Inter", sans-serif;
          }
          .hairline {
            margin-top: 14px;
            height: 2px;
            width: 84px;
            background: linear-gradient(90deg, var(--gold-bright), var(--gold-deep));
            border-radius: 2px;
          }
          .companyMeta {
            margin-top: 12px;
            font-size: 11.5px;
            color: var(--muted);
            line-height: 1.6;
            font-family: "Inter", sans-serif;
          }
          .invoiceCard {
            min-width: 240px;
            border: 1px solid var(--line);
            background: linear-gradient(180deg, #FFFEFC 0%, #FFF7E5 100%);
            border-radius: 14px;
            padding: 16px 18px;
            font-family: "Inter", sans-serif;
          }
          .invoiceTag {
            display: inline-block;
            background: var(--soft);
            color: var(--gold-deep);
            border: 1px solid var(--line-strong);
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 10.5px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            margin-bottom: 12px;
          }
          .invoiceCard .row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            font-size: 12px;
            margin-bottom: 6px;
            color: #2A2620;
          }
          .invoiceCard .row:last-child { margin-bottom: 0; }
          .invoiceCard .key {
            color: var(--muted);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 10px;
          }
          .invoiceCard .val {
            font-weight: 700;
            font-family: "Inter", sans-serif;
            color: var(--brown-ink);
          }
          .invoiceCard .invNumber {
            font-family: "Fraunces_700Bold", Georgia, serif;
            font-size: 18px;
            font-weight: 800;
            letter-spacing: -0.3px;
            color: var(--brown-ink);
          }
          .statusPill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-top: 10px;
            padding: 5px 12px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.4px;
            text-transform: uppercase;
            border: 1px solid var(--line-strong);
          }
          .statusPill::before {
            content: "";
            width: 7px;
            height: 7px;
            border-radius: 999px;
            background: currentColor;
            display: inline-block;
          }
          .statusPill.paid     { background: var(--green-soft); color: var(--green); border-color: rgba(21, 128, 61, 0.28); }
          .statusPill.pending  { background: var(--soft); color: var(--gold-deep); }
          .statusPill.failed   { background: var(--red-soft); color: var(--red); border-color: rgba(185, 28, 28, 0.28); }
          .statusPill.refunded { background: var(--blue-soft); color: var(--blue); border-color: rgba(30, 58, 138, 0.24); }

          .body {
            padding: 26px 36px 36px;
          }
          .metaGrid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 14px;
            margin-bottom: 24px;
          }
          .metaCard {
            border: 1px solid var(--line);
            background: var(--paper);
            border-radius: 14px;
            padding: 16px 16px 14px;
            position: relative;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.9);
          }
          .metaCard .label {
            font-family: "Inter", sans-serif;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 1.4px;
            text-transform: uppercase;
            color: var(--gold-deep);
            margin-bottom: 8px;
          }
          .metaCard .heading {
            font-family: "Fraunces_700Bold", Georgia, serif;
            font-size: 16px;
            font-weight: 800;
            color: var(--brown-ink);
            margin-bottom: 6px;
            letter-spacing: -0.2px;
          }
          .metaCard .line {
            font-size: 12px;
            color: #36302A;
            margin-bottom: 3px;
            line-height: 1.6;
          }
          .metaCard .line.muted { color: var(--muted); }

          .sectionTitle {
            font-family: "Fraunces_700Bold", Georgia, serif;
            font-size: 17px;
            font-weight: 800;
            color: var(--brown-ink);
            margin: 8px 0 12px;
            letter-spacing: -0.2px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .sectionTitle::before {
            content: "";
            width: 14px;
            height: 2px;
            background: linear-gradient(90deg, var(--gold-bright), var(--gold-deep));
            border-radius: 2px;
          }
          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            border: 1px solid var(--line);
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 6px 14px rgba(45, 29, 11, 0.04);
          }
          thead th {
            background: linear-gradient(180deg, #FCF6E8 0%, #F8EFD8 100%);
            color: var(--gold-deep);
            font-family: "Inter", sans-serif;
            font-size: 10.5px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-align: left;
            padding: 11px 14px;
            border-bottom: 1px solid var(--line-strong);
          }
          tbody td {
            padding: 12px 14px;
            font-size: 12.5px;
            color: var(--ink);
            border-bottom: 1px solid var(--line);
            vertical-align: top;
            font-family: "Inter", sans-serif;
          }
          tbody tr:last-child td { border-bottom: 0; }
          tbody tr:nth-child(even) td { background: #FFFCF5; }
          .lineNo { color: var(--muted); width: 28px; font-weight: 700; }
          .lineNameMain { font-weight: 700; color: var(--brown-ink); }
          .lineVariant {
            margin-top: 2px;
            font-size: 11px;
            color: var(--muted);
            font-style: italic;
          }
          .numCol { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
          .amountCol { font-weight: 700; color: var(--brown-ink); }

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
            font-family: "Inter", sans-serif;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 1.4px;
            text-transform: uppercase;
            color: var(--gold-deep);
            margin-bottom: 10px;
          }
          .paymentBlock .pmRow {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            margin-bottom: 5px;
            color: #36302A;
            font-family: "Inter", sans-serif;
          }
          .paymentBlock .pmRow .key { color: var(--muted); }
          .paymentBlock .pmRow .val { font-weight: 700; color: var(--brown-ink); font-variant-numeric: tabular-nums; }

          .totals {
            border: 1px solid var(--line-strong);
            border-radius: 14px;
            background: linear-gradient(180deg, #FFFFFF 0%, #FFF7E5 100%);
            padding: 14px 16px 12px;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.95), 0 8px 20px rgba(45, 29, 11, 0.05);
          }
          .totals .ttRow {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            font-size: 12.5px;
            color: #2D2620;
            margin-bottom: 8px;
            font-family: "Inter", sans-serif;
          }
          .totals .ttRow .key { color: var(--muted); }
          .totals .ttRow .val { font-weight: 700; font-variant-numeric: tabular-nums; }
          .totals .ttRow.discount .val { color: var(--green); }
          .totals .ttRow.grand {
            margin-top: 6px;
            padding-top: 12px;
            border-top: 1.5px dashed var(--line-strong);
          }
          .totals .ttRow.grand .key {
            font-family: "Fraunces_700Bold", Georgia, serif;
            font-weight: 800;
            font-size: 14px;
            color: var(--brown-ink);
            letter-spacing: -0.2px;
          }
          .totals .ttRow.grand .val {
            font-family: "Hanken Grotesk", "Inter", sans-serif;
            font-weight: 800;
            font-size: 22px;
            color: var(--brown-ink);
            letter-spacing: -0.5px;
          }
          .amountWords {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px dashed var(--line);
            font-size: 11px;
            color: var(--muted);
            font-style: italic;
            font-family: "Inter", sans-serif;
          }
          .note {
            margin-top: 18px;
            border: 1px solid var(--line-strong);
            background: var(--soft);
            border-radius: 12px;
            padding: 12px 14px;
            font-size: 12px;
            color: #4A3F2E;
            font-family: "Inter", sans-serif;
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
            font-family: "Inter", sans-serif;
          }
          .footer .thanks {
            font-family: "Fraunces_700Bold", Georgia, serif;
            font-size: 16px;
            font-weight: 800;
            color: var(--brown-ink);
            letter-spacing: -0.2px;
          }
          .footer .small {
            font-size: 10.5px;
            color: var(--muted);
            line-height: 1.6;
            text-align: right;
          }
          .footer .small strong { color: var(--brown-ink); }
          @media print {
            body { padding: 0; background: #ffffff; }
            .sheet { box-shadow: none; border: 0; border-radius: 0; }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="letterhead">
            <div class="brandCol">
              <div class="wordmark">Kankre<span class="accent">G</span></div>
              <div class="tagline">Premium Grocery &middot; Heritage Quality</div>
              <div class="hairline"></div>
              <div class="companyMeta">
                Crafted essentials, delivered with care.<br/>
                support@zeevan.com
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
                <span class="val">${issueDate ? new Date(issueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "&mdash;"}</span>
              </div>
              <div class="row">
                <span class="key">Due Date</span>
                <span class="val">${dueDate ? new Date(dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "On receipt"}</span>
              </div>
              <div class="row">
                <span class="key">Order Ref</span>
                <span class="val">#${htmlEscape(orderIdShort)}</span>
              </div>
              <div class="statusPill ${paymentBadge.cls}">${paymentBadge.label}</div>
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
                <div class="line muted">Express delivery within delivery window.</div>
                ${order?.shippingAddress?.note ? `<div class="line"><strong>Note:</strong> ${htmlEscape(order.shippingAddress.note)}</div>` : ""}
              </div>
              <div class="metaCard">
                <div class="label">Order</div>
                <div class="heading">${itemsCount} item${itemsCount === 1 ? "" : "s"}</div>
                <div class="line">Placed: ${order?.createdAt ? new Date(order.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "&mdash;"}</div>
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
              <tbody>${lineItems || `<tr><td colspan="5" style="text-align:center; color: var(--muted); padding: 18px;">No items</td></tr>`}</tbody>
            </table>

            <div class="summaryRow">
              <div class="paymentBlock">
                <div class="label">Payment</div>
                <div class="pmRow"><span class="key">Method</span><span class="val">${htmlEscape(order?.paymentMethod || "Cash on Delivery")}</span></div>
                <div class="pmRow"><span class="key">Status</span><span class="val">${htmlEscape(formatPaymentStatusLabel(order?.paymentStatus))}</span></div>
                ${order?.razorpay?.paymentId ? `<div class="pmRow"><span class="key">Payment ID</span><span class="val">${htmlEscape(order.razorpay.paymentId)}</span></div>` : ""}
                ${order?.razorpay?.orderId ? `<div class="pmRow"><span class="key">Order ID</span><span class="val">${htmlEscape(order.razorpay.orderId)}</span></div>` : ""}
                ${isPaid && order?.updatedAt ? `<div class="pmRow"><span class="key">Paid on</span><span class="val">${new Date(order.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span></div>` : ""}
              </div>
              <div class="totals">
                <div class="ttRow"><span class="key">Items total</span><span class="val">${fmt(itemsTotal)}</span></div>
                <div class="ttRow"><span class="key">Delivery fee</span><span class="val">${fmt(deliveryFee)}</span></div>
                <div class="ttRow"><span class="key">Platform fee</span><span class="val">${fmt(platformFee)}</span></div>
                ${discountAmount > 0 ? `<div class="ttRow discount"><span class="key">Discount</span><span class="val">- ${fmt(discountAmount)}</span></div>` : ""}
                <div class="ttRow"><span class="key">Tax</span><span class="val">${fmt(taxAmount)}</span></div>
                <div class="ttRow grand"><span class="key">Total payable</span><span class="val">${fmt(totalAmount)}</span></div>
                <div class="amountWords">${isPaid ? "Settled on the date noted above." : "Amount payable on or before the due date."}</div>
              </div>
            </div>

            ${
              order?.invoice?.notes
                ? `<div class="note"><strong>Invoice note:</strong> ${htmlEscape(order.invoice.notes)}</div>`
                : ""
            }

            <div class="footer">
              <div>
                <div class="thanks">Thank you for shopping with Zeevan.</div>
                <div class="small">For any queries, write to us at support@zeevan.com.</div>
              </div>
              <div class="small">
                <strong>Zeevan &middot; Premium grocery</strong><br/>
                GSTIN: <em>placeholder</em> &middot; PAN: <em>placeholder</em><br/>
                This is a computer-generated invoice.
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function printInvoiceOnWeb(html) {
  if (typeof window === "undefined") {
    throw new Error("Web print is not available in this environment.");
  }

  const popup = window.open("", "_blank", "width=980,height=760");
  if (!popup) {
    throw new Error("Popup blocked by browser. Allow popups to download invoice.");
  }

  const invoiceDoc = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice PDF</title>
        <style>
          @page { size: A4; margin: 10mm; }
          html, body { margin: 0; padding: 0; background: #ffffff; }
        </style>
      </head>
      <body>
        ${html}
        <script>
          window.onload = function () {
            setTimeout(function () {
              window.focus();
              window.print();
            }, 220);
          };
        </script>
      </body>
    </html>
  `;

  popup.document.open();
  popup.document.write(invoiceDoc);
  popup.document.close();
}

export default function MyOrdersScreen({ navigation, route }) {
  const { colors: c, shadowPremium, isDark } = useTheme();
    const { useSplitLayout, isXs } = useKankregLayout();
  const isWide = useSplitLayout;
  const isPhoneCompact = isXs;
  const styles = useMemo(
    () => createMyOrdersStyles(c, shadowPremium, isDark, { isWide, isPhoneCompact }),
    [c, shadowPremium, isDark, isWide, isPhoneCompact]
  );
  const [filter, setFilter] = useState("all");
  const { isAuthenticated, token, user, isAuthLoading, refreshProfile } = useAuth();
  const { refreshCartFromServer } = useCart();
  const { seedOrderStatuses } = useOrderCelebration();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [orders, setOrders] = useState([]);
  const [reorderingOrderId, setReorderingOrderId] = useState("");
  const [claimingRewardOrderId, setClaimingRewardOrderId] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState("");
  const [editingOrderId, setEditingOrderId] = useState("");
  const [savingOrderId, setSavingOrderId] = useState("");
  const [downloadingOrderId, setDownloadingOrderId] = useState("");
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    note: ""});
  const routeInitialFilter = route?.params?.initialFilter;

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      navigation.navigate("Login");
    }
  }, [isAuthLoading, isAuthenticated, navigation]);

  const loadOrders = useCallback(async (opts = {}) => {
    const { silent } = opts;
    try {
      if (!silent) setLoading(true);
      setError("");
      const data = await fetchMyOrders(token);
      const list = Array.isArray(data) ? data : [];
      setOrders(list);
      seedOrderStatuses(list);
    } catch (err) {
      setError(err.message || "Unable to load orders.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token, seedOrderStatuses]);

  const onPullRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadOrders({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadOrders]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return;
    loadOrders();
  }, [isAuthLoading, isAuthenticated, loadOrders]);

  const { on: onLiveEvent } = useLiveSocket();
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    return onLiveEvent("orders:updated", ({ order }) => {
      if (!order?._id) return;
      const orderId = String(order._id);
      setOrders((prev) => {
        const idx = prev.findIndex((item) => String(item._id) === orderId);
        if (idx < 0) return [order, ...prev];
        const next = [...prev];
        next[idx] = { ...next[idx], ...order };
        return next;
      });
    });
  }, [isAuthenticated, onLiveEvent]);

  useEffect(() => {
    if (!routeInitialFilter) return;
    const allowedFilters = new Set(["all", "active", "delivered", "cancelled"]);
    if (allowedFilters.has(routeInitialFilter)) {
      setFilter(routeInitialFilter);
    }
  }, [routeInitialFilter]);

  const orderStats = useMemo(() => {
    const total = orders.length;
    let inFlight = 0;
    let delivered = 0;
    let totalSpent = 0;
    orders.forEach((order) => {
      const status = String(order?.status || "");
      if (isDeliveredOrder(status)) delivered += 1;
      else if (!isCancelledOrder(status)) inFlight += 1;
      totalSpent += Number(order?.totalPrice || 0);
    });
    return { total, inFlight, delivered, totalSpent: Math.round(totalSpent) };
  }, [orders]);

  const { activeOrders, historyOrders, visibleOrders } = useMemo(() => {
    const active = [];
    const history = [];
    orders.forEach((order) => {
      const status = String(order?.status || "");
      if (isDeliveredOrder(status) || isCancelledOrder(status)) history.push(order);
      else active.push(order);
    });
    let visible = orders;
    if (filter === "active") visible = active;
    else if (filter === "delivered") visible = history.filter((order) => isDeliveredOrder(order?.status));
    else if (filter === "cancelled") visible = history.filter((order) => isCancelledOrder(order?.status));
    return { activeOrders: active, historyOrders: history, visibleOrders: visible };
  }, [orders, filter]);
  const visibleOrderViewModels = useMemo(
    () =>
      visibleOrders.map((order) => ({
        ...order,
        _shortId: String(order?._id || "").slice(-6).toUpperCase(),
        _createdAtLabel: order?.createdAt ? new Date(order.createdAt).toLocaleString() : "",
        _lineCount: (order?.products || []).length,
        _itemCount: (order?.products || []).reduce((sum, p) => sum + Number(p.quantity || 0), 0)})),
    [visibleOrders]
  );
  const activeOrderViewModels = useMemo(
    () =>
      activeOrders.map((order) => ({
        ...order,
        _shortId: String(order?._id || "").slice(-6).toUpperCase(),
        _createdAtLabel: order?.createdAt ? new Date(order.createdAt).toLocaleString() : "",
        _lineCount: (order?.products || []).length,
        _itemCount: (order?.products || []).reduce((sum, p) => sum + Number(p.quantity || 0), 0),
      })),
    [activeOrders]
  );
  const historyOrderViewModels = useMemo(
    () =>
      historyOrders.map((order) => ({
        ...order,
        _shortId: String(order?._id || "").slice(-6).toUpperCase(),
        _createdAtLabel: order?.createdAt ? new Date(order.createdAt).toLocaleString() : "",
        _lineCount: (order?.products || []).length,
        _itemCount: (order?.products || []).reduce((sum, p) => sum + Number(p.quantity || 0), 0)})),
    [historyOrders]
  );
  const [renderCount, setRenderCount] = useState(20);
  const useSectionedList = filter === "all";

  useEffect(() => {
    setRenderCount(20);
  }, [filter]);

  const statsActive = !loading && orders.length > 0;

  const filterCounts = useMemo(
    () => ({
      all: orders.length,
      active: activeOrders.length,
      delivered: orderStats.delivered,
      cancelled: Math.max(0, orders.length - orderStats.delivered - activeOrders.length),
    }),
    [orders.length, activeOrders.length, orderStats.delivered]
  );

  const pageEyebrow = getOrdersPageEyebrow(activeOrders.length);

  const handleReorder = async (orderId) => {
    try {
      setReorderingOrderId(orderId);
      setError("");
      setSuccess("");
      const result = await reorderMyOrderRequest(token, orderId);
      await refreshCartFromServer();
      setSuccess(result.message || "Reorder added to cart.");
      navigation.navigate("Cart");
    } catch (err) {
      setError(err.message || "Unable to reorder.");
    } finally {
      setReorderingOrderId("");
    }
  };

  const canEditAddress = (order) => {
    if (!order) return false;
    if (!ORDER_STATUSES_ALLOW_ADDRESS_EDIT.includes(order.status)) return false;
    const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
    return elapsedMs <= 5 * 60 * 1000;
  };

  const openEditAddress = (order) => {
    setEditingOrderId(order._id);
    setAddressForm({
      fullName: order.shippingAddress?.fullName || "",
      phone: order.shippingAddress?.phone || "",
      line1: order.shippingAddress?.line1 || "",
      city: order.shippingAddress?.city || "",
      state: order.shippingAddress?.state || "",
      postalCode: order.shippingAddress?.postalCode || "",
      country: order.shippingAddress?.country || "",
      note: order.shippingAddress?.note || ""});
  };

  const handleSaveAddress = async (orderId) => {
    try {
      setSavingOrderId(orderId);
      setError("");
      setSuccess("");
      await updateMyOrderAddressRequest(token, orderId, addressForm);
      setSuccess("Order address updated successfully.");
      setEditingOrderId("");
      await loadOrders();
    } catch (err) {
      setError(err.message || "Unable to update order address.");
    } finally {
      setSavingOrderId("");
    }
  };

  const handleDownloadInvoice = async (order) => {
    try {
      setDownloadingOrderId(order._id);
      setError("");
      setSuccess("");
      const html = buildInvoiceHtml(order);
      if (Platform.OS === "web") {
        printInvoiceOnWeb(html);
        setSuccess('Invoice opened. Choose "Save as PDF" in the print dialog.');
        return;
      }

      const Print = await import("expo-print");
      const Sharing = await import("expo-sharing");
      const file = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          UTI: ".pdf",
          mimeType: "application/pdf"});
        setSuccess("Invoice PDF is ready.");
      } else {
        setSuccess("Invoice PDF generated on device.");
      }
    } catch (err) {
      setError(err.message || "Unable to generate invoice PDF.");
    } finally {
      setDownloadingOrderId("");
    }
  };

  const handleClaimReward = async (orderId) => {
    if (!orderId || claimingRewardOrderId) return;
    try {
      setClaimingRewardOrderId(orderId);
      setError("");
      setSuccess("");
      const result = await claimMyOrderRewardRequest(token, orderId);
      setSuccess(result?.message || "Reward claimed successfully.");
      setOrders((current) =>
        current.map((order) => (order._id === orderId ? result?.order || order : order))
      );
      await refreshProfile({ force: true });
    } catch (err) {
      setError(err.message || "Unable to claim reward.");
    } finally {
      setClaimingRewardOrderId("");
    }
  };

  const handleAddressChange = useCallback((key, value) => {
    setAddressForm((current) => ({ ...current, [key]: value }));
  }, []);

  const renderOrderCard = (item, _idx, compact = false) => (
    <OrderListItem
      key={item._id}
      order={item}
      compact={compact}
      expanded={expandedOrderId === item._id}
      editing={editingOrderId === item._id}
      addressForm={addressForm}
      onAddressChange={handleAddressChange}
      onToggleDetails={() => setExpandedOrderId((current) => (current === item._id ? "" : item._id))}
      onOpenEditAddress={() => openEditAddress(item)}
      onSaveAddress={() => handleSaveAddress(item._id)}
      onCancelEdit={() => setEditingOrderId("")}
      onDownloadInvoice={() => handleDownloadInvoice(item)}
      onClaimReward={() => handleClaimReward(item._id)}
      onReorder={() => handleReorder(item._id)}
      canEditAddress={canEditAddress(item)}
      downloading={downloadingOrderId === item._id}
      claimingReward={claimingRewardOrderId === item._id}
      saving={savingOrderId === item._id}
      reordering={reorderingOrderId === item._id}
      token={token}
      user={user}
      onRefreshOrders={loadOrders}
    />
  );

  if (isAuthLoading) {
    return <AuthGateShell navigation={navigation} />;
  }
  if (!isAuthenticated) {
    return <AuthGateShell signedOut navigation={navigation} />;
  }

  return (
    <CustomerScreenShell style={styles.screen}>
      <KeyboardAvoidingView
        style={customerScrollFill}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <KankregScrollPage
        scrollVariant="inner"
        style={customerScrollFill}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          Platform.OS === "web" ? undefined : (
            <RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} tintColor={c.primary} colors={[c.primary]} />
          )
        }
      >
        <KankregCustomerPageHeader
          eyebrow={pageEyebrow}
          title={MY_ORDERS_UI.pageTitle}
          subtitle={MY_ORDERS_UI.pageSubtitle}
          navigation={navigation}
          showBack={false}
          figmaOnWeb
          right={
            <PremiumButton
              label={MY_ORDERS_UI.refresh}
              iconLeft="refresh-outline"
              size="sm"
              variant="ghost"
              onPress={loadOrders}
            />
          }
        />
        {error ? (
          <View style={styles.flashBar}>
            <PremiumErrorBanner severity="error" message={error} onClose={() => setError("")} />
          </View>
        ) : null}
        {success ? (
          <View style={styles.flashBar}>
            <PremiumErrorBanner severity="success" message={success} onClose={() => setSuccess("")} />
          </View>
        ) : null}

        {!loading && orders.length > 0 ? (
          <SectionReveal preset="fade-up" delay={60}>
            <OrdersPageSummary stats={orderStats} active={statsActive} />
          </SectionReveal>
        ) : null}

        {loading ? (
          <View style={styles.loaderWrap}>
            <View style={styles.loadingStatsRow}>
              <SkeletonBlock width={isPhoneCompact ? "48%" : "24%"} height={84} rounded="xl" />
              <SkeletonBlock width={isPhoneCompact ? "48%" : "24%"} height={84} rounded="xl" />
              <SkeletonBlock width={isPhoneCompact ? "48%" : "24%"} height={84} rounded="xl" />
              <SkeletonBlock width={isPhoneCompact ? "48%" : "24%"} height={84} rounded="xl" />
            </View>
            <View style={styles.loadingChipsRow}>
              <SkeletonBlock width={72} height={32} rounded="pill" />
              <SkeletonBlock width={84} height={32} rounded="pill" />
              <SkeletonBlock width={102} height={32} rounded="pill" />
              <SkeletonBlock width={104} height={32} rounded="pill" />
            </View>
            <SkeletonBlock width="100%" height={140} rounded="xl" />
            <SkeletonBlock width="100%" height={140} rounded="xl" />
            <SkeletonBlock width="100%" height={140} rounded="xl" />
          </View>
        ) : orders.length === 0 ? (
          <View style={[styles.panel, styles.emptyPanel]}>
            <PremiumEmptyState
                iconName="cube-outline"
                title={MY_ORDERS_UI.emptyTitle}
                description={MY_ORDERS_UI.emptyDescription}
                ctaLabel={MY_ORDERS_UI.emptyCta}
                ctaIconLeft="storefront-outline"
                onCtaPress={() => navigation.navigate("Home")}
              />
          </View>
        ) : (
          <>
          <KankregOrdersFilterRow selected={filter} onSelect={setFilter} counts={filterCounts} />

          {useSectionedList ? (
            <>
              {activeOrderViewModels.length > 0 ? (
                <>
                  <View style={styles.sectionHeaderWrap}>
                    <PremiumSectionHeader
                      compact
                      overline={MY_ORDERS_UI.sectionActiveOverline}
                      title={MY_ORDERS_UI.sectionActive}
                      subtitle={MY_ORDERS_UI.sectionActiveSubtitle}
                      count={activeOrderViewModels.length}
                    />
                  </View>
                  {activeOrderViewModels.map((item, idx) => renderOrderCard(item, idx, false))}
                </>
              ) : null}

              {historyOrderViewModels.length > 0 ? (
                <>
                  <View style={[styles.sectionHeaderWrap, styles.sectionHeaderHistory]}>
                    <PremiumSectionHeader
                      compact
                      overline={MY_ORDERS_UI.sectionHistoryOverline}
                      title={MY_ORDERS_UI.sectionHistory}
                      subtitle={MY_ORDERS_UI.sectionHistorySubtitle}
                      count={historyOrderViewModels.length}
                    />
                  </View>
                  {historyOrderViewModels.slice(0, renderCount).map((item, idx) =>
                    renderOrderCard(item, idx + activeOrderViewModels.length, true)
                  )}
                </>
              ) : null}

              {historyOrderViewModels.length > renderCount ? (
                <View style={styles.loadMoreWrap}>
                  <PremiumButton
                    label={MY_ORDERS_UI.loadMore}
                    variant="subtle"
                    size="md"
                    onPress={() => setRenderCount((prev) => prev + 20)}
                    fullWidth
                  />
                </View>
              ) : null}
            </>
          ) : (
            <>
              {visibleOrderViewModels.slice(0, renderCount).map((item, idx) =>
                renderOrderCard(
                  item,
                  idx,
                  filter === "delivered" || filter === "cancelled" || isDeliveredOrder(item.status) || isCancelledOrder(item.status)
                )
              )}
              {visibleOrderViewModels.length > renderCount ? (
                <View style={styles.loadMoreWrap}>
                  <PremiumButton
                    label={MY_ORDERS_UI.loadMore}
                    variant="subtle"
                    size="md"
                    onPress={() => setRenderCount((prev) => prev + 20)}
                    fullWidth
                  />
                </View>
              ) : null}
            </>
          )}
          </>
        )}
</KankregScrollPage>
      </KeyboardAvoidingView>
      <BottomNavBar />
    </CustomerScreenShell>
  );
}

function createMyOrdersStyles(c, shadowPremium, isDark, layoutFlags = {}) {
  const { isPhoneCompact = false } = layoutFlags;
  const outlineBorder = isDark ? c.border : ALCHEMY.pillInactive;
  return StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    maxWidth: Platform.select({ web: layout.maxContentWidth + 96, default: "100%" })},
  headerRefreshBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"},
  flashBar: {
    marginBottom: spacing.md},
  sectionHeaderWrap: {
    paddingHorizontal: FIGMA.gutter,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionHeaderHistory: {
    marginTop: spacing.lg,
  },
  loadMoreWrap: {
    paddingHorizontal: FIGMA.gutter,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  nativeOrderPanel: {
    marginHorizontal: FIGMA.gutter,
    backgroundColor: isDark ? c.surface : FIGMA.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? c.border : FIGMA.line,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  nativeFigmaOrderCard: {
    marginBottom: 10,
  },
  figmaOrderTotal: {
    fontFamily: fonts.bold,
    fontSize: 18,
    marginTop: 10,
  },
  figmaRowButtons: {
    marginTop: 8,
  },
  filterChipBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.md,
    ...Platform.select({
      web: {
        position: "sticky",
        top: getKankregChromeTop() + 12,
        zIndex: 10,
        backdropFilter: "saturate(140%) blur(8px)",
        paddingVertical: spacing.xs},
      default: {}})},
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg},
  statsGridStack: {
    flexDirection: "column",
  },
  statsGridCell: {
    flexBasis: 0,
    flexGrow: 1,
    minWidth: isPhoneCompact ? 0 : 220,
    width: isPhoneCompact ? "100%" : undefined},
  statsGridCellFull: {
    width: "100%",
    maxWidth: "100%",
  },
  loadingStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
    justifyContent: isPhoneCompact ? "space-between" : "flex-start"},
  loadingChipsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md},
  inFlightSection: {
    marginBottom: spacing.lg},
  inFlightRailContent: {
    gap: spacing.sm,
    paddingRight: spacing.md},
  inFlightCard: {
    width: 220,
    padding: spacing.md,
    borderRadius: semanticRadius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? c.border : ALCHEMY.pillInactive,
    backgroundColor: isDark ? c.surface : ALCHEMY.cardBg,
    gap: 6,
    ...Platform.select({
      web: { scrollSnapAlign: "start" },
      default: {}})},
  inFlightCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs},
  inFlightCardKicker: {
    fontSize: typography.overline,
    fontFamily: fonts.bold,
    letterSpacing: 0.8,
    color: c.textMuted,
    textTransform: "uppercase"},
  inFlightCardId: {
    fontFamily: FONT_BODY_SEMIBOLD,
    fontSize: typography.h3,
    color: c.textPrimary,
    letterSpacing: -0.4},
  inFlightCardAmount: {
    fontFamily: fonts.extrabold,
    fontSize: typography.body,
    color: c.textPrimary},
  inFlightCardMeta: {
    fontSize: typography.caption,
    fontFamily: fonts.medium,
    color: c.textMuted},
  historyHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.sm},
  historyHeaderTitle: {
    flex: 1,
    minWidth: 0},
  historyToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isDark ? c.surface : ALCHEMY.cardBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? c.border : ALCHEMY.pillInactive},
  panel: {
    ...customerPanel(c, shadowPremium, isDark),
    marginBottom: spacing.lg,
    overflow: "hidden",
    borderLeftWidth: 3,
    borderLeftColor: isDark ? c.primaryBorder : ALCHEMY.gold},
  emptyPanel: {
    padding: 0,
    overflow: "hidden"},
  emptyGradient: {
    padding: spacing.xl + 4,
    alignItems: "center",
    borderRadius: semanticRadius.panel},
  emptyIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.65)"},
  emptyCta: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: semanticRadius.full,
    borderWidth: 1},
  emptyCtaText: {
    fontFamily: fonts.bold,
    fontSize: typography.bodySmall},
  emptyTitleLight: {
    fontFamily: FONT_HEADING,
    color: ALCHEMY.brown},
  orderCardHeaderCompact: {
    flexDirection: "column",
    gap: spacing.sm,
  },
  orderCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    flexWrap: isPhoneCompact ? "wrap" : "nowrap",
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: isDark ? c.border : ALCHEMY.line},
  orderKicker: {
    fontSize: typography.overline,
    fontFamily: fonts.bold,
    letterSpacing: 1,
    color: c.textMuted,
    textTransform: "uppercase",
    marginBottom: 2},
  placedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.xs},
  trackShell: {
    borderRadius: semanticRadius.card,
    overflow: "hidden",
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? c.border : ALCHEMY.pillInactive,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.25 : 0.08,
        shadowRadius: 12},
      android: { elevation: isDark ? 3 : 2 },
      default: {}})},
  trackShellCancelled: {
    borderColor: isDark ? "rgba(248,113,113,0.35)" : "rgba(220,38,38,0.25)",
    backgroundColor: isDark ? "rgba(127,29,29,0.12)" : "rgba(254,242,242,0.85)"},
  trackCancelledInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md + 4},
  trackCancelledIcon: {
    width: 48,
    height: 48,
    borderRadius: semanticRadius.control,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isDark ? c.surface : "#fff"},
  trackCancelledText: {
    flex: 1,
    minWidth: 0},
  trackCancelledTitle: {
    fontFamily: FONT_HEADING_SEMI,
    fontSize: typography.body,
    color: c.textPrimary},
  trackCancelledSub: {
    marginTop: 4,
    fontSize: typography.caption,
    color: c.textSecondary,
    lineHeight: lineHeight.caption,
    fontFamily: fonts.regular},
  trackGradient: {
    paddingBottom: spacing.sm},
  trackGoldLine: {
    height: 2,
    width: "100%",
    opacity: 0.9},
  trackHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm},
  trackHeadLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
    minWidth: 0},
  trackHeadTitle: {
    fontFamily: FONT_HEADING_SEMI,
    fontSize: typography.body,
    color: "#f8fafc"},
  trackHeadTitleLight: {
    color: ALCHEMY.brown,
    fontFamily: FONT_HEADING},
  trackHeadSub: {
    marginTop: 2,
    fontSize: typography.caption,
    color: isDark ? "rgba(248,250,252,0.72)" : ALCHEMY.brownMuted,
    fontFamily: fonts.medium},
  trackPctPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: semanticRadius.full,
    borderWidth: 1},
  trackPctText: {
    fontFamily: fonts.extrabold,
    fontSize: typography.caption},
  trackList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm},
  trackRow: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 48},
  trackLeftCol: {
    width: 32,
    alignItems: "center"},
  trackDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: c.border,
    backgroundColor: c.surface,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: c.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0},
      default: {}})},
  trackDotUpcoming: {
    backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt,
    borderColor: isDark ? c.border : ALCHEMY.pillInactive},
  trackDotDone: {
    borderColor: c.secondary,
    backgroundColor: c.secondary},
  trackDotCurrent: {
    borderColor: c.primary,
    backgroundColor: c.primarySoft,
    ...Platform.select({
      ios: {
        shadowColor: c.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 6},
      default: {}})},
  trackBarWrap: {
    width: 2,
    flex: 1,
    alignItems: "center",
    marginVertical: 2,
    minHeight: 12},
  trackBar: {
    width: 2,
    flex: 1,
    borderRadius: 1,
    backgroundColor: c.border,
    minHeight: 8},
  trackBarMuted: {
    backgroundColor: isDark ? "rgba(148,163,184,0.25)" : "rgba(22, 69, 51, 0.12)"},
  trackBarDone: {
    backgroundColor: c.secondary},
  trackTextCol: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingBottom: spacing.sm,
    justifyContent: "center"},
  trackTitle: {
    fontFamily: fonts.semibold,
    fontSize: typography.bodySmall,
    color: c.textMuted},
  trackTitleDone: {
    color: c.textSecondary},
  trackTitleCurrent: {
    color: c.textPrimary,
    fontFamily: FONT_HEADING_SEMI,
    fontSize: typography.body},
  trackSub: {
    fontSize: typography.caption,
    color: c.textMuted,
    marginTop: 2,
    fontFamily: fonts.regular,
    lineHeight: lineHeight.caption},
  trackSubCurrent: {
    color: c.textSecondary,
    fontFamily: fonts.medium},
  hintCallout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: semanticRadius.control,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt},
  hintCalloutProgress: {
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft},
  hintCalloutSuccess: {
    borderColor: c.secondaryBorder,
    backgroundColor: c.secondarySoft},
  hintCalloutDanger: {
    borderColor: "rgba(220,38,38,0.35)",
    backgroundColor: isDark ? "rgba(127,29,29,0.15)" : "rgba(254,242,242,0.9)"},
  hintCalloutText: {
    flex: 1,
    fontSize: typography.bodySmall,
    lineHeight: 20,
    color: c.textPrimary,
    fontFamily: fonts.medium},
  summaryBand: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.md,
    flexWrap: "wrap",
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: semanticRadius.control,
    backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? c.border : ALCHEMY.pillInactive},
  summaryBandMain: {
    minWidth: 120},
  summaryBandLabel: {
    fontSize: typography.overline,
    fontFamily: fonts.bold,
    color: c.textMuted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 4},
  summaryBandMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    justifyContent: isPhoneCompact ? "flex-start" : "flex-end",
    flex: 1},
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: semanticRadius.full,
    borderWidth: 1},
  metaChipText: {
    fontSize: typography.caption,
    fontFamily: fonts.semibold,
    color: c.textSecondary},
  amountMainHero: {
    fontSize: typography.h2,
    letterSpacing: -0.5,
    fontFamily: FONT_PRICE},
  shipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingVertical: spacing.xs},
  shipRowText: {
    flex: 1,
    fontSize: typography.bodySmall,
    color: c.textSecondary,
    fontFamily: fonts.medium},
  couponRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs},
  couponText: {
    fontSize: typography.caption,
    fontFamily: fonts.semibold,
    color: c.textPrimary},
  itemsPreview: {
    marginTop: spacing.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: semanticRadius.control,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? c.border : ALCHEMY.line,
    backgroundColor: isDark ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.55)"},
  itemsPreviewTitle: {
    fontFamily: FONT_HEADING_SEMI,
    fontSize: typography.caption,
    color: c.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing.sm},
  itemLineRowCompact: {
    flexDirection: "column",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    borderRadius: radius.lg,
    marginBottom: spacing.xs,
  },
  itemLineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm},
  itemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7},
  itemQty: {
    fontFamily: fonts.bold,
    color: c.textMuted},
  itemsMore: {
    marginTop: spacing.sm,
    fontSize: typography.caption,
    fontFamily: fonts.semibold,
    color: c.primary},
  orderTitleBlock: {
    flex: 1,
    minWidth: 0},
  placedAt: {
    fontSize: typography.caption,
    color: c.textMuted,
    fontFamily: fonts.regular,
    flex: 1},
  orderMetaSummary: {
    marginTop: 4,
    fontSize: typography.caption,
    color: c.textSecondary,
    fontFamily: fonts.semibold},
  orderTitle: {
    color: c.textPrimary,
    fontFamily: FONT_HEADING,
    fontSize: typography.h2,
    letterSpacing: -0.5},
  orderTitleLight: {
    color: ALCHEMY.brown},
  orderMetaRow: {
    marginTop: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs},
  invoiceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5},
  invoiceChipPaid: {
    borderColor: c.secondaryBorder,
    backgroundColor: c.secondarySoft},
  invoiceChipFinal: {
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft},
  invoiceChipVoid: {
    borderColor: c.danger,
    backgroundColor: "rgba(220, 38, 38, 0.08)"},
  invoiceChipText: {
    color: c.primary,
    fontSize: typography.overline,
    fontFamily: fonts.bold,
    textTransform: "capitalize"},
  invoiceNumberText: {
    color: c.textSecondary,
    fontSize: typography.caption,
    fontFamily: fonts.semibold},
  amountMain: {
    fontFamily: fonts.extrabold,
    fontSize: typography.h3,
    color: c.textPrimary,
    letterSpacing: -0.3},
  amountMeta: {
    fontSize: typography.caption,
    color: c.textMuted,
    fontFamily: fonts.medium},
  detailKicker: {
    fontSize: typography.overline,
    letterSpacing: 0.8,
    fontFamily: fonts.extrabold,
    color: c.primary,
    marginBottom: spacing.xs,
    textTransform: "uppercase"},
  loaderWrap: {
    paddingVertical: spacing.lg,
    gap: spacing.md},
  statusChip: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start"},
  statusChipSuccess: {
    borderColor: c.secondaryBorder,
    backgroundColor: c.secondarySoft},
  statusChipDanger: {
    borderColor: c.danger,
    backgroundColor: "rgba(220, 38, 38, 0.08)"},
  statusChipProgress: {
    borderColor: c.secondaryBorder,
    backgroundColor: c.secondarySoft},
  statusChipText: {
    color: c.textPrimary,
    fontSize: typography.overline,
    fontFamily: fonts.bold},
  meta: {
    marginTop: 4,
    color: c.textSecondary,
    fontSize: typography.caption,
    fontFamily: fonts.regular},
  addressDetailStack: {
    marginTop: spacing.sm,
    gap: 4},
  addressDetailLine: {
    color: c.textSecondary,
    fontSize: typography.caption,
    fontFamily: fonts.regular},
  metaMuted: {
    color: c.textMuted,
    fontSize: typography.caption,
    fontFamily: fonts.regular},
  itemLine: {
    flex: 1,
    color: c.textPrimary,
    fontSize: typography.bodySmall,
    fontFamily: fonts.medium,
    lineHeight: 20},
  rowButtons: {
    marginTop: spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    alignItems: "stretch"},
  invoiceHintWeb: {
    marginTop: spacing.xs,
    color: c.textMuted,
    fontSize: typography.overline,
    fontFamily: fonts.medium},
  outlineBtn: {
    borderColor: outlineBorder},
  outlineBtnText: {
    color: c.textPrimary,
    fontSize: typography.caption,
    fontFamily: fonts.bold},
  detailBox: {
    marginTop: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: outlineBorder,
    borderRadius: radius.lg,
    backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt,
    padding: spacing.md},
  editBox: {
    marginTop: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.primaryBorder,
    borderRadius: radius.lg,
    backgroundColor: c.primarySoft,
    padding: spacing.md},
  detailTitle: {
    color: c.textPrimary,
    fontSize: typography.caption,
    fontFamily: fonts.extrabold,
    marginBottom: spacing.xs},
  input: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.lg,
    backgroundColor: c.surface,
    color: c.textPrimary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    fontSize: typography.caption,
    fontFamily: fonts.regular,
    minHeight: 42,
    marginBottom: spacing.xs},
  splitRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: isPhoneCompact ? "wrap" : "nowrap"},
  halfInput: {
    flex: 1,
    minWidth: 0,
    width: isPhoneCompact ? "100%" : undefined},
  editFieldGap: {
    marginBottom: spacing.sm},
  editHalfField: {
    flex: 1,
    minWidth: 0},
  primaryBtn: {
    paddingHorizontal: spacing.md},
  primaryBtnText: {
    color: c.onPrimary,
    fontSize: typography.caption,
    fontFamily: fonts.bold},
  reorderBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md},
  reorderBtnDisabled: {
    opacity: 0.7},
  reorderBtnText: {
    color: c.onPrimary,
    fontSize: typography.caption,
    fontFamily: fonts.bold},
  emptyVisual: {
    alignItems: "center",
    paddingVertical: spacing.lg},
  emptyTitle: {
    marginTop: spacing.md,
    fontSize: typography.h3,
    fontFamily: fonts.extrabold,
    color: c.textPrimary},
  emptyText: {
    marginTop: spacing.sm,
    color: c.textSecondary,
    textAlign: "center",
    fontSize: typography.body,
    fontFamily: fonts.regular,
    lineHeight: 22,
    maxWidth: 280},
  loadMoreBtn: {
    marginTop: spacing.xs,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    backgroundColor: c.surface,
    width: isPhoneCompact ? "100%" : undefined},
  loadMoreBtnText: {
    color: c.textPrimary,
    fontFamily: fonts.bold,
    fontSize: typography.caption},
  errorText: {
    color: c.danger,
    fontFamily: fonts.semibold,
    fontSize: typography.caption},
  successText: {
    color: c.success,
    marginTop: spacing.xs,
    fontFamily: fonts.semibold,
    fontSize: typography.caption}});
}
