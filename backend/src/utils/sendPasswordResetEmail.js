const { isSmtpConfigured, sendMail } = require("./mailTransport");

/**
 * Sends (or logs) a password-reset link.
 * @param {string} toEmail
 * @param {string} rawToken — plain token included in the reset URL
 */
async function sendPasswordResetEmail(toEmail, rawToken) {
  const base = String(process.env.APP_WEB_URL || process.env.WEB_APP_URL || "http://localhost:8081").replace(
    /\/$/,
    ""
  );
  const link = `${base}/reset-password?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(toEmail)}`;
  const brand = String(process.env.MAIL_BRAND_NAME || "Zeevan").trim();

  if (!isSmtpConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.info(`[password-reset] ${toEmail} → ${link}`);
    }
    return { link, sent: false };
  }

  const subject = `${brand} — reset your password`;
  const text = `Reset your ${brand} password using this link (valid for 30 minutes):\n\n${link}\n\nIf you did not request this, ignore this email.`;

  await sendMail({
    to: toEmail,
    subject,
    text,
    html: `<p>Reset your <strong>${brand}</strong> password (valid for 30 minutes):</p><p><a href="${link}">${link}</a></p><p>If you did not request this, ignore this email.</p>`,
  });

  return { link, sent: true };
}

module.exports = { sendPasswordResetEmail };
