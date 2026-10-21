const crypto = require("crypto");

function getYoupiApiUrl() {
  return String(process.env.YOUPI_API_URL || "").trim().replace(/\/+$/, "");
}

function getYoupiMerchantId() {
  return String(process.env.YOUPI_MERCHANT_ID || "").trim();
}

function getYoupiWebhookSecret() {
  return String(process.env.YOUPI_WEBHOOK_SECRET || "").trim();
}

function getYoupiReturnUrl() {
  return String(process.env.YOUPI_RETURN_URL || "https://www.zeevan.shop/orders").trim();
}

/** macOS Control Center owns localhost:7000 (AirTunes 403). Always use 127.0.0.1. */
function preferLoopbackUrl(url) {
  return String(url || "").replace(/^(https?:\/\/)localhost(?=[:/?#]|$)/i, "$1127.0.0.1");
}

function isYoupiConfigured() {
  return Boolean(getYoupiApiUrl() && getYoupiMerchantId());
}

function youpiError(message, statusCode = 500, code = "YOUPI_ERROR") {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

/** POST /api/v1/payments — amount and order id come from our DB, never the browser. */
async function createYoupiPayment({ orderId, amountInRupees, returnUrl, metadata }) {
  if (!isYoupiConfigured()) {
    throw youpiError(
      "YouPI not configured. Set YOUPI_API_URL and YOUPI_MERCHANT_ID in backend/.env.",
      500,
      "YOUPI_NOT_CONFIGURED"
    );
  }

  const amount = Number(amountInRupees);
  if (!Number.isFinite(amount) || amount < 1) {
    throw youpiError("Amount must be at least ₹1.", 400);
  }

  const payload = {
    orderId: String(orderId),
    amount: amount.toFixed(2),
    currency: "INR",
    returnUrl: String(returnUrl || getYoupiReturnUrl()),
    autoActivate: true,
    metadata: metadata && typeof metadata === "object" ? metadata : undefined,
  };

  const res = await fetch(`${getYoupiApiUrl()}/api/v1/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Merchant-Id": getYoupiMerchantId(),
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw youpiError(
      data.message || data.error || `YouPI create payment failed (${res.status}).`,
      res.status >= 400 && res.status < 500 ? res.status : 502
    );
  }

  const checkoutUrl = preferLoopbackUrl(data.checkoutUrl || data.checkout_url);
  const paymentId = String(data.paymentId || data.payment_id || "").trim();
  if (!checkoutUrl || !paymentId) {
    throw youpiError("YouPI did not return checkoutUrl/paymentId.");
  }

  return {
    paymentId,
    orderId: String(data.orderId || payload.orderId),
    amount: String(data.amount || payload.amount),
    status: String(data.status || "ACTIVE"),
    checkoutUrl,
  };
}

function normalizeYoupiSignature(header) {
  return String(header || "")
    .trim()
    .replace(/^sha256=/i, "");
}

/** HMAC-SHA256(raw body, merchant webhook secret). Header may include `sha256=`. */
function verifyYoupiWebhook(rawBody, signatureHeader) {
  const secret = getYoupiWebhookSecret();
  if (!secret || rawBody == null || !signatureHeader) return false;
  const raw = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody), "utf8");
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const given = normalizeYoupiSignature(signatureHeader);
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(given, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

if (require.main === module) {
  process.env.YOUPI_WEBHOOK_SECRET = "unit-test-secret";
  const raw = '{"event":"SUCCESS","orderId":"ORD-1"}';
  const sig =
    "sha256=" + crypto.createHmac("sha256", "unit-test-secret").update(raw).digest("hex");
  if (!verifyYoupiWebhook(raw, sig)) throw new Error("youpi hmac failed");
  if (verifyYoupiWebhook(raw, "sha256=deadbeef")) throw new Error("youpi hmac accepted junk");
  console.log("youpiService ok");
}

module.exports = {
  isYoupiConfigured,
  getYoupiReturnUrl,
  createYoupiPayment,
  verifyYoupiWebhook,
  preferLoopbackUrl,
};
