import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

function run(fn) {
  if (Platform.OS !== "ios") return;
  try {
    fn();
  } catch {
    /* noop */
  }
}

export function hapticSaveSuccess() {
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

export function hapticSaveError() {
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}

export function hapticToggle() {
  run(() => Haptics.selectionAsync());
}

export function hapticDeleteConfirmEnabled() {
  run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function hapticAvatarSuccess() {
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}
