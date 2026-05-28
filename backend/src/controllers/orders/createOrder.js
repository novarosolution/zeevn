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

async function createOrder(req, res, next) {
  try {
    const { products, shippingAddress, paymentMethod, couponCode } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Products are required to place an order." });
    }

    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.phone ||
      !shippingAddress.line1 ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.postalCode ||
      !shippingAddress.country
    ) {
      return res.status(400).json({ message: "Complete shipping address is required." });
    }

    const normalizedPaymentMethod = (() => {
      const raw = String(paymentMethod || "").trim();
      if (!raw) return "Cash on Delivery";
      const match = SUPPORTED_PAYMENT_METHODS.find(
        (m) => m.toLowerCase() === raw.toLowerCase()
      );
      return match || raw;
    })();
    if (!SUPPORTED_PAYMENT_METHODS.includes(normalizedPaymentMethod)) {
      return res.status(400).json({
        message: `Unsupported payment method. Allowed: ${SUPPORTED_PAYMENT_METHODS.join(", ")}.`,
      });
    }

    const objectIdItems = products.filter((item) => mongoose.Types.ObjectId.isValid(item.product));
    const objectProductIds = objectIdItems.map((item) => item.product);
    const foundProducts = objectProductIds.length
      ? await Product.find({ _id: { $in: objectProductIds } })
      : [];

    const productMap = new Map(foundProducts.map((product) => [String(product._id), product]));
    const normalizedItems = [];

    for (const rawItem of products) {
      const quantity = Number(rawItem.quantity || 1);
      if (!quantity || quantity < 1) {
        return res.status(400).json({ message: "Each product must have a quantity of 1 or more." });
      }

      const hasObjectId = mongoose.Types.ObjectId.isValid(rawItem.product);
      if (hasObjectId) {
        const matchedProduct = productMap.get(String(rawItem.product));
        if (!matchedProduct) {
          return res.status(404).json({ message: "One or more products were not found." });
        }

        let line;
        try {
          line = resolveProductLineFromRaw(matchedProduct, rawItem);
        } catch (e) {
          return res.status(e.statusCode || 400).json({ message: e.message || "Invalid product line." });
        }

        normalizedItems.push({
          product: matchedProduct._id,
          name: line.name,
          price: line.price,
          image: matchedProduct.image || "",
          quantity,
          ...(line.variantLabel ? { variantLabel: line.variantLabel } : {}),
        });
      } else {
        const externalName = String(rawItem.name || "").trim();
        const externalPrice = Number(rawItem.price);

        if (!externalName || Number.isNaN(externalPrice) || externalPrice < 0) {
          return res.status(400).json({
            message: "Custom product items need valid name and price.",
          });
        }

        normalizedItems.push({
          externalProductId: String(rawItem.product || rawItem.id || ""),
          name: externalName,
          price: externalPrice,
          image: String(rawItem.image || ""),
          quantity,
        });
      }
    }

    const itemsTotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    let resolvedCoupon = null;
    let discountAmount = 0;
    const normalizedCouponCode = normalizeCouponCode(couponCode);
    if (normalizedCouponCode) {
      resolvedCoupon = await Coupon.findOne({ code: normalizedCouponCode });
      const couponError = getCouponValidationError(resolvedCoupon, itemsTotal);
      if (couponError) {
        return res.status(400).json({ message: couponError });
      }
      const issuedForUserId = resolvedCoupon.issuedForUser ? String(resolvedCoupon.issuedForUser) : "";
      const personalOk =
        issuedForUserId && issuedForUserId === String(req.user._id);
      if (!resolvedCoupon.isVisibleToUsers && !personalOk) {
        return res.status(400).json({ message: "This coupon is not available for users." });
      }
      if (issuedForUserId && issuedForUserId !== String(req.user._id)) {
        return res.status(400).json({ message: "This coupon is linked to another account." });
      }
      if (resolvedCoupon.isOneTimePerUser) {
        const usedByUser = await CouponRedemption.exists({
          coupon: resolvedCoupon._id,
          user: req.user._id,
        });
        if (usedByUser) {
          return res.status(400).json({ message: "This coupon can be used only one time per user." });
        }
      }
      discountAmount = computeCouponDiscount(resolvedCoupon, itemsTotal);
    }

    const deliveryFee = DEFAULT_DELIVERY_FEE;
    const totalPrice = Math.max(0, Number((itemsTotal + deliveryFee + PLATFORM_FEE - discountAmount).toFixed(2)));

    const isRazorpay = normalizedPaymentMethod === "Razorpay";
    const initialStatus = isRazorpay ? "pending_payment" : "pending";
    const paymentExpiresAt = isRazorpay ? new Date(Date.now() + RAZORPAY_PAYMENT_WINDOW_MS) : null;

    const order = await Order.create({
      user: req.user._id,
      products: normalizedItems,
      totalPrice,
      shippingAddress,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: "pending",
      paymentExpiresAt,
      coupon: resolvedCoupon
        ? {
            code: resolvedCoupon.code,
            title: resolvedCoupon.title,
            type: resolvedCoupon.type,
            value: Number(resolvedCoupon.value || 0),
            discountAmount,
          }
        : undefined,
      priceBreakdown: {
        itemsTotal,
        deliveryFee,
        platformFee: PLATFORM_FEE,
        discountAmount,
      },
      status: initialStatus,
    });
    order.invoice = {
      ...(order.invoice || {}),
      number: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(order._id).slice(-6).toUpperCase()}`,
      issueDate: new Date(),
      status: "draft",
      updatedAt: new Date(),
    };

    let razorpayKeyId = "";
    if (isRazorpay) {
      try {
        const rzpOrder = await createPaymentOrder({
          amountInRupees: totalPrice,
          currency: "INR",
          receipt: `order_${String(order._id)}`,
          notes: {
            orderId: String(order._id),
            userId: String(req.user._id),
            customerName: String(shippingAddress.fullName || "").slice(0, 80),
          },
        });
        order.razorpay = {
          ...(order.razorpay || {}),
          orderId: String(rzpOrder?.id || ""),
        };
        razorpayKeyId = getRazorpayKeyId();
      } catch (rzpErr) {
        await Order.findByIdAndDelete(order._id);
        const status = rzpErr.statusCode || 500;
        return res.status(status).json({
          message: rzpErr.message || "Unable to start Razorpay payment.",
          code: rzpErr.code || "RAZORPAY_ERROR",
        });
      }
    }
    await order.save();

    if (resolvedCoupon) {
      resolvedCoupon.usedCount = Number(resolvedCoupon.usedCount || 0) + 1;
      await resolvedCoupon.save();
      await CouponRedemption.create({
        coupon: resolvedCoupon._id,
        user: req.user._id,
        order: order._id,
      });
    }

    await User.findByIdAndUpdate(req.user._id, { $set: { cartItems: [] } });

    const populatedOrder = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("assignedDeliveryUser", "name email phone")
      .populate("products.product", "name price image inStock stockQty");

    const responsePayload = populatedOrder.toObject();
    if (isRazorpay) {
      responsePayload.razorpayKeyId = razorpayKeyId;
    }

    res.status(201).json(responsePayload);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOrder,
};
