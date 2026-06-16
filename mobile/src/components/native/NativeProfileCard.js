import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { FIGMA, figmaCardShell, figmaDisplayTitle, figmaTextMuted } from "../../theme/figmaApp";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";

/** figmaforkankreg.html account profile card */
export default function NativeProfileCard({ name, email, avatarUrl, memberTag }) {
  const { isDark } = useTheme();
  if (Platform.OS === "web") return null;
  const initial = String(name || email || "K").trim().charAt(0).toUpperCase();
  const avatar = String(avatarUrl || "").trim();

  return (
    <View style={[figmaCardShell(isDark), styles.card]}>
      {avatar ? (
        <Image source={{ uri: avatar }} style={styles.avatarImage} contentFit="cover" />
      ) : (
        <LinearGradient colors={["#DCAC74", "#244424"]} style={styles.avatar}>
          <Text style={[figmaDisplayTitle(24), styles.avatarText]}>{initial}</Text>
        </LinearGradient>
      )}
      <View style={styles.meta}>
        <Text style={[figmaDisplayTitle(16, isDark), styles.name]} numberOfLines={2}>
          {name || "Member"}
        </Text>
        {email ? (
          <Text style={[styles.email, figmaTextMuted(isDark)]} numberOfLines={1}>
            {email}
          </Text>
        ) : null}
        {memberTag ? (
          <View style={styles.badge}>
            <Text style={[styles.badgeText, { color: isDark ? FIGMA.goldBright : FIGMA.goldDeep }]}>
              {memberTag}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    marginBottom: 14,
    borderRadius: FIGMA.radiusCard,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    flexShrink: 0,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "500",
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontWeight: "500",
  },
  email: {
    fontFamily: fonts.regular,
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    alignSelf: "flex-start",
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(169,119,46,0.14)",
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: FIGMA.goldDeep,
  },
});
