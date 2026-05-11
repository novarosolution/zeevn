import { ORDER_LIVE_TRACKING } from "../content/appContent";

/**
 * Human-readable “Updated …” line for live location (relative near-term, clock otherwise).
 * @param {string|null|undefined} iso
 * @param {typeof ORDER_LIVE_TRACKING} [labels]
 */
export function formatLiveLocationUpdatedLine(iso, labels = ORDER_LIVE_TRACKING) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const diffSec = Math.floor((Date.now() - t) / 1000);
  if (diffSec < 90) return labels.updatedJustNow;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 120) {
    return labels.updatedMinutesAgo.replace("{minutes}", String(Math.max(1, diffMin)));
  }
  const clock = new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${labels.updatedAtPrefix}${clock}`;
}
