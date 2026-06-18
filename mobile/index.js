import { LogBox, Platform } from "react-native";
import { enableScreens } from "react-native-screens";
import { registerRootComponent } from "expo";

if (Platform.OS === "web") {
  enableScreens(false);
} else {
  // Native only — keeps web bundle smaller (FCP/LCP/TBT).
  require("react-native-gesture-handler");
  require("react-native-reanimated");
}

import App from "./App";

LogBox.ignoreLogs([
  "Download the React DevTools",
  "shadow* style props are deprecated",
  "props.pointerEvents is deprecated",
  "Running application",
  "Development-level warnings",
]);

registerRootComponent(App);
