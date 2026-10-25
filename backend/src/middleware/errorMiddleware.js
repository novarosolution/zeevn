function notFound(req, res) {
  res.status(404).json({ message: "Not found" });
}

function isDbError(err) {
  const name = String(err?.name || "");
  return (
    name === "MongoServerError" ||
    name === "MongoNetworkError" ||
    name === "MongoTimeoutError" ||
    name === "MongooseServerSelectionError" ||
    /ECONNREFUSED|MongoNetwork|server selection|topology was destroyed/i.test(String(err?.message || ""))
  );
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err?.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ message: "Invalid request body." });
  }
  if (err?.name === "ValidationError") {
    return res.status(400).json({ message: err.message || "Invalid data." });
  }
  if (err?.name === "CastError") {
    return res.status(404).json({ message: "Not found" });
  }
  if (isDbError(err)) {
    console.error("[api] db", err.message);
    return res.status(503).json({ message: "Shop is busy. Try again in a moment.", code: "DB_DOWN" });
  }

  const statusCode = Number(err.statusCode || err.status) || (res.statusCode === 200 ? 500 : res.statusCode);
  const status = statusCode >= 400 && statusCode < 600 ? statusCode : 500;
  if (status >= 500) {
    console.error("[api]", err.stack || err.message || err);
  }
  res.status(status).json({
    message: status >= 500 ? "Something went wrong. Please try again." : err.message || "Request failed.",
    ...(err.code ? { code: err.code } : {}),
  });
}

module.exports = {
  notFound,
  errorHandler,
};
