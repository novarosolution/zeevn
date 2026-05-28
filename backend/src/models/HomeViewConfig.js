const mongoose = require("mongoose");

const homeViewConfigSchema = new mongoose.Schema(
  {
    heroTitle: {
      type: String,
      default: "Curated pantry essentials, delivered well",
      trim: true,
    },
    heroSubtitle: {
      type: String,
      default:
        "Pure staples, calmer shopping, and faster doorstep delivery.",
      trim: true,
    },
    primeSectionTitle: {
      type: String,
      default: "Prime Products",
      trim: true,
    },
    productTypeTitle: {
      type: String,
      default: "Shop by category",
      trim: true,
    },
    showPrimeSection: {
      type: Boolean,
      default: true,
    },
    showHomeSections: {
      type: Boolean,
      default: true,
    },
    showProductTypeSections: {
      type: Boolean,
      default: true,
    },
    productCardStyle: {
      type: String,
      enum: ["compact", "comfortable"],
      default: "compact",
    },
    /** Optional merchandiser-curated deals list for Home deals rail. */
    dealsRail: {
      type: [
        {
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
          },
          endsAt: {
            type: Date,
            default: null,
          },
          rank: {
            type: Number,
            default: 0,
          },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HomeViewConfig", homeViewConfigSchema);
