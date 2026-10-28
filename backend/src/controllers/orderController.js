const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const Coupon = require("../models/Coupon");
const CouponRedemption = require("../models/CouponRedemption");
const {
  normalizeCouponCode,
  couponCodeQuery,
  getCouponValidationError,
  computeCouponDiscount,
} = require("../utils/coupon");
const { buildCouponValidationResponse } = require("./couponController");
const { resolveProductLineFromRaw } = require("../utils/productLine");
const {
  ORDER_STATUS_VALUES,
  ORDER_NEXT_STATUS,
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
  isYoupiConfigured,
  getYoupiReturnUrl,
  getUpiCollectVpa,
  getUpiCollectPayee,
  buildUpiCollectUri,
  createYoupiPayment,
  verifyYoupiWebhook,
} = require("../services/youpiService");
const { geocodeAddress } = require("../services/geocodingService");
const { getShopLocationPayload } = require("../utils/shopLocation");
const {
  emitOrderUpdated,
  emitDeliveryPartnerLocation,
} = require("../realtime/socketHub");
const {
  validateOrderStockLines,
  deductStockForOrderLines,
  restoreStockForOrderLines,
} = require("../utils/stock");
const { orderPublicRef } = require("../utils/stockHistory");
const { logOrderStatus, logOrderPayment, logOrderAssign, logOrderNote } = require("../utils/adminLog");
const { notifyAdminNewOrder } = require("../services/orderNotificationService");
const {
  resolveDeliveryQuote,
  findZoneForAddress,
} = require("../services/deliveryZoneService");
const DeliveryZone = require("../models/DeliveryZone");
const { assertCanOrder } = require("../services/storeOpsService");

function pushOrderLiveUpdate(order) {
  try {
    emitOrderUpdated(order);
  } catch {
    // Realtime is best-effort; REST responses still succeed.
  }
}

const LIVE_ASSIGN_STATUSES = ["ready_for_pickup", "shipped", "out_for_delivery"];

/** Snapshot zone ETA onto the order so the customer sees a promise even if the zone changes later. */
function buildInitialTracking(deliveryQuote) {
  const min = Number(deliveryQuote?.etaMinutesMin || 0) || null;
  const max = Number(deliveryQuote?.etaMinutesMax || 0) || null;
  return {
    etaMinutesMin: min,
    etaMinutesMax: max,
    promisedAt: max ? new Date(Date.now() + max * 60 * 1000) : null,
  };
}

/** Describe who is changing status so the pre-save hook can log it to `statusHistory`. */
function setStatusActor(order, { by = null, byRole = "system", note = "" } = {}) {
  order.$locals.statusActor = { by, byRole, note };
}

const TRACKING_TEXT_FIELDS = ["note", "courierName", "trackingId", "trackingUrl"];

function applyTrackingPatch(order, patch = {}) {
  const next = { ...(order.tracking?.toObject?.() || order.tracking || {}) };
  for (const key of TRACKING_TEXT_FIELDS) {
    if (patch[key] !== undefined) next[key] = String(patch[key] || "").trim();
  }
  for (const key of ["etaMinutesMin", "etaMinutesMax"]) {
    if (patch[key] !== undefined) {
      const n = patch[key] === null || patch[key] === "" ? null : Number(patch[key]);
      if (n !== null && (!Number.isFinite(n) || n < 0)) {
        return `Invalid ${key}.`;
      }
      next[key] = n;
    }
  }
  if (patch.promisedAt !== undefined) {
    const d = patch.promisedAt ? new Date(patch.promisedAt) : null;
    if (d && Number.isNaN(d.getTime())) return "Invalid promised delivery time.";
    next.promisedAt = d;
  }
  order.tracking = next;
  return null;
}

function pushDispatchAttempt(order, { riderId, riderName = "", action, by, reason = "" }) {
  if (!order.dispatchAttempts) order.dispatchAttempts = [];
  order.dispatchAttempts.push({
    at: new Date(),
    rider: riderId || null,
    riderName: String(riderName || "").trim().slice(0, 80),
    action,
    by,
    reason: String(reason || "").trim().slice(0, 240),
  });
  if (order.dispatchAttempts.length > 30) {
    order.dispatchAttempts.splice(0, order.dispatchAttempts.length - 30);
  }
}

function applyPartnerAssignment(order, partnerId) {
  order.assignedDeliveryUser = partnerId;
  order.deliveryAcceptStatus = "pending";
  order.deliveryAssignedAt = new Date();
  order.deliveryAcceptedAt = null;
  order.deliveryDeclinedAt = null;
  order.deliveryDeclineReason = "";
}

function clearPartnerAssignment(order) {
  order.assignedDeliveryUser = null;
  order.deliveryAcceptStatus = "none";
  order.deliveryAssignedAt = null;
  order.deliveryAcceptedAt = null;
}

/** Least-loaded partner for a zone (skips declined partner ids). */
async function pickLeastLoadedPartner(zone, excludeIds = []) {
  const exclude = new Set((excludeIds || []).map((id) => String(id)));
  const filter = { isDeliveryPartner: true };
  if (zone?.partnerIds?.length) {
    filter._id = { $in: zone.partnerIds };
  }
  let partners = await User.find(filter).select("_id").lean();
  partners = partners.filter((p) => !exclude.has(String(p._id)));
  if (!partners.length) return null;

  const counts = await Order.aggregate([
    {
      $match: {
        assignedDeliveryUser: { $in: partners.map((p) => p._id) },
        status: { $in: LIVE_ASSIGN_STATUSES },
        deliveryAcceptStatus: { $in: ["pending", "accepted"] },
        channel: { $ne: "walk_in" },
      },
    },
    { $group: { _id: "$assignedDeliveryUser", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  let best = partners[0]._id;
  let bestCount = countMap.get(String(best)) || 0;
  for (const p of partners) {
    const n = countMap.get(String(p._id)) || 0;
    if (n < bestCount) {
      best = p._id;
      bestCount = n;
    }
  }
  return best;
}

async function maybeAutoAssignPartner(order) {
  if (order.channel === "walk_in") return order;
  if (order.assignedDeliveryUser) return order;
  if (!LIVE_ASSIGN_STATUSES.includes(String(order.status))) return order;

  let zone = null;
  if (order.deliveryZone) {
    zone = await DeliveryZone.findById(order.deliveryZone).lean();
  }
  if (!zone) {
    zone = await findZoneForAddress({
      postalCode: order.shippingAddress?.postalCode,
      city: order.shippingAddress?.city,
    });
  }
  const partnerId = await pickLeastLoadedPartner(zone, order.deliveryDeclinedBy || []);
  if (!partnerId) return order;
  const partner = await User.findById(partnerId).select("name");
  applyPartnerAssignment(order, partnerId);
  pushDispatchAttempt(order, {
    riderId: partnerId,
    riderName: partner?.name || "",
    action: "assigned",
    by: "auto",
  });
  await order.save();
  return order;
}

/** Deduct stock + notify admin when a Razorpay order is confirmed paid. */
async function finalizePaidOrder(order) {
  if (!order.stockAdjustedAt) {
    try {
      await deductStockForOrderLines(order.products, {
        order: order._id,
        orderRef: orderPublicRef(order._id),
      });
      order.stockAdjustedAt = new Date();
    } catch (stockErr) {
      console.error("[orders] stock deduct after payment failed:", stockErr.message);
    }
  }
  await order.save();
  notifyAdminNewOrder(order._id).catch((err) => {
    console.error("[orders] admin notify failed:", err.message);
  });
}

const PLATFORM_FEE = 1.2;
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

async function resolveShippingCoordinates(shippingAddress) {
  const { cleanMapCoord } = require("../utils/shopLocation");
  const base = shippingAddress && typeof shippingAddress === "object" ? { ...shippingAddress } : {};
  let lat = cleanMapCoord(base.latitude, 90);
  let lng = cleanMapCoord(base.longitude);

  if (lat == null || lng == null) {
    const geo = await geocodeAddress(base);
    if (geo) {
      lat = cleanMapCoord(geo.latitude, 90);
      lng = cleanMapCoord(geo.longitude);
    }
  }

  return {
    ...base,
    latitude: lat,
    longitude: lng,
  };
}
const INVOICE_STATUS_VALUES = ["draft", "final", "paid", "void"];
const SUPPORTED_PAYMENT_METHODS = ["Cash on Delivery", "Razorpay", "YouPI"];
const RAZORPAY_PAYMENT_WINDOW_MS = 30 * 60 * 1000;

function isOnlinePaymentMethod(method) {
  return method === "Razorpay" || method === "YouPI";
}

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
      !shippingAddress.postalCode
    ) {
      return res.status(400).json({ message: "Complete shipping address is required." });
    }

    const normalizedPaymentMethod = (() => {
      const raw = String(paymentMethod || "").trim();
      if (!raw) return "Cash on Delivery";
      const match = SUPPORTED_PAYMENT_METHODS.find(
        (m) => m.toLowerCase() === raw.toLowerCase()
      );
      let next = match || raw;
      if (next === "Razorpay" && (isYoupiConfigured() || getUpiCollectVpa())) next = "YouPI";
      return next;
    })();
    if (!SUPPORTED_PAYMENT_METHODS.includes(normalizedPaymentMethod)) {
      return res.status(400).json({
        message: `Unsupported payment method. Allowed: ${SUPPORTED_PAYMENT_METHODS.join(", ")}.`,
      });
    }

    if (products.some((item) => !item || typeof item !== "object")) {
      return res.status(400).json({ message: "Each product must have a quantity of 1 or more." });
    }

    const objectIdItems = products.filter((item) => mongoose.Types.ObjectId.isValid(item.product));
    const objectProductIds = objectIdItems.map((item) => item.product);
    const foundProducts = objectProductIds.length
      ? await Product.find({ _id: { $in: objectProductIds } })
      : [];

    const productMap = new Map(foundProducts.map((product) => [String(product._id), product]));
    const normalizedItems = [];

    for (const rawItem of products) {
      const quantity = rawItem.quantity === undefined || rawItem.quantity === null ? 1 : Number(rawItem.quantity);
      // Whole jars only: 1.5 would pass a ">= 1" check and leave a fractional stock count behind.
      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: "Each product must have a quantity of 1 or more." });
      }

      // Prices come from the catalog, never from the request. A line the catalog doesn't know can't be ordered.
      const matchedProduct = mongoose.Types.ObjectId.isValid(rawItem.product)
        ? productMap.get(String(rawItem.product))
        : null;
      if (!matchedProduct) {
        return res.status(404).json({ message: "One or more products were not found." });
      }

      if (matchedProduct.isPublished === false) {
        return res.status(400).json({
          message: `${matchedProduct.name || "Product"} is no longer available in the store.`,
        });
      }

      if (matchedProduct.comingSoon) {
        return res.status(400).json({
          message: `${matchedProduct.name || "Product"} is not yet available to order.`,
        });
      }

      if (!matchedProduct.inStock || Number(matchedProduct.stockQty || 0) <= 0) {
        return res.status(400).json({
          message: `${matchedProduct.name || "Product"} is out of stock.`,
        });
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
    }

    const stockCheck = validateOrderStockLines(normalizedItems, productMap);
    if (!stockCheck.ok) {
      return res.status(400).json({ message: stockCheck.message });
    }

    const itemsTotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const opsBlock = await assertCanOrder({ itemsTotal, paymentMethod: normalizedPaymentMethod });
    if (opsBlock) {
      return res.status(opsBlock.status).json({ message: opsBlock.message, code: opsBlock.code });
    }

    let resolvedCoupon = null;
    let discountAmount = 0;
    const normalizedCouponCode = normalizeCouponCode(couponCode);
    if (normalizedCouponCode) {
      resolvedCoupon = await Coupon.findOne(couponCodeQuery(normalizedCouponCode));
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

    const resolvedShippingAddress = await resolveShippingCoordinates(shippingAddress);
    const { enrichQuoteWithRoute } = require("../services/drivingRouteService");
    let deliveryQuote = await resolveDeliveryQuote({
      postalCode: resolvedShippingAddress?.postalCode,
      city: resolvedShippingAddress?.city,
      itemsTotal,
      latitude: resolvedShippingAddress?.latitude,
      longitude: resolvedShippingAddress?.longitude,
    });
    deliveryQuote = await enrichQuoteWithRoute(deliveryQuote, {
      latitude: resolvedShippingAddress?.latitude,
      longitude: resolvedShippingAddress?.longitude,
      minutesPerKm: deliveryQuote.minutesPerKm,
    });
    if (!deliveryQuote.serviceable) {
      return res.status(400).json({
        message: deliveryQuote.message || "Delivery is not possible to this area",
        code: "DELIVERY_NOT_SERVICEABLE",
      });
    }
    const deliveryFee = Number(deliveryQuote.fee || 0);
    const totalPrice = Math.max(0, Number((itemsTotal + deliveryFee + PLATFORM_FEE - discountAmount).toFixed(2)));

    const isOnline = isOnlinePaymentMethod(normalizedPaymentMethod);
    const initialStatus = isOnline ? "pending_payment" : "pending";
    const paymentExpiresAt = isOnline ? new Date(Date.now() + RAZORPAY_PAYMENT_WINDOW_MS) : null;

    // Claim the coupon use atomically so two simultaneous orders can't both slip under a usage limit.
    // Every path below that abandons the order gives the use back through releaseCouponUse().
    let couponClaimed = false;
    const releaseCouponUse = async () => {
      if (!couponClaimed || !resolvedCoupon) return;
      couponClaimed = false;
      await Coupon.updateOne({ _id: resolvedCoupon._id, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } }).catch(() => {});
    };
    if (resolvedCoupon) {
      const limit = Number(resolvedCoupon.usageLimit);
      const claim = await Coupon.updateOne(
        Number.isFinite(limit) && limit > 0
          ? { _id: resolvedCoupon._id, usedCount: { $lt: limit } }
          : { _id: resolvedCoupon._id },
        { $inc: { usedCount: 1 } }
      );
      if (!claim.modifiedCount) {
        return res.status(400).json({ message: "This coupon has reached its usage limit." });
      }
      couponClaimed = true;
    }

    let order;
    try {
      order = await Order.create({
      user: req.user._id,
      products: normalizedItems,
      totalPrice,
      shippingAddress: resolvedShippingAddress,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: "pending",
      paymentExpiresAt,
      deliveryZone: deliveryQuote.zoneId || null,
      deliveryZoneName: deliveryQuote.zoneName || "",
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
      tracking: buildInitialTracking(deliveryQuote),
      });
    } catch (createErr) {
      await releaseCouponUse();
      throw createErr;
    }
    order.invoice = {
      ...(order.invoice || {}),
      number: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(order._id).slice(-6).toUpperCase()}`,
      issueDate: new Date(),
      status: "draft",
      updatedAt: new Date(),
    };

    let razorpayKeyId = "";
    if (normalizedPaymentMethod === "YouPI") {
      const upiUri = buildUpiCollectUri({ amountInRupees: totalPrice, orderId: order._id });
      order.youpi = {
        paymentId: "",
        orderId: String(order._id),
        checkoutUrl: "",
        upiUri,
        vpa: getUpiCollectVpa(),
        payeeName: getUpiCollectPayee(),
        status: "ACTIVE",
        utr: "",
      };
      if (isYoupiConfigured()) {
        try {
          const youpi = await createYoupiPayment({
            orderId: String(order._id),
            amountInRupees: totalPrice,
            returnUrl: `${getYoupiReturnUrl().replace(/\/+$/, "")}?orderId=${String(order._id)}`,
            metadata: { userId: String(req.user._id) },
          });
          order.youpi.paymentId = youpi.paymentId;
          order.youpi.orderId = youpi.orderId;
          order.youpi.checkoutUrl = youpi.checkoutUrl;
          order.youpi.status = youpi.status || "ACTIVE";
        } catch {
          // Collect on the real VPA even if YouPI is down.
        }
      }
    } else if (normalizedPaymentMethod === "Razorpay") {
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
        await releaseCouponUse();
        const status = rzpErr.statusCode || 500;
        return res.status(status).json({
          message: rzpErr.message || "Unable to start Razorpay payment.",
          code: rzpErr.code || "RAZORPAY_ERROR",
        });
      }
    }
    await order.save();

    if (!isOnline) {
      try {
        await deductStockForOrderLines(order.products, {
          order: order._id,
          orderRef: orderPublicRef(order._id),
        });
        order.stockAdjustedAt = new Date();
        await order.save();
      } catch (stockErr) {
        await Order.findByIdAndDelete(order._id);
        await releaseCouponUse();
        return res.status(stockErr.statusCode || 400).json({
          message: stockErr.message || "Insufficient stock to complete this order.",
        });
      }
    }

    if (resolvedCoupon) {
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
    if (normalizedPaymentMethod === "Razorpay") {
      responsePayload.razorpayKeyId = razorpayKeyId;
    }

    pushOrderLiveUpdate(populatedOrder);

    if (!isOnline) {
      notifyAdminNewOrder(order._id).catch((err) => {
        console.error("[orders] admin notify failed:", err.message);
      });
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

async function getAdminOrderById(req, res, next) {
  try {
    const order = await Order.findById(req.params.id)
      .select("+adminNotes")
      .populate("user", "name email")
      .populate("assignedDeliveryUser", "name email phone")
      .populate("products.product", "name price image inStock stockQty");

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
}

async function getMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ user: req.user._id })
      .select("-dispatchAttempts")
      .sort({ createdAt: -1 })
      .populate("assignedDeliveryUser", "name phone")
      .populate("products.product", "name price image inStock stockQty");
    const { decorateMyOrdersWithReturns } = require("./returnController");
    res.json(await decorateMyOrdersWithReturns(orders));
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

    emitDeliveryPartnerLocation(req.user, {
      latitude: lat,
      longitude: lng,
      accuracyMeters: Number.isFinite(accuracyMeters) ? accuracyMeters : null,
      updatedAt: now,
    }).catch(() => {});

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

    let destLat = order.shippingAddress?.latitude;
    let destLng = order.shippingAddress?.longitude;
    if (!Number.isFinite(Number(destLat)) || !Number.isFinite(Number(destLng))) {
      const geo = await geocodeAddress(order.shippingAddress);
      if (geo) {
        destLat = geo.latitude;
        destLng = geo.longitude;
        await Order.updateOne(
          { _id: order._id },
          {
            $set: {
              "shippingAddress.latitude": geo.latitude,
              "shippingAddress.longitude": geo.longitude,
            },
          }
        );
      }
    }

    const destSummary = liveLocationDestinationSummary(order.shippingAddress);
    const shop = await getShopLocationPayload();

    const payload = {
      trackable: Number.isFinite(lat) && Number.isFinite(lng),
      partner: {
        name: partner.name || "",
        phone: partner.phone || "",
      },
      shop,
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

    const { fetchDrivingRoute } = require("../services/drivingRouteService");
    const route = await fetchDrivingRoute(Number(oLat), Number(oLng), Number(dLat), Number(dLng), String(orderId));

    return res.json({
      encodedPolyline: route?.encodedPolyline || null,
      path: route?.path || null,
      distanceKm: route?.distanceKm ?? null,
      provider: route?.provider || null,
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
    const coupon = await Coupon.findOne(couponCodeQuery(couponCode));
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
    const requiredFields = ["fullName", "phone", "line1", "city", "postalCode"];
    for (const field of requiredFields) {
      if (!String(shippingAddress[field] || "").trim()) {
        return res.status(400).json({ message: `Shipping address field "${field}" is required.` });
      }
    }

    const mergedAddress = {
      ...order.shippingAddress,
      ...shippingAddress,
      fullName: String(shippingAddress.fullName || "").trim(),
      phone: String(shippingAddress.phone || "").trim(),
      addressType: String(shippingAddress.addressType || "Home").trim(),
      houseNumber: String(shippingAddress.houseNumber || "").trim(),
      line1: String(shippingAddress.line1 || "").trim(),
      landmark: String(shippingAddress.landmark || "").trim(),
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
    order.shippingAddress = await resolveShippingCoordinates(mergedAddress);

    await order.save();
    const updated = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("products.product", "name price image inStock stockQty");
    pushOrderLiveUpdate(updated);
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

    const prevStatus = String(order.status);
    const prevRider = order.assignedDeliveryUser ? String(order.assignedDeliveryUser) : "";
    let assignName = "";

    if (req.body?.status !== undefined) {
      if (!ORDER_STATUS_VALUES.includes(req.body.status)) {
        return res.status(400).json({ message: "Invalid order status." });
      }
      order.status = req.body.status;
    }
    setStatusActor(order, {
      by: req.user?._id || null,
      byRole: "admin",
      note: String(req.body?.statusNote || "").trim(),
    });
    if (req.body?.tracking && typeof req.body.tracking === "object") {
      const trackingError = applyTrackingPatch(order, req.body.tracking);
      if (trackingError) {
        return res.status(400).json({ message: trackingError });
      }
    }
    if (req.body?.paymentMethod !== undefined) {
      order.paymentMethod = String(req.body.paymentMethod || "Cash on Delivery").trim();
    }
    if (req.body?.shippingAddress && typeof req.body.shippingAddress === "object") {
      if (!ORDER_STATUSES_ALLOW_ADDRESS_EDIT.includes(order.status)) {
        return res.status(400).json({
          message: "Address can only be edited while the order is still being packed.",
        });
      }
      const { cleanMapCoord } = require("../utils/shopLocation");
      const next = { ...order.shippingAddress, ...req.body.shippingAddress };
      next.latitude = cleanMapCoord(next.latitude, 90);
      next.longitude = cleanMapCoord(next.longitude);
      order.shippingAddress = next;
    }
    if (req.body?.assignedDeliveryUser !== undefined) {
      const raw = req.body.assignedDeliveryUser;
      if (raw === null || raw === "") {
        const prevId = order.assignedDeliveryUser;
        const prevName = order.assignedDeliveryUser?.name
          ? order.assignedDeliveryUser.name
          : prevId
            ? (await User.findById(prevId).select("name"))?.name || ""
            : "";
        clearPartnerAssignment(order);
        if (prevId) {
          pushDispatchAttempt(order, { riderId: prevId, riderName: prevName, action: "cleared", by: "admin" });
        }
      } else if (!mongoose.Types.ObjectId.isValid(String(raw))) {
        return res.status(400).json({ message: "Invalid delivery assignee id." });
      } else {
        const assignee = await User.findById(raw).select("isDeliveryPartner name");
        if (!assignee) {
          return res.status(404).json({ message: "Assignee user not found." });
        }
        if (!assignee.isDeliveryPartner) {
          return res.status(400).json({
            message: "That user is not enabled as a delivery partner. Enable them in Manage Users first.",
          });
        }
        let zone = null;
        if (order.deliveryZone) {
          zone = await DeliveryZone.findById(order.deliveryZone).select("partnerIds name").lean();
        }
        if (!zone) {
          zone = await findZoneForAddress({
            postalCode: order.shippingAddress?.postalCode,
            city: order.shippingAddress?.city,
          });
        }
        if (zone?.partnerIds?.length) {
          const allowed = zone.partnerIds.map((id) => String(id));
          if (!allowed.includes(String(assignee._id))) {
            return res.status(400).json({
              message: `${assignee.name || "Rider"} doesn't cover ${zone.name || "this zone"}`,
            });
          }
        }
        applyPartnerAssignment(order, assignee._id);
        assignName = assignee.name || "rider";
        pushDispatchAttempt(order, {
          riderId: assignee._id,
          riderName: assignee.name || "",
          action: "assigned",
          by: "admin",
        });
        // Admin reassign clears prior decline for this partner so they can accept again.
        order.deliveryDeclinedBy = (order.deliveryDeclinedBy || []).filter(
          (id) => String(id) !== String(assignee._id)
        );
        order.deliveryDeclineReason = "";
        order.deliveryDeclinedAt = null;
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

    if (LIVE_ASSIGN_STATUSES.includes(String(order.status)) && !order.assignedDeliveryUser) {
      await maybeAutoAssignPartner(order);
    }

    if (req.body?.status !== undefined && String(order.status) !== prevStatus) {
      await logOrderStatus(req, order, order.status);
    }
    if (req.body?.assignedDeliveryUser !== undefined) {
      const nextRider = order.assignedDeliveryUser ? String(order.assignedDeliveryUser) : "";
      if (nextRider !== prevRider) await logOrderAssign(req, order, nextRider ? assignName : "");
    }

    const updated = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("assignedDeliveryUser", "name email phone")
      .populate("products.product", "name price image inStock stockQty");
    pushOrderLiveUpdate(updated);
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
      channel: { $ne: "walk_in" },
    })
      .sort({ createdAt: -1 })
      .populate("user", "name email phone")
      .populate("products.product", "name price image inStock stockQty");

    res.json(orders);
  } catch (error) {
    next(error);
  }
}

async function acceptMyDeliveryOrder(req, res, next) {
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
    if (order.deliveryAcceptStatus === "accepted") {
      const already = await Order.findById(order._id)
        .populate("user", "name email phone")
        .populate("assignedDeliveryUser", "name email phone")
        .populate("products.product", "name price image inStock stockQty");
      return res.json(already);
    }
    if (order.deliveryAcceptStatus !== "pending") {
      return res.status(400).json({ message: "This order is not waiting for your acceptance." });
    }
    order.deliveryAcceptStatus = "accepted";
    order.deliveryAcceptedAt = new Date();
    pushDispatchAttempt(order, {
      riderId: req.user._id,
      riderName: req.user.name || "",
      action: "accepted",
      by: "rider",
    });
    await order.save();
    const updated = await Order.findById(order._id)
      .populate("user", "name email phone")
      .populate("assignedDeliveryUser", "name email phone")
      .populate("products.product", "name price image inStock stockQty");
    pushOrderLiveUpdate(updated);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

async function declineMyDeliveryOrder(req, res, next) {
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
    if (order.deliveryAcceptStatus === "accepted") {
      return res.status(400).json({ message: "You already accepted this order. Ask admin to reassign." });
    }
    if (order.deliveryAcceptStatus !== "pending") {
      return res.status(400).json({ message: "This order is not waiting for your acceptance." });
    }

    const reason = String(req.body?.reason || "").trim().slice(0, 240);
    const partnerId = order.assignedDeliveryUser;
    order.deliveryAcceptStatus = "declined";
    order.deliveryDeclinedAt = new Date();
    order.deliveryDeclineReason = reason;
    const declined = new Set((order.deliveryDeclinedBy || []).map((x) => String(x)));
    declined.add(String(partnerId));
    order.deliveryDeclinedBy = [...declined];
    pushDispatchAttempt(order, {
      riderId: partnerId,
      riderName: req.user.name || "",
      action: "declined",
      by: "rider",
      reason,
    });
    clearPartnerAssignment(order);
    order.deliveryAcceptStatus = "declined";
    await order.save();

    // Auto-offer to next available partner.
    await maybeAutoAssignPartner(order);

    const updated = await Order.findById(order._id)
      .populate("user", "name email phone")
      .populate("assignedDeliveryUser", "name email phone")
      .populate("products.product", "name price image inStock stockQty");
    pushOrderLiveUpdate(updated);
    res.json(updated);
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
    if (order.deliveryAcceptStatus !== "accepted") {
      return res.status(400).json({
        message: "Accept this order before marking it delivered.",
      });
    }
    if (!ORDER_STATUSES_MARK_DELIVERABLE_FROM.includes(order.status)) {
      return res.status(400).json({
        message:
          'Order must be at least "Ready for pickup", "Out for delivery", or "Shipped" before you can mark it delivered. Ask admin to advance the status.',
      });
    }

    order.status = "delivered";
    setStatusActor(order, { by: req.user._id, byRole: "delivery", note: "Marked delivered by partner" });
    await order.save();

    const updated = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("assignedDeliveryUser", "name email phone")
      .populate("products.product", "name price image inStock stockQty");
    pushOrderLiveUpdate(updated);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    if (!ORDER_STATUS_VALUES.includes(status)) {
      return res.status(400).json({ message: "Invalid order status." });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const previousStatus = String(order.status);
    if (status !== previousStatus) {
      const next = ORDER_NEXT_STATUS[previousStatus];
      if (status !== "cancelled" && status !== next) {
        return res.status(400).json({
          message: next ? `Next step is ${String(next).replace(/_/g, " ")}.` : "This order has no next step.",
        });
      }
    }

    order.status = status;
    if (status === "cancelled" && previousStatus === "pending_payment" && order.paymentStatus === "pending") {
      applyCancelPendingPayment(order);
    }
    setStatusActor(order, { by: req.user?._id || null, byRole: "admin", note: String(note || "").trim().slice(0, 300) });
    await order.save();

    if (status === "cancelled" && previousStatus !== "cancelled" && order.stockAdjustedAt) {
      await restoreStockForOrderLines(order.products, {
        why: "cancel",
        location: order.channel === "walk_in" ? "counter" : "online",
        order: order._id,
        orderRef: orderPublicRef(order._id),
      });
      order.stockAdjustedAt = null;
      await order.save();
    }

    if (LIVE_ASSIGN_STATUSES.includes(status) && !order.assignedDeliveryUser) {
      await maybeAutoAssignPartner(order);
    }

    const updated = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("assignedDeliveryUser", "name email phone")
      .populate("products.product", "name price image");

    if (status !== previousStatus) await logOrderStatus(req, order, status);

    pushOrderLiveUpdate(updated);
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
    if (!isOnlinePaymentMethod(order.paymentMethod)) {
      return res.status(400).json({ message: "This order is not an online payment order." });
    }

    if (order.paymentStatus === "paid") {
      const populated = await Order.findById(order._id)
        .populate("user", "name email")
        .populate("products.product", "name price image inStock stockQty");
      return res.json(populated);
    }

    if (order.paymentMethod === "YouPI") {
      const utr = String(req.body?.utr || req.body?.UTR || "").trim();
      const confirmed = req.body?.confirmed === true || Boolean(utr);
      if (!confirmed) {
        return res.status(202).json({
          message: "Waiting for payment confirmation.",
          paymentStatus: order.paymentStatus,
          order,
        });
      }
      order.youpi = {
        ...(order.youpi || {}),
        utr: utr || order.youpi?.utr || "",
        status: utr ? "CLAIMED" : "CUSTOMER_CONFIRMED",
      };
      order.paymentStatus = "paid";
      order.status = "confirmed";
      order.paymentExpiresAt = null;
      if (order.invoice) {
        order.invoice.status = "paid";
        order.invoice.updatedAt = new Date();
      }
      setStatusActor(order, {
        by: req.user._id,
        byRole: "customer",
        note: utr ? `UPI paid (UTR ${utr})` : "Customer confirmed UPI payment",
      });
      await finalizePaidOrder(order);
      const populated = await Order.findById(order._id)
        .populate("user", "name email")
        .populate("products.product", "name price image inStock stockQty");
      pushOrderLiveUpdate(populated);
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
    setStatusActor(order, { by: req.user._id, byRole: "customer", note: "Online payment verified" });
    await finalizePaidOrder(order);

    const populated = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("products.product", "name price image inStock stockQty");
    pushOrderLiveUpdate(populated);
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
        setStatusActor(order, { byRole: "system", note: "Payment captured (Razorpay)" });
        await finalizePaidOrder(order);
        const populated = await Order.findById(order._id)
          .populate("user", "name email")
          .populate("assignedDeliveryUser", "name email phone")
          .populate("products.product", "name price image inStock stockQty");
        pushOrderLiveUpdate(populated);
      }
    } else if (eventType === "payment.failed") {
      if (order.paymentStatus === "pending") {
        order.paymentStatus = "failed";
        await order.save();
        const populated = await Order.findById(order._id)
          .populate("user", "name email")
          .populate("products.product", "name price image inStock stockQty");
        pushOrderLiveUpdate(populated);
      }
    }

    return res.status(200).send("ok");
  } catch (error) {
    next(error);
  }
}

async function youpiWebhook(req, res, next) {
  try {
    const rawBody = Buffer.isBuffer(req.rawBody)
      ? req.rawBody
      : Buffer.isBuffer(req.body)
        ? req.body
        : null;
    if (!rawBody) return res.status(400).send("Missing raw body for webhook verification.");
    if (!verifyYoupiWebhook(rawBody, req.headers["x-gateway-signature"])) {
      return res.status(400).send("Invalid signature.");
    }

    let event;
    try {
      event = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return res.status(400).send("Invalid JSON.");
    }

    const youpiOrderId = String(event?.orderId || event?.order_id || "").trim();
    const youpiPaymentId = String(event?.paymentId || event?.payment_id || "").trim();
    const outcome = String(event?.event || event?.status || "").toUpperCase();
    if (!youpiOrderId && !youpiPaymentId) return res.status(200).json({ received: true });

    const order = await Order.findOne({
      $or: [
        youpiOrderId ? { "youpi.orderId": youpiOrderId } : null,
        youpiOrderId && mongoose.Types.ObjectId.isValid(youpiOrderId) ? { _id: youpiOrderId } : null,
        youpiPaymentId ? { "youpi.paymentId": youpiPaymentId } : null,
      ].filter(Boolean),
    });
    if (!order) return res.status(200).json({ received: true });

    order.youpi = {
      ...(order.youpi || {}),
      orderId: youpiOrderId || order.youpi?.orderId || "",
      paymentId: youpiPaymentId || order.youpi?.paymentId || "",
      checkoutUrl: order.youpi?.checkoutUrl || "",
      utr: String(event?.utr || order.youpi?.utr || ""),
      status: outcome || order.youpi?.status || "",
    };

    if (outcome === "SUCCESS" && order.paymentStatus !== "paid") {
      const expected = Number(order.totalPrice || 0).toFixed(2);
      const paid = String(event?.amount || "").trim();
      if (paid && paid !== expected) {
        return res.status(400).send("Amount mismatch.");
      }
      order.paymentStatus = "paid";
      order.status = "confirmed";
      order.paymentExpiresAt = null;
      if (order.invoice) {
        order.invoice.status = "paid";
        order.invoice.updatedAt = new Date();
      }
      setStatusActor(order, { byRole: "system", note: "Payment captured (YouPI)" });
      await finalizePaidOrder(order);
    } else if ((outcome === "FAILED" || outcome === "EXPIRED" || outcome === "CANCELLED") && order.paymentStatus === "pending") {
      order.paymentStatus = "failed";
      if (outcome === "CANCELLED" || outcome === "EXPIRED") {
        order.status = "cancelled";
        order.paymentExpiresAt = null;
        if (order.invoice) {
          order.invoice.status = "void";
          order.invoice.updatedAt = new Date();
        }
      }
      await order.save();
    } else {
      await order.save();
    }

    const populated = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("assignedDeliveryUser", "name email phone")
      .populate("products.product", "name price image inStock stockQty");
    pushOrderLiveUpdate(populated);
    return res.status(200).json({ received: true });
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
    setStatusActor(order, { by: req.user._id, byRole: "customer", note: "Cancelled before payment" });
    await order.save();

    const populated = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("products.product", "name price image inStock stockQty");
    pushOrderLiveUpdate(populated);
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
    // Claim atomically: two taps at once must not both pay out the points.
    const claimed = await Order.findOneAndUpdate(
      { _id: order._id, "reward.claimedAt": null },
      { $set: { reward: { eligiblePoints, claimedPoints: eligiblePoints, claimedAt: new Date() } } }
    );
    if (!claimed) {
      return res.status(409).json({ message: "Reward already claimed for this order." });
    }
    order.reward = { eligiblePoints, claimedPoints: eligiblePoints, claimedAt: new Date() };

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
        $push: {
          statusHistory: {
            status: "cancelled",
            at: now,
            by: null,
            byRole: "system",
            note: "Payment window expired",
          },
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

/* ---------------------------------------------------------------------------
 * Admin desk — bulk moves, payment control and private team notes.
 * ------------------------------------------------------------------------- */

const BULK_LIMIT = 100;
const PAYMENT_STATUS_VALUES = ["pending", "paid", "failed", "refunded"];
/** Position on the happy path; the legacy `paid` / `shipped` sit beside their modern twins. */
const STATUS_RANK = {
  pending_payment: 0,
  pending: 1,
  confirmed: 2,
  paid: 2,
  preparing: 3,
  ready_for_pickup: 4,
  shipped: 5,
  out_for_delivery: 5,
  delivered: 6,
};

/** Populated copy for responses and live pushes. Never carries `adminNotes` (they are `select: false`). */
function loadPopulatedOrder(id) {
  return Order.findById(id)
    .populate("user", "name email")
    .populate("assignedDeliveryUser", "name email phone")
    .populate("products.product", "name price image inStock stockQty");
}

function parseBulkIds(raw) {
  const ids = [...new Set((Array.isArray(raw) ? raw : []).map((id) => String(id)))];
  return ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
}

/** Cancelling an unpaid online order writes the payment off and voids the invoice. */
function applyCancelPendingPayment(order) {
  order.paymentStatus = "failed";
  order.paymentExpiresAt = null;
  if (order.invoice) {
    order.invoice.status = "void";
    order.invoice.updatedAt = new Date();
  }
}

/** Why `order` should not move to `status` in a bulk action — empty when it can go. */
function bulkStatusSkipReason(order, status) {
  const from = String(order.status);
  if (from === status) return "Already there";
  if (from === "delivered" || from === "cancelled") return `Already ${from}`;
  if (status === "cancelled") return "";
  if (from === "pending_payment") return "Waiting for online payment";
  if (status === "pending_payment") return "Can't go back to awaiting payment";
  if (STATUS_RANK[status] === STATUS_RANK[from]) return "Already at that stage";
  if (STATUS_RANK[status] < STATUS_RANK[from]) return "Can't move backwards in bulk";
  if (status === "delivered" && !ORDER_STATUSES_MARK_DELIVERABLE_FROM.includes(from)) {
    return "Send it out for delivery first";
  }
  return "";
}

/** Private trail on the order: free-text notes and who changed what. Capped so it can't grow forever. */
function pushAdminNote(order, user, text) {
  const clean = String(text || "").trim().slice(0, 500);
  if (!clean) return;
  order.adminNotes.push({
    text: clean,
    by: user?._id || null,
    byName: String(user?.name || "Admin").trim().slice(0, 80),
  });
  if (order.adminNotes.length > 100) order.adminNotes.splice(0, order.adminNotes.length - 100);
}

function summarizeBulk(results, extra = {}) {
  const updated = results.filter((r) => r.ok).length;
  return { ...extra, updated, skipped: results.length - updated, results };
}

/** Move many orders to one status; each order is checked on its own and reports why it was skipped. */
async function bulkUpdateOrderStatus(req, res, next) {
  try {
    const status = String(req.body?.status || "");
    if (!ORDER_STATUS_VALUES.includes(status)) {
      return res.status(400).json({ message: "Invalid order status." });
    }
    const ids = parseBulkIds(req.body?.ids);
    if (!ids.length) return res.status(400).json({ message: "Pick at least one order." });
    if (ids.length > BULK_LIMIT) {
      return res.status(400).json({ message: `Pick at most ${BULK_LIMIT} orders at a time.` });
    }
    const note = String(req.body?.note || "").trim().slice(0, 300);

    const results = [];
    // One at a time: auto-assign balances rider load, so every order must see the one before it.
    for (const id of ids) {
      const order = await Order.findById(id);
      if (!order) {
        results.push({ id, ok: false, reason: "Order not found" });
        continue;
      }
      const reason = bulkStatusSkipReason(order, status);
      if (reason) {
        results.push({ id, ok: false, reason });
        continue;
      }

      const previous = String(order.status);
      order.status = status;
      if (status === "cancelled" && previous === "pending_payment" && order.paymentStatus === "pending") {
        applyCancelPendingPayment(order);
      }
      setStatusActor(order, { by: req.user?._id || null, byRole: "admin", note });
      await order.save();

      if (status === "cancelled" && order.stockAdjustedAt) {
        await restoreStockForOrderLines(order.products, {
          why: "cancel",
          location: order.channel === "walk_in" ? "counter" : "online",
          order: order._id,
          orderRef: orderPublicRef(order._id),
        });
        order.stockAdjustedAt = null;
        await order.save();
      }
      if (LIVE_ASSIGN_STATUSES.includes(status) && !order.assignedDeliveryUser) {
        await maybeAutoAssignPartner(order);
      }
      pushOrderLiveUpdate(await loadPopulatedOrder(order._id));
      results.push({ id, ok: true, status });
      if (status !== previous) await logOrderStatus(req, order, status);
    }

    res.json(summarizeBulk(results, { status }));
  } catch (error) {
    next(error);
  }
}

/** Give many orders to one rider (or release them all with a null `riderId`). */
async function bulkAssignRider(req, res, next) {
  try {
    const ids = parseBulkIds(req.body?.ids);
    if (!ids.length) return res.status(400).json({ message: "Pick at least one order." });
    if (ids.length > BULK_LIMIT) {
      return res.status(400).json({ message: `Pick at most ${BULK_LIMIT} orders at a time.` });
    }

    const rawRider = req.body?.riderId;
    let rider = null;
    if (rawRider !== null && rawRider !== undefined && rawRider !== "") {
      if (!mongoose.Types.ObjectId.isValid(String(rawRider))) {
        return res.status(400).json({ message: "Invalid rider id." });
      }
      rider = await User.findById(rawRider).select("name isDeliveryPartner");
      if (!rider) return res.status(404).json({ message: "Rider not found." });
      if (!rider.isDeliveryPartner) {
        return res.status(400).json({ message: "That user is not enabled as a delivery partner." });
      }
    }

    const results = [];
    for (const id of ids) {
      const order = await Order.findById(id);
      if (!order) {
        results.push({ id, ok: false, reason: "Order not found" });
        continue;
      }
      if (order.status === "delivered" || order.status === "cancelled") {
        results.push({ id, ok: false, reason: `Already ${order.status}` });
        continue;
      }

      if (!rider) {
        const prevId = order.assignedDeliveryUser;
        const prevName = prevId ? (await User.findById(prevId).select("name"))?.name || "" : "";
        clearPartnerAssignment(order);
        if (prevId) {
          pushDispatchAttempt(order, { riderId: prevId, riderName: prevName, action: "cleared", by: "admin" });
        }
      } else {
        let zone = null;
        if (order.deliveryZone) {
          zone = await DeliveryZone.findById(order.deliveryZone).select("partnerIds name").lean();
        }
        if (!zone) {
          zone = await findZoneForAddress({
            postalCode: order.shippingAddress?.postalCode,
            city: order.shippingAddress?.city,
          });
        }
        if (zone?.partnerIds?.length && !zone.partnerIds.some((p) => String(p) === String(rider._id))) {
          results.push({ id, ok: false, reason: `${rider.name || "Rider"} doesn't cover ${zone.name || "this zone"}` });
          continue;
        }
        applyPartnerAssignment(order, rider._id);
        pushDispatchAttempt(order, {
          riderId: rider._id,
          riderName: rider.name || "",
          action: "assigned",
          by: "admin",
        });
        // A fresh assignment lets a rider who declined earlier accept again.
        order.deliveryDeclinedBy = (order.deliveryDeclinedBy || []).filter(
          (declinedId) => String(declinedId) !== String(rider._id)
        );
        order.deliveryDeclineReason = "";
        order.deliveryDeclinedAt = null;
      }
      await order.save();
      pushOrderLiveUpdate(await loadPopulatedOrder(order._id));
      results.push({ id, ok: true });
      await logOrderAssign(req, order, rider ? rider.name || "rider" : "");
    }

    res.json(summarizeBulk(results, { riderId: rider ? String(rider._id) : null }));
  } catch (error) {
    next(error);
  }
}

/** Payment moves an admin may make by hand. Anything not listed (failed, refunded) is final. */
const PAYMENT_MOVES = {
  pending: ["paid", "failed"],
  paid: ["pending", "refunded"],
  failed: [],
  refunded: [],
};

/** Mark cash collected, undo a mistake, record a refund, or write off an unpaid online order. */
async function updateOrderPayment(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({ message: "Invalid order id." });
    }
    const nextStatus = String(req.body?.paymentStatus || "").trim().toLowerCase();
    if (!PAYMENT_STATUS_VALUES.includes(nextStatus)) {
      return res.status(400).json({ message: "Invalid payment status." });
    }
    const order = await Order.findById(id).select("+adminNotes");
    if (!order) return res.status(404).json({ message: "Order not found." });

    const current = order.paymentStatus || "pending";
    if (current === nextStatus) return res.json(await loadPopulatedOrder(order._id));
    if (!PAYMENT_MOVES[current].includes(nextStatus)) {
      return res.status(400).json({ message: `A ${current} payment can't be changed to ${nextStatus}.` });
    }
    if (nextStatus === "failed" && order.status !== "pending_payment") {
      return res.status(400).json({ message: "Only an order still waiting for payment can be marked failed." });
    }

    const note = String(req.body?.note || "").trim().slice(0, 300);
    const actor = { by: req.user?._id || null, byRole: "admin" };
    const trail = {
      paid: "Payment marked paid",
      pending: "Payment marked unpaid again",
      failed: "Payment marked failed",
      refunded: "Payment marked refunded",
    }[nextStatus];
    pushAdminNote(order, req.user, note ? `${trail} — ${note}` : trail);
    order.paymentStatus = nextStatus;

    if (nextStatus === "paid") {
      order.paymentExpiresAt = null;
      if (order.invoice) {
        order.invoice.status = "paid";
        order.invoice.updatedAt = new Date();
      }
      if (order.status === "pending_payment") {
        // Same outcome as a verified online payment: accept the order, take stock, alert the team.
        order.status = "confirmed";
        setStatusActor(order, { ...actor, note: note || "Payment confirmed by admin" });
        await finalizePaidOrder(order);
      } else {
        await order.save();
      }
    } else if (nextStatus === "pending") {
      if (order.invoice?.status === "paid") {
        order.invoice.status = "final";
        order.invoice.updatedAt = new Date();
      }
      await order.save();
    } else if (nextStatus === "failed") {
      // Online order that never got paid: close it exactly like the customer cancelling it (no stock was taken yet).
      order.status = "cancelled";
      order.paymentExpiresAt = null;
      if (order.invoice) {
        order.invoice.status = "void";
        order.invoice.updatedAt = new Date();
      }
      setStatusActor(order, { ...actor, note: note || "Payment failed (marked by admin)" });
      await order.save();
    } else {
      if (order.invoice) {
        order.invoice.status = "void";
        order.invoice.updatedAt = new Date();
      }
      await order.save();
    }

    await logOrderPayment(req, order, nextStatus);

    const updated = await loadPopulatedOrder(order._id);
    pushOrderLiveUpdate(updated);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

/** The order with its private notes — for the admin detail screen only. */
async function getAdminOrderNotes(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({ message: "Invalid order id." });
    }
    const order = await Order.findById(id).select("adminNotes");
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.json({ orderId: String(order._id), notes: order.adminNotes || [] });
  } catch (error) {
    next(error);
  }
}

async function addOrderNote(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({ message: "Invalid order id." });
    }
    const text = String(req.body?.text || "").trim();
    if (!text) return res.status(400).json({ message: "Write a note first." });
    if (text.length > 500) return res.status(400).json({ message: "Notes can be at most 500 characters." });

    const order = await Order.findById(id).select("+adminNotes");
    if (!order) return res.status(404).json({ message: "Order not found." });
    pushAdminNote(order, req.user, text);
    await order.save();
    await logOrderNote(req, order);
    res.status(201).json({ orderId: String(order._id), notes: order.adminNotes });
  } catch (error) {
    next(error);
  }
}

async function deleteOrderNote(req, res, next) {
  try {
    const { id, noteId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id)) || !mongoose.Types.ObjectId.isValid(String(noteId))) {
      return res.status(400).json({ message: "Invalid id." });
    }
    const order = await Order.findById(id).select("+adminNotes");
    if (!order) return res.status(404).json({ message: "Order not found." });
    if (!order.adminNotes.some((n) => String(n._id) === String(noteId))) {
      return res.status(404).json({ message: "Note not found." });
    }
    order.adminNotes.pull({ _id: noteId });
    await order.save();
    res.json({ orderId: String(order._id), notes: order.adminNotes });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOrder,
  getAllOrders,
  getAdminOrderById,
  getMyOrders,
  updateMyDeliveryLocation,
  getMyOrderLiveLocation,
  getMyOrderDrivingRoute,
  getMyDeliveryOrders,
  acceptMyDeliveryOrder,
  declineMyDeliveryOrder,
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
  youpiWebhook,
  cancelPendingOrder,
  claimMyOrderReward,
  sweepExpiredPendingPayments,
  bulkUpdateOrderStatus,
  bulkAssignRider,
  updateOrderPayment,
  getAdminOrderNotes,
  addOrderNote,
  deleteOrderNote,
};
