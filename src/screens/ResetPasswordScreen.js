import React, { useState } from "react";
import { Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import AuthShell from "../components/auth/AuthShell";
import AuthErrorCard from "../components/auth/AuthErrorCard";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { AUTH_SCREEN } from "../content/appContent";
import { resetPasswordWithTokenRequest } from "../services/authService";
import { useTheme } from "../context/ThemeContext";
import { fonts } from "../theme/tokens";

const copy = AUTH_SCREEN.reset;

export default function ResetPasswordScreen({ navigation }) {
  const route = useRoute();
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const email = String(route.params?.email || "").trim();
  const token = String(route.params?.token || "").trim();

  const handleSubmit = async () => {
    setError("");
    if (!email || !token) {
      setError(copy.missingParams);
      return;
    }
    if (password.length < 6) {
      setError(copy.passwordTooShort);
      return;
    }
    if (password !== confirm) {
      setError(copy.passwordMismatch);
      return;
    }
    try {
      setBusy(true);
      await resetPasswordWithTokenRequest({ email, token, newPassword: password });
      setDone(true);
    } catch (err) {
      setError(err?.message || copy.error);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <AuthShell
        navigation={navigation}
        formTitle={copy.successTitle}
        formSubtitle={copy.successBody}
        showSocialRow={false}
        bareForm
        footerLabel="Ready?"
        footerLinkLabel={copy.signInCta}
        footerLinkOnPress={() => navigation.navigate("Login")}
      >
        <Button label={copy.signInCta} variant="primary" size="lg" fullWidth onPress={() => navigation.navigate("Login")} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      navigation={navigation}
      formTitle={copy.formTitle}
      formSubtitle={copy.formSubtitle}
      showSocialRow={false}
      bareForm
    >
      <View style={{ gap: SPACING.md }}>
        {error ? <AuthErrorCard message={error} /> : null}
        <Input label={copy.newPasswordLabel} value={password} onChangeText={setPassword} secureTextEntry passwordToggle required />
        <Input label={copy.confirmPasswordLabel} value={confirm} onChangeText={setConfirm} secureTextEntry passwordToggle required />
        <Button label={copy.submitCta} variant="primary" size="lg" fullWidth loading={busy} onPress={handleSubmit} />
      </View>
    </AuthShell>
  );
}
