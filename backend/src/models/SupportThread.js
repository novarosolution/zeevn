const mongoose = require("mongoose");

const supportMessageSchema = new mongoose.Schema(
  {
    senderRole: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },
    senderName: {
      type: String,
      default: "",
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const supportThreadSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    messages: {
      type: [supportMessageSchema],
      default: [],
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportThread", supportThreadSchema);
