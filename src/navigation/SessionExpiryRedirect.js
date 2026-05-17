import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";

/** Sends users to Login when API session expires mid-session. */
export default function SessionExpiryRedirect() {
  const navigation = useNavigation();
  const { sessionExpired, isAuthenticated, isAuthLoading } = useAuth();

  useEffect(() => {
    if (isAuthLoading) return;
    if (sessionExpired && !isAuthenticated) {
      navigation.navigate("Login", { sessionExpired: true });
    }
  }, [isAuthLoading, isAuthenticated, navigation, sessionExpired]);

  return null;
}
