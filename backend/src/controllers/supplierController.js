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
    let rows;
    try {
      rows = await Supplier.find(filter)
        .collation({ locale: "en", strength: 2 })
        .sort({ lastBillAt: -1, name: 1 })
        .limit(80)
        .lean();
    } catch {
      rows = await Supplier.find(filter).sort({ lastBillAt: -1, name: 1 }).limit(80).lean();
    }
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
    let existing;
    try {
      existing = await Supplier.findOne({ name }).collation({ locale: "en", strength: 2 });
    } catch {
      existing = await Supplier.findOne({ name });
    }
    if (existing) {
      if (phone) existing.phone = phone;
      if (note !== undefined) existing.note = note;
      await existing.save();
      return res.json(present(existing));
    }
    try {
      const created = await Supplier.create({ name, phone, note });
      await recordAdminAction(req, { action: "Saved supplier", subject: name, tab: "catalog" });
      return res.status(201).json(present(created));
    } catch (error) {
      if (error?.code !== 11000) throw error;
      const again = await Supplier.findOne({ name }).collation({ locale: "en", strength: 2 });
      if (!again) throw error;
      if (phone) again.phone = phone;
      again.note = note;
      await again.save();
      return res.json(present(again));
    }
  } catch (error) {
    next(error);
  }
}

async function touchSupplier(name) {
  const clean = String(name || "").trim();
  if (!clean) return null;
  const existing = await Supplier.findOne({ name: clean }).collation({ locale: "en", strength: 2 });
  if (existing) {
    existing.lastBillAt = new Date();
    await existing.save();
    return existing;
  }
  try {
    return await Supplier.create({ name: clean, lastBillAt: new Date() });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const again = await Supplier.findOne({ name: clean }).collation({ locale: "en", strength: 2 });
    if (again) {
      again.lastBillAt = new Date();
      await again.save();
      return again;
    }
    throw error;
  }
}

module.exports = { listSuppliers, upsertSupplier, touchSupplier };
