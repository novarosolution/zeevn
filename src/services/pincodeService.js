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

function mockServiceability(digits) {
  const last = Number(digits.slice(-1));
  if (last === 0) {
    return {
      serviceable: false,
      messageKey: "notServiceable",
    };
  }
  const delivers = new Date();
  delivers.setDate(delivers.getDate() + (last % 4) + 2);
  return {
    serviceable: true,
    deliversByLabel: formatDeliveryDate(delivers),
    dispatchNoteKey: "dispatchWindow",
    dispatchHours: 4,
    dispatchMinutes: 12,
  };
}

/**
 * Check whether a 6-digit pincode is serviceable.
 * Wire to `GET /delivery/pincode/:pin` when the backend route exists.
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

  try {
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
  } catch {
    /* fall through to mock */
  }

  return mockServiceability(digits);
}
