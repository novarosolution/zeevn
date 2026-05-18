const Sentry = require("@sentry/node");

let initialized = false;

function initSentry() {
  const dsn = process.env.SENTRY_DSN || "";
  if (!dsn || initialized) return false;

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
    release: process.env.SENTRY_RELEASE || `zeevan-api@${process.env.npm_package_version || "1.0.0"}`,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
  });

  initialized = true;
  return true;
}

function captureException(error, context = {}) {
  if (!initialized) return;
  Sentry.withScope((scope) => {
    if (context.requestId) scope.setTag("requestId", context.requestId);
    if (context.tags) scope.setTags(context.tags);
    if (context.extra) scope.setExtras(context.extra);
    Sentry.captureException(error);
  });
}

module.exports = { initSentry, captureException, Sentry };
