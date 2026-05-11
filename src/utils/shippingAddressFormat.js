/**
 * One-line summary for order cards when live map is not shown (street-first).
 * @param {Record<string, unknown> | null | undefined} addr
 * @returns {string}
 */
export function formatCompactShippingLine(addr) {
  if (!addr || typeof addr !== "object") return "";
  const line1 = String(addr.line1 || "").trim();
  const cityState = [addr.city, addr.state].filter((x) => String(x || "").trim()).join(", ");
  const parts = [line1, cityState].filter(Boolean);
  if (parts.length) return parts.join(" · ");
  return cityState;
}
