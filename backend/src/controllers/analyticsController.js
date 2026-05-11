const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { ORDER_STATUS_VALUES } = require("../constants/orderStatuses");

const DAY_MS = 86400000;

function startOfDayLocal(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** UTC midnight for calendar day (date-only inputs). */
function utcDayStart(y, m0, d) {
  return new Date(Date.UTC(y, m0, d, 0, 0, 0, 0));
}

/** End of UTC calendar day (23:59:59.999). */
function utcDayEnd(y, m0, d) {
  return new Date(Date.UTC(y, m0, d, 23, 59, 59, 999));
}

function parseDateInput(str, endOfDay) {
  const s = String(str || "").trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return endOfDay ? utcDayEnd(y, m - 1, d) : utcDayStart(y, m - 1, d);
  }
  const dt = new Date(s);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function utcTodayBounds() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  return {
    dayStart: utcDayStart(y, m, d),
    dayEnd: utcDayEnd(y, m, d),
  };
}

function resolvePreset(presetKey) {
  const key = String(presetKey || "").toLowerCase();
  const { dayStart: todayStart, dayEnd: todayEnd } = utcTodayBounds();

  switch (key) {
    case "today":
      return { from: todayStart, to: todayEnd };
    case "7d": {
      const from = new Date(todayStart);
      from.setUTCDate(from.getUTCDate() - 6);
      return { from, to: todayEnd };
    }
    case "30d": {
      const from = new Date(todayStart);
      from.setUTCDate(from.getUTCDate() - 29);
      return { from, to: todayEnd };
    }
    case "90d": {
      const from = new Date(todayStart);
      from.setUTCDate(from.getUTCDate() - 89);
      return { from, to: todayEnd };
    }
    case "1y": {
      const from = new Date(todayStart);
      from.setUTCDate(from.getUTCDate() - 364);
      return { from, to: todayEnd };
    }
    case "mtd": {
      const now = new Date();
      const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      return { from, to: todayEnd };
    }
    case "ytd": {
      const now = new Date();
      const from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      return { from, to: todayEnd };
    }
    case "all":
      return { from: null, to: null };
    default:
      return null;
  }
}

/**
 * Parse range query. Returns { legacy: true } or { legacy: false, rangeStart, rangeEnd, resolvedPreset, bucket }
 * or { error: string }.
 */
function parseAnalyticsRange(req) {
  const presetRaw = req.query.preset != null ? String(req.query.preset).trim().toLowerCase() : "";
  const qFrom = req.query.from;
  const qTo = req.query.to;
  const bucketParam = req.query.bucket === "month" ? "month" : req.query.bucket === "day" ? "day" : null;

  const hasExplicitRange = Boolean(qFrom || qTo);
  if (hasExplicitRange && (!qFrom || !qTo)) {
    return { error: "Both from and to are required for a custom date range (YYYY-MM-DD)." };
  }

  if (!presetRaw && !hasExplicitRange) {
    return { legacy: true };
  }

  let rangeStart;
  let rangeEnd;
  let resolvedPreset = presetRaw || "custom";

  if (hasExplicitRange) {
    rangeStart = parseDateInput(qFrom, false);
    rangeEnd = parseDateInput(qTo, true);
    if (!rangeStart || !rangeEnd) {
      return { error: "Invalid from or to date. Use YYYY-MM-DD or ISO 8601." };
    }
    if (rangeStart.getTime() > rangeEnd.getTime()) {
      return { error: "from must be before or equal to to." };
    }
  } else if (presetRaw === "all") {
    rangeStart = null;
    rangeEnd = null;
  } else {
    const resolved = resolvePreset(presetRaw);
    if (!resolved) {
      return { error: `Unknown preset "${presetRaw}". Use today, 7d, 30d, 90d, 1y, mtd, ytd, all, or custom from/to.` };
    }
    rangeStart = resolved.from;
    rangeEnd = resolved.to;
  }

  return {
    legacy: false,
    rangeStart,
    rangeEnd,
    resolvedPreset,
    bucketParam,
  };
}

function buildLastNDaysSeries(n, orders) {
  const now = new Date();
  const labels = [];
  const orderCounts = [];
  const revenues = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = startOfDayLocal(new Date(now));
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const dayOrders = orders.filter((o) => {
      const t = new Date(o.createdAt || 0);
      return t >= d && t < next;
    });
    labels.push(d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }));
    orderCounts.push(dayOrders.length);
    revenues.push(dayOrders.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0));
  }
  return { labels, orderCounts, revenues };
}

/** Effective UTC bounds for trend buckets when preset=all. */
function orderDateBounds(orders) {
  let minT = Infinity;
  let maxT = -Infinity;
  for (const o of orders) {
    const t = new Date(o.createdAt || 0).getTime();
    if (!Number.isFinite(t)) continue;
    if (t < minT) minT = t;
    if (t > maxT) maxT = t;
  }
  if (minT === Infinity) {
    const now = Date.now();
    return { start: new Date(now), end: new Date(now) };
  }
  return { start: new Date(minT), end: new Date(maxT) };
}

function buildSeriesInRange(orders, rangeStart, rangeEnd, bucket) {
  let effStart = rangeStart;
  let effEnd = rangeEnd;
  if (effStart == null || effEnd == null) {
    const b = orderDateBounds(orders);
    effStart = utcDayStart(b.start.getUTCFullYear(), b.start.getUTCMonth(), b.start.getUTCDate());
    effEnd = utcDayEnd(b.end.getUTCFullYear(), b.end.getUTCMonth(), b.end.getUTCDate());
  }

  const isMonth = bucket === "month";
  const labels = [];
  const orderCounts = [];
  const revenues = [];

  if (isMonth) {
    let cursor = new Date(Date.UTC(effStart.getUTCFullYear(), effStart.getUTCMonth(), 1));
    const endCap = effEnd.getTime();
    while (cursor.getTime() <= endCap) {
      const ms = cursor.getUTCMonth();
      const ys = cursor.getUTCFullYear();
      const monthStart = new Date(Date.UTC(ys, ms, 1));
      const monthEnd = new Date(Date.UTC(ys, ms + 1, 0, 23, 59, 59, 999));
      const sliceStart = monthStart < effStart ? effStart : monthStart;
      const sliceEnd = monthEnd > effEnd ? effEnd : monthEnd;
      let count = 0;
      let rev = 0;
      for (const o of orders) {
        const t = new Date(o.createdAt || 0).getTime();
        if (t >= sliceStart.getTime() && t <= sliceEnd.getTime()) {
          count += 1;
          rev += Number(o.totalPrice || 0);
        }
      }
      labels.push(monthStart.toLocaleDateString("en-IN", { month: "short", year: "numeric" }));
      orderCounts.push(count);
      revenues.push(rev);
      cursor = new Date(Date.UTC(ys, ms + 1, 1));
    }
  } else {
    let dayCursor = new Date(
      Date.UTC(effStart.getUTCFullYear(), effStart.getUTCMonth(), effStart.getUTCDate())
    );
    const lastDay = new Date(
      Date.UTC(effEnd.getUTCFullYear(), effEnd.getUTCMonth(), effEnd.getUTCDate())
    );
    while (dayCursor.getTime() <= lastDay.getTime()) {
      const ys = dayCursor.getUTCFullYear();
      const ms = dayCursor.getUTCMonth();
      const ds = dayCursor.getUTCDate();
      const sliceStart = utcDayStart(ys, ms, ds);
      const sliceEnd = utcDayEnd(ys, ms, ds);
      let count = 0;
      let rev = 0;
      for (const o of orders) {
        const t = new Date(o.createdAt || 0).getTime();
        if (t >= sliceStart.getTime() && t <= sliceEnd.getTime()) {
          count += 1;
          rev += Number(o.totalPrice || 0);
        }
      }
      labels.push(
        dayCursor.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
      );
      orderCounts.push(count);
      revenues.push(rev);
      dayCursor.setUTCDate(dayCursor.getUTCDate() + 1);
    }
  }

  return { labels, orderCounts, revenues };
}

/**
 * Trend buckets via Mongo aggregate ($match + $group). Matches {@link buildSeriesInRange}
 * label/order when range bounds are set (same effective windows after $match).
 */
async function buildRangeSeriesFromAggregate(rangeStart, rangeEnd, bucket) {
  const format = bucket === "month" ? "%Y-%m" : "%Y-%m-%d";
  const bucketRows = await Order.aggregate([
    { $match: { createdAt: { $gte: rangeStart, $lte: rangeEnd } } },
    {
      $group: {
        _id: { $dateToString: { format, date: "$createdAt", timezone: "UTC" } },
        count: { $sum: 1 },
        revenue: { $sum: { $ifNull: ["$totalPrice", 0] } },
      },
    },
  ]);

  const bucketMap = new Map(
    bucketRows.map((row) => [
      row._id,
      { count: row.count, revenue: Number(row.revenue) || 0 },
    ])
  );

  let effStart = rangeStart;
  let effEnd = rangeEnd;

  const isMonth = bucket === "month";
  const labels = [];
  const orderCounts = [];
  const revenues = [];

  if (isMonth) {
    let cursor = new Date(Date.UTC(effStart.getUTCFullYear(), effStart.getUTCMonth(), 1));
    const endCap = effEnd.getTime();
    while (cursor.getTime() <= endCap) {
      const ms = cursor.getUTCMonth();
      const ys = cursor.getUTCFullYear();
      const monthStart = new Date(Date.UTC(ys, ms, 1));
      const key = `${ys}-${String(ms + 1).padStart(2, "0")}`;
      const hit = bucketMap.get(key) || { count: 0, revenue: 0 };
      labels.push(monthStart.toLocaleDateString("en-IN", { month: "short", year: "numeric" }));
      orderCounts.push(hit.count);
      revenues.push(hit.revenue);
      cursor = new Date(Date.UTC(ys, ms + 1, 1));
    }
  } else {
    let dayCursor = new Date(
      Date.UTC(effStart.getUTCFullYear(), effStart.getUTCMonth(), effStart.getUTCDate())
    );
    const lastDay = new Date(
      Date.UTC(effEnd.getUTCFullYear(), effEnd.getUTCMonth(), effEnd.getUTCDate())
    );
    while (dayCursor.getTime() <= lastDay.getTime()) {
      const ys = dayCursor.getUTCFullYear();
      const ms = dayCursor.getUTCMonth();
      const ds = dayCursor.getUTCDate();
      const key = `${ys}-${String(ms + 1).padStart(2, "0")}-${String(ds).padStart(2, "0")}`;
      const hit = bucketMap.get(key) || { count: 0, revenue: 0 };
      labels.push(
        dayCursor.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
      );
      orderCounts.push(hit.count);
      revenues.push(hit.revenue);
      dayCursor.setUTCDate(dayCursor.getUTCDate() + 1);
    }
  }

  return { labels, orderCounts, revenues };
}

function computeMetricsFromOrders(orders) {
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
  const deliveredRevenue = orders
    .filter((order) => order.status === "delivered")
    .reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);

  const revenueByStatus = ORDER_STATUS_VALUES.reduce((acc, status) => {
    acc[status] = orders
      .filter((o) => (o.status || "") === status)
      .reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
    return acc;
  }, {});

  const statusBreakdown = orders.reduce((acc, order) => {
    const status = order.status || "unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

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
  const revenueExCancelled = orders
    .filter((o) => (o.status || "") !== "cancelled")
    .reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);

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
    revenueExCancelled,
  };
}

function buildLegacyPayload(orders, products, users) {
  const m = computeMetricsFromOrders(orders);

  const lowStockProducts = products
    .filter((product) => Number(product.stockQty || 0) > 0 && Number(product.stockQty || 0) <= 5)
    .length;
  const outOfStockProducts = products.filter(
    (product) => product.inStock === false || Number(product.stockQty || 0) <= 0
  ).length;

  const cartUsers = users.filter((user) => Array.isArray(user.cartItems) && user.cartItems.length > 0);
  const totalCartItems = cartUsers.reduce(
    (sum, user) =>
      sum +
      (user.cartItems || []).reduce((inner, item) => inner + Number(item.quantity || 0), 0),
    0
  );

  let estimatedCartValue = 0;
  for (const u of users) {
    for (const line of u.cartItems || []) {
      estimatedCartValue += Number(line.price || 0) * Number(line.quantity || 0);
    }
  }

  const now = Date.now();
  const dayMs = DAY_MS;
  const cutoff7 = new Date(now - 7 * dayMs);
  const cutoff30 = new Date(now - 30 * dayMs);

  const ordersLast7Days = orders.filter((o) => new Date(o.createdAt || 0) >= cutoff7).length;
  const ordersLast30Days = orders.filter((o) => new Date(o.createdAt || 0) >= cutoff30).length;
  const revenueLast7Days = orders
    .filter((o) => new Date(o.createdAt || 0) >= cutoff7)
    .reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
  const revenueLast30Days = orders
    .filter((o) => new Date(o.createdAt || 0) >= cutoff30)
    .reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);

  const newUsersLast7Days = users.filter((u) => new Date(u.createdAt || 0) >= cutoff7).length;
  const newUsersLast30Days = users.filter((u) => new Date(u.createdAt || 0) >= cutoff30).length;

  const inStockProducts = products.filter(
    (p) => p.inStock !== false && Number(p.stockQty || 0) > 0
  ).length;
  const inventoryRetailValue = products.reduce((sum, p) => {
    const qty = Number(p.stockQty || 0);
    if (qty <= 0) return sum;
    return sum + Number(p.price || 0) * qty;
  }, 0);

  const categoryMap = {};
  for (const p of products) {
    const cat = String(p.category || "General").trim() || "General";
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  }
  const topCategories = Object.entries(categoryMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const trend7 = buildLastNDaysSeries(7, orders);
  const trend14 = buildLastNDaysSeries(14, orders);

  return {
    range: null,
    totals: {
      orders: orders.length,
      products: products.length,
      users: users.length,
      admins: users.filter((user) => user.isAdmin).length,
    },
    activity: {
      ordersLast7Days,
      ordersLast30Days,
      revenueLast7Days,
      revenueLast30Days,
      newUsersLast7Days,
      newUsersLast30Days,
    },
    revenue: {
      total: m.totalRevenue,
      delivered: m.deliveredRevenue,
      averageOrderValue: orders.length ? m.totalRevenue / orders.length : 0,
      byStatus: m.revenueByStatus,
      excludingCancelled: m.revenueExCancelled,
    },
    funnel: {
      deliveredOrders: m.deliveredCount,
      cancelledOrders: m.cancelledCount,
      deliveryRatePercent: orders.length ? Math.round((m.deliveredCount / orders.length) * 1000) / 10 : 0,
      couponPenetrationPercent: orders.length ? Math.round((m.couponOrders / orders.length) * 1000) / 10 : 0,
    },
    trends: {
      last7Days: trend7,
      last14Days: trend14,
      rangeSeries: null,
    },
    inventory: {
      lowStockProducts,
      outOfStockProducts,
      inStockProducts,
      inventoryRetailValue,
      topCategories,
    },
    carts: {
      usersWithActiveCart: cartUsers.length,
      totalCartItems,
      estimatedCartValue,
    },
    coupons: {
      couponOrders: m.couponOrders,
      totalDiscount: m.totalDiscount,
      averageDiscountPerCouponOrder: m.couponOrders ? m.totalDiscount / m.couponOrders : 0,
      topCoupons: m.topCoupons,
    },
    statusBreakdown: m.statusBreakdown,
    topProducts: m.topProducts,
  };
}

async function getAdminAnalytics(req, res, next) {
  try {
    const parsed = parseAnalyticsRange(req);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    const products = await Product.find().lean();
    const allUsers = await User.find().select("isAdmin cartItems createdAt").lean();

    if (parsed.legacy) {
      const orders = await Order.find().lean();
      return res.json(buildLegacyPayload(orders, products, allUsers));
    }

    const { rangeStart, rangeEnd, resolvedPreset, bucketParam } = parsed;

    let orderQuery = {};
    if (rangeStart != null && rangeEnd != null) {
      orderQuery = { createdAt: { $gte: rangeStart, $lte: rangeEnd } };
    }

    const orders = await Order.find(orderQuery).lean();

    let spanMs = 0;
    if (rangeStart != null && rangeEnd != null) {
      spanMs = rangeEnd.getTime() - rangeStart.getTime();
    } else if (orders.length > 0) {
      const b = orderDateBounds(orders);
      spanMs = b.end.getTime() - b.start.getTime();
    }

    let bucket = bucketParam || (spanMs > 120 * DAY_MS ? "month" : "day");

    const usersInRange =
      rangeStart != null && rangeEnd != null
        ? allUsers.filter((u) => {
            const t = new Date(u.createdAt || 0).getTime();
            return t >= rangeStart.getTime() && t <= rangeEnd.getTime();
          })
        : allUsers;

    const m = computeMetricsFromOrders(orders);

    const lowStockProducts = products
      .filter((product) => Number(product.stockQty || 0) > 0 && Number(product.stockQty || 0) <= 5)
      .length;
    const outOfStockProducts = products.filter(
      (product) => product.inStock === false || Number(product.stockQty || 0) <= 0
    ).length;

    const cartUsers = allUsers.filter((user) => Array.isArray(user.cartItems) && user.cartItems.length > 0);
    const totalCartItems = cartUsers.reduce(
      (sum, user) =>
        sum +
        (user.cartItems || []).reduce((inner, item) => inner + Number(item.quantity || 0), 0),
      0
    );

    let estimatedCartValue = 0;
    for (const u of allUsers) {
      for (const line of u.cartItems || []) {
        estimatedCartValue += Number(line.price || 0) * Number(line.quantity || 0);
      }
    }

    const inStockProducts = products.filter(
      (p) => p.inStock !== false && Number(p.stockQty || 0) > 0
    ).length;
    const inventoryRetailValue = products.reduce((sum, p) => {
      const qty = Number(p.stockQty || 0);
      if (qty <= 0) return sum;
      return sum + Number(p.price || 0) * qty;
    }, 0);

    const categoryMap = {};
    for (const p of products) {
      const cat = String(p.category || "General").trim() || "General";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    }
    const topCategories = Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const rangeSeries =
      rangeStart != null && rangeEnd != null
        ? await buildRangeSeriesFromAggregate(rangeStart, rangeEnd, bucket)
        : buildSeriesInRange(orders, rangeStart, rangeEnd, bucket);

    const fromIso = rangeStart ? rangeStart.toISOString() : null;
    const toIso = rangeEnd ? rangeEnd.toISOString() : null;

    res.json({
      range: {
        filtered: true,
        preset: resolvedPreset,
        from: fromIso,
        to: toIso,
        bucket,
      },
      totals: {
        orders: orders.length,
        products: products.length,
        users: usersInRange.length,
        admins: usersInRange.filter((u) => u.isAdmin).length,
      },
      activity: {
        ordersLast7Days: null,
        ordersLast30Days: null,
        revenueLast7Days: null,
        revenueLast30Days: null,
        newUsersLast7Days: null,
        newUsersLast30Days: null,
        ordersInPeriod: orders.length,
        revenueInPeriod: m.totalRevenue,
        newUsersInPeriod: usersInRange.length,
      },
      revenue: {
        total: m.totalRevenue,
        delivered: m.deliveredRevenue,
        averageOrderValue: orders.length ? m.totalRevenue / orders.length : 0,
        byStatus: m.revenueByStatus,
        excludingCancelled: m.revenueExCancelled,
      },
      funnel: {
        deliveredOrders: m.deliveredCount,
        cancelledOrders: m.cancelledCount,
        deliveryRatePercent: orders.length ? Math.round((m.deliveredCount / orders.length) * 1000) / 10 : 0,
        couponPenetrationPercent: orders.length ? Math.round((m.couponOrders / orders.length) * 1000) / 10 : 0,
      },
      trends: {
        last7Days: { labels: [], orderCounts: [], revenues: [] },
        last14Days: { labels: [], orderCounts: [], revenues: [] },
        rangeSeries,
      },
      inventory: {
        lowStockProducts,
        outOfStockProducts,
        inStockProducts,
        inventoryRetailValue,
        topCategories,
      },
      carts: {
        usersWithActiveCart: cartUsers.length,
        totalCartItems,
        estimatedCartValue,
      },
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

module.exports = {
  getAdminAnalytics,
};
