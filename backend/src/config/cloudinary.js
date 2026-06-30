const { v2: cloudinary } = require("cloudinary");

let configured = false;

function readCloudinaryEnv() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  if (cloudName && apiKey && apiSecret) {
    return {
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    };
  }

  if (cloudinaryUrl) {
    const parsed = new URL(cloudinaryUrl);
    return {
      cloud_name: parsed.hostname,
      api_key: decodeURIComponent(parsed.username || ""),
      api_secret: decodeURIComponent(parsed.password || ""),
    };
  }

  return null;
}

function isCloudinaryConfigured() {
  return Boolean(readCloudinaryEnv());
}

function getCloudinary() {
  if (configured) return cloudinary;

  const config = readCloudinaryEnv();
  if (!config) {
    throw new Error(
      "Cloudinary config missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (or CLOUDINARY_URL)."
    );
  }

  cloudinary.config(config);
  configured = true;
  return cloudinary;
}

module.exports = {
  getCloudinary,
  isCloudinaryConfigured,
};
