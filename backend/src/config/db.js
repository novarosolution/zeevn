const mongoose = require("mongoose");

function firstEnv(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

async function connectDB() {
  try {
    const mongoUri = firstEnv("MONGO_URI", "MONGODB_URI", "DATABASE_URL", "DB_URI");
    const dbName = firstEnv("MONGO_DB_NAME", "DB_NAME");

    if (!mongoUri) {
      throw new Error(
        "Missing MongoDB config. Set MONGO_URI, MONGODB_URI, DATABASE_URL, or DB_URI in your env."
      );
    }

    const connection = await mongoose.connect(
      mongoUri,
      dbName
        ? {
            dbName,
          }
        : undefined
    );
    const activeDb = connection?.connection?.name ? `/${connection.connection.name}` : "";
    console.log(`MongoDB connected: ${connection.connection.host}${activeDb}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;
