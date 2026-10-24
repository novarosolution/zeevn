const mongoose = require("mongoose");
const Product = require("../models/Product");
const StockReceipt = require("../models/StockReceipt");
const { restoreStockForOrderLines } = require("../utils/stock");
const { recordAdminAction, productOpen } = require("../utils/adminLog");

const PAGE_SIZE = { min: 5, max: 100, fallback: 25 };
const isId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));

function fail(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
}

function actorName(user) {
  return String(user?.name || "Admin").trim().slice(0, 80);
}

function present(doc) {
  const lines = doc.lines || [];
  const totalJars = lines.reduce((sum, line) => sum + Math.max(0, Number(line.quantity) || 0), 0);
  return {
    _id: doc._id,
    note: doc.note || "",
    status: doc.status,
    lines,
    lineCount: lines.length,
    totalJars,
    savedByName: doc.savedByName || "",
    receivedAt: doc.receivedAt || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function sanitizeLines(raw) {
  const incoming = Array.isArray(raw) ? raw : [];
  const wanted = [];
  const seen = new Set();
  for (const row of incoming) {
    const productId = row?.product?._id || row?.product;
    if (!isId(productId)) continue;
    const key = String(productId);
    if (seen.has(key)) continue;
    const quantity = Math.round(Number(row.quantity));
    if (!Number.isFinite(quantity) || quantity < 1) continue;
    seen.add(key);
    wanted.push({ productId: key, quantity });
  }

  if (!wanted.length) return [];

  const products = await Product.find({ _id: { $in: wanted.map((row) => row.productId) } })
    .select("name sku unit")
    .lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  return wanted.map((row) => {
    const product = byId.get(row.productId);
    if (!product) fail("One of those products is gone.");
    return {
      product: product._id,
      name: String(product.name || "Jar").trim(),
      sku: String(product.sku || "").trim(),
      unit: String(product.unit || "").trim(),
      quantity: row.quantity,
    };
  });
}

function readNote(value, fallback = "") {
  return String(value ?? fallback).trim().slice(0, 200);
}

async function listReceipts(req, res, next) {
  try {
    const status = String(req.query.status || "");
    const filter = {};
    if (status === "draft" || status === "received") filter.status = status;

    const pageSize = Math.min(
      PAGE_SIZE.max,
      Math.max(PAGE_SIZE.min, Math.round(Number(req.query.pageSize)) || PAGE_SIZE.fallback)
    );
    const [total, draft, received] = await Promise.all([
      StockReceipt.countDocuments(filter),
      StockReceipt.countDocuments({ status: "draft" }),
      StockReceipt.countDocuments({ status: "received" }),
    ]);
    const pages = Math.max(1, Math.ceil(total / pageSize) || 1);
    const page = Math.min(pages, Math.max(1, Math.round(Number(req.query.page)) || 1));
    const rows = await StockReceipt.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    res.json({
      items: rows.map(present),
      total,
      page,
      pages,
      pageSize,
      counts: { draft, received },
    });
  } catch (error) {
    next(error);
  }
}

async function getReceipt(req, res, next) {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid receipt." });
    const doc = await StockReceipt.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: "Receipt not found." });
    res.json(present(doc));
  } catch (error) {
    next(error);
  }
}

async function createReceipt(req, res, next) {
  try {
    const doc = await StockReceipt.create({
      note: readNote(req.body?.note),
      lines: await sanitizeLines(req.body?.lines),
      status: "draft",
      savedBy: req.user?._id || null,
      savedByName: actorName(req.user),
    });
    res.status(201).json(present(doc));
  } catch (error) {
    next(error);
  }
}

async function updateReceipt(req, res, next) {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid receipt." });
    const doc = await StockReceipt.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Receipt not found." });
    if (doc.status !== "draft") fail("This delivery is locked.");
    if (req.body?.note !== undefined) doc.note = readNote(req.body.note);
    if (req.body?.lines !== undefined) doc.lines = await sanitizeLines(req.body.lines);
    doc.savedBy = req.user?._id || null;
    doc.savedByName = actorName(req.user);
    await doc.save();
    res.json(present(doc));
  } catch (error) {
    next(error);
  }
}

async function confirmReceipt(req, res, next) {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid receipt." });

    const draft = await StockReceipt.findOne({ _id: req.params.id, status: "draft" });
    if (!draft) fail("This delivery is locked.");

    if (req.body?.note !== undefined) draft.note = readNote(req.body.note);
    if (req.body?.lines !== undefined) draft.lines = await sanitizeLines(req.body.lines);
    draft.savedBy = req.user?._id || null;
    draft.savedByName = actorName(req.user);
    if (!draft.lines.length) fail("Add at least one jar");
    await draft.save();

    const locked = await StockReceipt.findOneAndUpdate(
      { _id: draft._id, status: "draft" },
      {
        $set: {
          status: "received",
          receivedAt: new Date(),
          savedBy: req.user?._id || null,
          savedByName: actorName(req.user),
        },
      },
      { new: true }
    );
    if (!locked) fail("This delivery is locked.");

    try {
      await restoreStockForOrderLines(locked.lines, {
        why: "stock-in",
        who: actorName(req.user),
        receipt: locked._id,
        receiptNote: locked.note,
      });
    } catch (error) {
      await StockReceipt.updateOne({ _id: locked._id }, { $set: { status: "draft", receivedAt: null } });
      throw error;
    }

    const first = locked.lines[0]?.name || "Stock in";
    const extra = locked.lines.length > 1 ? ` +${locked.lines.length - 1}` : "";
    await recordAdminAction(req, {
      action: "Confirmed stock in",
      subject: `${first}${extra}`,
      tab: "catalog",
      href: productOpen(first),
    });

    res.json(present(locked));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listReceipts,
  getReceipt,
  createReceipt,
  updateReceipt,
  confirmReceipt,
};
