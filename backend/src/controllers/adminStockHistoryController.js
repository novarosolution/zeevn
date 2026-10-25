const StockHistory = require("../models/StockHistory");
const { WHYS } = StockHistory;
const { resolvePeriod } = require("./adminOverviewController");

const PAGE_SIZE = { min: 5, max: 100, fallback: 25 };
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function resolveHistoryRange(raw) {
  const key = String(raw || "7d").toLowerCase();
  if (key === "today") return { range: "today", period: "today" };
  if (key === "30d" || key === "30") return { range: "30d", period: "last30" };
  if (key === "all") return { range: "all", period: null };
  return { range: "7d", period: "last7" };
}

function present(row) {
  return {
    id: String(row._id),
    at: row.at,
    productId: row.product ? String(row.product) : "",
    name: row.name || "",
    sku: row.sku || "",
    before: Number(row.before) || 0,
    after: Number(row.after) || 0,
    change: Number(row.change) || 0,
    why: row.why,
    who: row.who || "",
    orderId: row.order ? String(row.order) : "",
    orderRef: row.orderRef || "",
    receiptId: row.receipt ? String(row.receipt) : "",
    receiptNote: row.receiptNote || "",
    location: row.location || "online",
    transferId: row.transfer ? String(row.transfer) : "",
  };
}

async function listStockHistory(req, res, next) {
  try {
    const picked = resolveHistoryRange(req.query.range);
    const filter = {};
    let from = null;
    let to = null;
    if (picked.period) {
      const window = await resolvePeriod({ period: picked.period });
      if (window.error) return res.status(400).json({ message: window.error });
      from = window.from;
      to = window.to;
      filter.at = { $gte: window.from, $lt: window.to };
    }

    const why = String(req.query.why || "").trim();
    if (WHYS.includes(why)) filter.why = why;
    const location = String(req.query.location || "").trim();
    if (location === "online" || location === "counter") filter.location = location;

    const text = String(req.query.q || "").trim();
    if (text) {
      const raw = new RegExp(escapeRegex(text), "i");
      const stripped = text.replace(/^#?(?:kg-)?/i, "");
      const or = [{ name: raw }, { sku: raw }, { orderRef: raw }];
      if (stripped && stripped !== text) {
        or.push({ orderRef: new RegExp(escapeRegex(stripped), "i") });
      }
      filter.$or = or;
    }

    const pageSize = Math.min(
      PAGE_SIZE.max,
      Math.max(PAGE_SIZE.min, Math.round(Number(req.query.pageSize)) || PAGE_SIZE.fallback)
    );
    const total = await StockHistory.countDocuments(filter);
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(pages, Math.max(1, Math.round(Number(req.query.page)) || 1));
    const rows = await StockHistory.find(filter)
      .sort({ at: -1, _id: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    res.json({
      items: rows.map(present),
      total,
      page,
      pages,
      pageSize,
      range: picked.range,
      why: WHYS.includes(why) ? why : "all",
      location: location === "online" || location === "counter" ? location : "all",
      from,
      to,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { listStockHistory };
