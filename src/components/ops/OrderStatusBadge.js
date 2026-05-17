import React from "react";
import Badge from "../ui/Badge";
import { getOrderStatusLabel } from "../../utils/orderStatus";
import { orderStatusToBadgeVariant } from "../../utils/opsStatusBadge";

export default function OrderStatusBadge({ status, context = "admin", size = "sm" }) {
  return (
    <Badge variant={orderStatusToBadgeVariant(status, { context })} size={size}>
      {getOrderStatusLabel(status)}
    </Badge>
  );
}
