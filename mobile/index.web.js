import { LogBox } from "react-native";
import { enableScreens } from "react-native-screens";
import { registerRootComponent } from "expo";
import App from "./App.web";

enableScreens(false);

LogBox.ignoreLogs([
  "Download the React DevTools",
  "shadow* style props are deprecated",
  "props.pointerEvents is deprecated",
  "Running application",
  "Development-level warnings",
]);

registerRootComponent(App);
