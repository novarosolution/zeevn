const WebhookEvent = require("../models/WebhookEvent");
const logger = require("../utils/logger");
const { applyRazorpayWebhookEvent } = require("../controllers/orders/webhookHandler");

const MAX_ATTEMPTS = 8;
const BATCH_SIZE = 20;

async function processWebhookRecord(record, event) {
  try {
    await applyRazorpayWebhookEvent(event);
    record.status = "processed";
    record.processedAt = new Date();
    record.lastError = "";
    await record.save();
    return true;
  } catch (err) {
    record.status = "failed";
    record.attempts = (record.attempts || 0) + 1;
    record.lastError = String(err?.message || err).slice(0, 500);
    await record.save();
    logger.error(
      { dedupeKey: record.dedupeKey, err: record.lastError },
      "webhook processing failed"
    );
    return false;
  }
}

async function registerWebhookEvent({ dedupeKey, eventType, razorpayOrderId, razorpayPaymentId, event }) {
  const existing = await WebhookEvent.findOne({ dedupeKey });
  if (existing?.status === "processed") {
    return { duplicate: true, record: existing };
  }

  const record =
    existing ||
    (await WebhookEvent.create({
      dedupeKey,
      eventType,
      razorpayOrderId,
      razorpayPaymentId,
      payload: event,
      status: "pending",
    }));

  const ok = await processWebhookRecord(record, event);
  return { duplicate: false, record, ok };
}

async function replayFailedWebhooks() {
  const failed = await WebhookEvent.find({
    status: "failed",
    attempts: { $lt: MAX_ATTEMPTS },
  })
    .sort({ updatedAt: 1 })
    .limit(BATCH_SIZE);

  let replayed = 0;
  for (const record of failed) {
    if (!record.payload) continue;
    const ok = await processWebhookRecord(record, record.payload);
    if (ok) replayed += 1;
  }
  if (replayed > 0) {
    logger.info({ replayed }, "webhook replay batch complete");
  }
  return replayed;
}

function startWebhookReplayLoop() {
  const interval = setInterval(() => {
    replayFailedWebhooks().catch((err) => {
      logger.error({ err: err.message }, "webhook replay loop error");
    });
  }, 60 * 1000);
  if (typeof interval.unref === "function") interval.unref();
  return interval;
}

module.exports = {
  registerWebhookEvent,
  replayFailedWebhooks,
  startWebhookReplayLoop,
};
