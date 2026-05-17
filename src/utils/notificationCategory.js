/**
 * Client-side notification grouping (API has no category field).
 * @returns {"orders"|"offers"|"account"}
 */
export function getNotificationCategory(notification) {
  const blob = `${notification?.title || ""} ${notification?.message || ""}`.toLowerCase();
  if (/order|delivery|shipped|dispatch|packed|arriv|track|fulfil|refund/.test(blob)) {
    return "orders";
  }
  if (/offer|promo|discount|coupon|sale|deal|reward|points|save\s+\d/.test(blob)) {
    return "offers";
  }
  return "account";
}

export function getNotificationIcon(category) {
  if (category === "orders") return "receipt-outline";
  if (category === "offers") return "pricetag-outline";
  if (category === "account") return "person-outline";
  return "notifications-outline";
}
