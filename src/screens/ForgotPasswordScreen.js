import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import AuthShell from "../components/auth/AuthShell";
import AuthBrassIconEntrance from "../components/auth/AuthBrassIconEntrance";
import AuthContentSwap from "../components/auth/AuthContentSwap";
import AuthErrorCard from "../components/auth/AuthErrorCard";
import AuthRateLimitCard from "../components/auth/AuthRateLimitCard";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Toast from "../components/ui/Toast";
import { AUTH_SCREEN, fillPlaceholders } from "../content/appContent";
import { forgotPasswordRequest } from "../services/authService";
import { useTheme } from "../context/ThemeContext";
import { FONT_DISPLAY_SEMI } from "../theme/customerAlchemy";
import { fonts, spacing } from "../theme/tokens";
import { isValidEmail, normalizeEmail } from "../utils/authValidation";
import { getAuthCaptchaToken } from "../utils/authCaptcha";
import useAuthSubmit from "../hooks/useAuthSubmit";
import useAuthScreenLifecycle from "../hooks/useAuthScreenLifecycle";

const copy = AUTH_SCREEN.forgot;
const shared = AUTH_SCREEN.shared;

function ForgotPasswordSuccess({
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
      <AuthBrassIconEntrance name="mail" size={48} trigger={entranceKey} />
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
      <Text
        style={{
          fontFamily: fonts.regular,
          fontSize: 12,
          lineHeight: 17,
          color: semanticPalette.inkMuted,
          textAlign: "center",
        }}
      >
        {copy.expiryNote}
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
              : copy.resendCta}
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

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);
  const [footerLinkHover, setFooterLinkHover] = useState(false);
  const { semanticPalette, TYPE, SPACING } = useTheme();

  const {
    run: runSubmit,
    isSubmitting: busy,
    slowHint,
    networkError,
    serverError,
    rateLimitUntil,
    isRateLimited,
    clearErrors,
  } = useAuthSubmit();

  const lifecycle = useAuthScreenLifecycle({
    navigation,
    screen: "forgot",
    onDraftLoaded: (draft) => {
      if (draft?.email) setEmail(draft.email);
    },
    toastMessage: shared.alreadySignedInToast,
  });

  useEffect(() => {
    lifecycle.persistDraft({ email });
  }, [email, lifecycle]);

  const showEmailError = submitAttempted || touched;

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
        ctaBlock: {
          marginTop: spacing.md,
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
    [footerLinkHover, semanticPalette.accent, semanticPalette.ink, semanticPalette.inkSoft]
  );

  const submit = useCallback(async () => {
    setSubmitAttempted(true);
    clearErrors();

    const em = normalizeEmail(email);
    if (!em || !isValidEmail(em)) {
      setEmailError(shared.invalidEmail);
      return;
    }
    setEmailError("");

    await runSubmit(async (signal) => {
      const captchaToken = await getAuthCaptchaToken("forgot_password");
      await forgotPasswordRequest({ email: em, signal, captchaToken });
      setSubmittedEmail(em);
      setSent(true);
      setResendSeconds(60);
      lifecycle.clearDraft();
      return true;
    });
  }, [clearErrors, email, lifecycle, runSubmit]);

  useEffect(() => {
    if (!sent || resendSeconds <= 0) return undefined;
    const id = setInterval(() => {
      setResendSeconds((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [sent, resendSeconds]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined" || sent) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== "Enter" || event.defaultPrevented) return;
      const tag = event.target?.tagName?.toLowerCase?.();
      if (tag === "textarea" || tag === "button") return;
      event.preventDefault();
      submit();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sent, submit]);

  const openMailApp = () => {
    Linking.openURL(`mailto:${submittedEmail}`).catch(() => {
      Linking.openURL("mailto:").catch(() => {});
    });
  };

  const handleResend = useCallback(async () => {
    if (resendSeconds > 0 || !submittedEmail) return;
    clearErrors();
    await runSubmit(async (signal) => {
      const captchaToken = await getAuthCaptchaToken("forgot_password");
      await forgotPasswordRequest({ email: submittedEmail, signal, captchaToken });
      setResendSeconds(60);
      return true;
    });
  }, [clearErrors, resendSeconds, runSubmit, submittedEmail]);

  const handleUseDifferentEmail = () => {
    setSent(false);
    setSubmittedEmail("");
    setResendSeconds(0);
    setSubmitAttempted(false);
    setTouched(false);
    setEmail("");
    setEmailError("");
    clearErrors();
  };

  const footerLink = (
    <View style={styles.footerRow}>
      <Text style={styles.footerLead}>{copy.footerLabel}</Text>
      <Pressable
        accessibilityRole="link"
        accessibilityHint="Opens sign in"
        onPress={() => navigation.navigate("Login")}
        onHoverIn={() => Platform.OS === "web" && setFooterLinkHover(true)}
        onHoverOut={() => Platform.OS === "web" && setFooterLinkHover(false)}
        style={styles.footerLink}
      >
        <Text style={styles.footerLinkText}>{copy.footerLink}</Text>
        <Ionicons name="chevron-forward" size={14} color={semanticPalette.accent} />
      </Pressable>
    </View>
  );

  return (
    <AuthShell variant="forgot" navigation={navigation} bareForm showSocialRow={false}>
      <Toast
        visible={lifecycle.toastVisible}
        message={lifecycle.toastMessage}
        onDismiss={() => lifecycle.setToastVisible(false)}
        durationMs={2400}
      />

      <AuthContentSwap
        showSuccess={sent}
        footer={footerLink}
        success={
          <ForgotPasswordSuccess
            email={submittedEmail}
            onOpenMail={openMailApp}
            onResend={handleResend}
            onUseDifferentEmail={handleUseDifferentEmail}
            resendSeconds={resendSeconds}
            entranceKey={submittedEmail}
          />
        }
        form={
          <>
            <Text accessibilityRole="header" style={styles.title}>
              {copy.formTitle}
            </Text>
            <Text style={styles.subtitle}>{copy.formSubtitle}</Text>

            <Input
              testID="forgot-email"
              label={copy.emailLabel}
              accessibilityLabel={copy.emailLabel}
              placeholder={copy.emailPlaceholder}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (emailError) setEmailError("");
                clearErrors();
              }}
              onBlur={() => setTouched(true)}
              errorText={showEmailError && emailError ? emailError : undefined}
              iconLeft="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="go"
              onSubmitEditing={submit}
              importantForAutofill="yes"
            />

            <View style={styles.ctaBlock}>
              {rateLimitUntil ? <AuthRateLimitCard untilMs={rateLimitUntil} /> : null}
              {serverError && !rateLimitUntil ? <AuthErrorCard message={serverError} /> : null}
              {networkError ? (
                <AuthErrorCard message={shared.networkError} retryLabel={shared.retryCta} onRetry={submit} />
              ) : null}

              <Button
                variant="primary"
                size="lg"
                fullWidth
                label={copy.submitCta}
                loading={busy}
                loadingLabel={copy.submitLoading}
                onPress={submit}
                disabled={busy || isRateLimited}
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
          </>
        }
      />
    </AuthShell>
  );
}
