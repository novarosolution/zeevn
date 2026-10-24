const NEAR_LEAD = /^(nearer|nearby|near|nr\.?|opp\.?|opposite|behind|beside|next to)\b/i;
const PLACE_HINT = /mall|plaza|circle|chowk|chok|cross|temple|school|hospital|market|society|township/i;

/** “nearer Alpha Mall” → “Near Alpha Mall”. */
export function tidyLandmark(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^nearer\b/i.test(text)) return text.replace(/^nearer\b/i, "Near");
  if (/^nearby\b/i.test(text)) return text.replace(/^nearby\b/i, "Near");
  if (NEAR_LEAD.test(text)) return text;
  return `Near ${text}`;
}

function partsFromBits(bits, city, postal, house, landmark) {
  const streetBit = bits[0] || "";
  let extraLandmark = "";
  let extraCity = "";
  bits.slice(1).forEach((bit) => {
    if (NEAR_LEAD.test(bit) || PLACE_HINT.test(bit)) extraLandmark = extraLandmark || bit;
    else if (!city && !extraCity) extraCity = bit;
    else if (!extraLandmark) extraLandmark = bit;
  });
  const street = [house, streetBit].filter(Boolean).join(", ");
  const place = [city || extraCity, postal].filter(Boolean).join(" ");
  const detail = [tidyLandmark(landmark || extraLandmark), place].filter(Boolean).join(" · ");
  return { street, detail };
}

/**
 * Street + place for the Home location card. GPS often dumps
 * “Sargasan Road, nearer Alpha Mall, Gandhinagar” into one field — this splits it.
 */
export function formatDeliveryLocationParts(address, fallbackLabel = "") {
  const fallback = String(fallbackLabel || "").trim();
  const empty = {
    street: fallback || "Set delivery location",
    detail: "",
    empty: !fallback || fallback === "Set delivery location",
  };

  if (address && typeof address === "object") {
    const house = String(address.houseNumber || "").trim();
    const rawLine = String(address.line1 || address.neighborhood || address.street || address.name || "").trim();
    const landmark = String(address.landmark || "").trim();
    const city = String(address.city || "").trim();
    const postal = String(address.postalCode || address.pincode || "").trim();
    const bits = rawLine.split(/\s*,\s*/).filter(Boolean);
    const { street, detail } = partsFromBits(bits, city, postal, house, landmark);
    if (street || detail) {
      return { street: street || detail, detail: street ? detail : "", empty: false };
    }
  }

  if (!fallback || fallback === "Set delivery location") return empty;
  const bits = fallback.split(/\s*,\s*/).filter(Boolean);
  if (bits.length < 2) return { street: fallback, detail: "", empty: false };
  const { street, detail } = partsFromBits(bits.slice(0, -1), bits[bits.length - 1], "", "", "");
  return { street: street || fallback, detail, empty: false };
}

/** Human-readable one-line label for header / checkout snippets. */
export function formatDeliveryLocationLabel(address) {
  if (!address || typeof address !== "object") return "";

  const parts = formatDeliveryLocationParts(address);
  if (parts.empty) return "";
  return [parts.street, parts.detail].filter(Boolean).join(", ");
}

export function formatSavedAddressLabel(defaultAddress) {
  if (!defaultAddress) return "";
  return formatDeliveryLocationLabel(defaultAddress)
    || [defaultAddress.city, defaultAddress.postalCode || defaultAddress.pincode].filter(Boolean).join(" ");
}
