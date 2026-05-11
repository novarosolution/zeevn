const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false,
    },
    externalProductId: {
      type: String,
      default: "",
      trim: true,
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

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    /** Profile photo URL (e.g. Cloudinary). */
    avatar: {
      type: String,
      default: "",
      trim: true,
    },
    defaultAddress: {
      line1: { type: String, default: "", trim: true },
      city: { type: String, default: "", trim: true },
      state: { type: String, default: "", trim: true },
      postalCode: { type: String, default: "", trim: true },
      country: { type: String, default: "", trim: true },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    /** Set by admin — can open delivery dashboard and complete assigned orders. */
    isDeliveryPartner: {
      type: Boolean,
      default: false,
    },
    /** Last GPS ping from delivery partner app (foreground “share location”). Not shown to other users except via live-location API on active deliveries. */
    deliveryLiveLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      accuracyMeters: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },
    expoPushTokens: {
      type: [String],
      default: [],
    },
    cartItems: {
      type: [cartItemSchema],
      default: [],
    },
    /** Loyalty balance — increased when claiming delivered-order rewards; spent in Rewards redeem shop. */
    rewardPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
