import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { resetNavigationToHome } from "../navigation/resetToHome";
import { Ionicons } from "@expo/vector-icons";
import { ALCHEMY } from "../theme/customerAlchemy";
import { customerPanel } from "../theme/screenLayout";
import { fonts, spacing, typography } from "../theme/tokens";
import BottomNavBar from "./BottomNavBar";
import CustomerScreenShell from "./CustomerScreenShell";
import SessionExpiredBanner from "./SessionExpiredBanner";
import PremiumButton from "./ui/PremiumButton";

/**
 * Empty shell while auth is restoring.
 * When `signedOut` is set, shows sign-in / home instead of auto-redirecting to Login
 * (avoids racing with logout + stack reset).
 */
export default function AuthGateShell({ navigation, signedOut = false }) {
  const { colors: c, shadowPremium, isDark } = useTheme();
  const styles = useMemo(() => createStyles(c, isDark, shadowPremium), [c, isDark, shadowPremium]);

  const goToLogin = navigation ? () => navigation.navigate("Login") : undefined;

  if (signedOut && navigation) {
    return (
      <CustomerScreenShell style={styles.shell}>
        <SessionExpiredBanner onSignIn={goToLogin} />
        <View style={styles.signedOutInner}>
          <View style={[customerPanel(c, shadowPremium, isDark), styles.signedOutCard]}>
            <View style={styles.signedOutIconWrap}>
              <Ionicons name="person-circle-outline" size={30} color={isDark ? c.primaryBright : ALCHEMY.brown} />
            </View>
            <Text style={styles.signedOutTitle}>Sign in to your account</Text>
            <Text style={styles.signedOutSub}>
              Continue to access your orders, saved addresses, account settings, and premium member benefits.
            </Text>
            <PremiumButton
              label="Sign in"
              onPress={() => navigation.navigate("Login")}
              variant="primary"
              size="lg"
              fullWidth
              style={styles.primaryBtn}
            />
            <PremiumButton
              label="Continue as guest"
              onPress={() => resetNavigationToHome(navigation)}
              variant="ghost"
              size="lg"
              fullWidth
              style={styles.secondaryBtn}
            />
          </View>
        </View>
        <BottomNavBar />
      </CustomerScreenShell>
    );
  }

  return (
    <CustomerScreenShell style={styles.shell}>
      <SessionExpiredBanner onSignIn={goToLogin} />
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
      alignItems: "center",
    },
    signedOutCard: {
      width: "100%",
      maxWidth: 420,
      alignSelf: "center",
      borderTopWidth: 3,
      borderTopColor: isDark ? "rgba(220, 38, 38, 0.58)" : ALCHEMY.gold,
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 20px 44px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.04)"
            : "0 16px 38px rgba(24, 24, 27, 0.09), inset 0 1px 0 rgba(255,255,255,0.92)",
        },
        default: {},
      }),
    },
    signedOutTitle: {
      fontSize: typography.h2,
      fontFamily: fonts.extrabold,
      color: c.textPrimary,
      textAlign: "center",
      marginBottom: spacing.xs,
    },
    signedOutSub: {
      fontSize: typography.body,
      color: c.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: spacing.xl,
    },
    signedOutIconWrap: {
      alignSelf: "center",
      width: 58,
      height: 58,
      borderRadius: 29,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(220, 38, 38, 0.35)" : ALCHEMY.pillInactive,
      backgroundColor: isDark ? "rgba(220, 38, 38, 0.12)" : ALCHEMY.goldSoft,
    },
    primaryBtn: {
      marginBottom: spacing.sm,
    },
    secondaryBtn: {
      backgroundColor: cardBg,
    },
  });
}
