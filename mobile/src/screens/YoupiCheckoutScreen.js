import React, { useCallback, useMemo } from "react";
import { Image, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { verifyOrderPayment } from "../services/paymentService";

function buildUpiUri({ upiUri, vpa, payeeName, amount, orderId }) {
  if (String(upiUri || "").trim()) return String(upiUri).trim();
  const pa = String(vpa || "8320631598@ybl").trim();
  const pn = String(payeeName || "Zeevan").trim();
  const am = Number(amount);
  const tn = String(orderId || "Zeevan").replace(/[^a-zA-Z0-9_-]/g, "").slice(-18);
  return `upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn)}&am=${encodeURIComponent(Number.isFinite(am) ? am.toFixed(2) : "0.00")}&cu=INR&tn=${encodeURIComponent(tn || "Zeevan")}`;
}

export default function YoupiCheckoutScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const p = route?.params || {};
  const vpa = String(p.vpa || "8320631598@ybl").trim();
  const payeeName = String(p.payeeName || "Zeevan").trim();
  const amount = Number(p.amount);
  const amountLabel = Number.isFinite(amount) ? `₹${amount.toFixed(2)}` : "Pay now";
  const upiUri = useMemo(
    () => buildUpiUri({ upiUri: p.upiUri, vpa, payeeName, amount, orderId: p.orderId }),
    [p.upiUri, p.orderId, vpa, payeeName, amount]
  );
  const qrUri = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiUri)}`;

  const finish = useCallback(() => {
    if (p.orderId) verifyOrderPayment(null, p.orderId, { confirmed: true }).catch(() => {});
    navigation.replace("MyOrders");
  }, [navigation, p.orderId]);

  const pay = useCallback(() => {
    Linking.openURL(upiUri).catch(() => {});
  }, [upiUri]);

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.bar}>
        <Pressable onPress={finish} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close payment">
          <Ionicons name="close" size={20} color="#1c1917" />
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
        <Text style={styles.title}>Pay Zeevan</Text>
        <View style={styles.barSpacer} />
      </View>

      <View style={styles.card}>
        <Text style={styles.payee}>{payeeName}</Text>
        <Text style={styles.amount}>{amountLabel}</Text>
        <Image source={{ uri: qrUri }} style={styles.qr} accessibilityLabel="UPI QR" />
        <Text style={styles.vpa}>{vpa}</Text>
        <Text style={styles.hint}>Scan this QR or open UPI. Money goes to this ID — not a demo account.</Text>
      </View>

      <Pressable style={styles.payBtn} onPress={pay} accessibilityRole="button">
        <Ionicons name="phone-portrait-outline" size={18} color="#fff" />
        <Text style={styles.payBtnText}>{Platform.OS === "web" ? "Open UPI" : "Pay with UPI"}</Text>
      </Pressable>
      <Pressable
        style={styles.copyBtn}
        onPress={() => Clipboard.setStringAsync(vpa).catch(() => {})}
        accessibilityRole="button"
      >
        <Text style={styles.copyText}>Copy UPI ID</Text>
      </Pressable>
      <Pressable style={styles.doneBtn} onPress={finish} accessibilityRole="button">
        <Text style={styles.doneText}>I have paid — view orders</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#faf7f2", paddingHorizontal: 20 },
  bar: { flexDirection: "row", alignItems: "center", paddingBottom: 12 },
  closeBtn: { flexDirection: "row", alignItems: "center", gap: 6, minWidth: 72 },
  closeText: { fontWeight: "700", color: "#1c1917" },
  title: { flex: 1, textAlign: "center", fontWeight: "800", color: "#1c1917" },
  barSpacer: { minWidth: 72 },
  card: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(28,25,23,0.1)",
  },
  payee: { fontWeight: "800", fontSize: 16, color: "#1c1917" },
  amount: { marginTop: 6, fontWeight: "800", fontSize: 28, color: "#1c1917" },
  qr: { width: 220, height: 220, marginTop: 18, backgroundColor: "#fff" },
  vpa: { marginTop: 14, fontWeight: "700", fontSize: 16, color: "#1c1917" },
  hint: { marginTop: 8, textAlign: "center", color: "#57534e", lineHeight: 20 },
  payBtn: {
    marginTop: 20,
    backgroundColor: "#1f6f5b",
    borderRadius: 999,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  payBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  copyBtn: { marginTop: 12, alignItems: "center", padding: 10 },
  copyText: { fontWeight: "700", color: "#1f6f5b" },
  doneBtn: { marginTop: 4, alignItems: "center", padding: 12 },
  doneText: { fontWeight: "600", color: "#57534e" },
});
