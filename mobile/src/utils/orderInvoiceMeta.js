/** Shared invoice metadata for orders UI + PDF HTML. */

export function formatPaymentStatusLabel(ps) {
  const s = String(ps || "pending").toLowerCase();
  if (s === "paid") return "Paid";
  if (s === "pending") return "Pending";
  if (s === "failed") return "Failed";
  if (s === "refunded") return "Refunded";
  return String(ps || "—");
}

export function resolveInvoiceNumber(order) {
  const orderIdShort = String(order?._id || "").slice(-6).toUpperCase();
  return (
    order?.invoice?.number ||
    `INV-${new Date(order?.createdAt || Date.now()).toISOString().slice(0, 10).replace(/-/g, "")}-${orderIdShort}`
  );
}

export function resolveOrderRef(order) {
  return String(order?._id || "").slice(-6).toUpperCase();
}

/** @returns {{ label: string, tone: 'paid' | 'pending' | 'failed' | 'refunded' | 'void' | 'draft' }} */
export function getPaymentBadge(paymentStatus) {
  const s = String(paymentStatus || "").toLowerCase();
  if (s === "paid") return { label: "Paid in full", tone: "paid" };
  if (s === "refunded") return { label: "Refunded", tone: "refunded" };
  if (s === "failed") return { label: "Payment failed", tone: "failed" };
  return { label: "Payment pending", tone: "pending" };
}

/** @returns {{ label: string, tone: string }} */
export function getInvoiceStatusBadge(order) {
  const invoiceStatus = String(order?.invoice?.status || "").toLowerCase();
  if (invoiceStatus === "paid") return { label: "Invoice paid", tone: "paid" };
  if (invoiceStatus === "void") return { label: "Invoice void", tone: "void" };
  if (invoiceStatus === "final") return { label: "Final invoice", tone: "final" };
  if (invoiceStatus === "draft") return { label: "Draft invoice", tone: "draft" };
  return getPaymentBadge(order?.paymentStatus);
}

export function htmlEscape(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
