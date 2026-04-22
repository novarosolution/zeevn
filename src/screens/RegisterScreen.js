import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppFooter from "../components/AppFooter";
import CustomerScreenShell from "../components/CustomerScreenShell";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { BRAND_LOGO_SIZE } from "../constants/brand";
import BrandLogo from "../components/BrandLogo";
import { fonts, radius, spacing, typography } from "../theme/tokens";
import { authScrollContent, customerPanel, customerScrollFill, inputOutlineWeb } from "../theme/screenLayout";
import { ALCHEMY, FONT_DISPLAY } from "../theme/customerAlchemy";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { registerWithCredentials } = useAuth();
  const { colors: c, shadowPremium: sp, isDark } = useTheme();
  const styles = useMemo(() => createRegisterStyles(c, sp, isDark), [c, sp, isDark]);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill all required fields.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await registerWithCredentials({ name: name.trim(), email: email.trim(), password });
      navigation.navigate("Home");
    } catch (err) {
      setError(err.message || "Unable to register. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CustomerScreenShell style={styles.screen}>
    <KeyboardAvoidingView
      style={customerScrollFill}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[authScrollContent, styles.scrollContentExtra]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <View style={styles.heroBrandStack}>
            <BrandLogo width={BRAND_LOGO_SIZE.authHero} height={BRAND_LOGO_SIZE.authHero} style={styles.heroLogo} />
          </View>
          <Text style={styles.heroTitle}>Create your account</Text>
          <Text style={styles.heroSubtitle}>Save your address, reorder favourites, and get order updates.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Register</Text>
          <Text style={styles.subtitle}>Quick signup—same trusted checkout as always.</Text>

          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={16} color={c.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor={c.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={16} color={c.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={c.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={16} color={c.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={c.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="checkmark-done-outline" size={16} color={c.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor={c.textMuted}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={isSubmitting}>
            <View style={styles.buttonContent}>
              <Ionicons name="person-add-outline" size={16} color={c.onPrimary} />
              <Text style={styles.buttonText}>{isSubmitting ? "Please wait..." : "Create Account"}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.loginButton}>
            <Text style={styles.loginButtonText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerWrap}>
          <AppFooter />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </CustomerScreenShell>
  );
}

function createRegisterStyles(c, shadowPremium, isDark) {
  return StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContentExtra: {
    width: "100%",
  },
  hero: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: isDark ? c.heroBackground : ALCHEMY.cardBg,
    borderRadius: radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? "rgba(184, 134, 11, 0.4)" : ALCHEMY.pillInactive,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    marginBottom: spacing.md,
    marginTop: spacing.md,
    ...shadowPremium,
  },
  heroBrandStack: {
    alignSelf: "stretch",
  },
  heroLogo: {
    alignSelf: "center",
  },
  heroTitle: {
    marginTop: spacing.xs,
    color: isDark ? c.heroForeground : ALCHEMY.brown,
    fontSize: typography.h1,
    fontFamily: FONT_DISPLAY,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    marginTop: spacing.xs,
    color: isDark ? c.onPrimaryMuted : c.textSecondary,
    fontSize: typography.bodySmall,
    lineHeight: 20,
    fontFamily: fonts.regular,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    ...customerPanel(c, shadowPremium),
    padding: spacing.xl,
    ...(isDark
      ? {}
      : {
          backgroundColor: ALCHEMY.cardBg,
          borderColor: ALCHEMY.pillInactive,
          borderTopColor: ALCHEMY.pillInactive,
        }),
  },
  title: {
    fontSize: 24,
    fontFamily: FONT_DISPLAY,
    color: c.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: typography.body,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    color: c.textSecondary,
    lineHeight: 22,
    fontFamily: fonts.regular,
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.md,
    backgroundColor: c.surfaceMuted,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: typography.body,
    fontFamily: fonts.regular,
    color: c.textPrimary,
    ...inputOutlineWeb,
  },
  button: {
    marginTop: spacing.xs,
    backgroundColor: c.primary,
    borderRadius: radius.pill,
    alignItems: "center",
    paddingVertical: 14,
  },
  buttonText: {
    color: c.onPrimary,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    color: c.danger,
    marginTop: -2,
    marginBottom: spacing.sm,
    fontSize: typography.bodySmall,
    fontFamily: fonts.semibold,
  },
  loginButton: {
    marginTop: spacing.md,
    alignItems: "center",
  },
  loginButtonText: {
    color: c.primary,
    fontSize: typography.bodySmall,
    fontFamily: fonts.bold,
  },
  footerWrap: {
    marginTop: spacing.md,
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
});
}
