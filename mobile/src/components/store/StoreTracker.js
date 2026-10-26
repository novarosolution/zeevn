import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { safeNavigate } from "../../navigation/navigationRef";
import Animated, { FadeInDown, FadeOutDown, useReducedMotion } from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import { useLiveSocket } from "../../context/LiveSocketContext";
import { STORE_HOME } from "../../content/storefrontContent";
import { fetchMyOrders } from "../../services/userService";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { STORE_NAV_HEIGHT, useStoreTheme, withAlpha } from "../../theme/storefront";
import { WEB_Z_INDEX } from "../../theme/web";
import { EASE_OUT, motionTiming } from "../../theme/motion";
import { formatOrderShortId } from "../../utils/orderDisplay";
import { getProductThumbImageUri } from "../../utils/image";
import { getActiveProgressStep, getOrderStatusLabel, isCancelledOrder, isDeliveredOrder } from "../../utils/orderStatus";
import { hapticTick } from "../../utils/haptics";
import Glass from "./Glass";
import PressableScale from "./PressableScale";

const isInProgress = (order) => order && !isDeliveredOrder(order.status) && !isCancelledOrder(order.status);
const newestFirst = (a, b) =>
  new Date(b?.updatedAt || b?.createdAt || 0).getTime() - new Date(a?.updatedAt || a?.createdAt || 0).getTime();

/** Compact glass pill + gap above the bottom nav. */
export const STORE_TRACKER_DOCK = 54;

const HIDE_DOCK_ROUTES = new Set([
  "Login",
  "Register",
  "MyOrders",
  "OrderConfirmed",
  "YoupiCheckout",
]);

export function useActiveOrders() {
  const { isAuthenticated, token } = useAuth();
  const { on: onLiveEvent } = useLiveSocket();
  const [orders, setOrders] = useState([]);

  const load = useCallback(async () => {
    try {
      const list = await fetchMyOrders(token);
      setOrders((Array.isArray(list) ? list : []).filter(isInProgress).sort(newestFirst));
    } catch {
      // Dock is a nicety — never surface a failure on Home.
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated) {
      setOrders([]);
      return;
    }
    load();
    const tick = setInterval(load, 45000);
    return () => clearInterval(tick);
  }, [isAuthenticated, load]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    return onLiveEvent("orders:updated", ({ order }) => {
      if (!order?._id) return;
      const id = String(order._id);
      setOrders((prev) => {
        const rest = prev.filter((item) => String(item._id) !== id);
        const prevOrder = prev.find((item) => String(item._id) === id) || {};
        const merged = { ...prevOrder, ...order };
        if (!Array.isArray(order.products) || !order.products.length) merged.products = prevOrder.products;
        if (!merged.assignedDeliveryUser) merged.assignedDeliveryUser = prevOrder.assignedDeliveryUser;
        if (!merged.tracking) merged.tracking = prevOrder.tracking;
        return (isInProgress(merged) ? [merged, ...rest] : rest).sort(newestFirst);
      });
    });
  }, [isAuthenticated, onLiveEvent]);

  return orders;
}

export function useStoreNavPad(insets, extra = 0) {
  const orders = useActiveOrders();
  const tracker = orders.length ? STORE_TRACKER_DOCK : 0;
  return STORE_NAV_HEIGHT + Math.max(16, (insets?.bottom || 0) + 6) + 28 + tracker + extra;
}

function useNow(everyMs = 30000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return now;
}

function minutesLeft(order, now) {
  const t = order?.tracking || {};
  if (t.promisedAt) {
    const at = new Date(t.promisedAt).getTime();
    if (Number.isFinite(at)) return Math.ceil((at - now) / 60000);
  }
  const max = Number(t.etaMinutesMax);
  if (max > 0) return max;
  const min = Number(t.etaMinutesMin);
  return min > 0 ? min : null;
}

function etaParts(minutes, copy) {
  if (minutes === null) return null;
  if (minutes <= 0) return { value: copy.etaSoon, unit: "" };
  if (minutes < 100) return { value: String(minutes), unit: copy.etaUnit };
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return { value: rest ? `${hours}h ${String(rest).padStart(2, "0")}` : `${hours}h`, unit: "" };
}

const firstName = (name) => {
  const word = String(name || "")
    .trim()
    .split(/\s+/)[0] || "";
  return word ? word.charAt(0).toUpperCase() + word.slice(1) : "";
};

/** The same reference the order card, confirmation and invoice show (the last 6 characters of the id), so it can be quoted to support. */
function publicOrderNo(order) {
  const raw = order?.orderNumber || order?.number || order?.publicRef;
  if (raw) return String(raw).replace(/^#/, "").replace(/^KG-?/i, "");
  return formatOrderShortId(order?._id || order?.id);
}

const THUMB = 24;
const THUMB_OVERLAP = 8;
const MAX_THUMBS = 3;

function lineImageUri(line) {
  const raw = line?.image || line?.product?.image || "";
  if (!raw) return "";
  return getProductThumbImageUri(raw) || String(raw);
}

function orderThumbs(order) {
  const seen = new Set();
  const uris = [];
  for (const line of Array.isArray(order?.products) ? order.products : []) {
    const uri = lineImageUri(line);
    if (!uri || seen.has(uri)) continue;
    seen.add(uri);
    uris.push(uri);
    if (uris.length >= MAX_THUMBS) break;
  }
  return uris;
}

function extraItemCount(order, shown) {
  const lines = Array.isArray(order?.products) ? order.products : [];
  return Math.max(0, lines.length - shown);
}

/** Web: same live-order pill, fixed at the bottom on every customer page. */
export function LiveOrderDock({ hidden = false }) {
  const orders = useActiveOrders();
  const { showDesktopNav, pageGutterClamp } = useKankregLayout();
  const hasItems = (orders[0]?.products || []).length > 0;
  if (hidden || !orders.length || !hasItems) return null;

  const orderId = orders[0]?._id;
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.webDock,
        showDesktopNav
          ? { right: 28, bottom: 28, width: 340, left: "auto" }
          : { left: pageGutterClamp, right: pageGutterClamp, bottom: 16 },
      ]}
    >
      <StoreTracker
        orders={orders}
        onPress={() => safeNavigate("MyOrders", orderId ? { orderId: String(orderId) } : undefined)}
      />
    </View>
  );
}

export function hideLiveOrderDock(routeName) {
  return !routeName || HIDE_DOCK_ROUTES.has(routeName) || String(routeName).startsWith("Admin");
}

/**
 * Compact glass live-order dock: product photos, live status, rider/ETA, progress.
 */
export default function StoreTracker({ orders, onPress }) {
  const { c, type, isDark } = useStoreTheme();
  const copy = STORE_HOME.tracker;
  const reduced = useReducedMotion();
  const now = useNow();
  const order = orders?.[0];
  const thumbs = useMemo(() => orderThumbs(order), [order]);
  if (!order) return null;

  const status = String(order.status || "");
  const title = copy.title[status] || getOrderStatusLabel(status);
  const rider = firstName(order.assignedDeliveryUser?.name);
  const onTheWay = status === "out_for_delivery" || status === "shipped";
  const detail = rider
    ? onTheWay
      ? copy.riderOnTheWay(rider)
      : copy.riderAssigned(rider)
    : copy.stage[status] || copy.moving;
  const subtitle = [copy.ref(publicOrderNo(order)), detail].filter(Boolean).join(" · ");
  const eta = status === "pending_payment" ? null : etaParts(minutesLeft(order, now), copy);
  const progress = Math.max(0.08, getActiveProgressStep(status) / 5);
  const extra = extraItemCount(order, thumbs.length);
  const moreOrders = orders.length - 1;
  const green = isDark ? "#6CCB87" : "#1F8A45";
  const stackW = thumbs.length ? THUMB + (thumbs.length - 1) * (THUMB - THUMB_OVERLAP) : THUMB;
  const body = (
    <>
      <View style={styles.row}>
        {thumbs.length ? (
          <View style={[styles.stack, { width: stackW }]}>
            {thumbs.map((uri, index) => (
              <View
                key={uri}
                style={[
                  styles.thumb,
                  {
                    left: index * (THUMB - THUMB_OVERLAP),
                    zIndex: index + 1,
                    borderColor: isDark ? withAlpha("#0F2418", 0.7) : "rgba(255,255,255,0.92)",
                    backgroundColor: isDark ? c.brandSoft : c.soft,
                  },
                ]}
              >
                <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
              </View>
            ))}
            {extra > 0 || moreOrders > 0 ? (
              <View style={[styles.more, { backgroundColor: c.gold, borderColor: isDark ? c.card : "#FFFFFF" }]}>
                <Text style={type.ui(8, "extrabold", "#2A1E08")}>{copy.more(extra || moreOrders)}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={[styles.thumb, { position: "relative", backgroundColor: isDark ? c.brandSoft : c.soft }]}>
            <MaterialCommunityIcons name={onTheWay ? "moped" : "package-variant-closed"} size={14} color={green} />
          </View>
        )}

        <View style={styles.main}>
          <View style={styles.titleRow}>
            <Text style={[type.ui(12, "extrabold", c.ink), styles.title]} numberOfLines={1}>
              {title}
            </Text>
            <View style={styles.live}>
              <View style={[styles.liveDot, { backgroundColor: green }]} />
              <Text style={type.ui(8, "extrabold", c.inkMute, { letterSpacing: 0.7 })}>{copy.live}</Text>
            </View>
          </View>
          <Text style={type.ui(10.5, "medium", c.inkMute)} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        <View style={styles.eta}>
          {eta ? (
            <>
              <Text style={type.ui(eta.unit ? 15 : 11, "extrabold", c.ink, { letterSpacing: -0.3, lineHeight: 16 })}>
                {eta.value}
              </Text>
              {eta.unit ? <Text style={type.ui(8, "bold", c.inkMute)}>{eta.unit}</Text> : null}
            </>
          ) : (
            <Text style={type.ui(10, "extrabold", green)}>{copy.cta}</Text>
          )}
        </View>
      </View>
      <View style={[styles.track, { backgroundColor: isDark ? withAlpha("#FFFFFF", 0.12) : withAlpha(green, 0.16) }]} accessible={false}>
        <View style={[styles.fill, { width: `${Math.round(progress * 100)}%`, backgroundColor: green }]} />
      </View>
    </>
  );

  return (
    <Animated.View
      entering={reduced ? undefined : FadeInDown.duration(motionTiming.enter).easing(EASE_OUT).withInitialValues({ opacity: 0, transform: [{ translateY: 8 }] })}
      exiting={reduced ? undefined : FadeOutDown.duration(motionTiming.press).easing(EASE_OUT)}
    >
      <PressableScale
        onPress={() => {
          hapticTick();
          onPress?.();
        }}
        scaleTo={0.985}
        style={styles.hit}
        accessibilityRole="button"
        accessibilityLabel={`${copy.live}. ${title}. ${subtitle}. ${eta ? `${eta.value} ${eta.unit}. ` : ""}${copy.ctaA11y}`}
      >
        {Platform.OS === "web" ? (
          <View style={[styles.webGlass, { backgroundColor: isDark ? "rgba(15,36,24,0.62)" : "rgba(255,255,255,0.62)" }]}>
            {body}
          </View>
        ) : (
          <Glass material="ultra" radius={18} lift sheen style={styles.glass} contentStyle={styles.pad}>
            {body}
          </Glass>
        )}
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  webDock: {
    position: "fixed",
    zIndex: WEB_Z_INDEX.overlay,
    pointerEvents: "box-none",
  },
  webGlass: {
    borderRadius: 18,
    paddingHorizontal: 9,
    paddingTop: 7,
    paddingBottom: 7,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.55)",
    boxShadow: "0 10px 28px rgba(26, 34, 22, 0.14)",
    backdropFilter: "blur(18px) saturate(1.45)",
    // @ts-ignore web
    WebkitBackdropFilter: "blur(18px) saturate(1.45)",
  },
  hit: { borderRadius: 18, ...Platform.select({ web: { cursor: "pointer" } }) },
  glass: { borderRadius: 18 },
  pad: { paddingHorizontal: 9, paddingTop: 7, paddingBottom: 7, gap: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  stack: { height: THUMB, position: "relative" },
  thumb: {
    position: "absolute",
    top: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    overflow: "hidden",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  more: {
    position: "absolute",
    top: -5,
    right: -7,
    minWidth: 16,
    height: 14,
    paddingHorizontal: 3,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 8,
  },
  main: { flex: 1, minWidth: 0, gap: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  title: { flexShrink: 1, letterSpacing: -0.2 },
  live: { flexDirection: "row", alignItems: "center", gap: 3, flexShrink: 0 },
  liveDot: { width: 5, height: 5, borderRadius: 2.5 },
  eta: { minWidth: 34, alignItems: "flex-end", justifyContent: "center" },
  track: { height: 2, borderRadius: 1, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 1 },
});
