import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { ADMIN_FONT, adminShellMainPadding, getAdminChrome } from "../../theme/adminLayout";
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
      minHeight: Platform.select({ web: 60, default: 60 }),
      borderBottomWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      paddingHorizontal: Platform.select({ web: adminShellMainPadding(), default: 26 }),
      paddingVertical: Platform.select({ web: 12, default: 10 }),
      backgroundColor: chrome.topBarBg,
      flexWrap: "wrap",
      ...Platform.select({
        web: {
          position: "sticky",
          top: 0,
          zIndex: 8,
          backdropFilter: "blur(22px) saturate(170%)",
          WebkitBackdropFilter: "blur(22px) saturate(170%)",
          boxShadow: "0 1px 0 rgba(20,24,16,0.07)",
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
      fontFamily: ADMIN_FONT.semibold,
      fontWeight: "600",
      fontSize: Platform.select({ web: 22, default: 22 }),
      letterSpacing: -0.4,
      lineHeight: Platform.select({ web: 26, default: 26 }),
      color: chrome.ink,
    },
    sub: {
      fontSize: 13,
      lineHeight: 18,
      color: chrome.inkSoft,
      marginTop: 3,
      fontFamily: ADMIN_FONT.regular,
      maxWidth: Platform.select({ web: 440, default: undefined }),
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
      width: 34,
      height: 34,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      backgroundColor: chrome.card,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      ...Platform.select({
        web: {
          cursor: "pointer",
          transition: "transform 100ms ease-out, background-color 100ms ease-out",
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
