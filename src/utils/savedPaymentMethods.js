import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEMO_SAVED_CARDS_KEY } from "./accountProfilePrefs";

export { DEMO_SAVED_CARDS_KEY };

export const SAVED_UPI_KEY = "@zeevan_demo_saved_upi_v1";

function normalizeCard(raw, index = 0) {
  return {
    id: String(raw?.id || index),
    brand: String(raw?.brand || "Card"),
    last4: String(raw?.last4 || "0000").slice(-4),
    expiry: String(raw?.expiry || ""),
    cardholder: String(raw?.cardholder || raw?.name || "").trim(),
    isDefault: Boolean(raw?.isDefault),
  };
}

function normalizeUpi(raw, index = 0) {
  return {
    id: String(raw?.id || index),
    provider: String(raw?.provider || "UPI"),
    masked: String(raw?.masked || raw?.vpa || "").trim(),
    isDefault: Boolean(raw?.isDefault),
  };
}

export async function loadSavedCards() {
  try {
    const raw = await AsyncStorage.getItem(DEMO_SAVED_CARDS_KEY);
    const parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeCard);
  } catch {
    return [];
  }
}

export async function saveSavedCards(cards) {
  const list = (Array.isArray(cards) ? cards : []).map(normalizeCard);
  await AsyncStorage.setItem(DEMO_SAVED_CARDS_KEY, JSON.stringify(list));
  return list;
}

export async function loadSavedUpis() {
  try {
    const raw = await AsyncStorage.getItem(SAVED_UPI_KEY);
    const parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeUpi);
  } catch {
    return [];
  }
}

export async function saveSavedUpis(upis) {
  const list = (Array.isArray(upis) ? upis : []).map(normalizeUpi);
  await AsyncStorage.setItem(SAVED_UPI_KEY, JSON.stringify(list));
  return list;
}

export function maskCardNumber(last4) {
  return `•••• •••• •••• ${String(last4 || "0000").slice(-4)}`;
}

export function cardBrandIcon(brand) {
  const b = String(brand || "").toLowerCase();
  if (b.includes("visa")) return "card-outline";
  if (b.includes("master")) return "card-outline";
  if (b.includes("rupay")) return "card-outline";
  return "card-outline";
}
