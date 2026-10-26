/**
 * A real map coordinate, or `null`.
 *
 * A missing value has to stay missing: `Number(null)` is 0, and 0 is a perfectly "finite" number, so a plain
 * `Number.isFinite(Number(x))` check turns "no location" into a point in the Gulf of Guinea (zoomed-out maps, navigation
 * to the middle of the ocean). Values this close to 0,0 are junk GPS fixes and are dropped too.
 */
export function realCoord(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && Math.abs(n) > 0.2 ? n : null;
}

/** True when both halves of a lat/lng pair are real. */
export function hasRealPoint(latitude, longitude) {
  return realCoord(latitude) !== null && realCoord(longitude) !== null;
}
