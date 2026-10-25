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
import {
  isValidEmail,
  normalizeEmail,
  validateRegisterName,
  validateRegisterPassword,
} from "../utils/authValidation";
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
  const [badField, setBadField] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);
  const { registerWithCredentials } = useAuth();
  const { showToast } = useToast();
  const { useAuthSplit } = useKankregLayout();
  const insets = useSafeAreaInsets();
  const split = useAuthSplit && Platform.OS === "web";

  const oauthReady = isGoogleSignInConfigured() || isAppleSignInConfigured();

  const clearError = () => {
    if (error) setError("");
    if (badField) setBadField("");
  };

  const fail = (field, message) => {
    setError(message);
    setBadField(field);
  };

  const handleRegister = async () => {
    const nameErr = validateRegisterName(name);
    if (nameErr) return fail("name", nameErr);
    const em = normalizeEmail(email);
    if (!em) return fail("email", "Please enter your email.");
    if (!isValidEmail(em)) return fail("email", "Please enter a valid email address.");
    const passErr = validateRegisterPassword(password);
    if (passErr) return fail("password", passErr);
    if (password !== confirmPassword) return fail("confirm", "Passwords do not match.");
    try {
      setIsSubmitting(true);
      setError("");
      setBadField("");
      const nextUser = await registerWithCredentials({
        name: name.trim().replace(/\s+/g, " "),
        email: em,
        password,
      });
      showToast({ type: "success", title: "Account created", message: "Welcome to Zeevan.", duration: 2400 });
      await resetNavigationAfterAuth(navigation, nextUser);
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
      compact={!split}
      socialSlot={
        oauthReady ? (
          <AuthSocialButtons onSuccess={(user) => resetNavigationAfterAuth(navigation, user)} />
        ) : null
      }
      footerSlot={<AuthGuestLink onPress={() => navigation.navigate("Home")} />}
    >
      <AuthInput
        label={AUTH_UI.fields.name.label}
        placeholder={AUTH_UI.fields.name.placeholder}
        value={name}
        onChangeText={(t) => {
          setName(t);
          clearError();
        }}
        icon="person-outline"
        invalid={badField === "name"}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <AuthInput
        ref={emailRef}
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
        label={AUTH_UI.fields.newPassword.label}
        placeholder={AUTH_UI.fields.newPassword.placeholder}
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          clearError();
        }}
        icon="lock-closed-outline"
        secure
        invalid={badField === "password"}
        autoCapitalize="none"
        textContentType="newPassword"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => confirmRef.current?.focus()}
      />
      <AuthInput
        ref={confirmRef}
        label={AUTH_UI.fields.confirmPassword.label}
        placeholder={AUTH_UI.fields.confirmPassword.placeholder}
        value={confirmPassword}
        onChangeText={(t) => {
          setConfirmPassword(t);
          clearError();
        }}
        icon="shield-checkmark-outline"
        secure
        invalid={badField === "confirm"}
        autoCapitalize="none"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={handleRegister}
      />
      {error ? (
        <Animated.View entering={AUTH_PANEL_IN} exiting={panelOut}>
          <PremiumErrorBanner severity="error" message={error} compact />
        </Animated.View>
      ) : null}
      <AuthButton
        label={isSubmitting ? AUTH_UI.creating : AUTH_UI.registerCta}
        onPress={handleRegister}
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
            artSubtitle={AUTH_UI.registerSubtitle}
            form={formBody}
            styles={styles}
            mode="register"
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
