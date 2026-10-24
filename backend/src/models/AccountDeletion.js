const mongoose = require("mongoose");

/** A customer or rider asking the shop to close their account. The user document stays. */
const accountDeletionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    wasRider: { type: Boolean, default: false },
    name: { type: String, default: "", trim: true, maxlength: 80 },
    email: { type: String, default: "", trim: true, maxlength: 120 },
    phone: { type: String, default: "", trim: true, maxlength: 40 },
    reason: { type: String, default: "", trim: true, maxlength: 300 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    decidedByName: { type: String, default: "", trim: true, maxlength: 80 },
    decidedAt: { type: Date, default: null },
    adminNote: { type: String, default: "", trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

accountDeletionSchema.index({ status: 1, createdAt: -1 });
accountDeletionSchema.index({ user: 1, status: 1 }, { unique: true, partialFilterExpression: { status: "pending" } });

module.exports = mongoose.model("AccountDeletion", accountDeletionSchema);
