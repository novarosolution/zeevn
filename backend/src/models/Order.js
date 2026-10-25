const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false,
    },
    externalProductId: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    variantLabel: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

/** One row per lifecycle change — powers the customer timeline + admin audit. */
const statusEventSchema = new mongoose.Schema(
  {
    status: { type: String, required: true, trim: true },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    byRole: {
      type: String,
      enum: ["customer", "admin", "delivery", "system"],
      default: "system",
    },
    note: { type: String, default: "", trim: true, maxlength: 300 },
  },
  { _id: false }
);

const adminNoteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 500 },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    byName: { type: String, default: "", trim: true, maxlength: 80 },
    at: { type: Date, default: Date.now },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    /** Admin assigns a delivery partner to fulfill this order. */
    assignedDeliveryUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    /**
     * Partner must accept before working the run.
     * none = unassigned · pending = waiting on boy · accepted · declined
     */
    deliveryAcceptStatus: {
      type: String,
      enum: ["none", "pending", "accepted", "declined"],
      default: "none",
    },
    deliveryAssignedAt: { type: Date, default: null },
    deliveryAcceptedAt: { type: Date, default: null },
    deliveryDeclinedAt: { type: Date, default: null },
    deliveryDeclineReason: { type: String, default: "", trim: true },
    /** Partners who declined this order (skip on auto-reassign). */
    deliveryDeclinedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    /**
     * Who was asked to take this run, and what they did. Written only from assign / accept /
     * decline / clear — not a second assignment system. Capped in the controller (30).
     */
    dispatchAttempts: {
      type: [
        {
          at: { type: Date, default: Date.now },
          rider: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
          riderName: { type: String, default: "", trim: true, maxlength: 80 },
          action: {
            type: String,
            enum: ["assigned", "accepted", "declined", "cleared"],
            required: true,
          },
          by: {
            type: String,
            enum: ["auto", "admin", "rider"],
            required: true,
          },
          reason: { type: String, default: "", trim: true, maxlength: 240 },
        },
      ],
      default: [],
    },
    /** Snapshot of serviceable zone at place-order. */
    deliveryZone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryZone",
      default: null,
    },
    deliveryZoneName: {
      type: String,
      default: "",
      trim: true,
    },
    products: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "Order must include at least one product.",
      },
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    /** online = delivery shop. walk_in = counter till. */
    channel: {
      type: String,
      enum: ["online", "walk_in"],
      default: "online",
      index: true,
    },
    shippingAddress: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      addressType: { type: String, default: "Home", trim: true },
      houseNumber: { type: String, default: "", trim: true },
      line1: { type: String, required: true, trim: true },
      landmark: { type: String, default: "", trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, default: "", trim: true },
      postalCode: { type: String, required: true, trim: true },
      country: { type: String, default: "", trim: true },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      note: { type: String, default: "", trim: true },
    },
    paymentMethod: {
      type: String,
      default: "Cash on Delivery",
      trim: true,
    },
    paymentStatus: {
      type: String,
      default: "pending",
      enum: ["pending", "paid", "failed", "refunded"],
    },
    razorpay: {
      orderId: { type: String, default: "", trim: true },
      paymentId: { type: String, default: "", trim: true },
      signature: { type: String, default: "", trim: true },
    },
    youpi: {
      paymentId: { type: String, default: "", trim: true },
      orderId: { type: String, default: "", trim: true },
      checkoutUrl: { type: String, default: "", trim: true },
      upiUri: { type: String, default: "", trim: true },
      vpa: { type: String, default: "", trim: true },
      payeeName: { type: String, default: "", trim: true },
      utr: { type: String, default: "", trim: true },
      status: { type: String, default: "", trim: true },
    },
    paymentExpiresAt: {
      type: Date,
      default: null,
    },
    coupon: {
      code: { type: String, default: "", trim: true },
      title: { type: String, default: "", trim: true },
      type: { type: String, default: "", trim: true },
      value: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 },
    },
    priceBreakdown: {
      itemsTotal: { type: Number, default: 0, min: 0 },
      deliveryFee: { type: Number, default: 0, min: 0 },
      platformFee: { type: Number, default: 0, min: 0 },
      discountAmount: { type: Number, default: 0, min: 0 },
    },
    invoice: {
      number: { type: String, default: "", trim: true },
      issueDate: { type: Date, default: Date.now },
      dueDate: { type: Date, default: null },
      notes: { type: String, default: "", trim: true },
      taxRatePercent: { type: Number, default: 0, min: 0 },
      taxAmount: { type: Number, default: 0, min: 0 },
      status: {
        type: String,
        default: "draft",
        enum: ["draft", "final", "paid", "void"],
      },
      updatedAt: { type: Date, default: Date.now },
    },
    status: {
      type: String,
      default: "pending",
      enum: [
        "pending_payment",
        "pending",
        "confirmed",
        "preparing",
        "ready_for_pickup",
        "out_for_delivery",
        "paid",
        "shipped",
        "delivered",
        "cancelled",
      ],
    },
    reward: {
      eligiblePoints: { type: Number, default: 25, min: 0 },
      claimedPoints: { type: Number, default: 0, min: 0 },
      claimedAt: { type: Date, default: null },
    },
    /** Set when inventory was deducted for this order. */
    stockAdjustedAt: {
      type: Date,
      default: null,
    },
    /** Set after admin email/WhatsApp alert was sent. */
    adminNotifiedAt: {
      type: Date,
      default: null,
    },
    /**
     * Customer-facing tracking details. ETA is snapshotted from the delivery zone at
     * place-order and may be refined by admin; courier fields are optional (own fleet).
     */
    tracking: {
      note: { type: String, default: "", trim: true, maxlength: 300 },
      etaMinutesMin: { type: Number, default: null },
      etaMinutesMax: { type: Number, default: null },
      promisedAt: { type: Date, default: null },
      courierName: { type: String, default: "", trim: true, maxlength: 80 },
      trackingId: { type: String, default: "", trim: true, maxlength: 80 },
      trackingUrl: { type: String, default: "", trim: true, maxlength: 400 },
    },
    statusHistory: {
      type: [statusEventSchema],
      default: [],
    },
    /**
     * Private notes the team leaves on an order. `select: false` keeps them out of every default read, so a
     * customer's order payload or a socket push can never carry them; admin code asks for them with `+adminNotes`.
     */
    adminNotes: {
      type: [adminNoteSchema],
      default: [],
      select: false,
    },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: 1 });
orderSchema.index({ assignedDeliveryUser: 1, status: 1 });
orderSchema.index({ deliveryZone: 1 });
orderSchema.index({ "dispatchAttempts.at": -1 });

/**
 * Record every status transition. Controllers may describe the actor via
 * `order.$locals.statusActor = { by, byRole, note }` before `save()`.
 */
orderSchema.pre("save", function recordStatusHistory(next) {
  const actor = this.$locals?.statusActor || {};
  const last = this.statusHistory?.length
    ? this.statusHistory[this.statusHistory.length - 1]
    : null;
  const changed = this.isNew || this.isModified("status");
  if (changed && (!last || last.status !== this.status)) {
    this.statusHistory.push({
      status: this.status,
      at: new Date(),
      by: actor.by || null,
      byRole: actor.byRole || (this.isNew ? "customer" : "system"),
      note: String(actor.note || "").trim().slice(0, 300),
    });
    this.$locals.statusChanged = !this.isNew;
  }
  next();
});

orderSchema.post("save", function notifyStatusChange(doc) {
  if (!doc.$locals?.statusChanged) return;
  doc.$locals.statusChanged = false;
  // Lazy require: avoids a model → service → model cycle at load time.
  const { notifyCustomerOrderStatus } = require("../services/orderStatusNotificationService");
  notifyCustomerOrderStatus(doc).catch((err) => {
    console.warn("[orders] customer status notify failed:", err?.message || err);
  });
});

module.exports = mongoose.model("Order", orderSchema);
