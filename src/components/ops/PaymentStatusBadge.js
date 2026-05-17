import React from "react";
import Badge from "../ui/Badge";
import { paymentStatusToBadgeVariant } from "../../utils/opsStatusBadge";

function paymentLabel(status) {
  const ps = String(status || "pending").toLowerCase();
  if (ps === "paid" || ps === "captured") return "Paid";
  if (ps === "pending") return "Payment pending";
  if (ps === "failed") return "Payment failed";
  if (ps === "refunded") return "Refunded";
  return String(status || "—");
}

export default function PaymentStatusBadge({ paymentStatus, size = "sm" }) {
  return (
    <Badge variant={paymentStatusToBadgeVariant(paymentStatus)} size={size}>
      {paymentLabel(paymentStatus)}
    </Badge>
  );
}
