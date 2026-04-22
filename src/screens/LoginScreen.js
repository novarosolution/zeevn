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

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loginWithCredentials } = useAuth();
  const { colors: c, shadowPremium: sp, isDark } = useTheme();
  const styles = useMemo(() => createLoginStyles(c, sp, isDark), [c, sp, isDark]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await loginWithCredentials({ email: email.trim(), password });
      navigation.navigate("Home");
    } catch (err) {
      setError(err.message || "Unable to login. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CustomerScreenShell style={styles.screen}>
    <KeyboardAvoidingView style={customerScrollFill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[authScrollContent, styles.scrollContentExtra]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <View style={styles.heroBrandStack}>
            <BrandLogo width={BRAND_LOGO_SIZE.authHero} height={BRAND_LOGO_SIZE.authHero} style={styles.heroLogo} />
          </View>
          <Text style={styles.heroTitle}>Welcome back</Text>
          <Text style={styles.heroSubtitle}>Sign in to track orders, save your address, and checkout faster.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.subtitle}>Your cart, orders, and saved address—always in sync.</Text>

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

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isSubmitting}>
            <View style={styles.buttonContent}>
              <Ionicons name="log-in-outline" size={16} color={c.onPrimary} />
              <Text style={styles.buttonText}>{isSubmitting ? "Please wait..." : "Login"}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Register")} style={styles.registerButton}>
            <Text style={styles.registerButtonText}>Create new account</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Home")} style={styles.guestButton}>
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
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

function createLoginStyles(c, shadowPremium, isDark) {
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
      lineHeight: 34,
      letterSpacing: -0.5,
    },
    heroSubtitle: {
      marginTop: spacing.xs,
      color: isDark ? c.onPrimaryMuted : c.textSecondary,
      fontSize: 14,
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
      fontSize: 15,
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
      fontSize: 15,
      color: c.textPrimary,
      fontFamily: fonts.regular,
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
      fontSize: 13,
      fontFamily: fonts.semibold,
    },
    guestButton: {
      marginTop: spacing.sm,
      alignItems: "center",
    },
    guestButtonText: {
      color: c.textSecondary,
      fontSize: 14,
      fontFamily: fonts.semibold,
    },
    footerWrap: {
      marginTop: spacing.md,
      width: "100%",
      maxWidth: 420,
      alignSelf: "center",
    },
    registerButton: {
      marginTop: spacing.md,
      alignItems: "center",
    },
    registerButtonText: {
      color: c.primary,
      fontSize: 14,
      fontFamily: fonts.bold,
    },
  });
}
