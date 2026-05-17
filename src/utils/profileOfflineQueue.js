import AsyncStorage from "@react-native-async-storage/async-storage";
import { isDeviceOffline } from "./authNetwork";

const QUEUE_KEY = "@zeevan_profile_pending_save_v1";

export async function loadPendingProfileSave() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function queuePendingProfileSave(payload) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify({ ...payload, queuedAt: Date.now() }));
}

export async function clearPendingProfileSave() {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export async function shouldQueueProfileSave() {
  return isDeviceOffline();
}
