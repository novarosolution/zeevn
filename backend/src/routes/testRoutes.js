const express = require("express");
const crypto = require("crypto");
const User = require("../models/User");
const { sendEmailVerificationEmail } = require("../utils/sendEmailVerification");
const {
  isTestRoutesEnabled,
  getLastVerificationToken,
  rememberVerificationToken,
} = require("../utils/e2eVerificationStore");

const router = express.Router();

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function gate(req, res, next) {
  if (!isTestRoutesEnabled()) {
    return res.status(404).json({ message: "Not found" });
  }
  next();
}

router.use(gate);

/**
 * GET /test/last-verification-token?email=
 * Returns the last raw verification token issued for this email (E2E only).
 */
router.get("/last-verification-token", async (req, res) => {
  try {
    const email = normalizeEmail(req.query.email);
    if (!email) {
      return res.status(400).json({ message: "email query param is required." });
    }

    let token = getLastVerificationToken(email);
    if (!token) {
      const user = await User.findOne({ email }).select("+emailVerificationToken +emailVerificationExpires");
      if (!user?.emailVerificationToken) {
        return res.status(404).json({ message: "No verification token on file for this email." });
      }
      return res.status(404).json({
        message:
          "Token exists on user but raw token was not captured. POST /test/issue-verification-token first.",
      });
    }

    const base = String(process.env.APP_WEB_URL || process.env.WEB_APP_URL || "http://localhost:8081").replace(
      /\/$/,
      ""
    );
    res.json({
      email,
      token,
      verifyUrl: `${base}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`,
    });
  } catch (err) {
    res.status(500).json({ message: err?.message || "Test route error." });
  }
});

/**
 * POST /test/issue-verification-token { email }
 * Issues a fresh verification token (same as profile send-verification, without SMTP requirement).
 */
router.post("/issue-verification-token", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      return res.status(400).json({ message: "email is required." });
    }

    const user = await User.findOne({ email }).select("+emailVerificationToken +emailVerificationExpires");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();
    rememberVerificationToken(email, rawToken);

    let delivery = { link: null, sent: false };
    try {
      delivery = await sendEmailVerificationEmail(email, rawToken);
    } catch {
      /* E2E may run without SMTP */
    }

    const base = String(process.env.APP_WEB_URL || process.env.WEB_APP_URL || "http://localhost:8081").replace(
      /\/$/,
      ""
    );

    res.json({
      email,
      token: rawToken,
      verifyUrl: `${base}/verify-email?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(email)}`,
      devLink: delivery?.link,
    });
  } catch (err) {
    res.status(500).json({ message: err?.message || "Test route error." });
  }
});

/**
 * GET /test/observability-smoke — throws a captured test error (E2E / dev only).
 */
router.get("/observability-smoke", (req, res) => {
  const { captureException } = require("../observability/sentry");
  const err = new Error("Zeevan observability smoke test");
  captureException(err, { requestId: req.requestId, tags: { smoke: "true" } });
  res.json({
    ok: true,
    message: "Smoke error captured (check Sentry when SENTRY_DSN is set).",
    requestId: req.requestId,
  });
});

module.exports = router;
