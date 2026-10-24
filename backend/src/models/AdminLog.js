const mongoose = require("mongoose");

const TABS = ["orders", "catalog", "riders", "shop", "people"];

const adminLogSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now, index: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    adminName: { type: String, default: "Admin", trim: true, maxlength: 80 },
    action: { type: String, required: true, trim: true, maxlength: 120 },
    subject: { type: String, default: "", trim: true, maxlength: 160 },
    tab: { type: String, enum: TABS, required: true, index: true },
    href: {
      screen: { type: String, default: "", trim: true, maxlength: 64 },
      params: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
  },
  { timestamps: false }
);

adminLogSchema.index({ at: -1, _id: -1 });
adminLogSchema.index({ tab: 1, at: -1 });

module.exports = mongoose.model("AdminLog", adminLogSchema);
module.exports.TABS = TABS;
