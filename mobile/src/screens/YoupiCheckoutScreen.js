import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

function embedCheckoutUrl(url) {
  const next = String(url || "")
    .trim()
    .replace(/^(https?:\/\/)localhost(?=[:/?#]|$)/i, "$1127.0.0.1");
  if (!next) return "";
  return `${next}${next.includes("?") ? "&" : "?"}embedded=1`;
}

export default function YoupiCheckoutScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const opened = useRef(false);
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
    if (!checkoutUrl || opened.current) return undefined;
    opened.current = true;
    let alive = true;
    (async () => {
      try {
        await WebBrowser.openAuthSessionAsync(checkoutUrl, Linking.createURL("orders"));
      } catch {
        // Stay on this screen; user can tap Close.
      }
      if (alive) finish(true);
    })();
    return () => {
      alive = false;
    };
  }, [checkoutUrl, finish]);

  return (
    <View style={styles.root}>
      <View style={[styles.bar, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => finish(false)} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close payment">
          <Ionicons name="close" size={20} color="#1c1917" />
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
        <Text style={styles.title}>Pay securely</Text>
        <View style={styles.barSpacer} />
      </View>
      <View style={styles.center}>
        <ActivityIndicator color="#1c1917" />
        <Text style={styles.msg}>{checkoutUrl ? "Complete payment, then return here." : "Payment link is missing."}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
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
