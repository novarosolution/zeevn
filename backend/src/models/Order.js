const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false,
    },
    externalProductId: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    variantLabel: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "Order must include at least one product.",
      },
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingAddress: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      line1: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      postalCode: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      note: { type: String, default: "", trim: true },
    },
    paymentMethod: {
      type: String,
      default: "Cash on Delivery",
      trim: true,
    },
    coupon: {
      code: { type: String, default: "", trim: true },
      title: { type: String, default: "", trim: true },
      type: { type: String, default: "", trim: true },
      value: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 },
    },
    priceBreakdown: {
      itemsTotal: { type: Number, default: 0, min: 0 },
      deliveryFee: { type: Number, default: 0, min: 0 },
      platformFee: { type: Number, default: 0, min: 0 },
      discountAmount: { type: Number, default: 0, min: 0 },
    },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
