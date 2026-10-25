const Product = require("../models/Product");
const StockClosing = require("../models/StockClosing");
const { localParts } = require("../services/storeOpsService");
const { qtyOf, recordStockChange } = require("../utils/stockHistory");

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
  const countedOnline =
    line.countedOnline === null || line.countedOnline === undefined
      ? line.counted === null || line.counted === undefined
        ? null
        : Math.max(0, Number(line.counted))
      : Math.max(0, Number(line.countedOnline));
  const countedCounter =
    line.countedCounter === null || line.countedCounter === undefined ? null : Math.max(0, Number(line.countedCounter));
  const expectedOnline = Math.max(0, Number(line.expectedOnline ?? line.expected) || 0);
  const expectedCounter = Math.max(0, Number(line.expectedCounter) || 0);
  const expected = expectedOnline + expectedCounter;
  const counted =
    countedOnline === null && countedCounter === null
      ? null
      : (countedOnline || 0) + (countedCounter || 0);
  const kind = lineKind({
    counted: countedOnline === null && countedCounter === null ? null : counted,
    expected,
  });
  return {
    product: line.product,
    name: line.name || "Jar",
    sku: line.sku || "",
    unit: line.unit || "",
    expected,
    expectedOnline,
    expectedCounter,
    counted,
    countedOnline,
    countedCounter,
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
    cashCounted: doc.cashCounted == null ? null : Number(doc.cashCounted),
    cashNote: doc.cashNote || "",
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
    .select("name sku unit stockQty stockCounter comingSoon")
    .lean();
  return products
    .filter((p) => !comingSoon(p))
    .map((p) => {
      const expectedOnline = Math.max(0, Number(p.stockQty) || 0);
      const expectedCounter = Math.max(0, Number(p.stockCounter) || 0);
      return {
        product: p._id,
        name: String(p.name || "Jar").trim(),
        sku: String(p.sku || "").trim(),
        unit: String(p.unit || "").trim(),
        expected: expectedOnline + expectedCounter,
        expectedOnline,
        expectedCounter,
        counted: null,
        countedOnline: null,
        countedCounter: null,
        note: "",
      };
    })
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
    if (edit.countedOnline !== undefined) line.countedOnline = readCounted(edit.countedOnline);
    if (edit.countedCounter !== undefined) line.countedCounter = readCounted(edit.countedCounter);
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
    if (req.body?.cashCounted !== undefined) {
      const n = Number(req.body.cashCounted);
      doc.cashCounted = Number.isFinite(n) ? Math.max(0, n) : null;
    }
    if (req.body?.cashNote !== undefined) doc.cashNote = String(req.body.cashNote || "").trim().slice(0, 160);
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
    const missing = (doc.lines || []).some((line) => {
      const onlineMissing = line.countedOnline === null || line.countedOnline === undefined;
      const counterMissing = line.countedCounter === null || line.countedCounter === undefined;
      const legacyMissing = line.counted === null || line.counted === undefined;
      return onlineMissing && counterMissing && legacyMissing;
    });
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

async function applyVariance(req, res, next) {
  try {
    const date = String(req.params.date || "");
    if (!isDateKey(date)) return res.status(400).json({ message: "Invalid date." });
    const doc = await StockClosing.findOne({ date });
    if (!doc) return res.status(404).json({ message: "No closing for that date." });
    if (doc.status !== "submitted") fail("Submit the count before you apply it.");

    let changed = 0;
    for (const line of doc.lines || []) {
      const product = await Product.findById(line.product);
      if (!product) continue;
      const nextOnline =
        line.countedOnline === null || line.countedOnline === undefined
          ? line.counted === null || line.counted === undefined
            ? null
            : readCounted(line.counted)
          : readCounted(line.countedOnline);
      const nextCounter = line.countedCounter === null || line.countedCounter === undefined ? null : readCounted(line.countedCounter);
      if (nextOnline !== null && qtyOf(product.stockQty) !== nextOnline) {
        const before = qtyOf(product.stockQty);
        product.stockQty = nextOnline;
        if (nextOnline <= 0) product.inStock = false;
        await product.save();
        await recordStockChange({
          product,
          before,
          after: nextOnline,
          why: "manual",
          location: "online",
          who: actorName(req.user),
          receiptNote: `Closing ${date}`,
        });
        changed += 1;
      }
      if (nextCounter !== null && qtyOf(product.stockCounter) !== nextCounter) {
        const before = qtyOf(product.stockCounter);
        product.stockCounter = nextCounter;
        await product.save();
        await recordStockChange({
          product,
          before,
          after: nextCounter,
          why: "manual",
          location: "counter",
          who: actorName(req.user),
          receiptNote: `Closing ${date}`,
        });
        changed += 1;
      }
    }
    res.json({ ...present(doc), applied: changed });
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
  applyVariance,
};
