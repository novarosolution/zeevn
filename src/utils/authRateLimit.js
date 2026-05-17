/** @param {number} ms */
export function formatRetryCountdown(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m <= 0) return `${s}s`;
  return `${m}m ${s}s`;
}

/**
 * Parse Retry-After header or body field (seconds).
 * @param {Response} response
 * @param {object} data
 */
export function parseRetryAfterMs(response, data) {
  const header = response?.headers?.get?.("Retry-After");
  if (header) {
    const asNum = Number(header);
    if (Number.isFinite(asNum) && asNum >= 0) return asNum * 1000;
    const asDate = Date.parse(header);
    if (Number.isFinite(asDate)) return Math.max(0, asDate - Date.now());
  }
  const bodySec = Number(data?.retryAfterSeconds ?? data?.retryAfter);
  if (Number.isFinite(bodySec) && bodySec >= 0) return bodySec * 1000;
  return 120 * 1000;
}
