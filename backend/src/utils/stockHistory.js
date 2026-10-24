const StockHistory = require("../models/StockHistory");
const { WHYS } = StockHistory;

function orderPublicRef(id) {
  const tail = String(id || "").slice(-5).toUpperCase();
  return tail ? `#KG-${tail}` : "";
}

function qtyOf(value) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

/** Append one history row only when stockQty actually moved. */
async function recordStockChange({
  product,
  before,
  after,
  why,
  who,
  order,
  orderRef,
  receipt,
  receiptNote,
} = {}) {
  if (!WHYS.includes(why)) return null;
  const prev = qtyOf(before);
  const next = qtyOf(after);
  if (next === prev) return null;
  const doc = product && typeof product === "object" ? product : {};
  const productId = doc._id || product || null;
  const system = why === "sale" || why === "cancel";
  return StockHistory.create({
    at: new Date(),
    product: productId,
    name: String(doc.name || "").trim().slice(0, 160),
    sku: String(doc.sku || "").trim().slice(0, 80),
    before: prev,
    after: next,
    change: next - prev,
    why,
    who: system ? "System" : String(who || "Admin").trim().slice(0, 80) || "Admin",
    order: order || null,
    orderRef: why === "manual" || why === "stock-in" ? "" : String(orderRef || "").trim().slice(0, 24),
    receipt: why === "stock-in" ? receipt || null : null,
    receiptNote: why === "stock-in" ? String(receiptNote || "").trim().slice(0, 200) : "",
  });
}

module.exports = {
  orderPublicRef,
  qtyOf,
  recordStockChange,
};
