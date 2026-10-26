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
import { htmlEscape } from "./orderInvoiceMeta";

/** A retry whose first attempt already went through meets a locked document: that means done, not failed. */
async function confirmOnce(run) {
  try {
    return await run();
  } catch (err) {
    if (/locked/i.test(String(err?.message || ""))) return null;
    throw err;
  }
}

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
        clientRef: payload.clientRef,
      }),
    transfer: async (payload) => {
      const draft = await saveAdminTransferDraft(null, payload);
      await confirmOnce(() => confirmAdminTransfer(null, draft._id));
    },
    stock_out: (payload) => createAdminStockOut(null, payload),
    stock_in: async (payload) => {
      const saveOnly = payload.confirm === false; // "Save draft" while offline: keep it a draft on the server
      // A delivery opened from the Drafts list already exists on the server; only a brand-new one needs creating.
      if (payload.receiptId) {
        if (saveOnly) return saveAdminStockInDraft(null, payload, payload.receiptId);
        return confirmOnce(() => confirmAdminStockIn(null, payload.receiptId, payload));
      }
      const saved = await saveAdminStockInDraft(null, payload);
      return saveOnly ? saved : confirmOnce(() => confirmAdminStockIn(null, saved._id, payload));
    },
  };
}

export function draftKindLabel(kind) {
  if (kind === "walk_in") return "Store sale";
  if (kind === "transfer") return "Transfer";
  if (kind === "stock_out") return "Stock out";
  if (kind === "stock_in") return "Stock in";
  return kind || "Draft";
}

export function draftDesk(kind) {
  if (kind === "walk_in") return "AdminStoreSelling";
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
    .map((line) => `${htmlEscape(line.name || "Jar")} ×${Number(line.quantity) || 1}`)
    .join("<br/>");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${htmlEscape(draftKindLabel(row?.kind))}</title>
    <style>body{font-family:system-ui,sans-serif;padding:20px;color:#1a2118}h1{font-size:18px}</style></head>
    <body><h1>${htmlEscape(draftKindLabel(row?.kind))}</h1>
    <p>${htmlEscape(row?.label || "")}</p>
    <p>${payload.from ? `${htmlEscape(payload.from)} → ${htmlEscape(payload.to)}` : htmlEscape(payload.location || "")}</p>
    <p>${htmlEscape(payload.name || payload.supplierName || "")} ${htmlEscape(payload.phone || "")}</p>
    <p>${lines || htmlEscape(payload.note || "")}</p>
    <p>Draft on this phone · ${row?.at ? new Date(row.at).toLocaleString("en-IN") : ""}</p>
    </body></html>`;
}
