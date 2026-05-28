import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import AuthShell from "../components/auth/AuthShell";
import AuthCheckbox from "../components/auth/AuthCheckbox";
import AuthBrassIconEntrance from "../components/auth/AuthBrassIconEntrance";
import AuthContentSwap from "../components/auth/AuthContentSwap";
import AuthErrorCard from "../components/auth/AuthErrorCard";
import { navigateAfterAuth } from "../components/auth/authNavigation";
import PasswordStrengthMeter from "../components/auth/PasswordStrengthMeter";
import useAuthSubmit from "../hooks/useAuthSubmit";
import useAuthScreenLifecycle from "../hooks/useAuthScreenLifecycle";
import AuthRateLimitCard from "../components/auth/AuthRateLimitCard";
import { getAuthCaptchaToken } from "../utils/authCaptcha";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Toast from "../components/ui/Toast";
import { APP_DISPLAY_NAME, AUTH_SCREEN, fillPlaceholders } from "../content/appContent";
import { FONT_DISPLAY_SEMI } from "../theme/customerAlchemy";
import { fonts, spacing } from "../theme/tokens";
import {
  isValidEmail,
  normalizeEmail,
  validateRegisterName,
  validateRegisterPassword,
} from "../utils/authValidation";
import { getPasswordStrengthScore } from "../utils/passwordStrength";
import { headingA11yProps } from "../utils/a11y";
import { sendVerificationEmailRequest } from "../services/userService";
import * as Linking from "expo-linking";

const copy = AUTH_SCREEN.register;
const shared = AUTH_SCREEN.shared;

const LEGAL_SCREENS = new Set(["Terms", "Privacy"]);

function openLegalDoc(navigation, screenName) {
  if (!LEGAL_SCREENS.has(screenName)) return;
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const { origin, pathname } = window.location;
    const basePath = pathname.replace(/\/(Terms|Privacy)\/?$/i, "").replace(/\/$/, "");
    const safePath = `${basePath}/${screenName}`;
    if (!safePath.startsWith("/") || safePath.includes("//")) return;
    window.open(`${origin}${safePath}`, "_blank", "noopener,noreferrer");
    return;
  }
  navigation.navigate(screenName);
}

function RegisterSuccess({
  email,
  resendSeconds,
  onResend,
  onContinue,
  devLink,
  resendBusy,
}) {
  const { semanticPalette, TYPE, SPACING } = useTheme();

  return (
    <View style={{ alignItems: "center", gap: SPACING.lg, paddingVertical: SPACING.xl }}>
      <AuthBrassIconEntrance name="mail" size={48} trigger={email} />
      <Text {...headingA11yProps(1)} style={{ fontFamily: FONT_DISPLAY_SEMI, fontSize: 24, lineHeight: 30, color: semanticPalette.ink, textAlign: "center" }}>
        {copy.successTitle}
      </Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, lineHeight: TYPE.body.lineHeight, color: semanticPalette.inkSoft, textAlign: "center" }}>
        {fillPlaceholders(copy.successBody, { email })}
      </Text>
      {devLink ? (
        <Text selectable style={{ fontFamily: fonts.regular, fontSize: 11, lineHeight: 16, color: semanticPalette.inkMuted, textAlign: "center" }}>
          {copy.resendEmail}
          {"\n"}
          {devLink}
        </Text>
      ) : null}
      <View style={{ width: "100%", gap: SPACING.sm }}>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          label={copy.openMailApp}
          onPress={() => Linking.openURL(`mailto:${email}`).catch(() => Linking.openURL("mailto:").catch(() => {}))}
        />
        <Button
          variant="ghost"
          size="md"
          fullWidth
          label={resendSeconds > 0 ? fillPlaceholders(copy.resendCooldown, { seconds: String(resendSeconds) }) : copy.resendEmail}
          onPress={onResend}
          disabled={resendSeconds > 0 || resendBusy}
          loading={resendBusy}
        />
        <Button variant="primary" size="md" fullWidth label={copy.useDifferentEmail} onPress={onContinue} />
      </View>
    </View>
  );
}

export default function RegisterScreen({ navigation }) {
  const route = useRoute();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailConflict, setEmailConflict] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [welcomeToastVisible, setWelcomeToastVisible] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);
  const [resendBusy, setResendBusy] = useState(false);
  const [verificationDevLink, setVerificationDevLink] = useState("");
  const [termsHover, setTermsHover] = useState(null);
  const [footerLinkHover, setFooterLinkHover] = useState(false);
  const { registerWithCredentials, token } = useAuth();
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const {
    run: runSubmit,
    isSubmitting,
    slowHint,
    networkError,
    timeoutError,
    serverError,
    rateLimitUntil,
    isRateLimited,
    clearErrors: clearSubmitErrors,
  } = useAuthSubmit();

  const lifecycle = useAuthScreenLifecycle({
    navigation,
    screen: "register",
    onDraftLoaded: (draft) => {
      if (draft?.name) setName(draft.name);
      if (draft?.email) setEmail(draft.email);
    },
    toastMessage: shared.alreadySignedInToast,
  });

  useEffect(() => {
    lifecycle.persistDraft({ name, email });
  }, [email, lifecycle, name]);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const strengthScore = useMemo(() => getPasswordStrengthScore(password), [password]);

  const showFieldError = useCallback((field) => submitAttempted || touched[field], [submitAttempted, touched]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        title: {
          fontFamily: FONT_DISPLAY_SEMI,
          fontSize: 28,
          lineHeight: 34,
          fontWeight: "500",
          color: semanticPalette.ink,
        },
        subtitle: {
          marginTop: 4,
          marginBottom: spacing.lg,
          fontFamily: fonts.regular,
          fontSize: 14,
          lineHeight: 20,
          color: semanticPalette.inkSoft,
        },
        stack: {
          gap: spacing.md,
        },
        marketing: {
          marginTop: spacing.md,
        },
        marketingLabel: {
          flex: 1,
          fontFamily: fonts.regular,
          fontSize: 12,
          lineHeight: 17,
          color: semanticPalette.inkSoft,
        },
        terms: {
          marginTop: spacing.sm,
          fontFamily: fonts.regular,
          fontSize: 12,
          lineHeight: 17,
          color: semanticPalette.inkSoft,
        },
        termsLink: {
          fontFamily: fonts.medium,
          fontSize: 12,
          lineHeight: 17,
          color: semanticPalette.ink,
          textDecorationLine: "underline",
        },
        emailConflictRow: {
          marginTop: 4,
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 4,
        },
        emailConflictText: {
          fontFamily: fonts.regular,
          fontSize: 12,
          lineHeight: 16,
          color: semanticPalette.sale,
        },
        emailConflictLink: {
          fontFamily: fonts.semibold,
          fontSize: 12,
          lineHeight: 16,
          color: semanticPalette.ink,
          textDecorationLine: "underline",
        },
        ctaBlock: {
          marginTop: spacing.lg,
        },
        footerRow: {
          marginTop: spacing.xl,
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: 4,
        },
        footerLead: {
          fontFamily: fonts.regular,
          fontSize: 13,
          lineHeight: 18,
          color: semanticPalette.inkSoft,
        },
        footerLink: {
          flexDirection: "row",
          alignItems: "center",
          gap: 2,
        },
        footerLinkText: {
          fontFamily: fonts.semibold,
          fontSize: 13,
          lineHeight: 18,
          color: semanticPalette.ink,
          textDecorationLine: "underline",
        },
      }),
    [
      TYPE.micro,
      SPACING.sm,
      footerLinkHover,
      semanticPalette.accent,
      semanticPalette.ink,
      semanticPalette.inkSoft,
      semanticPalette.inkSoft,
      semanticPalette.lineSoft,
      semanticPalette.sale,
      termsHover,
    ]
  );

  const nameValid = useMemo(() => !validateRegisterName(name), [name]);
  const emailValid = useMemo(() => isValidEmail(normalizeEmail(email)), [email]);
  const canSubmit = nameValid && emailValid && strengthScore >= 2;

  const clearServerErrors = useCallback(() => {
    clearSubmitErrors();
    setEmailConflict(false);
  }, [clearSubmitErrors]);

  useEffect(() => {
    if (!showSuccess || resendSeconds <= 0) return undefined;
    const id = setInterval(() => {
      setResendSeconds((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [showSuccess, resendSeconds]);

  const validateFields = useCallback(() => {
    let ok = true;
    const nameErr = validateRegisterName(name);
    if (nameErr) {
      setNameError(nameErr);
      ok = false;
    } else {
      setNameError("");
    }

    const em = normalizeEmail(email);
    if (!em) {
      setEmailError(shared.requiredField);
      ok = false;
    } else if (!isValidEmail(em)) {
      setEmailError(shared.invalidEmail);
      ok = false;
    } else {
      setEmailError("");
    }

    const passErr = validateRegisterPassword(password);
    if (passErr) {
      setPasswordError(passErr);
      ok = false;
    } else if (strengthScore < 2) {
      setPasswordError(copy.strengthLabels[1] || shared.passwordTooShort);
      ok = false;
    } else {
      setPasswordError("");
    }

    return ok;
  }, [email, name, password, strengthScore]);

  const handleRegister = useCallback(async () => {
    setSubmitAttempted(true);
    clearServerErrors();
    if (!validateFields()) return;

    const em = normalizeEmail(email);
    const trimmedName = name.trim().replace(/\s+/g, " ");

    await runSubmit(async (signal) => {
      try {
        const captchaToken = await getAuthCaptchaToken("register");
        const result = await registerWithCredentials({
          name: trimmedName,
          email: em,
          password,
          remember: true,
          signal,
          captchaToken,
        });

        lifecycle.clearDraft();
        setSubmittedEmail(em);
        setVerificationDevLink(typeof result?.devLink === "string" ? result.devLink : "");
        setShowSuccess(true);
        setResendSeconds(60);
        setWelcomeToastVisible(true);
        return true;
      } catch (err) {
        if (err?.status === 409) {
          setEmailConflict(true);
          setEmailError(copy.emailExists);
          return null;
        }
        throw err;
      }
    });
  }, [
    clearServerErrors,
    email,
    lifecycle,
    name,
    navigation,
    password,
    registerWithCredentials,
    route,
    runSubmit,
    validateFields,
  ]);

  const handleResendVerification = useCallback(async () => {
    if (resendSeconds > 0 || resendBusy || !token) return;
    try {
      setResendBusy(true);
      const data = await sendVerificationEmailRequest(token);
      if (typeof data?.devLink === "string") setVerificationDevLink(data.devLink);
      setResendSeconds(60);
    } finally {
      setResendBusy(false);
    }
  }, [resendBusy, resendSeconds, token]);

  const handleContinueAfterSuccess = useCallback(() => {
    setShowSuccess(false);
    setWelcomeToastVisible(false);
    navigateAfterAuth(navigation, route);
  }, [navigation, route]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return undefined;
    const onKeyDown = (event) => {
      if (event.key !== "Enter" || event.defaultPrevented) return;
      const tag = event.target?.tagName?.toLowerCase?.();
      if (tag === "textarea" || tag === "button" || tag === "input") return;
      if (!canSubmit || isSubmitting) return;
      event.preventDefault();
      handleRegister();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [canSubmit, handleRegister, isSubmitting]);

  const footerLink = (
    <View style={styles.footerRow}>
      <Text style={styles.footerLead}>{copy.footerLabel}</Text>
      <Pressable
        accessibilityRole="link"
        onPress={() => navigation.navigate("Login")}
        style={styles.footerLink}
      >
        <Text style={styles.footerLinkText}>{copy.footerLink}</Text>
        <Ionicons name="chevron-forward" size={14} color={semanticPalette.ink} />
      </Pressable>
    </View>
  );

  return (
    <AuthShell variant="register" navigation={navigation} bareForm>
      <Toast
        visible={welcomeToastVisible}
        message={fillPlaceholders(copy.welcomeToast, { brand: APP_DISPLAY_NAME })}
        onDismiss={() => setWelcomeToastVisible(false)}
        durationMs={2400}
      />
      <Toast
        visible={lifecycle.toastVisible}
        message={lifecycle.toastMessage}
        onDismiss={() => lifecycle.setToastVisible(false)}
        durationMs={2400}
      />

      <AuthContentSwap
        showSuccess={showSuccess}
        footer={showSuccess ? null : footerLink}
        success={
          <RegisterSuccess
            email={submittedEmail}
            resendSeconds={resendSeconds}
            onResend={handleResendVerification}
            onContinue={handleContinueAfterSuccess}
            devLink={verificationDevLink}
            resendBusy={resendBusy}
          />
        }
        form={
          <>
            <Text {...headingA11yProps(1)} style={{ fontFamily: TYPE.serifFamily, ...TYPE.h1, color: semanticPalette.ink }}>
              {copy.formTitle}
            </Text>
            <Text style={{ marginTop: spacing.sm, marginBottom: spacing.lg, fontFamily: fonts.regular, ...TYPE.body, color: semanticPalette.inkSoft }}>
              {copy.formSubtitle}
            </Text>

            <View style={styles.stack}>
              <Input
                testID="register-name"
                label={copy.nameLabel}
                accessibilityLabel={copy.nameLabel}
                placeholder={copy.namePlaceholder}
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  if (nameError) setNameError("");
                  clearServerErrors();
                }}
                onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                errorText={showFieldError("name") && nameError ? nameError : undefined}
                iconLeft="person-outline"
                autoCapitalize="words"
                autoCorrect={false}
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => emailRef.current?.focus?.()}
                importantForAutofill="yes"
              />

              <View>
                <Input
                  testID="register-email"
                  inputRef={emailRef}
                  label={copy.emailLabel}
                  accessibilityLabel={copy.emailLabel}
                  placeholder={copy.emailPlaceholder}
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (emailError) setEmailError("");
                    clearServerErrors();
                  }}
                  onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                  errorText={showFieldError("email") && emailError ? emailError : undefined}
                  iconLeft="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => passwordRef.current?.focus?.()}
                  importantForAutofill="yes"
                />
                {emailConflict ? (
                  <View style={styles.emailConflictRow}>
                    <Text style={styles.emailConflictText}>{copy.emailExists}</Text>
                    <Pressable
                      accessibilityRole="link"
                      onPress={() => navigation.navigate("Login", { email: normalizeEmail(email) })}
                    >
                      <Text style={styles.emailConflictLink}>{copy.emailExistsSignIn}</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>

              <View>
                <Input
                  testID="register-password"
                  inputRef={passwordRef}
                  label={copy.passwordLabel}
                  accessibilityLabel={copy.passwordLabel}
                  placeholder={copy.passwordPlaceholder}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (passwordError) setPasswordError("");
                    clearServerErrors();
                  }}
                  onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                  errorText={showFieldError("password") && passwordError ? passwordError : undefined}
                  iconLeft="lock-closed-outline"
                  secureTextEntry
                  passwordToggle
                  passwordShowA11yLabel={copy.showPassword}
                  passwordHideA11yLabel={copy.hidePassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="go"
                  onSubmitEditing={handleRegister}
                  importantForAutofill="yes"
                />
                <PasswordStrengthMeter
                  password={password}
                  strengthLabels={copy.strengthLabels}
                  hint={copy.passwordHint}
                />
              </View>
            </View>

            <View style={styles.marketing}>
              <AuthCheckbox
                checked={marketingOptIn}
                onToggle={() => setMarketingOptIn((v) => !v)}
                label={copy.marketingOptIn}
                labelStyle={styles.marketingLabel}
              />
            </View>

            <Text style={styles.terms}>
              {copy.termsPrefix}{" "}
              <Text
                accessibilityRole="link"
                onPress={() => openLegalDoc(navigation, "Terms")}
                onHoverIn={() => Platform.OS === "web" && setTermsHover("terms")}
                onHoverOut={() => Platform.OS === "web" && setTermsHover(null)}
                style={[styles.termsLink, termsHover === "terms" && Platform.OS === "web" ? { textDecorationLine: "underline" } : null]}
              >
                {copy.termsLink}
              </Text>{" "}
              {copy.termsAnd}{" "}
              <Text
                accessibilityRole="link"
                onPress={() => openLegalDoc(navigation, "Privacy")}
                onHoverIn={() => Platform.OS === "web" && setTermsHover("privacy")}
                onHoverOut={() => Platform.OS === "web" && setTermsHover(null)}
                style={[styles.termsLink, termsHover === "privacy" && Platform.OS === "web" ? { textDecorationLine: "underline" } : null]}
              >
                {copy.privacyLink}
              </Text>
            </Text>

            <View style={styles.ctaBlock}>
              {rateLimitUntil ? <AuthRateLimitCard untilMs={rateLimitUntil} /> : null}
              {serverError && !rateLimitUntil ? <AuthErrorCard message={serverError} /> : null}
              {timeoutError ? (
                <AuthErrorCard message={shared.timeoutError} retryLabel={shared.retryCta} onRetry={handleRegister} />
              ) : null}
              {networkError && !timeoutError ? (
                <AuthErrorCard message={shared.networkError} retryLabel={shared.retryCta} onRetry={handleRegister} />
              ) : null}

              <Button
                variant="primary"
                size="lg"
                fullWidth
                label={copy.submitCta}
                loading={isSubmitting}
                loadingLabel={copy.submitLoading}
                onPress={handleRegister}
                disabled={!canSubmit || isSubmitting || isRateLimited}
              />
              {slowHint ? (
                <Text
                  style={{
                    marginTop: spacing.xs,
                    textAlign: "center",
                    fontFamily: fonts.regular,
                    fontSize: 12,
                    color: semanticPalette.inkSoft,
                  }}
                >
                  {shared.stillTrying}
                </Text>
              ) : null}
            </View>
          </>
        }
      />
    </AuthShell>
  );
}
