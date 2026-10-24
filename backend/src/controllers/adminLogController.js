const AdminLog = require("../models/AdminLog");
const { TABS } = AdminLog;
const { resolvePeriod } = require("./adminOverviewController");

const PAGE = { min: 5, max: 100, fallback: 25 };
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function resolveRange(raw) {
  const key = String(raw || "today").toLowerCase();
  if (key === "7d" || key === "7") return { range: "7d", period: "last7" };
  if (key === "30d" || key === "30") return { range: "30d", period: "last30" };
  return { range: "today", period: "today" };
}

function present(row) {
  const href = row.href && row.href.screen ? { screen: row.href.screen, params: row.href.params || {} } : null;
  return {
    id: String(row._id),
    at: row.at,
    adminId: row.adminId ? String(row.adminId) : "",
    adminName: row.adminName || "Admin",
    action: row.action || "",
    subject: row.subject || "",
    tab: row.tab,
    href,
  };
}

async function listAdminLogs(req, res, next) {
  try {
    const picked = resolveRange(req.query.range);
    const window = await resolvePeriod({ period: picked.period });
    if (window.error) return res.status(400).json({ message: window.error });

    const filter = { at: { $gte: window.from, $lt: window.to } };
    const tab = String(req.query.tab || "").trim();
    if (TABS.includes(tab)) filter.tab = tab;

    const text = String(req.query.q || "").trim();
    if (text) {
      const raw = new RegExp(escapeRegex(text), "i");
      filter.$or = [{ action: raw }, { subject: raw }];
    }

    const pageSize = Math.min(PAGE.max, Math.max(PAGE.min, Math.round(Number(req.query.pageSize)) || PAGE.fallback));
    const total = await AdminLog.countDocuments(filter);
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(pages, Math.max(1, Math.round(Number(req.query.page)) || 1));
    const rows = await AdminLog.find(filter)
      .sort({ at: -1, _id: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    res.json({
      items: rows.map(present),
      total,
      page,
      pages,
      pageSize,
      range: picked.range,
      tab: TABS.includes(tab) ? tab : "all",
      from: window.from,
      to: window.to,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { listAdminLogs };
