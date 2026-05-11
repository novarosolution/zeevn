/* eslint-env node */
/**
 * Dynamic Expo config:
 * - keeps deploy/build identity in envs
 * - exposes only safe public UI/runtime values to the client
 * - preserves the existing config shape from `app.json`
 */
function readEnv(name, fallback = "") {
  const value = process.env[name];
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

module.exports = ({ config }) => {
  const appName = readEnv("APP_NAME", config.name || "Zeevan");
  const appSlug = readEnv("APP_SLUG", config.slug || "zeevan");
  const appScheme = readEnv("APP_SCHEME", config.scheme || appSlug);
  const appOwner = readEnv("APP_OWNER", config.owner || "");
  const iosBundleIdentifier = readEnv(
    "IOS_BUNDLE_IDENTIFIER",
    config.ios?.bundleIdentifier || "com.zeevan.app"
  );
  const androidPackage = readEnv(
    "ANDROID_PACKAGE",
    config.android?.package || "com.zeevan.app"
  );
  const easProjectId = readEnv(
    "EAS_PROJECT_ID",
    config.extra?.eas?.projectId || ""
  );

  return {
    ...config,
    name: appName,
    slug: appSlug,
    scheme: appScheme,
    ...(appOwner ? { owner: appOwner } : {}),
    ios: {
      ...config.ios,
      bundleIdentifier: iosBundleIdentifier,
      infoPlist: {
        ...config.ios?.infoPlist,
        NSLocationWhenInUseUsageDescription:
          "Zeevan uses your location for delivery addresses and optional live location sharing while you deliver orders.",
      },
    },
    android: {
      ...config.android,
      package: androidPackage,
    },
    extra: {
      ...config.extra,
      eas: {
        ...config.extra?.eas,
        ...(easProjectId ? { projectId: easProjectId } : {}),
      },
      publicConfig: {
        brandName: readEnv("EXPO_PUBLIC_BRAND_NAME", appName),
        brandTagline: readEnv(
          "EXPO_PUBLIC_BRAND_TAGLINE",
          "Heritage pantry essentials, delivered beautifully"
        ),
        brandSubline: readEnv("EXPO_PUBLIC_BRAND_SUBLINE", "Heritage pantry"),
        searchPlaceholder: readEnv(
          "EXPO_PUBLIC_SEARCH_PLACEHOLDER",
          "Search ghee, staples, and pantry picks..."
        ),
        supportEmail: readEnv("EXPO_PUBLIC_SUPPORT_EMAIL", "support@zeevan.app"),
        supportWhatsAppUrl: readEnv(
          "EXPO_PUBLIC_SUPPORT_WHATSAPP_URL",
          "https://wa.me/919999999999"
        ),
        engineerName: readEnv("EXPO_PUBLIC_ENGINEER_NAME", "NovaRo Solution"),
        engineerUrl: readEnv(
          "EXPO_PUBLIC_ENGINEER_URL",
          "https://novarosolution.com/"
        ),
        apiUrl: readEnv("EXPO_PUBLIC_API_URL", ""),
        razorpayKeyId: readEnv("EXPO_PUBLIC_RAZORPAY_KEY_ID", ""),
        razorpayPaymentLink: readEnv(
          "EXPO_PUBLIC_RAZORPAY_PAYMENT_LINK",
          "https://razorpay.me/@chaudharydhirajpadmabhai"
        ),
      },
    },
  };
};
