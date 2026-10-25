import { useCallback, useState } from "react";
import {
  bulkAssignAdminOrderRider,
  fetchAdminOrder,
  updateAdminOrderPayment,
  updateOrderStatus,
} from "../../../services/adminService";
import { adminAdvanceFor, adminStatusMeta, orderRef, primaryOrderAction } from "../../../utils/adminOrderUi";
import { buildCounterBillHtml, buildOrderInvoiceHtml } from "../../../utils/orderInvoiceHtml";
import { printAdminHtml } from "../../../utils/printAdminHtml";

/**
 * The one-order actions the Orders desk offers from a row, the bulk bar and the quick-view drawer, with the same
 * confirmations, toasts and error handling everywhere. `onChanged(order)` runs after any success so the list can reload.
 */
export default function useOrderActions({ toast, confirm, onChanged }) {
  const [busyId, setBusyId] = useState("");

  const run = useCallback(
    async (id, work, successMessage) => {
      setBusyId(String(id));
      try {
        const result = await work();
        if (successMessage) toast.toastSuccess(successMessage);
        await onChanged?.(result);
        return result || true;
      } catch (err) {
        toast.toastError(err?.message || "That didn't work. Please try again.");
        return null;
      } finally {
        setBusyId("");
      }
    },
    [toast, onChanged]
  );

  const advance = useCallback(
    (order) => {
      const step = adminAdvanceFor(order?.status);
      if (!order?._id || !step) return null;
      return run(order._id, () => updateOrderStatus(null, order._id, step.to), `${orderRef(order)} is now ${adminStatusMeta(step.to).label.toLowerCase()}.`);
    },
    [run]
  );

  const cancel = useCallback(
    async (order) => {
      if (!order?._id) return null;
      const ok = await confirm({
        title: `Cancel ${orderRef(order)}?`,
        message: "The customer will see this order as cancelled and any reserved stock goes back on the shelf.",
        tone: "danger",
        confirmLabel: "Cancel order",
        cancelLabel: "Keep order",
      });
      if (!ok) return null;
      return run(order._id, () => updateOrderStatus(null, order._id, "cancelled"), `${orderRef(order)} cancelled.`);
    },
    [confirm, run]
  );

  const setPayment = useCallback(
    async (order, paymentStatus, { note, confirmFirst } = {}) => {
      if (!order?._id) return null;
      if (confirmFirst) {
        const ok = await confirm(confirmFirst);
        if (!ok) return null;
      }
      const message =
        paymentStatus === "paid"
          ? `${orderRef(order)} marked paid.`
          : paymentStatus === "refunded"
            ? `${orderRef(order)} marked refunded.`
            : paymentStatus === "failed"
              ? `${orderRef(order)} payment marked failed.`
              : `${orderRef(order)} payment set back to unpaid.`;
      return run(order._id, () => updateAdminOrderPayment(null, order._id, paymentStatus, note), message);
    },
    [confirm, run]
  );

  const assignRider = useCallback(
    async (order, riderId, riderName) => {
      if (!order?._id) return null;
      setBusyId(String(order._id));
      try {
        const res = await bulkAssignAdminOrderRider(null, [String(order._id)], riderId);
        const first = res?.results?.[0];
        if (!first?.ok) {
          toast.toastError(first?.reason || "Couldn't change the rider.");
          return null;
        }
        toast.toastSuccess(riderId ? `${riderName || "Rider"} assigned to ${orderRef(order)}.` : `Rider removed from ${orderRef(order)}.`);
        await onChanged?.(res);
        return res;
      } catch (err) {
        toast.toastError(err?.message || "Couldn't change the rider.");
        return null;
      } finally {
        setBusyId("");
      }
    },
    [toast, onChanged]
  );

  /** Runs whatever `primaryOrderAction(order)` describes. */
  const runPrimary = useCallback(
    (order) => {
      const action = primaryOrderAction(order);
      if (!action) return null;
      if (action.key === "paid") return setPayment(order, "paid", { note: "Payment confirmed by admin" });
      if (action.key === "cash") return setPayment(order, "paid", { note: "Cash collected" });
      return advance(order);
    },
    [advance, setPayment]
  );

  const printBill = useCallback(
    async (order) => {
      if (!order) return null;
      try {
        const full =
          Array.isArray(order.products) && order.products.length
            ? order
            : await fetchAdminOrder(null, order._id);
        await printAdminHtml(full.channel === "walk_in" ? buildCounterBillHtml(full) : buildOrderInvoiceHtml(full));
        toast.toastSuccess("Bill ready to print.");
        return true;
      } catch (err) {
        toast.toastError(err?.message || "Could not print this bill.");
        return null;
      }
    },
    [toast]
  );

  return { busyId, advance, cancel, setPayment, assignRider, runPrimary, printBill };
}
