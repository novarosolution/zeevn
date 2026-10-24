const Order = require("../models/Order");
const Product = require("../models/Product");
const { resolvePeriod } = require("./adminOverviewController");

const LOW_MAX = 5;

function coverUri(product) {
  if (String(product.image || "").trim()) return String(product.image).trim();
  const extra = Array.isArray(product.images) ? product.images.find((u) => String(u || "").trim()) : "";
  return extra ? String(extra).trim() : "";
}

function stockOut(product) {
  return product.inStock === false || Math.max(0, Number(product.stockQty) || 0) < 1;
}

function stockLow(product) {
  const qty = Math.max(0, Number(product.stockQty) || 0);
  return !stockOut(product) && qty >= 1 && qty <= LOW_MAX;
}

function stockStatus(product) {
  if (stockOut(product)) return "out";
  if (stockLow(product)) return "low";
  return "in";
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

function resolveReportRange(raw) {
  const key = String(raw || "7d").toLowerCase();
  if (key === "today") return { range: "today", period: "today" };
  if (key === "30d" || key === "30") return { range: "30d", period: "last30" };
  return { range: "7d", period: "last7" };
}

async function listStockReport(req, res, next) {
  try {
    const picked = resolveReportRange(req.query.range);
    const window = await resolvePeriod({ period: picked.period });
    if (window.error) return res.status(400).json({ message: window.error });

    const [products, orders] = await Promise.all([
      Product.find()
        .select("name sku category unit image images stockQty inStock price")
        .lean(),
      Order.find({ status: "delivered" }).select("products statusHistory").lean(),
    ]);

    const soldQty = new Map();
    const soldRupees = new Map();
    for (const order of orders) {
      if (!inRange(deliveredAtOf(order), window.from, window.to)) continue;
      for (const line of order.products || []) {
        const id = String(line.product || "");
        if (!id) continue;
        const qty = Math.max(0, Number(line.quantity) || 0);
        soldQty.set(id, (soldQty.get(id) || 0) + qty);
        soldRupees.set(id, (soldRupees.get(id) || 0) + Number(line.price || 0) * qty);
      }
    }

    const items = products
      .map((product) => {
        const id = String(product._id);
        const onHand = Math.max(0, Math.floor(Number(product.stockQty) || 0));
        const price = Number(product.price || 0);
        const status = stockStatus(product);
        return {
          id,
          name: product.name || "Jar",
          sku: product.sku || "",
          category: String(product.category || "").trim() || "General",
          unit: String(product.unit || "").trim(),
          image: coverUri(product),
          onHand,
          inStock: product.inStock !== false,
          status,
          stockValue: onHand > 0 ? Math.round(onHand * price) : 0,
          sold: soldQty.get(id) || 0,
          soldRevenue: Math.round(soldRupees.get(id) || 0),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));

    res.json({
      range: picked.range,
      from: window.from,
      to: window.to,
      items,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { listStockReport };
