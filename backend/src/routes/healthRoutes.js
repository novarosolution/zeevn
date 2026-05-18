const express = require("express");
const mongoose = require("mongoose");
const { isSmtpConfigured } = require("../utils/mailTransport");
const { isCloudinaryConfigured } = require("../config/cloudinary");
const { isRazorpayConfigured } = require("../services/razorpayService");

const router = express.Router();

function mongoStatus() {
  const state = mongoose.connection.readyState;
  if (state === 1) return "up";
  if (state === 2) return "connecting";
  return "down";
}

router.get("/health", (_req, res) => {
  const mongo = mongoStatus();
  const smtp = isSmtpConfigured() ? "configured" : "not-configured";
  const razorpay = isRazorpayConfigured() ? "configured" : "not-configured";
  const cloudinary = isCloudinaryConfigured() ? "configured" : "not-configured";
  const healthy = mongo === "up";
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    mongo,
    cloudinary,
    smtp,
    razorpay,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
