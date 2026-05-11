import Constants from "expo-constants";

const publicConfig =
  Constants?.expoConfig?.extra?.publicConfig ||
  Constants?.manifest2?.extra?.publicConfig ||
  {};

function readPublicEnv(envKey, configKey, fallback = "") {
  const envValue = process.env?.[envKey];
  if (typeof envValue === "string" && envValue.trim()) {
    return envValue.trim();
  }
  const configValue = publicConfig?.[configKey];
  if (typeof configValue === "string" && configValue.trim()) {
    return configValue.trim();
  }
  return fallback;
}

export const RUNTIME_BRAND_NAME = readPublicEnv(
  "EXPO_PUBLIC_BRAND_NAME",
  "brandName",
  "Zeevan"
);

export const RUNTIME_BRAND_TAGLINE = readPublicEnv(
  "EXPO_PUBLIC_BRAND_TAGLINE",
  "brandTagline",
  "Heritage pantry essentials, delivered beautifully"
);

export const RUNTIME_BRAND_SUBLINE = readPublicEnv(
  "EXPO_PUBLIC_BRAND_SUBLINE",
  "brandSubline",
  "Heritage pantry"
);

export const RUNTIME_SEARCH_PLACEHOLDER = readPublicEnv(
  "EXPO_PUBLIC_SEARCH_PLACEHOLDER",
  "searchPlaceholder",
  "Search ghee, staples, and pantry picks..."
);

export const RUNTIME_SUPPORT_EMAIL = readPublicEnv(
  "EXPO_PUBLIC_SUPPORT_EMAIL",
  "supportEmail",
  "support@zeevan.app"
);

export const RUNTIME_SUPPORT_WHATSAPP_URL = readPublicEnv(
  "EXPO_PUBLIC_SUPPORT_WHATSAPP_URL",
  "supportWhatsAppUrl",
  "https://wa.me/919999999999"
);

export const RUNTIME_ENGINEER_NAME = readPublicEnv(
  "EXPO_PUBLIC_ENGINEER_NAME",
  "engineerName",
  "NovaRo Solution"
);

export const RUNTIME_ENGINEER_URL = readPublicEnv(
  "EXPO_PUBLIC_ENGINEER_URL",
  "engineerUrl",
  "https://novarosolution.com/"
);

export const RUNTIME_API_URL = readPublicEnv(
  "EXPO_PUBLIC_API_URL",
  "apiUrl",
  ""
);

export const RUNTIME_RAZORPAY_KEY_ID = readPublicEnv(
  "EXPO_PUBLIC_RAZORPAY_KEY_ID",
  "razorpayKeyId",
  ""
);

export const RUNTIME_RAZORPAY_PAYMENT_LINK = readPublicEnv(
  "EXPO_PUBLIC_RAZORPAY_PAYMENT_LINK",
  "razorpayPaymentLink",
  ""
);
