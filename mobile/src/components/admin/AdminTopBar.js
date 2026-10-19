import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { getAdminChrome } from "../../theme/adminLayout";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts, spacing } from "../../theme/tokens";

export default function AdminTopBar({
  title,
  subtitle,
  onNotifications,
  hasNotifications = false,
  headerRight,
  compact,
}) {
  const { colors: c, isDark, mode, setMode } = useTheme();
  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
  const styles = useMemo(() => createStyles(chrome), [chrome]);

  const themeIcon =
    mode === "dark" ? "moon" : mode === "light" ? "sunny" : "phone-portrait-outline";
  const cycleTheme = () => {
    setMode(mode === "light" ? "dark" : mode === "dark" ? "system" : "light");
  };

  return (
    <View style={[styles.bar, compact && styles.barCompact]}>
      <View style={styles.titleCol}>
        <Text style={styles.kicker}>ADMIN DESK</Text>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.sub, compact && styles.subCompact]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.actions}>
        <Pressable
          style={({ hovered }) => [styles.iconBtn, hovered && styles.iconBtnHover]}
          onPress={cycleTheme}
          accessibilityLabel={`Theme: ${mode}`}
        >
          <Ionicons name={themeIcon} size={16} color={chrome.inkSoft} />
        </Pressable>
        {onNotifications ? (
          <Pressable
            style={({ hovered }) => [styles.iconBtn, hovered && styles.iconBtnHover]}
            onPress={onNotifications}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={16} color={chrome.inkSoft} />
            {hasNotifications ? <View style={styles.dot} /> : null}
          </Pressable>
        ) : null}
        {headerRight}
      </View>
    </View>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    bar: {
      minHeight: Platform.select({ web: 72, default: 64 }),
      borderBottomWidth: 1,
      borderBottomColor: chrome.line,
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      paddingHorizontal: Platform.select({ web: 24, default: 26 }),
      paddingVertical: Platform.select({ web: 14, default: 12 }),
      backgroundColor: chrome.topBarBg,
      flexWrap: "wrap",
      ...Platform.select({
        web: {
          position: "sticky",
          top: 0,
          zIndex: 8,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.45)",
        },
        default: {},
      }),
    },
    barCompact: {
      paddingHorizontal: 0,
      backgroundColor: "transparent",
      borderBottomWidth: 1,
      borderBottomColor: chrome.line,
      minHeight: 0,
      paddingVertical: spacing.sm,
      marginBottom: spacing.xs,
      gap: 10,
    },
    titleCol: { flexShrink: 1, minWidth: 120, flex: 1 },
    kicker: {
      fontSize: 9,
      letterSpacing: 1.8,
      fontFamily: fonts.bold,
      color: chrome.goldDeep,
      marginBottom: 3,
    },
    title: {
      fontFamily: FONT_HEADING,
      fontWeight: "500",
      fontSize: Platform.select({ web: 26, default: 24 }),
      letterSpacing: -0.4,
      color: chrome.ink,
    },
    sub: {
      fontSize: 13,
      lineHeight: 18,
      color: chrome.inkFaint,
      marginTop: 4,
      fontFamily: fonts.regular,
      maxWidth: Platform.select({ web: 520, default: undefined }),
    },
    subCompact: {
      fontSize: 12,
      lineHeight: 16,
      marginTop: 2,
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginLeft: "auto",
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: chrome.line,
      backgroundColor: chrome.card,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      ...Platform.select({
        web: {
          cursor: "pointer",
          transition: "transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease",
          boxShadow: "0 1px 2px rgba(25,20,15,.04)",
        },
        default: {},
      }),
    },
    iconBtnHover: Platform.select({
      web: {
        transform: [{ translateY: -1 }],
        borderColor: chrome.linkOnBorder,
        boxShadow: "0 4px 12px -6px rgba(25,20,15,.16)",
      },
      default: {},
    }),
    dot: {
      position: "absolute",
      top: 8,
      right: 9,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: chrome.gold,
      borderWidth: 1.5,
      borderColor: chrome.card,
    },
  });
}
