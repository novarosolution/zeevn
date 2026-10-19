import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { STORE_HOME } from "../../content/storefrontContent";
import { pickTileColors, useStoreTheme, withAlpha } from "../../theme/storefront";
import { resolveImageSource } from "../../utils/mediaSource";
import { DepthSlide, PagerDots } from "./HomeMotion";
import { SectionHeader } from "./SectionTitle";

const GAP = 12;
const CARD_H = 376;
const MEDIA_H = 178;

/** One step of the journey: photo (or a drawn icon when there is none), a gold step badge, title and text. */
function StepCard({ step, total, width, index }) {
  const { c, r, type, shadow, isDark } = useStoreTheme();
  const copy = STORE_HOME.process;
  const photo = resolveImageSource(step.image || copy.fallbackImages?.[step.id]);
  const colors = pickTileColors(c, index);
  const icon = copy.icons[index % copy.icons.length];
  const num = String(step.step).padStart(2, "0");

  return (
    <View style={[styles.card, shadow.card, { width, borderRadius: r.xxl, backgroundColor: c.card, borderColor: c.line }]}>
      <View style={[styles.media, { borderTopLeftRadius: r.xxl, borderTopRightRadius: r.xxl }]}>
        {photo ? (
          <>
            <Image
              source={photo}
              style={StyleSheet.absoluteFill}
              contentFit={step.imageFit === "contain" ? "contain" : "cover"}
              contentPosition={step.imagePosition || "center"}
              transition={250}
              cachePolicy="memory-disk"
            />
            <LinearGradient colors={["rgba(20,14,6,0)", "rgba(20,14,6,0.32)"]} style={StyleSheet.absoluteFill} pointerEvents="none" />
          </>
        ) : (
          <>
            <LinearGradient colors={colors} start={{ x: 0.05, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <Text
              style={[type.display(168, { color: withAlpha(c.brand, isDark ? 0.14 : 0.08), ls: -8, lh: 168 }), styles.numeral]}
              allowFontScaling={false}
            >
              {num}
            </Text>
            <View style={[styles.iconDisc, shadow.card, { backgroundColor: c.card }]}>
              <MaterialCommunityIcons name={icon} size={40} color={c.brand} />
            </View>
          </>
        )}
      </View>

      <View style={[styles.badge, shadow.soft, { borderColor: c.card }]}>
        <LinearGradient colors={[c.goldBright, c.gold]} style={StyleSheet.absoluteFill} />
        <Text style={type.display(17, { color: "#3A2A0C", ls: 0, lh: 20 })} allowFontScaling={false}>
          {num}
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={type.display(20, { ls: -0.35, lh: 24 })} numberOfLines={3}>
          {step.title}
        </Text>
        {step.description ? (
          <Text style={[type.ui(14, "medium", c.inkSoft), styles.desc]} numberOfLines={4}>
            {step.description}
          </Text>
        ) : null}
        <Text style={[type.eyebrow(c.goldText, 9.5), styles.stepOf]}>{copy.stepOf(step.step, total)}</Text>
      </View>
    </View>
  );
}

/**
 * “How it's made” — the Bilona journey as a snapping carousel of step cards. Headline, steps, descriptions and
 * photos come from Admin → Home view → Process journey (`resolveProcessDisplay`).
 */
export default function StoreProcess({ data }) {
  const { gutter } = useStoreTheme();
  const { width } = useWindowDimensions();
  const cardW = Math.round(width * 0.76);
  const stride = cardW + GAP;
  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });
  if (!data?.steps?.length) return null;

  return (
    <View style={styles.wrap}>
      <SectionHeader eyebrow={data.eyebrow} title={data.title} caption={data.subtitle} />
      <Animated.FlatList
        data={data.steps}
        horizontal
        keyExtractor={(step) => step.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={stride}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        contentContainerStyle={{ paddingHorizontal: gutter, paddingVertical: 6, gap: GAP }}
        renderItem={({ item, index }) => (
          <DepthSlide index={index} scrollX={scrollX} step={stride}>
            <StepCard step={item} total={data.steps.length} width={cardW} index={index} />
          </DepthSlide>
        )}
      />
      <PagerDots count={data.steps.length} scrollX={scrollX} step={stride} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  card: { height: CARD_H, borderWidth: StyleSheet.hairlineWidth, overflow: "visible" },
  media: { height: MEDIA_H, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  numeral: { position: "absolute", right: -6, bottom: -26 },
  iconDisc: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    left: 18,
    top: MEDIA_H - 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, paddingHorizontal: 18, paddingTop: 34, paddingBottom: 16, gap: 6 },
  desc: { lineHeight: 20 },
  stepOf: { marginTop: "auto" },
});
