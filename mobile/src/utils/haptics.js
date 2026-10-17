import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

function safe(run) {
  if (Platform.OS === "web") return;
  try {
    const result = run();
    if (result && typeof result.catch === "function") result.catch(() => {});
  } catch {
    // Haptics are a nicety — never block the UI.
  }
}

/** Light tick — tabs, chips, toggles. */
export function hapticTick() {
  safe(() => Haptics.selectionAsync());
}

/** Soft impact — add / remove from cart, wishlist. */
export function hapticTap() {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** Success pulse — completed actions. */
export function hapticSuccess() {
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}
