import { Platform } from "react-native";

/** Web: use boxShadow. Native: use shadow* / elevation. */
export function platformShadow({ web, ios, android }) {
  if (Platform.OS === "web") {
    return web;
  }
  if (Platform.OS === "ios") {
    return ios;
  }
  return android;
}
