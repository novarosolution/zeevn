import {
  confirmAdminStockIn,
  confirmAdminTransfer,
  createAdminStockOut,
  createAdminWalkIn,
  saveAdminStockInDraft,
  saveAdminTransferDraft,
} from "../services/adminService";
import { buildCounterBillHtml, tillDraftOrder } from "./orderInvoiceHtml";
import { buildStockInBillHtml } from "./stockInBillHtml";

export function adminOfflineHandlers() {
  return {
    walk_in: (payload) =>
      createAdminWalkIn(null, {
        products: (payload.products || []).map((line) => ({
          product: line.product || line.productId,
          quantity: line.quantity,
        })),
        customerId: payload.customerId,
        name: payload.name,
        phone: payload.phone,
        tender: payload.tender,
        upiRef: payload.upiRef,
        cashReceived: payload.cashReceived,
        cashierName: payload.cashierName,
        note: payload.note,
      }),
    transfer: async (payload) => {
      const draft = await saveAdminTransferDraft(null, payload);
      await confirmAdminTransfer(null, draft._id);
    },
    stock_out: (payload) => createAdminStockOut(null, payload),
    stock_in: async (payload) => {
      const saved = await saveAdminStockInDraft(null, payload);
      return confirmAdminStockIn(null, saved._id, payload);
    },
  };
}

export function draftKindLabel(kind) {
  if (kind === "walk_in") return "Walk-in bill";
  if (kind === "transfer") return "Transfer";
  if (kind === "stock_out") return "Stock out";
  if (kind === "stock_in") return "Stock in";
  return kind || "Draft";
}

export function draftDesk(kind) {
  if (kind === "walk_in") return "AdminCounter";
  if (kind === "transfer") return "AdminTransfers";
  if (kind === "stock_out") return "AdminStockOut";
  if (kind === "stock_in") return "AdminStockIn";
  return "AdminDashboard";
}

export function buildOfflineDraftHtml(row) {
  const payload = row?.payload || {};
  if (row?.kind === "walk_in") {
    return buildCounterBillHtml(
      tillDraftOrder({
        name: payload.name,
        phone: payload.phone,
        cart: payload.products || payload.cart || [],
        tender: payload.tender,
        upiRef: payload.upiRef,
        cashReceived: payload.cashReceived,
        cashierName: payload.cashierName,
        note: payload.note,
        createdAt: row.at,
      })
    );
  }
  if (row?.kind === "stock_in") {
    return buildStockInBillHtml({
      supplierName: payload.supplierName,
      destination: payload.destination,
      note: payload.note,
      lines: payload.lines || [],
      savedByName: payload.cashierName || "",
    });
  }
  const lines = (payload.lines || payload.products || [])
    .map((line) => `${line.name || "Jar"} ×${line.quantity || 1}`)
    .join("<br/>");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${draftKindLabel(row?.kind)}</title>
    <style>body{font-family:system-ui,sans-serif;padding:20px;color:#1a2118}h1{font-size:18px}</style></head>
    <body><h1>${draftKindLabel(row?.kind)}</h1>
    <p>${row?.label || ""}</p>
    <p>${payload.from ? `${payload.from} → ${payload.to}` : payload.location || ""}</p>
    <p>${payload.name || payload.supplierName || ""} ${payload.phone || ""}</p>
    <p>${lines || payload.note || ""}</p>
    <p>Draft on this phone · ${row?.at ? new Date(row.at).toLocaleString("en-IN") : ""}</p>
    </body></html>`;
}
