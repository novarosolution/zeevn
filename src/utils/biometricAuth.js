import { Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const CREDENTIALS_KEY = "zeevan_biometric_credentials";
const OPT_IN_KEY = "zeevan_biometric_opt_in";

export async function isBiometricLoginAvailable() {
  if (Platform.OS === "web") return false;
  try {
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const optIn = await SecureStore.getItemAsync(OPT_IN_KEY);
    const creds = await SecureStore.getItemAsync(CREDENTIALS_KEY);
    return Boolean(compatible && enrolled && optIn === "1" && creds);
  } catch {
    return false;
  }
}

export async function getBiometricLabel() {
  if (Platform.OS === "web") return "Biometrics";
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return Platform.OS === "ios" ? "Face ID" : "Face unlock";
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return Platform.OS === "ios" ? "Touch ID" : "Fingerprint";
    }
  } catch {
    /* noop */
  }
  return "Biometrics";
}

/**
 * @returns {{ email: string, password: string } | null}
 */
export async function authenticateWithBiometrics() {
  if (Platform.OS === "web") return null;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Sign in",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });
    if (!result.success) return null;
    const raw = await SecureStore.getItemAsync(CREDENTIALS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.email || !parsed?.password) return null;
    return { email: parsed.email, password: parsed.password };
  } catch {
    return null;
  }
}

export async function saveBiometricCredentials({ email, password }) {
  if (Platform.OS === "web") return false;
  try {
    await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify({ email, password }));
    await SecureStore.setItemAsync(OPT_IN_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

export async function clearBiometricCredentials() {
  if (Platform.OS === "web") return;
  try {
    await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
    await SecureStore.deleteItemAsync(OPT_IN_KEY);
  } catch {
    /* noop */
  }
}

export async function promptBiometricOptInAfterLogin({ email, password }) {
  if (Platform.OS === "web") return;
  try {
    const optIn = await SecureStore.getItemAsync(OPT_IN_KEY);
    if (optIn === "1") return;
  } catch {
    return;
  }
  try {
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible || !enrolled) return;
    const label = await getBiometricLabel();
    const { Alert } = require("react-native");
    return new Promise((resolve) => {
      Alert.alert(
        `Use ${label} for future sign-ins?`,
        "Your credentials are stored securely on this device only.",
        [
          { text: "Not now", style: "cancel", onPress: () => resolve(false) },
          {
            text: "Enable",
            onPress: async () => {
              await saveBiometricCredentials({ email, password });
              resolve(true);
            },
          },
        ]
      );
    });
  } catch {
    return false;
  }
}
