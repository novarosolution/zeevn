const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { ORDER_STATUS_VALUES } = require("../constants/orderStatuses");
const { getStoreOps, localParts, zonedInstant } = require("../services/storeOpsService");

const DAY_MS = 86400000;
const CUSTOM_REQUIRED = "Both from and to are required for a custom date range (YYYY-MM-DD).";

function addDateKey(dateKey, days) {
  const [y, m, d] = String(dateKey).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function dayLabel(key) {
  const [y, m, d] = String(key).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function monthLabel(key) {
  const [y, m] = String(key).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function parseAnalyticsQuery(req) {
  const presetRaw = req.query.preset != null ? String(req.query.preset).trim().toLowerCase() : "";
  const qFrom = String(req.query.from || "").trim();
  const qTo = String(req.query.to || "").trim();
  const bucketParam = req.query.bucket === "month" ? "month" : req.query.bucket === "day" ? "day" : null;
  const hasExplicitRange = Boolean(qFrom || qTo);

  if (hasExplicitRange && (!qFrom || !qTo)) {
    return { error: CUSTOM_REQUIRED };
  }
  if (presetRaw === "custom" && !hasExplicitRange) {
    return { error: CUSTOM_REQUIRED };
  }
  if (!presetRaw && !hasExplicitRange) {
    return { kind: "full", bucketParam };
  }
  if (hasExplicitRange) {
    return { kind: "custom", from: qFrom, to: qTo, bucketParam };
  }
  if (presetRaw === "all") return { kind: "all", bucketParam };
  if (presetRaw === "full" || presetRaw === "legacy") return { kind: "full", bucketParam };
  return { kind: "preset", preset: presetRaw, bucketParam };
}

async function resolveAnalyticsRange(parsed) {
  const ops = await getStoreOps();
  const tz = ops.timezone || "Asia/Kolkata";
  const todayKey = localParts(new Date(), tz).dateKey;
  const startOf = (key) => zonedInstant(key, "00:00", tz);
  const endOf = (key) => new Date(zonedInstant(addDateKey(key, 1), "00:00", tz).getTime() - 1);

  if (parsed.kind === "full" || parsed.kind === "all") {
    return {
      tz,
      rangeStart: null,
      rangeEnd: null,
      resolvedPreset: parsed.kind === "all" ? "all" : "full",
      fromKey: null,
      toKey: null,
      bucketParam: parsed.bucketParam,
    };
  }

  if (parsed.kind === "custom") {
    const fromKey = parsed.from;
    const toKey = parsed.to;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fromKey) || !/^\d{4}-\d{2}-\d{2}$/.test(toKey)) {
      return { error: "Invalid from or to date. Use YYYY-MM-DD." };
    }
    if (fromKey > toKey) {
      return { error: "from must be before or equal to to." };
    }
    return {
      tz,
      rangeStart: startOf(fromKey),
      rangeEnd: endOf(toKey),
      resolvedPreset: "custom",
      fromKey,
      toKey,
      bucketParam: parsed.bucketParam,
    };
  }

  const keys = {
    today: () => ({ fromKey: todayKey, toKey: todayKey }),
    "7d": () => ({ fromKey: addDateKey(todayKey, -6), toKey: todayKey }),
    "30d": () => ({ fromKey: addDateKey(todayKey, -29), toKey: todayKey }),
    "90d": () => ({ fromKey: addDateKey(todayKey, -89), toKey: todayKey }),
    "1y": () => ({ fromKey: addDateKey(todayKey, -364), toKey: todayKey }),
    mtd: () => ({ fromKey: `${todayKey.slice(0, 7)}-01`, toKey: todayKey }),
    ytd: () => ({ fromKey: `${todayKey.slice(0, 4)}-01-01`, toKey: todayKey }),
  };
  const pick = keys[parsed.preset];
  if (!pick) {
    return {
      error: `Unknown preset "${parsed.preset}". Use today, 7d, 30d, 90d, 1y, mtd, ytd, all, or custom from/to.`,
    };
  }
  const { fromKey, toKey } = pick();
  return {
    tz,
    rangeStart: startOf(fromKey),
    rangeEnd: endOf(toKey),
    resolvedPreset: parsed.preset,
    fromKey,
    toKey,
    bucketParam: parsed.bucketParam,
  };
}

function emptySeries() {
  return { labels: [], orderCounts: [], revenues: [] };
}

function orderDateKeys(orders, tz) {
  let minKey = "";
  let maxKey = "";
  for (const order of orders) {
    const t = new Date(order.createdAt || 0);
    if (Number.isNaN(t.getTime())) continue;
    const key = localParts(t, tz).dateKey;
    if (!minKey || key < minKey) minKey = key;
    if (!maxKey || key > maxKey) maxKey = key;
  }
  return { minKey, maxKey };
}

function eachKey(fromKey, toKey, bucket) {
  const keys = [];
  if (!fromKey || !toKey) return keys;
  if (bucket === "month") {
    let cursor = `${fromKey.slice(0, 7)}-01`;
    const last = `${toKey.slice(0, 7)}-01`;
    while (cursor <= last) {
      keys.push(cursor.slice(0, 7));
      const [y, m] = cursor.split("-").map(Number);
      cursor = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
    }
    return keys;
  }
  let cursor = fromKey;
  while (cursor <= toKey) {
    keys.push(cursor);
    cursor = addDateKey(cursor, 1);
  }
  return keys;
}

async function buildRangeSeries({ rangeStart, rangeEnd, fromKey, toKey, bucket, tz, orders }) {
  if (!orders.length) return emptySeries();

  let startKey = fromKey;
  let endKey = toKey;
  if (!startKey || !endKey) {
    const bounds = orderDateKeys(orders, tz);
    startKey = bounds.minKey;
    endKey = bounds.maxKey;
  }
  if (!startKey || !endKey) return emptySeries();

  const format = bucket === "month" ? "%Y-%m" : "%Y-%m-%d";
  const match = {};
  if (rangeStart != null && rangeEnd != null) {
    match.createdAt = { $gte: rangeStart, $lte: rangeEnd };
  }
  const bucketRows = await Order.aggregate([
    ...(Object.keys(match).length ? [{ $match: match }] : []),
    {
      $group: {
        _id: { $dateToString: { format, date: "$createdAt", timezone: tz } },
        count: { $sum: 1 },
        revenue: { $sum: { $ifNull: ["$totalPrice", 0] } },
      },
    },
  ]);
  const bucketMap = new Map(
    bucketRows.map((row) => [row._id, { count: row.count, revenue: Number(row.revenue) || 0 }])
  );

  const labels = [];
  const orderCounts = [];
  const revenues = [];
  for (const key of eachKey(startKey, endKey, bucket)) {
    const hit = bucketMap.get(key) || { count: 0, revenue: 0 };
    labels.push(bucket === "month" ? monthLabel(key) : dayLabel(key));
    orderCounts.push(hit.count);
    revenues.push(hit.revenue);
  }
  return { labels, orderCounts, revenues };
}

function computeMetricsFromOrders(orders) {
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
  const deliveredRevenue = orders
    .filter((order) => order.status === "delivered")
    .reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);

  const revenueByStatus = ORDER_STATUS_VALUES.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {});
  const statusBreakdown = ORDER_STATUS_VALUES.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {});
  for (const order of orders) {
    const status = ORDER_STATUS_VALUES.includes(order.status) ? order.status : "unknown";
    statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    if (revenueByStatus[status] != null) {
      revenueByStatus[status] += Number(order.totalPrice || 0);
    }
  }

  const topProductsMap = new Map();
  for (const order of orders) {
    for (const item of order.products || []) {
      const key = String(item.product || item.externalProductId || item.name);
      const existing = topProductsMap.get(key) || {
        key,
        name: item.name || "Item",
        qty: 0,
        revenue: 0,
      };
      existing.qty += Number(item.quantity || 0);
      existing.revenue += Number(item.price || 0) * Number(item.quantity || 0);
      topProductsMap.set(key, existing);
    }
  }
  const topProducts = Array.from(topProductsMap.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8);

  const couponUsageMap = new Map();
  let couponOrders = 0;
  let totalDiscount = 0;
  for (const order of orders) {
    const couponCode = String(order.coupon?.code || "").trim();
    const discountAmount = Number(order.coupon?.discountAmount || order.priceBreakdown?.discountAmount || 0);
    if (!couponCode) continue;
    couponOrders += 1;
    totalDiscount += discountAmount;
    const existing = couponUsageMap.get(couponCode) || {
      code: couponCode,
      orders: 0,
      discount: 0,
    };
    existing.orders += 1;
    existing.discount += discountAmount;
    couponUsageMap.set(couponCode, existing);
  }
  const topCoupons = Array.from(couponUsageMap.values())
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 8);

  const deliveredCount = statusBreakdown.delivered || 0;
  const cancelledCount = statusBreakdown.cancelled || 0;

  return {
    totalRevenue,
    deliveredRevenue,
    revenueByStatus,
    statusBreakdown,
    topProducts,
    couponOrders,
    totalDiscount,
    topCoupons,
    deliveredCount,
    cancelledCount,
  };
}

function stockSnapshot(products) {
  let lowStockProducts = 0;
  let outOfStockProducts = 0;
  let inStockProducts = 0;
  let inventoryRetailValue = 0;
  const categoryCounts = new Map();
  for (const product of products) {
    const qty = Number(product.stockQty || 0) + Number(product.stockCounter || 0);
    if (qty > 0) inventoryRetailValue += Number(product.price || 0) * qty;
    const isOut = product.inStock === false || qty < 1;
    if (isOut) outOfStockProducts += 1;
    else if (qty <= 5) lowStockProducts += 1;
    else inStockProducts += 1;
    const name = String(product.category || "General").trim() || "General";
    categoryCounts.set(name, (categoryCounts.get(name) || 0) + 1);
  }
  const topCategories = [...categoryCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  return { lowStockProducts, outOfStockProducts, inStockProducts, inventoryRetailValue, topCategories };
}

function cartSnapshot(users) {
  const cartUsers = users.filter((user) => Array.isArray(user.cartItems) && user.cartItems.length > 0);
  let totalCartItems = 0;
  let estimatedCartValue = 0;
  for (const user of cartUsers) {
    for (const line of user.cartItems || []) {
      const qty = Number(line.quantity || 0);
      totalCartItems += qty;
      estimatedCartValue += Number(line.price || 0) * qty;
    }
  }
  return {
    usersWithActiveCart: cartUsers.length,
    totalCartItems,
    estimatedCartValue,
  };
}

async function getAdminAnalytics(req, res, next) {
  try {
    const parsed = parseAnalyticsQuery(req);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }
    const range = await resolveAnalyticsRange(parsed);
    if (range.error) {
      return res.status(400).json({ message: range.error });
    }

    const { rangeStart, rangeEnd, resolvedPreset, fromKey, toKey, bucketParam, tz } = range;
    const orderQuery =
      rangeStart != null && rangeEnd != null ? { createdAt: { $gte: rangeStart, $lte: rangeEnd } } : {};

    const [orders, products, allUsers] = await Promise.all([
      Order.find(orderQuery).lean(),
      Product.find().lean(),
      User.find().select("isAdmin cartItems createdAt").lean(),
    ]);

    let spanMs = 0;
    if (rangeStart != null && rangeEnd != null) {
      spanMs = rangeEnd.getTime() - rangeStart.getTime();
    } else if (orders.length > 0) {
      const bounds = orderDateKeys(orders, tz);
      if (bounds.minKey && bounds.maxKey) {
        spanMs = (eachKey(bounds.minKey, bounds.maxKey, "day").length - 1) * DAY_MS;
      }
    }
    const bucket = bucketParam || (spanMs > 120 * DAY_MS ? "month" : "day");

    const m = computeMetricsFromOrders(orders);
    const inventory = stockSnapshot(products);
    const carts = cartSnapshot(allUsers);
    const rangeSeries = await buildRangeSeries({
      rangeStart,
      rangeEnd,
      fromKey,
      toKey,
      bucket,
      tz,
      orders,
    });

    res.json({
      range: {
        filtered: true,
        preset: resolvedPreset,
        from: rangeStart ? rangeStart.toISOString() : null,
        to: rangeEnd ? rangeEnd.toISOString() : null,
        bucket,
      },
      totals: {
        orders: orders.length,
        products: products.length,
        users: allUsers.length,
        admins: allUsers.filter((user) => user.isAdmin).length,
      },
      activity: {
        ordersInPeriod: orders.length,
        revenueInPeriod: m.totalRevenue,
      },
      revenue: {
        total: m.totalRevenue,
        delivered: m.deliveredRevenue,
        averageOrderValue: orders.length ? m.totalRevenue / orders.length : 0,
        byStatus: m.revenueByStatus,
      },
      channels: (() => {
        const live = orders.filter((order) => order.status !== "cancelled" && order.status !== "pending_payment");
        const walkIn = live.filter((order) => order.channel === "walk_in");
        const web = live.filter((order) => order.channel !== "walk_in");
        const sum = (list) => list.reduce((n, order) => n + Number(order.totalPrice || 0), 0);
        return {
          online: { count: web.length, revenue: Math.round(sum(web)) },
          counter: { count: walkIn.length, revenue: Math.round(sum(walkIn)) },
        };
      })(),
      funnel: {
        deliveredOrders: m.deliveredCount,
        cancelledOrders: m.cancelledCount,
        deliveryRatePercent: orders.length ? Math.round((m.deliveredCount / orders.length) * 1000) / 10 : 0,
      },
      trends: {
        rangeSeries,
      },
      inventory,
      carts,
      coupons: {
        couponOrders: m.couponOrders,
        totalDiscount: m.totalDiscount,
        averageDiscountPerCouponOrder: m.couponOrders ? m.totalDiscount / m.couponOrders : 0,
        topCoupons: m.topCoupons,
      },
      statusBreakdown: m.statusBreakdown,
      topProducts: m.topProducts,
    });
  } catch (error) {
    next(error);
  }
}

/** Live ops command-center summary — open runs, accept queue, low stock. */
async function getAdminOpsSummary(req, res, next) {
  try {
    const LOW_STOCK_MAX = 5;
    const LIVE = ["ready_for_pickup", "shipped", "out_for_delivery"];
    const OPEN = [
      "pending",
      "confirmed",
      "preparing",
      "ready_for_pickup",
      "shipped",
      "out_for_delivery",
      "paid",
    ];

    const [
      openOrders,
      pendingAccept,
      outForDelivery,
      declinedUnassigned,
      lowStock,
      outOfStock,
      partnersOnline,
      attentionOrders,
    ] = await Promise.all([
      Order.countDocuments({ status: { $in: OPEN } }),
      Order.countDocuments({
        assignedDeliveryUser: { $ne: null },
        deliveryAcceptStatus: "pending",
        status: { $in: LIVE },
      }),
      Order.countDocuments({ status: "out_for_delivery" }),
      Order.countDocuments({
        deliveryAcceptStatus: "declined",
        assignedDeliveryUser: null,
        status: { $in: LIVE },
      }),
      Product.countDocuments({
        inStock: true,
        stockQty: { $gt: 0, $lte: LOW_STOCK_MAX },
      }),
      Product.countDocuments({
        $or: [{ inStock: false }, { stockQty: { $lte: 0 } }],
      }),
      User.countDocuments({
        isDeliveryPartner: true,
        "deliveryLiveLocation.updatedAt": {
          $gte: new Date(Date.now() - 15 * 60 * 1000),
        },
      }),
      Order.find({
        $or: [
          {
            deliveryAcceptStatus: "pending",
            assignedDeliveryUser: { $ne: null },
            status: { $in: LIVE },
          },
          {
            deliveryAcceptStatus: "declined",
            assignedDeliveryUser: null,
            status: { $in: LIVE },
          },
          {
            assignedDeliveryUser: null,
            status: { $in: LIVE },
          },
        ],
      })
        .sort({ updatedAt: -1 })
        .limit(8)
        .select(
          "status totalPrice createdAt updatedAt shippingAddress deliveryAcceptStatus deliveryDeclineReason assignedDeliveryUser deliveryZoneName"
        )
        .populate("user", "name email")
        .populate("assignedDeliveryUser", "name phone")
        .lean(),
    ]);

    res.json({
      kpis: {
        openOrders,
        pendingAccept,
        outForDelivery,
        declinedUnassigned,
        lowStock,
        outOfStock,
        partnersOnline,
      },
      attention: attentionOrders.map((o) => ({
        _id: o._id,
        status: o.status,
        totalPrice: o.totalPrice,
        deliveryAcceptStatus: o.deliveryAcceptStatus || "none",
        deliveryDeclineReason: o.deliveryDeclineReason || "",
        deliveryZoneName: o.deliveryZoneName || "",
        customerName: o.user?.name || o.shippingAddress?.fullName || "Guest",
        partnerName: o.assignedDeliveryUser?.name || "",
        updatedAt: o.updatedAt,
        reason:
          o.deliveryAcceptStatus === "pending"
            ? "Waiting for rider accept"
            : o.deliveryAcceptStatus === "declined" && !o.assignedDeliveryUser
              ? "Declined — needs reassign"
              : !o.assignedDeliveryUser
                ? "No rider assigned"
                : "Needs attention",
      })),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAdminAnalytics,
  getAdminOpsSummary,
};
