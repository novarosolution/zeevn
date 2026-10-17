import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import KankregScrollPage from "../components/kankreg/KankregScrollPage";
import CustomerScreenShell from "../components/CustomerScreenShell";
import AuthScreenBody from "../components/auth/AuthScreenBody";
import AuthFormShell from "../components/auth/AuthFormShell";
import AuthSocialButtons from "../components/auth/AuthSocialButtons";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { AUTH_UI } from "../content/appContent";
import { useKankregLayout } from "../theme/kankregBreakpoints";
import { KANKREG_PALETTE } from "../theme/kankregWeb";
import { useTheme } from "../context/ThemeContext";
import { adminScrollPaddingBottom, customerScrollFill } from "../theme/screenLayout";
import { fonts, spacing, typography } from "../theme/tokens";
import { normalizeEmail, validateLoginEmail, validateLoginPassword } from "../utils/authValidation";
import PremiumButton from "../components/ui/PremiumButton";
import PremiumInput from "../components/ui/PremiumInput";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loginWithCredentials } = useAuth();
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const { useAuthSplit } = useKankregLayout();
  const styles = useMemo(() => createLoginStyles(), []);
  const insets = useSafeAreaInsets();

  const oauthReady = isGoogleSignInConfigured() || isAppleSignInConfigured();

  const handleLogin = async () => {
    const emailErr = validateLoginEmail(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    const passErr = validateLoginPassword(password);
    if (passErr) {
      setError(passErr);
      return;
    }
    try {
      setIsSubmitting(true);
      setError("");
      await loginWithCredentials({ email: normalizeEmail(email), password });
      showToast({ type: "success", title: "Welcome back", message: "You're signed in.", duration: 2200 });
      await resetNavigationAfterAuth(navigation);
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
      compact={!useAuthSplit}
      socialSlot={
        oauthReady ? (
          <AuthSocialButtons onSuccess={() => resetNavigationAfterAuth(navigation)} />
        ) : null
      }
      footerSlot={
        <Pressable
          onPress={() => navigation.navigate("Home")}
          style={styles.guestLink}
          accessibilityRole="link"
          accessibilityLabel={AUTH_UI.continueGuest}
        >
          <Text style={[styles.guestText, { color: isDark ? KANKREG_PALETTE.goldBright : KANKREG_PALETTE.inkSoft }]}>
            {AUTH_UI.continueGuest}
          </Text>
        </Pressable>
      }
    >
      <PremiumInput
        label="Email"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          if (error) setError("");
        }}
        iconLeft="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        tone="warm"
      />
      <PremiumInput
        label="Password"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          if (error) setError("");
        }}
        iconLeft="lock-closed-outline"
        secureTextEntry
        passwordToggle
        autoCapitalize="none"
        autoComplete="password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={handleLogin}
        tone="warm"
      />
      {error ? (
        <View style={styles.errorWrap}>
          <PremiumErrorBanner severity="error" message={error} compact />
        </View>
      ) : null}
      <PremiumButton
        label={isSubmitting ? "Signing in…" : AUTH_UI.loginCta}
        onPress={handleLogin}
        iconLeft="log-in-outline"
        loading={isSubmitting}
        disabled={isSubmitting}
        size="lg"
        fullWidth
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
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            Platform.OS !== "web"
              ? { flexGrow: 1, paddingBottom: adminScrollPaddingBottom(insets), paddingHorizontal: 0 }
              : { paddingBottom: spacing.xxl + spacing.lg }
          }
          keyboardShouldPersistTaps="handled"
        >
          <AuthScreenBody artSubtitle={AUTH_UI.loginSubtitle} form={form} styles={styles} mode="login" />
        </KankregScrollPage>
      </KeyboardAvoidingView>
    </CustomerScreenShell>
  );
}

function createLoginStyles() {
  return StyleSheet.create({
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
    errorWrap: { marginTop: spacing.sm },
    primaryCta: { marginTop: spacing.md },
    revealFill: { width: "100%" },
    guestLink: {
      paddingVertical: spacing.sm,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    guestText: {
      fontFamily: fonts.medium,
      fontSize: typography.bodySmall,
      textAlign: "center",
      textDecorationLine: "underline",
      textDecorationColor: "rgba(92, 104, 52, 0.35)",
    },
  });
}
