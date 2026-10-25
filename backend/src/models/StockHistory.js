const mongoose = require("mongoose");

const WHYS = ["manual", "stock-in", "sale", "cancel", "return", "transfer", "stock-out", "walk-in"];
const LOCATIONS = ["online", "counter"];

const stockHistorySchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    name: { type: String, default: "", trim: true, maxlength: 160 },
    sku: { type: String, default: "", trim: true, maxlength: 80 },
    before: { type: Number, required: true },
    after: { type: Number, required: true },
    change: { type: Number, required: true },
    why: { type: String, enum: WHYS, required: true },
    location: { type: String, enum: LOCATIONS, default: "online", index: true },
    who: { type: String, default: "System", trim: true, maxlength: 80 },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    orderRef: { type: String, default: "", trim: true, maxlength: 24 },
    receipt: { type: mongoose.Schema.Types.ObjectId, ref: "StockReceipt", default: null },
    receiptNote: { type: String, default: "", trim: true, maxlength: 200 },
    transfer: { type: mongoose.Schema.Types.ObjectId, ref: "StockTransfer", default: null },
  },
  { timestamps: false }
);

stockHistorySchema.index({ at: -1, _id: -1 });
stockHistorySchema.index({ why: 1, at: -1 });
stockHistorySchema.index({ name: 1 });
stockHistorySchema.index({ sku: 1 });
stockHistorySchema.index({ orderRef: 1 });

module.exports = mongoose.model("StockHistory", stockHistorySchema);
module.exports.WHYS = WHYS;
module.exports.LOCATIONS = LOCATIONS;
