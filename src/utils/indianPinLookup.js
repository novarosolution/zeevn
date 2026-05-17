/** India Post pincode → city/state (no API key). */
export async function lookupIndianPin(pin) {
  const clean = String(pin || "").trim();
  if (!/^\d{6}$/.test(clean)) return null;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`);
    const json = await res.json();
    const po = json?.[0]?.PostOffice?.[0];
    if (!po) return null;
    return { city: po.District || "", state: po.State || "", country: "India" };
  } catch {
    return null;
  }
}
