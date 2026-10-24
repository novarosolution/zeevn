const mongoose = require("mongoose");

const helpFaqItemSchema = new mongoose.Schema(
  {
    question: { type: String, default: "", trim: true, maxlength: 160 },
    answer: { type: String, default: "", trim: true, maxlength: 800 },
    order: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

/** One Help FAQ list for the shop. Missing document = the app’s built-in four. */
const helpFaqSchema = new mongoose.Schema(
  {
    saved: { type: Boolean, default: false },
    items: { type: [helpFaqItemSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HelpFaq", helpFaqSchema);
