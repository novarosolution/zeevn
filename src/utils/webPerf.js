import { Platform } from "react-native";

export function isLowEndWebDevice() {
  if (Platform.OS !== "web" || typeof navigator === "undefined") return false;
  const cores = Number(navigator.hardwareConcurrency || 0);
  const memory = Number(navigator.deviceMemory || 0);
  if (cores > 0 && cores < 4) return true;
  if (memory > 0 && memory <= 4) return true;
  return false;
}

