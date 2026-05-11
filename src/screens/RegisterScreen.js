import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
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
import SectionReveal from "../components/motion/SectionReveal";
import { REGISTER_SCREEN } from "../content/appContent";
import AuthPageScaffold from "../components/AuthPageScaffold";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { registerWithCredentials } = useAuth();
  const { colors: c } = useTheme();
  const styles = useMemo(() => createRegisterStyles(c), [c]);

  const handleRegister = async () => {
    const nameErr = validateRegisterName(name);
    if (nameErr) {
      setError(nameErr);
      return;
    }

    const em = normalizeEmail(email);
    if (!em) {
      setError(REGISTER_SCREEN.emailRequired);
      return;
    }
    if (!isValidEmail(em)) {
      setError(REGISTER_SCREEN.emailInvalid);
      return;
    }

    const passErr = validateRegisterPassword(password);
    if (passErr) {
      setError(passErr);
      return;
    }

    if (password !== confirmPassword) {
      setError(REGISTER_SCREEN.credentialMismatch);
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await registerWithCredentials({ name: name.trim().replace(/\s+/g, " "), email: em, password });
      navigation.navigate("Home");
    } catch (err) {
      setError(err.message || REGISTER_SCREEN.genericError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageScaffold
      heroBannerA11y={REGISTER_SCREEN.heroBannerA11y}
      heroKicker={REGISTER_SCREEN.heroKicker}
      heroTitle={REGISTER_SCREEN.heroTitle}
      heroSubtitle={REGISTER_SCREEN.heroSubtitle}
      heroHighlights={REGISTER_SCREEN.heroHighlights}
      authEyebrow={REGISTER_SCREEN.authEyebrow}
      authTitle={REGISTER_SCREEN.authTitle}
      authSubtitle={REGISTER_SCREEN.authSubtitle}
      assuranceNote={REGISTER_SCREEN.assuranceNote}
    >
            <View style={styles.fieldStack}>
              <SectionReveal delay={80}>
                <PremiumInput
                  label={REGISTER_SCREEN.labelFullName}
                  value={name}
                  onChangeText={(t) => {
                    setName(t);
                    if (error) setError("");
                  }}
                  iconLeft="person-outline"
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="name"
                />
              </SectionReveal>

              <SectionReveal delay={140}>
                <PremiumInput
                  label={REGISTER_SCREEN.labelEmail}
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
                />
              </SectionReveal>

              <SectionReveal delay={200}>
                <PremiumInput
                  label={REGISTER_SCREEN.labelSecret}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (error) setError("");
                  }}
                  iconLeft="lock-closed-outline"
                  secureTextEntry
                  passwordToggle
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  helperText={REGISTER_SCREEN.credentialHelper}
                />
              </SectionReveal>

              <SectionReveal delay={260}>
                <PremiumInput
                  label={REGISTER_SCREEN.labelConfirmSecret}
                  value={confirmPassword}
                  onChangeText={(t) => {
                    setConfirmPassword(t);
                    if (error) setError("");
                  }}
                  iconLeft="checkmark-done-outline"
                  secureTextEntry
                  passwordToggle
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
              </SectionReveal>
            </View>

            {error ? (
              <View style={styles.errorWrap}>
                <PremiumErrorBanner severity="error" message={error} compact />
              </View>
            ) : null}

            <SectionReveal delay={320}>
              <PremiumButton
                label={isSubmitting ? REGISTER_SCREEN.submitLoading : REGISTER_SCREEN.submitCta}
                onPress={handleRegister}
                iconLeft="person-add-outline"
                loading={isSubmitting}
                disabled={isSubmitting}
                size="lg"
                fullWidth
                pulse={!isSubmitting && !error && Boolean(name || email || password || confirmPassword)}
                style={styles.primaryCta}
              />
            </SectionReveal>

            <View style={styles.secondaryDivider}>
              <View style={styles.secondaryDividerLine} />
              <Text style={styles.secondaryDividerLabel}>{REGISTER_SCREEN.dividerExisting}</Text>
              <View style={styles.secondaryDividerLine} />
            </View>

            <PremiumButton
              label={REGISTER_SCREEN.signInInsteadCta}
              variant="subtle"
              size="md"
              fullWidth
              iconLeft="log-in-outline"
              style={styles.secondaryActionBtn}
              onPress={() => navigation.navigate("Login")}
            />
    </AuthPageScaffold>
  );
}

function createRegisterStyles(c) {
  return StyleSheet.create({
  fieldStack: {
    gap: spacing.sm + 2,
    marginTop: spacing.lg,
    marginBottom: spacing.sm + 2,
  },
  errorWrap: {
    marginBottom: spacing.sm,
  },
  primaryCta: {
    marginTop: spacing.md,
  },
  secondaryDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md + 2,
    marginBottom: spacing.sm,
  },
  secondaryDividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.border,
  },
  secondaryDividerLabel: {
    fontFamily: fonts.bold,
    fontSize: typography.overline,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: c.textMuted,
  },
  secondaryActionBtn: {
    opacity: 0.94,
  },
  });
}
