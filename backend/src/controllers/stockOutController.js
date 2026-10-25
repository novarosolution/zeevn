const mongoose = require("mongoose");
const Product = require("../models/Product");
const { deductStockForOrderLines, locationOf } = require("../utils/stock");
const { recordAdminAction, productOpen } = require("../utils/adminLog");

const REASONS = ["waste", "damage", "sample", "staff"];

function fail(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
}

async function createStockOut(req, res, next) {
  try {
    const productId = req.body?.product?._id || req.body?.product;
    if (!mongoose.Types.ObjectId.isValid(String(productId || ""))) fail("Pick a product.");
    const qty = Math.round(Number(req.body?.quantity));
    if (!Number.isFinite(qty) || qty < 1) fail("Quantity must be at least 1.");
    const location = locationOf(req.body?.location);
    const reason = REASONS.includes(String(req.body?.reason || "")) ? String(req.body.reason) : "waste";
    const note = String(req.body?.note || "").trim().slice(0, 200);

    const product = await Product.findById(productId).select("name sku unit stockQty stockCounter");
    if (!product) fail("Product not found.", 404);

    await deductStockForOrderLines([{ product: product._id, quantity: qty, name: product.name }], {
      location,
      why: "stock-out",
      who: String(req.user?.name || "Admin").trim().slice(0, 80),
      receiptNote: [reason, note].filter(Boolean).join(" · "),
    });

    await recordAdminAction(req, {
      action: "Stock out",
      subject: `${product.name} ×${qty} (${reason})`,
      tab: "catalog",
      href: productOpen(product.name),
    });

    const fresh = await Product.findById(product._id).select("name sku stockQty stockCounter inStock").lean();
    res.status(201).json({
      ok: true,
      reason,
      location,
      quantity: qty,
      note,
      product: fresh,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { createStockOut, STOCK_OUT_REASONS: REASONS };
