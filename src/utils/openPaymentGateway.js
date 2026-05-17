import { Alert, Linking, Platform } from "react-native";
import { PAYMENT_SCREEN, RAZORPAY_PAY_URL } from "../content/appContent";

/**
 * Opens the payment gateway hosted page (Razorpay/Stripe).
 *
 * **PCI:** Never collect or store full card numbers in the app — redirect only.
 */
export function openPaymentGatewayHostedPage({ onCancel } = {}) {
  const url = String(RAZORPAY_PAY_URL || "").trim();
  if (!url) {
    Alert.alert(PAYMENT_SCREEN.gatewayMissingTitle, PAYMENT_SCREEN.gatewayMissingBody);
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    Alert.alert(PAYMENT_SCREEN.gatewayRedirectTitle, PAYMENT_SCREEN.gatewayRedirectBody, [
      {
        text: PAYMENT_SCREEN.gatewayCancelCta,
        style: "cancel",
        onPress: () => {
          onCancel?.();
          resolve(false);
        },
      },
      {
        text: PAYMENT_SCREEN.gatewayContinueCta,
        onPress: async () => {
          try {
            const can = await Linking.canOpenURL(url);
            if (!can && Platform.OS !== "web") {
              Alert.alert(PAYMENT_SCREEN.gatewayMissingTitle, PAYMENT_SCREEN.gatewayMissingBody);
              resolve(false);
              return;
            }
            await Linking.openURL(url);
            resolve(true);
          } catch {
            Alert.alert(PAYMENT_SCREEN.gatewayMissingTitle, PAYMENT_SCREEN.gatewayMissingBody);
            resolve(false);
          }
        },
      },
    ]);
  });
}
