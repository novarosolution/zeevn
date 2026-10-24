import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import useReducedMotion from "../../hooks/useReducedMotion";
import { STORE_ORDERS } from "../../content/storefrontContent";
import { EASE_OUT, motionTiming } from "../../theme/motion";
import { STORE_NAV_HEIGHT, useStoreTheme, withAlpha } from "../../theme/storefront";
import { formatINR } from "../../utils/currency";
import { formatOrderShortId } from "../../utils/orderDisplay";
import { formatCompactShippingLine } from "../../utils/shippingAddressFormat";
import { productImageUri } from "../../utils/storefront";
import FloatingNav from "./FloatingNav";
import PressableScale from "./PressableScale";

/**
 * The success moment is rare, so it may take a beat longer than everyday motion: four blocks rise 14 px on a strong
 * ease-out, one after another. Built once at module scope.
 */
const rise = (delay) =>
  FadeInDown.delay(delay)
    .duration(motionTiming.enter + 60)
    .easing(EASE_OUT)
    .withInitialValues({ opacity: 0, transform: [{ translateY: 14 }] });
const PLACED_IN = [120, 220, 300, 360].map(rise);
/** The heading block settles after the check has landed: eyebrow, title, lead, reference, 70 ms apart. */
const HERO_IN = [180, 250, 320, 390].map(rise);
/** In the post-checkout popup the summary and the actions follow the hero. */
const POPUP_IN = [470, 540].map(rise);

const COPY = STORE_ORDERS.confirmed;

function Ring({ delay, color }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1700, easing: Easing.out(Easing.cubic) }), -1, false));
  }, [delay, progress]);
  const style = useAnimatedStyle(() => ({
    opacity: (1 - progress.value) * 0.42,
    transform: [{ scale: 0.72 + progress.value * 0.6 }],
  }));
  return <Animated.View style={[styles.ring, { borderColor: color }, style]} pointerEvents="none" />;
}

/** Olive check badge with two pulsing rings — the “it worked” moment. */
export function ConfirmBadge({ size = 112 }) {
  const { c, isDark } = useStoreTheme();
  const reduced = useReducedMotion();
  const pop = useSharedValue(reduced ? 1 : 0.7);

  useEffect(() => {
    if (reduced) return;
    // One spring: it overshoots a little (a rare moment may), then settles — no second bounce.
    pop.value = withSpring(1, { duration: 560, dampingRatio: 0.55 });
  }, [pop, reduced]);

  const popStyle = useAnimatedStyle(() => ({ opacity: reduced ? 1 : Math.min(1, pop.value * 2.4 - 0.7), transform: [{ scale: pop.value }] }));
  const colors = isDark ? ["#C9DA8C", "#9DB45B"] : ["#3F6231", "#244424"];

  return (
    <View style={[styles.badgeStage, { width: size * 1.45, height: size * 1.45 }]}>
      {reduced ? null : (
        <>
          <Ring delay={0} color={withAlpha(c.brandBright, 0.9)} />
          <Ring delay={450} color={withAlpha(c.gold, 0.9)} />
        </>
      )}
      <Animated.View style={popStyle}>
        <LinearGradient
          colors={colors}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.disc, { width: size, height: size, borderRadius: size / 2, borderColor: withAlpha("#FFFFFF", isDark ? 0.2 : 0.6) }]}
        >
          <Ionicons name="checkmark" size={size * 0.52} color={isDark ? "#18200C" : "#FFFFFF"} />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

function Hero({ order }) {
  const { c, type, isDark } = useStoreTheme();
  const shortId = formatOrderShortId(order?._id || order?.id);
  return (
    <View style={styles.hero}>
      <ConfirmBadge />
      <Animated.Text entering={HERO_IN[0]} style={type.eyebrow(c.goldText, 11.5)}>
        {COPY.eyebrow}
      </Animated.Text>
      <Animated.Text entering={HERO_IN[1]} style={[type.display(36, { ls: -0.9, lh: 42 }), styles.centerText]} accessibilityRole="header">
        {COPY.title}
      </Animated.Text>
      <Animated.Text entering={HERO_IN[2]} style={[type.ui(15, "medium", c.inkSoft, { lineHeight: 22 }), styles.centerText, styles.lead]}>
        {COPY.lead}
      </Animated.Text>
      {shortId ? (
        <Animated.View entering={HERO_IN[3]} style={[styles.refPill, { backgroundColor: c.card, borderColor: withAlpha(c.gold, isDark ? 0.4 : 0.55) }]}>
          <Ionicons name="receipt-outline" size={16} color={c.goldText} />
          <Text style={type.ui(12, "bold", c.inkMute, { letterSpacing: 0.6, textTransform: "uppercase" })}>{COPY.ref}</Text>
          <Text style={type.ui(14, "extrabold", c.ink, { letterSpacing: 0.6 })}>#{shortId}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

function Timeline() {
  const { c, r, type, shadow } = useStoreTheme();
  return (
    <View style={[styles.card, shadow.soft, { backgroundColor: c.card, borderColor: c.line, borderRadius: r.xxl }]}>
      <Text style={type.display(20, { semi: true, ls: -0.3, lh: 25 })}>{COPY.stepsTitle}</Text>
      <View>
        {COPY.steps.map((step, i) => {
          const first = i === 0;
          const last = i === COPY.steps.length - 1;
          return (
            <View key={step.key} style={styles.step}>
              <View style={styles.rail}>
                <View style={[styles.stepIcon, { backgroundColor: first ? c.brand : c.soft, borderColor: first ? c.brand : c.line }]}>
                  <Ionicons name={step.icon} size={19} color={first ? c.onBrand : c.inkSoft} />
                </View>
                {!last ? <View style={[styles.railLine, { backgroundColor: first ? c.brandBright : c.line }]} /> : null}
              </View>
              <View style={[styles.stepText, !last && styles.stepGap]}>
                <Text style={type.ui(15, "extrabold", c.ink)}>{step.label}</Text>
                <Text style={type.ui(13, "medium", c.inkMute, { lineHeight: 19 })}>{step.detail}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function Summary({ order }) {
  const { c, r, type, shadow } = useStoreTheme();
  const products = Array.isArray(order?.products) ? order.products : [];
  const itemCount = itemCountFor(order);
  const payment = paymentLabelFor(order);
  const deliverTo = formatCompactShippingLine(order?.shippingAddress);
  const total = Number(order?.totalPrice) || 0;
  const shown = products.slice(0, 4);

  const Row = ({ label, value, wrap }) => (
    <View style={styles.row}>
      <Text style={type.ui(14, "medium", c.inkMute)}>{label}</Text>
      <Text style={[type.ui(14, "bold", c.ink), styles.rowValue, wrap && styles.rowWrap]} numberOfLines={wrap ? 3 : 1}>
        {value}
      </Text>
    </View>
  );

  return (
    <View style={[styles.card, shadow.soft, { backgroundColor: c.card, borderColor: c.line, borderRadius: r.xxl }]}>
      <Text style={type.display(20, { semi: true, ls: -0.3, lh: 25 })}>{COPY.summaryTitle}</Text>
      {shown.length ? (
        <View style={styles.thumbRow}>
          {shown.map((p, i) => {
            const uri = productImageUri({ image: p.image }, 56);
            return (
              <View key={`${p.name}-${i}`} style={[styles.thumb, { backgroundColor: c.well, borderColor: c.line }]}>
                {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : null}
              </View>
            );
          })}
          {products.length > shown.length ? (
            <View style={[styles.thumb, styles.thumbMore, { backgroundColor: c.brandSoft, borderColor: c.line }]}>
              <Text style={type.ui(13, "extrabold", c.brand)}>+{products.length - shown.length}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      <View style={styles.rows}>
        <Row label={COPY.labels.items} value={`${itemCount} ${itemCount === 1 ? "item" : "items"}`} />
        <Row label={COPY.labels.payment} value={payment} />
        {deliverTo ? <Row label={COPY.labels.delivery} value={deliverTo} wrap /> : null}
        <View style={[styles.divider, { backgroundColor: c.line }]} />
        <View style={styles.row}>
          <Text style={type.ui(16, "extrabold", c.ink)}>{COPY.labels.total}</Text>
          <Text style={type.display(26, { semi: true, ls: -0.6, lh: 31 })}>{formatINR(total)}</Text>
        </View>
      </View>
    </View>
  );
}

function TrustRow() {
  const { c, type } = useStoreTheme();
  return (
    <View style={styles.trust}>
      {COPY.trust.map((chip) => (
        <View key={chip.key} style={[styles.trustChip, { backgroundColor: c.card, borderColor: c.line }]}>
          <Ionicons name={chip.icon} size={15} color={c.brand} />
          <Text style={type.ui(12, "bold", c.inkSoft)}>{chip.label}</Text>
        </View>
      ))}
    </View>
  );
}

function PrimaryButton({ label, icon, onPress }) {
  const { type, isDark, shadow } = useStoreTheme();
  const colors = isDark ? ["#C9DA8C", "#9DB45B"] : ["#3F6231", "#244424"];
  const ink = isDark ? "#18200C" : "#FFFFFF";
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={[styles.primary, shadow.card]}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, styles.primaryFill]} />
      <Text style={type.ui(16, "extrabold", ink, { letterSpacing: 0.2 })}>{label}</Text>
      <Ionicons name={icon} size={18} color={ink} />
    </PressableScale>
  );
}

function OutlineButton({ label, icon, onPress }) {
  const { c, type } = useStoreTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.outline, { backgroundColor: c.card, borderColor: withAlpha(c.brand, 0.4) }]}
    >
      <Ionicons name={icon} size={18} color={c.brand} />
      <Text style={type.ui(15, "extrabold", c.brand)}>{label}</Text>
    </PressableScale>
  );
}

function paymentLabelFor(order) {
  const method = String(order?.paymentMethod || "").trim();
  return /cash|cod/i.test(method) ? COPY.payments.cod : COPY.payments.online;
}

function itemCountFor(order) {
  const products = Array.isArray(order?.products) ? order.products : [];
  return products.reduce((sum, p) => sum + Math.max(1, Number(p?.quantity) || 1), 0);
}

/** Three-up strip — items, payment, total — for the post-checkout popup. */
function MiniSummary({ order }) {
  const { c, r, type, shadow } = useStoreTheme();
  const count = itemCountFor(order);
  const cells = [
    { key: "items", label: COPY.labels.items, value: `${count} ${count === 1 ? "item" : "items"}` },
    { key: "payment", label: COPY.labels.payment, value: paymentLabelFor(order) },
    { key: "total", label: COPY.labels.total, value: formatINR(Number(order?.totalPrice) || 0) },
  ];
  return (
    <View style={[styles.mini, shadow.soft, { backgroundColor: c.card, borderColor: c.line, borderRadius: r.xl }]}>
      {cells.map((cell, i) => (
        <View key={cell.key} style={[styles.miniCell, i > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: c.line }]}>
          <Text style={type.ui(11.5, "bold", c.inkMute)}>{cell.label}</Text>
          <Text style={type.ui(14, "extrabold", c.ink)} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {cell.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Full-screen popup shown right after checkout (hosted by `OrderCelebrationOverlay` in a Modal, so it has
 * no floating nav): animated check, reference, a three-up summary and Track order / Continue shopping.
 */
export function StoreOrderPlaced({ order, onTrack, onContinue }) {
  const { c, type, gutter } = useStoreTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { backgroundColor: c.page }]}>
      <LinearGradient colors={c.headerGradient} locations={c.headerLocations} style={[styles.wash, { height: insets.top + 420 }]} pointerEvents="none" />
      <View style={[styles.placed, { paddingTop: insets.top + 20, paddingBottom: Math.max(insets.bottom, 16) + 16, paddingHorizontal: gutter }]}>
        <View style={styles.placedCenter}>
          <Hero order={order} />
          <Animated.View entering={POPUP_IN[0]} style={styles.popupBlock}>
            <MiniSummary order={order} />
          </Animated.View>
        </View>
        <Animated.View entering={POPUP_IN[1]} style={styles.actions}>
          <PrimaryButton label={COPY.primary} icon="arrow-forward" onPress={onTrack} />
          <PressableScale scaleTo={0.97} lite onPress={onContinue} hitSlop={8} accessibilityRole="button" accessibilityLabel={COPY.secondary} style={styles.link}>
            <Text style={type.ui(15, "bold", c.inkSoft)}>{COPY.secondary}</Text>
          </PressableScale>
        </Animated.View>
      </View>
    </View>
  );
}

/**
 * Native “Order confirmed” route — animated check, reference, what-happens-next timeline, summary and the
 * track / shop / home actions. Shown from `OrderConfirmedScreen`.
 */
export default function StoreOrderConfirmed({ navigation, order }) {
  const { c, type, gutter, isDark } = useStoreTheme();
  const insets = useSafeAreaInsets();
  const navPad = STORE_NAV_HEIGHT + Math.max(16, insets.bottom + 6) + 28;
  const hasOrder = Boolean(order?._id || order?.id);

  return (
    <View style={[styles.screen, { backgroundColor: c.page }]}>
      <LinearGradient colors={c.headerGradient} locations={c.headerLocations} style={[styles.wash, { height: insets.top + 380 }]} pointerEvents="none" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 28, paddingBottom: navPad }}>
        <View style={{ paddingHorizontal: gutter, gap: 18 }}>
          {hasOrder ? (
            <>
              <Hero order={order} />
              <Animated.View entering={PLACED_IN[0]}>
                <Timeline />
              </Animated.View>
              <Animated.View entering={PLACED_IN[1]}>
                <Summary order={order} />
              </Animated.View>
              <Animated.View entering={PLACED_IN[2]}>
                <TrustRow />
              </Animated.View>
              <Animated.View entering={PLACED_IN[3]} style={styles.actions}>
                <PrimaryButton label={COPY.primary} icon="navigate-outline" onPress={() => navigation.replace("MyOrders")} />
                <OutlineButton label={COPY.secondary} icon="bag-handle-outline" onPress={() => navigation.replace("Shop")} />
                <PressableScale onPress={() => navigation.replace("Home")} accessibilityRole="button" accessibilityLabel={COPY.tertiary} style={styles.link}>
                  <Text style={type.ui(14.5, "bold", c.inkSoft)}>{COPY.tertiary}</Text>
                </PressableScale>
              </Animated.View>
            </>
          ) : (
            <View style={[styles.missing, { backgroundColor: c.card, borderColor: c.line }]}>
              <View style={[styles.missingIcon, { backgroundColor: c.brandSoft }]}>
                <Ionicons name="receipt-outline" size={32} color={c.brand} />
              </View>
              <Text style={[type.display(24, { semi: true, ls: -0.4, lh: 30 }), styles.centerText]}>{COPY.missingTitle}</Text>
              <Text style={[type.ui(14.5, "medium", c.inkMute, { lineHeight: 21 }), styles.centerText]}>{COPY.missingBody}</Text>
              <PressableScale
                onPress={() => navigation.replace("MyOrders")}
                accessibilityRole="button"
                accessibilityLabel={COPY.missingCta}
                style={[styles.missingBtn, { backgroundColor: c.brand }]}
              >
                <Text style={type.ui(15, "extrabold", c.onBrand)}>{COPY.missingCta}</Text>
              </PressableScale>
            </View>
          )}
        </View>
      </ScrollView>
      <View style={[styles.scrim, { height: insets.top }]} pointerEvents="none">
        <View style={[StyleSheet.absoluteFill, { backgroundColor: withAlpha(c.page, 0.55) }]} />
      </View>
      <FloatingNav />
    </View>
  );
}

const styles = StyleSheet.create({
  popupBlock: { alignSelf: "stretch" },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, overflow: "hidden" },
  screen: { flex: 1 },
  wash: { position: "absolute", top: 0, left: 0, right: 0 },
  centerText: { textAlign: "center" },
  hero: { alignItems: "center", gap: 10, paddingTop: 4 },
  badgeStage: { alignItems: "center", justifyContent: "center", marginBottom: 2 },
  ring: { position: "absolute", width: "100%", height: "100%", borderRadius: 999, borderWidth: 2 },
  disc: { alignItems: "center", justifyContent: "center", borderWidth: 3 },
  lead: { maxWidth: 320 },
  refPill: { flexDirection: "row", alignItems: "center", gap: 8, height: 38, paddingHorizontal: 15, borderRadius: 19, borderWidth: 1, marginTop: 6 },
  card: { borderWidth: StyleSheet.hairlineWidth, padding: 20, gap: 16 },
  step: { flexDirection: "row", gap: 14 },
  rail: { alignItems: "center", width: 40 },
  stepIcon: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  railLine: { flex: 1, width: 2, borderRadius: 1, marginVertical: 4 },
  stepText: { flex: 1, minWidth: 0, gap: 2, paddingTop: 2 },
  stepGap: { paddingBottom: 18 },
  thumbRow: { flexDirection: "row", gap: 10 },
  thumb: { width: 54, height: 54, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  thumbMore: { alignItems: "center", justifyContent: "center" },
  rows: { gap: 12 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  rowValue: { flexShrink: 1, textAlign: "right" },
  rowWrap: { maxWidth: "64%", lineHeight: 20 },
  divider: { height: StyleSheet.hairlineWidth },
  trust: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  trustChip: { flexDirection: "row", alignItems: "center", gap: 7, height: 36, paddingHorizontal: 13, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth },
  actions: { gap: 12, marginTop: 4 },
  primary: { height: 58, borderRadius: 29, overflow: "hidden", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  primaryFill: { borderRadius: 29 },
  outline: { height: 56, borderRadius: 28, borderWidth: 1.5, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  link: { height: 44, alignItems: "center", justifyContent: "center" },
  placed: { flex: 1, justifyContent: "space-between", gap: 24 },
  placedCenter: { flex: 1, justifyContent: "center", gap: 24 },
  mini: { flexDirection: "row", borderWidth: StyleSheet.hairlineWidth, paddingVertical: 14 },
  miniCell: { flex: 1, alignItems: "center", gap: 3, paddingHorizontal: 6 },
  missing: { alignItems: "center", gap: 12, padding: 28, borderRadius: 30, borderWidth: StyleSheet.hairlineWidth, marginTop: 40 },
  missingIcon: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center" },
  missingBtn: { height: 50, paddingHorizontal: 28, borderRadius: 25, alignItems: "center", justifyContent: "center", marginTop: 6 },
});
