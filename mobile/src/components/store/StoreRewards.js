import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { formatINR } from "../../utils/currency";
import { hapticSuccess } from "../../utils/haptics";
import { useCountUp } from "./HomeMotion";
import PressableScale from "./PressableScale";
import { CoinArt } from "./PromoCarousel";
import StoreBanner from "./StoreBanner";
import { Bone, ShimmerProvider } from "./StoreSkeleton";
import StoreScreen from "./StoreScreen";
import { Button, Card, EmptyState, Group, Rise, SectionLabel } from "./StoreKit";

function shortDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function PointsHero({ points }) {
  const { c, r, type, isDark, shadow } = useStoreTheme();
  const shown = useCountUp(points, 1000);
  return (
    <View style={[styles.hero, shadow.card, { borderRadius: r.xxl }]}>
      <LinearGradient
        colors={isDark ? ["#4A3812", "#2E2209"] : ["#FFF1CC", "#F8D68C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { borderRadius: r.xxl, borderWidth: 1, borderColor: withAlpha("#FFFFFF", isDark ? 0.08 : 0.6) }]} pointerEvents="none" />
      <View style={styles.heroCoin} pointerEvents="none">
        <CoinArt size={132} />
      </View>
      <Text style={type.ui(13, "bold", isDark ? c.goldText : "#8A5A12", { letterSpacing: 1.2 })}>YOUR POINTS</Text>
      <Text style={type.display(54, { color: isDark ? c.ink : "#3A2A0C", ls: -1.2, lh: 60 })}>{shown.toLocaleString("en-IN")}</Text>
      <View style={[styles.heroPill, { backgroundColor: withAlpha(isDark ? "#FFFFFF" : "#3A2A0C", isDark ? 0.1 : 0.08) }]}>
        <Ionicons name="sparkles" size={13} color={isDark ? c.goldText : "#8A5A12"} />
        <Text style={type.ui(12.5, "bold", isDark ? c.inkSoft : "#6A4A1C")}>Earn on every delivered order</Text>
      </View>
    </View>
  );
}

function Ticket({ code, expiresAt, onCopy, onCart }) {
  const { c, r, type, shadow } = useStoreTheme();
  useEffect(() => {
    hapticSuccess();
  }, []);
  return (
    <Card style={[styles.ticket, shadow.card]} padded={false}>
      <View style={styles.ticketTop}>
        <View style={[styles.ticketIcon, { backgroundColor: c.goldSoft }]}>
          <Ionicons name="ticket" size={22} color={c.goldText} />
        </View>
        <View style={styles.flex}>
          <Text style={type.ui(15, "extrabold", c.ink)}>Reward unlocked</Text>
          {expiresAt ? <Text style={type.ui(12.5, "medium", c.inkMute)}>Use before {shortDate(expiresAt)}</Text> : null}
        </View>
      </View>
      <PressableScale
        onPress={onCopy}
        scaleTo={0.98}
        accessibilityRole="button"
        accessibilityLabel={`Copy code ${code}`}
        style={[styles.code, { borderColor: c.brandAlt, backgroundColor: c.brandSoft, borderRadius: r.lg }]}
      >
        <Text style={type.display(26, { color: c.brand, ls: 3, semi: true })} selectable>
          {code}
        </Text>
        <Ionicons name="copy-outline" size={20} color={c.brand} />
      </PressableScale>
      <View style={styles.ticketActions}>
        <Button label="Copy" icon="copy-outline" tone="secondary" compact onPress={onCopy} style={styles.flex} />
        <Button label="Use in cart" icon="bag-handle-outline" compact onPress={onCart} style={styles.flex} />
      </View>
    </Card>
  );
}

function WalletRow({ coupon, onCopy, onCart }) {
  const { c, type } = useStoreTheme();
  return (
    <View style={styles.wallet}>
      <View style={[styles.bubble, { backgroundColor: c.goldSoft }]}>
        <Ionicons name="pricetag" size={19} color={c.goldText} />
      </View>
      <View style={styles.flex}>
        <Text style={type.ui(16, "extrabold", c.ink, { letterSpacing: 1 })} numberOfLines={1}>
          {coupon.code}
        </Text>
        <Text style={type.ui(12.5, "medium", c.inkMute)} numberOfLines={2}>
          {[coupon.benefitSummary, coupon.minOrderAmount > 0 ? `Min ${formatINR(coupon.minOrderAmount)}` : "", coupon.expiresAt ? `Expires ${shortDate(coupon.expiresAt)}` : ""]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </View>
      <PressableScale onPress={onCopy} scaleTo={0.92} accessibilityRole="button" accessibilityLabel={`Copy ${coupon.code}`} style={[styles.mini, { backgroundColor: c.soft }]}>
        <Ionicons name="copy-outline" size={18} color={c.ink} />
      </PressableScale>
      <PressableScale onPress={onCart} scaleTo={0.92} accessibilityRole="button" accessibilityLabel="Use in cart" style={[styles.mini, { backgroundColor: c.brand }]}>
        <Ionicons name="bag-handle-outline" size={18} color={c.onBrand} />
      </PressableScale>
    </View>
  );
}

function Progress({ value }) {
  const { c } = useStoreTheme();
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(250, withTiming(Math.max(0, Math.min(1, value)), { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [value, p]);
  const fill = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));
  return (
    <View style={[styles.track, { backgroundColor: c.soft }]}>
      <Animated.View style={[styles.fill, fill]}>
        <LinearGradient colors={[c.goldBright, c.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

/** Points with Indian digit grouping (12,500), like the balance in the hero. */
const fmtPoints = (n) => Number(n || 0).toLocaleString("en-IN");

function OfferCard({ item, balance, busy, cartAware, onRedeem }) {
  const { c, type } = useStoreTheme();
  // "N more points to unlock" only makes sense while points are the one thing missing, not for a maxed-out offer.
  const blockedForAnotherReason = Boolean(item.disabledReason) && item.disabledReason !== "Not enough points";
  const short = blockedForAnotherReason ? 0 : Math.max(0, Number(item.pointsCost || 0) - Number(balance || 0));
  const saves = cartAware && item.eligibleForSubtotal && Number(item.estimatedDiscount) > 0 ? Number(item.estimatedDiscount) : 0;
  return (
    <Card style={styles.offer}>
      <View style={styles.offerTop}>
        <View style={[styles.bubble, { backgroundColor: c.brandSoft }]}>
          <Ionicons name="gift" size={20} color={c.brand} />
        </View>
        <View style={styles.flex}>
          <Text style={type.ui(16.5, "extrabold", c.ink)} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={type.ui(13.5, "medium", c.inkMute)} numberOfLines={2}>
            {item.benefitSummary || item.description}
            {item.minOrderAmount > 0 ? ` · Min ${formatINR(item.minOrderAmount)}` : ""}
          </Text>
        </View>
        <View style={[styles.cost, { backgroundColor: c.goldSoft }]}>
          <Ionicons name="star" size={12} color={c.goldText} />
          <Text style={type.ui(13.5, "extrabold", c.goldText)}>{fmtPoints(item.pointsCost)}</Text>
        </View>
      </View>
      {saves ? <Text style={type.ui(12.5, "bold", c.brand)}>≈ Save {formatINR(saves)} on your cart</Text> : null}
      {short > 0 ? (
        <View style={styles.progress}>
          <Progress value={Number(balance || 0) / Math.max(1, Number(item.pointsCost || 1))} />
          <Text style={type.ui(12, "semibold", c.inkMute)}>{fmtPoints(short)} more {short === 1 ? "point" : "points"} to unlock</Text>
        </View>
      ) : null}
      <Button
        label={item.canRedeem ? "Redeem" : item.disabledReason || "Not available yet"}
        icon={item.canRedeem ? "gift-outline" : undefined}
        tone={item.canRedeem ? "primary" : "ghost"}
        compact
        disabled={!item.canRedeem}
        loading={busy}
        onPress={onRedeem}
      />
    </Card>
  );
}

function RewardsSkeleton() {
  return (
    <ShimmerProvider>
      <View style={styles.skeleton}>
        <Bone width="100%" height={168} radius={30} />
        <Bone width="100%" height={150} radius={24} />
        <Bone width="100%" height={150} radius={24} />
      </View>
    </ShimmerProvider>
  );
}

/** Native rewards: points hero, the coupon you just unlocked, your codes and the offers to redeem. */
export default function StoreRewards({
  navigation,
  loading,
  error,
  onDismissError,
  toast,
  onDismissToast,
  balance,
  catalog,
  wallet,
  busyId,
  onRedeem,
  lastRedeem,
  onCopy,
  onCart,
  cartAware,
}) {
  return (
    <StoreScreen title="Rewards" navigation={navigation}>
      {error ? <StoreBanner message={error} onClose={onDismissError} /> : null}
      {toast ? <StoreBanner tone="success" message={toast} onClose={onDismissToast} /> : null}

      <Rise index={0}>
        <PointsHero points={balance} />
      </Rise>

      {lastRedeem?.code ? (
        <Rise index={1}>
          <Ticket code={lastRedeem.code} expiresAt={lastRedeem.expiresAt} onCopy={() => onCopy(lastRedeem.code)} onCart={() => onCart(lastRedeem.code)} />
        </Rise>
      ) : null}

      {loading ? (
        <RewardsSkeleton />
      ) : (
        <>
          {wallet.length > 0 ? (
            <Rise index={2}>
              <SectionLabel>Your codes</SectionLabel>
              <Group>
                {wallet.map((coupon) => (
                  <WalletRow key={String(coupon._id || coupon.code)} coupon={coupon} onCopy={() => onCopy(coupon.code)} onCart={() => onCart(coupon.code)} />
                ))}
              </Group>
            </Rise>
          ) : null}

          <Rise index={3}>
            <SectionLabel>Redeem with points</SectionLabel>
            {catalog.length === 0 ? (
              <Card padded={false}>
                <EmptyState icon="gift-outline" title="No rewards right now" body="New offers will appear here." />
              </Card>
            ) : (
              <View style={styles.offers}>
                {catalog.map((item) => (
                  <OfferCard key={item._id} item={item} balance={balance} busy={busyId === item._id} cartAware={cartAware} onRedeem={() => onRedeem(item._id)} />
                ))}
              </View>
            )}
          </Rise>
        </>
      )}
    </StoreScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  hero: { overflow: "hidden", paddingHorizontal: 22, paddingVertical: 22, gap: 2, minHeight: 168 },
  heroCoin: { position: "absolute", right: -14, bottom: -10 },
  heroPill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, height: 30, paddingHorizontal: 12, borderRadius: 15, marginTop: 10 },
  ticket: { overflow: "hidden", padding: 16, gap: 14 },
  ticketTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  ticketIcon: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  code: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, height: 64, borderWidth: 1.5, borderStyle: "dashed" },
  ticketActions: { flexDirection: "row", gap: 10 },
  wallet: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  bubble: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  mini: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  offers: { gap: 14 },
  offer: { gap: 12 },
  offerTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  cost: { flexDirection: "row", alignItems: "center", gap: 4, height: 30, paddingHorizontal: 10, borderRadius: 15 },
  progress: { gap: 7 },
  track: { height: 8, borderRadius: 4, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4, overflow: "hidden" },
  skeleton: { gap: 14 },
});
