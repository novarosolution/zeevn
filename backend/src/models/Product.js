const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const labeledBlockSchema = new mongoose.Schema(
  {
    icon: { type: String, default: "checkmark-circle-outline", trim: true },
    title: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
      maxlength: 800,
    },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
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
    /** Optional list / strike price for discount display (must be > price to show % off). */
    mrp: {
      type: Number,
      min: 0,
      default: undefined,
    },
    image: {
      type: String,
      default: "",
    },
    images: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    homeSection: {
      type: String,
      default: "Prime Products",
      trim: true,
    },
    productType: {
      type: String,
      default: "General",
      trim: true,
    },
    showOnHome: {
      type: Boolean,
      default: true,
    },
    homeOrder: {
      type: Number,
      default: 0,
    },
    brand: {
      type: String,
      default: "",
      trim: true,
    },
    sku: {
      type: String,
      default: "",
      trim: true,
    },
    unit: {
      type: String,
      default: "1 pc",
      trim: true,
    },
    eta: {
      type: String,
      default: "10 MINS",
      trim: true,
    },
    isSpecial: {
      type: Boolean,
      default: false,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    stockQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** Rich PDP: average rating 0–5 */
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    reviews: {
      type: [reviewSchema],
      default: [],
    },
    /** Hero badge overlay, e.g. HAND CHURNED */
    badgeText: {
      type: String,
      default: "",
      trim: true,
    },
    /** Lifestyle / secondary image below hero USPs */
    lifestyleImage: {
      type: String,
      default: "",
      trim: true,
    },
    /** Size options; when non-empty, cart uses variant price (label + price). */
    variants: {
      type: [variantSchema],
      default: [],
    },
    /** Feature cards: icon = Ionicons name, e.g. flask-outline */
    usps: {
      type: [labeledBlockSchema],
      default: [],
    },
    processTitle: {
      type: String,
      default: "",
      trim: true,
    },
    processSteps: {
      type: [String],
      default: [],
    },
    highlightQuote: {
      type: String,
      default: "",
      trim: true,
    },
    usageRituals: {
      type: [labeledBlockSchema],
      default: [],
    },
    /** When true, customer PDP shows rich sections when any rich field is set */
    richProductPage: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
