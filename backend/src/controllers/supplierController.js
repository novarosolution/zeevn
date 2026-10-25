const Supplier = require("../models/Supplier");
const { recordAdminAction } = require("../utils/adminLog");

function fail(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
}

function present(doc) {
  return {
    _id: doc._id,
    name: doc.name || "",
    phone: doc.phone || "",
    note: doc.note || "",
    lastBillAt: doc.lastBillAt || null,
    createdAt: doc.createdAt,
  };
}

async function listSuppliers(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();
    const filter = q ? { name: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") } : {};
    const rows = await Supplier.find(filter).sort({ lastBillAt: -1, name: 1 }).limit(80).lean();
    res.json(rows.map(present));
  } catch (error) {
    next(error);
  }
}

async function upsertSupplier(req, res, next) {
  try {
    const name = String(req.body?.name || "").trim().slice(0, 120);
    if (!name) fail("Name is required.");
    const phone = String(req.body?.phone || "").trim().slice(0, 20);
    const note = String(req.body?.note || "").trim().slice(0, 240);
    const existing = await Supplier.findOne({ name }).collation({ locale: "en", strength: 2 });
    if (existing) {
      if (phone) existing.phone = phone;
      if (note !== undefined) existing.note = note;
      await existing.save();
      return res.json(present(existing));
    }
    const created = await Supplier.create({ name, phone, note });
    await recordAdminAction(req, { action: "Saved supplier", subject: name, tab: "catalog" });
    res.status(201).json(present(created));
  } catch (error) {
    next(error);
  }
}

async function touchSupplier(name) {
  const clean = String(name || "").trim();
  if (!clean) return null;
  return Supplier.findOneAndUpdate(
    { name: clean },
    { $set: { lastBillAt: new Date() }, $setOnInsert: { name: clean } },
    { upsert: true, new: true }
  );
}

module.exports = { listSuppliers, upsertSupplier, touchSupplier };
