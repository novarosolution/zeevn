const http = require("http");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { initSocketServer } = require("./src/realtime/socketHub");

dotenv.config({ path: path.join(__dirname, ".env") });

const connectDB = require("./src/config/db");
const { getProducts } = require("./src/controllers/productController");
const { getPublicHomeViewConfig } = require("./src/controllers/homeViewController");
const { loginUser, registerUser } = require("./src/controllers/userController");
const { sweepExpiredPendingPayments } = require("./src/controllers/orderController");
const userRoutes = require("./src/routes/userRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const productRoutes = require("./src/routes/productRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const deliveryRoutes = require("./src/routes/deliveryRoutes");
const { notFound, errorHandler } = require("./src/middleware/errorMiddleware");

const app = express();
app.disable("x-powered-by");

const allowedOrigins = new Set([
  "https://novarosolution.com",
  "https://www.novarosolution.com",
  "https://zeevan.app",
  "https://www.zeevan.app",
]);

/** Expo web, Vite, and local dev often use random localhost ports. */
function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return true;
  if (/^https:\/\/[\w-]+\.vercel\.app$/i.test(origin)) return true;
  const extra = process.env.CORS_EXTRA_ORIGINS;
  if (extra) {
    for (const o of extra.split(",").map((s) => s.trim()).filter(Boolean)) {
      if (origin === o) return true;
    }
  }
  return false;
}

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
// Express 5: use a regex path (not '*') so every path answers CORS preflight
app.options(/.*/, cors(corsOptions));

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

app.get("/", (req, res) => {
  res.json({ message: "E-commerce API is running", ok: true });
});

/* Register high-traffic routes directly (reliable on Express 5 + clear for debugging) */
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

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

/**
 * Razorpay-backed orders are created with status `pending_payment` and a
 * `paymentExpiresAt` timestamp ~30m in the future. This loop flips any
 * abandoned ones to `cancelled` so admin dashboards stay clean.
 */
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
  const httpServer = http.createServer(app);
  initSocketServer(httpServer);
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Kankreg API on port ${PORT} (listening on 0.0.0.0)`);
    console.log("Try: GET http://127.0.0.1:" + PORT + "/products");
    console.log("Live: WebSocket /socket.io");
  });
}

start().catch((err) => {
  console.error("Failed to start:", err.message);
  process.exit(1);
});
