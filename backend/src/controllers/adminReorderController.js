const Order = require("../models/Order");
const Product = require("../models/Product");
const StockReceipt = require("../models/StockReceipt");
const { resolvePeriod } = require("./adminOverviewController");

const LOW_MAX = 5;

function comingSoon(p) {
  return p.comingSoon === true || p.comingSoon === "true";
}

function stockOut(p) {
  const q = Math.max(0, Number(p.stockQty) || 0);
  return p.inStock === false || q < 1;
}

function stockLow(p) {
  const q = Math.max(0, Number(p.stockQty) || 0);
  return !stockOut(p) && q >= 1 && q <= LOW_MAX;
}

function coverUri(p) {
  if (String(p.image || "").trim()) return String(p.image).trim();
  const extra = Array.isArray(p.images) ? p.images.find((u) => String(u || "").trim()) : "";
  return extra ? String(extra).trim() : "";
}

function rateLabel(n) {
  const v = Number(n) || 0;
  if (Math.abs(v - Math.round(v)) < 0.05) return String(Math.round(v));
  return v.toFixed(1);
}

function reasonFor({ sold, perDay, onHand, target, suggest, out, periodDays, coverDays }) {
  if (sold < 1) return "No delivered sales in this period.";
  if (out) return `Out of stock. About ${rateLabel(perDay)} a day over the last ${periodDays} days.`;
  if (suggest < 1 && onHand >= target) return `Enough for the next ${coverDays} days.`;
  if (perDay > 0) {
    const days = Math.max(0, Math.round(onHand / perDay));
    if (days < coverDays) return `About ${days} days left at recent demand.`;
  }
  return `Enough for the next ${coverDays} days.`;
}

function deliveredAtOf(order) {
  const events = (order.statusHistory || []).filter((row) => row.status === "delivered" && row.at);
  return events.length ? events[events.length - 1].at : null;
}

function inRange(date, from, to) {
  const t = date ? new Date(date).getTime() : NaN;
  if (!Number.isFinite(t)) return false;
  if (from && t < from.getTime()) return false;
  if (to && t >= to.getTime()) return false;
  return true;
}

async function listReorders(req, res, next) {
  try {
    const periodDays = Number(req.query.period) === 30 ? 30 : 7;
    const coverDays = Number(req.query.cover) === 7 ? 7 : 3;
    const range = await resolvePeriod({ period: periodDays === 30 ? "last30" : "last7" });
    if (range.error) return res.status(400).json({ message: range.error });

    const [products, orders, drafts] = await Promise.all([
      Product.find({ isPublished: { $ne: false } })
        .select("name sku image images unit stockQty stockCounter inStock comingSoon reorderMinOnline reorderMinCounter lastCost")
        .lean(),
      Order.find({
        status: "delivered",
        statusHistory: { $elemMatch: { status: "delivered", at: { $gte: range.from, $lt: range.to } } },
      })
        .select("products statusHistory")
        .lean(),
      StockReceipt.find({ status: "draft" }).select("lines").lean(),
    ]);

    const soldBy = new Map();
    for (const order of orders) {
      if (!inRange(deliveredAtOf(order), range.from, range.to)) continue;
      for (const line of order.products || []) {
        const id = String(line.product || "");
        if (!id) continue;
        soldBy.set(id, (soldBy.get(id) || 0) + Math.max(0, Number(line.quantity) || 0));
      }
    }

    const comingBy = new Map();
    for (const receipt of drafts) {
      for (const line of receipt.lines || []) {
        const id = String(line.product || "");
        if (!id) continue;
        comingBy.set(id, (comingBy.get(id) || 0) + Math.max(0, Number(line.quantity) || 0));
      }
    }

    const items = products
      .filter((p) => !comingSoon(p))
      .map((p) => {
        const id = String(p._id);
        const sold = soldBy.get(id) || 0;
        const perDay = sold / periodDays;
        const target = Math.ceil(perDay * coverDays);
        const online = Math.max(0, Number(p.stockQty) || 0);
        const counter = Math.max(0, Number(p.stockCounter) || 0);
        const onHand = online + counter;
        const coming = comingBy.get(id) || 0;
        const minOnline = Math.max(0, Number(p.reorderMinOnline) || 0);
        const minCounter = Math.max(0, Number(p.reorderMinCounter) || 0);
        const belowMin = (minOnline > 0 && online < minOnline) || (minCounter > 0 && counter < minCounter);
        const suggest = sold < 1 && !belowMin ? 0 : Math.max(0, Math.max(target, minOnline + minCounter) - onHand - coming);
        const out = stockOut(p);
        const low = stockLow(p);
        return {
          id,
          name: p.name || "Jar",
          sku: p.sku || "",
          unit: p.unit || "",
          image: coverUri(p),
          onHand,
          online,
          counter,
          minOnline,
          minCounter,
          lastCost: Number(p.lastCost) || 0,
          sold,
          perDay,
          target,
          coming,
          suggest,
          out,
          low,
          belowMin,
          reason: belowMin
            ? `Below min · online ${online}/${minOnline || "—"} · floor ${counter}/${minCounter || "—"}`
            : reasonFor({ sold, perDay, onHand, target, suggest, out, periodDays, coverDays }),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      period: periodDays,
      cover: coverDays,
      items,
      counts: {
        needs: items.filter((row) => row.suggest >= 1 || row.belowMin).length,
        low: items.filter((row) => row.out || row.low || row.belowMin).length,
        all: items.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { listReorders };
