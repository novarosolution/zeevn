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
import AuthErrorCard from "../components/auth/AuthErrorCard";
import { navigateAfterAuth } from "../components/auth/authNavigation";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { AUTH_SCREEN, fillPlaceholders } from "../content/appContent";
import { FONT_DISPLAY_SEMI } from "../theme/customerAlchemy";
import { fonts, icon, spacing } from "../theme/tokens";
import { isValidEmail, normalizeEmail } from "../utils/authValidation";
import useAuthSubmit from "../hooks/useAuthSubmit";
import useAuthScreenLifecycle from "../hooks/useAuthScreenLifecycle";
import AuthRateLimitCard from "../components/auth/AuthRateLimitCard";
import AuthSessionExpiredBanner from "../components/auth/AuthSessionExpiredBanner";
import Toast from "../components/ui/Toast";
import {
  authenticateWithBiometrics,
  getBiometricLabel,
  isBiometricLoginAvailable,
  promptBiometricOptInAfterLogin,
} from "../utils/biometricAuth";

const copy = AUTH_SCREEN.login;
const shared = AUTH_SCREEN.shared;

function RememberMeCheckbox({ checked, onToggle, label }) {
  const { semanticPalette, TYPE } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={onToggle}
      style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 8, opacity: pressed ? 0.75 : 1 }]}
    >
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: checked ? semanticPalette.ink : semanticPalette.line,
          backgroundColor: checked ? semanticPalette.ink : semanticPalette.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked ? <Ionicons name="checkmark" size={12} color={semanticPalette.inkInverse} /> : null}
      </View>
      <Text
        style={{
          fontFamily: fonts.regular,
          fontSize: TYPE.small.fontSize,
          lineHeight: TYPE.small.lineHeight,
          color: semanticPalette.inkSoft,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function LoginScreen({ navigation }) {
  const route = useRoute();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotHover, setForgotHover] = useState(false);
  const [footerLinkHover, setFooterLinkHover] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Biometrics");
  const { loginWithCredentials } = useAuth();
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const passwordRef = useRef(null);

  const {
    run: runSubmit,
    isSubmitting,
    slowHint,
    networkError,
    serverError,
    rateLimitUntil,
    isRateLimited,
    clearErrors,
    setServerError,
  } = useAuthSubmit();

  const lifecycle = useAuthScreenLifecycle({
    navigation,
    screen: "login",
    onDraftLoaded: (draft) => {
      if (draft?.email) setEmail(draft.email);
    },
    toastMessage: shared.alreadySignedInToast,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ready = await isBiometricLoginAvailable();
      const label = await getBiometricLabel();
      if (!cancelled) {
        setBiometricReady(ready);
        setBiometricLabel(label);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    lifecycle.persistDraft({ email });
  }, [email, lifecycle]);

  const showSessionBanner = Boolean(route.params?.sessionExpired);

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
        helperRow: {
          marginTop: spacing.xs,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.sm,
        },
        forgotLink: {
          paddingVertical: 2,
        },
        forgotText: {
          fontFamily: fonts.medium,
          fontSize: TYPE.small.fontSize,
          lineHeight: TYPE.small.lineHeight,
          color: semanticPalette.accent,
          ...Platform.select({
            web: {
              textDecorationLine: forgotHover ? "underline" : "none",
              textDecorationColor: semanticPalette.accent,
            },
            default: {},
          }),
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
              textDecorationColor: semanticPalette.accent,
            },
            default: {},
          }),
        },
      }),
    [
      TYPE.micro,
      SPACING.sm,
      forgotHover,
      footerLinkHover,
      semanticPalette.accent,
      semanticPalette.ink,
      semanticPalette.inkMuted,
      semanticPalette.inkSoft,
      semanticPalette.lineSoft,
    ]
  );

  const clearServerErrors = useCallback(() => {
    clearErrors();
  }, [clearErrors]);

  const validate = useCallback(() => {
    let ok = true;
    const em = String(email ?? "").trim();
    const pw = String(password ?? "");

    if (!em) {
      setEmailError(shared.requiredField);
      ok = false;
    } else if (!isValidEmail(normalizeEmail(em))) {
      setEmailError(shared.invalidEmail);
      ok = false;
    } else {
      setEmailError("");
    }

    if (!pw) {
      setPasswordError(shared.requiredField);
      ok = false;
    } else {
      setPasswordError("");
    }

    return ok;
  }, [email, password]);

  const handleLogin = useCallback(async () => {
    clearErrors();
    if (!validate()) return;

    const em = normalizeEmail(email);
    const pw = password;

    const ok = await runSubmit(async (signal) => {
      await loginWithCredentials({
        email: em,
        password: pw,
        remember: rememberMe,
        signal,
      });
      lifecycle.clearDraft();
      await promptBiometricOptInAfterLogin({ email: em, password: pw });
      navigateAfterAuth(navigation, route);
      return true;
    });
  }, [
    clearErrors,
    email,
    lifecycle,
    loginWithCredentials,
    navigation,
    networkError,
    password,
    rememberMe,
    route,
    runSubmit,
    validate,
  ]);

  const handleBiometricLogin = useCallback(async () => {
    const creds = await authenticateWithBiometrics();
    if (!creds) return;
    setEmail(creds.email);
    setPassword(creds.password);
    clearErrors();
    await runSubmit(async (signal) => {
      await loginWithCredentials({
        email: normalizeEmail(creds.email),
        password: creds.password,
        remember: true,
        signal,
      });
      navigateAfterAuth(navigation, route);
      return true;
    });
  }, [clearErrors, loginWithCredentials, navigation, route, runSubmit]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return undefined;
    const onKeyDown = (event) => {
      if (event.key !== "Enter" || event.defaultPrevented) return;
      const tag = event.target?.tagName?.toLowerCase?.();
      if (tag === "textarea" || tag === "button") return;
      event.preventDefault();
      handleLogin();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleLogin]);

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

  return (
    <AuthShell variant="login" navigation={navigation} bareForm showSocialRow={false}>
      <Toast
        visible={lifecycle.toastVisible}
        message={lifecycle.toastMessage}
        onDismiss={() => lifecycle.setToastVisible(false)}
        durationMs={2400}
      />
      {showSessionBanner ? <AuthSessionExpiredBanner message={shared.sessionExpiredBanner} /> : null}
      {biometricReady ? (
        <View style={{ marginBottom: spacing.md }}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            label={fillPlaceholders(shared.signInWithBiometric, { label: biometricLabel })}
            onPress={handleBiometricLogin}
            disabled={isSubmitting || isRateLimited}
          />
        </View>
      ) : null}
      <Text accessibilityRole="header" style={styles.title}>
        {copy.formTitle}
      </Text>
      <Text style={styles.subtitle}>{copy.formSubtitle}</Text>

      <View style={styles.stack}>
        <Input
          testID="login-email"
          label={copy.emailLabel}
          accessibilityLabel={copy.emailLabel}
          placeholder={copy.emailPlaceholder}
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (emailError) setEmailError("");
            clearServerErrors();
          }}
          errorText={emailError || undefined}
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

        <Input
          testID="login-password"
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
          errorText={passwordError || undefined}
          iconLeft="lock-closed-outline"
          secureTextEntry
          passwordToggle
          passwordShowA11yLabel={copy.showPassword}
          passwordHideA11yLabel={copy.hidePassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleLogin}
          importantForAutofill="yes"
        />
      </View>

      <View style={styles.helperRow}>
        <RememberMeCheckbox
          checked={rememberMe}
          onToggle={() => setRememberMe((v) => !v)}
          label={copy.rememberMe}
        />
        <Pressable
          style={styles.forgotLink}
          accessibilityRole="link"
          accessibilityHint="Opens password recovery"
          onPress={() => navigation.navigate("ForgotPassword")}
          onHoverIn={() => Platform.OS === "web" && setForgotHover(true)}
          onHoverOut={() => Platform.OS === "web" && setForgotHover(false)}
        >
          <Text style={styles.forgotText}>{copy.forgotLink}</Text>
        </Pressable>
      </View>

      <View style={styles.ctaBlock}>
        {rateLimitUntil ? <AuthRateLimitCard untilMs={rateLimitUntil} /> : null}
        {serverError && !rateLimitUntil ? <AuthErrorCard message={serverError} /> : null}
        {networkError ? (
          <AuthErrorCard
            message={shared.networkError}
            retryLabel={shared.retryCta}
            onRetry={handleLogin}
          />
        ) : null}

        <Button
          variant="primary"
          size="lg"
          fullWidth
          label={copy.submitCta}
          loading={isSubmitting}
          loadingLabel={copy.submitLoading}
          onPress={handleLogin}
          disabled={isSubmitting || isRateLimited}
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

      <View style={styles.footerRow}>
        <Text style={styles.footerLead}>{copy.footerLabel}</Text>
        <Pressable
          accessibilityRole="link"
          accessibilityHint="Opens registration"
          onPress={() => navigation.navigate("Register")}
          onHoverIn={() => Platform.OS === "web" && setFooterLinkHover(true)}
          onHoverOut={() => Platform.OS === "web" && setFooterLinkHover(false)}
          style={styles.footerLink}
        >
          <Text style={styles.footerLinkText}>{copy.footerLink}</Text>
          <Ionicons name="chevron-forward" size={14} color={semanticPalette.accent} />
        </Pressable>
      </View>
    </AuthShell>
  );
}
