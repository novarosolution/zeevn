import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { resetNavigationToHome } from "../navigation/resetToHome";
import { Ionicons } from "@expo/vector-icons";
import { ALCHEMY } from "../theme/customerAlchemy";
import { customerPanel, customerScrollPaddingTop } from "../theme/screenLayout";
import { fonts, spacing, typography } from "../theme/tokens";
import BottomNavBar from "./BottomNavBar";
import CustomerScreenShell from "./CustomerScreenShell";
import SessionExpiredBanner from "./SessionExpiredBanner";
import Button from "./ui/Button";
import { AUTH_SCREEN } from "../content/appContent";

/**
 * Empty shell while auth is restoring.
 * When `signedOut` is set, shows sign-in / home instead of auto-redirecting to Login
 * (avoids racing with logout + stack reset).
 */
const gateCopy = AUTH_SCREEN.gateShell;

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
            <Text accessibilityRole="header" style={styles.signedOutTitle}>
              {gateCopy.title}
            </Text>
            <Text style={styles.signedOutSub}>{gateCopy.subtitle}</Text>
            <Button
              label={gateCopy.signInCta}
              accessibilityLabel={gateCopy.signInCta}
              onPress={() => navigation.navigate("Login")}
              variant="primary"
              size="lg"
              fullWidth
              style={styles.primaryBtn}
            />
            <Button
              label={gateCopy.guestCta}
              accessibilityLabel={gateCopy.guestCta}
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
    shell: {
      flex: 1,
      ...Platform.select({
        web: {
          paddingTop: customerScrollPaddingTop(),
        },
        default: {},
      }),
    },
    fill: { flex: 1 },
    signedOutInner: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.lg,
      justifyContent: "center",
      alignItems: "center",
    },
    signedOutCard: {
      width: "100%",
      maxWidth: 400,
      alignSelf: "center",
      borderTopWidth: 3,
      borderTopColor: isDark ? c.primaryBorder : ALCHEMY.gold,
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
      fontFamily: fonts.bold,
      color: c.textPrimary,
      textAlign: "center",
      marginBottom: spacing.xs,
    },
    signedOutSub: {
      fontSize: typography.bodySmall + 1,
      color: c.textSecondary,
      textAlign: "center",
      lineHeight: 21,
      marginBottom: spacing.lg + 2,
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
      borderColor: isDark ? c.primaryBorder : ALCHEMY.pillInactive,
      backgroundColor: isDark ? c.primarySoft : ALCHEMY.goldSoft,
    },
    primaryBtn: {
      marginBottom: spacing.sm,
    },
    secondaryBtn: {
      backgroundColor: cardBg,
    },
  });
}
