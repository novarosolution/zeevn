import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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
function BreathingSegment({ faint, tint }) {
  const t = useLoop(900);
  const breathe = useAnimatedStyle(() => ({ opacity: interpolate(t.value, [0, 1], [0.45, 1]) }));
  return (
    <View style={[styles.segment, { backgroundColor: faint }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: tint, borderRadius: 2.5 }, breathe]} />
    </View>
  );
}

/** One segment of the journey: filled when done, breathing while current, faint when still ahead. */
function Segment({ state, done, current, faint }) {
  if (state === "done") return <View style={[styles.segment, { backgroundColor: done }]} />;
  if (state === "current") return <BreathingSegment faint={faint} tint={current} />;
  return <View style={[styles.segment, { backgroundColor: faint }]} />;
}

/** The round glyph on the card: a receipt, a parcel, then a van as the order progresses. */
function StageIcon({ step, color }) {
  if (step >= 4) return <MaterialCommunityIcons name="truck-fast-outline" size={24} color={color} />;
  if (step >= 2) return <MaterialCommunityIcons name="package-variant-closed" size={24} color={color} />;
  return <Ionicons name="receipt-outline" size={22} color={color} />;
}

/**
 * Home "live order" card — status, item count and a six-step progress strip for the newest order in progress.
 * A light card (so it reads as a tool, next to the campaign hero below it); a small "+N" badge says how many
 * more orders are in progress. Tapping opens My Orders. Renders nothing when there is no active order.
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
  const accent = isDark ? c.gold : c.brand;
  const more = orders.length - 1;

  return (
    <View style={{ paddingHorizontal: gutter }}>
      <PressableScale
        onPress={onPress}
        scaleTo={0.985}
        style={[shadow.card, { borderRadius: r.xl, backgroundColor: c.card }]}
        accessibilityRole="button"
        accessibilityLabel={`${copy.live}. ${label}. ${hint} ${more > 0 ? `${copy.more(more)}. ` : ""}${copy.ctaA11y}`}
      >
        <View style={[styles.card, { borderRadius: r.xl, borderColor: c.line }]}>
          <Sheen width={cardW} delay={2600} pause={7800} color={withAlpha(c.gold, 0.2)} />

          <View style={styles.row}>
            <View style={styles.discWrap}>
              <View style={[styles.disc, { backgroundColor: isDark ? withAlpha(c.gold, 0.14) : c.brandSoft, borderColor: withAlpha(accent, 0.22) }]}>
                <StageIcon step={step} color={accent} />
              </View>
              {more > 0 ? (
                <View style={[styles.moreBadge, { backgroundColor: c.gold, borderColor: c.card }]}>
                  <Text style={type.ui(10.5, "extrabold", "#2A1E08")}>{`+${more}`}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.main}>
              <View style={styles.topRow}>
                <PulseDot size={8} color={accent} />
                <Text style={type.eyebrow(c.inkMute, 9.5)} numberOfLines={1}>
                  {`${copy.live} · #${shortId}`}
                </Text>
              </View>
              <Text style={type.display(22, { ls: -0.4, lh: 26 })} numberOfLines={1}>
                {label}
              </Text>
              {counts ? (
                <Text style={type.ui(12.5, "medium", c.inkMute)} numberOfLines={1}>
                  {copy.items(counts)}
                </Text>
              ) : null}
            </View>

            <View style={[styles.cta, { backgroundColor: c.brand }]}>
              <Text style={type.ui(13, "extrabold", c.onBrand, { letterSpacing: 0.2 })}>{copy.cta}</Text>
              <Ionicons name="arrow-forward" size={14} color={c.onBrand} />
            </View>
          </View>

          <View style={styles.segments} accessible={false}>
            {ORDER_PROGRESS_STEPS.map((item, index) => (
              <Segment
                key={item.key}
                state={index < step ? "done" : index === step ? "current" : "ahead"}
                done={accent}
                current={c.gold}
                faint={isDark ? withAlpha("#FFFFFF", 0.14) : c.lineStrong}
              />
            ))}
          </View>
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 14, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  discWrap: { width: 48, height: 48 },
  disc: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  moreBadge: {
    position: "absolute",
    top: -5,
    right: -7,
    minWidth: 24,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  main: { flex: 1, minWidth: 0, gap: 1 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cta: { flexDirection: "row", alignItems: "center", gap: 6, height: 38, paddingHorizontal: 14, borderRadius: 19 },
  segments: { flexDirection: "row", gap: 5 },
  segment: { flex: 1, height: 5, borderRadius: 2.5, overflow: "hidden" },
});
