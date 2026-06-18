import { Dimensions, Platform } from "react-native";
import { NATIVE_HEADER_HEIGHT, getWebHeaderHeight } from "./web";

/** Total chrome height for scroll padding (web: fixed; native: safe area + bar). */
export function getKankregChromeTop(insets) {
  if (Platform.OS === "web") {
    const { width } = Dimensions.get("window");
    return getWebHeaderHeight(width);
  }
  return (insets?.top || 0) + NATIVE_HEADER_HEIGHT;
}
