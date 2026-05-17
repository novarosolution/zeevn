import AsyncStorage from "@react-native-async-storage/async-storage";

export const NOTIFICATION_PREFS_STORAGE_KEY = "@zeevan_notification_prefs_v2";

export const NOTIFICATION_CHANNELS = ["email", "sms", "whatsapp", "push"];

export const NOTIFICATION_CATEGORY_KEYS = [
  "orderUpdates",
  "delivery",
  "offers",
  "memberDrops",
  "recipe",
  "backInStock",
  "wishlistPriceDrops",
  "surveys",
];

const CATEGORY_DEFAULTS = {
  orderUpdates: true,
  delivery: true,
  offers: false,
  memberDrops: true,
  recipe: false,
  backInStock: true,
  wishlistPriceDrops: true,
  surveys: false,
};

export function buildDefaultNotificationPrefs() {
  const channels = {};
  NOTIFICATION_CHANNELS.forEach((ch) => {
    channels[ch] = { ...CATEGORY_DEFAULTS };
  });
  return {
    channels,
    privacy: {
      personalizedRecommendations: true,
      shareWithMarketingPartners: false,
    },
  };
}

export function normalizeNotificationPrefs(raw) {
  const base = buildDefaultNotificationPrefs();
  if (!raw || typeof raw !== "object") return base;

  NOTIFICATION_CHANNELS.forEach((ch) => {
    const src = raw.channels?.[ch];
    if (!src || typeof src !== "object") return;
    NOTIFICATION_CATEGORY_KEYS.forEach((key) => {
      if (typeof src[key] === "boolean") base.channels[ch][key] = src[key];
    });
    base.channels[ch].orderUpdates = true;
  });

  if (typeof raw.privacy?.personalizedRecommendations === "boolean") {
    base.privacy.personalizedRecommendations = raw.privacy.personalizedRecommendations;
  }
  if (typeof raw.privacy?.shareWithMarketingPartners === "boolean") {
    base.privacy.shareWithMarketingPartners = raw.privacy.shareWithMarketingPartners;
  }

  return base;
}

export async function loadNotificationPrefs() {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_PREFS_STORAGE_KEY);
    return normalizeNotificationPrefs(JSON.parse(stored || "{}"));
  } catch {
    return buildDefaultNotificationPrefs();
  }
}

export async function saveNotificationPrefs(prefs) {
  const normalized = normalizeNotificationPrefs(prefs);
  await AsyncStorage.setItem(NOTIFICATION_PREFS_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function notificationPrefsSnapshot(prefs) {
  return JSON.stringify(normalizeNotificationPrefs(prefs));
}
