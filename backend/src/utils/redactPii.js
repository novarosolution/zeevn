const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "refreshToken",
  "authorization",
  "otp",
  "razorpay_signature",
  "razorpaySignature",
  "card",
  "cvv",
  "email",
  "phone",
]);

function redactValue(key, value) {
  if (SENSITIVE_KEYS.has(String(key).toLowerCase())) {
    return "[REDACTED]";
  }
  return value;
}

function redactObject(input, depth = 0) {
  if (depth > 6) return "[TRUNCATED]";
  if (input == null || typeof input !== "object") return input;
  if (Array.isArray(input)) {
    return input.slice(0, 50).map((item) => redactObject(item, depth + 1));
  }
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "object" && value !== null) {
      out[key] = redactObject(value, depth + 1);
    } else {
      out[key] = redactValue(key, value);
    }
  }
  return out;
}

module.exports = { redactObject };
