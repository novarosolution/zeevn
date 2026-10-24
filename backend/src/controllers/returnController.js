const mongoose = require("mongoose");
const Order = require("../models/Order");
const OrderReturn = require("../models/OrderReturn");
const User = require("../models/User");
const { restoreStockForOrderLines } = require("../utils/stock");

const STATUSES = ["pending", "approved", "rejected"];
const PAGE_SIZE = { min: 5, max: 100, fallback: 25 };
const isId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isCod = (order) => /cash|cod/i.test(String(order?.paymentMethod || ""));

function publicRef(order) {
  const id = String(order?._id || "").slice(-5).toUpperCase();
  return id ? `#KG-${id}` : "";
}

function lineKey(line) {
  const product = line?.product?._id || line?.product || "";
  return `${String(product)}|${String(line?.variantLabel || "").trim()}`;
}

function lineAmount(line) {
  return Math.max(0, Number(line.price || 0)) * Math.max(0, Number(line.quantity || 0));
}

function jarsLabel(lines = []) {
  return lines
    .map((line) => `${line.name || "Jar"}${line.variantLabel ? ` (${line.variantLabel})` : ""} × ${line.quantity}`)
    .join(", ");
}

function returnAmount(doc) {
  if (Number(doc.refundAmount) > 0) return Number(doc.refundAmount);
  return (doc.lines || []).reduce((sum, line) => sum + lineAmount(line), 0);
}

function actorName(user) {
  return String(user?.name || "Admin").trim().slice(0, 80);
}

async function approvedQtyByLine(orderId, exceptId) {
  const filter = { order: orderId, status: "approved" };
  if (exceptId) filter._id = { $ne: exceptId };
  const rows = await OrderReturn.find(filter).select("lines").lean();
  const map = new Map();
  for (const row of rows) {
    for (const line of row.lines || []) {
      const key = lineKey(line);
      map.set(key, (map.get(key) || 0) + Math.max(0, Number(line.quantity || 0)));
    }
  }
  return map;
}

function matchOrderLine(order, incoming) {
  const key = lineKey(incoming);
  const byKey = (order.products || []).find((line) => lineKey(line) === key);
  if (byKey) return byKey;
  const name = String(incoming.name || "").trim().toLowerCase();
  const variant = String(incoming.variantLabel || "").trim().toLowerCase();
  return (order.products || []).find(
    (line) =>
      String(line.name || "").trim().toLowerCase() === name &&
      String(line.variantLabel || "").trim().toLowerCase() === variant
  );
}

async function buildReturnLines(order, rawLines) {
  const wanted = Array.isArray(rawLines) ? rawLines : [];
  if (!wanted.length) {
    const err = new Error("Pick at least one jar to return.");
    err.statusCode = 400;
    throw err;
  }
  const approved = await approvedQtyByLine(order._id);
  const lines = [];
  for (const raw of wanted) {
    const qty = Math.round(Number(raw.quantity || 0));
    if (!Number.isFinite(qty) || qty < 1) {
      const err = new Error("Each returned jar needs a quantity of at least 1.");
      err.statusCode = 400;
      throw err;
    }
    const orderLine = matchOrderLine(order, raw);
    if (!orderLine) {
      const err = new Error("That jar is not on this order.");
      err.statusCode = 400;
      throw err;
    }
    const already = approved.get(lineKey(orderLine)) || 0;
    const max = Math.max(0, Number(orderLine.quantity || 0) - already);
    if (qty > max) {
      const err = new Error(
        max < 1
          ? `${orderLine.name} has already been returned.`
          : `You can return at most ${max} of ${orderLine.name}.`
      );
      err.statusCode = 400;
      throw err;
    }
    lines.push({
      product: orderLine.product || null,
      name: orderLine.name,
      variantLabel: orderLine.variantLabel || "",
      quantity: qty,
      price: Number(orderLine.price || 0),
    });
  }
  return lines;
}

async function pushOrderNote(order, user, text) {
  const clean = String(text || "").trim().slice(0, 500);
  if (!clean) return;
  if (!order.adminNotes) order.adminNotes = [];
  order.adminNotes.push({
    text: clean,
    by: user?._id || null,
    byName: actorName(user),
  });
  if (order.adminNotes.length > 100) order.adminNotes.splice(0, order.adminNotes.length - 100);
}

function present(doc, order) {
  const src = doc.toObject ? doc.toObject() : doc;
  const ord = order || src.order || {};
  const user = ord.user && typeof ord.user === "object" ? ord.user : null;
  return {
    ...src,
    amount: returnAmount(src),
    jars: jarsLabel(src.lines),
    publicRef: publicRef(ord),
    customerName: user?.name || ord.shippingAddress?.fullName || src.openedByName || "Customer",
    paymentMethod: ord.paymentMethod || "",
    paymentStatus: ord.paymentStatus || "",
    orderStatus: ord.status || "",
    orderId: ord._id ? String(ord._id) : String(src.order),
    orderTotal: Number(ord.totalPrice || 0),
    orderLines: ord.products || undefined,
  };
}

async function loadReturn(id) {
  return OrderReturn.findById(id).populate({
    path: "order",
    select: "status paymentMethod paymentStatus totalPrice shippingAddress products user",
    populate: { path: "user", select: "name phone" },
  });
}

async function createReturnForOrder(order, user, body, { allowRemarks = false } = {}) {
  if (String(order.status) !== "delivered") {
    const err = new Error("A return can only be opened on a delivered order.");
    err.statusCode = 400;
    throw err;
  }
  const pending = await OrderReturn.exists({ order: order._id, status: "pending" });
  if (pending) {
    const err = new Error("This order already has a return waiting for review.");
    err.statusCode = 400;
    throw err;
  }
  const reason = String(body?.reason || "").trim();
  if (!reason) {
    const err = new Error("Write a reason for the return.");
    err.statusCode = 400;
    throw err;
  }
  if (reason.length > 300) {
    const err = new Error("The reason can be at most 300 characters.");
    err.statusCode = 400;
    throw err;
  }
  const remarks = allowRemarks ? String(body?.remarks || "").trim().slice(0, 500) : "";
  const lines = await buildReturnLines(order, body?.lines);
  return OrderReturn.create({
    order: order._id,
    lines,
    reason,
    remarks,
    status: "pending",
    openedBy: user?._id || null,
    openedByName: actorName(user) || (order.shippingAddress?.fullName || "Customer").slice(0, 80),
  });
}

async function createMyReturn(req, res, next) {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ message: "Invalid order id." });
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found." });
    if (String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only return your own order." });
    }
    const doc = await createReturnForOrder(order, req.user, req.body);
    res.status(201).json(present(doc, order));
  } catch (error) {
    next(error);
  }
}

async function createAdminReturn(req, res, next) {
  try {
    const orderId = req.body?.orderId;
    if (!isId(orderId)) return res.status(400).json({ message: "Invalid order id." });
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found." });
    const doc = await createReturnForOrder(order, req.user, req.body, { allowRemarks: true });
    res.status(201).json(present(doc, order));
  } catch (error) {
    next(error);
  }
}

async function searchOrderIds(q) {
  const text = String(q || "").trim().slice(0, 80);
  if (text.length < 2) return null;
  const rx = new RegExp(escapeRegex(text), "i");
  const or = [{ "shippingAddress.fullName": rx }];
  const hex = text.replace(/^#?(?:kg-)?/i, "");
  if (/^[0-9a-f]{4,24}$/i.test(hex)) {
    or.push({ $expr: { $regexMatch: { input: { $toString: "$_id" }, regex: `${hex}$`, options: "i" } } });
  }
  const people = await User.find({ name: rx }).select("_id").limit(80).lean();
  if (people.length) or.push({ user: { $in: people.map((u) => u._id) } });
  const orders = await Order.find({ $or: or }).select("_id").limit(200).lean();
  return orders.map((row) => row._id);
}

async function listAdminReturns(req, res, next) {
  try {
    const status = String(req.query.status || "");
    const filter = {};
    if (STATUSES.includes(status)) filter.status = status;

    const orderIds = await searchOrderIds(req.query.q);
    if (orderIds) {
      if (!orderIds.length) {
        return res.json({
          items: [],
          total: 0,
          page: 1,
          pages: 1,
          pageSize: PAGE_SIZE.fallback,
          counts: { pending: 0, approved: 0, rejected: 0, all: 0 },
        });
      }
      filter.order = { $in: orderIds };
    }

    const pageSize = Math.min(
      PAGE_SIZE.max,
      Math.max(PAGE_SIZE.min, Math.round(Number(req.query.pageSize)) || PAGE_SIZE.fallback)
    );
    const tabFilter = { ...filter };
    delete tabFilter.status;
    const [total, pending, approved, rejected] = await Promise.all([
      OrderReturn.countDocuments(filter),
      OrderReturn.countDocuments({ ...tabFilter, status: "pending" }),
      OrderReturn.countDocuments({ ...tabFilter, status: "approved" }),
      OrderReturn.countDocuments({ ...tabFilter, status: "rejected" }),
    ]);
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(pages, Math.max(1, Math.round(Number(req.query.page)) || 1));
    const rows = await OrderReturn.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate({
        path: "order",
        select: "status paymentMethod paymentStatus totalPrice shippingAddress user",
        populate: { path: "user", select: "name phone" },
      })
      .lean();

    res.json({
      items: rows.map((row) => present(row, row.order)),
      total,
      page,
      pages,
      pageSize,
      counts: { pending, approved, rejected, all: pending + approved + rejected },
    });
  } catch (error) {
    next(error);
  }
}

async function getAdminReturn(req, res, next) {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid return id." });
    const doc = await loadReturn(req.params.id);
    if (!doc) return res.status(404).json({ message: "Return not found." });
    res.json(present(doc, doc.order));
  } catch (error) {
    next(error);
  }
}

async function approveReturn(req, res, next) {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid return id." });
    const doc = await OrderReturn.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Return not found." });
    if (doc.status !== "pending") {
      return res.status(400).json({ message: "This return has already been decided." });
    }
    const order = await Order.findById(doc.order).select("+adminNotes");
    if (!order) return res.status(404).json({ message: "Order not found." });

    const amount = (doc.lines || []).reduce((sum, line) => sum + lineAmount(line), 0);
    const wasCodPending = isCod(order) && order.paymentStatus === "pending";
    doc.status = "approved";
    doc.refundAmount = Math.round(amount * 100) / 100;
    doc.remarks = String(req.body?.remarks || doc.remarks || "").trim().slice(0, 500);
    doc.decidedBy = req.user?._id || null;
    doc.decidedByName = actorName(req.user);
    doc.decidedAt = new Date();
    await doc.save();

    await restoreStockForOrderLines(doc.lines, {
      why: "return",
      who: actorName(req.user),
      order: order._id,
      orderRef: publicRef(order),
    });

    const others = await OrderReturn.find({
      order: order._id,
      status: "approved",
      _id: { $ne: doc._id },
    })
      .select("refundAmount lines")
      .lean();
    const covered =
      doc.refundAmount + others.reduce((sum, row) => sum + returnAmount(row), 0);
    const owed = Number(order.totalPrice || 0);
    const canMarkRefunded =
      owed > 0 &&
      covered + 0.001 >= owed &&
      (order.paymentStatus === "paid" || wasCodPending);
    if (canMarkRefunded) {
      order.paymentStatus = "refunded";
      if (order.invoice) {
        order.invoice.status = "void";
        order.invoice.updatedAt = new Date();
      }
    }

    pushOrderNote(order, req.user, `Return approved — ${jarsLabel(doc.lines)}`);
    await order.save();

    const rupees = Math.round(doc.refundAmount);
    const message = wasCodPending
      ? `Cash to collect drops by ₹${rupees}. Do not send money.`
      : `Send ₹${rupees} back to the customer. The app does not refund YouPI or UPI by itself.`;

    const fresh = await loadReturn(doc._id);
    res.json({ ...present(fresh, fresh.order), message });
  } catch (error) {
    next(error);
  }
}

async function rejectReturn(req, res, next) {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid return id." });
    const remarks = String(req.body?.remarks || "").trim();
    if (!remarks) return res.status(400).json({ message: "Write remarks before rejecting." });
    if (remarks.length > 500) return res.status(400).json({ message: "Remarks can be at most 500 characters." });

    const doc = await OrderReturn.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Return not found." });
    if (doc.status !== "pending") {
      return res.status(400).json({ message: "This return has already been decided." });
    }
    const order = await Order.findById(doc.order).select("+adminNotes");
    if (!order) return res.status(404).json({ message: "Order not found." });

    doc.status = "rejected";
    doc.remarks = remarks;
    doc.decidedBy = req.user?._id || null;
    doc.decidedByName = actorName(req.user);
    doc.decidedAt = new Date();
    await doc.save();

    pushOrderNote(order, req.user, `Return rejected — ${remarks}`);
    await order.save();

    const fresh = await loadReturn(doc._id);
    res.json(present(fresh, fresh.order));
  } catch (error) {
    next(error);
  }
}

/** Attach the newest return and remaining returnable qty onto customer order payloads. */
async function decorateMyOrdersWithReturns(orders = []) {
  if (!orders.length) return orders;
  const ids = orders.map((order) => order._id);
  const rows = await OrderReturn.find({ order: { $in: ids } }).sort({ createdAt: -1 }).lean();
  const byOrder = new Map();
  for (const row of rows) {
    const key = String(row.order);
    if (!byOrder.has(key)) byOrder.set(key, []);
    byOrder.get(key).push(row);
  }
  return orders.map((order) => {
    const json = typeof order.toObject === "function" ? order.toObject() : { ...order };
    const list = byOrder.get(String(order._id)) || [];
    const approved = new Map();
    for (const row of list.filter((r) => r.status === "approved")) {
      for (const line of row.lines || []) {
        approved.set(lineKey(line), (approved.get(lineKey(line)) || 0) + Number(line.quantity || 0));
      }
    }
    json.returnRequest = list[0]
      ? {
          _id: list[0]._id,
          status: list[0].status,
          reason: list[0].reason,
          remarks: list[0].remarks,
          lines: list[0].lines,
          refundAmount: returnAmount(list[0]),
          createdAt: list[0].createdAt,
        }
      : null;
    json.hasPendingReturn = list.some((row) => row.status === "pending");
    json.returnable = (json.products || []).map((line) => {
      const used = approved.get(lineKey(line)) || 0;
      return {
        product: line.product?._id || line.product || null,
        name: line.name,
        variantLabel: line.variantLabel || "",
        price: Number(line.price || 0),
        quantity: Number(line.quantity || 0),
        available: Math.max(0, Number(line.quantity || 0) - used),
      };
    });
    return json;
  });
}

module.exports = {
  createMyReturn,
  createAdminReturn,
  listAdminReturns,
  getAdminReturn,
  approveReturn,
  rejectReturn,
  decorateMyOrdersWithReturns,
};
