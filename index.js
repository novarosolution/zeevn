// Static web export only — dev Metro already loads split chunks; this import breaks HMR for GSAP/lazy routes.
if (typeof __DEV__ !== "undefined" ? !__DEV__ : process.env.NODE_ENV === "production") {
  require("@expo/metro-runtime/async-require");
}
import "react-native-gesture-handler";
import "react-native-reanimated";
import { LogBox, Platform } from "react-native";

if (Platform.OS === "web") {
  require("./src/utils/devConsoleFilters.web");
}
import { enableScreens } from "react-native-screens";
import { registerRootComponent } from "expo";
import { initSentry } from "./src/observability/sentry";
import App from "./App";

initSentry();

// Native stack + react-native-screens on web often yields a blank first paint; use JS stack on web.
if (Platform.OS === "web") {
  enableScreens(false);
}

LogBox.ignoreLogs([
  "Download the React DevTools",
  "shadow* style props are deprecated",
  "props.pointerEvents is deprecated",
  "Running application",
  "Development-level warnings",
  "recyclingKey",
  "useNativeDriver",
]);

registerRootComponent(App);
