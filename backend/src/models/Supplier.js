const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, default: "", trim: true, maxlength: 20 },
    note: { type: String, default: "", trim: true, maxlength: 240 },
    lastBillAt: { type: Date, default: null },
  },
  { timestamps: true }
);

supplierSchema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });

module.exports = mongoose.model("Supplier", supplierSchema);
