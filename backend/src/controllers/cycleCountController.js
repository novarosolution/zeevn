const mongoose = require("mongoose");
const Product = require("../models/Product");
const { locationOf, fieldOf } = require("../utils/stock");
const { recordStockChange, qtyOf } = require("../utils/stockHistory");
const { recordAdminAction, productOpen } = require("../utils/adminLog");

function fail(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
}

async function applyCycleCount(req, res, next) {
  try {
    const location = locationOf(req.body?.location);
    const field = fieldOf(location);
    const raw = Array.isArray(req.body?.lines) ? req.body.lines : [];
    const lines = [];
    for (const row of raw) {
      const id = row?.product?._id || row?.product;
      if (!mongoose.Types.ObjectId.isValid(String(id || ""))) continue;
      // Number(null) and Number("") are 0, so a jar nobody counted would be wiped to zero.
      const entered = row?.counted;
      if (entered === null || entered === undefined || String(entered).trim() === "") continue;
      const counted = Math.round(Number(entered));
      if (!Number.isFinite(counted) || counted < 0) continue;
      lines.push({ productId: String(id), counted });
    }
    if (!lines.length) fail("Count at least one jar.");

    const applied = [];
    for (const line of lines) {
      const product = await Product.findById(line.productId);
      if (!product) continue;
      const before = qtyOf(product[field]);
      if (before === line.counted) continue;
      product[field] = line.counted;
      if (location === "online") product.inStock = line.counted > 0;
      await product.save();
      await recordStockChange({
        product,
        before,
        after: line.counted,
        why: "manual",
        location,
        who: String(req.user?.name || "Admin").trim().slice(0, 80),
        receiptNote: "Cycle count",
      });
      applied.push({ product: product._id, name: product.name, before, after: line.counted });
    }

    await recordAdminAction(req, {
      action: "Cycle count",
      subject: `${applied.length} jar${applied.length === 1 ? "" : "s"} · ${location}`,
      tab: "catalog",
      href: productOpen(applied[0]?.name),
    });
    res.json({ ok: true, location, applied });
  } catch (error) {
    next(error);
  }
}

module.exports = { applyCycleCount };
