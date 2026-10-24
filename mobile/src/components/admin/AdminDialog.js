import React, { useCallback, useMemo, useRef, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAdminChrome } from "../../theme/adminLayout";
import { getAdminTone } from "../../theme/adminTones";
import { useTheme } from "../../context/ThemeContext";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts } from "../../theme/tokens";
import AdminButton from "./AdminButton";

/** Centered confirmation card. `tone="danger"` turns the confirm button red. Children render between message and buttons. */
export function AdminDialog({
  visible,
  title,
  message,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  icon,
  loading = false,
  confirmDisabled = false,
  hideCancel = false,
  onConfirm,
  onCancel,
}) {
  const chrome = useAdminChrome();
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(chrome), [chrome]);
  const danger = tone === "danger";
  const accent = getAdminTone(danger ? "red" : "gold", isDark);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={loading ? undefined : onCancel} accessibilityLabel="Dismiss" />
        <View style={styles.card} accessibilityRole="alert">
          <View style={[styles.iconWell, { backgroundColor: accent.bg, borderColor: accent.border }]}>
            <Ionicons name={icon || (danger ? "warning-outline" : "help-circle-outline")} size={20} color={accent.fg} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {children}
          <View style={styles.actions}>
            {hideCancel ? null : <AdminButton label={cancelLabel} variant="soft" size="md" onPress={onCancel} disabled={loading} />}
            <AdminButton
              label={confirmLabel}
              variant={danger ? "danger" : "primary"}
              size="md"
              onPress={onConfirm}
              loading={loading}
              disabled={confirmDisabled}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Promise-based confirm for event handlers:
 *   const { confirm, dialog } = useAdminConfirm();
 *   if (!(await confirm({ title: "Cancel 3 orders?", tone: "danger", confirmLabel: "Cancel orders" }))) return;
 * Render `{dialog}` once in the screen.
 */
export function useAdminConfirm() {
  const [options, setOptions] = useState(null);
  const resolver = useRef(null);

  const settle = useCallback((answer) => {
    const done = resolver.current;
    resolver.current = null;
    setOptions(null);
    if (done) done(answer);
  }, []);

  const confirm = useCallback(
    (next) =>
      new Promise((resolve) => {
        if (resolver.current) resolver.current(false);
        resolver.current = resolve;
        setOptions(next || {});
      }),
    []
  );

  const dialog = (
    <AdminDialog
      visible={Boolean(options)}
      title={options?.title || "Are you sure?"}
      message={options?.message}
      confirmLabel={options?.confirmLabel}
      cancelLabel={options?.cancelLabel}
      tone={options?.tone}
      icon={options?.icon}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  );

  return { confirm, dialog };
}

function createStyles(chrome) {
  return StyleSheet.create({
    root: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(20, 24, 16, 0.48)" },
    card: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: chrome.card,
      borderRadius: 20,
      padding: 24,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      ...Platform.select({ web: { boxShadow: "0 28px 70px -20px rgba(20,24,16,0.5)" }, default: {} }),
    },
    iconWell: {
      width: 42,
      height: 42,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      marginBottom: 14,
    },
    title: { fontFamily: FONT_HEADING, fontSize: 21, lineHeight: 26, letterSpacing: -0.3, color: chrome.ink },
    message: { marginTop: 8, fontSize: 13.5, lineHeight: 20, color: chrome.inkSoft, fontFamily: fonts.regular },
    actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 22 },
  });
}
