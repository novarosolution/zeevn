import { CommonActions } from "@react-navigation/native";

/**
 * After logout, clears the stack so no protected screens (Admin, Profile) stay mounted with a null token.
 */
export function resetNavigationToHome(navigation) {
  if (!navigation?.dispatch) {
    return;
  }
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: "Home" }],
    })
  );
}
