const mongoose = require("mongoose");

const returnLineSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    name: { type: String, required: true, trim: true },
    variantLabel: { type: String, default: "", trim: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

/** A customer asking to send back jars from one delivered order. No wallet, no gateway refund. */
const orderReturnSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    lines: { type: [returnLineSchema], required: true },
    reason: { type: String, required: true, trim: true, maxlength: 300 },
    remarks: { type: String, default: "", trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    openedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    openedByName: { type: String, default: "", trim: true, maxlength: 80 },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    decidedByName: { type: String, default: "", trim: true, maxlength: 80 },
    decidedAt: { type: Date, default: null },
    refundAmount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

orderReturnSchema.index({ createdAt: -1 });
orderReturnSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("OrderReturn", orderReturnSchema);
