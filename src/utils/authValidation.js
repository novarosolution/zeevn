/** Normalized email for compare / API (lowercase, trim). */
export function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  const e = normalizeEmail(email);
  if (!e || e.length > 254) return false;
  if (!EMAIL_RE.test(e)) return false;
  const [local, domain] = e.split("@");
  if (!local || local.length > 64 || !domain || !domain.includes(".")) return false;
  return true;
}

/** @returns {string|null} Error message or null if ok */
export function validateLoginEmail(email) {
  const e = normalizeEmail(email);
  if (!e) return "Please enter your email.";
  if (!isValidEmail(e)) return "Please enter a valid email address.";
  return null;
}

/** @returns {string|null} */
export function validateLoginPassword(password) {
  const p = String(password ?? "");
  if (!p) return "Please enter your password.";
  if (p.length > 128) return "Password is too long.";
  return null;
}

/** @returns {string|null} */
export function validateRegisterName(name) {
  const n = String(name || "")
    .trim()
    .replace(/\s+/g, " ");
  if (!n) return "Please enter your name.";
  if (n.length < 2) return "Name must be at least 2 characters.";
  if (n.length > 80) return "Name must be 80 characters or fewer.";
  return null;
}

/** @returns {string|null} */
export function validateRegisterPassword(password) {
  const p = String(password ?? "");
  if (p.length < 8) return "Password must be at least 8 characters.";
  if (p.length > 128) return "Password must be 128 characters or fewer.";
  if (!/[a-zA-Z]/.test(p)) return "Password must include at least one letter.";
  if (!/[0-9]/.test(p)) return "Password must include at least one number.";
  if (/\s/.test(p)) return "Password cannot contain spaces.";
  return null;
}
