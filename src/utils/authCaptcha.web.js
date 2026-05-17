import { AUTH_CAPTCHA_ENABLED, AUTH_CAPTCHA_PROVIDER, AUTH_CAPTCHA_SITE_KEY } from "../constants/authFeatures";

let scriptPromise = null;

function loadRecaptcha() {
  if (!AUTH_CAPTCHA_ENABLED || !AUTH_CAPTCHA_SITE_KEY) return Promise.resolve(null);
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.grecaptcha?.execute) return Promise.resolve(window.grecaptcha);

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(AUTH_CAPTCHA_SITE_KEY)}`;
      script.async = true;
      script.onload = () => resolve(window.grecaptcha);
      script.onerror = () => reject(new Error("CAPTCHA script failed to load"));
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

/**
 * Invisible reCAPTCHA v3 token (feature-flagged). Server may require visible challenge if score low.
 * @param {string} action
 */
export async function getAuthCaptchaToken(action = "auth") {
  if (!AUTH_CAPTCHA_ENABLED) return null;
  if (AUTH_CAPTCHA_PROVIDER !== "recaptcha") return null;

  try {
    const grecaptcha = await loadRecaptcha();
    if (!grecaptcha?.execute) return null;
    return await grecaptcha.execute(AUTH_CAPTCHA_SITE_KEY, { action });
  } catch {
    return null;
  }
}
