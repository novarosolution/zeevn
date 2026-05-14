import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing as ReanimatedEasing,
  interpolateColor,
} from "react-native-reanimated";
import MotionScrollView from "../components/motion/MotionScrollView";
import SectionReveal from "../components/motion/SectionReveal";
import { staggerDelay } from "../theme/motion";
import useReducedMotion from "../hooks/useReducedMotion";
import useCountUp from "../hooks/useCountUp";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AppFooter from "../components/AppFooter";
import BottomNavBar from "../components/BottomNavBar";
import AuthGateShell from "../components/AuthGateShell";
import CustomerScreenShell from "../components/CustomerScreenShell";
import ScreenPageHeader from "../components/ScreenPageHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import {
  claimMyOrderRewardRequest,
  reorderMyOrderRequest,
  updateMyOrderAddressRequest,
} from "../services/orderService";
import { fetchMyOrders } from "../services/userService";
import {
  customerInnerPageScrollContent,
  customerPanel,
  customerScrollFill,
  customerWebStickyTop,
} from "../theme/screenLayout";
import { ALCHEMY, FONT_DISPLAY, FONT_DISPLAY_SEMI } from "../theme/customerAlchemy";
import { fonts, layout, lineHeight, radius, semanticRadius, spacing, typography } from "../theme/tokens";
import { formatINR } from "../utils/currency";
import PremiumEmptyState from "../components/ui/PremiumEmptyState";
import PremiumLoader from "../components/ui/PremiumLoader";
import PremiumInput from "../components/ui/PremiumInput";
import PremiumErrorBanner from "../components/ui/PremiumErrorBanner";
import PremiumChip from "../components/ui/PremiumChip";
import PremiumStatCard from "../components/ui/PremiumStatCard";
import SkeletonBlock from "../components/ui/SkeletonBlock";
import PremiumButton from "../components/ui/PremiumButton";
import PremiumCard from "../components/ui/PremiumCard";
import PremiumSectionHeader from "../components/ui/PremiumSectionHeader";
import GoldHairline from "../components/ui/GoldHairline";
import {
  ORDER_PROGRESS_STEPS,
  getActiveProgressStep,
  getOrderStatusHint,
  getOrderStatusLabel,
  isCancelledOrder,
  isDeliveredOrder,
  ORDER_STATUSES_ALLOW_ADDRESS_EDIT,
} from "../utils/orderStatus";
import PaymentStatusBanner from "../components/payments/PaymentStatusBanner";
import OrderLiveMapCard from "../components/orders/OrderLiveMapCard";
import { APP_DISPLAY_NAME, MY_ORDERS_UI, SUPPORT_EMAIL_DISPLAY, fillPlaceholders } from "../content/appContent";
import { formatCompactShippingLine } from "../utils/shippingAddressFormat";

const ORDER_STATUSES_WITH_LIVE_MAP = new Set(["ready_for_pickup", "shipped", "out_for_delivery"]);

function formatPaymentStatusLabel(ps) {
  const s = String(ps || "pending").toLowerCase();
  if (s === "paid") return "Paid";
  if (s === "pending") return "Pending";
  if (s === "failed") return "Failed";
  if (s === "refunded") return MY_ORDERS_UI.paymentRefunded;
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
    ? { label: MY_ORDERS_UI.paymentPaidInFull, cls: "paid" }
    : isRefunded
      ? { label: MY_ORDERS_UI.paymentRefunded, cls: "refunded" }
      : isFailed
        ? { label: MY_ORDERS_UI.paymentFailed, cls: "failed" }
        : { label: MY_ORDERS_UI.paymentPending, cls: "pending" };

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
        <title>${htmlEscape(APP_DISPLAY_NAME)} Invoice ${htmlEscape(invoiceNumber)}</title>
        <style>
          :root {
            --gold: #DC2626;
            --gold-bright: #EF4444;
            --gold-deep: #B91C1C;
            --brown-ink: #18181B;
            --ink: #18181B;
            --muted: #52525B;
            --soft: #F4F4F5;
            --line: #E4E4E7;
            --line-strong: #D4D4D8;
            --paper: #FFFFFF;
            --green: #475569;
            --green-soft: #F1F5F9;
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
            font-family: "Playfair Display", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
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
            content: ${JSON.stringify(APP_DISPLAY_NAME)};
            position: absolute;
            right: 32px;
            bottom: 36px;
            font-family: "Playfair Display", Georgia, serif;
            font-size: 90px;
            font-weight: 800;
            color: rgba(82, 82, 91, 0.05);
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
            font-family: "Playfair Display", Georgia, serif;
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
            font-family: "Playfair Display", Georgia, serif;
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
          .statusPill.paid     { background: var(--green-soft); color: var(--green); border-color: rgba(71, 85, 105, 0.28); }
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
            font-family: "Playfair Display", Georgia, serif;
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
            font-family: "Playfair Display", Georgia, serif;
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
            font-family: "Playfair Display", Georgia, serif;
            font-weight: 800;
            font-size: 14px;
            color: var(--brown-ink);
            letter-spacing: -0.2px;
          }
          .totals .ttRow.grand .val {
            font-family: "Playfair Display", Georgia, serif;
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
            font-family: "Playfair Display", Georgia, serif;
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
              <div class="wordmark">${htmlEscape(APP_DISPLAY_NAME.slice(0, 3))}<span class="accent">${htmlEscape(APP_DISPLAY_NAME.slice(3))}</span></div>
              <div class="tagline">Premium Grocery &middot; Heritage Quality</div>
              <div class="hairline"></div>
              <div class="companyMeta">
                Crafted essentials, delivered with care.<br/>
                ${htmlEscape(SUPPORT_EMAIL_DISPLAY)} &middot; +91 00000 00000
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
                <div class="thanks">Thank you for shopping with ${htmlEscape(APP_DISPLAY_NAME)}.</div>
                <div class="small">For any queries, write to us at ${htmlEscape(SUPPORT_EMAIL_DISPLAY)}.</div>
              </div>
              <div class="small">
                <strong>${htmlEscape(APP_DISPLAY_NAME)} &middot; Premium grocery</strong><br/>
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

const TRACK_STEP_ICONS = {
  placed: "time-outline",
  confirmed: "checkmark-done-outline",
  preparing: "cube-outline",
  ready: "bag-check-outline",
  out: "car-outline",
  done: "gift-outline",
};

function OrderProgressStrip({ status, styles, c, isDark }) {
  if (String(status || "") === "pending_payment") {
    return null;
  }
  if (isCancelledOrder(status)) {
    return (
      <View style={[styles.trackShell, styles.trackShellCancelled]}>
        <View style={styles.trackCancelledInner}>
          <View style={[styles.trackCancelledIcon, { borderColor: c.danger }]}>
            <Ionicons name="close-circle-outline" size={22} color={c.danger} />
          </View>
          <View style={styles.trackCancelledText}>
            <Text style={styles.trackCancelledTitle}>Order cancelled</Text>
            <Text style={styles.trackCancelledSub}>Timeline hidden for cancelled orders.</Text>
          </View>
        </View>
      </View>
    );
  }
  const delivered = isDeliveredOrder(status);
  const activeIdx = getActiveProgressStep(status);
  const totalSteps = ORDER_PROGRESS_STEPS.length;
  const stepLabel = delivered ? totalSteps : Math.min(activeIdx + 1, totalSteps);
  const progressLabel = delivered ? "Complete" : `Step ${stepLabel} of ${totalSteps}`;
  const pct = delivered ? 100 : Math.round((activeIdx / (totalSteps - 1)) * 100);

  const shellGradient = isDark
    ? ["rgba(20, 83, 45, 0.22)", "rgba(15, 23, 42, 0.5)", "rgba(15, 23, 42, 0.35)"]
    : ["rgba(255, 251, 235, 0.95)", "rgba(255, 253, 248, 0.98)", "rgba(237, 228, 212, 0.55)"];

  return (
    <View style={styles.trackShell}>
      <LinearGradient
        colors={shellGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.trackGradient}
      >
        <View style={[styles.trackGoldLine, { backgroundColor: isDark ? "rgba(220, 38, 38, 0.55)" : ALCHEMY.gold }]} />
        <View style={styles.trackHeadRow}>
          <View style={styles.trackHeadLeft}>
            <Ionicons name="navigate-circle-outline" size={20} color={isDark ? c.primaryBright : ALCHEMY.brown} />
            <View>
              <Text style={[styles.trackHeadTitle, isDark ? null : styles.trackHeadTitleLight]}>Track your order</Text>
              <Text style={styles.trackHeadSub}>{progressLabel}</Text>
            </View>
          </View>
          <View style={[styles.trackPctPill, { borderColor: c.primaryBorder, backgroundColor: c.primarySoft }]}>
            <Text style={[styles.trackPctText, { color: c.primaryDark }]}>{delivered ? "100%" : `${pct}%`}</Text>
          </View>
        </View>
        <View style={styles.trackList}>
          {ORDER_PROGRESS_STEPS.map((step, idx) => {
            const done = delivered || idx < activeIdx;
            const current = !delivered && idx === activeIdx;
            const barDone = delivered || activeIdx > idx;
            const stepIcon = TRACK_STEP_ICONS[step.key] || "ellipse-outline";
            return (
              <View key={step.key} style={styles.trackRow}>
                <View style={styles.trackLeftCol}>
                  <View
                    style={[
                      styles.trackDot,
                      done && styles.trackDotDone,
                      current && styles.trackDotCurrent,
                      !done && !current && styles.trackDotUpcoming,
                    ]}
                  >
                    {done ? (
                      <Ionicons name="checkmark" size={13} color={c.onSecondary} />
                    ) : (
                      <Ionicons
                        name={stepIcon}
                        size={14}
                        color={current ? c.primary : c.textMuted}
                      />
                    )}
                  </View>
                  {idx < ORDER_PROGRESS_STEPS.length - 1 ? (
                    <View style={styles.trackBarWrap}>
                      <View style={[styles.trackBar, barDone && styles.trackBarDone, !barDone && styles.trackBarMuted]} />
                    </View>
                  ) : null}
                </View>
                <View style={styles.trackTextCol}>
                  <Text style={[styles.trackTitle, done && styles.trackTitleDone, current && styles.trackTitleCurrent]}>
                    {step.title}
                  </Text>
                  <Text style={[styles.trackSub, current && styles.trackSubCurrent]}>{step.subtitle}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
}

export default function MyOrdersScreen({ navigation, route }) {
  const { colors: c, shadowPremium, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 860;
  const isPhoneCompact = width < 420;
  const styles = useMemo(
    () => createMyOrdersStyles(c, shadowPremium, isDark, { isWide, isPhoneCompact }),
    [c, shadowPremium, isDark, isWide, isPhoneCompact]
  );
  const reducedMotion = useReducedMotion();
  const [filter, setFilter] = useState("all");
  const { isAuthenticated, token, user, isAuthLoading, refreshProfile } = useAuth();
  const { refreshCartFromServer } = useCart();
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
    note: "",
  });
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
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load orders.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token]);

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
        _itemCount: (order?.products || []).reduce((sum, p) => sum + Number(p.quantity || 0), 0),
      })),
    [visibleOrders]
  );
  const historyOrderViewModels = useMemo(
    () =>
      historyOrders.map((order) => ({
        ...order,
        _shortId: String(order?._id || "").slice(-6).toUpperCase(),
        _createdAtLabel: order?.createdAt ? new Date(order.createdAt).toLocaleString() : "",
        _lineCount: (order?.products || []).length,
        _itemCount: (order?.products || []).reduce((sum, p) => sum + Number(p.quantity || 0), 0),
      })),
    [historyOrders]
  );
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [renderCount, setRenderCount] = useState(20);
  const allDisplayedOrders = useMemo(
    () =>
      isWide && filter === "all"
        ? (historyExpanded ? historyOrderViewModels : [])
        : visibleOrderViewModels,
    [isWide, filter, historyExpanded, historyOrderViewModels, visibleOrderViewModels]
  );
  const displayedOrderViewModels = useMemo(
    () => allDisplayedOrders.slice(0, renderCount),
    [allDisplayedOrders, renderCount]
  );

  useEffect(() => {
    setRenderCount(20);
  }, [filter, historyExpanded, isWide, allDisplayedOrders.length]);

  const statsActive = !loading && orders.length > 0;
  const totalOrdersCount = useCountUp({
    target: orderStats.total,
    active: statsActive,
    reducedMotion,
    duration: 900,
  });
  const inFlightCount = useCountUp({
    target: orderStats.inFlight,
    active: statsActive,
    reducedMotion,
    duration: 900,
  });
  const deliveredCount = useCountUp({
    target: orderStats.delivered,
    active: statsActive,
    reducedMotion,
    duration: 900,
  });
  const totalSpentCount = useCountUp({
    target: orderStats.totalSpent,
    active: statsActive,
    reducedMotion,
    duration: 1100,
  });

  function StatusChip({ status }) {
    const s = String(status || "");
    const isDel = isDeliveredOrder(s);
    const isCan = isCancelledOrder(s);

    const targetState = isDel ? 2 : isCan ? 1 : 0;
    const stateAnim = useSharedValue(targetState);

    useEffect(() => {
      if (reducedMotion) {
        stateAnim.value = targetState;
        return;
      }
      stateAnim.value = withTiming(targetState, {
        duration: 360,
        easing: ReanimatedEasing.bezier(0.22, 1, 0.36, 1),
      });
    }, [targetState, stateAnim]);

    const animatedChipStyle = useAnimatedStyle(() => {
      const bg = interpolateColor(
        stateAnim.value,
        [0, 1, 2],
        [c.secondarySoft, "rgba(220, 38, 38, 0.08)", c.secondarySoft],
      );
      const border = interpolateColor(
        stateAnim.value,
        [0, 1, 2],
        [c.secondaryBorder, c.danger, c.secondaryBorder],
      );
      return { backgroundColor: bg, borderColor: border };
    });

    return (
      <Animated.View style={[styles.statusChip, animatedChipStyle]}>
        <Text style={styles.statusChipText}>{getOrderStatusLabel(s)}</Text>
      </Animated.View>
    );
  }

  function InvoiceChip({ invoice }) {
    const invoiceStatus = String(invoice?.status || "draft");
    const isPaid = invoiceStatus === "paid";
    const isFinal = invoiceStatus === "final";
    const isVoid = invoiceStatus === "void";
    return (
      <View
        style={[
          styles.invoiceChip,
          isPaid ? styles.invoiceChipPaid : null,
          isFinal ? styles.invoiceChipFinal : null,
          isVoid ? styles.invoiceChipVoid : null,
        ]}
      >
        <Ionicons
          name={isPaid ? "checkmark-done-outline" : isVoid ? "close-circle-outline" : "document-text-outline"}
          size={12}
          color={isVoid ? c.danger : c.primary}
        />
        <Text style={[styles.invoiceChipText, isVoid ? { color: c.danger } : null]}>
          Invoice: {invoiceStatus}
        </Text>
      </View>
    );
  }

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
      note: order.shippingAddress?.note || "",
    });
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
        setSuccess(MY_ORDERS_UI.invoiceOpenedWeb);
        return;
      }

      const Print = await import("expo-print");
      const Sharing = await import("expo-sharing");
      const file = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          UTI: ".pdf",
          mimeType: "application/pdf",
        });
        setSuccess(MY_ORDERS_UI.invoiceReady);
      } else {
        setSuccess(MY_ORDERS_UI.invoiceGeneratedDevice);
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

  if (isAuthLoading || !isAuthenticated) {
    return <AuthGateShell />;
  }

  return (
    <CustomerScreenShell style={styles.screen}>
      <KeyboardAvoidingView
        style={customerScrollFill}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <MotionScrollView
        style={customerScrollFill}
        contentContainerStyle={customerInnerPageScrollContent(insets)}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          Platform.OS === "web" ? undefined : (
            <RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} tintColor={c.primary} colors={[c.primary]} />
          )
        }
      >
        <ScreenPageHeader
          navigation={navigation}
          title={MY_ORDERS_UI.pageTitle}
          subtitle={MY_ORDERS_UI.pageSubtitle}
          right={
            isPhoneCompact ? undefined : (
            <PremiumButton
              label={MY_ORDERS_UI.refreshCta}
              iconLeft="refresh-outline"
              size="sm"
              variant="ghost"
              onPress={loadOrders}
            />
            )
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
            <View style={styles.statsGrid}>
              <View style={styles.statsGridCell}>
                <PremiumStatCard
                  iconName="receipt-outline"
                  label={MY_ORDERS_UI.statsTotalLabel}
                  value={String(Math.round(totalOrdersCount))}
                  hint={MY_ORDERS_UI.statsTotalHint}
                  tone="gold"
                />
              </View>
              <View style={styles.statsGridCell}>
                <PremiumStatCard
                  iconName="rocket-outline"
                  label={MY_ORDERS_UI.statsInFlightLabel}
                  value={String(Math.round(inFlightCount))}
                  hint={MY_ORDERS_UI.statsInFlightHint}
                  tone="navy"
                />
              </View>
              <View style={styles.statsGridCell}>
                <PremiumStatCard
                  iconName="checkmark-done-outline"
                  label={MY_ORDERS_UI.statsDeliveredLabel}
                  value={String(Math.round(deliveredCount))}
                  hint={MY_ORDERS_UI.statsDeliveredHint}
                  tone="green"
                />
              </View>
              <View style={styles.statsGridCell}>
                <PremiumStatCard
                  iconName="wallet-outline"
                  label={MY_ORDERS_UI.statsSpendLabel}
                  value={formatINR(Math.round(totalSpentCount))}
                  hint={MY_ORDERS_UI.statsSpendHint}
                  tone="neutral"
                />
              </View>
            </View>
          </SectionReveal>
        ) : null}

        {!loading && orders.length > 0 ? <GoldHairline marginVertical={spacing.md} /> : null}

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
            <PremiumLoader size="sm" caption={MY_ORDERS_UI.loadingCaption} />
          </View>
        ) : orders.length === 0 ? (
          <View style={[styles.panel, styles.emptyPanel]}>
            <LinearGradient
              colors={
                isDark
                  ? ["rgba(20, 83, 45, 0.15)", "rgba(15, 23, 42, 0.4)"]
                  : ["rgba(255, 251, 235, 0.9)", "rgba(255, 255, 255, 0.95)"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyGradient}
            >
              <PremiumEmptyState
                iconName="cube-outline"
                title={MY_ORDERS_UI.emptyTitle}
                description={MY_ORDERS_UI.emptyDescriptionShort}
                ctaLabel={MY_ORDERS_UI.emptyBrowseCta}
                ctaIconLeft="storefront-outline"
                onCtaPress={() => navigation.navigate("Home")}
              />
            </LinearGradient>
          </View>
        ) : (
          <>
          <View style={styles.filterChipBar}>
            {[
              { key: "all", label: MY_ORDERS_UI.filterAll, count: orders.length, tone: "gold" },
              { key: "active", label: MY_ORDERS_UI.filterActive, count: activeOrders.length, tone: "info" },
              { key: "delivered", label: MY_ORDERS_UI.filterDelivered, count: orderStats.delivered, tone: "green" },
              {
                key: "cancelled",
                label: MY_ORDERS_UI.filterCancelled,
                count: orders.length - orderStats.delivered - activeOrders.length,
                tone: "red",
              },
            ].map((chip) => {
              const active = filter === chip.key;
              const label = chip.count > 0 ? `${chip.label} · ${chip.count}` : chip.label;
              return (
                <PremiumChip
                  key={chip.key}
                  label={label}
                  tone={active ? chip.tone : "neutral"}
                  selected={active}
                  size="lg"
                  onPress={() => setFilter(chip.key)}
                  accessibilityLabel={`Filter ${chip.label}`}
                />
              );
            })}
          </View>

          {isWide && filter === "all" && activeOrders.length > 0 ? (
            <View style={styles.inFlightSection}>
              <PremiumSectionHeader
                compact
                overline={MY_ORDERS_UI.inFlightOverline}
                title={MY_ORDERS_UI.inFlightTitle}
                count={activeOrders.length}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.inFlightRailContent}
                {...(Platform.OS === "web"
                  ? { style: { scrollSnapType: "x mandatory" } }
                  : {})}
              >
                {activeOrders.map((order) => (
                  <PremiumCard
                    key={order._id}
                    variant="panel"
                    padding="md"
                    interactive
                    onPress={() => setExpandedOrderId(order._id)}
                    style={styles.inFlightCard}
                    accessibilityLabel={`Open order ${String(order._id).slice(-6)}`}
                  >
                    <View style={styles.inFlightCardTop}>
                      <Text style={styles.inFlightCardKicker}>Order</Text>
                      <StatusChip status={order.status} />
                    </View>
                    <Text style={[styles.inFlightCardId, isDark ? null : styles.orderTitleLight]} numberOfLines={1}>
                      #{String(order._id).slice(-6).toUpperCase()}
                    </Text>
                    <Text style={styles.inFlightCardAmount} numberOfLines={1}>
                      {formatINR(order.totalPrice)}
                    </Text>
                    <Text style={styles.inFlightCardMeta} numberOfLines={1}>
                      {(order.products || []).reduce((s, p) => s + Number(p.quantity || 0), 0)} items ·{" "}
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""}
                    </Text>
                  </PremiumCard>
                ))}
              </ScrollView>
              <View style={styles.historyHeaderRow}>
                <View style={styles.historyHeaderTitle}>
                  <PremiumSectionHeader
                    compact
                    overline={MY_ORDERS_UI.historyOverline}
                    title={MY_ORDERS_UI.historyTitle}
                    count={historyOrders.length}
                  />
                </View>
                <PremiumButton
                  iconLeft={historyExpanded ? "chevron-up-outline" : "chevron-down-outline"}
                  variant="ghost"
                  size="sm"
                  onPress={() => setHistoryExpanded((v) => !v)}
                  accessibilityLabel={
                    historyExpanded ? MY_ORDERS_UI.collapseHistoryA11y : MY_ORDERS_UI.expandHistoryA11y
                  }
                  style={styles.historyToggleBtn}
                />
              </View>
            </View>
          ) : null}

          {displayedOrderViewModels.map((item, idx) => {
            const statusStr = String(item.status || "");
            const showLiveMapCard = ORDER_STATUSES_WITH_LIVE_MAP.has(statusStr);
            const compactShipLine = formatCompactShippingLine(item.shippingAddress);
            const panel = (
              <View style={styles.panel}>
              <View style={styles.orderCardHeader}>
                <View style={styles.orderTitleBlock}>
                  <Text style={styles.orderKicker}>{MY_ORDERS_UI.orderKicker}</Text>
                  <Text style={[styles.orderTitle, isDark ? null : styles.orderTitleLight]}>
                    #{item._shortId}
                  </Text>
                  <View style={styles.placedRow}>
                    <Ionicons name="calendar-outline" size={14} color={c.textMuted} />
                    <Text style={styles.placedAt}>{item._createdAtLabel}</Text>
                  </View>
                  <Text style={styles.orderMetaSummary}>
                    {item._itemCount} items · {item._lineCount} line{item._lineCount === 1 ? "" : "s"}
                  </Text>
                </View>
                <StatusChip status={item.status} />
              </View>

              {item.status === "pending_payment" && item.paymentStatus === "pending" ? (
                <PaymentStatusBanner order={item} token={token} user={user} onRefresh={loadOrders} />
              ) : null}

              <OrderProgressStrip status={item.status} styles={styles} c={c} isDark={isDark} />

              {getOrderStatusHint(item.status) ? (
                <View
                  style={[
                    styles.hintCallout,
                    isCancelledOrder(item.status) ? styles.hintCalloutDanger : null,
                    !isCancelledOrder(item.status) && !isDeliveredOrder(item.status)
                      ? styles.hintCalloutProgress
                      : null,
                    isDeliveredOrder(item.status) ? styles.hintCalloutSuccess : null,
                  ]}
                >
                  <Ionicons
                    name={
                      isCancelledOrder(item.status)
                        ? "alert-circle-outline"
                        : isDeliveredOrder(item.status)
                          ? "checkmark-circle-outline"
                          : "pulse-outline"
                    }
                    size={20}
                    color={
                      isCancelledOrder(item.status)
                        ? c.danger
                        : isDeliveredOrder(item.status)
                          ? c.secondary
                          : c.primary
                    }
                  />
                  <Text style={styles.hintCalloutText}>{getOrderStatusHint(item.status)}</Text>
                </View>
              ) : null}

              <View style={styles.summaryBand}>
                <View style={styles.summaryBandMain}>
                  <Text style={styles.summaryBandLabel}>{MY_ORDERS_UI.summaryTotalLabel}</Text>
                  <Text style={[styles.amountMain, styles.amountMainHero]}>{formatINR(item.totalPrice)}</Text>
                </View>
                <View style={styles.summaryBandMeta}>
                  <View style={[styles.metaChip, { borderColor: c.border, backgroundColor: c.surfaceMuted }]}>
                    <Ionicons name="layers-outline" size={14} color={c.textSecondary} />
                    <Text style={styles.metaChipText}>
                      {item._lineCount} line{item._lineCount === 1 ? "" : "s"}
                    </Text>
                  </View>
                  <View style={[styles.metaChip, { borderColor: c.border, backgroundColor: c.surfaceMuted }]}>
                    <Ionicons name="bag-handle-outline" size={14} color={c.textSecondary} />
                    <Text style={styles.metaChipText}>
                      {item._itemCount} items
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.orderMetaRow}>
                <InvoiceChip invoice={item.invoice} />
                {item.invoice?.number ? (
                  <Text style={styles.invoiceNumberText} numberOfLines={1}>
                    {item.invoice.number}
                  </Text>
                ) : null}
              </View>

              {compactShipLine && !showLiveMapCard ? (
                <View style={styles.shipRow}>
                  <Ionicons name="location-outline" size={16} color={c.primary} />
                  <Text style={styles.shipRowText} numberOfLines={2}>
                    {compactShipLine}
                  </Text>
                </View>
              ) : null}
              {item.coupon?.code ? (
                <View style={styles.couponRow}>
                  <Ionicons name="pricetag-outline" size={16} color={c.secondary} />
                  <Text style={styles.couponText}>
                    {item.coupon.code} · −{formatINR(item.coupon.discountAmount || 0)}
                  </Text>
                </View>
              ) : null}

              {showLiveMapCard ? <OrderLiveMapCard orderId={item._id} /> : null}

              {(item.products || []).length > 0 ? (
                <View style={styles.itemsPreview}>
                  <Text style={styles.itemsPreviewTitle}>{MY_ORDERS_UI.itemsPreviewTitle}</Text>
                  {(item.products || []).slice(0, 4).map((productItem, index) => (
                    <View key={`${item._id}-${index}`} style={styles.itemLineRow}>
                      <View style={[styles.itemBullet, { backgroundColor: c.primarySoft }]} />
                      <Text style={styles.itemLine} numberOfLines={2}>
                        {productItem.name}{" "}
                        <Text style={styles.itemQty}>× {productItem.quantity}</Text>
                      </Text>
                    </View>
                  ))}
                  {(item.products || []).length > 4 ? (
                    <Text style={styles.itemsMore}>
                      {fillPlaceholders(MY_ORDERS_UI.moreItemsLabel, {
                        count: (item.products || []).length - 4,
                      })}
                    </Text>
                  ) : null}
                </View>
              ) : null}
              <View style={styles.rowButtons}>
                <PremiumButton
                  label={
                    expandedOrderId === item._id ? MY_ORDERS_UI.detailsCollapse : MY_ORDERS_UI.detailsExpand
                  }
                  iconLeft={expandedOrderId === item._id ? "chevron-up-outline" : "chevron-down-outline"}
                  size="sm"
                  variant="ghost"
                  fullWidth={isPhoneCompact}
                  onPress={() => setExpandedOrderId((current) => (current === item._id ? "" : item._id))}
                />
                {canEditAddress(item) ? (
                  <PremiumButton
                    label={MY_ORDERS_UI.changeAddress}
                    iconLeft="location-outline"
                    size="sm"
                    variant="ghost"
                    fullWidth={isPhoneCompact}
                    onPress={() => openEditAddress(item)}
                  />
                ) : null}
                <PremiumButton
                  label={
                    downloadingOrderId === item._id ? MY_ORDERS_UI.generatingInvoiceCta : MY_ORDERS_UI.downloadInvoiceCta
                  }
                  iconLeft="document-text-outline"
                  size="sm"
                  variant="subtle"
                  fullWidth={isPhoneCompact}
                  disabled
                  onPress={() => handleDownloadInvoice(item)}
                />
                {isDeliveredOrder(item.status) ? (
                  <PremiumButton
                    label={
                      item.reward?.claimedAt
                        ? fillPlaceholders(MY_ORDERS_UI.rewardClaimedCta, {
                            points: Number(item.reward?.claimedPoints || item.reward?.eligiblePoints || 25),
                          })
                        : claimingRewardOrderId === item._id
                          ? MY_ORDERS_UI.rewardClaimingCta
                          : fillPlaceholders(MY_ORDERS_UI.rewardClaimCta, {
                              points: Number(item.reward?.eligiblePoints || 25),
                            })
                    }
                    iconLeft={item.reward?.claimedAt ? "checkmark-circle-outline" : "gift-outline"}
                    size="sm"
                    variant={item.reward?.claimedAt ? "subtle" : "secondary"}
                    fullWidth={isPhoneCompact}
                    disabled={Boolean(item.reward?.claimedAt) || claimingRewardOrderId === item._id}
                    loading={claimingRewardOrderId === item._id}
                    onPress={() => handleClaimReward(item._id)}
                  />
                ) : null}
              </View>
              {Platform.OS === "web" ? (
                <Text style={styles.invoiceHintWeb}>{MY_ORDERS_UI.invoiceHintWeb}</Text>
              ) : null}
              {expandedOrderId === item._id ? (
                <View style={styles.detailBox}>
                  <Text style={styles.detailKicker}>{MY_ORDERS_UI.detailKicker}</Text>
                  <Text style={styles.detailTitle}>{MY_ORDERS_UI.detailTitle}</Text>
                  <Text style={styles.meta}>
                    {fillPlaceholders(MY_ORDERS_UI.detailItems, {
                      amount: formatINR(item.priceBreakdown?.itemsTotal || 0),
                    })}
                  </Text>
                  <Text style={styles.meta}>
                    {fillPlaceholders(MY_ORDERS_UI.detailDelivery, {
                      amount: formatINR(item.priceBreakdown?.deliveryFee || 0),
                    })}
                  </Text>
                  <Text style={styles.meta}>
                    {fillPlaceholders(MY_ORDERS_UI.detailPlatformFee, {
                      amount: formatINR(item.priceBreakdown?.platformFee || 0),
                    })}
                  </Text>
                  <Text style={styles.meta}>
                    {fillPlaceholders(MY_ORDERS_UI.detailDiscount, {
                      amount: formatINR(item.priceBreakdown?.discountAmount || 0),
                    })}
                  </Text>
                  <Text style={styles.meta}>
                    {fillPlaceholders(MY_ORDERS_UI.detailPaymentMethod, {
                      method: item.paymentMethod || MY_ORDERS_UI.detailPaymentMethodFallback,
                    })}
                  </Text>
                  <Text style={styles.meta}>
                    {fillPlaceholders(MY_ORDERS_UI.detailPaymentStatus, {
                      status: formatPaymentStatusLabel(item.paymentStatus),
                    })}
                  </Text>
                  {item.razorpay?.paymentId ? (
                    <Text style={styles.meta} numberOfLines={2}>
                      {fillPlaceholders(MY_ORDERS_UI.detailRazorpayPaymentId, {
                        id: item.razorpay.paymentId,
                      })}
                    </Text>
                  ) : null}
                  <View style={styles.addressDetailStack}>
                    {String(item.shippingAddress?.fullName || "").trim() ? (
                      <Text style={styles.addressDetailLine}>{item.shippingAddress.fullName}</Text>
                    ) : null}
                    {String(item.shippingAddress?.line1 || "").trim() ? (
                      <Text style={styles.addressDetailLine}>{item.shippingAddress.line1}</Text>
                    ) : null}
                    {(() => {
                      const cs = [item.shippingAddress?.city, item.shippingAddress?.state]
                        .filter((x) => String(x || "").trim())
                        .join(", ");
                      const pc = String(item.shippingAddress?.postalCode || "").trim();
                      const line = [cs, pc].filter(Boolean).join(" ");
                      return line ? <Text style={styles.addressDetailLine}>{line}</Text> : null;
                    })()}
                    {String(item.shippingAddress?.country || "").trim() ? (
                      <Text style={styles.metaMuted}>{item.shippingAddress.country}</Text>
                    ) : null}
                  </View>
                </View>
              ) : null}
              {editingOrderId === item._id ? (
                <View style={styles.editBox}>
                  <Text style={styles.detailTitle}>{MY_ORDERS_UI.editAddressTitle}</Text>
                  <View style={styles.editFieldGap}>
                    <PremiumInput
                      label={MY_ORDERS_UI.addressFullNameLabel}
                      value={addressForm.fullName}
                      onChangeText={(value) => setAddressForm((current) => ({ ...current, fullName: value }))}
                      iconLeft="person-outline"
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={styles.editFieldGap}>
                    <PremiumInput
                      label={MY_ORDERS_UI.addressPhoneLabel}
                      value={addressForm.phone}
                      onChangeText={(value) => setAddressForm((current) => ({ ...current, phone: value }))}
                      iconLeft="call-outline"
                      keyboardType="phone-pad"
                    />
                  </View>
                  <View style={styles.editFieldGap}>
                    <PremiumInput
                      label={MY_ORDERS_UI.addressLine1Label}
                      value={addressForm.line1}
                      onChangeText={(value) => setAddressForm((current) => ({ ...current, line1: value }))}
                      iconLeft="home-outline"
                      autoCapitalize="sentences"
                    />
                  </View>
                  <View style={styles.splitRow}>
                    <View style={[styles.editFieldGap, styles.editHalfField]}>
                      <PremiumInput
                        label={MY_ORDERS_UI.addressCityLabel}
                        value={addressForm.city}
                        onChangeText={(value) => setAddressForm((current) => ({ ...current, city: value }))}
                        autoCapitalize="words"
                      />
                    </View>
                    <View style={[styles.editFieldGap, styles.editHalfField]}>
                      <PremiumInput
                        label={MY_ORDERS_UI.addressStateLabel}
                        value={addressForm.state}
                        onChangeText={(value) => setAddressForm((current) => ({ ...current, state: value }))}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                  <View style={styles.splitRow}>
                    <View style={[styles.editFieldGap, styles.editHalfField]}>
                      <PremiumInput
                        label={MY_ORDERS_UI.addressPostalCodeLabel}
                        value={addressForm.postalCode}
                        onChangeText={(value) => setAddressForm((current) => ({ ...current, postalCode: value }))}
                        keyboardType="number-pad"
                      />
                    </View>
                    <View style={[styles.editFieldGap, styles.editHalfField]}>
                      <PremiumInput
                        label={MY_ORDERS_UI.addressCountryLabel}
                        value={addressForm.country}
                        onChangeText={(value) => setAddressForm((current) => ({ ...current, country: value }))}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                  <View style={styles.editFieldGap}>
                    <PremiumInput
                      label={MY_ORDERS_UI.addressNoteLabel}
                      value={addressForm.note}
                      onChangeText={(value) => setAddressForm((current) => ({ ...current, note: value }))}
                      iconLeft="chatbubbles-outline"
                    />
                  </View>
                  <View style={styles.rowButtons}>
                    <PremiumButton
                      label={savingOrderId === item._id ? MY_ORDERS_UI.savingAddressCta : MY_ORDERS_UI.saveAddressCta}
                      size="sm"
                      variant="primary"
                      onPress={() => handleSaveAddress(item._id)}
                      disabled={savingOrderId === item._id}
                    />
                    <PremiumButton
                      label={MY_ORDERS_UI.cancelCta}
                      size="sm"
                      variant="ghost"
                      onPress={() => setEditingOrderId("")}
                    />
                  </View>
                </View>
              ) : null}
              <PremiumButton
                label={reorderingOrderId === item._id ? MY_ORDERS_UI.reorderingCta : MY_ORDERS_UI.reorderCta}
                iconLeft="refresh-outline"
                variant="primary"
                size="md"
                fullWidth
                style={styles.reorderBtn}
                onPress={() => handleReorder(item._id)}
                disabled={reorderingOrderId === item._id}
              />
              </View>
            );
            if (idx > 7) {
              return <View key={item._id}>{panel}</View>;
            }
            return (
              <SectionReveal
                key={item._id}
                preset="fade-up"
                index={idx}
                delay={staggerDelay(idx, { initialDelay: 80 })}
              >
                {panel}
              </SectionReveal>
            );
          })}
          {displayedOrderViewModels.length < allDisplayedOrders.length ? (
            <PremiumButton
              label={`Load more orders (${allDisplayedOrders.length - displayedOrderViewModels.length} remaining)`}
              variant="subtle"
              size="md"
              onPress={() => setRenderCount((prev) => prev + 20)}
              fullWidth
            />
          ) : null}
          </>
        )}
        <AppFooter />
      </MotionScrollView>
      </KeyboardAvoidingView>
      <BottomNavBar />
    </CustomerScreenShell>
  );
}

function createMyOrdersStyles(c, shadowPremium, isDark, layoutFlags = {}) {
  const { isPhoneCompact = false } = layoutFlags;
  const outlineBorder = isDark ? c.border : "rgba(148, 163, 184, 0.3)";
  return StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    maxWidth: Platform.select({ web: layout.maxContentWidth + 96, default: "100%" }),
  },
  headerRefreshBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  flashBar: {
    marginBottom: spacing.md,
  },
  filterChipBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.md,
    ...Platform.select({
      web: {
        position: "sticky",
        top: customerWebStickyTop(),
        zIndex: 10,
        backdropFilter: "saturate(140%) blur(8px)",
        paddingVertical: spacing.xs,
      },
      default: {},
    }),
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statsGridCell: {
    flexBasis: 0,
    flexGrow: 1,
    minWidth: isPhoneCompact ? 0 : 220,
    width: isPhoneCompact ? "100%" : undefined,
  },
  loadingStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
    justifyContent: isPhoneCompact ? "space-between" : "flex-start",
  },
  loadingChipsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  inFlightSection: {
    marginBottom: spacing.lg,
  },
  inFlightRailContent: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  inFlightCard: {
    width: 220,
    padding: spacing.md,
    borderRadius: semanticRadius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: outlineBorder,
    backgroundColor: isDark ? c.surface : ALCHEMY.cardBg,
    gap: 6,
    ...Platform.select({
      web: { scrollSnapAlign: "start" },
      default: {},
    }),
  },
  inFlightCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  inFlightCardKicker: {
    fontSize: typography.overline,
    fontFamily: fonts.bold,
    letterSpacing: 0.8,
    color: c.textMuted,
    textTransform: "uppercase",
  },
  inFlightCardId: {
    fontFamily: FONT_DISPLAY,
    fontSize: typography.h3,
    color: c.textPrimary,
    letterSpacing: -0.4,
  },
  inFlightCardAmount: {
    fontFamily: fonts.extrabold,
    fontSize: typography.body,
    color: c.textPrimary,
  },
  inFlightCardMeta: {
    fontSize: typography.caption,
    fontFamily: fonts.medium,
    color: c.textMuted,
  },
  historyHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  historyHeaderTitle: {
    flex: 1,
    minWidth: 0,
  },
  historyToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isDark ? c.surface : ALCHEMY.cardBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: outlineBorder,
  },
  panel: {
    ...customerPanel(c, shadowPremium, isDark),
    marginBottom: spacing.lg,
    overflow: "hidden",
    borderLeftWidth: 3,
    borderLeftColor: isDark ? "rgba(248, 113, 113, 0.44)" : "rgba(220, 38, 38, 0.52)",
  },
  emptyPanel: {
    padding: 0,
    overflow: "hidden",
  },
  emptyGradient: {
    padding: spacing.xl + 4,
    alignItems: "center",
    borderRadius: semanticRadius.panel,
  },
  emptyIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.65)",
  },
  emptyCta: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: semanticRadius.full,
    borderWidth: 1,
  },
  emptyCtaText: {
    fontFamily: fonts.bold,
    fontSize: typography.bodySmall,
  },
  emptyTitleLight: {
    fontFamily: FONT_DISPLAY,
    color: ALCHEMY.brown,
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
    borderBottomColor: isDark ? c.border : ALCHEMY.line,
  },
  orderKicker: {
    fontSize: typography.overline,
    fontFamily: fonts.bold,
    letterSpacing: 1,
    color: c.textMuted,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  placedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.xs,
  },
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
        shadowRadius: 12,
      },
      android: { elevation: isDark ? 3 : 2 },
      default: {},
    }),
  },
  trackShellCancelled: {
    borderColor: isDark ? "rgba(248,113,113,0.35)" : "rgba(220,38,38,0.25)",
    backgroundColor: isDark ? "rgba(127,29,29,0.12)" : "rgba(254,242,242,0.85)",
  },
  trackCancelledInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md + 4,
  },
  trackCancelledIcon: {
    width: 48,
    height: 48,
    borderRadius: semanticRadius.control,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isDark ? c.surface : "#fff",
  },
  trackCancelledText: {
    flex: 1,
    minWidth: 0,
  },
  trackCancelledTitle: {
    fontFamily: FONT_DISPLAY_SEMI,
    fontSize: typography.body,
    color: c.textPrimary,
  },
  trackCancelledSub: {
    marginTop: 4,
    fontSize: typography.caption,
    color: c.textSecondary,
    lineHeight: lineHeight.caption,
    fontFamily: fonts.regular,
  },
  trackGradient: {
    paddingBottom: spacing.sm,
  },
  trackGoldLine: {
    height: 2,
    width: "100%",
    opacity: 0.9,
  },
  trackHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  trackHeadLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  trackHeadTitle: {
    fontFamily: FONT_DISPLAY_SEMI,
    fontSize: typography.body,
    color: "#f8fafc",
  },
  trackHeadTitleLight: {
    color: ALCHEMY.brown,
    fontFamily: FONT_DISPLAY,
  },
  trackHeadSub: {
    marginTop: 2,
    fontSize: typography.caption,
    color: isDark ? "rgba(248,250,252,0.72)" : ALCHEMY.brownMuted,
    fontFamily: fonts.medium,
  },
  trackPctPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: semanticRadius.full,
    borderWidth: 1,
  },
  trackPctText: {
    fontFamily: fonts.extrabold,
    fontSize: typography.caption,
  },
  trackList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  trackRow: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 48,
  },
  trackLeftCol: {
    width: 32,
    alignItems: "center",
  },
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
        shadowRadius: 0,
      },
      default: {},
    }),
  },
  trackDotUpcoming: {
    backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt,
    borderColor: isDark ? c.border : ALCHEMY.pillInactive,
  },
  trackDotDone: {
    borderColor: c.secondary,
    backgroundColor: c.secondary,
  },
  trackDotCurrent: {
    borderColor: c.primary,
    backgroundColor: c.primarySoft,
    ...Platform.select({
      ios: {
        shadowColor: c.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
      },
      default: {},
    }),
  },
  trackBarWrap: {
    width: 2,
    flex: 1,
    alignItems: "center",
    marginVertical: 2,
    minHeight: 12,
  },
  trackBar: {
    width: 2,
    flex: 1,
    borderRadius: 1,
    backgroundColor: c.border,
    minHeight: 8,
  },
  trackBarMuted: {
    backgroundColor: isDark ? "rgba(148,163,184,0.25)" : "rgba(63, 63, 70, 0.12)",
  },
  trackBarDone: {
    backgroundColor: c.secondary,
  },
  trackTextCol: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingBottom: spacing.sm,
    justifyContent: "center",
  },
  trackTitle: {
    fontFamily: fonts.semibold,
    fontSize: typography.bodySmall,
    color: c.textMuted,
  },
  trackTitleDone: {
    color: c.textSecondary,
  },
  trackTitleCurrent: {
    color: c.textPrimary,
    fontFamily: FONT_DISPLAY_SEMI,
    fontSize: typography.body,
  },
  trackSub: {
    fontSize: typography.caption,
    color: c.textMuted,
    marginTop: 2,
    fontFamily: fonts.regular,
    lineHeight: lineHeight.caption,
  },
  trackSubCurrent: {
    color: c.textSecondary,
    fontFamily: fonts.medium,
  },
  hintCallout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: semanticRadius.control,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt,
  },
  hintCalloutProgress: {
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft,
  },
  hintCalloutSuccess: {
    borderColor: c.secondaryBorder,
    backgroundColor: c.secondarySoft,
  },
  hintCalloutDanger: {
    borderColor: "rgba(220,38,38,0.35)",
    backgroundColor: isDark ? "rgba(127,29,29,0.15)" : "rgba(254,242,242,0.9)",
  },
  hintCalloutText: {
    flex: 1,
    fontSize: typography.bodySmall,
    lineHeight: 20,
    color: c.textPrimary,
    fontFamily: fonts.medium,
  },
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
    borderColor: isDark ? c.border : ALCHEMY.pillInactive,
  },
  summaryBandMain: {
    minWidth: 120,
  },
  summaryBandLabel: {
    fontSize: typography.overline,
    fontFamily: fonts.bold,
    color: c.textMuted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  summaryBandMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    justifyContent: isPhoneCompact ? "flex-start" : "flex-end",
    flex: 1,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: semanticRadius.full,
    borderWidth: 1,
  },
  metaChipText: {
    fontSize: typography.caption,
    fontFamily: fonts.semibold,
    color: c.textSecondary,
  },
  amountMainHero: {
    fontSize: typography.h2,
    letterSpacing: -0.5,
    fontFamily: FONT_DISPLAY,
  },
  shipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
  },
  shipRowText: {
    flex: 1,
    fontSize: typography.bodySmall,
    color: c.textSecondary,
    fontFamily: fonts.medium,
  },
  couponRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  couponText: {
    fontSize: typography.caption,
    fontFamily: fonts.semibold,
    color: c.textPrimary,
  },
  itemsPreview: {
    marginTop: spacing.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: semanticRadius.control,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? c.border : ALCHEMY.line,
    backgroundColor: isDark ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.55)",
  },
  itemsPreviewTitle: {
    fontFamily: FONT_DISPLAY_SEMI,
    fontSize: typography.caption,
    color: c.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  itemLineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  itemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  itemQty: {
    fontFamily: fonts.bold,
    color: c.textMuted,
  },
  itemsMore: {
    marginTop: spacing.sm,
    fontSize: typography.caption,
    fontFamily: fonts.semibold,
    color: c.primary,
  },
  orderTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  placedAt: {
    fontSize: typography.caption,
    color: c.textMuted,
    fontFamily: fonts.regular,
    flex: 1,
  },
  orderMetaSummary: {
    marginTop: 4,
    fontSize: typography.caption,
    color: c.textSecondary,
    fontFamily: fonts.semibold,
  },
  orderTitle: {
    color: c.textPrimary,
    fontFamily: FONT_DISPLAY,
    fontSize: typography.h2,
    letterSpacing: -0.5,
  },
  orderTitleLight: {
    color: ALCHEMY.brown,
  },
  orderMetaRow: {
    marginTop: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  invoiceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  invoiceChipPaid: {
    borderColor: c.secondaryBorder,
    backgroundColor: c.secondarySoft,
  },
  invoiceChipFinal: {
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft,
  },
  invoiceChipVoid: {
    borderColor: c.danger,
    backgroundColor: "rgba(220, 38, 38, 0.08)",
  },
  invoiceChipText: {
    color: c.primary,
    fontSize: typography.overline,
    fontFamily: fonts.bold,
    textTransform: "capitalize",
  },
  invoiceNumberText: {
    color: c.textSecondary,
    fontSize: typography.caption,
    fontFamily: fonts.semibold,
  },
  amountMain: {
    fontFamily: fonts.extrabold,
    fontSize: typography.h3,
    color: c.textPrimary,
    letterSpacing: -0.3,
  },
  amountMeta: {
    fontSize: typography.caption,
    color: c.textMuted,
    fontFamily: fonts.medium,
  },
  detailKicker: {
    fontSize: typography.overline,
    letterSpacing: 0.8,
    fontFamily: fonts.extrabold,
    color: c.primary,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
  },
  loaderWrap: {
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  statusChip: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  statusChipSuccess: {
    borderColor: c.secondaryBorder,
    backgroundColor: c.secondarySoft,
  },
  statusChipDanger: {
    borderColor: c.danger,
    backgroundColor: "rgba(220, 38, 38, 0.08)",
  },
  statusChipProgress: {
    borderColor: c.secondaryBorder,
    backgroundColor: c.secondarySoft,
  },
  statusChipText: {
    color: c.textPrimary,
    fontSize: typography.overline,
    fontFamily: fonts.bold,
  },
  meta: {
    marginTop: 4,
    color: c.textSecondary,
    fontSize: typography.caption,
    fontFamily: fonts.regular,
  },
  addressDetailStack: {
    marginTop: spacing.sm,
    gap: 4,
  },
  addressDetailLine: {
    color: c.textSecondary,
    fontSize: typography.caption,
    fontFamily: fonts.regular,
  },
  metaMuted: {
    color: c.textMuted,
    fontSize: typography.caption,
    fontFamily: fonts.regular,
  },
  itemLine: {
    flex: 1,
    color: c.textPrimary,
    fontSize: typography.bodySmall,
    fontFamily: fonts.medium,
    lineHeight: 20,
  },
  rowButtons: {
    marginTop: spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    alignItems: "stretch",
  },
  invoiceHintWeb: {
    marginTop: spacing.xs,
    color: c.textMuted,
    fontSize: typography.overline,
    fontFamily: fonts.medium,
  },
  outlineBtn: {
    borderColor: outlineBorder,
  },
  outlineBtnText: {
    color: c.textPrimary,
    fontSize: typography.caption,
    fontFamily: fonts.bold,
  },
  detailBox: {
    marginTop: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: outlineBorder,
    borderRadius: radius.lg,
    backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.creamAlt,
    padding: spacing.md,
  },
  editBox: {
    marginTop: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.primaryBorder,
    borderRadius: radius.lg,
    backgroundColor: c.primarySoft,
    padding: spacing.md,
  },
  detailTitle: {
    color: c.textPrimary,
    fontSize: typography.caption,
    fontFamily: fonts.extrabold,
    marginBottom: spacing.xs,
  },
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
    marginBottom: spacing.xs,
  },
  splitRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: isPhoneCompact ? "wrap" : "nowrap",
  },
  halfInput: {
    flex: 1,
    minWidth: 0,
    width: isPhoneCompact ? "100%" : undefined,
  },
  editFieldGap: {
    marginBottom: spacing.sm,
  },
  editHalfField: {
    flex: 1,
    minWidth: 0,
  },
  primaryBtn: {
    paddingHorizontal: spacing.md,
  },
  primaryBtnText: {
    color: c.onPrimary,
    fontSize: typography.caption,
    fontFamily: fonts.bold,
  },
  reorderBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  reorderBtnDisabled: {
    opacity: 0.7,
  },
  reorderBtnText: {
    color: c.onPrimary,
    fontSize: typography.caption,
    fontFamily: fonts.bold,
  },
  emptyVisual: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  emptyTitle: {
    marginTop: spacing.md,
    fontSize: typography.h3,
    fontFamily: fonts.extrabold,
    color: c.textPrimary,
  },
  emptyText: {
    marginTop: spacing.sm,
    color: c.textSecondary,
    textAlign: "center",
    fontSize: typography.body,
    fontFamily: fonts.regular,
    lineHeight: 22,
    maxWidth: 280,
  },
  loadMoreBtn: {
    marginTop: spacing.xs,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    backgroundColor: c.surface,
    width: isPhoneCompact ? "100%" : undefined,
  },
  loadMoreBtnText: {
    color: c.textPrimary,
    fontFamily: fonts.bold,
    fontSize: typography.caption,
  },
  errorText: {
    color: c.danger,
    fontFamily: fonts.semibold,
    fontSize: typography.caption,
  },
  successText: {
    color: c.success,
    marginTop: spacing.xs,
    fontFamily: fonts.semibold,
    fontSize: typography.caption,
  },
  });
}
