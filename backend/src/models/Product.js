const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    /** Optional pill on size card, e.g. Best Value */
    tag: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const trustChipSchema = new mongoose.Schema(
  {
    icon: { type: String, default: "checkmark-circle-outline", trim: true },
    label: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const nutritionRowSchema = new mongoose.Schema(
  {
    label: { type: String, default: "", trim: true },
    value: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const productNutritionSchema = new mongoose.Schema(
  {
    kick: { type: String, default: "", trim: true },
    title: { type: String, default: "", trim: true },
    tableHead: { type: String, default: "", trim: true },
    tableSub: { type: String, default: "", trim: true },
    rows: { type: [nutritionRowSchema], default: [] },
    cardTitle: { type: String, default: "", trim: true },
    cardBody: { type: String, default: "", trim: true },
    cardTags: { type: [String], default: [] },
    cardFooter: { type: String, default: "", trim: true },
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
    /** When false, hidden from customer shop/home (admin draft / archived). */
    isPublished: {
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
    /** Visible in catalog but not purchasable — admin launch teaser. */
    comingSoon: {
      type: Boolean,
      default: false,
    },
    /** Optional launch line shown on cards & PDP, e.g. "Festive launch · November". */
    comingSoonNote: {
      type: String,
      default: "",
      trim: true,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    /** Online / delivery stockroom. Shop checkout sells from this pile only. */
    stockQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** Shop-floor / counter pile. Walk-in bills sell from this pile only. */
    stockCounter: {
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
    /** Hero overline above product title on PDP */
    pageEyebrow: {
      type: String,
      default: "",
      trim: true,
    },
    /** Trust pill row under buy block */
    trustChips: {
      type: [trustChipSchema],
      default: [],
    },
    /** Checkmark bullet highlights under delivery note */
    highlights: {
      type: [String],
      default: [],
    },
    deliveryTitle: {
      type: String,
      default: "",
      trim: true,
    },
    deliveryBody: {
      type: String,
      default: "",
      trim: true,
    },
    /** Story section below hero (kick / title / legend) */
    storyKick: {
      type: String,
      default: "",
      trim: true,
    },
    storyTitle: {
      type: String,
      default: "",
      trim: true,
    },
    storyLegend: {
      type: String,
      default: "",
      trim: true,
    },
    reviewsKick: {
      type: String,
      default: "",
      trim: true,
    },
    reviewsTitle: {
      type: String,
      default: "",
      trim: true,
    },
    nutrition: {
      type: productNutritionSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
