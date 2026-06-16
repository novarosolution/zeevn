const mongoose = require("mongoose");

/**
 * Atlas/local can already have a database with different casing (e.g. `Zeevan` vs `zeevan`).
 * Writes to the wrong segment trigger: "db already exists with different case".
 */
function normalizeMongoUri(uri) {
  if (!uri || typeof uri !== "string") return uri;
  let normalized = uri;
  normalized = normalized.replace(/(mongodb(?:\+srv)?:\/\/[^/]+\/)zeevan(?=\/|$|\?)/i, "$1Zeevan");
  if (process.env.MONGO_DB_NAME) {
    normalized = normalized.replace(/(mongodb(?:\+srv)?:\/\/[^/]+\/)[^/?]+/, `$1${process.env.MONGO_DB_NAME}`);
  }
  return normalized;
}

async function connectDB() {
  try {
    const rawUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/zeevan";
    const mongoUri = normalizeMongoUri(rawUri);
    if (mongoUri !== rawUri) {
      console.warn(`MongoDB URI normalized for database name casing (${rawUri} → ${mongoUri})`);
    }
    const connection = await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;
