export function formatINR(amount) {
  const numeric = Number(amount || 0);
  if (Number.isNaN(numeric)) {
    return "₹0.00";
  }

  return `₹${numeric.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Whole rupees, typical for grocery price tiles (e.g. ₹31). */
export function formatINRWhole(amount) {
  const numeric = Math.round(Number(amount || 0));
  if (Number.isNaN(numeric)) {
    return "₹0";
  }
  return `₹${numeric.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
