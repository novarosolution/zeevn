const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export const AVATAR_UPLOAD_COPY = {
  tooLarge: "Photo must be 5MB or smaller. Choose a smaller image.",
  badType: "Use a JPG, PNG, or WebP photo.",
};

export function validateAvatarAsset(asset) {
  if (!asset) return { ok: false, message: AVATAR_UPLOAD_COPY.badType };
  const mime = String(asset.mimeType || "").toLowerCase();
  if (mime && !ALLOWED.has(mime)) {
    return { ok: false, message: AVATAR_UPLOAD_COPY.badType };
  }
  const size = Number(asset.fileSize || asset.filesize || 0);
  if (size > MAX_BYTES) {
    return { ok: false, message: AVATAR_UPLOAD_COPY.tooLarge };
  }
  if (asset.base64) {
    const approxBytes = Math.ceil((asset.base64.length * 3) / 4);
    if (approxBytes > MAX_BYTES) {
      return { ok: false, message: AVATAR_UPLOAD_COPY.tooLarge };
    }
  }
  return { ok: true };
}
