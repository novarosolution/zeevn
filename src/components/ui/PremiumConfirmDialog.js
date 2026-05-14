import React from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { fonts, radius, spacing, typography } from "../../theme/tokens";
import PremiumButton from "./PremiumButton";
import PremiumCard from "./PremiumCard";

export default function PremiumConfirmDialog({
  visible,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
  busy = false,
}) {
  const { colors: c, isDark } = useTheme();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.cardWrap}>
          <PremiumCard variant="elevated" padding="lg" style={styles.card}>
            <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
            {message ? (
              <Text style={[styles.message, { color: c.textSecondary }]}>{message}</Text>
            ) : null}
            <View style={styles.actions}>
              <PremiumButton
                label={cancelLabel}
                variant="secondary"
                onPress={onCancel}
                disabled={busy}
                style={styles.actionBtn}
              />
              <PremiumButton
                label={confirmLabel}
                variant={confirmVariant}
                loading={busy}
                onPress={onConfirm}
                style={styles.actionBtn}
              />
            </View>
          </PremiumCard>
        </View>
        <View
          style={[
            styles.scrim,
            { backgroundColor: isDark ? "rgba(0,0,0,0.56)" : "rgba(15,23,42,0.34)" },
          ]}
          pointerEvents="none"
        />
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
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  cardWrap: {
    width: "100%",
    maxWidth: 460,
    zIndex: 1,
  },
  card: {
    borderRadius: radius.xl,
    ...Platform.select({
      web: { backdropFilter: "blur(6px)" },
      default: {},
    }),
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
