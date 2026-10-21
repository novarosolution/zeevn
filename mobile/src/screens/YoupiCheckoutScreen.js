import React, { useCallback, useMemo } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

function embedCheckoutUrl(url) {
  const next = String(url || "").trim();
  if (!next) return "";
  return `${next}${next.includes("?") ? "&" : "?"}embedded=1`;
}

function isReturnUrl(href) {
  return /\/orders(?:\?|$|\/)|order-confirmed/i.test(String(href || ""));
}

function isUpiIntent(href) {
  return /^(upi|phonepe|gpay|tez|paytmmp|paytm|intent):/i.test(String(href || ""));
}

export default function YoupiCheckoutScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
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
      <View style={[styles.bar, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => finish(false)} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close payment">
          <Ionicons name="close" size={20} color="#1c1917" />
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
        <Text style={styles.title}>Pay securely</Text>
        <View style={styles.barSpacer} />
      </View>
      <WebView
        source={{ uri: checkoutUrl }}
        onShouldStartLoadWithRequest={(req) => {
          const href = req?.url || "";
          if (isReturnUrl(href)) {
            finish(true);
            return false;
          }
          if (isUpiIntent(href)) {
            Linking.openURL(href).catch(() => {});
            return false;
          }
          return true;
        }}
        onNavigationStateChange={(nav) => {
          if (isReturnUrl(nav?.url)) finish(true);
        }}
        setSupportMultipleWindows={false}
        javaScriptEnabled
        style={styles.frame}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  frame: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
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
