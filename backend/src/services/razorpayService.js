const crypto = require("crypto");

let razorpayInstance = null;

/**
 * Reads RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET from env, lazily constructs a
 * singleton razorpay client. Throws a clear error when the keys aren't
 * configured so callers can return a 500 with a helpful message in dev.
 */
function getRazorpay() {
  if (razorpayInstance) return razorpayInstance;

  const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  if (!keyId || !keySecret) {
    const err = new Error(
      "Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env."
    );
    err.statusCode = 500;
    err.code = "RAZORPAY_NOT_CONFIGURED";
    throw err;
  }

  let RazorpayCtor;
  try {
    RazorpayCtor = require("razorpay");
  } catch (loadErr) {
    const err = new Error(
      'The "razorpay" npm package is not installed. Run `npm install razorpay` inside backend/.'
    );
    err.statusCode = 500;
    err.code = "RAZORPAY_PACKAGE_MISSING";
    err.cause = loadErr;
    throw err;
  }

  razorpayInstance = new RazorpayCtor({
    key_id: keyId,
    key_secret: keySecret,
  });
  return razorpayInstance;
}

/** Public key id (safe to ship to client). */
function getRazorpayKeyId() {
  return (process.env.RAZORPAY_KEY_ID || "").trim();
}

function getRazorpayKeySecret() {
  return (process.env.RAZORPAY_KEY_SECRET || "").trim();
}

function getRazorpayWebhookSecret() {
  return (process.env.RAZORPAY_WEBHOOK_SECRET || "").trim();
}

/**
 * Creates a Razorpay order. Amount is in INR rupees here; we convert to paise
 * (Razorpay's smallest unit) inside this function so callers don't have to.
 */
async function createPaymentOrder({ amountInRupees, currency = "INR", receipt, notes }) {
  const rzp = getRazorpay();
  const amountPaise = Math.round(Number(amountInRupees) * 100);
  if (!Number.isFinite(amountPaise) || amountPaise < 100) {
    const err = new Error("Amount must be at least ₹1.");
    err.statusCode = 400;
    throw err;
  }
  return rzp.orders.create({
    amount: amountPaise,
    currency,
    receipt: receipt ? String(receipt).slice(0, 40) : undefined,
    notes: notes && typeof notes === "object" ? notes : undefined,
    payment_capture: 1,
  });
}

/**
 * HMAC-SHA256(`${order_id}|${payment_id}`, key_secret) compared in constant
 * time against the signature returned by Razorpay Checkout.
 */
function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const secret = getRazorpayKeySecret();
  if (!secret) return false;
  if (!orderId || !paymentId || !signature) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(String(signature), "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Verifies the X-Razorpay-Signature header on webhook delivery using the
 * configured RAZORPAY_WEBHOOK_SECRET. Pass the raw request body buffer/string.
 */
function verifyWebhookSignature(rawBody, signature) {
  const secret = getRazorpayWebhookSecret();
  if (!secret || !rawBody || !signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(String(signature), "hex")
    );
  } catch {
    return false;
  }
}

module.exports = {
  getRazorpay,
  getRazorpayKeyId,
  createPaymentOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
};
