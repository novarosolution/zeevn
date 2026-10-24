/** Small formatting helpers shared by the admin desk screens. */

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "just now", "5 min ago", "3 h ago", "2 d ago", then a short date. */
export function timeAgo(value, now = Date.now()) {
  const when = value ? new Date(value).getTime() : NaN;
  if (!Number.isFinite(when)) return "";
  const diff = Math.max(0, now - when);
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.round(diff / MINUTE)} min ago`;
  if (diff < DAY) return `${Math.round(diff / HOUR)} h ago`;
  if (diff < 7 * DAY) return `${Math.round(diff / DAY)} d ago`;
  return formatShortDate(value);
}

export function formatShortDate(value) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function formatShortDateTime(value) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${date}, ${time}`;
}

export function formatClock(value) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

/** "2 min", "1 h 5 min" — a length of time in whole minutes. */
export function formatMinutes(total) {
  const n = Math.round(Number(total));
  if (!Number.isFinite(n) || n < 0) return "";
  if (n < 60) return `${n} min`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function plural(count, one, many = `${one}s`) {
  return `${count} ${Number(count) === 1 ? one : many}`;
}

/** Indian digit grouping without decimals: 1,23,456. */
export function formatWhole(value) {
  const n = Math.round(Number(value) || 0);
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function formatRupees(value) {
  return `₹${formatWhole(value)}`;
}

/** First letters of the first two words, for avatars. */
export function initialsOf(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** Digits only, with a leading country code when it is a plain 10-digit Indian number. */
export function phoneDigits(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export const telHref = (phone) => (String(phone || "").replace(/[^\d+]/g, "") ? `tel:${String(phone).replace(/[^\d+]/g, "")}` : "");
export const whatsappHref = (phone, text = "") => {
  const digits = phoneDigits(phone);
  if (digits.length < 10) return "";
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
};
export function mapsHref(address) {
  const lat = Number(address?.latitude);
  const lng = Number(address?.longitude);
  if (address?.latitude != null && address?.longitude != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }
  const text = [address?.houseNumber, address?.line1, address?.city, address?.postalCode].filter(Boolean).join(", ");
  return text ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}` : "";
}

/** Opens a link in a new tab on web; no-op elsewhere (admin is a web desk). */
export function openExternal(url) {
  if (!url) return;
  if (typeof window !== "undefined" && typeof window.open === "function") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/** Copies text to the clipboard on web. Resolves false when the browser refuses. */
export async function copyText(text) {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(String(text));
      return true;
    }
  } catch {
    // fall through
  }
  return false;
}
