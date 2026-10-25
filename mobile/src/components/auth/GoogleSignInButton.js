import React, { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { AUTH_UI } from "../../content/appContent";
import AuthButton from "./AuthButton";
import {
  isGoogleSignInConfigured,
  useGoogleIdTokenAuthRequest,
} from "../../services/oauthSignIn";

function GoogleSignInButtonInner({ onSuccess, busy, setBusy, setError, style }) {
  const { loginWithGoogle } = useAuth();
  const [request, response, promptGoogle] = useGoogleIdTokenAuthRequest();

  useEffect(() => {
    if (response?.type !== "success") return;
    const idToken = response.params?.id_token;
    if (!idToken) return;
    (async () => {
      try {
        setBusy("google");
        setError("");
        const user = await loginWithGoogle({ idToken });
        onSuccess?.(user);
      } catch (e) {
        setError(e.message || "Google sign-in failed.");
      } finally {
        setBusy("");
      }
    })();
  }, [response, loginWithGoogle, onSuccess, setBusy, setError]);

  return (
    <AuthButton
      variant="secondary"
      label={AUTH_UI.googleLabel}
      icon="logo-google"
      loading={busy === "google"}
      disabled={Boolean(busy) || !request}
      onPress={() => promptGoogle()}
      style={style}
    />
  );
}

/** Renders only when Google OAuth client IDs exist for this platform. */
export default function GoogleSignInButton(props) {
  if (!isGoogleSignInConfigured()) {
    return null;
  }
  return <GoogleSignInButtonInner {...props} />;
}
