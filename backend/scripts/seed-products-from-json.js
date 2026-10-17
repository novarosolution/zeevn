/**
 * Usage: node scripts/seed-products-from-json.js /path/to/products.json
 * Upserts by name. Safe to re-run.
 */
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../src/config/db");
const Product = require("../src/models/Product");

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Pass products.json path");
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const list = Array.isArray(raw) ? raw : raw.products || raw.data || [];
  await connectDB();
  let n = 0;
  for (const p of list) {
    const { _id, __v, createdAt, updatedAt, ...doc } = p;
    if (!doc.name) continue;
    await Product.findOneAndUpdate(
      { name: doc.name },
      { $set: doc },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    n += 1;
  }
  console.log(`Seeded/updated ${n} products`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
