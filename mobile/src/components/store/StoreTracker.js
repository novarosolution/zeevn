import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import { useLiveSocket } from "../../context/LiveSocketContext";
import { STORE_HOME } from "../../content/storefrontContent";
import { fetchMyOrders } from "../../services/userService";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import {
  ORDER_PROGRESS_STEPS,
  getActiveProgressStep,
  getOrderStatusHint,
  getOrderStatusLabel,
  isCancelledOrder,
  isDeliveredOrder,
} from "../../utils/orderStatus";
import { PulseDot, Sheen, useLoop } from "./HomeArt";
import PressableScale from "./PressableScale";

const isInProgress = (order) => order && !isDeliveredOrder(order.status) && !isCancelledOrder(order.status);
const newestFirst = (a, b) =>
  new Date(b?.updatedAt || b?.createdAt || 0).getTime() - new Date(a?.updatedAt || a?.createdAt || 0).getTime();

/**
 * The signed-in customer's orders that are still in progress, newest first. Loads when Home is focused and
 * follows live status changes; stays quiet (empty list) when signed out or offline.
 */
export function useActiveOrders() {
  const { isAuthenticated, token } = useAuth();
  const focused = useIsFocused();
  const { on: onLiveEvent } = useLiveSocket();
  const [orders, setOrders] = useState([]);

  const load = useCallback(async () => {
    try {
      const list = await fetchMyOrders(token);
      setOrders((Array.isArray(list) ? list : []).filter(isInProgress).sort(newestFirst));
    } catch {
      // The card is a nicety — never surface a failure on Home.
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated) {
      setOrders([]);
      return;
    }
    if (focused) load();
  }, [isAuthenticated, focused, load]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    return onLiveEvent("orders:updated", ({ order }) => {
      if (!order?._id) return;
      const id = String(order._id);
      setOrders((prev) => {
        const rest = prev.filter((item) => String(item._id) !== id);
        const merged = { ...(prev.find((item) => String(item._id) === id) || {}), ...order };
        return (isInProgress(merged) ? [merged, ...rest] : rest).sort(newestFirst);
      });
    });
  }, [isAuthenticated, onLiveEvent]);

  return orders;
}

/** The current step breathes so the strip reads as "in progress". Only this one segment runs a loop. */
function BreathingSegment({ faint, gold }) {
  const t = useLoop(900);
  const breathe = useAnimatedStyle(() => ({ opacity: interpolate(t.value, [0, 1], [0.45, 1]) }));
  return (
    <View style={[styles.segment, { backgroundColor: faint }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: gold, borderRadius: 2.5 }, breathe]} />
    </View>
  );
}

/** One segment of the journey: filled when done, breathing while current, faint when still ahead. */
function Segment({ state, filled, faint, gold }) {
  if (state === "done") return <View style={[styles.segment, { backgroundColor: filled }]} />;
  if (state === "current") return <BreathingSegment faint={faint} gold={gold} />;
  return <View style={[styles.segment, { backgroundColor: faint }]} />;
}

/**
 * Home "live order" card — status, hint and a six-step progress strip for the newest order in progress.
 * Tapping opens My Orders. Renders nothing when there is no active order.
 */
export default function StoreTracker({ orders, onPress }) {
  const { c, r, type, shadow, gutter, isDark } = useStoreTheme();
  const { width } = useWindowDimensions();
  const copy = STORE_HOME.tracker;
  const order = orders?.[0];
  const cardW = width - gutter * 2;
  const counts = useMemo(
    () => (order?.products || []).reduce((sum, product) => sum + Number(product?.quantity || 0), 0),
    [order]
  );
  if (!order) return null;

  const step = getActiveProgressStep(order.status);
  const label = getOrderStatusLabel(order.status);
  const hint = getOrderStatusHint(order.status);
  const shortId = String(order._id || "").slice(-6).toUpperCase();
  const colors = isDark ? ["#26361B", "#18230F"] : ["#244424", "#3B6030"];
  const gold = isDark ? c.gold : "#EDC27D";
  const more = orders.length - 1;

  return (
    <View style={{ paddingHorizontal: gutter }}>
      <PressableScale
        onPress={onPress}
        scaleTo={0.985}
        style={[shadow.lift, { borderRadius: r.xl, backgroundColor: colors[0] }]}
        accessibilityRole="button"
        accessibilityLabel={`${copy.eyebrow}. ${label}. ${hint} ${copy.ctaA11y}`}
      >
        <View style={[styles.card, { borderRadius: r.xl, borderColor: withAlpha(gold, isDark ? 0.28 : 0.4) }]}>
          <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <Sheen width={cardW} delay={2600} pause={7800} color="rgba(255, 244, 214, 0.16)" />

          <View style={styles.topRow}>
            <PulseDot size={9} color={gold} />
            <Text style={type.eyebrow(gold, 10)} numberOfLines={1}>
              {`${copy.eyebrow} · #${shortId}`}
            </Text>
            {more > 0 ? (
              <Text style={[type.ui(11.5, "bold", withAlpha("#FFFFFF", 0.72)), styles.more]} numberOfLines={1}>
                {copy.more(more)}
              </Text>
            ) : null}
          </View>

          <View style={styles.midRow}>
            <View style={styles.copy}>
              <Text style={type.display(23, { color: "#FFFFFF", ls: -0.4, lh: 27 })} numberOfLines={1}>
                {label}
              </Text>
              <Text style={type.ui(12.5, "medium", withAlpha("#FFFFFF", 0.76))} numberOfLines={1}>
                {[hint, counts ? copy.items(counts) : ""].filter(Boolean).join("  ·  ")}
              </Text>
            </View>
            <View style={[styles.cta, { backgroundColor: isDark ? c.gold : "#FFFFFF" }]}>
              <Text style={type.ui(13, "extrabold", isDark ? "#2A1E08" : "#244424", { letterSpacing: 0.2 })}>{copy.cta}</Text>
              <Ionicons name="arrow-forward" size={14} color={isDark ? "#2A1E08" : "#244424"} />
            </View>
          </View>

          <View style={styles.segments} accessible={false}>
            {ORDER_PROGRESS_STEPS.map((item, index) => (
              <Segment
                key={item.key}
                state={index < step ? "done" : index === step ? "current" : "ahead"}
                filled={gold}
                faint={withAlpha("#FFFFFF", 0.2)}
                gold={gold}
              />
            ))}
          </View>
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: "hidden", borderWidth: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, gap: 10 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  more: { marginLeft: "auto" },
  midRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  cta: { flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: 14, borderRadius: 18 },
  segments: { flexDirection: "row", gap: 5, marginTop: 2 },
  segment: { flex: 1, height: 5, borderRadius: 2.5, overflow: "hidden" },
});
