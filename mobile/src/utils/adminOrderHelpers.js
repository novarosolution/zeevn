import { Platform, Alert } from "react-native";
import { formatOrderPublicRef } from "../content/appContent";
import { formatINR } from "./currency";
import { getOrderStatusLabel } from "./orderStatus";

export const ADMIN_ORDER_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "processing", label: "Processing" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

export function getOrderProductLines(order) {
  return order?.products || order?.items || [];
}

export function getOrderLineCount(order) {
  return getOrderProductLines(order).length;
}

export function getOrderItemQty(order) {
  return getOrderProductLines(order).reduce(
    (sum, line) => sum + Math.max(0, Number(line.quantity || 1)),
    0
  );
}

export function matchesAdminOrderFilter(status, filterKey) {
  const s = String(status || "");
  if (filterKey === "all") return true;
  if (filterKey === "pending") return ["pending", "pending_payment"].includes(s);
  if (filterKey === "processing") return ["confirmed", "preparing", "paid"].includes(s);
  if (filterKey === "out_for_delivery") {
    return ["ready_for_pickup", "shipped", "out_for_delivery"].includes(s);
  }
  if (filterKey === "delivered") return s === "delivered";
  if (filterKey === "cancelled") return s === "cancelled";
  return s === filterKey;
}

function paymentLabel(order) {
  const m = String(order.paymentMethod || order.paymentMode || "").toLowerCase();
  if (m.includes("cod") || m.includes("cash")) return "COD";
  if (m.includes("youpi")) return "YouPI";
  if (m.includes("razor")) return "Razorpay";
  return order.paymentMethod || "—";
}

export function exportOrdersCsv(orders) {
  const headers = ["Order", "Customer", "Email", "Date", "Qty", "Total", "Payment", "Status"];
  const rows = (orders || []).map((order) => [
    formatOrderPublicRef(order) || String(order._id || ""),
    order.user?.name || order.userName || order.shippingAddress?.name || "Guest",
    order.user?.email || "",
    order.createdAt ? new Date(order.createdAt).toISOString() : "",
    getOrderItemQty(order),
    Number(order.totalPrice || 0),
    paymentLabel(order),
    getOrderStatusLabel(order.status),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");

  if (Platform.OS === "web" && typeof document !== "undefined") {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kankreg-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }

  Alert.alert("Export CSV", "CSV export is available on web. Open admin on desktop to download.");
}
