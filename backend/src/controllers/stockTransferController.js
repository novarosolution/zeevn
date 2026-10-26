const mongoose = require("mongoose");
const Product = require("../models/Product");
const StockTransfer = require("../models/StockTransfer");
const { transferStock, locationOf, qtyAt } = require("../utils/stock");
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
    from: doc.from,
    to: doc.to,
    note: doc.note || "",
    status: doc.status,
    lines,
    lineCount: lines.length,
    totalJars,
    savedByName: doc.savedByName || "",
    doneAt: doc.doneAt || null,
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

function readPile(value, fallback = "online") {
  return locationOf(value || fallback);
}

/** Check every line against the source pile first, so a short line can't leave the others half moved. */
async function assertEnoughToMove(lines, from) {
  const products = await Product.find({ _id: { $in: lines.map((line) => line.product) } })
    .select("name stockQty stockCounter")
    .lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));
  for (const line of lines) {
    const product = byId.get(String(line.product));
    const name = product?.name || line.name || "That jar";
    if (!product) fail(`${name} is gone.`);
    const have = qtyAt(product, from);
    const need = Math.max(1, Math.floor(Number(line.quantity) || 0));
    if (have < need) {
      fail(`Only ${have} ${name} ${from === "online" ? "online" : "on the floor"}, can't move ${need}.`);
    }
  }
}

async function listTransfers(req, res, next) {
  try {
    const status = String(req.query.status || "");
    const filter = {};
    if (status === "draft" || status === "done") filter.status = status;
    const pageSize = Math.min(
      PAGE_SIZE.max,
      Math.max(PAGE_SIZE.min, Math.round(Number(req.query.pageSize)) || PAGE_SIZE.fallback)
    );
    const [total, draft, done] = await Promise.all([
      StockTransfer.countDocuments(filter),
      StockTransfer.countDocuments({ status: "draft" }),
      StockTransfer.countDocuments({ status: "done" }),
    ]);
    const pages = Math.max(1, Math.ceil(total / pageSize) || 1);
    const page = Math.min(pages, Math.max(1, Math.round(Number(req.query.page)) || 1));
    const rows = await StockTransfer.find(filter)
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
      counts: { draft, done },
    });
  } catch (error) {
    next(error);
  }
}

async function getTransfer(req, res, next) {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid transfer." });
    const doc = await StockTransfer.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: "Transfer not found." });
    res.json(present(doc));
  } catch (error) {
    next(error);
  }
}

async function createTransfer(req, res, next) {
  try {
    const from = readPile(req.body?.from, "online");
    const to = readPile(req.body?.to, "counter");
    if (from === to) fail("Move from one pile to the other.");
    const doc = await StockTransfer.create({
      from,
      to,
      note: String(req.body?.note || "").trim().slice(0, 200),
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

async function updateTransfer(req, res, next) {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid transfer." });
    const doc = await StockTransfer.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Transfer not found." });
    if (doc.status !== "draft") fail("This transfer is locked.");
    if (req.body?.from !== undefined || req.body?.to !== undefined) {
      const from = readPile(req.body?.from, doc.from);
      const to = readPile(req.body?.to, doc.to);
      if (from === to) fail("Move from one pile to the other.");
      doc.from = from;
      doc.to = to;
    }
    if (req.body?.note !== undefined) doc.note = String(req.body.note || "").trim().slice(0, 200);
    if (req.body?.lines !== undefined) doc.lines = await sanitizeLines(req.body.lines);
    doc.savedBy = req.user?._id || null;
    doc.savedByName = actorName(req.user);
    await doc.save();
    res.json(present(doc));
  } catch (error) {
    next(error);
  }
}

async function confirmTransfer(req, res, next) {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid transfer." });
    const draft = await StockTransfer.findOne({ _id: req.params.id, status: "draft" });
    if (!draft) fail("This transfer is locked.");
    if (req.body?.note !== undefined) draft.note = String(req.body.note || "").trim().slice(0, 200);
    if (req.body?.from !== undefined) draft.from = readPile(req.body.from, draft.from);
    if (req.body?.to !== undefined) draft.to = readPile(req.body.to, draft.to);
    if (req.body?.lines !== undefined) draft.lines = await sanitizeLines(req.body.lines);
    if (draft.from === draft.to) fail("Move from one pile to the other.");
    if (!draft.lines.length) fail("Add at least one jar.");
    await assertEnoughToMove(draft.lines, draft.from);
    draft.savedBy = req.user?._id || null;
    draft.savedByName = actorName(req.user);
    await draft.save();

    const locked = await StockTransfer.findOneAndUpdate(
      { _id: draft._id, status: "draft" },
      { $set: { status: "done", doneAt: new Date(), savedBy: req.user?._id || null, savedByName: actorName(req.user) } },
      { new: true }
    );
    if (!locked) fail("This transfer is locked.");

    const moved = [];
    try {
      for (const line of locked.lines) {
        await transferStock({
          productId: line.product,
          from: locked.from,
          to: locked.to,
          qty: line.quantity,
          who: actorName(req.user),
          transfer: locked._id,
          receiptNote: locked.note,
        });
        moved.push(line);
      }
    } catch (error) {
      // Someone sold a jar between the check and the move: put back what already moved, then reopen the draft.
      for (const line of moved.reverse()) {
        await transferStock({
          productId: line.product,
          from: locked.to,
          to: locked.from,
          qty: line.quantity,
          who: actorName(req.user),
          transfer: locked._id,
          receiptNote: "Undone, transfer did not finish",
        }).catch(() => {});
      }
      await StockTransfer.updateOne({ _id: locked._id }, { $set: { status: "draft", doneAt: null } });
      throw error;
    }

    const first = locked.lines[0]?.name || "Transfer";
    await recordAdminAction(req, {
      action: "Transferred stock",
      subject: `${first}${locked.lines.length > 1 ? ` +${locked.lines.length - 1}` : ""}`,
      tab: "catalog",
      href: productOpen(first),
    });
    res.json(present(locked));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listTransfers,
  getTransfer,
  createTransfer,
  updateTransfer,
  confirmTransfer,
};
