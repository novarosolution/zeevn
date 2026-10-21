import React, { useCallback, useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

function embedCheckoutUrl(url) {
  const next = String(url || "")
    .trim()
    .replace(/^(https?:\/\/)localhost(?=[:/?#]|$)/i, "$1127.0.0.1");
  if (!next) return "";
  return `${next}${next.includes("?") ? "&" : "?"}embedded=1`;
}

export default function YoupiCheckoutScreen({ navigation, route }) {
  const checkoutUrl = useMemo(() => embedCheckoutUrl(route?.params?.checkoutUrl), [route?.params?.checkoutUrl]);

  const finish = useCallback(
    (toOrders = true) => {
      if (toOrders) {
        navigation.replace("MyOrders");
        return;
      }
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.replace("MyOrders");
    },
    [navigation]
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onMessage = (event) => {
      const name = event?.data?.event;
      if (name === "youpi.payment_success") finish(true);
      if (
        name === "youpi.payment_failed" ||
        name === "youpi.payment_cancelled" ||
        name === "youpi.payment_expired" ||
        name === "youpi.cancel" ||
        name === "youpi.close" ||
        name === "youpi.modal_close"
      ) {
        finish(true);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [finish]);

  if (!checkoutUrl) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.msg}>Payment link is missing.</Text>
        <Pressable onPress={() => finish(false)} style={styles.closeBtn}>
          <Text style={styles.closeText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.bar}>
        <Pressable onPress={() => finish(false)} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close payment">
          <Ionicons name="close" size={20} color="#1c1917" />
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
        <Text style={styles.title}>Pay securely</Text>
        <View style={styles.barSpacer} />
      </View>
      <iframe
        src={checkoutUrl}
        title="Pay"
        allow="payment"
        style={{ flex: 1, width: "100%", height: "100%", border: "none", background: "#fff" }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff", minHeight: "100dvh" },
  center: { alignItems: "center", justifyContent: "center", padding: 24 },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(28,25,23,0.12)",
    backgroundColor: "#fff",
  },
  closeBtn: { flexDirection: "row", alignItems: "center", gap: 6, minWidth: 72 },
  closeText: { fontWeight: "700", color: "#1c1917" },
  title: { flex: 1, textAlign: "center", fontWeight: "800", color: "#1c1917" },
  barSpacer: { minWidth: 72 },
  msg: { textAlign: "center", color: "#57534e" },
});
