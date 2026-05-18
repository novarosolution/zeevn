const express = require("express");
const mongoose = require("mongoose");
const { isSmtpConfigured } = require("../utils/mailTransport");

const router = express.Router();

function razorpayStatus() {
  const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  if (keyId && keySecret) return "configured";
  if (keyId || keySecret) return "partial";
  return "not_configured";
}

function mongoStatus() {
  const state = mongoose.connection.readyState;
  if (state === 1) return "up";
  if (state === 2) return "connecting";
  return "down";
}

router.get("/health", (_req, res) => {
  const mongo = mongoStatus();
  const smtp = isSmtpConfigured() ? "configured" : "not_configured";
  const razorpay = razorpayStatus();
  const healthy = mongo === "up";
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    mongo,
    smtp,
    razorpay,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
