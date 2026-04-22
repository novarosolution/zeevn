import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { resetNavigationToHome } from "../navigation/resetToHome";
import { ALCHEMY } from "../theme/customerAlchemy";
import { radius, spacing, typography } from "../theme/tokens";
import BottomNavBar from "./BottomNavBar";
import CustomerScreenShell from "./CustomerScreenShell";

/**
 * Empty shell while auth is restoring.
 * When `signedOut` is set, shows sign-in / home instead of auto-redirecting to Login
 * (avoids racing with logout + stack reset).
 */
export default function AuthGateShell({ navigation, signedOut = false }) {
  const { colors: c, shadowPremium, isDark } = useTheme();
  const styles = useMemo(() => createStyles(c, isDark, shadowPremium), [c, isDark, shadowPremium]);

  if (signedOut && navigation) {
    return (
      <CustomerScreenShell style={styles.shell}>
        <View style={styles.signedOutInner}>
          <Text style={styles.signedOutTitle}>Sign in to your account</Text>
          <Text style={styles.signedOutSub}>View orders, saved address, and account preferences.</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            <Text style={styles.primaryBtnText}>Sign in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => resetNavigationToHome(navigation)}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Continue as guest, go to home"
          >
            <Text style={styles.secondaryBtnText}>Continue as guest</Text>
          </TouchableOpacity>
        </View>
        <BottomNavBar />
      </CustomerScreenShell>
    );
  }

  return (
    <CustomerScreenShell style={styles.shell}>
      <View style={styles.fill} />
      <BottomNavBar />
    </CustomerScreenShell>
  );
}

function createStyles(c, isDark, shadowPremium) {
  const cardBg = isDark ? c.surface : ALCHEMY.cardBg;
  return StyleSheet.create({
    shell: { flex: 1 },
    fill: { flex: 1 },
    signedOutInner: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.lg,
      justifyContent: "center",
    },
    signedOutTitle: {
      fontSize: typography.h2,
      fontWeight: "700",
      color: c.text,
      textAlign: "center",
      marginBottom: spacing.sm,
    },
    signedOutSub: {
      fontSize: typography.body,
      color: c.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: spacing.xl,
    },
    primaryBtn: {
      backgroundColor: isDark ? c.primary : ALCHEMY.brown,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      alignItems: "center",
      marginBottom: spacing.sm,
      ...shadowPremium,
    },
    primaryBtnText: {
      color: "#FFFCF8",
      fontSize: typography.body,
      fontWeight: "600",
    },
    secondaryBtn: {
      backgroundColor: cardBg,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      alignItems: "center",
      borderWidth: 1,
      borderColor: isDark ? c.border : ALCHEMY.pillInactive,
    },
    secondaryBtnText: {
      color: c.text,
      fontSize: typography.body,
      fontWeight: "500",
    },
  });
}
