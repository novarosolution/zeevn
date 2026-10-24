const Product = require("../models/Product");
const { qtyOf, recordStockChange } = require("./stockHistory");

function availableQty(product) {
  if (!product) return 0;
  if (product.inStock === false) return 0;
  return Math.max(0, Number(product.stockQty) || 0);
}

/** Validate each catalog line against live stock before order create. */
function validateOrderStockLines(normalizedItems, productMap) {
  for (const item of normalizedItems) {
    if (!item.product) continue;
    const product = productMap.get(String(item.product));
    if (!product) {
      return { ok: false, message: "One or more products were not found." };
    }
    const qty = Number(item.quantity) || 0;
    const stock = availableQty(product);
    if (stock < 1) {
      return {
        ok: false,
        message: `${product.name || "Product"} is out of stock.`,
      };
    }
    if (qty > stock) {
      return {
        ok: false,
        message: `Only ${stock} unit${stock === 1 ? "" : "s"} left for ${product.name || "product"}.`,
      };
    }
  }
  return { ok: true };
}

/** Atomically deduct stock for order lines with MongoDB product ids. */
async function deductStockForOrderLines(orderLines = [], ctx = {}) {
  const adjusted = [];
  const changes = [];
  for (const line of orderLines) {
    const productId = line.product;
    if (!productId) continue;
    const qty = Math.max(1, Number(line.quantity) || 1);

    const updated = await Product.findOneAndUpdate(
      { _id: productId, stockQty: { $gte: qty }, inStock: { $ne: false } },
      { $inc: { stockQty: -qty } },
      { new: true }
    );

    if (!updated) {
      await restoreStockForOrderLines(adjusted);
      const name = line.name || "Product";
      const err = new Error(`Insufficient stock for ${name}.`);
      err.statusCode = 400;
      throw err;
    }

    const after = qtyOf(updated.stockQty);
    if (after <= 0) {
      updated.inStock = false;
      await updated.save();
    }

    adjusted.push({ product: productId, quantity: qty, name: line.name });
    changes.push({ product: updated, before: after + qty, after });
  }

  for (const row of changes) {
    await recordStockChange({
      product: row.product,
      before: row.before,
      after: row.after,
      why: "sale",
      order: ctx.order,
      orderRef: ctx.orderRef,
    });
  }
  return adjusted;
}

/** Restore stock when an order is cancelled after deduction. Pass why to log; omit on deduct rollback. */
async function restoreStockForOrderLines(orderLines = [], ctx = {}) {
  for (const line of orderLines) {
    const productId = line.product;
    if (!productId) continue;
    const qty = Math.max(1, Number(line.quantity) || 1);

    const updated = await Product.findByIdAndUpdate(
      productId,
      { $inc: { stockQty: qty }, $set: { inStock: true } },
      { new: true }
    );
    if (!updated) continue;
    const after = qtyOf(updated.stockQty);
    if (after < 1) {
      updated.inStock = false;
      await updated.save();
    }
    if (ctx.why) {
      await recordStockChange({
        product: updated,
        before: Math.max(0, after - qty),
        after,
        why: ctx.why,
        who: ctx.who,
        order: ctx.order,
        orderRef: ctx.orderRef,
        receipt: ctx.receipt,
        receiptNote: ctx.receiptNote,
      });
    }
  }
}

module.exports = {
  availableQty,
  validateOrderStockLines,
  deductStockForOrderLines,
  restoreStockForOrderLines,
};
