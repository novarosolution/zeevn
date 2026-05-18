#!/usr/bin/env node
/**
 * Ensures at least one catalog product exists for Playwright checkout/smoke tests.
 */
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const mongoose = require("mongoose");
const Product = require("../src/models/Product");

const E2E_PRODUCT_NAME = "E2E Ghee Jar";

async function main() {
  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    "mongodb://127.0.0.1:27017/zeevan_e2e";

  await mongoose.connect(mongoUri);
  let product = await Product.findOne({ name: E2E_PRODUCT_NAME });
  if (!product) {
    product = await Product.create({
      name: E2E_PRODUCT_NAME,
      price: 499,
      mrp: 599,
      image: "https://placehold.co/400x400/png?text=E2E",
      description: "Playwright E2E fixture product",
      category: "General",
      showOnHome: true,
      homeOrder: 0,
      stockQty: 100,
    });
    console.log(`[seed-e2e] created product ${product._id}`);
  } else {
    console.log(`[seed-e2e] product exists ${product._id}`);
  }
  console.log(JSON.stringify({ productId: String(product._id), name: product.name }));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("[seed-e2e]", err.message);
  process.exit(1);
});
