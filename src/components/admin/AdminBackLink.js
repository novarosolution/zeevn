import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { fonts, radius, spacing, typography } from "../../theme/tokens";

/**
 * Gold-accent back link to the admin dashboard (shared across admin tools).
 */
export default function AdminBackLink({ navigation, label = "Dashboard", target = "AdminDashboard" }) {
  const { colors: c, isDark } = useTheme();
  const styles = useMemo(() => createStyles(c, isDark), [c, isDark]);

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => navigation.navigate(target)}
      activeOpacity={0.86}
      accessibilityRole="button"
      accessibilityLabel={`Back to ${label}`}
    >
      <Ionicons name="chevron-back" size={20} color={isDark ? c.primary : ALCHEMY.brown} />
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

function createStyles(c, isDark) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      marginBottom: spacing.lg,
      paddingVertical: 8,
      paddingRight: spacing.md,
      paddingLeft: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? c.primaryBorder : ALCHEMY.pillInactive,
      backgroundColor: isDark ? c.primarySoft : ALCHEMY.creamDeep,
      gap: 4,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    text: {
      fontFamily: fonts.bold,
      fontSize: typography.bodySmall,
      color: isDark ? c.textPrimary : ALCHEMY.brown,
      letterSpacing: 0.1,
    },
  });
}
