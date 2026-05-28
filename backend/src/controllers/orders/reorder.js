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

async function reorderMyOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id).populate(
      "products.product",
      "name price image inStock stockQty variants"
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    if (String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can reorder only your own orders." });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const existingMap = new Map();
    for (const item of user.cartItems || []) {
      const pid = String(item.product || item.externalProductId || "");
      if (!pid) continue;
      const vk = String(item.variantLabel || "");
      const mapKey = `${pid}::${vk}`;
      const normalizedItem = typeof item.toObject === "function" ? item.toObject() : item;
      existingMap.set(mapKey, {
        ...normalizedItem,
        quantity: Number(item.quantity || 0),
      });
    }

    const skippedItems = [];
    const addedItems = [];

    for (const oldItem of order.products || []) {
      if (!oldItem.product?._id) {
        skippedItems.push({
          name: oldItem.name,
          reason: "Product no longer available.",
        });
        continue;
      }

      const liveProduct = oldItem.product;
      if (!liveProduct.inStock || Number(liveProduct.stockQty || 0) <= 0) {
        skippedItems.push({
          name: oldItem.name,
          reason: "Out of stock.",
        });
        continue;
      }

      const desiredQty = Number(oldItem.quantity || 1);
      let line;
      try {
        line = resolveProductLineFromRaw(liveProduct, {
          variantLabel: oldItem.variantLabel || "",
          price: oldItem.price,
        });
      } catch {
        skippedItems.push({
          name: oldItem.name,
          reason: "Product options changed.",
        });
        continue;
      }

      const mapKey = `${String(liveProduct._id)}::${line.variantLabel || ""}`;
      const existingQty = Number(existingMap.get(mapKey)?.quantity || 0);
      const availableQty = Math.max(0, Number(liveProduct.stockQty || 0) - existingQty);

      if (availableQty <= 0) {
        skippedItems.push({
          name: oldItem.name,
          reason: "No additional stock available.",
        });
        continue;
      }

      const qtyToAdd = Math.min(desiredQty, availableQty);
      if (qtyToAdd <= 0) {
        skippedItems.push({
          name: oldItem.name,
          reason: "Out of stock.",
        });
        continue;
      }

      const current = existingMap.get(mapKey);
      const nextItem = {
        product: liveProduct._id,
        name: line.name,
        price: line.price,
        image: liveProduct.image || "",
        quantity: Number(current?.quantity || 0) + qtyToAdd,
        ...(line.variantLabel ? { variantLabel: line.variantLabel } : {}),
      };
      existingMap.set(mapKey, nextItem);
      addedItems.push({
        name: liveProduct.name,
        quantity: qtyToAdd,
      });
    }

    if (addedItems.length === 0) {
      return res.status(400).json({
        message: "No items were added. Products are out of stock or unavailable.",
        skippedItems,
      });
    }

    user.cartItems = Array.from(existingMap.values());
    await user.save();

    return res.json({
      message: "Reorder items added to cart.",
      addedItems,
      skippedItems,
      cartCount: user.cartItems.length,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  reorderMyOrder,
};
