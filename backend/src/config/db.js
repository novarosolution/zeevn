const mongoose = require("mongoose");

async function connectDB() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/kankreg_ecommerce";
    const connection = await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;
