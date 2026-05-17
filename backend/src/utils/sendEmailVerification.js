const { isSmtpConfigured, sendMail } = require("./mailTransport");

/**
 * Sends (or logs) an email verification link.
 * @param {string} toEmail
 * @param {string} rawToken
 */
async function sendEmailVerificationEmail(toEmail, rawToken) {
  const base = String(process.env.APP_WEB_URL || process.env.WEB_APP_URL || "http://localhost:8081").replace(
    /\/$/,
    ""
  );
  const link = `${base}/verify-email?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(toEmail)}`;
  const brand = String(process.env.MAIL_BRAND_NAME || "Zeevan").trim();

  if (!isSmtpConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.info(`[email-verify] ${toEmail} → ${link}`);
    }
    return { link, sent: false };
  }

  const subject = `${brand} — verify your email`;
  const text = `Verify your ${brand} email address:\n\n${link}\n\nThis link expires in 24 hours.`;

  await sendMail({
    to: toEmail,
    subject,
    text,
    html: `<p>Verify your <strong>${brand}</strong> email:</p><p><a href="${link}">${link}</a></p><p>This link expires in 24 hours.</p>`,
  });

  return { link, sent: true };
}

module.exports = { sendEmailVerificationEmail };
