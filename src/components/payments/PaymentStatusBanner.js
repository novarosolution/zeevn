import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { fonts, icon, radius, spacing, typography } from "../../theme/tokens";
import { formatINR } from "../../utils/currency";
import {
  cancelPendingOrder,
  getPublicRazorpayKeyId,
  loadRazorpayWebSdk,
  openRazorpayCheckout,
  verifyOrderPayment,
} from "../../services/paymentService";
import PremiumErrorBanner from "../ui/PremiumErrorBanner";
import PremiumButton from "../ui/PremiumButton";

function formatMmSs(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/**
 * Gold callout shown on My Orders when a Razorpay order is still unpaid —
 * countdown, Pay now, Cancel.
 */
export default function PaymentStatusBanner({ order, token, user, onRefresh }) {
  const { colors: c, isDark } = useTheme();
  const styles = useMemo(() => createStyles(c, isDark), [c, isDark]);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const expiresAt = order?.paymentExpiresAt ? new Date(order.paymentExpiresAt).getTime() : 0;
  const remainingMs = expiresAt ? expiresAt - now : 0;
  const expired = expiresAt > 0 && remainingMs <= 0;

  const handlePay = useCallback(async () => {
    if (!token || !order?._id) return;
    setBusy(true);
    setLocalError("");
    try {
      const keyId = getPublicRazorpayKeyId();
      if (Platform.OS === "web") {
        await loadRazorpayWebSdk();
      }
      const checkout = await openRazorpayCheckout({
        order,
        razorpayKeyId: keyId,
        user,
        themeColor: c.primary,
      });
      if (checkout.status === "success" && checkout.payload) {
        const p = checkout.payload;
        await verifyOrderPayment(token, order._id, {
          razorpay_order_id: p.razorpay_order_id,
          razorpay_payment_id: p.razorpay_payment_id,
          razorpay_signature: p.razorpay_signature,
        });
        await onRefresh?.({ silent: true });
      } else if (checkout.status === "dismissed") {
        setLocalError("Checkout closed — tap Pay now when ready.");
      } else if (checkout.status === "fallback") {
        setLocalError("Complete payment in the browser window that opened.");
      }
    } catch (err) {
      setLocalError(err.message || "Payment failed.");
    } finally {
      setBusy(false);
    }
  }, [token, order, user, c.primary, onRefresh]);

  const handleCancel = useCallback(async () => {
    if (!token || !order?._id) return;
    setBusy(true);
    setLocalError("");
    try {
      await cancelPendingOrder(token, order._id);
      await onRefresh?.({ silent: true });
    } catch (err) {
      setLocalError(err.message || "Unable to cancel.");
    } finally {
      setBusy(false);
    }
  }, [token, order, onRefresh]);

  return (
    <View style={styles.shell}>
      <LinearGradient
        colors={
          isDark
            ? ["rgba(220, 38, 38, 0.14)", "rgba(28, 25, 23, 0.65)"]
            : ["rgba(255, 248, 232, 0.98)", "rgba(255, 252, 246, 0.92)"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.topRow}>
          <View style={styles.iconWrap}>
            <Ionicons name="flash-outline" size={icon.md} color={ALCHEMY.gold} />
          </View>
          <View style={styles.titleCol}>
            <Text style={styles.title}>Payment required</Text>
            <Text style={styles.sub}>
              Pay {formatINR(order?.totalPrice || 0)} via Razorpay to confirm this order.
            </Text>
          </View>
        </View>

        <View style={styles.timerRow}>
          <Ionicons name="timer-outline" size={icon.sm} color={expired ? c.danger : c.primary} />
          <Text style={[styles.timerText, expired ? styles.timerExpired : null]}>
            {expired
              ? "Payment window expired — this order may be cancelled automatically."
              : `Pay within ${formatMmSs(remainingMs)}`}
          </Text>
        </View>

        {localError ? <PremiumErrorBanner message={localError} severity="error" compact /> : null}

        <View style={styles.actions}>
          <PremiumButton
            label="Pay now"
            iconLeft="card-outline"
            variant="primary"
            size="md"
            loading={busy}
            disabled={busy || expired}
            onPress={handlePay}
          />
          <PremiumButton
            label="Cancel order"
            variant="ghost"
            size="md"
            disabled={busy}
            onPress={handleCancel}
          />
        </View>
      </LinearGradient>
    </View>
  );
}

function createStyles(c, isDark) {
  return StyleSheet.create({
    shell: {
      marginBottom: spacing.md,
      borderRadius: radius.xl,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(220, 38, 38, 0.35)" : ALCHEMY.gold,
    },
    gradient: {
      padding: spacing.md,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(220, 38, 38, 0.12)" : "rgba(255, 236, 196, 0.95)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(220, 38, 38, 0.35)" : ALCHEMY.gold,
    },
    titleCol: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontFamily: fonts.extrabold,
      fontSize: typography.body,
      color: c.textPrimary,
    },
    sub: {
      marginTop: 4,
      fontFamily: fonts.regular,
      fontSize: typography.caption,
      color: c.textSecondary,
      lineHeight: 18,
    },
    timerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: spacing.sm,
    },
    timerText: {
      flex: 1,
      fontFamily: fonts.semibold,
      fontSize: typography.caption,
      color: c.primary,
    },
    timerExpired: {
      color: c.danger,
    },
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      alignItems: "center",
    },
    payBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: spacing.lg,
      paddingVertical: 12,
      borderRadius: radius.pill,
      minWidth: 140,
      justifyContent: "center",
    },
    payBtnText: {
      fontFamily: fonts.extrabold,
      fontSize: typography.bodySmall,
      letterSpacing: 0.4,
    },
    cancelBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderRadius: radius.pill,
    },
    cancelBtnText: {
      fontFamily: fonts.bold,
      fontSize: typography.caption,
      color: c.textSecondary,
    },
  });
}
