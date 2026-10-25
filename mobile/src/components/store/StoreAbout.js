import React, { useMemo } from "react";
import { Image as RNImage, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { resolveImageSource } from "../../utils/mediaSource";
import FloatingNav from "./FloatingNav";
import { useStoreNavPad } from "./StoreTracker";
import { useCountUp } from "./HomeMotion";
import PressableScale from "./PressableScale";
import { Button, Card, Rise, SectionLabel } from "./StoreKit";

const HERO_H = 340;

function photoSource(photo) {
  if (!photo) return null;
  if (typeof photo.source === "number") return photo.source;
  return resolveImageSource(photo.source || photo.url);
}

function Photo({ photo, style }) {
  const source = photoSource(photo);
  if (source == null) return <View style={[style, styles.photoEmpty]} />;
  if (typeof source === "number") return <RNImage source={source} style={style} resizeMode="cover" accessibilityIgnoresInvertColors />;
  return <Image source={source} style={style} contentFit="cover" transition={260} cachePolicy="memory-disk" />;
}

function Stat({ stat }) {
  const { c, r, type, shadow } = useStoreTheme();
  const match = /^(\D*)(\d[\d,]*)(.*)$/.exec(String(stat.value || ""));
  const target = match ? Number(match[2].replace(/,/g, "")) : 0;
  const counted = useCountUp(target, 1100);
  const text = match ? `${match[1]}${counted.toLocaleString("en-IN")}${match[3]}` : stat.value;
  return (
    <View style={[styles.stat, shadow.soft, { backgroundColor: c.card, borderColor: c.line, borderRadius: r.xl }]}>
      <Text style={type.display(26, { color: c.brand, ls: -0.5, lh: 30 })} numberOfLines={1}>
        {text}
      </Text>
      <Text style={type.ui(12.5, "semibold", c.inkMute)} numberOfLines={2}>
        {stat.label}
      </Text>
    </View>
  );
}

/** Native About page: parallax photo hero, key numbers, gallery, values, the craft steps and a closing call to action. */
export default function StoreAbout({ navigation, about, onShop, onContact }) {
  const { c, r, type, isDark, gutter, shadow } = useStoreTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const photos = useMemo(() => (about?.photos || []).filter((p) => photoSource(p) != null), [about]);
  const hero = photos[0];
  const gallery = photos.slice(hero ? 1 : 0);
  const navPad = useStoreNavPad(insets);
  const cardW = Math.min(280, width * 0.68);

  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [-200, 0, HERO_H], [-100, 0, HERO_H * 0.4], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [-200, 0], [1.4, 1], Extrapolation.CLAMP) },
    ],
  }));
  const heroTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, HERO_H * 0.55], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [0, HERO_H], [0, -34], Extrapolation.CLAMP) }],
  }));
  const barStyle = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.value, [HERO_H - 150, HERO_H - 90], [0, 1], Extrapolation.CLAMP) }));

  const goBack = () => (navigation.canGoBack?.() ? navigation.goBack() : navigation.navigate("Home"));
  const stats = (about?.sidebarStats || []).slice(0, 4);
  const values = (about?.values || []).slice(0, 6);
  const steps = about?.craft?.steps || [];
  const story = [about?.heritage, about?.bilona, about?.origin].filter((s) => s && s.title && s.body);

  return (
    <View style={[styles.screen, { backgroundColor: c.page }]}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: navPad }}>
        <View style={styles.hero}>
          <Animated.View style={[StyleSheet.absoluteFill, heroStyle]}>
            {hero ? <Photo photo={hero} style={StyleSheet.absoluteFill} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: c.brand }]} />}
          </Animated.View>
          <LinearGradient colors={["rgba(12,16,8,0.5)", "rgba(12,16,8,0.1)", "rgba(12,16,8,0.62)", "rgba(12,16,8,0.88)"]} locations={[0, 0.26, 0.62, 1]} style={StyleSheet.absoluteFill} />
          <Animated.View style={[styles.heroText, { paddingHorizontal: gutter }, heroTextStyle]}>
            <Text style={type.ui(12, "bold", "#F2D9A5", { letterSpacing: 1.6 })}>{String(about?.eyebrow || "Our story").toUpperCase()}</Text>
            <Text style={type.display(36, { color: "#FFFFFF", ls: -0.8, lh: 41 })}>{about?.title || "About Zeevan"}</Text>
            {about?.pageLead ? (
              <Text style={type.ui(15, "medium", "rgba(255,255,255,0.88)", { lineHeight: 22 })} numberOfLines={3}>
                {about.pageLead}
              </Text>
            ) : null}
          </Animated.View>
        </View>

        <View style={{ paddingHorizontal: gutter, gap: 26, paddingTop: 22 }}>
          {about?.pullQuote ? (
            <Rise>
              <View style={[styles.quote, { borderLeftColor: c.gold }]}>
                <Text style={type.display(21, { semi: true, ls: -0.2, lh: 29, color: c.ink })}>{about.pullQuote}</Text>
              </View>
            </Rise>
          ) : null}

          {stats.length ? (
            <Rise>
              <View style={styles.stats}>
                {stats.map((stat) => (
                  <Stat key={`${stat.value}-${stat.label}`} stat={stat} />
                ))}
              </View>
            </Rise>
          ) : null}

          {about?.body ? (
            <Rise>
              <Text style={type.ui(16, "medium", c.inkSoft, { lineHeight: 26 })}>{about.body}</Text>
            </Rise>
          ) : null}

          {gallery.length ? (
            <Rise>
              <SectionLabel>Crafted for the pantry</SectionLabel>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast" snapToInterval={cardW + 12} contentContainerStyle={styles.gallery} style={styles.galleryScroll}>
                {gallery.map((photo, index) => (
                  <View key={`${index}-${photo.caption}`} style={[styles.shot, shadow.card, { width: cardW, borderRadius: r.xxl }]}>
                    <Photo photo={photo} style={StyleSheet.absoluteFill} />
                    <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.65)"]} style={styles.shotFade} />
                    {photo.caption ? (
                      <Text style={[type.ui(13.5, "bold", "#FFFFFF"), styles.shotCaption]} numberOfLines={2}>
                        {photo.caption}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            </Rise>
          ) : null}

          {story.map((item) => (
            <Rise key={item.title}>
              <Card tone="soft" style={styles.story}>
                {item.eyebrow ? <Text style={type.eyebrow(c.goldText)}>{item.eyebrow}</Text> : null}
                <Text style={type.display(22, { semi: true, ls: -0.3, lh: 27 })}>{item.title}</Text>
                <Text style={type.ui(15, "medium", c.inkSoft, { lineHeight: 24 })}>{item.body}</Text>
              </Card>
            </Rise>
          ))}

          {values.length ? (
            <Rise>
              <SectionLabel>What guides us</SectionLabel>
              <View style={styles.values}>
                {values.map((value, index) => (
                  <View key={value.title} style={[styles.value, shadow.soft, { backgroundColor: c.card, borderColor: c.line, borderRadius: r.xl }]}>
                    <View style={[styles.valueIcon, { backgroundColor: index % 2 ? c.goldSoft : c.brandSoft }]}>
                      <Ionicons name={["leaf-outline", "water-outline", "sparkles-outline", "heart-outline", "shield-checkmark-outline", "sunny-outline"][index % 6]} size={20} color={index % 2 ? c.goldText : c.brand} />
                    </View>
                    <Text style={type.ui(15, "extrabold", c.ink)}>{value.title}</Text>
                    {value.body ? (
                      <Text style={type.ui(12.5, "medium", c.inkMute, { lineHeight: 18 })} numberOfLines={4}>
                        {value.body}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </Rise>
          ) : null}

          {steps.length ? (
            <Rise>
              <SectionLabel>{about?.craft?.title || "How it is made"}</SectionLabel>
              <View style={styles.timeline}>
                {steps.map((step, index) => (
                  <View key={step.id} style={styles.step}>
                    <View style={styles.rail}>
                      <View style={[styles.node, { backgroundColor: c.brand }]}>
                        <Text style={type.ui(12, "extrabold", c.onBrand)}>{index + 1}</Text>
                      </View>
                      {index < steps.length - 1 ? <View style={[styles.line, { backgroundColor: c.lineStrong }]} /> : null}
                    </View>
                    <View style={styles.stepText}>
                      <Text style={type.ui(16, "extrabold", c.ink)}>{step.title}</Text>
                      {step.body ? <Text style={type.ui(14, "medium", c.inkMute, { lineHeight: 21 })}>{step.body}</Text> : null}
                    </View>
                  </View>
                ))}
              </View>
            </Rise>
          ) : null}

          <Rise>
            <View style={[styles.cta, shadow.card, { borderRadius: r.xxl }]}>
              <LinearGradient colors={isDark ? ["#2B3A1C", "#1B2612"] : ["#355A2A", "#244424"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <Text style={type.display(26, { color: "#FFFFFF", ls: -0.4, lh: 31 })}>{about?.ctaBand?.title || "Bring purity home"}</Text>
              <View style={styles.ctaRow}>
                <Button label={about?.ctaBand?.ctaLabel || "Shop Zeevan"} icon="arrow-forward" onPress={onShop} compact tone="ghost" style={[styles.ctaBtn, { backgroundColor: "#FFFFFF", borderColor: "#FFFFFF" }]} />
                <PressableScale onPress={onContact} scaleTo={0.96} accessibilityRole="button" accessibilityLabel="Talk to us" style={styles.ctaLink}>
                  <Text style={type.ui(14.5, "bold", "#F2D9A5")}>{about?.ctaBand?.ctaSecondaryLabel || "Talk to us"}</Text>
                </PressableScale>
              </View>
            </View>
          </Rise>
        </View>
      </Animated.ScrollView>

      <Animated.View pointerEvents="none" style={[styles.bar, { height: insets.top + 58, backgroundColor: c.glassStrong, borderBottomColor: c.line }, barStyle]}>
        <Text style={[type.ui(18, "extrabold", c.ink), styles.barTitle]} numberOfLines={1}>
          {about?.title || "About Zeevan"}
        </Text>
      </Animated.View>
      <View style={[styles.backWrap, { top: insets.top + 6, left: gutter }]}>
        <PressableScale onPress={goBack} scaleTo={0.92} accessibilityRole="button" accessibilityLabel="Back" style={[styles.back, { backgroundColor: withAlpha("#FFFFFF", 0.92) }]}>
          <Ionicons name="chevron-back" size={21} color="#1D2618" />
        </PressableScale>
      </View>
      <FloatingNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  hero: { height: HERO_H, overflow: "hidden", justifyContent: "flex-end" },
  heroText: { paddingBottom: 26, gap: 8 },
  photoEmpty: { backgroundColor: "#2B3A1C" },
  quote: { borderLeftWidth: 3, paddingLeft: 16 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  stat: { flexGrow: 1, flexBasis: "46%", padding: 16, gap: 4, borderWidth: StyleSheet.hairlineWidth },
  galleryScroll: { marginHorizontal: -16 },
  gallery: { gap: 12, paddingHorizontal: 16, paddingBottom: 14 },
  shot: { aspectRatio: 4 / 5, overflow: "hidden", backgroundColor: "#2B3A1C" },
  shotFade: { position: "absolute", left: 0, right: 0, bottom: 0, height: 110 },
  shotCaption: { position: "absolute", left: 16, right: 16, bottom: 14 },
  story: { gap: 8 },
  values: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  value: { flexGrow: 1, flexBasis: "46%", padding: 16, gap: 8, borderWidth: StyleSheet.hairlineWidth },
  valueIcon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  timeline: { gap: 0 },
  step: { flexDirection: "row", gap: 16 },
  rail: { alignItems: "center", width: 30 },
  node: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  line: { width: 2, flex: 1, minHeight: 24, marginVertical: 4, borderRadius: 1 },
  stepText: { flex: 1, gap: 4, paddingBottom: 22 },
  cta: { overflow: "hidden", padding: 24, gap: 18 },
  ctaRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  ctaBtn: { flexShrink: 0 },
  ctaLink: { paddingVertical: 8, paddingHorizontal: 6 },
  bar: { position: "absolute", top: 0, left: 0, right: 0, borderBottomWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "flex-end", paddingBottom: 17 },
  barTitle: { maxWidth: "62%" },
  backWrap: { position: "absolute" },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
