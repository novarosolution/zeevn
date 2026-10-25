const mongoose = require("mongoose");

const closingLineSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, default: "", trim: true },
    unit: { type: String, default: "", trim: true },
    expected: { type: Number, required: true, min: 0 },
    expectedOnline: { type: Number, default: 0, min: 0 },
    expectedCounter: { type: Number, default: 0, min: 0 },
    counted: { type: Number, default: null },
    countedOnline: { type: Number, default: null },
    countedCounter: { type: Number, default: null },
    note: { type: String, default: "", trim: true, maxlength: 120 },
  },
  { _id: false }
);

/** Shelf count vs what the app said. Snapshot only — never writes stockQty or inStock. */
const stockClosingSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true, trim: true },
    status: { type: String, enum: ["draft", "submitted"], default: "draft", index: true },
    lines: { type: [closingLineSchema], default: [] },
    savedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    savedByName: { type: String, default: "", trim: true, maxlength: 80 },
    submittedAt: { type: Date, default: null },
    submittedByName: { type: String, default: "", trim: true, maxlength: 80 },
  },
  { timestamps: true }
);

stockClosingSchema.index({ date: -1 });

module.exports = mongoose.model("StockClosing", stockClosingSchema);
