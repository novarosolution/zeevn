import AsyncStorage from "@react-native-async-storage/async-storage";
import { SESSION_ID_STORAGE_KEY } from "../constants/sessionConstants";

export async function loadStoredSessionId() {
  try {
    return (await AsyncStorage.getItem(SESSION_ID_STORAGE_KEY)) || "";
  } catch {
    return "";
  }
}

export async function persistSessionId(sessionId) {
  if (!sessionId) return;
  try {
    await AsyncStorage.setItem(SESSION_ID_STORAGE_KEY, String(sessionId));
  } catch {
    /* noop */
  }
}

export async function clearStoredSessionId() {
  try {
    await AsyncStorage.removeItem(SESSION_ID_STORAGE_KEY);
  } catch {
    /* noop */
  }
}
