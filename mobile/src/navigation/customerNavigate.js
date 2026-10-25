import { CommonActions } from "@react-navigation/native";
import { Platform } from "react-native";

const STORE_TAB_ROUTES = new Set(["Home", "Shop", "About", "Profile", "MyOrders"]);

/** Flat stack — navigate to a customer-facing route by name. */
export function navigateCustomerRoute(navigation, name, params) {
  navigation?.navigate?.(name, params);
}

export function replaceCustomerRoute(navigation, name, params) {
  if (STORE_TAB_ROUTES.has(name)) {
    resetToMainTabs(navigation, name, params);
    return;
  }
  if (navigation?.replace) {
    navigation.replace(name, params);
  } else {
    navigation?.navigate?.(name, params);
  }
}

/**
 * Bottom-bar destinations keep Home under them so Android back returns
 * to the shop instead of leaving the app.
 */
export function navigateStoreTab(navigation, destination, params) {
  if (!navigation) return;
  if (Platform.OS === "web" || !STORE_TAB_ROUTES.has(destination)) {
    navigation.navigate(destination, params);
    return;
  }
  resetToMainTabs(navigation, destination, params);
}

/** Lands on a main customer screen with Home still underneath (except Home itself). */
export function resetToMainTabs(navigation, name = "Home", params) {
  if (!navigation?.dispatch) return;
  if (name === "Home") {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Home", params }],
      })
    );
    return;
  }
  navigation.dispatch(
    CommonActions.reset({
      index: 1,
      routes: [{ name: "Home" }, { name, params }],
    })
  );
}
