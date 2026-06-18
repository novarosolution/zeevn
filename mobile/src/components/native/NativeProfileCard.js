import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { FONT_HEADING_SEMI } from "../../theme/typographyRoles";
import { FIGMA, figmaCardShell, figmaDisplayTitle, figmaTextMuted } from "../../theme/figmaApp";
import { useTheme } from "../../context/ThemeContext";
import { fonts, radius, spacing } from "../../theme/tokens";
import { platformShadow } from "../../theme/shadowPlatform";

const cardShadow = platformShadow({
  ios: {
    shadowColor: "#3D2A12",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
  },
  android: { elevation: 3 },
  web: {},
});

/** Premium native account profile hero card. */
export default function NativeProfileCard({ name, email, avatarUrl, memberTag }) {
  const { isDark } = useTheme();
  if (Platform.OS === "web") return null;
  const initial = String(name || email || "K").trim().charAt(0).toUpperCase();
  const avatar = String(avatarUrl || "").trim();

  return (
    <View style={[figmaCardShell(isDark), styles.card, cardShadow]}>
      <LinearGradient
        colors={[ALCHEMY.goldBright, ALCHEMY.gold, ALCHEMY.goldDeep]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.topAccent}
        pointerEvents="none"
      />

      <View style={styles.avatarRing}>
        <LinearGradient
          colors={[ALCHEMY.goldBright, ALCHEMY.goldDeep, "#244424"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarRingGrad}
        >
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <LinearGradient colors={["#DCAC74", "#244424"]} style={styles.avatar}>
              <Text style={[figmaDisplayTitle(22), styles.avatarText]}>{initial}</Text>
            </LinearGradient>
          )}
        </LinearGradient>
      </View>

      <View style={styles.meta}>
        <Text style={[figmaDisplayTitle(17, isDark), styles.name]} numberOfLines={2}>
          {name || "Member"}
        </Text>
        {email ? (
          <Text style={[styles.email, figmaTextMuted(isDark)]} numberOfLines={1}>
            {email}
          </Text>
        ) : null}
        {memberTag ? (
          <LinearGradient
            colors={
              isDark
                ? ["rgba(31, 92, 71, 0.3)", "rgba(201, 162, 39, 0.18)"]
                : ["rgba(255, 252, 248, 0.95)", "rgba(220, 172, 116, 0.2)"]
            }
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.badge}
          >
            <Ionicons name="sparkles" size={10} color={isDark ? FIGMA.goldBright : FIGMA.goldDeep} />
            <Text style={[styles.badgeText, { color: isDark ? FIGMA.goldBright : FIGMA.goldDeep }]}>
              {memberTag}
            </Text>
          </LinearGradient>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    borderRadius: FIGMA.radiusCard,
    overflow: "hidden",
  },
  topAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.95,
  },
  avatarRing: {
    flexShrink: 0,
  },
  avatarRingGrad: {
    width: 58,
    height: 58,
    borderRadius: 29,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "rgba(255,252,248,0.9)",
  },
  avatarText: {
    color: "#fff",
    fontFamily: FONT_HEADING_SEMI,
    fontWeight: "500",
  },
  meta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontWeight: "500",
    fontFamily: FONT_HEADING_SEMI,
  },
  email: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 1,
  },
  badge: {
    alignSelf: "flex-start",
    marginTop: spacing.xs + 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(201, 162, 39, 0.32)",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "100%",
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    flexShrink: 1,
  },
});
