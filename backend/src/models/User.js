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
      default: "",
      validate: {
        validator(v) {
          if (!v) return true;
          return String(v).length >= 6;
        },
        message: "Password must be at least 6 characters.",
      },
    },
    authProviders: [
      {
        provider: {
          type: String,
          enum: ["google", "apple"],
          required: true,
        },
        providerId: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    /** Created from the counter till — name + phone, no app login. */
    walkIn: {
      type: Boolean,
      default: false,
    },
    adminNote: {
      type: String,
      default: "",
      trim: true,
      maxlength: 240,
    },
    /** Profile photo URL (e.g. Cloudinary). */
    avatar: {
      type: String,
      default: "",
      trim: true,
    },
    defaultAddress: {
      addressType: { type: String, default: "Home", trim: true },
      houseNumber: { type: String, default: "", trim: true },
      line1: { type: String, default: "", trim: true },
      landmark: { type: String, default: "", trim: true },
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

userSchema.index({ isDeliveryPartner: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ walkIn: 1 });
userSchema.index({ "deliveryLiveLocation.updatedAt": 1 });

module.exports = mongoose.model("User", userSchema);
