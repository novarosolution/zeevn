import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

export function hapticSelection() {
  if (Platform.OS !== "ios") return;
  Haptics.selectionAsync().catch(() => {});
}

export function hapticImpactLight() {
  if (Platform.OS !== "ios") return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function hapticImpactMedium() {
  if (Platform.OS !== "ios") return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function hapticSuccess() {
  if (Platform.OS !== "ios") return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function hapticWarning() {
  if (Platform.OS !== "ios") return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}
