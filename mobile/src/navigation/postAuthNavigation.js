import { Platform } from "react-native";
import {
  isDeliveryLocationConfirmed,
  loadDeliveryConfirmedAt,
} from "../services/deliveryLocationCache";

/**
 * After sign-in / register on native: show Find Location when delivery spot
 * isn't confirmed yet; otherwise land on Home. Web always goes Home.
 */
export async function resetNavigationAfterAuth(navigation, user) {
  if (Platform.OS === "web" && user?.isAdmin) {
    navigation.reset({ index: 0, routes: [{ name: "AdminDashboard" }] });
    return;
  }
  if (Platform.OS === "web") {
    navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    return;
  }

  const confirmedAt = await loadDeliveryConfirmedAt();
  const route = isDeliveryLocationConfirmed(confirmedAt) ? "Home" : "FindLocation";
  navigation.reset({ index: 0, routes: [{ name: route }] });
}
