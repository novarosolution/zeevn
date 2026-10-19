import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { STORE_BRAND, STORE_HOME } from "../../content/storefrontContent";
import { CERTIFICATIONS_STRIP } from "../../content/certificationsContent";
import { useMotionEnabled } from "./HomeArt";
import { Stagger } from "./HomeMotion";
import PressableScale from "./PressableScale";
import { SectionHeader } from "./SectionTitle";
import StoreIcon from "./StoreIcon";

/** “Why Zeevan” — four brand promises in a 2×2 premium card. */
export function TrustStrip({ eyebrow, title, items }) {
  const { c, r, type, shadow, gutter, isDark } = useStoreTheme();
  return (
    <View style={styles.trustWrap}>
      <SectionHeader eyebrow={eyebrow} title={title} />
      <View
        style={[
          styles.trustCard,
          shadow.card,
          {
            marginHorizontal: gutter,
            backgroundColor: c.card,
            borderColor: c.line,
            borderRadius: r.xxl,
          },
        ]}
      >
        {items.map((item, i) => (
          <Stagger
            key={item.key}
            index={i}
            step={0.09}
            distance={10}
            scaleFrom={1}
            style={[
              styles.trustItem,
              i % 2 === 1 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: c.line },
              i >= 2 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line },
            ]}
          >
            <View
              style={[
                styles.trustIcon,
                {
                  backgroundColor: isDark ? withAlpha(c.gold, 0.14) : c.goldSoft,
                  borderColor: withAlpha(c.gold, 0.28),
                },
              ]}
            >
              <StoreIcon icon={item.icon} size={20} color={c.goldText} />
            </View>
            <Text style={[type.ui(13, "bold", c.ink), styles.trustLabel]}>{item.label}</Text>
          </Stagger>
        ))}
      </View>
    </View>
  );
}

const BADGE = 86;
const BADGE_GAP = 12;
const MARQUEE_PX_PER_SECOND = 26;

function CertBadge({ badge }) {
  const { c, r, shadow } = useStoreTheme();
  return (
    <View
      style={[styles.badge, shadow.soft, { backgroundColor: c.card, borderColor: c.line, borderRadius: r.lg }]}
      accessible
      accessibilityLabel={badge.label}
    >
      <Image source={badge.image} style={styles.badgeImg} contentFit="contain" cachePolicy="memory-disk" />
    </View>
  );
}

/**
 * “Standards we cook to” — the certification badges (FSSAI, FDA, ISO …) drifting past in a slow loop.
 * Copy and badges live in `content/certificationsContent.js`; with Reduce Motion they sit in a plain scroller.
 */
export function CertificationsRow() {
  const { c, gutter } = useStoreTheme();
  const enabled = useMotionEnabled();
  const copy = CERTIFICATIONS_STRIP;
  const rowW = copy.badges.length * (BADGE + BADGE_GAP);
  const x = useSharedValue(0);

  useEffect(() => {
    if (!enabled) return undefined;
    x.value = 0;
    x.value = withRepeat(withTiming(-rowW, { duration: (rowW / MARQUEE_PX_PER_SECOND) * 1000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(x);
  }, [enabled, rowW, x]);
  const slide = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  const row = copy.badges.map((badge) => <CertBadge key={badge.key} badge={badge} />);

  return (
    <View style={styles.certWrap}>
      <SectionHeader eyebrow={copy.eyebrow} title={copy.title} caption={copy.hint} />
      {enabled ? (
        <View style={styles.marquee}>
          <Animated.View style={[styles.marqueeRow, slide]}>
            {row}
            {copy.badges.map((badge) => (
              <CertBadge key={`${badge.key}-loop`} badge={badge} />
            ))}
          </Animated.View>
          <LinearGradient
            colors={[c.page, withAlpha(c.page, 0)]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.fade, { left: 0 }]}
            pointerEvents="none"
          />
          <LinearGradient
            colors={[withAlpha(c.page, 0), c.page]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.fade, { right: 0 }]}
            pointerEvents="none"
          />
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.staticRow, { paddingHorizontal: gutter }]}>
          {row}
        </ScrollView>
      )}
    </View>
  );
}

/** Closing support card: a soft gold panel with one clear action. */
export function HelpCard({ onPress }) {
  const { c, r, type, shadow, gutter, isDark } = useStoreTheme();
  const copy = STORE_HOME.help;
  const colors = isDark ? ["#3A2E14", "#241C0B"] : ["#FFF3D6", "#F8DD9E"];
  return (
    <View style={{ paddingHorizontal: gutter }}>
      <PressableScale
        onPress={onPress}
        scaleTo={0.985}
        accessibilityRole="button"
        accessibilityLabel={`${copy.title}. ${copy.cta}`}
        style={[shadow.card, { borderRadius: r.xxl, backgroundColor: colors[0] }]}
      >
        <View style={[styles.help, { borderRadius: r.xxl, borderColor: withAlpha(c.gold, isDark ? 0.3 : 0.5) }]}>
          <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={[styles.helpDisc, shadow.soft, { backgroundColor: c.card }]}>
            <StoreIcon icon={{ mci: "headset" }} size={26} color={c.brand} />
          </View>
          <View style={styles.helpCopy}>
            <Text style={type.eyebrow(c.goldText, 9.5)}>{copy.eyebrow}</Text>
            <Text style={type.display(21, { ls: -0.4, lh: 25 })} numberOfLines={2}>
              {copy.title}
            </Text>
            <Text style={type.ui(13, "medium", c.inkSoft)} numberOfLines={3}>
              {copy.body}
            </Text>
            <View style={[styles.helpCta, { backgroundColor: c.brand }]}>
              <Text style={type.ui(13.5, "extrabold", c.onBrand, { letterSpacing: 0.2 })}>{copy.cta}</Text>
              <Ionicons name="arrow-forward" size={14} color={c.onBrand} />
            </View>
          </View>
        </View>
      </PressableScale>
    </View>
  );
}

/** Quiet brand sign-off: wordmark, tagline and made-in line. */
export function BrandFooter({ version }) {
  const { c, type, gutter } = useStoreTheme();
  return (
    <View style={[styles.footer, { paddingHorizontal: gutter }]}>
      <LinearGradient
        colors={[withAlpha(c.gold, 0), withAlpha(c.gold, 0.65), withAlpha(c.gold, 0)]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.rule}
      />
      <Text style={type.display(48, { color: withAlpha(c.gold, 0.5), ls: -1.4, lh: 54 })} allowFontScaling={false}>
        {STORE_BRAND.name}
      </Text>
      <Text style={type.eyebrow(c.goldText, 10.5)}>{STORE_BRAND.tagline}</Text>
      <Text style={[type.ui(12.5, "medium", c.inkMute), styles.madeIn]}>{STORE_BRAND.madeIn}</Text>
      {version ? <Text style={type.ui(11, "medium", c.inkMute)}>{version}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  trustWrap: { gap: 12 },
  trustCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  trustItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  trustIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  trustLabel: { flex: 1, lineHeight: 17 },
  certWrap: { gap: 14 },
  marquee: { height: BADGE + 12, overflow: "hidden", justifyContent: "center" },
  marqueeRow: { flexDirection: "row", gap: BADGE_GAP, paddingLeft: BADGE_GAP },
  staticRow: { flexDirection: "row", gap: BADGE_GAP, paddingVertical: 6 },
  fade: { position: "absolute", top: 0, bottom: 0, width: 34 },
  badge: { width: BADGE, height: BADGE, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center", padding: 6 },
  badgeImg: { width: "100%", height: "100%", borderRadius: 12 },
  help: { overflow: "hidden", borderWidth: 1, padding: 18, flexDirection: "row", gap: 14, alignItems: "flex-start" },
  helpDisc: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center" },
  helpCopy: { flex: 1, minWidth: 0, gap: 4 },
  helpCta: { alignSelf: "flex-start", marginTop: 8, flexDirection: "row", alignItems: "center", gap: 8, height: 40, paddingHorizontal: 18, borderRadius: 20 },
  footer: { alignItems: "center", gap: 6, paddingTop: 4, paddingBottom: 8 },
  rule: { alignSelf: "stretch", height: 1.5, marginBottom: 12 },
  madeIn: { marginTop: 2 },
});
