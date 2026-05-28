const logger = require("../utils/logger");
const { redactObject } = require("../utils/redactPii");
const { captureException } = require("../observability/sentry");

function notFound(req, res) {
  logger.warn(
    {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url,
    },
    "route not found"
  );
  res.status(404).json({
    message: "Not found",
    requestId: req.requestId,
  });
}

function errorHandler(err, req, res, next) {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  const code = statusCode >= 500 ? 500 : statusCode;

  const context = {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl || req.url,
    status: code,
    message: err?.message,
  };

  if (code >= 500) {
    logger.error(
      {
        ...context,
        stack: err?.stack,
        body: redactObject(req.body),
      },
      "unhandled error"
    );
    captureException(err, {
      requestId: req.requestId,
      tags: { area: "express" },
      extra: { path: context.path, method: context.method },
    });
  } else {
    logger.warn(
      {
        ...context,
        body: redactObject(req.body),
      },
      "handled client error"
    );
  }

  res.status(code).json({
    message: err.message || "Server Error",
    requestId: req.requestId,
  });
}

module.exports = {
  notFound,
  errorHandler,
};
