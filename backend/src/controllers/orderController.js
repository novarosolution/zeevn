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

const PLATFORM_FEE = 1.2;
const DEFAULT_DELIVERY_FEE = 0;

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
      if (!resolvedCoupon.isVisibleToUsers) {
        return res.status(400).json({ message: "This coupon is not available for users." });
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

    const order = await Order.create({
      user: req.user._id,
      products: normalizedItems,
      totalPrice,
      shippingAddress,
      paymentMethod: paymentMethod || "Cash on Delivery",
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
      status: "pending",
    });

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
      .populate("products.product", "name price image inStock stockQty");

    res.status(201).json(populatedOrder);
  } catch (error) {
    next(error);
  }
}

async function getAllOrders(req, res, next) {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email")
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
      .populate("products.product", "name price image inStock stockQty");
    res.json(orders);
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

    const subtotal = (user.cartItems || []).reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );
    const coupon = await Coupon.findOne({ code: couponCode });
    if (coupon && !coupon.isVisibleToUsers) {
      return res.status(400).json({ valid: false, message: "This coupon is not available for users." });
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

    const subtotal = (user.cartItems || []).reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );
    const allCoupons = await Coupon.find({ isActive: true, isVisibleToUsers: true }).sort({ createdAt: -1 });
    const validCoupons = [];

    for (const coupon of allCoupons) {
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
    if (!["pending", "paid"].includes(order.status)) {
      return res.status(400).json({ message: "Address cannot be changed once order is shipped or completed." });
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
      const validStatuses = ["pending", "paid", "shipped", "delivered", "cancelled"];
      if (!validStatuses.includes(req.body.status)) {
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
    await order.save();
    const updated = await Order.findById(order._id)
      .populate("user", "name email")
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
    const validStatuses = ["pending", "paid", "shipped", "delivered", "cancelled"];

    if (!validStatuses.includes(status)) {
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
  createOrder,
  getAllOrders,
  getMyOrders,
  validateCouponForCart,
  getAvailableCouponsForCart,
  reorderMyOrder,
  updateMyOrderAddress,
  updateAdminOrderDetails,
  updateOrderStatus,
  deleteOrder,
};
