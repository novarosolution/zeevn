/**
 * Seed sample Gujarat delivery zones. Safe to re-run (upserts by name).
 * Usage: node scripts/seed-delivery-zones.js
 */
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../src/config/db");
const DeliveryZone = require("../src/models/DeliveryZone");

const ZONES = [
  {
    name: "Ahmedabad core",
    postalCodes: ["380001", "380006", "380015", "380054", "380058"],
    cities: ["ahmedabad"],
    deliveryFee: 49,
    freeAbove: 1499,
    etaMinutesMin: 60,
    etaMinutesMax: 180,
    isActive: true,
  },
  {
    name: "Surat core",
    postalCodes: ["395001", "395003", "395007", "395009"],
    cities: ["surat"],
    deliveryFee: 59,
    freeAbove: 1499,
    etaMinutesMin: 90,
    etaMinutesMax: 240,
    isActive: true,
  },
];

async function main() {
  await connectDB();
  let n = 0;
  for (const z of ZONES) {
    await DeliveryZone.findOneAndUpdate(
      { name: z.name },
      { $set: z },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    n += 1;
  }
  console.log(`Seeded/updated ${n} delivery zones`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
