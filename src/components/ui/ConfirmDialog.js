import React, { useRef } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { fonts, radius, spacing, typography } from "../../theme/tokens";
import {
  WEB_Z_INDEX,
  webDialogLayerStyle,
  webOverlayRootStyle,
  webOverlayScrimStyle,
} from "../../theme/web";
import useModalA11y from "../../hooks/useModalA11y";
import Button from "./Button";
import Card from "./Card";
import Modal from "./Modal";

export default function ConfirmDialog({
  visible,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
  busy = false,
  triggerRef,
}) {
  const { colors: c, isDark, SPACING } = useTheme();
  const containerRef = useRef(null);

  useModalA11y({ visible, onClose: onCancel, triggerRef, containerRef });

  if (!visible) return null;

  const mappedConfirmVariant = confirmVariant === "danger" ? "destructive" : confirmVariant;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View
        ref={containerRef}
        style={[styles.overlay, webOverlayRootStyle(WEB_Z_INDEX.dialog)]}
        accessibilityViewIsModal
      >
        <Pressable
          style={[styles.scrim, webOverlayScrimStyle(isDark)]}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Dismiss dialog"
        />
        <View style={[styles.cardWrap, webDialogLayerStyle()]}>
          <Card padding={SPACING.lg} style={styles.card}>
            <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
            {message ? (
              <Text style={[styles.message, { color: c.textSecondary }]}>{message}</Text>
            ) : null}
            <View style={styles.actions}>
              <Button
                label={cancelLabel}
                variant="secondary"
                onPress={onCancel}
                disabled={busy}
                style={styles.actionBtn}
              />
              <Button
                label={confirmLabel}
                variant={mappedConfirmVariant}
                loading={busy}
                onPress={onConfirm}
                style={styles.actionBtn}
              />
            </View>
          </Card>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  scrim: {},
  cardWrap: {
    width: "100%",
    maxWidth: 460,
    ...Platform.select({
      web: { position: "relative" },
      default: {},
    }),
  },
  card: {
    borderRadius: radius.xl,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: typography.h3,
    lineHeight: typography.h3 + 6,
    letterSpacing: -0.24,
  },
  message: {
    marginTop: spacing.xs,
    fontFamily: fonts.medium,
    fontSize: typography.bodySmall,
    lineHeight: typography.bodySmall + 6,
  },
  actions: {
    marginTop: spacing.md + 2,
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
});
