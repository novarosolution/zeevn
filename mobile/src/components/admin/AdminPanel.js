import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { adminPanel, getAdminChrome } from "../../theme/adminLayout";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts, spacing } from "../../theme/tokens";

export default function AdminPanel({
  title,
  meta,
  description,
  icon,
  action,
  onAction,
  children,
  style,
  noPadding,
  tone = "default",
}) {
  const { colors: c, shadowPremium, isDark } = useTheme();
  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
  const styles = useMemo(
    () => createStyles(chrome, adminPanel(c, shadowPremium, isDark)),
    [chrome, c, shadowPremium, isDark]
  );

  return (
    <View style={[styles.panel, tone === "soft" && styles.panelSoft, style]}>
      {title ? (
        <View style={[styles.head, noPadding && styles.headPadded]}>
          <View style={styles.headMain}>
            {icon ? (
              <View style={styles.iconWell}>
                <Ionicons name={icon} size={16} color={chrome.goldDeep} />
              </View>
            ) : null}
            <View style={styles.titleCol}>
              <View style={styles.titleBlock}>
                <Text style={styles.title}>{title}</Text>
                {meta ? (
                  <View style={styles.metaPill}>
                    <Text style={styles.meta}>{meta}</Text>
                  </View>
                ) : null}
              </View>
              {description ? <Text style={styles.description}>{description}</Text> : null}
            </View>
          </View>
          {action ? (
            <Pressable
              onPress={onAction}
              hitSlop={8}
              style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
              accessibilityRole="button"
            >
              <Text style={styles.action}>{action}</Text>
              <Ionicons name="chevron-forward" size={12} color={chrome.goldDeep} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <View style={[noPadding ? null : styles.body, noPadding && styles.bodyFlush]}>{children}</View>
    </View>
  );
}

function createStyles(chrome, panelBase) {
  return StyleSheet.create({
    panel: {
      ...panelBase,
    },
    panelSoft: {
      backgroundColor: chrome.paper,
      borderTopWidth: 1,
      borderTopColor: chrome.line,
    },
    head: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: Platform.select({ web: 16, default: 14 }),
      paddingBottom: Platform.select({ web: 14, default: 0 }),
      borderBottomWidth: Platform.select({ web: StyleSheet.hairlineWidth, default: 0 }),
      borderBottomColor: chrome.lineSoft,
    },
    headPadded: {
      paddingHorizontal: Platform.select({ web: 22, default: 0 }),
      paddingTop: Platform.select({ web: 6, default: 0 }),
    },
    headMain: {
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      minWidth: 0,
    },
    iconWell: {
      width: 34,
      height: 34,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: chrome.chipOnBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.chipOnBorder,
      marginTop: 1,
    },
    titleCol: { flex: 1, minWidth: 0 },
    titleBlock: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
    },
    title: {
      fontFamily: FONT_HEADING,
      fontSize: Platform.select({ web: 18, default: 17 }),
      fontWeight: "500",
      letterSpacing: -0.25,
      color: chrome.ink,
    },
    description: {
      marginTop: 4,
      fontSize: 12.5,
      lineHeight: 17,
      color: chrome.inkFaint,
      fontFamily: fonts.regular,
      maxWidth: 520,
    },
    metaPill: {
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: chrome.paper,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
    },
    meta: {
      fontSize: 10.5,
      color: chrome.inkFaint,
      fontFamily: fonts.medium,
      letterSpacing: 0.2,
    },
    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: chrome.chipOnBorder || chrome.line,
      backgroundColor: chrome.chipOnBg || chrome.paper,
      marginTop: 2,
      ...Platform.select({
        web: { cursor: "pointer", transition: "transform 100ms ease-out" },
        default: {},
      }),
    },
    actionBtnPressed: { transform: [{ scale: 0.97 }] },
    action: {
      fontSize: 11,
      color: chrome.goldDeep,
      fontFamily: fonts.semibold,
    },
    body: {
      gap: spacing.sm,
    },
    bodyFlush: {
      gap: 0,
    },
  });
}
