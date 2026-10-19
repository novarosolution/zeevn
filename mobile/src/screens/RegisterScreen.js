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
import {
  isValidEmail,
  normalizeEmail,
  validateRegisterName,
  validateRegisterPassword,
} from "../utils/authValidation";
import PremiumButton from "../components/ui/PremiumButton";
import PremiumInput from "../components/ui/PremiumInput";
import PremiumErrorBanner from "../components/ui/PremiumErrorBanner";
import { resetNavigationAfterAuth } from "../navigation/postAuthNavigation";
import {
  isAppleSignInConfigured,
  isGoogleSignInConfigured,
} from "../services/oauthSignIn";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { registerWithCredentials } = useAuth();
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const { useAuthSplit } = useKankregLayout();
  const styles = useMemo(() => createRegisterStyles(), []);
  const insets = useSafeAreaInsets();

  const oauthReady = isGoogleSignInConfigured() || isAppleSignInConfigured();

  const handleRegister = async () => {
    const nameErr = validateRegisterName(name);
    if (nameErr) {
      setError(nameErr);
      return;
    }
    const em = normalizeEmail(email);
    if (!em) {
      setError("Please enter your email.");
      return;
    }
    if (!isValidEmail(em)) {
      setError("Please enter a valid email address.");
      return;
    }
    const passErr = validateRegisterPassword(password);
    if (passErr) {
      setError(passErr);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    try {
      setIsSubmitting(true);
      setError("");
      await registerWithCredentials({
        name: name.trim().replace(/\s+/g, " "),
        email: em,
        password,
      });
      showToast({ type: "success", title: "Account created", message: "Welcome to Zeevan.", duration: 2400 });
      await resetNavigationAfterAuth(navigation);
    } catch (err) {
      setError(err.message || "Unable to register. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formBody = (
    <AuthFormShell
      navigation={navigation}
      activeRoute="Register"
      title={AUTH_UI.registerTitle}
      subtitle={AUTH_UI.registerSubtitle}
      formEyebrow={AUTH_UI.registerFormEyebrow}
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
        label="Full name"
        value={name}
        onChangeText={(t) => {
          setName(t);
          if (error) setError("");
        }}
        iconLeft="person-outline"
        autoCapitalize="words"
        tone="warm"
      />
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
        autoComplete="email"
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
        tone="warm"
      />
      <PremiumInput
        label="Confirm password"
        value={confirmPassword}
        onChangeText={(t) => {
          setConfirmPassword(t);
          if (error) setError("");
        }}
        iconLeft="lock-closed-outline"
        secureTextEntry
        passwordToggle
        autoCapitalize="none"
        returnKeyType="done"
        onSubmitEditing={handleRegister}
        tone="warm"
      />
      {error ? (
        <View style={styles.errorWrap}>
          <PremiumErrorBanner severity="error" message={error} compact />
        </View>
      ) : null}
      <PremiumButton
        label={isSubmitting ? "Creating…" : AUTH_UI.registerCta}
        onPress={handleRegister}
        iconLeft="person-add-outline"
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
              : !useAuthSplit
                ? { flexGrow: 1, paddingBottom: spacing.xl, paddingTop: 0 }
                : { paddingBottom: spacing.xxl + spacing.lg }
          }
          keyboardShouldPersistTaps="handled"
        >
          <AuthScreenBody
            artSubtitle={AUTH_UI.registerSubtitle}
            form={formBody}
            styles={styles}
            mode="register"
          />
        </KankregScrollPage>
      </KeyboardAvoidingView>
    </CustomerScreenShell>
  );
}

function createRegisterStyles() {
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
