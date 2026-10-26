import { Platform } from "react-native";

/** Native: no-op. Web uses scrollTriggerRefresh.web.js. */
export function scheduleScrollTriggerRefresh() {
  if (Platform.OS !== "web") return;
}
