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
import * as Linking from "expo-linking";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import AuthShell from "../components/auth/AuthShell";
import AuthBrassIconEntrance from "../components/auth/AuthBrassIconEntrance";
import AuthCheckbox from "../components/auth/AuthCheckbox";
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

function RegisterVerificationSuccess({
  email,
  onOpenMail,
  onResend,
  onUseDifferentEmail,
  resendSeconds,
  entranceKey,
}) {
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const body = fillPlaceholders(copy.successBody, { email });

  return (
    <View style={{ alignItems: "center", gap: SPACING.lg, paddingVertical: SPACING.xl }}>
      <AuthBrassIconEntrance name="checkmark-circle" size={48} trigger={entranceKey} />
      <Text
        accessibilityRole="header"
        style={{
          fontFamily: FONT_DISPLAY_SEMI,
          fontSize: 24,
          lineHeight: 30,
          color: semanticPalette.ink,
          textAlign: "center",
        }}
      >
        {copy.successTitle}
      </Text>
      <Text
        style={{
          fontFamily: fonts.regular,
          fontSize: TYPE.body.fontSize,
          lineHeight: TYPE.body.lineHeight,
          color: semanticPalette.inkSoft,
          textAlign: "center",
          maxWidth: 360,
        }}
      >
        {body}
      </Text>
      <View style={{ width: "100%", gap: SPACING.sm }}>
        <Button variant="secondary" size="lg" fullWidth label={copy.openMailApp} onPress={onOpenMail} />
        <Pressable
          accessibilityRole="button"
          disabled={resendSeconds > 0}
          onPress={onResend}
          style={{ alignSelf: "center", paddingVertical: SPACING.xs }}
        >
          <Text
            style={{
              fontFamily: fonts.medium,
              fontSize: TYPE.small.fontSize,
              color: resendSeconds > 0 ? semanticPalette.inkMuted : semanticPalette.accent,
            }}
          >
            {resendSeconds > 0
              ? fillPlaceholders(copy.resendCooldown, { seconds: String(resendSeconds) })
              : copy.resendEmail}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={onUseDifferentEmail}
          style={{ alignSelf: "center", paddingVertical: SPACING.xs }}
        >
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: TYPE.small.fontSize,
              color: semanticPalette.inkSoft,
              textDecorationLine: "underline",
            }}
          >
            {copy.useDifferentEmail}
          </Text>
        </Pressable>
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
  const [verificationSent, setVerificationSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [welcomeToastVisible, setWelcomeToastVisible] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [termsHover, setTermsHover] = useState(null);
  const [footerLinkHover, setFooterLinkHover] = useState(false);
  const { registerWithCredentials } = useAuth();
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const {
    run: runSubmit,
    isSubmitting,
    slowHint,
    networkError,
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
          color: semanticPalette.inkMuted,
        },
        termsLink: {
          fontFamily: fonts.medium,
          fontSize: 12,
          lineHeight: 17,
          color: semanticPalette.accent,
          ...Platform.select({
            web: {
              textDecorationLine: termsHover ? "underline" : "none",
            },
            default: {},
          }),
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
          color: semanticPalette.accent,
          textDecorationLine: "underline",
        },
        ctaBlock: {
          marginTop: spacing.lg,
        },
        dividerWrap: {
          marginTop: spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          gap: SPACING.sm,
        },
        dividerHairline: {
          flex: 1,
          height: StyleSheet.hairlineWidth,
          backgroundColor: semanticPalette.lineSoft,
        },
        dividerLabel: {
          fontFamily: fonts.semibold,
          ...TYPE.micro,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          color: semanticPalette.inkMuted,
        },
        socialStack: {
          marginTop: spacing.sm,
          gap: spacing.sm,
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
          color: semanticPalette.accent,
          ...Platform.select({
            web: {
              textDecorationLine: footerLinkHover ? "underline" : "none",
            },
            default: {},
          }),
        },
      }),
    [
      TYPE.micro,
      SPACING.sm,
      footerLinkHover,
      semanticPalette.accent,
      semanticPalette.ink,
      semanticPalette.inkMuted,
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

        if (result.requiresEmailVerification) {
          setRegisteredEmail(em);
          setVerificationSent(true);
          setResendSeconds(60);
          lifecycle.clearDraft();
          return true;
        }

        lifecycle.clearDraft();
        setWelcomeToastVisible(true);
        setTimeout(() => {
          setWelcomeToastVisible(false);
          navigateAfterAuth(navigation, route);
        }, 1200);
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

  const handleUseDifferentEmail = useCallback(() => {
    setVerificationSent(false);
    setRegisteredEmail("");
    setResendSeconds(0);
    setEmail("");
    setEmailError("");
    setSubmitAttempted(false);
    clearServerErrors();
  }, [clearServerErrors]);

  useEffect(() => {
    if (!verificationSent || resendSeconds <= 0) return undefined;
    const id = setInterval(() => {
      setResendSeconds((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [verificationSent, resendSeconds]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return undefined;
    const onKeyDown = (event) => {
      if (verificationSent || event.key !== "Enter" || event.defaultPrevented) return;
      const tag = event.target?.tagName?.toLowerCase?.();
      if (tag === "textarea" || tag === "button") return;
      if (!canSubmit || isSubmitting) return;
      event.preventDefault();
      handleRegister();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [canSubmit, handleRegister, isSubmitting, verificationSent]);

  const socialProviders = useMemo(() => {
    const apple = {
      key: "apple",
      label: copy.socialApple,
      icon: <Ionicons name="logo-apple" size={18} color={semanticPalette.ink} />,
    };
    const google = {
      key: "google",
      label: copy.socialGoogle,
      icon: <Ionicons name="logo-google" size={18} color={semanticPalette.ink} />,
    };
    return Platform.OS === "ios" ? [apple, google] : [google, apple];
  }, [semanticPalette.ink]);

  const noopOAuth = () => {};

  const openMailApp = () => {
    Linking.openURL(`mailto:${registeredEmail}`).catch(() => {
      Linking.openURL("mailto:").catch(() => {});
    });
  };

  const handleResend = () => {
    if (resendSeconds > 0) return;
    setResendSeconds(60);
    // Hook up resend API when backend supports verification emails.
  };

  const footerLink = (
    <View style={styles.footerRow}>
      <Text style={styles.footerLead}>{copy.footerLabel}</Text>
      <Pressable
        accessibilityRole="link"
        onPress={() => navigation.navigate("Login")}
        style={styles.footerLink}
      >
        <Text style={styles.footerLinkText}>{copy.footerLink}</Text>
        <Ionicons name="chevron-forward" size={14} color={semanticPalette.accent} />
      </Pressable>
    </View>
  );

  return (
    <AuthShell variant="register" navigation={navigation} bareForm showSocialRow={false}>
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
        showSuccess={verificationSent}
        footer={footerLink}
        success={
          <RegisterVerificationSuccess
            email={registeredEmail}
            onOpenMail={openMailApp}
            onResend={handleResend}
            onUseDifferentEmail={handleUseDifferentEmail}
            resendSeconds={resendSeconds}
            entranceKey={registeredEmail}
          />
        }
        form={
          <>
      <Text accessibilityRole="header" style={styles.title}>
        {copy.formTitle}
      </Text>
      <Text style={styles.subtitle}>{copy.formSubtitle}</Text>

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
        {networkError ? (
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
              color: semanticPalette.inkMuted,
            }}
          >
            {shared.stillTrying}
          </Text>
        ) : null}
      </View>

      <View style={styles.dividerWrap} accessibilityRole="text">
        <View style={styles.dividerHairline} />
        <Text style={styles.dividerLabel}>{copy.socialDivider}</Text>
        <View style={styles.dividerHairline} />
      </View>

      <View style={styles.socialStack}>
        {socialProviders.map((provider) => (
          <Button
            key={provider.key}
            variant="secondary"
            size="lg"
            fullWidth
            label={provider.label}
            onPress={noopOAuth}
            iconLeft={provider.icon}
            accessibilityHint={copy.oauthUnavailableHint}
            interactionProfile="authSocial"
          />
        ))}
      </View>
          </>
        }
      />
    </AuthShell>
  );
}
