import React, { useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { AUTH_UI } from "../../content/appContent";
import { useStoreTheme } from "../../theme/storefront";
import PremiumErrorBanner from "../ui/PremiumErrorBanner";
import AuthButton from "./AuthButton";
import GoogleSignInButton from "./GoogleSignInButton";
import {
  isAppleSignInConfigured,
  isGoogleSignInConfigured,
  signInWithAppleNative,
} from "../../services/oauthSignIn";

/** Google / Apple sign-in side by side — live when configured, dimmed placeholders otherwise. */
export default function AuthSocialButtons({ onSuccess }) {
  const { loginWithApple } = useAuth();
  const { c, type } = useStoreTheme();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const googleLive = isGoogleSignInConfigured();
  const appleLive = isAppleSignInConfigured();
  const showAppleSlot = Platform.OS === "ios" || Platform.OS === "web";

  const runApple = async () => {
    if (!appleLive) return;
    try {
      setBusy("apple");
      setError("");
      const { identityToken, fullName } = await signInWithAppleNative();
      const user = await loginWithApple({ identityToken, fullName });
      onSuccess?.(user);
    } catch (e) {
      if (e.code === "ERR_REQUEST_CANCELED") return;
      setError(e.message || "Apple sign-in failed.");
    } finally {
      setBusy("");
    }
  };

  return (
    <View style={styles.wrap}>
      {error ? <PremiumErrorBanner severity="error" message={error} compact /> : null}
      <View style={styles.row}>
        {googleLive ? (
          <GoogleSignInButton onSuccess={onSuccess} busy={busy} setBusy={setBusy} setError={setError} style={styles.cell} />
        ) : (
          <AuthButton
            variant="secondary"
            label={AUTH_UI.googleLabel}
            icon="logo-google"
            disabled
            accessibilityHint={AUTH_UI.socialDisabledHint}
            style={styles.cell}
          />
        )}
        {showAppleSlot ? (
          <AuthButton
            variant="secondary"
            label={AUTH_UI.appleLabel}
            icon="logo-apple"
            loading={busy === "apple"}
            disabled={!appleLive || Boolean(busy)}
            accessibilityHint={appleLive ? undefined : AUTH_UI.socialDisabledHint}
            onPress={runApple}
            style={styles.cell}
          />
        ) : null}
      </View>
      {!googleLive && !appleLive ? (
        <Text style={[type.ui(12.5, "regular", c.inkMute), styles.hint]}>{AUTH_UI.socialDisabledHint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", gap: 10 },
  row: { flexDirection: "row", gap: 12 },
  cell: { flex: 1 },
  hint: { textAlign: "center", lineHeight: 18 },
});
