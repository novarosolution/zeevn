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
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          onPress={cycleTheme}
          accessibilityLabel={`Theme: ${mode}`}
        >
          <Ionicons name={themeIcon} size={16} color={chrome.inkSoft} />
        </Pressable>
        {onNotifications ? (
          <Pressable
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
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
      minHeight: Platform.select({ web: 68, default: 64 }),
      borderBottomWidth: 0,
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
          backdropFilter: "blur(22px) saturate(180%)",
          WebkitBackdropFilter: "blur(22px) saturate(180%)",
          boxShadow: "0 1px 0 rgba(25,20,15,0.05), 0 18px 28px -22px rgba(25,20,15,0.22)",
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
    title: {
      fontFamily: FONT_HEADING,
      fontWeight: "500",
      fontSize: Platform.select({ web: 28, default: 24 }),
      letterSpacing: -0.55,
      lineHeight: Platform.select({ web: 32, default: 28 }),
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
          transition: "transform 100ms ease-out",
        },
        default: {},
      }),
    },
    iconBtnPressed: { transform: [{ scale: 0.97 }] },
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
