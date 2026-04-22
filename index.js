import "react-native-reanimated";
import { LogBox, Platform } from "react-native";
import { enableScreens } from "react-native-screens";
import { registerRootComponent } from "expo";
import App from "./App";

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
]);

registerRootComponent(App);
