const Product = require("../models/Product");
const { qtyOf, recordStockChange } = require("./stockHistory");

const FIELD = { online: "stockQty", counter: "stockCounter" };

function locationOf(value) {
  return value === "counter" ? "counter" : "online";
}

function fieldOf(location) {
  return FIELD[locationOf(location)];
}

function qtyAt(product, location) {
  if (!product) return 0;
  return Math.max(0, Number(product[fieldOf(location)]) || 0);
}

function totalOnHand(product) {
  return qtyAt(product, "online") + qtyAt(product, "counter");
}

/** Shop website — online pile only, gated by the sellable switch. */
function availableQty(product) {
  if (!product) return 0;
  if (product.inStock === false) return 0;
  return qtyAt(product, "online");
}

function availableAt(product, location) {
  if (locationOf(location) === "online") return availableQty(product);
  return qtyAt(product, "counter");
}

async function syncOnlineFlag(product) {
  if (!product) return product;
  const online = qtyOf(product.stockQty);
  if (online <= 0 && product.inStock !== false) {
    product.inStock = false;
    await product.save();
  }
  return product;
}

/** Validate each catalog line against live stock before order create. */
function validateOrderStockLines(normalizedItems, productMap, location = "online") {
  const pile = locationOf(location);
  for (const item of normalizedItems) {
    if (!item.product) continue;
    const product = productMap.get(String(item.product));
    if (!product) {
      return { ok: false, message: "One or more products were not found." };
    }
    const qty = Number(item.quantity) || 0;
    const stock = availableAt(product, pile);
    if (stock < 1) {
      return {
        ok: false,
        message: `${product.name || "Product"} is out of stock${pile === "counter" ? " on the shop floor" : ""}.`,
      };
    }
    if (qty > stock) {
      return {
        ok: false,
        message: `Only ${stock} unit${stock === 1 ? "" : "s"} left for ${product.name || "product"}${pile === "counter" ? " on the shop floor" : ""}.`,
      };
    }
  }
  return { ok: true };
}

function filterForDeduct(productId, qty, location, why) {
  const pile = locationOf(location);
  const field = fieldOf(pile);
  const filter = { _id: productId, [field]: { $gte: qty } };
  if (pile === "online" && why !== "stock-out") filter.inStock = { $ne: false };
  return filter;
}

/** Atomically deduct stock for order lines. `ctx.location` is online (default) or counter. */
async function deductStockForOrderLines(orderLines = [], ctx = {}) {
  const location = locationOf(ctx.location);
  const field = fieldOf(location);
  const why = ctx.why || (location === "counter" ? "walk-in" : "sale");
  const adjusted = [];
  const changes = [];
  for (const line of orderLines) {
    const productId = line.product;
    if (!productId) continue;
    const qty = Math.max(1, Number(line.quantity) || 1);

    const updated = await Product.findOneAndUpdate(
      filterForDeduct(productId, qty, location, why),
      { $inc: { [field]: -qty } },
      { new: true }
    );

    if (!updated) {
      await restoreStockForOrderLines(adjusted, { location });
      const name = line.name || "Product";
      const err = new Error(
        location === "counter"
          ? `Insufficient shop-floor stock for ${name}.`
          : `Insufficient stock for ${name}.`
      );
      err.statusCode = 400;
      throw err;
    }

    const after = qtyOf(updated[field]);
    if (location === "online") await syncOnlineFlag(updated);

    adjusted.push({ product: productId, quantity: qty, name: line.name });
    changes.push({ product: updated, before: after + qty, after });
  }

  for (const row of changes) {
    await recordStockChange({
      product: row.product,
      before: row.before,
      after: row.after,
      why,
      location,
      order: ctx.order,
      orderRef: ctx.orderRef,
      who: ctx.who,
      receiptNote: ctx.receiptNote,
    });
  }
  return adjusted;
}

/** Restore stock when an order is cancelled after deduction. Pass why to log; omit on deduct rollback. */
async function restoreStockForOrderLines(orderLines = [], ctx = {}) {
  const location = locationOf(ctx.location);
  const field = fieldOf(location);
  for (const line of orderLines) {
    const productId = line.product;
    if (!productId) continue;
    const qty = Math.max(1, Number(line.quantity) || 1);

    const set = location === "online" ? { inStock: true } : {};
    const updated = await Product.findByIdAndUpdate(
      productId,
      { $inc: { [field]: qty }, ...(Object.keys(set).length ? { $set: set } : {}) },
      { new: true }
    );
    if (!updated) continue;
    const after = qtyOf(updated[field]);
    if (location === "online" && after < 1) {
      updated.inStock = false;
      await updated.save();
    }
    if (ctx.why) {
      await recordStockChange({
        product: updated,
        before: Math.max(0, after - qty),
        after,
        why: ctx.why,
        location,
        who: ctx.who,
        order: ctx.order,
        orderRef: ctx.orderRef,
        receipt: ctx.receipt,
        receiptNote: ctx.receiptNote,
        transfer: ctx.transfer,
      });
    }
  }
}

async function transferStock({ productId, from, to, qty, who, transfer, receiptNote } = {}) {
  const source = locationOf(from);
  const dest = locationOf(to);
  const amount = Math.max(1, Math.floor(Number(qty) || 0));
  if (source === dest) {
    const err = new Error("Pick two different piles.");
    err.statusCode = 400;
    throw err;
  }
  const fromField = fieldOf(source);
  const toField = fieldOf(dest);

  const moved = await Product.findOneAndUpdate(
    { _id: productId, [fromField]: { $gte: amount } },
    { $inc: { [fromField]: -amount, [toField]: amount } },
    { new: true }
  );
  if (!moved) {
    const err = new Error("Not enough stock to transfer.");
    err.statusCode = 400;
    throw err;
  }
  if (source === "online") await syncOnlineFlag(moved);
  if (dest === "online" && qtyOf(moved.stockQty) > 0 && moved.inStock === false) {
    moved.inStock = true;
    await moved.save();
  }

  const fromAfter = qtyOf(moved[fromField]);
  const toAfter = qtyOf(moved[toField]);
  await recordStockChange({
    product: moved,
    before: fromAfter + amount,
    after: fromAfter,
    why: "transfer",
    location: source,
    who,
    transfer,
    receiptNote,
  });
  await recordStockChange({
    product: moved,
    before: toAfter - amount,
    after: toAfter,
    why: "transfer",
    location: dest,
    who,
    transfer,
    receiptNote,
  });
  return moved;
}

module.exports = {
  locationOf,
  fieldOf,
  qtyAt,
  totalOnHand,
  availableQty,
  availableAt,
  validateOrderStockLines,
  deductStockForOrderLines,
  restoreStockForOrderLines,
  transferStock,
};
