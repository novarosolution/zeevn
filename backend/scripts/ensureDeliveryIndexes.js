/**
 * Ensure delivery-related Mongo indexes exist.
 * Usage: node scripts/ensureDeliveryIndexes.js
 */
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../src/config/db");
const Order = require("../src/models/Order");
const User = require("../src/models/User");
const DeliveryZone = require("../src/models/DeliveryZone");

async function main() {
  await connectDB();
  await Promise.all([
    Order.syncIndexes(),
    User.syncIndexes(),
    DeliveryZone.syncIndexes(),
  ]);
  console.log("Delivery indexes synced (Order, User, DeliveryZone)");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
