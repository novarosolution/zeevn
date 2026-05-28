const mongoose = require("mongoose");
const Order = require("../../models/Order");
const User = require("../../models/User");
const Product = require("../../models/Product");
const Coupon = require("../../models/Coupon");
const CouponRedemption = require("../../models/CouponRedemption");
const {
  normalizeCouponCode,
  getCouponValidationError,
  computeCouponDiscount,
} = require("../../utils/coupon");
const { buildCouponValidationResponse } = require("../couponController");
const { resolveProductLineFromRaw } = require("../../utils/productLine");
const {
  ORDER_STATUS_VALUES,
  ORDER_STATUSES_ALLOW_ADDRESS_EDIT,
  ORDER_STATUSES_DELIVERY_DASHBOARD,
  ORDER_STATUSES_MARK_DELIVERABLE_FROM,
} = require("../../constants/orderStatuses");
const {
  createPaymentOrder,
  getRazorpayKeyId,
  verifyPaymentSignature,
  verifyWebhookSignature,
} = require("../../services/razorpayService");
const {
  fetchDrivingRouteEncodedPolyline,
  getDirectionsApiKey,
} = require("../../services/googleDirectionsService");
const {
  PLATFORM_FEE,
  DEFAULT_DELIVERY_FEE,
  DELIVERY_LOCATION_UPDATE_MIN_INTERVAL_MS,
  INVOICE_STATUS_VALUES,
  SUPPORTED_PAYMENT_METHODS,
  RAZORPAY_PAYMENT_WINDOW_MS,
  liveLocationDestinationSummary,
  getRequestSubtotal,
  getUserCartSubtotal,
} = require("./shared");

async function updateAdminOrderDetails(req, res, next) {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (req.body?.status !== undefined) {
      if (!ORDER_STATUS_VALUES.includes(req.body.status)) {
        return res.status(400).json({ message: "Invalid order status." });
      }
      order.status = req.body.status;
    }
    if (req.body?.paymentMethod !== undefined) {
      order.paymentMethod = String(req.body.paymentMethod || "Cash on Delivery").trim();
    }
    if (req.body?.shippingAddress && typeof req.body.shippingAddress === "object") {
      order.shippingAddress = {
        ...order.shippingAddress,
        ...req.body.shippingAddress,
      };
    }
    if (req.body?.assignedDeliveryUser !== undefined) {
      const raw = req.body.assignedDeliveryUser;
      if (raw === null || raw === "") {
        order.assignedDeliveryUser = null;
      } else if (!mongoose.Types.ObjectId.isValid(String(raw))) {
        return res.status(400).json({ message: "Invalid delivery assignee id." });
      } else {
        const assignee = await User.findById(raw).select("isDeliveryPartner");
        if (!assignee) {
          return res.status(404).json({ message: "Assignee user not found." });
        }
        if (!assignee.isDeliveryPartner) {
          return res.status(400).json({
            message: "That user is not enabled as a delivery partner. Enable them in Manage Users first.",
          });
        }
        order.assignedDeliveryUser = assignee._id;
      }
    }
    if (req.body?.invoice && typeof req.body.invoice === "object") {
      const nextInvoice = { ...(order.invoice?.toObject?.() || order.invoice || {}) };
      if (req.body.invoice.number !== undefined) {
        nextInvoice.number = String(req.body.invoice.number || "").trim();
      }
      if (req.body.invoice.issueDate !== undefined) {
        const d = req.body.invoice.issueDate ? new Date(req.body.invoice.issueDate) : null;
        if (d && Number.isNaN(d.getTime())) {
          return res.status(400).json({ message: "Invalid invoice issue date." });
        }
        nextInvoice.issueDate = d || new Date();
      }
      if (req.body.invoice.dueDate !== undefined) {
        const d = req.body.invoice.dueDate ? new Date(req.body.invoice.dueDate) : null;
        if (d && Number.isNaN(d.getTime())) {
          return res.status(400).json({ message: "Invalid invoice due date." });
        }
        nextInvoice.dueDate = d;
      }
      if (req.body.invoice.notes !== undefined) {
        nextInvoice.notes = String(req.body.invoice.notes || "").trim();
      }
      if (req.body.invoice.taxRatePercent !== undefined) {
        const taxRatePercent = Number(req.body.invoice.taxRatePercent || 0);
        if (!Number.isFinite(taxRatePercent) || taxRatePercent < 0) {
          return res.status(400).json({ message: "Invalid invoice tax rate." });
        }
        nextInvoice.taxRatePercent = taxRatePercent;
        const taxableBase =
          Number(order.priceBreakdown?.itemsTotal || 0) +
          Number(order.priceBreakdown?.deliveryFee || 0) +
          Number(order.priceBreakdown?.platformFee || 0) -
          Number(order.priceBreakdown?.discountAmount || 0);
        nextInvoice.taxAmount = Number(((Math.max(0, taxableBase) * taxRatePercent) / 100).toFixed(2));
      }
      if (req.body.invoice.status !== undefined) {
        const status = String(req.body.invoice.status || "").trim().toLowerCase();
        if (!INVOICE_STATUS_VALUES.includes(status)) {
          return res.status(400).json({ message: "Invalid invoice status." });
        }
        nextInvoice.status = status;
      }
      nextInvoice.updatedAt = new Date();
      order.invoice = nextInvoice;
    }
    await order.save();
    const updated = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("assignedDeliveryUser", "name email phone")
      .populate("products.product", "name price image inStock stockQty");
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

async function getMyDeliveryOrders(req, res, next) {
  try {
    const orders = await Order.find({
      assignedDeliveryUser: req.user._id,
      status: { $in: ORDER_STATUSES_DELIVERY_DASHBOARD },
    })
      .sort({ createdAt: -1 })
      .populate("user", "name email phone")
      .populate("products.product", "name price image inStock stockQty");

    res.json(orders);
  } catch (error) {
    next(error);
  }
}

async function markMyDeliveryOrderDelivered(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({ message: "Invalid order id." });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    if (!order.assignedDeliveryUser || String(order.assignedDeliveryUser) !== String(req.user._id)) {
      return res.status(403).json({ message: "This order is not assigned to you." });
    }
    if (!ORDER_STATUSES_MARK_DELIVERABLE_FROM.includes(order.status)) {
      return res.status(400).json({
        message:
          'Order must be at least "Ready for pickup", "Out for delivery", or "Shipped" before you can mark it delivered. Ask admin to advance the status.',
      });
    }

    order.status = "delivered";
    await order.save();

    const updated = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("assignedDeliveryUser", "name email phone")
      .populate("products.product", "name price image inStock stockQty");
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!ORDER_STATUS_VALUES.includes(status)) {
      return res.status(400).json({ message: "Invalid order status." });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    order.status = status;
    await order.save();

    const updated = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("assignedDeliveryUser", "name email phone")
      .populate("products.product", "name price image");

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

async function deleteOrder(req, res, next) {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    await order.deleteOne();
    res.json({ message: "Order deleted successfully." });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  updateAdminOrderDetails,
  getMyDeliveryOrders,
  markMyDeliveryOrderDelivered,
  updateOrderStatus,
  deleteOrder,
};
