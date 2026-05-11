import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PremiumCard from "./PremiumCard";
import { useTheme } from "../../context/ThemeContext";
import { fonts, icon, spacing, typography } from "../../theme/tokens";
import { HERITAGE } from "../../theme/customerAlchemy";

export default function InteractiveListRow({ iconName, title, subtitle, onPress, tone = "normal", rightSlot }) {
  const { colors: c, isDark } = useTheme();
  const isDanger = tone === "danger";
  const isAccent = tone === "accent";
  return (
    <PremiumCard
      onPress={onPress}
      variant={isDanger ? "danger" : "list"}
      padding="md"
      contentStyle={styles.content}
      goldAccent={isAccent}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: isDanger
              ? "rgba(220,38,38,0.08)"
              : isAccent
                ? isDark
                  ? HERITAGE.soft
                  : "rgba(217,119,6,0.08)"
                : c.secondarySoft,
            borderColor: isDanger ? c.danger : isAccent ? HERITAGE.ring : c.secondaryBorder,
          },
        ]}
      >
        <Ionicons
          name={iconName}
          size={icon.sm}
          color={isDanger ? c.danger : isAccent ? HERITAGE.amberMid : c.secondaryDark}
        />
      </View>
      <View style={styles.textCol}>
        <Text style={[styles.title, { color: isDanger ? c.danger : c.textPrimary }]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: c.textSecondary }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightSlot || (
        <Ionicons
          name="chevron-forward"
          size={icon.xs}
          color={isAccent ? HERITAGE.amberMid : c.textMuted}
          style={styles.chevron}
        />
      )}
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    minHeight: 54,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: typography.bodySmall,
    fontFamily: fonts.bold,
  },
  subtitle: {
    marginTop: 3,
    fontSize: typography.caption,
    fontFamily: fonts.regular,
  },
  chevron: {
    marginTop: Platform.OS === "web" ? 1 : 0,
  },
});
