import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { createMyOrderReturnRequest } from "../../services/orderService";
import { formatRupees } from "../../utils/adminFormat";
import { isDeliveredOrder } from "../../utils/orderStatus";
import { fonts, spacing } from "../../theme/tokens";
import PremiumButton from "../ui/PremiumButton";
import PremiumInput from "../ui/PremiumInput";

function qtyOf(line) {
  return Math.max(0, Number(line.available ?? line.quantity ?? 0));
}

export default function OrderReturnRequest({ order, token, onChanged }) {
  const { colors: c } = useTheme();
  const toast = useToast();
  const styles = useMemo(() => createStyles(c), [c]);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [qty, setQty] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!isDeliveredOrder(order?.status)) return null;

  const latest = order.returnRequest;
  const pending = Boolean(order.hasPendingReturn || latest?.status === "pending");
  const returnable = (order.returnable || order.products || []).filter((line) => qtyOf(line) > 0);
  const canRequest = !pending && returnable.length > 0;

  const picked = returnable
    .map((line, index) => ({ line, quantity: Math.max(0, Number(qty[index] || 0)) }))
    .filter((row) => row.quantity > 0);

  const submit = async () => {
    const text = reason.trim();
    if (!picked.length) {
      setError("Choose how many jars to send back.");
      return;
    }
    if (!text) {
      setError("Write a reason.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await createMyOrderReturnRequest(token, order._id, {
        reason: text.slice(0, 300),
        lines: picked.map(({ line, quantity }) => ({
          product: line.product,
          name: line.name,
          variantLabel: line.variantLabel || "",
          quantity,
        })),
      });
      setOpen(false);
      setReason("");
      setQty({});
      toast.toastSuccess("Return request sent. We’ll review it.");
      await onChanged?.();
    } catch (err) {
      setError(err.message || "Couldn't send the return.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      {latest ? (
        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>
            {latest.status === "pending" ? "Return pending" : latest.status === "approved" ? "Return approved" : "Return rejected"}
          </Text>
          {latest.remarks ? <Text style={styles.remarks}>{latest.remarks}</Text> : null}
        </View>
      ) : null}

      {canRequest && !open ? (
        <PremiumButton label="Request a return" iconLeft="return-down-back-outline" variant="ghost" size="sm" onPress={() => setOpen(true)} />
      ) : null}

      {open ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Which jars are you sending back?</Text>
          {returnable.map((line, index) => {
            const max = qtyOf(line);
            const value = Math.min(max, Math.max(0, Number(qty[index] || 0)));
            return (
              <View key={`${line.name}-${index}`} style={styles.line}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.name} numberOfLines={2}>
                    {line.name}
                    {line.variantLabel ? ` · ${line.variantLabel}` : ""}
                  </Text>
                  <Text style={styles.meta}>
                    Up to {max} · {formatRupees(line.price)}
                  </Text>
                </View>
                <View style={styles.stepper}>
                  <Pressable
                    onPress={() => setQty((prev) => ({ ...prev, [index]: Math.max(0, value - 1) }))}
                    style={styles.step}
                    accessibilityLabel="Fewer"
                  >
                    <Text style={styles.stepText}>−</Text>
                  </Pressable>
                  <Text style={styles.qty}>{value}</Text>
                  <Pressable
                    onPress={() => setQty((prev) => ({ ...prev, [index]: Math.min(max, value + 1) }))}
                    style={styles.step}
                    accessibilityLabel="More"
                  >
                    <Text style={styles.stepText}>+</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
          <PremiumInput
            label="Reason"
            value={reason}
            onChangeText={setReason}
            placeholder="Why are you sending these back?"
            maxLength={300}
            multiline
            numberOfLines={3}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.row}>
            <PremiumButton label="Cancel" variant="ghost" size="sm" onPress={() => setOpen(false)} disabled={busy} />
            <PremiumButton label="Send request" variant="primary" size="sm" loading={busy} onPress={submit} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function createStyles(c) {
  return StyleSheet.create({
    wrap: { marginTop: spacing.sm, gap: 8 },
    statusBox: {
      padding: 10,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surfaceMuted || c.surface,
      gap: 4,
    },
    statusLabel: { fontFamily: fonts.semibold, fontSize: 13, color: c.textPrimary },
    remarks: { fontFamily: fonts.regular, fontSize: 12.5, color: c.textSecondary, lineHeight: 18 },
    form: { gap: 10 },
    formTitle: { fontFamily: fonts.semibold, fontSize: 13.5, color: c.textPrimary },
    line: { flexDirection: "row", alignItems: "center", gap: 10 },
    name: { fontFamily: fonts.medium, fontSize: 13, color: c.textPrimary },
    meta: { fontFamily: fonts.regular, fontSize: 11.5, color: c.textMuted, marginTop: 2 },
    stepper: { flexDirection: "row", alignItems: "center", gap: 8 },
    step: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    stepText: { fontSize: 18, color: c.textPrimary, lineHeight: 20 },
    qty: { minWidth: 18, textAlign: "center", fontFamily: fonts.bold, fontSize: 14, color: c.textPrimary },
    error: { fontFamily: fonts.medium, fontSize: 12.5, color: c.danger },
    row: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  });
}
