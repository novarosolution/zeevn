const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { deductStockForOrderLines, restoreStockForOrderLines, validateOrderStockLines } = require("../utils/stock");
const { orderPublicRef } = require("../utils/stockHistory");
const { recordAdminAction } = require("../utils/adminLog");

function fail(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
}

function digits(value) {
  return String(value || "").replace(/\D/g, "");
}

function walkInEmail(phone) {
  const tail = digits(phone) || `guest${Date.now()}`;
  return `walkin.${tail}@counter.zeevan.local`;
}

function tenderOf(value) {
  const raw = String(value || "Cash").trim();
  if (/upi/i.test(raw)) return "UPI";
  return "Cash";
}

async function findOrCreateWalkInCustomer({ customerId, name, phone, note }) {
  if (customerId && mongoose.Types.ObjectId.isValid(String(customerId))) {
    const existing = await User.findById(customerId);
    if (existing && !existing.isAdmin) {
      if (note !== undefined) {
        existing.adminNote = String(note || "").trim().slice(0, 240);
        await existing.save();
      }
      return existing;
    }
  }
  const cleanPhone = String(phone || "").trim().slice(0, 20);
  const cleanName = String(name || "").trim().slice(0, 80) || "Walk-in";
  if (cleanPhone) {
    const byPhone = await User.findOne({
      $or: [{ phone: cleanPhone }, { email: walkInEmail(cleanPhone) }],
    });
    if (byPhone) {
      if (!byPhone.phone) byPhone.phone = cleanPhone;
      if (note !== undefined) byPhone.adminNote = String(note || "").trim().slice(0, 240);
      await byPhone.save();
      return byPhone;
    }
  }
  return User.create({
    name: cleanName,
    email: walkInEmail(cleanPhone || `${Date.now()}`),
    password: "",
    phone: cleanPhone,
    walkIn: true,
    isAdmin: false,
    adminNote: String(note || "").trim().slice(0, 240),
  });
}

async function createWalkInCustomer(req, res, next) {
  try {
    const phone = String(req.body?.phone || "").trim();
    const name = String(req.body?.name || "").trim();
    if (!phone && !name) fail("Name or phone is required.");
    const user = await findOrCreateWalkInCustomer({
      name,
      phone,
      note: req.body?.adminNote,
    });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      walkIn: Boolean(user.walkIn),
      adminNote: user.adminNote || "",
    });
  } catch (error) {
    next(error);
  }
}

async function updateCustomerNote(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.id || ""))) {
      return res.status(400).json({ message: "Invalid customer." });
    }
    const user = await User.findById(req.params.id);
    if (!user || user.isAdmin) return res.status(404).json({ message: "Customer not found." });
    user.adminNote = String(req.body?.adminNote || "").trim().slice(0, 240);
    await user.save();
    res.json({ _id: user._id, adminNote: user.adminNote });
  } catch (error) {
    next(error);
  }
}

async function createWalkIn(req, res, next) {
  try {
    const rawLines = Array.isArray(req.body?.products) ? req.body.products : [];
    if (!rawLines.length) fail("Add at least one jar.");

    const wanted = [];
    for (const row of rawLines) {
      const productId = row?.product?._id || row?.product;
      if (!mongoose.Types.ObjectId.isValid(String(productId || ""))) continue;
      const quantity = Math.round(Number(row.quantity));
      if (!Number.isFinite(quantity) || quantity < 1) continue;
      wanted.push({ productId: String(productId), quantity });
    }
    if (!wanted.length) fail("Add at least one jar.");

    const products = await Product.find({ _id: { $in: wanted.map((row) => row.productId) } });
    const productMap = new Map(products.map((p) => [String(p._id), p]));
    const normalizedItems = wanted.map((row) => {
      const product = productMap.get(row.productId);
      if (!product) fail("One of those products is gone.");
      if (product.isPublished === false) fail(`${product.name} is no longer available.`);
      return {
        product: product._id,
        name: product.name,
        price: Number(product.price || 0),
        image: product.image || "",
        quantity: row.quantity,
        variantLabel: "",
      };
    });

    const stock = validateOrderStockLines(normalizedItems, productMap, "counter");
    if (!stock.ok) fail(stock.message);

    const customer = await findOrCreateWalkInCustomer({
      customerId: req.body?.customerId,
      name: req.body?.name || req.body?.customerName,
      phone: req.body?.phone,
      note: req.body?.adminNote,
    });

    const itemsTotal = normalizedItems.reduce((sum, line) => sum + Number(line.price || 0) * line.quantity, 0);
    const tender = tenderOf(req.body?.tender || req.body?.paymentMethod);
    const fullName = customer.name || "Walk-in";
    const phone = customer.phone || "—";
    const upiRef = String(req.body?.upiRef || "").trim().slice(0, 40);
    const cashReceived = Math.max(0, Number(req.body?.cashReceived) || 0);
    const slipNote = String(req.body?.note || "").trim().slice(0, 120)
      || (tender === "UPI" && upiRef ? `UPI ${upiRef}` : "")
      || (tender === "Cash" && cashReceived > 0 ? `Cash received ₹${Math.round(cashReceived)}` : "");

    const order = await Order.create({
      user: customer._id,
      channel: "walk_in",
      products: normalizedItems,
      totalPrice: Math.round(itemsTotal),
      paymentMethod: tender,
      paymentStatus: "paid",
      shippingAddress: {
        fullName,
        phone,
        line1: "Shop counter",
        city: "Store",
        postalCode: "000000",
        addressType: "Counter",
        note: slipNote,
      },
      priceBreakdown: {
        itemsTotal: Math.round(itemsTotal),
        deliveryFee: 0,
        platformFee: 0,
        discountAmount: 0,
      },
      status: "delivered",
      stockAdjustedAt: new Date(),
    });
    order.$locals.statusActor = { by: req.user?._id || null, byRole: "admin", note: "Walk-in bill" };
    order.invoice = {
      ...(order.invoice || {}),
      number: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(order._id).slice(-6).toUpperCase()}`,
      issueDate: new Date(),
      status: "paid",
      notes: slipNote,
      updatedAt: new Date(),
    };
    await order.save();

    try {
      await deductStockForOrderLines(order.products, {
        location: "counter",
        why: "walk-in",
        order: order._id,
        orderRef: orderPublicRef(order._id),
      });
    } catch (error) {
      order.status = "cancelled";
      order.paymentStatus = "refunded";
      order.invoice = { ...(order.invoice || {}), status: "void" };
      await order.save();
      throw error;
    }

    await recordAdminAction(req, {
      action: "Walk-in bill",
      subject: `${orderPublicRef(order._id)} · ₹${order.totalPrice}`,
      tab: "orders",
    });

    const populated = await Order.findById(order._id)
      .populate("user", "name phone email walkIn")
      .lean();
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
}

async function voidWalkIn(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.id || ""))) {
      return res.status(400).json({ message: "Invalid bill." });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Bill not found." });
    if (order.channel !== "walk_in") fail("Only a counter bill can be voided here.");
    if (order.status === "cancelled") fail("This bill is already void.");

    order.$locals.statusActor = { by: req.user?._id || null, byRole: "admin", note: "Void walk-in" };
    order.status = "cancelled";
    order.paymentStatus = "refunded";
    if (order.invoice) order.invoice.status = "void";
    await order.save();

    if (order.stockAdjustedAt) {
      await restoreStockForOrderLines(order.products, {
        location: "counter",
        why: "cancel",
        who: String(req.user?.name || "Admin").trim().slice(0, 80),
        order: order._id,
        orderRef: orderPublicRef(order._id),
      });
    }

    await recordAdminAction(req, {
      action: "Voided walk-in bill",
      subject: orderPublicRef(order._id),
      tab: "orders",
    });
    res.json(await Order.findById(order._id).populate("user", "name phone email walkIn").lean());
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createWalkIn,
  voidWalkIn,
  createWalkInCustomer,
  updateCustomerNote,
};
