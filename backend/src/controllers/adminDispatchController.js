/**
 * Read-only dispatch desk: who was asked to take a run, and whether they accepted.
 * Assignment still lives on the order (assign / accept / decline / clear).
 */
const mongoose = require("mongoose");
const Order = require("../models/Order");
const {
  getStoreOps,
  localParts,
  zonedInstant,
} = require("../services/storeOpsService");

const LIVE = ["ready_for_pickup", "shipped", "out_for_delivery"];
const SILENT_MS = 10 * 60 * 1000;
const PAGE = { min: 5, max: 100, fallback: 25 };
const RESULTS = new Set(["waiting", "silent", "accepted", "declined", "no_rider"]);
const isId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));
const toId = (value) => new mongoose.Types.ObjectId(String(value));

function publicRef(id) {
  const tail = String(id || "").slice(-5).toUpperCase();
  return tail ? `#KG-${tail}` : "";
}

async function shopDayStart(offsetDays = 0) {
  const { timezone } = await getStoreOps();
  const probe = new Date(Date.now() + offsetDays * 86400000);
  return zonedInstant(localParts(probe, timezone).dateKey, "00:00", timezone);
}

async function resolveRange(query) {
  switch (String(query.range || "today")) {
    case "7d":
      return { from: await shopDayStart(-6), to: null };
    case "30d":
      return { from: await shopDayStart(-29), to: null };
    case "today":
    default:
      return { from: await shopDayStart(0), to: null };
  }
}

function inRange(date, from, to) {
  const t = date ? new Date(date).getTime() : NaN;
  if (!Number.isFinite(t)) return false;
  if (from && t < from.getTime()) return false;
  if (to && t >= to.getTime()) return false;
  return true;
}

function offerOutcome(order, offer) {
  const offerAt = new Date(offer.at).getTime();
  const rider = String(offer.rider || "");
  const later = (order.dispatchAttempts || [])
    .filter((row) => String(row.rider || "") === rider && new Date(row.at).getTime() > offerAt)
    .sort((a, b) => new Date(a.at) - new Date(b.at));
  const next = later.find((row) => row.action === "accepted" || row.action === "declined" || row.action === "cleared");
  const secondsTo = (at) => Math.max(0, Math.round((new Date(at).getTime() - offerAt) / 1000));
  if (next?.action === "accepted") {
    return { result: "accepted", seconds: secondsTo(next.at), reason: "" };
  }
  if (next?.action === "declined") {
    return { result: "declined", seconds: secondsTo(next.at), reason: next.reason || order.deliveryDeclineReason || "" };
  }
  if (next?.action === "cleared") {
    return { result: "cleared", seconds: secondsTo(next.at), reason: "" };
  }
  const current = order.assignedDeliveryUser
    ? String(order.assignedDeliveryUser._id || order.assignedDeliveryUser)
    : "";
  if (current === rider && order.deliveryAcceptStatus === "pending") {
    const start = new Date(order.deliveryAssignedAt || offer.at).getTime();
    return { result: Date.now() - start >= SILENT_MS ? "silent" : "waiting", seconds: null, reason: "" };
  }
  if (current === rider && order.deliveryAcceptStatus === "accepted") {
    const acceptedAt = order.deliveryAcceptedAt;
    return { result: "accepted", seconds: acceptedAt ? secondsTo(acceptedAt) : null, reason: "" };
  }
  return { result: "cleared", seconds: null, reason: "" };
}

function presentOffer(order, offer, outcome) {
  return {
    id: `${order._id}:${new Date(offer.at).getTime()}:${offer.rider || "none"}`,
    orderId: String(order._id),
    at: offer.at,
    publicRef: publicRef(order._id),
    zone: order.deliveryZoneName || "",
    riderName: offer.riderName || "Rider",
    assignedBy: offer.by === "auto" ? "Auto" : "Admin",
    result: outcome.result,
    seconds: outcome.seconds,
    reason: outcome.reason || "",
  };
}

function presentNoRider(order) {
  return {
    id: `norider:${order._id}`,
    orderId: String(order._id),
    at: order.updatedAt || order.createdAt,
    publicRef: publicRef(order._id),
    zone: order.deliveryZoneName || "",
    riderName: "",
    assignedBy: "",
    result: "no_rider",
    seconds: null,
    reason: "",
  };
}

async function listAdminDispatch(req, res, next) {
  try {
    const { from, to } = await resolveRange(req.query);
    const zone = String(req.query.zone || "");
    const rider = String(req.query.rider || "");
    const result = RESULTS.has(String(req.query.result || "")) ? String(req.query.result) : "";
    const pageSize = Math.min(PAGE.max, Math.max(PAGE.min, Math.round(Number(req.query.pageSize)) || PAGE.fallback));

    const orderFilter = {};
    if (isId(zone)) orderFilter.deliveryZone = toId(zone);

    const noRiderFilter = {
      ...orderFilter,
      status: { $in: LIVE },
      assignedDeliveryUser: null,
    };
    if (from || to) {
      noRiderFilter.updatedAt = {};
      if (from) noRiderFilter.updatedAt.$gte = from;
      if (to) noRiderFilter.updatedAt.$lt = to;
    }

    const attemptFilter = { ...orderFilter, "dispatchAttempts.0": { $exists: true } };
    if (isId(rider)) attemptFilter["dispatchAttempts.rider"] = toId(rider);

    const [orders, noRiderCount, noRiderOrders] = await Promise.all([
      Order.find(attemptFilter)
        .select(
          "dispatchAttempts assignedDeliveryUser deliveryAcceptStatus deliveryAssignedAt deliveryAcceptedAt deliveryDeclineReason deliveryZone deliveryZoneName status updatedAt createdAt"
        )
        .lean(),
      isId(rider) ? Promise.resolve(0) : Order.countDocuments(noRiderFilter),
      result === "no_rider" && !isId(rider)
        ? Order.find(noRiderFilter).select("deliveryZone deliveryZoneName updatedAt createdAt status").lean()
        : Promise.resolve([]),
    ]);

    const offers = [];
    for (const order of orders) {
      for (const attempt of order.dispatchAttempts || []) {
        if (attempt.action !== "assigned") continue;
        if (!inRange(attempt.at, from, to)) continue;
        if (isId(rider) && String(attempt.rider) !== String(rider)) continue;
        const outcome = offerOutcome(order, attempt);
        offers.push(presentOffer(order, attempt, outcome));
      }
    }
    offers.sort((a, b) => new Date(b.at) - new Date(a.at));

    const noRiderRows = noRiderOrders.map(presentNoRider);
    noRiderRows.sort((a, b) => new Date(b.at) - new Date(a.at));

    const counts = {
      offers: offers.length,
      accepted: offers.filter((row) => row.result === "accepted").length,
      declined: offers.filter((row) => row.result === "declined").length,
      silent: offers.filter((row) => row.result === "silent").length,
      no_rider: noRiderCount,
    };

    let rows;
    if (result === "no_rider") rows = noRiderRows;
    else if (result) rows = offers.filter((row) => row.result === result);
    else rows = offers;

    const total = rows.length;
    const pages = Math.max(1, Math.ceil(total / pageSize) || 1);
    const page = Math.min(pages, Math.max(1, Math.round(Number(req.query.page)) || 1));
    const items = rows.slice((page - 1) * pageSize, page * pageSize);

    res.json({ items, total, page, pages, pageSize, counts });
  } catch (error) {
    next(error);
  }
}

module.exports = { listAdminDispatch };
