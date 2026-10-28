import { buildCsv, csvFilename, saveCsv } from "./adminCsv";
import { productStockMeta } from "./adminProductHelpers";

/** Customers list (walk-in and online) as a CSV: name, contact, orders, spend split, last visit. */
export function exportCustomersCsv(customers) {
  const headers = ["Name", "Phone", "Email", "Type", "Orders", "Spent", "Spent online", "Spent walk-in", "Last visit", "Joined", "Note"];
  const rows = (customers || []).map((row) => [
    row.name || "",
    row.phone || "",
    String(row.email || "").endsWith(".local") ? "" : row.email || "",
    row.walkIn ? "Walk-in" : "Online",
    row.orderCount || 0,
    row.spent || 0,
    row.spentOnline || 0,
    row.spentWalkIn || 0,
    row.lastVisit ? new Date(row.lastVisit).toISOString().slice(0, 10) : "",
    row.createdAt ? new Date(row.createdAt).toISOString().slice(0, 10) : "",
    row.adminNote || "",
  ]);
  return saveCsv(csvFilename("customers"), buildCsv(headers, rows), "Export customers");
}

/** Catalogue as a CSV: price, both stock piles, status. Handy for a supplier or an accountant. */
export function exportProductsCsv(products) {
  const headers = ["Name", "SKU", "Category", "Price", "MRP", "Online stock", "Floor stock", "Status"];
  const rows = (products || []).map((p) => [
    p.name || "",
    p.sku || "",
    p.category || "",
    Number(p.price) || 0,
    Number(p.mrp) || "",
    Math.max(0, Number(p.stockQty) || 0),
    Math.max(0, Number(p.stockCounter) || 0),
    productStockMeta(p).label,
  ]);
  return saveCsv(csvFilename("products"), buildCsv(headers, rows), "Export products");
}
