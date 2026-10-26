/**
 * The shop's rules as the bag and checkout see them — pure functions, no React.
 *
 * `GET /store-info` says whether orders are being taken, the minimum order, which payment methods are on and the
 * cash-on-delivery limit; the API enforces the same rules in `createOrder` (codes `STORE_CLOSED`, `MIN_ORDER`,
 * `PAYMENT_METHOD_OFF`, `COD_LIMIT`). Everything here fails open: with no data, or a shop with no rules set, nothing is
 * blocked and the screens look exactly as they did before — the server stays the last word.
 */
import { STORE_RULES } from "../content/storefrontContent";
import { formatINRWhole } from "./currency";

/** `paymentMethod` values the API understands (they must match `Order.paymentMethod`). */
export const PAY_ONLINE = "Razorpay";
export const PAY_COD = "Cash on Delivery";

/** `code` values `createOrder` answers with when the shop's rules refuse an order. */
export const STORE_RULE_CODES = ["STORE_CLOSED", "MIN_ORDER", "PAYMENT_METHOD_OFF", "COD_LIMIT"];

export const isStoreRuleError = (err) => STORE_RULE_CODES.includes(err?.code);

const positive = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** Plain, fully-defaulted values from a `GET /store-info` body (`null` when there is no usable body). */
export function normalizeStoreInfo(raw) {
  if (!raw || typeof raw !== "object") return null;
  const nextOpenAt = raw.nextOpenAt ? Date.parse(raw.nextOpenAt) : NaN;
  const support = raw.support && typeof raw.support === "object" ? raw.support : {};
  const text = (value) => String(value || "").trim();
  return {
    /** How to reach the shop, as the admin set it in Settings (each may be empty). */
    support: { email: text(support.email), phone: text(support.phone), whatsapp: text(support.whatsapp) },
    open: raw.open !== false,
    reason: raw.reason === "paused" || raw.reason === "hours" ? raw.reason : null,
    message: String(raw.message || "").trim(),
    nextOpenAt: Number.isFinite(nextOpenAt) ? nextOpenAt : null,
    minOrderAmount: positive(raw.minOrderAmount),
    codEnabled: raw.codEnabled !== false,
    onlinePaymentsEnabled: raw.onlinePaymentsEnabled !== false,
    maxCodAmount: positive(raw.maxCodAmount),
  };
}

/** "35 min", "3 h 20 min", "2 days" — how long until the shop reopens. */
function formatWait(ms) {
  const minutes = Math.max(1, Math.ceil(ms / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const rest = minutes % 60;
    return rest ? `${hours} h ${rest} min` : `${hours} h`;
  }
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day" : `${days} days`;
}

/**
 * What the shop's rules mean for a bag worth `itemsTotal` (the items only — the same figure the API checks).
 *
 *  - `closed`     `null` while orders are being taken, else `{ reason, title, message, reopensIn }`.
 *  - `shortBy`    whole rupees still missing from the minimum order (0 when met or none set); `minNote` says it.
 *  - `pay`        per payment method `{ available, note }` — `note` explains why it is off (switched off, cash limit).
 *  - `blockedBy`  `"closed" | "min" | "pay" | null` — why Place order must stay disabled; `dockNote` is its short form.
 */
export function getStoreRules(info, itemsTotal = 0, now = Date.now()) {
  const total = Number(itemsTotal) || 0;
  const minOrder = info ? info.minOrderAmount : 0;
  const maxCod = info ? info.maxCodAmount : 0;

  const closed =
    info && !info.open
      ? {
          reason: info.reason,
          title: info.reason === "paused" ? STORE_RULES.closed.paused : STORE_RULES.closed.hours,
          message: info.message || STORE_RULES.closed.fallback,
          reopensIn:
            info.nextOpenAt && info.nextOpenAt > now
              ? STORE_RULES.closed.reopensIn(formatWait(info.nextOpenAt - now))
              : "",
        }
      : null;

  const shortBy = minOrder > 0 && total > 0 && total < minOrder ? Math.ceil(minOrder - total) : 0;
  const shortText = shortBy > 0 ? formatINRWhole(shortBy) : "";

  const onlineOff = Boolean(info) && !info.onlinePaymentsEnabled;
  const codOff = Boolean(info) && !info.codEnabled;
  const codOver = maxCod > 0 && total > maxCod;
  const pay = {
    [PAY_ONLINE]: { available: !onlineOff, note: onlineOff ? STORE_RULES.pay.off : "" },
    [PAY_COD]: {
      available: !codOff && !codOver,
      note: codOff ? STORE_RULES.pay.off : codOver ? STORE_RULES.pay.codLimit(formatINRWhole(maxCod)) : "",
    },
  };
  const noPayment = !pay[PAY_ONLINE].available && !pay[PAY_COD].available;

  const blockedBy = closed ? "closed" : shortBy > 0 ? "min" : noPayment ? "pay" : null;
  const dockNote =
    blockedBy === "closed"
      ? STORE_RULES.dock.closed
      : blockedBy === "min"
        ? STORE_RULES.dock.min(shortText)
        : blockedBy === "pay"
          ? STORE_RULES.dock.pay
          : "";

  return {
    known: Boolean(info),
    closed,
    minOrder,
    shortBy,
    minNote: shortBy > 0 ? STORE_RULES.min.more(shortText) : "",
    maxCod,
    pay,
    noPayment,
    blockedBy,
    dockNote,
  };
}

/** The shopper's pick when the shop still takes it, otherwise the first method that works (so a switch-off never strands them). */
export function pickPaymentMethod(preferred, rules) {
  if (rules.pay[preferred]?.available) return preferred;
  return [PAY_ONLINE, PAY_COD].find((id) => rules.pay[id].available) || preferred;
}

/**
 * Friendly text for an order the server refused. `rules` should come from a fresh `/store-info` so the figures agree
 * with the server; anything it can't explain falls back to the server's own message.
 */
export function friendlyOrderError(err, { rules, paymentMethod } = {}) {
  const server = String(err?.message || "").trim();
  const copy = STORE_RULES.errors;
  switch (err?.code) {
    case "STORE_CLOSED":
      return server || rules?.closed?.message || copy.closed;
    case "MIN_ORDER":
      return rules?.shortBy > 0 ? copy.min(formatINRWhole(rules.shortBy)) : server || copy.generic;
    case "PAYMENT_METHOD_OFF":
      return paymentMethod === PAY_COD ? copy.codOff : copy.onlineOff;
    case "COD_LIMIT":
      return rules?.maxCod > 0 ? copy.codLimit(formatINRWhole(rules.maxCod)) : server || copy.generic;
    default:
      return server || copy.generic;
  }
}
