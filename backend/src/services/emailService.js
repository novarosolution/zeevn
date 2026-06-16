const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

function mailFrom() {
  return process.env.MAIL_FROM || process.env.SMTP_USER || "orders@zeevan.app";
}

async function sendEmail({ to, subject, text, html }) {
  const recipient = String(to || process.env.ADMIN_NOTIFY_EMAIL || "").trim();
  if (!recipient) {
    return { ok: false, skipped: true, reason: "no_recipient" };
  }

  const transport = getTransporter();
  if (!transport) {
    console.warn("[email] SMTP not configured — skipped:", subject);
    return { ok: false, skipped: true, reason: "smtp_not_configured" };
  }

  await transport.sendMail({
    from: mailFrom(),
    to: recipient,
    subject,
    text,
    html: html || text.replace(/\n/g, "<br/>"),
  });

  return { ok: true };
}

module.exports = {
  sendEmail,
};
