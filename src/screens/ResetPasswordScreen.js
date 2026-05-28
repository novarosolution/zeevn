import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AuthShell from "../components/auth/AuthShell";
import AuthBrassIconEntrance from "../components/auth/AuthBrassIconEntrance";
import AuthErrorCard from "../components/auth/AuthErrorCard";
import AuthRateLimitCard from "../components/auth/AuthRateLimitCard";
import PasswordStrengthMeter from "../components/auth/PasswordStrengthMeter";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { AUTH_SCREEN } from "../content/appContent";
import {
  resetPasswordWithTokenRequest,
  validateResetTokenRequest,
} from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { FONT_DISPLAY_SEMI } from "../theme/customerAlchemy";
import { fonts, spacing } from "../theme/tokens";
import { isValidEmail, normalizeEmail, validateRegisterPassword } from "../utils/authValidation";
import { getPasswordStrengthScore } from "../utils/passwordStrength";
import { navigateAfterAuth } from "../components/auth/authNavigation";
import { getAuthCaptchaToken } from "../utils/authCaptcha";
import useAuthSubmit from "../hooks/useAuthSubmit";
import { headingA11yProps } from "../utils/a11y";

const copy = AUTH_SCREEN.reset;
const shared = AUTH_SCREEN.shared;

function ResetExpiredState({ message, onRequestNewLink }) {
  const { semanticPalette, TYPE, SPACING } = useTheme();

  return (
    <View style={{ alignItems: "center", gap: SPACING.lg, paddingVertical: SPACING.md }}>
      <AuthBrassIconEntrance name="alert-circle-outline" size={44} trigger={1} />
      <Text
        {...headingA11yProps(1)}
        style={{
          fontFamily: FONT_DISPLAY_SEMI,
          fontSize: 24,
          lineHeight: 30,
          color: semanticPalette.ink,
          textAlign: "center",
        }}
      >
        {copy.errorTitle}
      </Text>
      <Text
        style={{
          fontFamily: fonts.regular,
          fontSize: TYPE.body.fontSize,
          lineHeight: TYPE.body.lineHeight,
          color: semanticPalette.inkSoft,
          textAlign: "center",
        }}
      >
        {message || copy.error}
      </Text>
      <Button
        variant="primary"
        size="lg"
        fullWidth
        label={copy.requestNewLinkCta}
        onPress={onRequestNewLink}
      />
    </View>
  );
}

export default function ResetPasswordScreen({ navigation }) {
  const route = useRoute();
  const { loginWithCredentials } = useAuth();
  const { semanticPalette, TYPE } = useTheme();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [tokenState, setTokenState] = useState("validating");
  const [tokenMessage, setTokenMessage] = useState("");
  const confirmRef = useRef(null);

  const email = normalizeEmail(String(route.params?.email || "").trim());
  const token = String(route.params?.token || "").trim();
  const strengthScore = useMemo(() => getPasswordStrengthScore(password), [password]);
  const canSubmit = strengthScore >= 2 && password.length >= 6 && password === confirm;

  const {
    run: runSubmit,
    isSubmitting,
    slowHint,
    networkError,
    timeoutError,
    serverError,
    rateLimitUntil,
    isRateLimited,
    clearErrors,
  } = useAuthSubmit();

  useEffect(() => {
    if (!isValidEmail(email) || token.length < 12) {
      setTokenState("expired");
      setTokenMessage(copy.missingParams);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      try {
        await validateResetTokenRequest({ email, token });
        if (!cancelled) {
          setTokenState("valid");
          setTokenMessage("");
        }
      } catch (err) {
        if (!cancelled) {
          setTokenState("expired");
          setTokenMessage(err?.message || copy.error);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [email, token]);

  const requestNewLink = useCallback(() => {
    navigation.navigate("ForgotPassword", email ? { email } : undefined);
  }, [email, navigation]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        validating: {
          fontFamily: fonts.regular,
          fontSize: TYPE.body.fontSize,
          lineHeight: TYPE.body.lineHeight,
          color: semanticPalette.inkSoft,
          marginBottom: spacing.md,
        },
        stack: {
          gap: spacing.md,
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
    [TYPE.body, semanticPalette.ink, semanticPalette.inkSoft]
  );

  const validateFields = useCallback(() => {
    let ok = true;
    const passErr = validateRegisterPassword(password);
    if (passErr) {
      setPasswordError(passErr);
      ok = false;
    } else if (strengthScore < 2) {
      setPasswordError(AUTH_SCREEN.register.strengthLabels[1] || shared.passwordTooShort);
      ok = false;
    } else {
      setPasswordError("");
    }

    if (!confirm) {
      setConfirmError(shared.requiredField);
      ok = false;
    } else if (password !== confirm) {
      setConfirmError(copy.passwordMismatch);
      ok = false;
    } else {
      setConfirmError("");
    }

    return ok;
  }, [confirm, password, strengthScore]);

  const handleSubmit = useCallback(async () => {
    clearErrors();
    if (tokenState !== "valid") return;
    if (!validateFields()) return;

    await runSubmit(async (signal) => {
      const captchaToken = await getAuthCaptchaToken("reset_password");
      await resetPasswordWithTokenRequest({
        email,
        token,
        newPassword: password,
        signal,
        captchaToken,
      });
      await loginWithCredentials({ email, password, remember: true, signal });
      navigateAfterAuth(navigation, route);
      return true;
    });
  }, [
    clearErrors,
    email,
    loginWithCredentials,
    navigation,
    password,
    route,
    runSubmit,
    token,
    tokenState,
    validateFields,
  ]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined" || tokenState !== "valid") return undefined;
    const onKeyDown = (event) => {
      if (event.key !== "Enter" || event.defaultPrevented) return;
      const tag = event.target?.tagName?.toLowerCase?.();
      if (tag === "textarea" || tag === "button" || tag === "input") return;
      if (!canSubmit || isSubmitting) return;
      event.preventDefault();
      handleSubmit();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [canSubmit, handleSubmit, isSubmitting, tokenState]);

  if (tokenState === "expired") {
    return (
      <AuthShell variant="reset" navigation={navigation} bareForm showBackLink={false}>
        <ResetExpiredState message={tokenMessage} onRequestNewLink={requestNewLink} />
        <View style={styles.footerRow}>
          <Text style={styles.footerLead}>{AUTH_SCREEN.forgot.footerLabel}</Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => navigation.navigate("Login")}
            style={styles.footerLink}
          >
            <Text style={styles.footerLinkText}>{AUTH_SCREEN.forgot.footerLink}</Text>
            <Ionicons name="chevron-forward" size={14} color={semanticPalette.ink} />
          </Pressable>
        </View>
      </AuthShell>
    );
  }

  return (
    <AuthShell variant="reset" navigation={navigation} bareForm>
      <Text {...headingA11yProps(1)} style={{ fontFamily: TYPE.serifFamily, ...TYPE.h1, color: semanticPalette.ink }}>
        {copy.formTitle}
      </Text>
      <Text
        style={{
          marginTop: spacing.sm,
          marginBottom: spacing.lg,
          fontFamily: fonts.regular,
          ...TYPE.body,
          color: semanticPalette.inkSoft,
        }}
      >
        {copy.formSubtitle}
      </Text>

      {tokenState === "validating" ? (
        <Text style={styles.validating}>{copy.validating}</Text>
      ) : (
        <>
          <View style={styles.stack}>
            <View>
              <Input
                testID="reset-password"
                label={copy.newPasswordLabel}
                accessibilityLabel={copy.newPasswordLabel}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (passwordError) setPasswordError("");
                  clearErrors();
                }}
                errorText={passwordError || undefined}
                iconLeft="lock-closed-outline"
                secureTextEntry
                passwordToggle
                passwordShowA11yLabel={AUTH_SCREEN.register.showPassword}
                passwordHideA11yLabel={AUTH_SCREEN.register.hidePassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => confirmRef.current?.focus?.()}
                importantForAutofill="yes"
              />
              <PasswordStrengthMeter
                password={password}
                strengthLabels={AUTH_SCREEN.register.strengthLabels}
                hint={AUTH_SCREEN.register.passwordHint}
              />
            </View>

            <Input
              testID="reset-password-confirm"
              inputRef={confirmRef}
              label={copy.confirmPasswordLabel}
              accessibilityLabel={copy.confirmPasswordLabel}
              value={confirm}
              onChangeText={(t) => {
                setConfirm(t);
                if (confirmError) setConfirmError("");
                clearErrors();
              }}
              errorText={confirmError || undefined}
              iconLeft="lock-closed-outline"
              secureTextEntry
              passwordToggle
              passwordShowA11yLabel={AUTH_SCREEN.register.showPassword}
              passwordHideA11yLabel={AUTH_SCREEN.register.hidePassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
              importantForAutofill="yes"
            />
          </View>

          <View style={styles.ctaBlock}>
            {rateLimitUntil ? <AuthRateLimitCard untilMs={rateLimitUntil} /> : null}
            {serverError && !rateLimitUntil ? <AuthErrorCard message={serverError} /> : null}
            {timeoutError ? (
              <AuthErrorCard message={shared.timeoutError} retryLabel={shared.retryCta} onRetry={handleSubmit} />
            ) : null}
            {networkError && !timeoutError ? (
              <AuthErrorCard message={shared.networkError} retryLabel={shared.retryCta} onRetry={handleSubmit} />
            ) : null}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              label={copy.submitCta}
              loading={isSubmitting}
              loadingLabel={copy.submitLoading}
              onPress={handleSubmit}
              disabled={!canSubmit || isSubmitting || isRateLimited || tokenState !== "valid"}
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
      )}
    </AuthShell>
  );
}
