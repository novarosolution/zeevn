import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { fonts, spacing, typography } from "../theme/tokens";
import { normalizeEmail, validateLoginEmail, validateLoginPassword } from "../utils/authValidation";
import PremiumButton from "../components/ui/PremiumButton";
import PremiumInput from "../components/ui/PremiumInput";
import PremiumErrorBanner from "../components/ui/PremiumErrorBanner";
import SectionReveal from "../components/motion/SectionReveal";
import { LOGIN_SCREEN } from "../content/appContent";
import AuthPageScaffold from "../components/AuthPageScaffold";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loginWithCredentials } = useAuth();
  const { colors: c } = useTheme();
  const styles = useMemo(() => createLoginStyles(c), [c]);

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
      navigation.navigate("Home");
    } catch (err) {
      setError(err.message || LOGIN_SCREEN.genericError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldDelays = [80, 160, 240];
  return (
    <AuthPageScaffold
      heroBannerA11y={LOGIN_SCREEN.heroBannerA11y}
      heroKicker={LOGIN_SCREEN.heroKicker}
      heroTitle={LOGIN_SCREEN.heroTitle}
      heroSubtitle={LOGIN_SCREEN.heroSubtitle}
      heroHighlights={LOGIN_SCREEN.heroHighlights}
      authEyebrow={LOGIN_SCREEN.authEyebrow}
      authTitle={LOGIN_SCREEN.authTitle}
      authSubtitle={LOGIN_SCREEN.authSubtitle}
      assuranceNote={LOGIN_SCREEN.assuranceNote}
    >
            <View style={styles.fieldStack}>
              <SectionReveal delay={fieldDelays[0]}>
                <PremiumInput
                  label={LOGIN_SCREEN.labelEmail}
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

              <SectionReveal delay={fieldDelays[1]}>
                <PremiumInput
                  label={LOGIN_SCREEN.labelSecret}
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
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
              </SectionReveal>
            </View>

            {error ? (
              <View style={styles.errorWrap}>
                <PremiumErrorBanner severity="error" message={error} compact />
              </View>
            ) : null}

            <SectionReveal delay={fieldDelays[2]}>
              <PremiumButton
                label={isSubmitting ? LOGIN_SCREEN.submitLoading : LOGIN_SCREEN.submitCta}
                onPress={handleLogin}
                iconLeft="sparkles-outline"
                loading={isSubmitting}
                disabled={isSubmitting}
                size="lg"
                fullWidth
                pulse={!isSubmitting && !error && Boolean(email || password)}
                style={styles.primaryCta}
              />
            </SectionReveal>

            <View style={styles.secondaryStack}>
              <PremiumButton
                label={LOGIN_SCREEN.createAccountCta}
                variant="subtle"
                size="md"
                fullWidth
                iconLeft="person-add-outline"
                style={styles.secondaryActionBtn}
                onPress={() => navigation.navigate("Register")}
              />
            </View>
            <Text style={styles.guestLink} onPress={() => navigation.navigate("Home")} accessibilityRole="button">
              {LOGIN_SCREEN.guestCta}
            </Text>
    </AuthPageScaffold>
  );
}

function createLoginStyles(c) {
  return StyleSheet.create({
    fieldStack: {
      gap: spacing.sm,
      marginTop: spacing.md + 2,
      marginBottom: spacing.sm + 2,
    },
    errorWrap: {
      marginBottom: spacing.sm,
    },
    primaryCta: {
      marginTop: spacing.sm + 2,
    },
    secondaryStack: {
      gap: spacing.xs + 2,
      marginTop: spacing.md,
    },
    secondaryActionBtn: {
      opacity: 0.94,
    },
    guestLink: {
      marginTop: spacing.sm + 2,
      textAlign: "center",
      fontFamily: fonts.semibold,
      fontSize: typography.bodySmall,
      color: c.textMuted,
    },
  });
}
