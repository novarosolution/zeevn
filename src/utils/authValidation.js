import { AUTH_SCREEN } from "../content/appContent";

const shared = AUTH_SCREEN.shared;

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
  if (!e) return shared.requiredField;
  if (!isValidEmail(e)) return shared.invalidEmail;
  return null;
}

/** @returns {string|null} */
export function validateLoginPassword(password) {
  const p = String(password ?? "");
  if (!p) return shared.requiredField;
  if (p.length > 128) return "Password is too long.";
  return null;
}

/** @returns {string|null} */
export function validateRegisterName(name) {
  const n = String(name || "")
    .trim()
    .replace(/\s+/g, " ");
  if (!n) return shared.requiredField;
  if (n.length < 2) return "Name must be at least 2 characters.";
  if (n.length > 80) return "Name must be 80 characters or fewer.";
  const core = n.replace(/[\s.'\u2019-]/g, "");
  if (core && /^\d+$/.test(core)) return "Name cannot be numbers only.";
  return null;
}

/** @returns {string|null} */
export function validateRegisterPassword(password) {
  const p = String(password ?? "");
  if (p.length < 8) return shared.passwordTooShort;
  if (p.length > 128) return "Password must be 128 characters or fewer.";
  if (!/[a-zA-Z]/.test(p)) return "Password must include at least one letter.";
  if (!/[0-9]/.test(p)) return "Password must include at least one number.";
  if (/\s/.test(p)) return "Password cannot contain spaces.";
  return null;
}
