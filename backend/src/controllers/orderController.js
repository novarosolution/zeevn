const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const Coupon = require("../models/Coupon");
const CouponRedemption = require("../models/CouponRedemption");
const {
  normalizeCouponCode,
  getCouponValidationError,
  computeCouponDiscount,
} = require("../utils/coupon");
const { buildCouponValidationResponse } = require("./couponController");
const { resolveProductLineFromRaw } = require("../utils/productLine");
const {
  ORDER_STATUS_VALUES,
  ORDER_STATUSES_ALLOW_ADDRESS_EDIT,
  ORDER_STATUSES_DELIVERY_DASHBOARD,
  ORDER_STATUSES_MARK_DELIVERABLE_FROM,
} = require("../constants/orderStatuses");
const {
  createPaymentOrder,
  getRazorpayKeyId,
  verifyPaymentSignature,
  verifyWebhookSignature,
} = require("../services/razorpayService");
const {
  fetchDrivingRouteEncodedPolyline,
  getDirectionsApiKey,
} = require("../services/googleDirectionsService");

const PLATFORM_FEE = 1.2;
const DEFAULT_DELIVERY_FEE = 0;
/** Ignore duplicate PATCH /delivery/location within this window (ms). */
const DELIVERY_LOCATION_UPDATE_MIN_INTERVAL_MS = 10000;

/** Shipping summary for GET .../live-location (order owner only). */
function liveLocationDestinationSummary(shippingAddress) {
  const a = shippingAddress && typeof shippingAddress === "object" ? shippingAddress : {};
  return {
    fullName: String(a.fullName || "").trim(),
    line1: String(a.line1 || "").trim(),
    city: String(a.city || "").trim(),
    state: String(a.state || "").trim(),
    postalCode: String(a.postalCode || "").trim(),
    phone: String(a.phone || "").trim(),
    country: String(a.country || "").trim(),
  };
}
const INVOICE_STATUS_VALUES = ["draft", "final", "paid", "void"];
const SUPPORTED_PAYMENT_METHODS = ["Cash on Delivery", "Razorpay"];
const RAZORPAY_PAYMENT_WINDOW_MS = 30 * 60 * 1000;

function getRequestSubtotal(req) {
  const rawSubtotal = req.body?.subtotal ?? req.query?.subtotal;
  if (rawSubtotal === undefined || rawSubtotal === null || rawSubtotal === "") {
    return null;
  }

  const subtotal = Number(rawSubtotal);
  return Number.isFinite(subtotal) && subtotal >= 0 ? subtotal : null;
}

function getUserCartSubtotal(user) {
  return (user.cartItems || []).reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
}

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

async function getAllOrders(req, res, next) {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("assignedDeliveryUser", "name email phone")
      .populate("products.product", "name price image inStock stockQty");

    res.json(orders);
  } catch (error) {
    next(error);
  }
}

async function getMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("assignedDeliveryUser", "name phone")
      .populate("products.product", "name price image inStock stockQty");
    res.json(orders);
  } catch (error) {
    next(error);
  }
}

async function updateMyDeliveryLocation(req, res, next) {
  try {
    const lat = Number(req.body?.latitude);
    const lng = Number(req.body?.longitude);
    const accRaw = req.body?.accuracyMeters;
    const accuracyMeters =
      accRaw !== undefined && accRaw !== null && accRaw !== ""
        ? Number(accRaw)
        : null;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: "latitude and longitude are required as numbers." });
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ message: "Invalid coordinates." });
    }

    const user = await User.findById(req.user._id).select("deliveryLiveLocation");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const prevAt = user.deliveryLiveLocation?.updatedAt;
    if (prevAt && Date.now() - new Date(prevAt).getTime() < DELIVERY_LOCATION_UPDATE_MIN_INTERVAL_MS) {
      return res.status(200).json({
        ok: true,
        throttled: true,
        updatedAt: new Date(prevAt).toISOString(),
      });
    }

    const now = new Date();
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        deliveryLiveLocation: {
          latitude: lat,
          longitude: lng,
          accuracyMeters: Number.isFinite(accuracyMeters) ? accuracyMeters : null,
          updatedAt: now,
        },
      },
    });

    res.json({ ok: true, throttled: false, updatedAt: now.toISOString() });
  } catch (error) {
    next(error);
  }
}

async function getMyOrderLiveLocation(req, res, next) {
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(orderId))) {
      return res.status(400).json({ message: "Invalid order id." });
    }

    const order = await Order.findOne({ _id: orderId, user: req.user._id })
      .select("status assignedDeliveryUser shippingAddress")
      .populate({
        path: "assignedDeliveryUser",
        select: "name phone deliveryLiveLocation",
      });

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const status = String(order.status || "");
    const liveLocationStatuses = new Set(["ready_for_pickup", "shipped", "out_for_delivery"]);
    if (!liveLocationStatuses.has(status)) {
      return res.status(403).json({
        message: "Live location is available after packing starts (ready for pickup, shipped, or out for delivery).",
      });
    }

    const partner = order.assignedDeliveryUser;
    if (!partner) {
      return res.status(404).json({ message: "No delivery partner assigned yet." });
    }

    const loc = partner.deliveryLiveLocation;
    const lat = loc?.latitude;
    const lng = loc?.longitude;
    const destLat = order.shippingAddress?.latitude;
    const destLng = order.shippingAddress?.longitude;
    const destSummary = liveLocationDestinationSummary(order.shippingAddress);

    const payload = {
      trackable: Number.isFinite(lat) && Number.isFinite(lng),
      partner: {
        name: partner.name || "",
        phone: partner.phone || "",
      },
      destination: {
        latitude: Number.isFinite(Number(destLat)) ? Number(destLat) : null,
        longitude: Number.isFinite(Number(destLng)) ? Number(destLng) : null,
        ...destSummary,
      },
    };

    if (!payload.trackable) {
      return res.json({
        ...payload,
        latitude: null,
        longitude: null,
        updatedAt: null,
        accuracyMeters: null,
        message: "Partner has not shared location yet.",
      });
    }

    res.json({
      ...payload,
      latitude: lat,
      longitude: lng,
      updatedAt: loc.updatedAt ? new Date(loc.updatedAt).toISOString() : null,
      accuracyMeters:
        loc.accuracyMeters != null && Number.isFinite(Number(loc.accuracyMeters))
          ? Number(loc.accuracyMeters)
          : null,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Driving route polyline (Google Directions) for order owner — same auth as live-location.
 * Coordinates are taken from the database only (not client-supplied).
 */
async function getMyOrderDrivingRoute(req, res, next) {
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(orderId))) {
      return res.status(400).json({ message: "Invalid order id." });
    }

    const order = await Order.findOne({ _id: orderId, user: req.user._id })
      .select("status shippingAddress")
      .populate({
        path: "assignedDeliveryUser",
        select: "deliveryLiveLocation",
      });

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const status = String(order.status || "");
    const liveLocationStatuses = new Set(["ready_for_pickup", "shipped", "out_for_delivery"]);
    if (!liveLocationStatuses.has(status)) {
      return res.status(403).json({
        message: "Driving route is available when the order is ready for pickup, shipped, or out for delivery.",
      });
    }

    const partner = order.assignedDeliveryUser;
    if (!partner) {
      return res.status(404).json({ message: "No delivery partner assigned yet." });
    }

    const loc = partner.deliveryLiveLocation;
    const oLat = loc?.latitude;
    const oLng = loc?.longitude;
    const dLat = order.shippingAddress?.latitude;
    const dLng = order.shippingAddress?.longitude;

    const origOk = Number.isFinite(Number(oLat)) && Number.isFinite(Number(oLng));
    const destOk = Number.isFinite(Number(dLat)) && Number.isFinite(Number(dLng));
    if (!origOk || !destOk) {
      return res.json({ encodedPolyline: null, message: "Origin or destination coordinates are missing." });
    }

    const apiKey = getDirectionsApiKey();
    if (!apiKey) {
      return res.json({ encodedPolyline: null, message: "Directions are not configured on the server." });
    }

    const encodedPolyline = await fetchDrivingRouteEncodedPolyline(
      orderId,
      Number(oLat),
      Number(oLng),
      Number(dLat),
      Number(dLng),
      apiKey
    );

    return res.json({
      encodedPolyline,
      provider: encodedPolyline ? "google" : null,
    });
  } catch (error) {
    next(error);
  }
}

async function validateCouponForCart(req, res, next) {
  try {
    const couponCode = normalizeCouponCode(req.body?.couponCode);
    if (!couponCode) {
      return res.status(400).json({ message: "Coupon code is required." });
    }

    const user = await User.findById(req.user._id).select("cartItems");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const subtotal = getRequestSubtotal(req) ?? getUserCartSubtotal(user);
    const coupon = await Coupon.findOne({ code: couponCode });
    const issuedForUserId = coupon?.issuedForUser ? String(coupon.issuedForUser) : "";
    const personalOk =
      coupon && issuedForUserId && issuedForUserId === String(req.user._id);
    if (coupon && !coupon.isVisibleToUsers && !personalOk) {
      return res.status(400).json({ valid: false, message: "This coupon is not available for users." });
    }
    if (coupon && issuedForUserId && issuedForUserId !== String(req.user._id)) {
      return res.status(400).json({ valid: false, message: "This coupon is linked to another account." });
    }
    if (coupon && coupon.isOneTimePerUser) {
      const usedByUser = await CouponRedemption.exists({ coupon: coupon._id, user: req.user._id });
      if (usedByUser) {
        return res.status(400).json({
          valid: false,
          message: "This coupon can be used only one time per user.",
        });
      }
    }
    const payload = buildCouponValidationResponse(coupon, subtotal);

    if (!payload.valid) {
      return res.status(400).json(payload);
    }
    return res.json({
      ...payload,
      subtotal: Number(subtotal.toFixed(2)),
    });
  } catch (error) {
    next(error);
  }
}

async function getAvailableCouponsForCart(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select("cartItems");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const subtotal = getRequestSubtotal(req) ?? getUserCartSubtotal(user);
    const allCoupons = await Coupon.find({
      isActive: true,
      $or: [{ isVisibleToUsers: true }, { issuedForUser: req.user._id }],
    }).sort({ createdAt: -1 });
    const validCoupons = [];

    for (const coupon of allCoupons) {
      const couponIssuedFor = coupon.issuedForUser ? String(coupon.issuedForUser) : "";
      if (couponIssuedFor && couponIssuedFor !== String(req.user._id)) {
        continue;
      }
      if (coupon.isOneTimePerUser) {
        const usedByUser = await CouponRedemption.exists({ coupon: coupon._id, user: req.user._id });
        if (usedByUser) continue;
      }
      const errorMessage = getCouponValidationError(coupon, subtotal);
      if (errorMessage) continue;
      validCoupons.push({
        code: coupon.code,
        title: coupon.title,
        type: coupon.type,
        value: Number(coupon.value || 0),
        minOrderAmount: Number(coupon.minOrderAmount || 0),
        maxDiscountAmount: Number(coupon.maxDiscountAmount || 0) || null,
        estimatedDiscount: computeCouponDiscount(coupon, subtotal),
        isOneTimePerUser: Boolean(coupon.isOneTimePerUser),
        expiresAt: coupon.expiresAt || null,
      });
    }

    return res.json({
      subtotal: Number(subtotal.toFixed(2)),
      coupons: validCoupons,
    });
  } catch (error) {
    next(error);
  }
}

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

async function updateMyOrderAddress(req, res, next) {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    if (String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can update only your own order address." });
    }

    const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
    const canEditWithin5Min = elapsedMs <= 5 * 60 * 1000;
    if (!canEditWithin5Min) {
      return res.status(400).json({ message: "Address can be changed only within 5 minutes of placing order." });
    }
    if (!ORDER_STATUSES_ALLOW_ADDRESS_EDIT.includes(order.status)) {
      return res.status(400).json({
        message: "Address can only be changed while the order is still early in processing (before pickup).",
      });
    }

    const shippingAddress = req.body?.shippingAddress || {};
    const requiredFields = ["fullName", "phone", "line1", "city", "state", "postalCode", "country"];
    for (const field of requiredFields) {
      if (!String(shippingAddress[field] || "").trim()) {
        return res.status(400).json({ message: `Shipping address field "${field}" is required.` });
      }
    }

    order.shippingAddress = {
      ...order.shippingAddress,
      ...shippingAddress,
      fullName: String(shippingAddress.fullName || "").trim(),
      phone: String(shippingAddress.phone || "").trim(),
      line1: String(shippingAddress.line1 || "").trim(),
      city: String(shippingAddress.city || "").trim(),
      state: String(shippingAddress.state || "").trim(),
      postalCode: String(shippingAddress.postalCode || "").trim(),
      country: String(shippingAddress.country || "").trim(),
      note: String(shippingAddress.note || "").trim(),
      latitude: Number.isFinite(Number(shippingAddress.latitude))
        ? Number(shippingAddress.latitude)
        : order.shippingAddress?.latitude ?? null,
      longitude: Number.isFinite(Number(shippingAddress.longitude))
        ? Number(shippingAddress.longitude)
        : order.shippingAddress?.longitude ?? null,
    };

    await order.save();
    const updated = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("products.product", "name price image inStock stockQty");
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

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

async function verifyPayment(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({ message: "Invalid order id." });
    }
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    if (String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can verify only your own order." });
    }
    if (order.paymentMethod !== "Razorpay") {
      return res.status(400).json({ message: "This order is not a Razorpay order." });
    }

    if (order.paymentStatus === "paid") {
      const populated = await Order.findById(order._id)
        .populate("user", "name email")
        .populate("products.product", "name price image inStock stockQty");
      return res.json(populated);
    }

    const {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body || {};

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        message:
          "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.",
      });
    }
    if (order.razorpay?.orderId && order.razorpay.orderId !== razorpayOrderId) {
      return res.status(400).json({ message: "Razorpay order id mismatch." });
    }

    const ok = verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });
    if (!ok) {
      order.paymentStatus = "failed";
      await order.save();
      return res.status(400).json({ message: "Payment signature verification failed." });
    }

    order.razorpay = {
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    };
    order.paymentStatus = "paid";
    order.status = "confirmed";
    order.paymentExpiresAt = null;
    if (order.invoice) {
      order.invoice.status = "paid";
      order.invoice.updatedAt = new Date();
    }
    await order.save();

    const populated = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("products.product", "name price image inStock stockQty");
    return res.json(populated);
  } catch (error) {
    next(error);
  }
}

async function razorpayWebhook(req, res, next) {
  try {
    const signatureHeader = req.headers["x-razorpay-signature"];
    const signature = typeof signatureHeader === "string" ? signatureHeader : "";
    const rawBody = Buffer.isBuffer(req.rawBody)
      ? req.rawBody
      : Buffer.isBuffer(req.body)
        ? req.body
        : null;
    if (!rawBody) {
      return res.status(400).send("Missing raw body for webhook verification.");
    }
    if (!signature) {
      return res.status(400).send("Missing signature.");
    }
    const ok = verifyWebhookSignature(rawBody, signature);
    if (!ok) {
      return res.status(400).send("Invalid signature.");
    }

    let event;
    try {
      event = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return res.status(400).send("Invalid JSON.");
    }

    const eventType = String(event?.event || "");
    const paymentEntity = event?.payload?.payment?.entity;
    const orderEntity = event?.payload?.order?.entity;
    const razorpayOrderId =
      paymentEntity?.order_id || orderEntity?.id || event?.payload?.order_id || "";
    const razorpayPaymentId = paymentEntity?.id || "";

    if (!razorpayOrderId) {
      return res.status(200).send("ignored");
    }

    const order = await Order.findOne({ "razorpay.orderId": razorpayOrderId });
    if (!order) {
      return res.status(200).send("order not found");
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
    } else if (eventType === "payment.failed") {
      if (order.paymentStatus === "pending") {
        order.paymentStatus = "failed";
        await order.save();
      }
    }

    return res.status(200).send("ok");
  } catch (error) {
    next(error);
  }
}

async function cancelPendingOrder(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({ message: "Invalid order id." });
    }
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    if (String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can cancel only your own order." });
    }
    if (order.status !== "pending_payment" || order.paymentStatus !== "pending") {
      return res
        .status(400)
        .json({ message: "Only orders awaiting payment can be cancelled here." });
    }

    order.status = "cancelled";
    order.paymentStatus = "failed";
    order.paymentExpiresAt = null;
    if (order.invoice) {
      order.invoice.status = "void";
      order.invoice.updatedAt = new Date();
    }
    await order.save();

    const populated = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("products.product", "name price image inStock stockQty");
    return res.json(populated);
  } catch (error) {
    next(error);
  }
}

async function claimMyOrderReward(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({ message: "Invalid order id." });
    }
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    if (String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can claim rewards only for your own order." });
    }
    if (String(order.status) !== "delivered") {
      return res.status(400).json({ message: "Rewards can only be claimed for delivered orders." });
    }
    if (order.reward?.claimedAt) {
      return res.status(409).json({ message: "Reward already claimed for this order." });
    }

    const eligiblePoints = Math.max(0, Number(order.reward?.eligiblePoints || 25));
    order.reward = {
      eligiblePoints,
      claimedPoints: eligiblePoints,
      claimedAt: new Date(),
    };
    await order.save();

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { rewardPoints: eligiblePoints },
    });

    const updated = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("products.product", "name price image inStock stockQty");
    const refreshedUser = await User.findById(req.user._id).select("rewardPoints");
    return res.json({
      message: `${eligiblePoints} reward points claimed successfully.`,
      order: updated,
      rewardPoints: Number(refreshedUser?.rewardPoints || 0),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Periodic task: cancel orders past `paymentExpiresAt` that are still
 * awaiting payment. Idempotent — safe to call repeatedly.
 */
async function sweepExpiredPendingPayments() {
  try {
    const now = new Date();
    const result = await Order.updateMany(
      {
        status: "pending_payment",
        paymentStatus: "pending",
        paymentExpiresAt: { $ne: null, $lte: now },
      },
      {
        $set: {
          status: "cancelled",
          paymentStatus: "failed",
          paymentExpiresAt: null,
          "invoice.status": "void",
          "invoice.updatedAt": new Date(),
        },
      }
    );
    if (result.modifiedCount > 0) {
      console.log(
        `[orders] Auto-cancelled ${result.modifiedCount} expired Razorpay orders.`
      );
    }
  } catch (err) {
    console.error("[orders] sweepExpiredPendingPayments failed:", err.message);
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
  createOrder,
  getAllOrders,
  getMyOrders,
  updateMyDeliveryLocation,
  getMyOrderLiveLocation,
  getMyOrderDrivingRoute,
  getMyDeliveryOrders,
  markMyDeliveryOrderDelivered,
  validateCouponForCart,
  getAvailableCouponsForCart,
  reorderMyOrder,
  updateMyOrderAddress,
  updateAdminOrderDetails,
  updateOrderStatus,
  deleteOrder,
  verifyPayment,
  razorpayWebhook,
  cancelPendingOrder,
  claimMyOrderReward,
  sweepExpiredPendingPayments,
};
