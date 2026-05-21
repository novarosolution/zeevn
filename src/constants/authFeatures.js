import Constants from "expo-constants";

const publicConfig =
  Constants?.expoConfig?.extra?.publicConfig ||
  Constants?.manifest2?.extra?.publicConfig ||
  {};

function readFlag(envKey, configKey, fallback = "false") {
  const envValue = process.env?.[envKey];
  if (typeof envValue === "string" && envValue.trim()) return envValue.trim();
  const configValue = publicConfig?.[configKey];
  if (typeof configValue === "string" && configValue.trim()) return configValue.trim();
  return fallback;
}

/** reCAPTCHA v3 / hCaptcha — web register & forgot only when enabled. */
export const AUTH_CAPTCHA_ENABLED = readFlag("EXPO_PUBLIC_AUTH_CAPTCHA_ENABLED", "authCaptchaEnabled") === "true";

export const AUTH_CAPTCHA_SITE_KEY = readFlag("EXPO_PUBLIC_AUTH_CAPTCHA_SITE_KEY", "authCaptchaSiteKey", "");

export const AUTH_CAPTCHA_PROVIDER = readFlag(
  "EXPO_PUBLIC_AUTH_CAPTCHA_PROVIDER",
  "authCaptchaProvider",
  "recaptcha"
);

/** OAuth — hidden in UI until explicitly enabled and handlers are wired. */
export const AUTH_SOCIAL_GOOGLE_ENABLED =
  readFlag("EXPO_PUBLIC_AUTH_SOCIAL_GOOGLE_ENABLED", "authSocialGoogleEnabled") === "true";

export const AUTH_SOCIAL_APPLE_ENABLED =
  readFlag("EXPO_PUBLIC_AUTH_SOCIAL_APPLE_ENABLED", "authSocialAppleEnabled") === "true";

export function isAuthSocialVisible() {
  return AUTH_SOCIAL_GOOGLE_ENABLED || AUTH_SOCIAL_APPLE_ENABLED;
}
