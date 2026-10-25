/**
 * Admin desk read models and switches: the paged order search the desk lists run on, the counters behind the
 * sidebar badges, zone and rider rollups, and the store-operations settings (pause orders, hours, minimum order…).
 * Writes to orders themselves live in orderController; this file never changes an order.
 */
const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const DeliveryZone = require("../models/DeliveryZone");
const SupportThread = require("../models/SupportThread");
const OrderReturn = require("../models/OrderReturn");
const StoreSettings = require("../models/StoreSettings");
const { ORDER_STATUS_VALUES } = require("../constants/orderStatuses");
const { cleanMapCoord } = require("../utils/shopLocation");
const {
  getStoreOps,
  evaluateOpen,
  readOps,
  readContact,
  readBusiness,
  applyStoreOpsPatch,
  invalidateStoreOpsCache,
  localParts,
  zonedInstant,
} = require("../services/storeOpsService");
const { recordAdminAction } = require("../utils/adminLog");

const LIVE_STATUSES = ["ready_for_pickup", "shipped", "out_for_delivery"];
const ON_THE_WAY = ["out_for_delivery", "shipped"];
const OPEN_STATUSES = ["pending", "confirmed", "paid", "preparing", "ready_for_pickup", "shipped", "out_for_delivery"];
/** Handy groups the desk tabs ask for; any raw status value works too. */
const STATUS_BUCKETS = {
  active: OPEN_STATUSES,
  new: ["pending"],
  packing: ["confirmed", "paid", "preparing"],
  ready: ["ready_for_pickup"],
  onroute: ON_THE_WAY,
  unpaid: ["pending_payment"],
};
/** Delivered cash-on-delivery orders whose cash has not been marked collected. */
const CASH_DUE = { status: "delivered", paymentMethod: "Cash on Delivery", paymentStatus: "pending", channel: { $ne: "walk_in" } };
const STALE_MINUTES = 10;
const ONLINE_WINDOW_MS = 15 * 60 * 1000;
const PAGE_SIZES = { min: 5, max: 100, fallback: 25 };
const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  amount_high: { totalPrice: -1, createdAt: -1 },
  amount_low: { totalPrice: 1, createdAt: -1 },
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));
const toId = (value) => new mongoose.Types.ObjectId(String(value));

function statusesFor(raw) {
  const out = [];
  for (const part of String(raw || "").split(",").map((s) => s.trim()).filter(Boolean)) {
    if (STATUS_BUCKETS[part]) out.push(...STATUS_BUCKETS[part]);
    else if (ORDER_STATUS_VALUES.includes(part)) out.push(part);
  }
  return [...new Set(out)];
}

/* ------------------------------ time helpers ------------------------------ */

/** Midnight at the start of the shop's day (shop time zone), `offsetDays` away from today. */
async function shopDayStart(offsetDays = 0) {
  const { timezone } = await getStoreOps();
  const probe = new Date(Date.now() + offsetDays * 86400000);
  return zonedInstant(localParts(probe, timezone).dateKey, "00:00", timezone);
}

/** A `YYYY-MM-DD` day (or full ISO time) as an instant; `endExclusive` returns the start of the next day. */
async function parseBoundary(value, endExclusive) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (day) {
    const { timezone } = await getStoreOps();
    const [, y, m, d] = day.map(Number);
    const key = endExclusive
      ? new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10)
      : raw;
    return zonedInstant(key, "00:00", timezone);
  }
  const when = new Date(raw);
  return Number.isNaN(when.getTime()) ? null : when;
}

async function resolveRange(query) {
  switch (String(query.range || "")) {
    case "today":
      return { from: await shopDayStart(0), to: null };
    case "yesterday":
      return { from: await shopDayStart(-1), to: await shopDayStart(0) };
    case "7d":
      return { from: await shopDayStart(-6), to: null };
    case "30d":
      return { from: await shopDayStart(-29), to: null };
    default:
      return { from: await parseBoundary(query.from, false), to: await parseBoundary(query.to, true) };
  }
}

/* ------------------------------ order search ------------------------------ */

/** Orders that are stuck: nobody picked a new one up, no rider, rider silent, or running late. */
function attentionClause(now = new Date()) {
  const stale = new Date(now.getTime() - STALE_MINUTES * 60000);
  return {
    $or: [
      { status: "pending", createdAt: { $lte: stale } },
      { status: { $in: LIVE_STATUSES }, assignedDeliveryUser: null },
      {
        status: { $in: LIVE_STATUSES },
        assignedDeliveryUser: { $ne: null },
        deliveryAcceptStatus: "pending",
        deliveryAssignedAt: { $lte: stale },
      },
      { status: { $in: ON_THE_WAY }, "tracking.promisedAt": { $ne: null, $lt: now } },
    ],
  };
}

/** The one reason an order needs a human, as a code + label the desk can badge. */
function attentionFlag(order, now = new Date()) {
  const minutesSince = (date) => (date ? Math.max(0, Math.round((now - new Date(date)) / 60000)) : 0);
  const status = String(order.status);

  if (LIVE_STATUSES.includes(status) && !order.assignedDeliveryUser) {
    return order.deliveryAcceptStatus === "declined"
      ? { code: "declined", label: "Rider declined — pick another" }
      : { code: "no_rider", label: "No rider yet" };
  }
  if (
    LIVE_STATUSES.includes(status) &&
    order.assignedDeliveryUser &&
    order.deliveryAcceptStatus === "pending" &&
    minutesSince(order.deliveryAssignedAt) >= STALE_MINUTES
  ) {
    return { code: "rider_silent", label: `Rider hasn't accepted (${minutesSince(order.deliveryAssignedAt)} min)` };
  }
  if (ON_THE_WAY.includes(status) && order.tracking?.promisedAt && new Date(order.tracking.promisedAt) < now) {
    return { code: "late", label: `Running ${minutesSince(order.tracking.promisedAt)} min late` };
  }
  if (status === "pending" && minutesSince(order.createdAt) >= STALE_MINUTES) {
    return { code: "waiting", label: `Waiting ${minutesSince(order.createdAt)} min` };
  }
  if (order.status === CASH_DUE.status && order.paymentMethod === CASH_DUE.paymentMethod && order.paymentStatus === "pending") {
    return { code: "cash_due", label: "Cash to collect" };
  }
  return null;
}

/** Filter clauses shared by the list, the totals and the tab counts (everything except status + attention). */
async function buildBaseClauses(query) {
  const clauses = [];

  const q = String(query.q || "").trim().slice(0, 80);
  if (q.length >= 2) {
    const rx = new RegExp(escapeRegex(q), "i");
    const or = [
      { "shippingAddress.fullName": rx },
      { "shippingAddress.phone": rx },
      { "shippingAddress.city": rx },
      { "shippingAddress.postalCode": rx },
      { "shippingAddress.line1": rx },
      { "products.name": rx },
      { "invoice.number": rx },
      { "tracking.trackingId": rx },
      { deliveryZoneName: rx },
    ];
    // Orders show as "#KG-3A9F1" (last 5 of the id); accept that, "#3a9f1" or the bare hex tail.
    const hex = q.replace(/^#?(?:kg-)?/i, "");
    if (/^[0-9a-f]{4,24}$/i.test(hex)) {
      or.push({ $expr: { $regexMatch: { input: { $toString: "$_id" }, regex: `${hex}$`, options: "i" } } });
    }
    const people = await User.find({ $or: [{ name: rx }, { email: rx }, { phone: rx }] })
      .select("_id")
      .limit(100)
      .lean();
    if (people.length) or.push({ user: { $in: people.map((u) => u._id) } });
    clauses.push({ $or: or });
  }

  const payment = String(query.payment || "");
  if (["pending", "paid", "failed", "refunded"].includes(payment)) clauses.push({ paymentStatus: payment });
  else if (payment === "cod") clauses.push({ paymentMethod: "Cash on Delivery" });
  else if (payment === "online") clauses.push({ paymentMethod: { $in: ["Razorpay", "YouPI"] } });
  else if (payment === "cod_due") clauses.push({ ...CASH_DUE });

  const zone = String(query.zone || "");
  if (zone === "none") clauses.push({ deliveryZone: null });
  else if (isId(zone)) clauses.push({ deliveryZone: toId(zone) });

  const rider = String(query.rider || "");
  if (rider === "unassigned") {
    clauses.push({ assignedDeliveryUser: null, status: { $nin: ["delivered", "cancelled"] } });
  } else if (isId(rider)) {
    clauses.push({ assignedDeliveryUser: toId(rider) });
  }

  const customer = String(query.user || "");
  if (isId(customer)) clauses.push({ user: toId(customer) });

  const channel = String(query.channel || "");
  if (channel === "walk_in" || channel === "online") clauses.push({ channel });

  const { from, to } = await resolveRange(query);
  if (from || to) {
    const range = {};
    if (from) range.$gte = from;
    if (to) range.$lt = to;
    clauses.push({ createdAt: range });
  }

  return clauses;
}

const allOf = (clauses) => (clauses.length ? { $and: clauses } : {});

async function searchAdminOrders(req, res, next) {
  try {
    const now = new Date();
    const base = await buildBaseClauses(req.query);
    const filterClauses = [...base];

    const statuses = statusesFor(req.query.status);
    if (statuses.length) filterClauses.push({ status: { $in: statuses } });
    const wantsAttention = ["1", "true"].includes(String(req.query.attention || ""));
    if (wantsAttention) filterClauses.push(attentionClause(now));

    const filter = allOf(filterClauses);
    const baseFilter = allOf(base);

    const pageSize = Math.min(
      PAGE_SIZES.max,
      Math.max(PAGE_SIZES.min, Math.round(Number(req.query.pageSize)) || PAGE_SIZES.fallback)
    );
    const sort = SORTS[String(req.query.sort || "")] || SORTS.newest;

    const [total, totals, byStatusRows, attention, cashDue, walkIn] = await Promise.all([
      Order.countDocuments(filter),
      Order.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            revenue: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 0, "$totalPrice"] } },
          },
        },
      ]),
      Order.aggregate([{ $match: baseFilter }, { $group: { _id: "$status", n: { $sum: 1 } } }]),
      Order.countDocuments(allOf([...base, attentionClause(now)])),
      Order.countDocuments(allOf([...base, { ...CASH_DUE }])),
      Order.countDocuments(allOf([...base, { channel: "walk_in" }])),
    ]);

    const pages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(pages, Math.max(1, Math.round(Number(req.query.page)) || 1));

    const rows = await Order.find(filter)
      .select("-statusHistory -razorpay.signature +adminNotes")
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate("user", "name email phone")
      .populate("assignedDeliveryUser", "name phone")
      .populate("products.product", "name image")
      .lean();

    const items = rows.map((row) => {
      const { adminNotes, ...order } = row;
      return { ...order, noteCount: Array.isArray(adminNotes) ? adminNotes.length : 0, flag: attentionFlag(order, now) };
    });

    const byStatus = {};
    for (const row of byStatusRows) byStatus[row._id] = row.n;

    res.json({
      items,
      total,
      page,
      pageSize,
      pages,
      counts: {
        all: Object.values(byStatus).reduce((sum, n) => sum + n, 0),
        byStatus,
        attention,
        cashDue,
        walkIn,
      },
      totals: { count: total, revenue: Math.round((totals[0]?.revenue || 0) * 100) / 100 },
    });
  } catch (error) {
    next(error);
  }
}

/* ------------------------------ desk summary ------------------------------ */

/** One call for the sidebar badges and the dashboard strip. */
async function getDeskSummary(req, res, next) {
  try {
    const now = new Date();
    const dayStart = await shopDayStart(0);
    const [byStatusRows, attention, cashDue, today, deliveredToday, awaitingReply, lowStock, outOfStock, ridersTotal, ridersOnline, pendingReturns, ops, counterToday] =
      await Promise.all([
        Order.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
        Order.countDocuments(attentionClause(now)),
        Order.countDocuments({ ...CASH_DUE }),
        Order.aggregate([
          { $match: { createdAt: { $gte: dayStart }, status: { $ne: "cancelled" } } },
          { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: "$totalPrice" } } },
        ]),
        Order.countDocuments({
          status: "delivered",
          statusHistory: { $elemMatch: { status: "delivered", at: { $gte: dayStart } } },
        }),
        SupportThread.countDocuments({
          status: "open",
          "messages.0": { $exists: true },
          $expr: { $ne: [{ $arrayElemAt: ["$messages.senderRole", -1] }, "admin"] },
        }),
        Product.countDocuments({
          $or: [
            { inStock: true, stockQty: { $gt: 0, $lte: 5 } },
            { stockCounter: { $gt: 0, $lte: 5 } },
          ],
        }),
        Product.countDocuments({ $or: [{ inStock: false }, { stockQty: { $lte: 0 } }] }),
        User.countDocuments({ isDeliveryPartner: true }),
        User.countDocuments({
          isDeliveryPartner: true,
          "deliveryLiveLocation.updatedAt": { $gte: new Date(now.getTime() - ONLINE_WINDOW_MS) },
        }),
        OrderReturn.countDocuments({ status: "pending" }),
        getStoreOps({ fresh: true }),
        Order.aggregate([
          { $match: { createdAt: { $gte: dayStart }, channel: "walk_in", status: { $ne: "cancelled" } } },
          { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: "$totalPrice" } } },
        ]),
      ]);

    const byStatus = {};
    for (const row of byStatusRows) byStatus[row._id] = row.n;
    const sum = (list) => list.reduce((total, status) => total + (byStatus[status] || 0), 0);
    const state = evaluateOpen(ops, now);

    res.json({
      generatedAt: now.toISOString(),
      store: {
        open: state.open,
        reason: state.reason,
        message: state.message,
        nextOpenAt: state.nextOpenAt ? state.nextOpenAt.toISOString() : null,
        acceptingOrders: ops.acceptingOrders,
        autoSchedule: ops.autoSchedule,
      },
      orders: {
        byStatus,
        unpaid: sum(STATUS_BUCKETS.unpaid),
        new: sum(STATUS_BUCKETS.new),
        packing: sum(STATUS_BUCKETS.packing),
        ready: sum(STATUS_BUCKETS.ready),
        onRoute: sum(STATUS_BUCKETS.onroute),
        active: sum(STATUS_BUCKETS.active),
        attention,
        cashDue,
        today: { count: today[0]?.count || 0, revenue: Math.round((today[0]?.revenue || 0) * 100) / 100 },
        deliveredToday,
        counterToday: { count: counterToday[0]?.count || 0, revenue: Math.round((counterToday[0]?.revenue || 0) * 100) / 100 },
      },
      support: { awaitingReply },
      returns: { pending: pendingReturns },
      catalog: { lowStock, outOfStock },
      riders: { total: ridersTotal, online: ridersOnline },
    });
  } catch (error) {
    next(error);
  }
}

/* ------------------------------ zones + riders ------------------------------ */

/** Per-zone performance over the last N days, plus orders that were served outside any drawn zone. */
async function getZoneStats(req, res, next) {
  try {
    const days = Math.min(365, Math.max(1, Math.round(Number(req.query.days)) || 30));
    const since = new Date(Date.now() - days * 86400000);

    const rows = await Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $addFields: {
          deliveredAt: {
            $arrayElemAt: [
              {
                $map: {
                  input: {
                    $filter: { input: "$statusHistory", as: "e", cond: { $eq: ["$$e.status", "delivered"] } },
                  },
                  as: "d",
                  in: "$$d.at",
                },
              },
              0,
            ],
          },
        },
      },
      {
        $group: {
          _id: "$deliveryZone",
          orders: { $sum: 1 },
          delivered: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
          active: { $sum: { $cond: [{ $in: ["$status", OPEN_STATUSES] }, 1, 0] } },
          revenue: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 0, "$totalPrice"] } },
          avgMinutes: {
            $avg: {
              $cond: [
                { $and: [{ $eq: ["$status", "delivered"] }, { $ne: [{ $type: "$deliveredAt" }, "missing"] }] },
                { $divide: [{ $subtract: ["$deliveredAt", "$createdAt"] }, 60000] },
                null,
              ],
            },
          },
          lastOrderAt: { $max: "$createdAt" },
        },
      },
    ]);

    const zones = {};
    let uncovered = { orders: 0, revenue: 0 };
    for (const row of rows) {
      const stat = {
        orders: row.orders,
        delivered: row.delivered,
        cancelled: row.cancelled,
        active: row.active,
        revenue: Math.round(row.revenue * 100) / 100,
        avgMinutes: row.avgMinutes == null ? null : Math.round(row.avgMinutes),
        lastOrderAt: row.lastOrderAt,
      };
      if (row._id) zones[String(row._id)] = stat;
      else uncovered = { orders: stat.orders, revenue: stat.revenue };
    }
    res.json({ days, zones, uncovered });
  } catch (error) {
    next(error);
  }
}

/** Every delivery partner with load, today's deliveries, the zones they cover and their last GPS ping. */
async function listRiders(req, res, next) {
  try {
    const now = Date.now();
    const dayStart = await shopDayStart(0);
    const [riders, loads, doneToday, zones] = await Promise.all([
      User.find({ isDeliveryPartner: true }).select("name email phone deliveryLiveLocation").sort({ name: 1 }).lean(),
      Order.aggregate([
        { $match: { assignedDeliveryUser: { $ne: null }, status: { $in: LIVE_STATUSES } } },
        {
          $group: {
            _id: "$assignedDeliveryUser",
            active: { $sum: 1 },
            awaitingAccept: { $sum: { $cond: [{ $eq: ["$deliveryAcceptStatus", "pending"] }, 1, 0] } },
          },
        },
      ]),
      Order.aggregate([
        { $match: { assignedDeliveryUser: { $ne: null }, status: "delivered", updatedAt: { $gte: dayStart } } },
        { $group: { _id: "$assignedDeliveryUser", n: { $sum: 1 } } },
      ]),
      DeliveryZone.find({ "partnerIds.0": { $exists: true } }).select("name partnerIds").lean(),
    ]);

    const loadMap = new Map(loads.map((r) => [String(r._id), r]));
    const doneMap = new Map(doneToday.map((r) => [String(r._id), r.n]));
    const zoneMap = new Map();
    for (const zone of zones) {
      for (const pid of zone.partnerIds || []) {
        const key = String(pid);
        if (!zoneMap.has(key)) zoneMap.set(key, []);
        zoneMap.get(key).push({ _id: zone._id, name: zone.name });
      }
    }

    res.json(
      riders.map((rider) => {
        const key = String(rider._id);
        const loc = rider.deliveryLiveLocation || {};
        const at = loc.updatedAt ? new Date(loc.updatedAt).getTime() : null;
        const lat = cleanMapCoord(loc.latitude);
        const lng = cleanMapCoord(loc.longitude);
        const hasPoint = lat != null && lng != null;
        const ageSeconds = at == null ? null : Math.max(0, Math.round((now - at) / 1000));
        return {
          _id: rider._id,
          name: rider.name || "",
          email: rider.email || "",
          phone: rider.phone || "",
          active: loadMap.get(key)?.active || 0,
          awaitingAccept: loadMap.get(key)?.awaitingAccept || 0,
          deliveredToday: doneMap.get(key) || 0,
          zones: zoneMap.get(key) || [],
          location: hasPoint ? { latitude: lat, longitude: lng, updatedAt: loc.updatedAt, ageSeconds } : null,
          online: hasPoint && ageSeconds != null && ageSeconds * 1000 <= ONLINE_WINDOW_MS,
        };
      })
    );
  } catch (error) {
    next(error);
  }
}

/* ------------------------------ store operations ------------------------------ */

function storeOpsPayload(doc) {
  const ops = readOps(doc);
  const state = evaluateOpen(ops);
  return {
    ops: { ...ops, reopenAt: ops.reopenAt ? ops.reopenAt.toISOString() : null },
    contact: readContact(doc),
    business: readBusiness(doc),
    status: {
      open: state.open,
      reason: state.reason,
      message: state.message,
      nextOpenAt: state.nextOpenAt ? state.nextOpenAt.toISOString() : null,
    },
    updatedAt: doc.updatedAt || null,
  };
}

async function getStoreOpsSettings(req, res, next) {
  try {
    res.json(storeOpsPayload(await StoreSettings.get()));
  } catch (error) {
    next(error);
  }
}

async function updateStoreOpsSettings(req, res, next) {
  try {
    const doc = await StoreSettings.get();
    const problem = applyStoreOpsPatch(doc, req.body || {});
    if (problem) return res.status(400).json({ message: problem });
    await doc.save();
    invalidateStoreOpsCache();
    await recordAdminAction(req, {
      action: "Saved settings",
      subject: "Settings",
      tab: "shop",
      href: { screen: "AdminSettings" },
    });
    res.json(storeOpsPayload(doc));
  } catch (error) {
    next(error);
  }
}

/* ------------------------------ cash to collect ------------------------------ */

function cashPublicRef(id) {
  const tail = String(id || "").slice(-5).toUpperCase();
  return tail ? `#KG-${tail}` : "";
}

function deliveredAtOf(order) {
  const events = (order.statusHistory || []).filter((row) => row.status === "delivered" && row.at);
  if (events.length) return events[events.length - 1].at;
  return order.updatedAt || order.createdAt || null;
}

function inCashRange(date, from, to) {
  const t = date ? new Date(date).getTime() : NaN;
  if (!Number.isFinite(t)) return false;
  if (from && t < from.getTime()) return false;
  if (to && t >= to.getTime()) return false;
  return true;
}

async function cashWindow(query) {
  switch (String(query.range || "today")) {
    case "all":
      return { from: null, to: null };
    case "7d":
      return { from: await shopDayStart(-6), to: null };
    case "30d":
      return { from: await shopDayStart(-29), to: null };
    case "today":
    default:
      return { from: await shopDayStart(0), to: null };
  }
}

/** Delivered COD still pending, minus approved return refunds. Does not write an order. */
async function listCashDue(req, res, next) {
  try {
    const { from, to } = await cashWindow(req.query);
    const q = String(req.query.q || "").trim().toLowerCase();
    const riderFilter = String(req.query.rider || "");
    const pageSize = Math.min(PAGE_SIZES.max, Math.max(PAGE_SIZES.min, Math.round(Number(req.query.pageSize)) || PAGE_SIZES.fallback));

    const rows = await Order.find({ ...CASH_DUE })
      .select("totalPrice shippingAddress assignedDeliveryUser deliveryZoneName user createdAt updatedAt statusHistory")
      .populate("assignedDeliveryUser", "name")
      .populate("user", "name phone")
      .lean();

    const refunds = await OrderReturn.aggregate([
      { $match: { order: { $in: rows.map((row) => row._id) }, status: "approved" } },
      { $group: { _id: "$order", amount: { $sum: "$refundAmount" } } },
    ]);
    const refundByOrder = new Map(refunds.map((row) => [String(row._id), Number(row.amount) || 0]));

    const due = [];
    for (const order of rows) {
      const amountDue = Math.max(0, Math.round(Number(order.totalPrice || 0) - (refundByOrder.get(String(order._id)) || 0)));
      if (amountDue < 1) continue;
      const deliveredAt = deliveredAtOf(order);
      if ((from || to) && !inCashRange(deliveredAt, from, to)) continue;
      const rider = order.assignedDeliveryUser;
      const riderId = rider ? String(rider._id || rider) : "";
      const customer = order.user?.name || order.shippingAddress?.fullName || "Guest";
      const phone = order.shippingAddress?.phone || order.user?.phone || "";
      const publicRef = cashPublicRef(order._id);
      if (q) {
        const hay = [publicRef, customer, phone, String(order._id)].join(" ").toLowerCase();
        if (!hay.includes(q) && !String(order._id).toLowerCase().endsWith(q.replace(/^#?(?:kg-)?/, ""))) continue;
      }
      due.push({
        _id: String(order._id),
        publicRef,
        customer,
        phone,
        riderId,
        riderName: rider?.name || "",
        zone: order.deliveryZoneName || "",
        deliveredAt,
        amountDue,
      });
    }

    const byRiderMap = new Map();
    for (const row of due) {
      const key = row.riderId || "none";
      const cur = byRiderMap.get(key) || { id: row.riderId, name: row.riderName || "No rider", count: 0, amount: 0 };
      cur.count += 1;
      cur.amount += row.amountDue;
      byRiderMap.set(key, cur);
    }
    const byRider = [...byRiderMap.values()].sort((a, b) => {
      if (!a.id && b.id) return 1;
      if (a.id && !b.id) return -1;
      return b.amount - a.amount;
    });

    const filtered = riderFilter === "none"
      ? due.filter((row) => !row.riderId)
      : riderFilter
        ? due.filter((row) => row.riderId === riderFilter)
        : due;
    filtered.sort((a, b) => new Date(b.deliveredAt || 0) - new Date(a.deliveredAt || 0));

    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / pageSize) || 1);
    const page = Math.min(pages, Math.max(1, Math.round(Number(req.query.page)) || 1));
    const items = filtered.slice((page - 1) * pageSize, page * pageSize);

    res.json({
      items,
      total,
      page,
      pages,
      pageSize,
      counts: {
        toCollect: due.length,
        amount: due.reduce((sum, row) => sum + row.amountDue, 0),
        byRider,
      },
    });
  } catch (error) {
    next(error);
  }
}

/* ------------------------------ rider performance ------------------------------ */

function riderDeclinedOrder(order, riderId) {
  if (!order.deliveryDeclinedAt) return false;
  const ids = (order.deliveryDeclinedBy || []).map((id) => String(id));
  if (ids.includes(riderId)) return true;
  const last = [...(order.dispatchAttempts || [])].reverse().find((row) => row.action === "declined");
  return Boolean(last && String(last.rider || "") === riderId);
}

function blankPerformance(rider) {
  return {
    _id: String(rider._id),
    name: rider.name || "—",
    phone: rider.phone || "",
    delivered: 0,
    deliveredAmount: 0,
    onTime: 0,
    late: 0,
    acceptMinutes: null,
    declined: 0,
    cashCollected: 0,
    cashDue: 0,
    _acceptSum: 0,
    _acceptCount: 0,
  };
}

/** How each rider did in a window. Does not score them or write an order. */
async function listRiderPerformance(req, res, next) {
  try {
    const range = ["7d", "30d"].includes(String(req.query.range)) ? String(req.query.range) : "today";
    const { from, to } = await cashWindow({ range });
    const riders = await User.find({ isDeliveryPartner: true }).select("name phone").sort({ name: 1 }).lean();
    const rows = new Map(riders.map((rider) => [String(rider._id), blankPerformance(rider)]));
    if (!riders.length) {
      return res.json({ range, from, items: [] });
    }

    const ids = riders.map((rider) => rider._id);
    const time = {};
    if (from) time.$gte = from;
    if (to) time.$lt = to;
    const orders = await Order.find({
      $or: [
        { assignedDeliveryUser: { $in: ids }, status: "delivered", statusHistory: { $elemMatch: { status: "delivered", at: time } } },
        { assignedDeliveryUser: { $in: ids }, status: "delivered", updatedAt: time },
        { assignedDeliveryUser: { $in: ids }, deliveryAcceptedAt: time },
        { deliveryDeclinedBy: { $in: ids }, deliveryDeclinedAt: time },
      ],
    })
      .select("assignedDeliveryUser deliveryDeclinedBy deliveryDeclinedAt deliveryAssignedAt deliveryAcceptedAt status totalPrice paymentMethod paymentStatus tracking.promisedAt statusHistory dispatchAttempts")
      .lean();

    const refunds = await OrderReturn.aggregate([
      { $match: { order: { $in: orders.map((order) => order._id) }, status: "approved" } },
      { $group: { _id: "$order", amount: { $sum: "$refundAmount" } } },
    ]);
    const refundByOrder = new Map(refunds.map((row) => [String(row._id), Number(row.amount) || 0]));

    for (const order of orders) {
      const assignedId = order.assignedDeliveryUser ? String(order.assignedDeliveryUser) : "";
      const deliveredAt = deliveredAtOf(order);
      const deliveredInRange = order.status === "delivered" && inCashRange(deliveredAt, from, to);
      const due = Math.max(0, Math.round(Number(order.totalPrice || 0) - (refundByOrder.get(String(order._id)) || 0)));
      const promised = order.tracking?.promisedAt ? new Date(order.tracking.promisedAt).getTime() : NaN;

      if (assignedId && rows.has(assignedId) && deliveredInRange) {
        const row = rows.get(assignedId);
        row.delivered += 1;
        row.deliveredAmount += Math.round(Number(order.totalPrice || 0));
        if (Number.isFinite(promised) && deliveredAt) {
          if (new Date(deliveredAt).getTime() <= promised) row.onTime += 1;
          else row.late += 1;
        }
        if (order.paymentMethod === CASH_DUE.paymentMethod && due > 0) {
          if (order.paymentStatus === "paid") row.cashCollected += due;
          else if (order.paymentStatus === "pending") row.cashDue += due;
        }
      }

      if (
        assignedId &&
        rows.has(assignedId) &&
        order.deliveryAssignedAt &&
        order.deliveryAcceptedAt &&
        inCashRange(order.deliveryAcceptedAt, from, to)
      ) {
        const row = rows.get(assignedId);
        const minutes = (new Date(order.deliveryAcceptedAt) - new Date(order.deliveryAssignedAt)) / 60000;
        if (Number.isFinite(minutes) && minutes >= 0) {
          row._acceptSum += minutes;
          row._acceptCount += 1;
        }
      }

      if (inCashRange(order.deliveryDeclinedAt, from, to)) {
        for (const [riderId, row] of rows) {
          if (riderDeclinedOrder(order, riderId)) row.declined += 1;
        }
      }
    }

    const items = [...rows.values()]
      .map((row) => {
        const acceptMinutes = row._acceptCount ? Math.round(row._acceptSum / row._acceptCount) : null;
        delete row._acceptSum;
        delete row._acceptCount;
        return { ...row, acceptMinutes };
      })
      .sort((a, b) => b.delivered - a.delivered || String(a.name).localeCompare(String(b.name)));

    res.json({ range, from, items });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  searchAdminOrders,
  getDeskSummary,
  getZoneStats,
  listRiders,
  listCashDue,
  listRiderPerformance,
  getStoreOpsSettings,
  updateStoreOpsSettings,
};
