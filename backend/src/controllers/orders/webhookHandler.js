const Order = require("../../models/Order");

/**
 * Applies Razorpay webhook payload to the matching order (idempotent when order already paid).
 */
async function applyRazorpayWebhookEvent(event) {
  const eventType = String(event?.event || "");
  const paymentEntity = event?.payload?.payment?.entity;
  const orderEntity = event?.payload?.order?.entity;
  const razorpayOrderId =
    paymentEntity?.order_id || orderEntity?.id || event?.payload?.order_id || "";
  const razorpayPaymentId = paymentEntity?.id || "";

  if (!razorpayOrderId) {
    return { ignored: true };
  }

  const order = await Order.findOne({ "razorpay.orderId": razorpayOrderId });
  if (!order) {
    return { missingOrder: true };
  }

  if (eventType === "payment.captured" || eventType === "order.paid") {
    if (order.paymentStatus !== "paid") {
      order.razorpay = {
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId || order.razorpay?.paymentId || "",
        signature: order.razorpay?.signature || "",
      };
      order.paymentStatus = "paid";
      order.status = "confirmed";
      order.paymentExpiresAt = null;
      if (order.invoice) {
        order.invoice.status = "paid";
        order.invoice.updatedAt = new Date();
      }
      await order.save();
    }
    return { updated: order.paymentStatus === "paid" };
  }

  if (eventType === "payment.failed") {
    if (order.paymentStatus === "pending") {
      order.paymentStatus = "failed";
      await order.save();
    }
    return { failed: true };
  }

  return { ignored: true };
}

module.exports = { applyRazorpayWebhookEvent };
