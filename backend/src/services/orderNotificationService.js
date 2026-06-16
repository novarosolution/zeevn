const Order = require("../models/Order");
const { sendEmail } = require("./emailService");
const { sendWhatsAppText } = require("./whatsappService");

function formatInr(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "₹0";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function buildOrderAlertText(order) {
  const id = String(order._id || "").slice(-6).toUpperCase();
  const customer = order.user?.name || order.shippingAddress?.fullName || "Customer";
  const phone = order.shippingAddress?.phone || "—";
  const email = order.user?.email || "—";
  const city = order.shippingAddress?.city || "";
  const pin = order.shippingAddress?.postalCode || "";
  const payment = order.paymentMethod || "—";
  const status = order.status || "pending";
  const total = formatInr(order.totalPrice);

  const lines = (order.products || []).map((item) => {
    const label = item.variantLabel ? `${item.name} (${item.variantLabel})` : item.name;
    return `• ${label} × ${item.quantity} — ${formatInr(item.price * item.quantity)}`;
  });

  const adminUrl = String(process.env.ADMIN_APP_URL || "").trim();
  const footer = adminUrl
    ? `\n\nOpen admin: ${adminUrl.replace(/\/$/, "")}/admin/orders`
    : "\n\nOpen the Zeevan admin app → Orders to confirm and complete this order.";

  return [
    "🛒 New Zeevan order",
    `Order #${id}`,
    `Status: ${status}`,
    `Customer: ${customer}`,
    `Phone: ${phone}`,
    `Email: ${email}`,
    `Ship to: ${city}${pin ? ` ${pin}` : ""}`,
    `Payment: ${payment}`,
    `Total: ${total}`,
    "",
    "Items:",
    ...lines,
    footer,
  ].join("\n");
}

/**
 * Email + WhatsApp admin alert — idempotent via order.adminNotifiedAt.
 * Failures are logged; never throws to callers.
 */
async function notifyAdminNewOrder(orderId) {
  try {
    const order = await Order.findById(orderId)
      .populate("user", "name email")
      .populate("products.product", "name stockQty inStock");

    if (!order || order.adminNotifiedAt) {
      return { ok: false, skipped: true };
    }

    const text = buildOrderAlertText(order);
    const shortId = String(order._id || "").slice(-6).toUpperCase();
    const subject = `New order #${shortId} — ${formatInr(order.totalPrice)} — Zeevan`;

    const [emailResult, whatsappResult] = await Promise.all([
      sendEmail({ subject, text }),
      sendWhatsAppText(text),
    ]);

    if (emailResult.ok || whatsappResult.ok) {
      order.adminNotifiedAt = new Date();
      await order.save();
    }

    return { ok: true, email: emailResult, whatsapp: whatsappResult };
  } catch (err) {
    console.error("[orderNotification] failed:", err.message);
    return { ok: false, error: err.message };
  }
}

module.exports = {
  buildOrderAlertText,
  notifyAdminNewOrder,
};
