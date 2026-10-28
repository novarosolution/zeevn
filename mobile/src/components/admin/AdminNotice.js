import React, { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { ADMIN_FONT } from "../../theme/adminLayout";
import { getAdminTone } from "../../theme/adminTones";

const SEVERITY = {
  error: { icon: "alert-circle", tone: "red" },
  warning: { icon: "warning", tone: "gold" },
  info: { icon: "information-circle", tone: "blue" },
  success: { icon: "checkmark-circle", tone: "green" },
};

/**
 * Inline admin message: tinted strip with a coloured edge, icon, optional title, message, action and dismiss.
 * Same props as the shop's PremiumErrorBanner so screens swap one for the other.
 */
function AdminNoticeBase({ severity = "error", title, message, onClose, onActionPress, actionLabel, style, compact = false }) {
  const { isDark } = useTheme();
  const sev = SEVERITY[severity] || SEVERITY.error;
  const t = getAdminTone(sev.tone, isDark);
  const styles = useMemo(() => createStyles(t, compact), [t, compact]);

  return (
    <View
      style={[styles.wrap, style]}
      accessibilityLiveRegion="polite"
      accessibilityRole={severity === "error" ? "alert" : undefined}
    >
      <Ionicons name={sev.icon} size={compact ? 16 : 18} color={t.solid} />
      <View style={styles.body}>
        {title ? (
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        ) : null}
        {message ? (
          <Text style={styles.message} numberOfLines={4}>
            {message}
          </Text>
        ) : null}
      </View>
      {onActionPress && actionLabel ? (
        <Pressable onPress={onActionPress} accessibilityRole="button" accessibilityLabel={actionLabel} style={styles.action}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
      {onClose ? (
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Dismiss">
          <Ionicons name="close" size={16} color={t.fg} />
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(t, compact) {
  return StyleSheet.create({
    wrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: compact ? 8 : 11,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      borderLeftWidth: 3,
      borderLeftColor: t.solid,
      backgroundColor: t.bg,
    },
    body: { flex: 1, minWidth: 0, gap: 1 },
    title: { fontSize: 13, color: t.fg, fontFamily: ADMIN_FONT.semibold, fontWeight: "600" },
    message: { fontSize: 13, lineHeight: 18, color: t.fg, fontFamily: ADMIN_FONT.regular },
    action: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    actionText: { fontSize: 12, color: t.fg, fontFamily: ADMIN_FONT.semibold },
  });
}

export default memo(AdminNoticeBase);
