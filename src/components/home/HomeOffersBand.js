import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { spacing as homeSpacing } from "../../styles/spacing";
import { homeType } from "../../styles/typography";

export default function HomeOffersBand() {
  const { colors: c, isDark } = useTheme();
  const navigation = useNavigation();
  const styles = useMemo(() => createStyles(c), [c]);
  const accentSoft = c.accentSoft || c.primarySoft;
  const brassAction = isDark ? c.accent : c.accentOnLight || c.accent;

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[accentSoft, "rgba(0,0,0,0)"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.card}
      >
        <View style={styles.topRow}>
          <Text style={[styles.overline, { color: brassAction }]}>REPLENISH</Text>
          <Text style={styles.title}>15% off your favourite restocks</Text>
          <Text style={styles.subtitle}>When you order an item you&apos;ve bought twice before.</Text>
        </View>
        <View style={styles.bottomRow}>
          <Pressable
            onPress={() => navigation.navigate("MyOrders")}
            style={({ pressed }) => [styles.cta, { backgroundColor: c.navy || c.bgDeep }, pressed ? styles.ctaPressed : null]}
            accessibilityRole="button"
            accessibilityLabel="Open my pantry"
          >
            <Text style={[styles.ctaText, { color: c.onPrimary }]}>Open my pantry</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

function createStyles(c) {
  return StyleSheet.create({
    wrap: {
      marginTop: homeSpacing.sm,
      marginBottom: homeSpacing.xl,
    },
    card: {
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
      paddingHorizontal: homeSpacing.lg,
      paddingVertical: homeSpacing.lg,
      gap: homeSpacing.md,
    },
    topRow: {
      gap: homeSpacing.xs,
    },
    overline: {
      fontSize: 10,
      lineHeight: 12,
      letterSpacing: 1.2,
      color: c.accent,
      fontFamily: homeType.overline.fontFamily,
    },
    title: {
      color: c.textPrimary,
      fontSize: 24,
      lineHeight: 28,
      fontFamily: homeType.display.fontFamily,
    },
    subtitle: {
      color: c.textSecondary,
      fontSize: 12,
      lineHeight: 16,
      fontFamily: homeType.uiRegular.fontFamily,
    },
    bottomRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    cta: {
      minHeight: 40,
      borderRadius: 999,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.textPrimary,
    },
    ctaPressed: {
      opacity: 0.84,
      transform: [{ scale: 0.98 }],
    },
    ctaText: {
      color: c.onPrimary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: homeType.uiSemibold.fontFamily,
    },
  });
}
