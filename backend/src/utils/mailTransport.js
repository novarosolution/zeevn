const nodemailer = require("nodemailer");

let cachedTransport = null;

function isSmtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM
  );
}

function getMailTransport() {
  if (!isSmtpConfigured()) return null;
  if (cachedTransport) return cachedTransport;

  const port = Number(process.env.SMTP_PORT || 465);
  const secure = process.env.SMTP_SECURE !== "false" && port === 465;

  cachedTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    ...(port === 587
      ? {
          requireTLS: true,
          tls: { minVersion: "TLSv1.2" },
        }
      : {}),
  });

  return cachedTransport;
}

/**
 * @param {{ to: string, subject: string, text: string, html?: string }} opts
 */
async function sendMail({ to, subject, text, html }) {
  const transport = getMailTransport();
  if (!transport) {
    return { sent: false, reason: "smtp-not-configured" };
  }

  const from = String(process.env.SMTP_FROM || process.env.SMTP_USER || "").trim();
  if (!from) {
    throw new Error("SMTP_FROM is not set.");
  }

  try {
    await transport.sendMail({
      from,
      to,
      subject,
      text,
      html: html || text,
    });
    return { sent: true };
  } catch (err) {
    const msg = err?.response || err?.message || "SMTP send failed";
    throw new Error(msg);
  }
}

module.exports = { isSmtpConfigured, getMailTransport, sendMail };
