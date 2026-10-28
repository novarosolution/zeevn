import React, { memo, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { useStoreTheme, withAlpha } from "../../../theme/storefront";
import { LOYALTY_TIERS, formatPoints, getTierProgress } from "../../../utils/loyalty";
import { hapticTick } from "../../../utils/haptics";
import PressableScale from "../PressableScale";
import PremiumBoundary from "./PremiumBoundary";

/** Animated 0..1 fill with gold ends; one shared value, so it costs nothing while scrolling. */
function TierBar({ progress, markers }) {
  const { c, isDark } = useStoreTheme();
  const reduced = useReducedMotion();
  const p = useSharedValue(reduced ? progress : 0);
  useEffect(() => {
    const target = Math.max(0, Math.min(1, progress));
    p.value = reduced ? target : withDelay(220, withTiming(target, { duration: 950, easing: Easing.out(Easing.cubic) }));
  }, [progress, reduced, p]);
  const fill = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));
  const track = isDark ? withAlpha("#FFFFFF", 0.12) : withAlpha("#3A2A0C", 0.12);
  return (
    <View style={styles.barWrap}>
      <View style={[styles.track, { backgroundColor: track }]}>
        <Animated.View style={[styles.fill, fill]}>
          <LinearGradient
            colors={isDark ? [c.goldBright, c.gold] : ["#E8A93A", "#B8741A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      {markers.map((m) => (
        <View key={m.key} style={[styles.marker, { left: `${m.at * 100}%`, backgroundColor: m.reached ? c.goldBright : track, borderColor: isDark ? "#2E2209" : "#FFF1CC" }]} />
      ))}
    </View>
  );
}

function PerkRow({ text, muted }) {
  const { c, type, isDark } = useStoreTheme();
  const ink = isDark ? c.inkSoft : "#5A4216";
  return (
    <View style={styles.perk}>
      <View style={[styles.perkTick, { backgroundColor: muted ? withAlpha(ink, 0.12) : withAlpha(c.brand, isDark ? 0.28 : 0.16) }]}>
        <Ionicons name={muted ? "lock-closed" : "checkmark"} size={11} color={muted ? ink : c.brand} />
      </View>
      <Text style={[type.ui(13.5, "medium", muted ? withAlpha(ink, 0.75) : ink), styles.perkText]}>{text}</Text>
    </View>
  );
}

/**
 * Loyalty status card: current tier, a progress bar toward the next one with tick marks at every tier, and an expandable
 * list of perks. Tap the header to open Rewards (`onPress`); the chevron row toggles the perk list.
 *
 * props: points, onPress, compact (hides perks + toggle), style
 */
function LoyaltyTierCardBase({ points = 0, onPress, compact = false, style }) {
  const { c, r, type, isDark, shadow } = useStoreTheme();
  const [open, setOpen] = useState(false);
  const info = useMemo(() => getTierProgress(points), [points]);
  const { tier, next } = info;

  // Bar spans the whole ladder, not just the current step, so the tick marks sit at each tier's own threshold.
  const top = LOYALTY_TIERS[LOYALTY_TIERS.length - 1].min;
  const ladderProgress = top > 0 ? Math.min(1, info.points / top) : 1;
  const markers = useMemo(
    () => LOYALTY_TIERS.slice(1).map((t) => ({ key: t.key, at: t.min / top, reached: info.points >= t.min })),
    [info.points, top]
  );

  const ink = isDark ? c.ink : "#3A2A0C";
  const mute = isDark ? c.inkSoft : "#6A4A1C";
  const accent = isDark ? c.goldText : "#8A5A12";

  const headline = next ? `${formatPoints(info.toNext)} points to ${next.label}` : "You're at the top tier";

  const head = (
    <View style={styles.head}>
      <View style={[styles.badge, { backgroundColor: withAlpha(isDark ? "#FFFFFF" : "#3A2A0C", isDark ? 0.1 : 0.08), borderColor: withAlpha(accent, 0.35) }]}>
        <Ionicons name={tier.icon} size={22} color={accent} />
      </View>
      <View style={styles.headText}>
        <Text style={type.ui(11.5, "extrabold", accent, { letterSpacing: 1.4, textTransform: "uppercase" })}>{tier.label} tier</Text>
        <Text style={type.display(22, { color: ink, ls: -0.3, lh: 26 })} numberOfLines={1}>
          {formatPoints(info.points)} points
        </Text>
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={20} color={accent} /> : null}
    </View>
  );

  return (
    <View style={[styles.card, shadow.card, { borderRadius: r.xxl }, style]}>
      <LinearGradient colors={isDark ? ["#3A2D12", "#241A08"] : ["#FFF5D6", "#F6D48A"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { borderRadius: r.xxl, borderWidth: 1, borderColor: withAlpha("#FFFFFF", isDark ? 0.08 : 0.65) }]} pointerEvents="none" />

      {onPress ? (
        <PressableScale onPress={onPress} scaleTo={0.985} accessibilityRole="button" accessibilityLabel={`${tier.label} tier, ${formatPoints(info.points)} points. Open rewards`}>
          {head}
        </PressableScale>
      ) : (
        head
      )}

      <View style={styles.body}>
        <TierBar progress={ladderProgress} markers={markers} />
        <View style={styles.legend}>
          {LOYALTY_TIERS.map((t, i) => (
            <Text
              key={t.key}
              style={[
                type.ui(11.5, t.key === tier.key ? "extrabold" : "medium", t.key === tier.key ? ink : withAlpha(mute, 0.8)),
                i === 0 ? styles.legendFirst : i === LOYALTY_TIERS.length - 1 ? styles.legendLast : styles.legendMid,
              ]}
            >
              {t.label}
            </Text>
          ))}
        </View>
        <Text style={type.ui(13.5, "semibold", mute)}>{headline}</Text>
      </View>

      {compact ? null : (
        <>
          <PressableScale
            lite
            scaleTo={0.97}
            onPress={() => {
              hapticTick();
              setOpen((v) => !v);
            }}
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            accessibilityLabel={open ? "Hide tier perks" : "Show tier perks"}
            style={[styles.toggle, { borderTopColor: withAlpha(accent, 0.22) }]}
          >
            <Text style={type.ui(13.5, "extrabold", accent)}>{open ? "Hide perks" : "What you get"}</Text>
            <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={accent} />
          </PressableScale>
          {open ? (
            <View style={styles.perks}>
              <Text style={type.ui(12.5, "bold", mute, { letterSpacing: 0.4 })}>{tier.blurb}</Text>
              {tier.perks.map((perk) => (
                <PerkRow key={perk} text={perk} />
              ))}
              {next ? (
                <>
                  <Text style={[type.ui(12.5, "bold", mute, { letterSpacing: 0.4 }), styles.nextLabel]}>At {next.label}</Text>
                  {next.perks
                    .filter((perk) => !perk.startsWith("Everything in"))
                    .map((perk) => (
                      <PerkRow key={perk} text={perk} muted />
                    ))}
                </>
              ) : null}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const Memo = memo(LoyaltyTierCardBase);

export default function LoyaltyTierCard(props) {
  return (
    <PremiumBoundary name="LoyaltyTierCard">
      <Memo {...props} />
    </PremiumBoundary>
  );
}

const styles = StyleSheet.create({
  card: { overflow: "hidden" },
  head: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 6 },
  badge: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  headText: { flex: 1, minWidth: 0, gap: 2 },
  body: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 16, gap: 8 },
  barWrap: { height: 18, justifyContent: "center" },
  track: { height: 10, borderRadius: 5, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 5, overflow: "hidden" },
  marker: { position: "absolute", top: 3, width: 12, height: 12, borderRadius: 6, marginLeft: -6, borderWidth: 2 },
  legend: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  legendFirst: { textAlign: "left" },
  legendMid: { textAlign: "center" },
  legendLast: { textAlign: "right" },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    minHeight: 48,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  perks: { paddingHorizontal: 18, paddingBottom: 18, gap: 10 },
  perk: { flexDirection: "row", alignItems: "center", gap: 10 },
  perkTick: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  perkText: { flex: 1 },
  nextLabel: { marginTop: 6 },
});
