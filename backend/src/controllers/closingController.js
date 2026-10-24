const Product = require("../models/Product");
const StockClosing = require("../models/StockClosing");
const { localParts } = require("../services/storeOpsService");

const TZ = "Asia/Kolkata";

function fail(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
}

function actorName(user) {
  return String(user?.name || "Admin").trim().slice(0, 80);
}

function todayKey() {
  return localParts(new Date(), TZ).dateKey;
}

function comingSoon(p) {
  return p.comingSoon === true || p.comingSoon === "true";
}

function isDateKey(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function lineKind(line) {
  if (line.counted === null || line.counted === undefined || line.counted === "") return "uncounted";
  const v = Number(line.counted) - Number(line.expected || 0);
  if (v < 0) return "shortage";
  if (v > 0) return "surplus";
  return "match";
}

function presentLine(line) {
  const counted = line.counted === null || line.counted === undefined ? null : Math.max(0, Number(line.counted));
  const expected = Math.max(0, Number(line.expected) || 0);
  const kind = lineKind({ counted, expected });
  return {
    product: line.product,
    name: line.name || "Jar",
    sku: line.sku || "",
    unit: line.unit || "",
    expected,
    counted,
    note: line.note || "",
    variance: kind === "uncounted" ? null : counted - expected,
    kind,
  };
}

function tally(lines = []) {
  const counts = { shortage: 0, surplus: 0, match: 0, uncounted: 0 };
  for (const line of lines) {
    const kind = line.kind || lineKind(line);
    counts[kind] = (counts[kind] || 0) + 1;
  }
  return counts;
}

function present(doc) {
  const lines = (doc.lines || []).map(presentLine);
  return {
    _id: doc._id,
    date: doc.date,
    today: doc.date === todayKey(),
    status: doc.status,
    lines,
    counts: tally(lines),
    savedByName: doc.savedByName || "",
    submittedAt: doc.submittedAt || null,
    submittedByName: doc.submittedByName || "",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function presentList(doc) {
  const sheet = present(doc);
  return {
    _id: sheet._id,
    date: sheet.date,
    today: sheet.today,
    status: sheet.status,
    shortage: sheet.counts.shortage,
    surplus: sheet.counts.surplus,
    match: sheet.counts.match,
  };
}

async function snapshotLines() {
  const products = await Product.find({ isPublished: { $ne: false } })
    .select("name sku unit stockQty comingSoon")
    .lean();
  return products
    .filter((p) => !comingSoon(p))
    .map((p) => ({
      product: p._id,
      name: String(p.name || "Jar").trim(),
      sku: String(p.sku || "").trim(),
      unit: String(p.unit || "").trim(),
      expected: Math.max(0, Number(p.stockQty) || 0),
      counted: null,
      note: "",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function ensureToday(user) {
  const date = todayKey();
  const existing = await StockClosing.findOne({ date });
  if (existing) return existing;
  try {
    return await StockClosing.create({
      date,
      status: "draft",
      lines: await snapshotLines(),
      savedBy: user?._id || null,
      savedByName: actorName(user),
    });
  } catch (error) {
    if (error && error.code === 11000) return StockClosing.findOne({ date });
    throw error;
  }
}

function readCounted(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return null;
  return Math.max(0, n);
}

function applyLineEdits(doc, rawLines) {
  const incoming = Array.isArray(rawLines) ? rawLines : [];
  const byId = new Map();
  for (const row of incoming) {
    const id = String(row?.product?._id || row?.product || "");
    if (!id) continue;
    byId.set(id, row);
  }
  doc.lines = (doc.lines || []).map((line) => {
    const edit = byId.get(String(line.product));
    if (!edit) return line;
    if (edit.counted !== undefined) line.counted = readCounted(edit.counted);
    if (edit.note !== undefined) line.note = String(edit.note || "").trim().slice(0, 120);
    return line;
  });
}

async function listClosings(req, res, next) {
  try {
    const rows = await StockClosing.find().sort({ date: -1 }).lean();
    res.json({ today: todayKey(), items: rows.map(presentList) });
  } catch (error) {
    next(error);
  }
}

async function getToday(req, res, next) {
  try {
    const doc = await ensureToday(req.user);
    res.json(present(doc));
  } catch (error) {
    next(error);
  }
}

async function getClosing(req, res, next) {
  try {
    const date = String(req.params.date || "");
    if (!isDateKey(date)) return res.status(400).json({ message: "Invalid date." });
    if (date === todayKey()) {
      const doc = await ensureToday(req.user);
      return res.json(present(doc));
    }
    const doc = await StockClosing.findOne({ date }).lean();
    if (!doc) return res.status(404).json({ message: "No closing for that date." });
    res.json(present(doc));
  } catch (error) {
    next(error);
  }
}

async function saveDraft(req, res, next) {
  try {
    const date = String(req.params.date || "");
    if (!isDateKey(date)) return res.status(400).json({ message: "Invalid date." });
    const doc = date === todayKey() ? await ensureToday(req.user) : await StockClosing.findOne({ date });
    if (!doc) return res.status(404).json({ message: "No closing for that date." });
    if (doc.status !== "draft") fail("This count is locked.");
    applyLineEdits(doc, req.body?.lines);
    doc.savedBy = req.user?._id || null;
    doc.savedByName = actorName(req.user);
    await doc.save();
    res.json(present(doc));
  } catch (error) {
    next(error);
  }
}

async function submitClosing(req, res, next) {
  try {
    const date = String(req.params.date || "");
    if (!isDateKey(date)) return res.status(400).json({ message: "Invalid date." });
    const doc = await StockClosing.findOne({ date });
    if (!doc) return res.status(404).json({ message: "No closing for that date." });
    if (doc.status !== "draft") fail("This count is locked.");
    applyLineEdits(doc, req.body?.lines);
    const missing = (doc.lines || []).some((line) => line.counted === null || line.counted === undefined);
    if (missing) fail("Count every jar before you submit.");
    doc.status = "submitted";
    doc.submittedAt = new Date();
    doc.submittedByName = actorName(req.user);
    doc.savedBy = req.user?._id || null;
    doc.savedByName = actorName(req.user);
    await doc.save();
    res.json(present(doc));
  } catch (error) {
    next(error);
  }
}

async function reopenClosing(req, res, next) {
  try {
    const date = String(req.params.date || "");
    if (!isDateKey(date)) return res.status(400).json({ message: "Invalid date." });
    const doc = await StockClosing.findOne({ date });
    if (!doc) return res.status(404).json({ message: "No closing for that date." });
    doc.status = "draft";
    doc.submittedAt = null;
    doc.savedBy = req.user?._id || null;
    doc.savedByName = actorName(req.user);
    await doc.save();
    res.json(present(doc));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listClosings,
  getToday,
  getClosing,
  saveDraft,
  submitClosing,
  reopenClosing,
};
