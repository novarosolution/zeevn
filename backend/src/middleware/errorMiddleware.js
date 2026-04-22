function notFound(req, res) {
  res.status(404).json({ message: "Not found" });
}

function errorHandler(err, req, res, next) {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || "Server Error",
  });
}

module.exports = {
  notFound,
  errorHandler,
};
