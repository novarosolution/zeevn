const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const { initSentry } = require("./src/observability/sentry");
initSentry();

const connectDB = require("./src/config/db");
const logger = require("./src/utils/logger");
const { requestIdMiddleware } = require("./src/middleware/requestId");
const { requestLogger } = require("./src/middleware/requestLogger");
const healthRoutes = require("./src/routes/healthRoutes");
const { getProducts } = require("./src/controllers/productController");
const { getPublicHomeViewConfig } = require("./src/controllers/homeViewController");
const { loginUser, registerUser } = require("./src/controllers/userController");
const { sweepExpiredPendingPayments, razorpayWebhook } = require("./src/controllers/orderController");
const { startWebhookReplayLoop } = require("./src/services/webhookReplayService");
const userRoutes = require("./src/routes/userRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const productRoutes = require("./src/routes/productRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const deliveryRoutes = require("./src/routes/deliveryRoutes");
const { notFound, errorHandler } = require("./src/middleware/errorMiddleware");

const app = express();
app.disable("x-powered-by");

const defaultAllowedOrigins = [
  "http://localhost:8081",
  "http://localhost:8082",
  "http://localhost:8083",
  "http://localhost:19006",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:8082",
  "http://127.0.0.1:8083",
  "http://127.0.0.1:19006",
  "https://novarosolution.com",
  "https://www.novarosolution.com",
];

const configuredOrigins = String(process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...configuredOrigins])];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function originMatches(pattern, origin) {
  if (!pattern || !origin) return false;
  if (pattern === origin) return true;
  if (!pattern.includes("*")) return false;
  const regex = new RegExp(`^${escapeRegex(pattern).replace(/\\\*/g, ".*")}$`);
  return regex.test(origin);
}

function isAllowedOrigin(origin) {
  return allowedOrigins.some((pattern) => originMatches(pattern, origin));
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin || isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Session-Id",
    "X-Captcha-Token",
    "X-Request-Id",
  ],
  exposedHeaders: ["X-Request-Id"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(requestIdMiddleware);
app.use(requestLogger);

app.use(healthRoutes);
app.use("/api", healthRoutes);

function mountRazorpayWebhook(path) {
  app.post(
    path,
    express.raw({ type: "application/json", limit: "1mb" }),
    (req, _res, next) => {
      req.rawBody = req.body;
      next();
    },
    razorpayWebhook
  );
}

mountRazorpayWebhook("/orders/razorpay-webhook");
mountRazorpayWebhook("/api/orders/razorpay-webhook");

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

app.get("/", (req, res) => {
  res.json({ message: "E-commerce API is running", ok: true, requestId: req.requestId });
});

app.get("/products", getProducts);
app.get("/api/products", getProducts);
app.get("/home-view", getPublicHomeViewConfig);
app.get("/api/home-view", getPublicHomeViewConfig);
app.post("/users/register", registerUser);
app.post("/users/login", loginUser);
app.post("/api/users/register", registerUser);
app.post("/api/users/login", loginUser);

function mountApi(routePath, router) {
  app.use(routePath, router);
  app.use(`/api${routePath}`, router);
}

mountApi("/users", userRoutes);
mountApi("/orders", orderRoutes);
mountApi("/products", productRoutes);
mountApi("/admin", adminRoutes);
mountApi("/delivery", deliveryRoutes);

if (process.env.NODE_ENV !== "production" && process.env.ENABLE_TEST_ROUTES !== "false") {
  const testRoutes = require("./src/routes/testRoutes");
  app.use("/test", testRoutes);
  app.use("/api/test", testRoutes);
  logger.info("E2E test routes enabled at /test (non-production only)");
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

function startExpiredPaymentSweeper() {
  const interval = setInterval(() => {
    sweepExpiredPendingPayments().catch(() => {});
  }, 60 * 1000);
  if (typeof interval.unref === "function") interval.unref();
  sweepExpiredPendingPayments().catch(() => {});
  return interval;
}

async function start() {
  await connectDB();
  startExpiredPaymentSweeper();
  startWebhookReplayLoop();
  app.listen(PORT, "0.0.0.0", () => {
    logger.info({ port: PORT }, "Zeevan API listening");
  });
}

start().catch((err) => {
  logger.error({ err: err.message }, "Failed to start API");
  process.exit(1);
});
