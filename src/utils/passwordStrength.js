/**
 * Lightweight password strength score (0–4) for register UI pills.
 * 0 = empty, 1 = too weak, 2 = weak, 3 = okay, 4 = strong/excellent.
 */
export function getPasswordStrengthScore(password) {
  const p = String(password ?? "");
  if (!p) return 0;

  const hasLower = /[a-z]/.test(p);
  const hasUpper = /[A-Z]/.test(p);
  const hasLetter = /[a-zA-Z]/.test(p);
  const hasDigit = /\d/.test(p);
  const hasSymbol = /[^a-zA-Z0-9]/.test(p);
  const len = p.length;

  if (len < 8 || !hasLetter || !hasDigit) return 1;

  let score = 2;
  if (len >= 10 || hasUpper || hasSymbol) score = 3;
  if (len >= 12 && hasLower && hasUpper && hasDigit && hasSymbol) score = 4;
  else if (len >= 12 && hasLetter && hasDigit) score = 4;
  else if (len >= 10 && hasUpper && hasDigit) score = 3;

  const common = ["password", "12345678", "qwerty123", "letmein"];
  if (common.some((w) => p.toLowerCase().includes(w))) {
    score = Math.min(score, 2);
  }

  return score;
}

export function isPasswordStrongEnough(password, minScore = 2) {
  return getPasswordStrengthScore(password) >= minScore;
}
