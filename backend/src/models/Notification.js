const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    forAllUsers: {
      type: Boolean,
      default: true,
    },
    /** Targeted notification (order updates) — set when `forAllUsers` is false. */
    forUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    /** broadcast | order | riders */
    kind: {
      type: String,
      default: "broadcast",
      trim: true,
    },
    /** How many Expo pushes were handed over when this row was sent. */
    pushSent: {
      type: Number,
      default: 0,
      min: 0,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    /** Order status at send time (for deep links / icons on the client). */
    orderStatus: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    readBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    archivedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
