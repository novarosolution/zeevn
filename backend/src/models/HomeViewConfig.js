const mongoose = require("mongoose");

const homeViewConfigSchema = new mongoose.Schema(
  {
    heroTitle: {
      type: String,
      default: "Pure Heritage in Every Drop",
      trim: true,
    },
    heroSubtitle: {
      type: String,
      default:
        "Slow-churned from the milk of grass-fed cows — golden clarity and aroma rooted in tradition.",
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("HomeViewConfig", homeViewConfigSchema);
