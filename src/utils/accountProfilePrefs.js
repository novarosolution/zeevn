import AsyncStorage from "@react-native-async-storage/async-storage";

export const PROFILE_PREFS_KEY = "@zeevan_profile_prefs_v1";
export const DEMO_SAVED_CARDS_KEY = "@zeevan_demo_saved_cards_v1";

const DEFAULT_PREFS = {
  displayName: "",
  dob: "",
  gender: "Prefer not to say",
  twoFactorEnabled: false,
  language: "English",
  currency: "INR (₹)",
  timezone: "Asia/Kolkata",
  units: "Metric (kg, ml)",
  passwordChangedAt: null,
};

export async function loadProfilePrefs() {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export async function saveProfilePrefs(prefs) {
  await AsyncStorage.setItem(PROFILE_PREFS_KEY, JSON.stringify(prefs));
}
