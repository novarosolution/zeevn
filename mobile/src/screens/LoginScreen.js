import React, { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import KankregScrollPage from "../components/kankreg/KankregScrollPage";
import CustomerScreenShell from "../components/CustomerScreenShell";
import AuthScreenBody from "../components/auth/AuthScreenBody";
import AuthFormShell from "../components/auth/AuthFormShell";
import AuthSocialButtons from "../components/auth/AuthSocialButtons";
import AuthInput from "../components/auth/AuthInput";
import AuthButton from "../components/auth/AuthButton";
import AuthGuestLink from "../components/auth/AuthGuestLink";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { AUTH_UI } from "../content/appContent";
import { useKankregLayout } from "../theme/kankregBreakpoints";
import { panelOut } from "../theme/motion";
import { AUTH_PANEL_IN } from "../components/auth/authMotion";
import { adminScrollPaddingBottom, customerScrollFill } from "../theme/screenLayout";
import { spacing } from "../theme/tokens";
import { normalizeEmail, validateLoginEmail, validateLoginPassword } from "../utils/authValidation";
import PremiumErrorBanner from "../components/ui/PremiumErrorBanner";
import { resetNavigationAfterAuth } from "../navigation/postAuthNavigation";
import {
  isAppleSignInConfigured,
  isGoogleSignInConfigured,
} from "../services/oauthSignIn";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [badField, setBadField] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordRef = useRef(null);
  const { loginWithCredentials } = useAuth();
  const { showToast } = useToast();
  const { useAuthSplit } = useKankregLayout();
  const insets = useSafeAreaInsets();
  const split = useAuthSplit && Platform.OS === "web";

  const oauthReady = isGoogleSignInConfigured() || isAppleSignInConfigured();

  const clearError = () => {
    if (error) setError("");
    if (badField) setBadField("");
  };

  const handleLogin = async () => {
    const emailErr = validateLoginEmail(email);
    if (emailErr) {
      setError(emailErr);
      setBadField("email");
      return;
    }
    const passErr = validateLoginPassword(password);
    if (passErr) {
      setError(passErr);
      setBadField("password");
      return;
    }
    try {
      setIsSubmitting(true);
      setError("");
      setBadField("");
      const nextUser = await loginWithCredentials({ email: normalizeEmail(email), password });
      showToast({ type: "success", title: "Welcome back", message: "You're signed in.", duration: 2200 });
      await resetNavigationAfterAuth(navigation, nextUser);
    } catch (err) {
      setError(err.message || "Unable to login. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const form = (
    <AuthFormShell
      navigation={navigation}
      activeRoute="Login"
      title={AUTH_UI.loginTitle}
      subtitle={AUTH_UI.loginSubtitle}
      formEyebrow={AUTH_UI.loginFormEyebrow}
      compact={!split}
      socialSlot={
        oauthReady ? (
          <AuthSocialButtons onSuccess={(user) => resetNavigationAfterAuth(navigation, user)} />
        ) : null
      }
      footerSlot={<AuthGuestLink onPress={() => navigation.navigate("Home")} />}
    >
      <AuthInput
        label={AUTH_UI.fields.email.label}
        placeholder={AUTH_UI.fields.email.placeholder}
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          clearError();
        }}
        icon="mail-outline"
        invalid={badField === "email"}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <AuthInput
        ref={passwordRef}
        label={AUTH_UI.fields.password.label}
        placeholder={AUTH_UI.fields.password.placeholder}
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          clearError();
        }}
        icon="lock-closed-outline"
        secure
        invalid={badField === "password"}
        autoCapitalize="none"
        autoComplete="password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={handleLogin}
      />
      {error ? (
        <Animated.View entering={AUTH_PANEL_IN} exiting={panelOut}>
          <PremiumErrorBanner severity="error" message={error} compact />
        </Animated.View>
      ) : null}
      <AuthButton
        label={isSubmitting ? AUTH_UI.signingIn : AUTH_UI.loginCta}
        onPress={handleLogin}
        loading={isSubmitting}
        style={styles.primaryCta}
      />
    </AuthFormShell>
  );

  return (
    <CustomerScreenShell style={styles.screen} topAccent={false}>
      <KeyboardAvoidingView style={customerScrollFill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <KankregScrollPage
          scrollVariant="auth"
          showFooter={false}
          flushNativeGutter={Platform.OS !== "web"}
          flushWebGutter={!useAuthSplit}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            Platform.OS !== "web"
              ? { flexGrow: 1, paddingBottom: adminScrollPaddingBottom(insets), paddingHorizontal: 0, paddingTop: 0 }
              : !useAuthSplit
                ? { flexGrow: 1, paddingBottom: spacing.xl, paddingTop: 0 }
                : { paddingBottom: spacing.xxl + spacing.lg }
          }
          keyboardShouldPersistTaps="handled"
        >
          <AuthScreenBody
            artSubtitle={AUTH_UI.loginSubtitle}
            form={form}
            styles={styles}
            mode="login"
            navigation={navigation}
          />
        </KankregScrollPage>
      </KeyboardAvoidingView>
    </CustomerScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  card: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },
  cardWebInline: {
    maxWidth: "100%",
    borderWidth: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: 0,
    ...Platform.select({ web: { boxShadow: "none" }, default: {} }),
  },
  cardWebStack: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  primaryCta: { marginTop: 8 },
  revealFill: { width: "100%" },
});
