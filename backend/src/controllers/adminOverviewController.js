const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const DeliveryZone = require("../models/DeliveryZone");
const SupportThread = require("../models/SupportThread");
const StoreSettings = require("../models/StoreSettings");
const { getStoreOps, evaluateOpen, localParts, zonedInstant } = require("../services/storeOpsService");

const TO_DELIVER = ["pending", "confirmed", "preparing", "ready_for_pickup", "out_for_delivery", "paid", "shipped"];
const LOW_STOCK_MAX = 5;

function addDateKey(dateKey, days) {
  const [y, m, d] = String(dateKey).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function rupees(n) {
  return Math.round(Number(n) || 0);
}

function bookedClause(from, to) {
  const q = {
    status: { $nin: ["cancelled", "pending_payment"] },
    paymentStatus: { $nin: ["failed"] },
  };
  if (from || to) q.createdAt = {};
  if (from) q.createdAt.$gte = from;
  if (to) q.createdAt.$lt = to;
  return q;
}

async function resolvePeriod(query) {
  const ops = await getStoreOps();
  const tz = ops.timezone || "Asia/Kolkata";
  const todayKey = localParts(new Date(), tz).dateKey;
  const startOf = (key) => zonedInstant(key, "00:00", tz);
  const endExclusive = (key) => startOf(addDateKey(key, 1));
  const period = String(query.period || "today");

  if (period === "custom") {
    const fromKey = String(query.from || "").trim();
    const toKey = String(query.to || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fromKey) || !/^\d{4}-\d{2}-\d{2}$/.test(toKey)) {
      return { error: "Custom dates need From and To as YYYY-MM-DD." };
    }
    if (fromKey > toKey) return { error: "From must be on or before To." };
    return { period, tz, todayKey, from: startOf(fromKey), to: endExclusive(toKey), fromKey, toKey };
  }

  if (period === "yesterday") {
    const key = addDateKey(todayKey, -1);
    return { period, tz, todayKey, from: startOf(key), to: startOf(todayKey), fromKey: key, toKey: key };
  }
  if (period === "last7") {
    const key = addDateKey(todayKey, -6);
    return { period, tz, todayKey, from: startOf(key), to: endExclusive(todayKey), fromKey: key, toKey: todayKey };
  }
  if (period === "last30") {
    const key = addDateKey(todayKey, -29);
    return { period, tz, todayKey, from: startOf(key), to: endExclusive(todayKey), fromKey: key, toKey: todayKey };
  }
  if (period === "thisMonth") {
    const key = `${todayKey.slice(0, 7)}-01`;
    return { period, tz, todayKey, from: startOf(key), to: endExclusive(todayKey), fromKey: key, toKey: todayKey };
  }
  if (period === "lastMonth") {
    const [y, m] = todayKey.split("-").map(Number);
    const start = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 10);
    const end = `${todayKey.slice(0, 7)}-01`;
    return { period, tz, todayKey, from: startOf(start), to: startOf(end), fromKey: start, toKey: addDateKey(end, -1) };
  }
  if (period === "thisYear") {
    const key = `${todayKey.slice(0, 4)}-01-01`;
    return { period, tz, todayKey, from: startOf(key), to: endExclusive(todayKey), fromKey: key, toKey: todayKey };
  }

  return {
    period: "today",
    tz,
    todayKey,
    from: startOf(todayKey),
    to: endExclusive(todayKey),
    fromKey: todayKey,
    toKey: todayKey,
  };
}

function bucketKey(date, tz, group) {
  const key = localParts(date, tz).dateKey;
  if (group === "monthly") return key.slice(0, 7);
  if (group === "weekly") {
    const [y, m, d] = key.split("-").map(Number);
    const utc = new Date(Date.UTC(y, m - 1, d));
    const day = utc.getUTCDay() || 7;
    utc.setUTCDate(utc.getUTCDate() - day + 1);
    return utc.toISOString().slice(0, 10);
  }
  return key;
}

function chartLabel(key, group) {
  if (group === "monthly") {
    const [y, m] = key.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  }
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

async function getAdminOverview(req, res, next) {
  try {
    const range = await resolvePeriod(req.query);
    if (range.error) return res.status(400).json({ message: range.error });

    const group = ["weekly", "monthly"].includes(String(req.query.group)) ? String(req.query.group) : "daily";
    const now = new Date();
    const todayStart = zonedInstant(range.todayKey, "00:00", range.tz);
    const yesterdayStart = zonedInstant(addDateKey(range.todayKey, -1), "00:00", range.tz);
    const sameTimeYesterday = new Date(yesterdayStart.getTime() + (now.getTime() - todayStart.getTime()));

    const booked = bookedClause(range.from, range.to);
    const todayBooked = bookedClause(todayStart, now);
    const yesterdaySame = bookedClause(yesterdayStart, sameTimeYesterday);

    const [
      todayAgg,
      yesterdayAgg,
      periodAgg,
      deliveredAgg,
      toDeliver,
      cashDue,
      awaitingReply,
      products,
      users,
      zones,
      settings,
      ops,
      recentOrders,
      periodOrders,
    ] = await Promise.all([
      Order.aggregate([
        { $match: todayBooked },
        { $group: { _id: null, sales: { $sum: "$totalPrice" }, orders: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: yesterdaySame },
        { $group: { _id: null, sales: { $sum: "$totalPrice" }, orders: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: booked },
        { $group: { _id: null, sales: { $sum: "$totalPrice" }, orders: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { ...booked, status: "delivered" } },
        { $group: { _id: null, sales: { $sum: "$totalPrice" }, orders: { $sum: 1 } } },
      ]),
      Order.countDocuments({ status: { $in: TO_DELIVER } }),
      Order.countDocuments({
        status: "delivered",
        paymentMethod: /cash|cod/i,
        paymentStatus: "pending",
      }),
      SupportThread.countDocuments({
        status: "open",
        "messages.0": { $exists: true },
        $expr: { $ne: [{ $arrayElemAt: ["$messages.senderRole", -1] }, "admin"] },
      }),
      Product.find().select("name price stockQty inStock isPublished image images variants category unit").lean(),
      User.find().select("isAdmin isDeliveryPartner name").lean(),
      DeliveryZone.find().select("name isActive postalCodes cities polygon").lean(),
      StoreSettings.get(),
      getStoreOps({ fresh: true }),
      Order.find()
        .sort({ updatedAt: -1 })
        .limit(8)
        .select("status totalPrice createdAt updatedAt statusHistory userName")
        .lean(),
      Order.find(booked).select("createdAt totalPrice status products").lean(),
    ]);

    const todaySales = rupees(todayAgg[0]?.sales);
    const todayOrders = todayAgg[0]?.orders || 0;
    const ySales = rupees(yesterdayAgg[0]?.sales);
    const yOrders = yesterdayAgg[0]?.orders || 0;
    const bookedSales = rupees(periodAgg[0]?.sales);
    const bookedOrders = periodAgg[0]?.orders || 0;
    const deliveredSales = rupees(deliveredAgg[0]?.sales);

    const pins = StoreSettings.listStores(settings);
    const allPins = (settings.stores || []).length ? settings.stores : pins;
    const activeStores = allPins.filter((s) => s.isActive !== false).length;
    const inactiveStores = allPins.filter((s) => s.isActive === false).length;

    const activeProducts = products.filter((p) => p.isPublished !== false);
    const inactiveProducts = products.filter((p) => p.isPublished === false);
    const activeVariants = products.reduce((n, p) => n + (Array.isArray(p.variants) ? p.variants.length : 0), 0);
    const noPicture = products.filter((p) => !String(p.image || "").trim() && !(p.images || []).some(Boolean)).length;
    const lowStock = products.filter((p) => p.inStock !== false && Number(p.stockQty) > 0 && Number(p.stockQty) <= LOW_STOCK_MAX);
    const outStock = products.filter((p) => p.inStock === false || Number(p.stockQty) <= 0);
    const inStock = products.filter((p) => p.inStock !== false && Number(p.stockQty) > 0);
    const stockValue = rupees(inStock.reduce((n, p) => n + Number(p.price || 0) * Number(p.stockQty || 0), 0));

    const unitBuckets = {};
    for (const p of inStock) {
      const unit = String(p.unit || "piece").trim() || "piece";
      unitBuckets[unit] = (unitBuckets[unit] || 0) + Number(p.stockQty || 0);
    }

    const statusCounts = {};
    const buckets = new Map();
    const topMap = new Map();
    for (const order of periodOrders) {
      const st = order.status || "pending";
      statusCounts[st] = (statusCounts[st] || 0) + 1;
      const key = bucketKey(new Date(order.createdAt), range.tz, group);
      const row = buckets.get(key) || { booked: 0, delivered: 0 };
      row.booked += Number(order.totalPrice || 0);
      if (st === "delivered") row.delivered += Number(order.totalPrice || 0);
      buckets.set(key, row);
      if (st === "delivered") {
        for (const line of order.products || []) {
          const name = String(line.name || "Item");
          const hit = topMap.get(name) || { name, quantity: 0, revenue: 0 };
          hit.quantity += Number(line.quantity || 0);
          hit.revenue += Number(line.price || 0) * Number(line.quantity || 0);
          topMap.set(name, hit);
        }
      }
    }

    const chart = [...buckets.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([key, row]) => ({
        key,
        label: chartLabel(key, group),
        booked: rupees(row.booked),
        delivered: rupees(row.delivered),
      }));

    const topProducts = [...topMap.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6)
      .map((p) => ({ ...p, revenue: rupees(p.revenue) }));

    const categories = {};
    for (const p of products) {
      const name = String(p.category || "General").trim() || "General";
      if (!categories[name]) categories[name] = { name, total: 0, active: 0 };
      categories[name].total += 1;
      if (p.isPublished !== false) categories[name].active += 1;
    }

    const shopOpen = evaluateOpen(ops, now);
    const alerts = [];
    if (cashDue > 0) {
      alerts.push({
        id: "cash-due",
        level: "danger",
        title: "Cash on delivery to collect",
        text: `${cashDue} delivered order${cashDue === 1 ? "" : "s"} still show unpaid cash.`,
        href: "AdminCash",
        hrefParams: {},
      });
    }
    if (outStock.length) {
      alerts.push({
        id: "out-stock",
        level: "danger",
        title: "Out of stock",
        text: `${outStock.length} product${outStock.length === 1 ? "" : "s"} have no stock.`,
        href: "AdminInventory",
        hrefParams: { filter: "out" },
      });
    }
    if (lowStock.length) {
      alerts.push({
        id: "low-stock",
        level: "warn",
        title: "Low stock",
        text: `${lowStock.length} product${lowStock.length === 1 ? "" : "s"} are at 5 or fewer.`,
        href: "AdminInventory",
        hrefParams: { filter: "low" },
      });
    }
    if (awaitingReply > 0) {
      alerts.push({
        id: "support",
        level: "warn",
        title: "Customers waiting",
        text: `${awaitingReply} support thread${awaitingReply === 1 ? "" : "s"} need a reply.`,
        href: "AdminSupport",
      });
    }
    if (!shopOpen.open) {
      alerts.push({
        id: "store-closed",
        level: "warn",
        title: "Shop not taking orders",
        text: shopOpen.message || "Orders are paused.",
        href: "AdminSettings",
      });
    }
    if (inactiveStores > 0) {
      alerts.push({
        id: "inactive-stores",
        level: "warn",
        title: "Inactive shops",
        text: `${inactiveStores} shop pin${inactiveStores === 1 ? "" : "s"} ${inactiveStores === 1 ? "is" : "are"} switched off.`,
        href: "AdminDelivery",
      });
    }
    if (noPicture > 0) {
      alerts.push({
        id: "no-picture",
        level: "info",
        title: "Products without a picture",
        text: `${noPicture} product${noPicture === 1 ? "" : "s"} have no photo.`,
        href: "AdminProducts",
      });
    }

    const delivering = allPins.filter((s) => s.isActive !== false && Number(s.maxRadiusKm) > 0).length;
    const activeZones = zones.filter((z) => z.isActive !== false);
    const ownPolygon = zones.filter((z) => (z.polygon || []).length >= 3).length;
    const pinCount = zones.reduce((n, z) => n + (z.postalCodes || []).length, 0);
    const localityCount = zones.reduce((n, z) => n + (z.cities || []).length, 0);

    res.json({
      timezone: range.tz,
      period: range.period,
      from: range.fromKey,
      to: range.toKey,
      group,
      today: {
        sales: todaySales,
        orders: todayOrders,
        salesDelta: todaySales - ySales,
        ordersDelta: todayOrders - yOrders,
        toDeliver,
      },
      attention: {
        lowStock: lowStock.length,
        outOfStock: outStock.length,
        cashDue,
        support: awaitingReply,
        inactiveStores,
      },
      business: {
        stores: allPins.length,
        inactiveStores,
        activeStores,
        admins: users.filter((u) => u.isAdmin).length,
        riders: users.filter((u) => u.isDeliveryPartner).length,
        activeProducts: activeProducts.length,
        inactiveProducts: inactiveProducts.length,
        activeVariants,
        stockLines: products.length,
        stockValue,
      },
      sales: {
        booked: bookedSales,
        bookedOrders,
        delivered: deliveredSales,
        chart,
      },
      ordersByStatus: Object.entries(statusCounts)
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count),
      inventory: {
        inStock: inStock.length,
        lowStock: lowStock.length,
        outOfStock: outStock.length,
        onHand: Object.entries(unitBuckets).map(([unit, qty]) => ({ unit, qty: Math.round(qty * 10) / 10 })),
      },
      topProducts,
      stores: allPins.map((s) => ({
        id: String(s._id || s.label || "shop"),
        name: s.label || "Shop",
        main: String(s._id) === String(pins[0]?._id),
        active: s.isActive !== false,
        deliveryOn: Number(s.maxRadiusKm) > 0,
        radiusKm: Number(s.maxRadiusKm) || 0,
        latitude: s.latitude,
        longitude: s.longitude,
      })),
      cash: { outstandingOrders: cashDue },
      catalog: {
        products: products.length,
        active: activeProducts.length,
        inactive: inactiveProducts.length,
        activeVariants,
        noPicture,
        categories: Object.values(categories).sort((a, b) => b.total - a.total),
      },
      delivery: {
        acceptingOrders: ops.acceptingOrders,
        shopOpen: shopOpen.open,
        storesDelivering: delivering,
        storesNotDelivering: Math.max(0, allPins.length - delivering),
        zones: zones.length,
        activeZones: activeZones.length,
        pinCount,
        localityCount,
        drawnAreas: ownPolygon,
      },
      activity: recentOrders.map((o) => {
        const last = (o.statusHistory || []).slice(-1)[0];
        return {
          id: String(o._id),
          action: last?.status || o.status,
          who: last?.byRole === "admin" ? "Admin" : last?.byRole === "delivery" ? "Rider" : "System",
          at: last?.at || o.updatedAt || o.createdAt,
        };
      }),
      alerts,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAdminOverview, resolvePeriod, addDateKey, bookedClause };

if (require.main === module) {
  console.assert(addDateKey("2026-10-24", -1) === "2026-10-23", addDateKey("2026-10-24", -1));
  console.assert(addDateKey("2026-03-01", -1) === "2026-02-28", addDateKey("2026-03-01", -1));
  const q = bookedClause(new Date("2026-01-01"), new Date("2026-02-01"));
  console.assert(q.status.$nin.includes("cancelled") && q.createdAt.$gte, q);
  console.log("adminOverview ok");
}
