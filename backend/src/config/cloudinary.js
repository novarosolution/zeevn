const { v2: cloudinary } = require("cloudinary");

let configured = false;
let instance = null;

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET)
  );
}

function getCloudinary() {
  if (configured) return instance;

  if (!isCloudinaryConfigured()) {
    const error = new Error(
      "Cloudinary not configured. Set CLOUDINARY_URL or (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)."
    );
    error.code = "CLOUDINARY_NOT_CONFIGURED";
    error.statusCode = 503;
    throw error;
  }

  if (process.env.CLOUDINARY_URL) {
    // SDK auto-reads CLOUDINARY_URL, explicit config not required.
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  instance = cloudinary;
  configured = true;
  return instance;
}

module.exports = { getCloudinary, isCloudinaryConfigured };
