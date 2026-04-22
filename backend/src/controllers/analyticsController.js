const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function buildLastNDaysSeries(n, orders) {
  const now = new Date();
  const labels = [];
  const orderCounts = [];
  const revenues = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = startOfDay(new Date(now));
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const dayOrders = orders.filter((o) => {
      const t = new Date(o.createdAt || 0);
      return t >= d && t < next;
    });
    labels.push(
      d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
    );
    orderCounts.push(dayOrders.length);
    revenues.push(dayOrders.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0));
  }
  return { labels, orderCounts, revenues };
}

async function getAdminAnalytics(req, res, next) {
  try {
    const [orders, products, users] = await Promise.all([
      Order.find().lean(),
      Product.find().lean(),
      User.find().select("isAdmin cartItems createdAt").lean(),
    ]);

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
    const deliveredRevenue = orders
      .filter((order) => order.status === "delivered")
      .reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);

    const revenueByStatus = ["pending", "paid", "shipped", "delivered", "cancelled"].reduce((acc, status) => {
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
    const dayMs = 86400000;
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

    const deliveredCount = statusBreakdown.delivered || 0;
    const cancelledCount = statusBreakdown.cancelled || 0;
    const revenueExCancelled = orders
      .filter((o) => (o.status || "") !== "cancelled")
      .reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);

    const trend7 = buildLastNDaysSeries(7, orders);
    const trend14 = buildLastNDaysSeries(14, orders);

    res.json({
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
        total: totalRevenue,
        delivered: deliveredRevenue,
        averageOrderValue: orders.length ? totalRevenue / orders.length : 0,
        byStatus: revenueByStatus,
        excludingCancelled: revenueExCancelled,
      },
      funnel: {
        deliveredOrders: deliveredCount,
        cancelledOrders: cancelledCount,
        deliveryRatePercent: orders.length ? Math.round((deliveredCount / orders.length) * 1000) / 10 : 0,
        couponPenetrationPercent: orders.length ? Math.round((couponOrders / orders.length) * 1000) / 10 : 0,
      },
      trends: {
        last7Days: trend7,
        last14Days: trend14,
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
        couponOrders,
        totalDiscount,
        averageDiscountPerCouponOrder: couponOrders ? totalDiscount / couponOrders : 0,
        topCoupons,
      },
      statusBreakdown,
      topProducts,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAdminAnalytics,
};
