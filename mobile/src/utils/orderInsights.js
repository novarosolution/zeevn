import {
  ORDER_PROGRESS_STEPS,
  PROGRESS_STEP_STATUSES,
  formatEventClock,
  getActiveProgressStep,
  isCancelledOrder,
  isDeliveredOrder,
  latestHistoryAt,
} from "./orderStatus";

/**
 * Derived views of a customer's orders — "buy again" lines, lifetime figures and a per-step timeline.
 * Everything here is pure and tolerant of missing fields, so a half-filled order never throws.
 */

const idOf = (value) => {
  if (!value) return "";
  if (typeof value === "object") return String(value._id || value.id || "");
  return String(value);
};

const timeOf = (order) => {
  const t = new Date(order?.createdAt || 0).getTime();
  return Number.isFinite(t) ? t : 0;
};

/**
 * Products the shopper has already received, newest order first, one entry per product.
 * @returns {Array<{ productId:string, name:string, quantity:number, lastOrderedAt:number, times:number }>}
 */
export function buildBuyAgainLines(orders, { limit = 10 } = {}) {
  const list = (Array.isArray(orders) ? orders : [])
    .filter((order) => isDeliveredOrder(order?.status))
    .sort((a, b) => timeOf(b) - timeOf(a));

  const byId = new Map();
  list.forEach((order) => {
    (Array.isArray(order.products) ? order.products : []).forEach((line) => {
      const productId = idOf(line?.product) || idOf(line?.id);
      if (!productId) return;
      const quantity = Math.max(1, Math.floor(Number(line?.quantity) || 1));
      const existing = byId.get(productId);
      if (existing) {
        existing.times += 1;
        return;
      }
      byId.set(productId, {
        productId,
        name: String(line?.name || "").trim(),
        quantity,
        lastOrderedAt: timeOf(order),
        times: 1,
      });
    });
  });

  // Things bought more than once float up: they are the staples.
  return [...byId.values()]
    .sort((a, b) => b.times - a.times || b.lastOrderedAt - a.lastOrderedAt)
    .slice(0, limit);
}

/** Lifetime numbers for the account header. Cancelled orders do not count. */
export function summariseOrders(orders) {
  const list = (Array.isArray(orders) ? orders : []).filter((order) => !isCancelledOrder(order?.status));
  const delivered = list.filter((order) => isDeliveredOrder(order?.status));
  const spent = delivered.reduce((sum, order) => sum + (Number(order?.totalPrice) || 0), 0);
  const jars = delivered.reduce(
    (sum, order) =>
      sum + (Array.isArray(order.products) ? order.products : []).reduce((n, line) => n + (Number(line?.quantity) || 0), 0),
    0
  );
  const first = delivered.length ? Math.min(...delivered.map(timeOf).filter(Boolean)) : 0;
  return { orders: list.length, delivered: delivered.length, spent, jars, memberSince: first || 0 };
}

/**
 * Step-by-step timeline for one order: every progress step with its state and, when the order's history recorded it,
 * the time it happened.
 * @returns {Array<{ key:string, title:string, subtitle:string, state:"done"|"active"|"todo"|"skipped", at:string }>}
 */
export function buildOrderTimeline(order) {
  const status = String(order?.status || "pending");
  const history = Array.isArray(order?.statusHistory) ? order.statusHistory : Array.isArray(order?.history) ? order.history : [];
  const cancelled = isCancelledOrder(status);
  const active = getActiveProgressStep(status);
  const delivered = isDeliveredOrder(status);

  return ORDER_PROGRESS_STEPS.map((step, index) => {
    const recorded = latestHistoryAt(history, PROGRESS_STEP_STATUSES[step.key]);
    const at = recorded ? formatEventClock(recorded) : index === 0 && order?.createdAt ? formatEventClock(order.createdAt) : "";
    let state;
    if (cancelled) state = index === 0 ? "done" : "skipped";
    else if (delivered || index < active) state = "done";
    else if (index === active) state = "active";
    else state = "todo";
    return { key: step.key, title: step.title, subtitle: step.subtitle, state, at };
  });
}

/** One friendly line about where an order is, for compact surfaces. */
export function describeOrderNow(order) {
  const status = String(order?.status || "pending");
  if (isCancelledOrder(status)) return "This order was cancelled";
  if (isDeliveredOrder(status)) return "Delivered";
  const step = ORDER_PROGRESS_STEPS[getActiveProgressStep(status)];
  return step ? `${step.title} · ${step.subtitle}` : "In progress";
}
