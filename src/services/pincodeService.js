import { getApiBaseUrl } from "./apiBase";

function apiUrl(path) {
  return `${getApiBaseUrl()}${path}`;
}

function formatDeliveryDate(date) {
  try {
    return date.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

/**
 * Check whether a 6-digit pincode is serviceable.
 * Calls `GET /delivery/pincode/:pin`.
 *
 * @param {string} pincode
 * @returns {Promise<{
 *   serviceable: boolean;
 *   deliversByLabel?: string;
 *   dispatchNoteKey?: string;
 *   dispatchHours?: number;
 *   dispatchMinutes?: number;
 *   messageKey?: string;
 *   errorKey?: string;
 * }>}
 */
export async function checkPincodeServiceability(pincode) {
  const digits = String(pincode || "").replace(/\D/g, "");
  if (digits.length !== 6) {
    return { serviceable: false, errorKey: "invalid" };
  }

  const response = await fetch(apiUrl(`/delivery/pincode/${digits}`));
  const data = await response.json().catch(() => ({}));
  if (response.ok && data && typeof data.serviceable === "boolean") {
    if (!data.serviceable) {
      return { serviceable: false, messageKey: data.messageKey || "notServiceable" };
    }
    return {
      serviceable: true,
      deliversByLabel: data.deliversBy || data.deliversByLabel || formatDeliveryDate(new Date(data.deliversAt || Date.now())),
      dispatchNoteKey: data.dispatchNoteKey || "dispatchWindow",
      dispatchHours: data.dispatchHours ?? 4,
      dispatchMinutes: data.dispatchMinutes ?? 12,
    };
  }
  return { serviceable: false, errorKey: "unavailable" };
}
