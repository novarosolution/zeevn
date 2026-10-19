import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { getAdminChrome } from "../../theme/adminLayout";
import { fonts, spacing } from "../../theme/tokens";
import {
  ORDER_ADMIN_NEXT_STATUS,
  getAdminNextStatusLabel,
  getOrderStatusLabel,
} from "../../utils/orderStatus";
import PremiumButton from "../ui/PremiumButton";

const QUICK_PATH = [
  { status: "confirmed", label: "Confirm", icon: "checkmark-circle-outline" },
  { status: "preparing", label: "Preparing", icon: "restaurant-outline" },
  { status: "ready_for_pickup", label: "Ready", icon: "cube-outline" },
  { status: "out_for_delivery", label: "Out", icon: "bicycle-outline" },
  { status: "delivered", label: "Delivered", icon: "flag-outline" },
];

/**
 * One-tap fulfillment controls for the order manage desk.
 */
export default function AdminOrderQuickActions({
  status,
  busy = false,
  compact = false,
  onStatus,
  onCancel,
  onAdvance,
}) {
  const { colors: c, isDark } = useTheme();
  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
  const styles = useMemo(() => createStyles(chrome, compact), [chrome, compact]);
  const current = String(status || "");
  const next = ORDER_ADMIN_NEXT_STATUS[current];
  const terminal = current === "delivered" || current === "cancelled";

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.kicker}>Quick manage</Text>
        <Text style={styles.now}>
          Now: {getOrderStatusLabel(current)}
          {next ? ` → ${getAdminNextStatusLabel(current)}` : ""}
        </Text>
      </View>

      <View style={styles.row}>
        {next && onAdvance ? (
          <PremiumButton
            label={busy ? "Updating…" : `Advance · ${getAdminNextStatusLabel(current)}`}
            iconLeft="play-forward-outline"
            variant="primary"
            size={compact ? "sm" : "md"}
            loading={busy}
            disabled={busy}
            onPress={() => onAdvance(next)}
            style={styles.advanceBtn}
          />
        ) : null}

        {QUICK_PATH.map((step) => {
          const done =
            QUICK_PATH.findIndex((s) => s.status === current) >=
            QUICK_PATH.findIndex((s) => s.status === step.status);
          const isCurrent = current === step.status;
          return (
            <PremiumButton
              key={step.status}
              label={step.label}
              iconLeft={step.icon}
              variant={isCurrent ? "primary" : done ? "secondary" : "ghost"}
              size="sm"
              disabled={busy || terminal || isCurrent}
              onPress={() => onStatus?.(step.status)}
              style={styles.chipBtn}
            />
          );
        })}

        {!terminal && onCancel ? (
          <PremiumButton
            label="Cancel"
            iconLeft="close-circle-outline"
            variant="danger"
            size="sm"
            disabled={busy}
            onPress={onCancel}
            style={styles.chipBtn}
          />
        ) : null}
      </View>
    </View>
  );
}

function createStyles(chrome, compact) {
  return StyleSheet.create({
    wrap: {
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      backgroundColor: chrome.card,
      padding: compact ? spacing.sm + 2 : spacing.md,
      marginBottom: spacing.md,
      gap: spacing.sm,
      ...Platform.select({
        web: {
          boxShadow: "0 1px 2px rgba(25,20,15,.04), 0 12px 28px -18px rgba(25,20,15,.14)",
        },
        default: {},
      }),
    },
    head: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 8,
    },
    kicker: {
      fontSize: 10,
      letterSpacing: 1.4,
      textTransform: "uppercase",
      fontFamily: fonts.bold,
      color: chrome.goldDeep,
    },
    now: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: chrome.inkFaint,
    },
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      alignItems: "center",
    },
    advanceBtn: {
      minWidth: Platform.select({ web: 220, default: "100%" }),
    },
    chipBtn: {
      flexGrow: 0,
    },
  });
}
