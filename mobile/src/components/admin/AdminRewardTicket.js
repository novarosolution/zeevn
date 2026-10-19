import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { getAdminChrome } from "../../theme/adminLayout";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts } from "../../theme/tokens";
import AdminStatusPill from "./AdminStatusPill";

export default function AdminRewardTicket({
  title,
  description,
  pointsCost,
  usageText,
  status,
  active,
  onToggle,
  onPress,
}) {
  const { colors: c, isDark } = useTheme();
  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
  const styles = useMemo(() => createStyles(chrome), [chrome]);
  const tone = status === "Active" ? "ok" : status === "Expired" ? "cancel" : "pend";
  const Wrap = onPress ? Pressable : View;
  const wrapProps = onPress ? { onPress, accessibilityRole: "button" } : {};

  return (
    <Wrap style={styles.ticket} {...wrapProps}>
      <View style={styles.top}>
        <Text style={styles.title}>{title}</Text>
        <Switch
          value={active}
          onValueChange={onToggle}
          trackColor={{ false: chrome.paper, true: chrome.gold }}
          thumbColor={c.surface}
        />
      </View>
      <Text style={styles.points}>{pointsCost} pts</Text>
      <Text style={styles.desc}>{description}</Text>
      <View style={styles.foot}>
        <Text style={styles.usage}>{usageText}</Text>
        <AdminStatusPill label={status} tone={tone} />
      </View>
    </Wrap>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    ticket: {
      backgroundColor: chrome.card,
      borderWidth: 1,
      borderColor: chrome.line,
      borderRadius: 16,
      padding: 18,
      ...Platform.select({
        web: {
          boxShadow: "0 1px 2px rgba(25,20,15,.04), 0 12px 28px -18px rgba(25,20,15,.14)",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        },
        default: {},
      }),
    },
    top: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 8,
    },
    title: {
      flex: 1,
      fontFamily: FONT_HEADING,
      fontSize: 16,
      fontWeight: "600",
      color: chrome.ink,
    },
    points: {
      fontFamily: fonts.bold,
      fontSize: 11,
      color: chrome.goldDeep,
      letterSpacing: 0.6,
      marginTop: 6,
      textTransform: "uppercase",
    },
    desc: {
      fontSize: 12.5,
      color: chrome.inkSoft,
      marginVertical: 8,
      lineHeight: 18,
    },
    foot: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderTopWidth: 1,
      borderStyle: "dashed",
      borderTopColor: chrome.line,
      paddingTop: 10,
    },
    usage: {
      fontSize: 11,
      color: chrome.inkFaint,
      flex: 1,
      marginRight: 8,
    },
  });
}
