const mongoose = require("mongoose");

const receiptLineSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, default: "", trim: true },
    unit: { type: String, default: "", trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

/** Jars arriving at the shop. Draft does not touch stock. Confirm adds to the chosen pile. */
const stockReceiptSchema = new mongoose.Schema(
  {
    note: { type: String, default: "", trim: true, maxlength: 200 },
    supplierName: { type: String, default: "", trim: true, maxlength: 120 },
    destination: { type: String, enum: ["online", "counter"], default: "online" },
    status: { type: String, enum: ["draft", "received"], default: "draft", index: true },
    lines: { type: [receiptLineSchema], default: [] },
    savedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    savedByName: { type: String, default: "", trim: true, maxlength: 80 },
    receivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

stockReceiptSchema.index({ createdAt: -1 });
stockReceiptSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("StockReceipt", stockReceiptSchema);
