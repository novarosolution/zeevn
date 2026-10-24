const HelpFaq = require("../models/HelpFaq");
const { recordAdminAction } = require("../utils/adminLog");

const QUESTION_MAX = 160;
const ANSWER_MAX = 800;

const BUILT_IN_FAQS = [
  {
    question: "When will my order arrive?",
    answer: "Track status in My Orders. Same-day in many areas.",
  },
  {
    question: "How do I change my order?",
    answer: "My Orders → update address before pickup.",
  },
  {
    question: "Can I pay on delivery?",
    answer: "Yes — Cash on Delivery and online checkout.",
  },
  {
    question: "How do refunds work?",
    answer: "Refunds return to your original payment method.",
  },
];

function builtInItems() {
  return BUILT_IN_FAQS.map((item, order) => ({
    question: item.question,
    answer: item.answer,
    order,
    enabled: true,
  }));
}

function presentItem(item, order) {
  return {
    question: String(item.question || ""),
    answer: String(item.answer || ""),
    order,
    enabled: item.enabled !== false,
  };
}

function presentAdmin(doc) {
  if (!doc || !doc.saved) {
    return { saved: false, items: builtInItems() };
  }
  const items = (Array.isArray(doc.items) ? doc.items : [])
    .slice()
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .map((item, index) => presentItem(item, index));
  return { saved: true, items };
}

function presentPublic(doc) {
  if (!doc || !doc.saved) {
    return {
      faqs: BUILT_IN_FAQS.map((item) => ({ q: item.question, a: item.answer })),
    };
  }
  const faqs = (Array.isArray(doc.items) ? doc.items : [])
    .slice()
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .filter((item) => item.enabled !== false)
    .map((item) => ({
      q: String(item.question || "").trim(),
      a: String(item.answer || "").trim(),
    }))
    .filter((item) => item.q && item.a);
  return { faqs };
}

function parseItems(raw) {
  const list = Array.isArray(raw) ? raw : [];
  const items = [];
  for (const row of list) {
    const question = String(row?.question || "").trim();
    const answer = String(row?.answer || "").trim();
    if (!question || !answer) {
      return { ok: false, message: "Question and answer are both required." };
    }
    if (question.length > QUESTION_MAX) {
      return { ok: false, message: `Question is at most ${QUESTION_MAX} characters.` };
    }
    if (answer.length > ANSWER_MAX) {
      return { ok: false, message: `Answer is at most ${ANSWER_MAX} characters.` };
    }
    items.push({
      question,
      answer,
      order: Number.isFinite(Number(row?.order)) ? Number(row.order) : items.length,
      enabled: row?.enabled !== false,
    });
  }
  items.sort((a, b) => a.order - b.order);
  return {
    ok: true,
    items: items.map((item, order) => ({ ...item, order })),
  };
}

async function getAdminFaqs(req, res, next) {
  try {
    const doc = await HelpFaq.findOne().lean();
    res.json(presentAdmin(doc));
  } catch (error) {
    next(error);
  }
}

async function updateAdminFaqs(req, res, next) {
  try {
    const parsed = parseItems(req.body?.items);
    if (!parsed.ok) return res.status(400).json({ message: parsed.message });

    let doc = await HelpFaq.findOne();
    if (!doc) doc = new HelpFaq();
    doc.saved = true;
    doc.items = parsed.items;
    await doc.save();
    await recordAdminAction(req, {
      action: "Saved FAQs",
      subject: "FAQs",
      tab: "shop",
      href: { screen: "AdminFaqs" },
    });
    res.json(presentAdmin(doc));
  } catch (error) {
    next(error);
  }
}

async function getPublicFaqs(req, res, next) {
  try {
    const doc = await HelpFaq.findOne().lean();
    res.json(presentPublic(doc));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAdminFaqs,
  updateAdminFaqs,
  getPublicFaqs,
};
