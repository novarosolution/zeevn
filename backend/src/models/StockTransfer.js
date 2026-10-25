const mongoose = require("mongoose");

const transferLineSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, default: "", trim: true },
    unit: { type: String, default: "", trim: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

/** Move jars between the online stockroom and the shop floor. */
const stockTransferSchema = new mongoose.Schema(
  {
    from: { type: String, enum: ["online", "counter"], required: true },
    to: { type: String, enum: ["online", "counter"], required: true },
    note: { type: String, default: "", trim: true, maxlength: 200 },
    status: { type: String, enum: ["draft", "done"], default: "draft", index: true },
    lines: { type: [transferLineSchema], default: [] },
    savedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    savedByName: { type: String, default: "", trim: true, maxlength: 80 },
    doneAt: { type: Date, default: null },
  },
  { timestamps: true }
);

stockTransferSchema.index({ createdAt: -1 });
stockTransferSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("StockTransfer", stockTransferSchema);
