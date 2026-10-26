const mongoose = require("mongoose");

/** A claim that never finished (the server died mid-request) stops blocking retries after this long. */
const STALE_PENDING_MS = 2 * 60 * 1000;
/** Answers are kept for two weeks: far longer than a phone stays offline, short enough not to pile up. */
const KEEP_SECONDS = 14 * 24 * 60 * 60;

const keySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    state: { type: String, enum: ["pending", "done"], default: "pending" },
    status: { type: Number, default: 200 },
    body: { type: mongoose.Schema.Types.Mixed, default: null },
    createdAt: { type: Date, default: Date.now, expires: KEEP_SECONDS },
  },
  { minimize: false }
);

const IdempotencyKey = mongoose.models.IdempotencyKey || mongoose.model("IdempotencyKey", keySchema);

function readRef(req) {
  const ref = String(req.body?.clientRef ?? "").trim();
  return /^[\w.:-]{6,80}$/.test(ref) ? ref : "";
}

/**
 * For the actions an offline phone queues and later replays (till sale, stock in/out, transfers). The app sends the same
 * `clientRef` for the first attempt and every retry; when the server already answered that reference it replays the same
 * answer instead of billing, receiving or writing stock off a second time. A request with no `clientRef` is untouched.
 *
 * Only a successful answer is remembered: a refused request leaves the reference free, so the retry after fixing it works.
 */
function idempotent(scope) {
  return async function idempotentRoute(req, res, next) {
    const ref = readRef(req);
    if (!ref) return next();
    const key = `${scope}:${String(req.user?._id || "anon")}:${ref}`;

    try {
      await IdempotencyKey.create({ key });
    } catch (error) {
      if (error?.code !== 11000) return next(error);
      const prior = await IdempotencyKey.findOne({ key }).lean();
      if (prior?.state === "done") {
        return res.status(prior.status || 200).json(prior.body);
      }
      // Still being worked on by another request, unless that claim is stale (then this request takes it over).
      const taken = await IdempotencyKey.findOneAndUpdate(
        { key, state: "pending", createdAt: { $lt: new Date(Date.now() - STALE_PENDING_MS) } },
        { $set: { createdAt: new Date() } }
      );
      if (!taken) {
        return res.status(409).json({ message: "That is still being saved. Try again in a moment.", code: "IN_PROGRESS" });
      }
    }

    const send = res.json.bind(res);
    res.json = (body) => {
      const status = res.statusCode || 200;
      if (status >= 200 && status < 300) {
        IdempotencyKey.updateOne({ key }, { $set: { state: "done", status, body } }).catch(() => {});
      } else {
        IdempotencyKey.deleteOne({ key }).catch(() => {});
      }
      return send(body);
    };
    return next();
  };
}

module.exports = { idempotent, IdempotencyKey };
