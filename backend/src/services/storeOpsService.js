/**
 * Store operations: the switches the owner flips from the admin desk (pause orders, opening hours, minimum order,
 * which payment methods are on) and the single check `createOrder` runs before it accepts an order.
 *
 * Every default keeps the behaviour the shop had before this existed: always open, no minimum, both payment methods on.
 */
const StoreSettings = require("../models/StoreSettings");

const DEFAULT_TIMEZONE = "Asia/Kolkata";
const DEFAULT_CLOSED_MESSAGE = "We are not taking orders right now. Please check back soon.";
const CACHE_MS = 5000;

let cache = { at: 0, doc: null };

function defaultHours() {
  return [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: "09:00", close: "21:00", closed: false }));
}

function isHHMM(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ""));
}

function toMinutes(hhmm) {
  const [h, m] = String(hhmm || "00:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Seven rows (Sunday..Saturday), filling anything missing or malformed with the default. */
function normalizeHours(rows) {
  const base = defaultHours();
  const list = Array.isArray(rows) ? rows : [];
  return base.map((fallback) => {
    const row = list.find((r) => Number(r?.day) === fallback.day);
    if (!row) return fallback;
    return {
      day: fallback.day,
      open: isHHMM(row.open) ? row.open : fallback.open,
      close: isHHMM(row.close) ? row.close : fallback.close,
      closed: Boolean(row.closed),
    };
  });
}

function validTimezone(tz) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Plain, fully-defaulted ops from a StoreSettings document (or nothing). */
function readOps(doc) {
  const raw = (doc && doc.ops && (typeof doc.ops.toObject === "function" ? doc.ops.toObject() : doc.ops)) || {};
  const timezone = validTimezone(raw.timezone) ? raw.timezone : DEFAULT_TIMEZONE;
  return {
    acceptingOrders: raw.acceptingOrders !== false,
    closedMessage: String(raw.closedMessage || "").trim(),
    reopenAt: raw.reopenAt ? new Date(raw.reopenAt) : null,
    autoSchedule: Boolean(raw.autoSchedule),
    timezone,
    hours: normalizeHours(raw.hours),
    minOrderAmount: Math.max(0, Number(raw.minOrderAmount) || 0),
    codEnabled: raw.codEnabled !== false,
    onlinePaymentsEnabled: raw.onlinePaymentsEnabled !== false,
    maxCodAmount: Math.max(0, Number(raw.maxCodAmount) || 0),
  };
}

function readContact(doc) {
  const raw = (doc && doc.contact && (typeof doc.contact.toObject === "function" ? doc.contact.toObject() : doc.contact)) || {};
  return {
    supportEmail: String(raw.supportEmail || ""),
    supportPhone: String(raw.supportPhone || ""),
    whatsapp: String(raw.whatsapp || ""),
    address: String(raw.address || ""),
  };
}

function readBusiness(doc) {
  const raw = (doc && doc.business && (typeof doc.business.toObject === "function" ? doc.business.toObject() : doc.business)) || {};
  return {
    legalName: String(raw.legalName || ""),
    gstin: String(raw.gstin || ""),
    defaultTaxPercent: Math.max(0, Number(raw.defaultTaxPercent) || 0),
    invoiceFooter: String(raw.invoiceFooter || ""),
  };
}

/** Day of week (0 = Sunday), minutes since midnight and the calendar date, as a clock in `timeZone` shows them. */
function localParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    day: days.indexOf(get("weekday")),
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

/** Offset of `timeZone` from UTC at `date`, in minutes (+330 for India). */
function tzOffsetMinutes(date, timeZone) {
  const label =
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
      .formatToParts(date)
      .find((p) => p.type === "timeZoneName")?.value || "GMT";
  const m = /GMT([+-])(\d{1,2})(?::?(\d{2}))?/.exec(label);
  if (!m) return 0;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * (Number(m[2]) * 60 + Number(m[3] || 0));
}

/** The instant a wall-clock time (date key + HH:MM) happens in `timeZone`. */
function zonedInstant(dateKey, hhmm, timeZone) {
  const [y, mo, d] = dateKey.split("-").map(Number);
  const [h, mi] = String(hhmm).split(":").map(Number);
  const naiveUtc = Date.UTC(y, mo - 1, d, h, mi);
  const guess = new Date(naiveUtc - tzOffsetMinutes(new Date(naiveUtc), timeZone) * 60000);
  // One more pass settles the offset if the guess crossed a daylight-saving change.
  return new Date(naiveUtc - tzOffsetMinutes(guess, timeZone) * 60000);
}

/** The next moment the weekly hours say the shop opens, looking up to a week ahead. */
function nextOpening(ops, now) {
  const { day, minutes } = localParts(now, ops.timezone);
  for (let ahead = 0; ahead < 8; ahead += 1) {
    const row = ops.hours.find((h) => h.day === (day + ahead) % 7);
    if (!row || row.closed) continue;
    if (ahead === 0 && minutes >= toMinutes(row.open)) continue;
    const probe = new Date(now.getTime() + ahead * 24 * 3600 * 1000);
    return zonedInstant(localParts(probe, ops.timezone).dateKey, row.open, ops.timezone);
  }
  return null;
}

function describeOpening(date, ops, now) {
  if (!date) return "";
  const opts = { timeZone: ops.timezone };
  const sameDay = localParts(date, ops.timezone).dateKey === localParts(now, ops.timezone).dateKey;
  const time = new Intl.DateTimeFormat("en-IN", { ...opts, hour: "numeric", minute: "2-digit", hour12: true }).format(date);
  if (sameDay) return `We open today at ${time}.`;
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
  if (localParts(date, ops.timezone).dateKey === localParts(tomorrow, ops.timezone).dateKey) return `We open tomorrow at ${time}.`;
  const weekday = new Intl.DateTimeFormat("en-IN", { ...opts, weekday: "long" }).format(date);
  return `We open ${weekday} at ${time}.`;
}

/** Is the shop taking orders right now, and if not why and until when. */
function evaluateOpen(ops, now = new Date()) {
  const base = ops.closedMessage || DEFAULT_CLOSED_MESSAGE;

  if (!ops.acceptingOrders) {
    const reopenAt = ops.reopenAt && !Number.isNaN(ops.reopenAt.getTime()) ? ops.reopenAt : null;
    if (!(reopenAt && reopenAt <= now)) {
      const tail = reopenAt
        ? ` Orders reopen ${new Intl.DateTimeFormat("en-IN", { timeZone: ops.timezone, weekday: "short", hour: "numeric", minute: "2-digit", hour12: true }).format(reopenAt)}.`
        : "";
      return { open: false, reason: "paused", message: `${base}${tail}`.trim(), nextOpenAt: reopenAt };
    }
  }

  if (ops.autoSchedule) {
    const { day, minutes } = localParts(now, ops.timezone);
    const row = ops.hours.find((h) => h.day === day);
    const inside = row && !row.closed && minutes >= toMinutes(row.open) && minutes < toMinutes(row.close);
    if (!inside) {
      const next = nextOpening(ops, now);
      return { open: false, reason: "hours", message: `${base} ${describeOpening(next, ops, now)}`.trim(), nextOpenAt: next };
    }
  }

  return { open: true, reason: null, message: "", nextOpenAt: null };
}

/** If a pause had a reopen time and that time has passed, turn accepting back on. */
async function maybeLiftPause(doc) {
  const ops = readOps(doc);
  if (ops.acceptingOrders) return;
  if (!ops.reopenAt || ops.reopenAt.getTime() > Date.now()) return;
  doc.set("ops.acceptingOrders", true);
  doc.set("ops.reopenAt", null);
  await doc.save();
}

async function getSettingsDoc({ fresh = false } = {}) {
  const cached = !fresh && cache.doc && Date.now() - cache.at < CACHE_MS ? cache.doc : null;
  const doc = cached || (await StoreSettings.get());
  await maybeLiftPause(doc);
  cache = { at: Date.now(), doc };
  return doc;
}

function invalidateStoreOpsCache() {
  cache = { at: 0, doc: null };
}

async function getStoreOps(options) {
  return readOps(await getSettingsDoc(options));
}

const isOnline = (method) => method === "Razorpay" || method === "YouPI";

/**
 * The one check an incoming order must pass. Returns null when the order may go ahead, otherwise
 * `{ status, code, message }` ready to send to the customer.
 */
async function assertCanOrder({ itemsTotal = 0, paymentMethod = "Cash on Delivery" } = {}) {
  const ops = await getStoreOps();
  const state = evaluateOpen(ops);
  if (!state.open) return { status: 400, code: "STORE_CLOSED", message: state.message };

  const online = isOnline(paymentMethod);
  if (online && !ops.onlinePaymentsEnabled) {
    return { status: 400, code: "PAYMENT_METHOD_OFF", message: "Online payment is switched off right now. Please choose Cash on Delivery." };
  }
  if (!online && !ops.codEnabled) {
    return { status: 400, code: "PAYMENT_METHOD_OFF", message: "Cash on Delivery is not available right now. Please pay online." };
  }
  if (!online && ops.maxCodAmount > 0 && itemsTotal > ops.maxCodAmount) {
    return {
      status: 400,
      code: "COD_LIMIT",
      message: `Cash on Delivery is available up to ₹${ops.maxCodAmount}. Please pay online for a larger order.`,
    };
  }
  if (ops.minOrderAmount > 0 && itemsTotal < ops.minOrderAmount) {
    const gap = Math.ceil(ops.minOrderAmount - itemsTotal);
    return {
      status: 400,
      code: "MIN_ORDER",
      message: `The minimum order is ₹${ops.minOrderAmount}. Add ₹${gap} more to place this order.`,
    };
  }
  return null;
}

/** What the customer apps may know: open or not, the rules that shape a cart, how to reach the shop. */
async function getPublicStoreInfo() {
  const doc = await getSettingsDoc({ fresh: true });
  const ops = readOps(doc);
  const state = evaluateOpen(ops);
  const contact = readContact(doc);
  return {
    open: state.open,
    reason: state.reason,
    message: state.message,
    nextOpenAt: state.nextOpenAt ? state.nextOpenAt.toISOString() : null,
    minOrderAmount: ops.minOrderAmount,
    codEnabled: ops.codEnabled,
    onlinePaymentsEnabled: ops.onlinePaymentsEnabled,
    maxCodAmount: ops.maxCodAmount,
    autoSchedule: ops.autoSchedule,
    timezone: ops.timezone,
    hours: ops.hours,
    support: { email: contact.supportEmail, phone: contact.supportPhone, whatsapp: contact.whatsapp },
    address: contact.address,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates and applies an admin edit onto a StoreSettings document. Only the sections present in `body` change.
 * Returns an error message (and changes nothing past it) or null on success.
 */
function applyStoreOpsPatch(doc, body = {}) {
  const next = { ops: readOps(doc), contact: readContact(doc), business: readBusiness(doc) };

  if (body.ops && typeof body.ops === "object") {
    const o = body.ops;
    const ops = { ...next.ops };
    if (o.acceptingOrders !== undefined) {
      ops.acceptingOrders = Boolean(o.acceptingOrders);
      if (ops.acceptingOrders) ops.reopenAt = null;
    }
    if (o.closedMessage !== undefined) {
      const message = String(o.closedMessage || "").trim();
      if (message.length > 200) return "The closed message can be at most 200 characters.";
      ops.closedMessage = message;
    }
    if (o.reopenAt !== undefined) {
      if (o.reopenAt === null || o.reopenAt === "") ops.reopenAt = null;
      else {
        const when = new Date(o.reopenAt);
        if (Number.isNaN(when.getTime())) return "Reopen time is not a valid date.";
        ops.reopenAt = when;
      }
    }
    if (o.autoSchedule !== undefined) ops.autoSchedule = Boolean(o.autoSchedule);
    if (o.timezone !== undefined) {
      if (!validTimezone(String(o.timezone))) return "That time zone is not recognised.";
      ops.timezone = String(o.timezone);
    }
    if (o.hours !== undefined) {
      if (!Array.isArray(o.hours)) return "Opening hours must be a list of days.";
      for (const row of o.hours) {
        if (row?.closed) continue;
        if (!isHHMM(row?.open) || !isHHMM(row?.close)) return "A time must look like 09:00.";
        if (toMinutes(row.close) <= toMinutes(row.open)) return "Close must be after open.";
      }
      ops.hours = normalizeHours(o.hours);
    }
    if (o.minOrderAmount !== undefined) {
      const n = Number(o.minOrderAmount);
      if (!Number.isFinite(n) || n < 0 || n > 100000) return "Minimum order must be between 0 and 100000.";
      ops.minOrderAmount = Math.round(n);
    }
    if (o.maxCodAmount !== undefined) {
      const n = Number(o.maxCodAmount);
      if (!Number.isFinite(n) || n < 0 || n > 1000000) return "The cash on delivery limit must be between 0 and 1000000.";
      ops.maxCodAmount = Math.round(n);
    }
    if (o.codEnabled !== undefined) ops.codEnabled = Boolean(o.codEnabled);
    if (o.onlinePaymentsEnabled !== undefined) ops.onlinePaymentsEnabled = Boolean(o.onlinePaymentsEnabled);
    if (!ops.codEnabled && !ops.onlinePaymentsEnabled) return "Keep at least one payment method on, or nobody can check out.";
    next.ops = ops;
  }

  if (body.contact && typeof body.contact === "object") {
    const c = body.contact;
    const contact = { ...next.contact };
    for (const key of ["supportEmail", "supportPhone", "whatsapp", "address"]) {
      if (c[key] !== undefined) contact[key] = String(c[key] || "").trim();
    }
    if (contact.supportEmail && !EMAIL_RE.test(contact.supportEmail)) return "That email doesn't look right.";
    if (contact.supportEmail.length > 120 || contact.address.length > 240) return "A contact field is too long.";
    if (contact.supportPhone.length > 30 || contact.whatsapp.length > 30) return "A phone number is too long.";
    next.contact = contact;
  }

  if (body.business && typeof body.business === "object") {
    const b = body.business;
    const business = { ...next.business };
    if (b.legalName !== undefined) business.legalName = String(b.legalName || "").trim().slice(0, 120);
    if (b.gstin !== undefined) {
      const gstin = String(b.gstin || "").trim().toUpperCase();
      if (gstin && !/^[0-9A-Z]{15}$/.test(gstin)) return "GSTIN is 15 letters and digits.";
      business.gstin = gstin;
    }
    if (b.defaultTaxPercent !== undefined) {
      const n = Number(b.defaultTaxPercent);
      if (!Number.isFinite(n) || n < 0 || n > 28) return "Enter a rate between 0 and 28.";
      business.defaultTaxPercent = n;
    }
    if (b.invoiceFooter !== undefined) business.invoiceFooter = String(b.invoiceFooter || "").trim().slice(0, 300);
    next.business = business;
  }

  doc.ops = next.ops;
  doc.contact = next.contact;
  doc.business = next.business;
  invalidateStoreOpsCache();
  return null;
}

module.exports = {
  DEFAULT_CLOSED_MESSAGE,
  readOps,
  readContact,
  readBusiness,
  evaluateOpen,
  getStoreOps,
  assertCanOrder,
  getPublicStoreInfo,
  applyStoreOpsPatch,
  invalidateStoreOpsCache,
  localParts,
  zonedInstant,
};
