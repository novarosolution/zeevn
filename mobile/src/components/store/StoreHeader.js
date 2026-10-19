import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { STORE_HEADER } from "../../content/storefrontContent";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { DiyaGlyph, HeaderArt } from "./HomeArt";
import { useCountUp } from "./HomeMotion";
import PressableScale from "./PressableScale";

function InfoChip({ icon, label, index }) {
  const { c, type, isDark } = useStoreTheme();
  return (
    <Animated.View
      entering={FadeInRight.delay(260 + index * 90).duration(420)}
      style={[
        styles.chip,
        { backgroundColor: withAlpha(c.card, isDark ? 0.16 : 0.72), borderColor: withAlpha(isDark ? c.gold : c.brand, isDark ? 0.24 : 0.14) },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={14} color={isDark ? c.gold : c.brandAlt} />
      <Text style={type.ui(12, "bold", c.inkSoft)} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
  );
}

/** "Shubh Deepavali · 21 days to Diwali" — the festival greeting, with a flickering lamp. */
function FestivalBadge({ label, countdown, ornament, accent }) {
  const { c, type, isDark } = useStoreTheme();
  return (
    <Animated.View
      entering={FadeInDown.duration(460)}
      style={[
        styles.badge,
        { backgroundColor: withAlpha(c.card, isDark ? 0.14 : 0.6), borderColor: withAlpha(accent, isDark ? 0.34 : 0.3) },
      ]}
      accessible
      accessibilityLabel={countdown ? `${label}. ${countdown}` : label}
    >
      {ornament === "diya" ? <DiyaGlyph size={22} /> : <Ionicons name="sparkles" size={14} color={accent} />}
      <Text style={type.ui(12.5, "extrabold", accent, { letterSpacing: 0.25 })} numberOfLines={1}>
        {label}
      </Text>
      {countdown ? (
        <>
          <View style={[styles.badgeDot, { backgroundColor: accent }]} />
          <Text style={type.ui(12, "semibold", accent)} numberOfLines={1}>
            {countdown}
          </Text>
        </>
      ) : null}
    </Animated.View>
  );
}

function Avatar({ name, avatarUrl, onPress, signedIn, hasUnread }) {
  const { c, type, shadow } = useStoreTheme();
  const initial = String(name || "").trim().charAt(0).toUpperCase();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={hasUnread ? STORE_HEADER.a11y.accountUnread : STORE_HEADER.a11y.account}
      style={[shadow.soft, styles.avatarWrap]}
    >
      <View
        style={[
          styles.avatar,
          { backgroundColor: c.card, borderColor: signedIn ? c.gold : withAlpha(c.brand, 0.14), borderWidth: signedIn ? 1.8 : 1 },
        ]}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : signedIn && initial ? (
          <LinearGradient colors={[c.brandAlt, c.brand]} style={[StyleSheet.absoluteFill, styles.avatarFill]}>
            <Text style={type.display(19, { color: c.onBrand, ls: 0 })}>{initial}</Text>
          </LinearGradient>
        ) : (
          <Ionicons name="person-outline" size={21} color={c.ink} />
        )}
      </View>
      {hasUnread ? <View style={[styles.unreadDot, { backgroundColor: c.danger, borderColor: c.card }]} /> : null}
    </PressableScale>
  );
}

function RewardsPill({ points, onPress }) {
  const { c, type, shadow, isDark } = useStoreTheme();
  const shown = useCountUp(points);
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={STORE_HEADER.a11y.rewards(Number(points).toLocaleString("en-IN"))}
      style={[styles.rewards, shadow.soft, { borderColor: isDark ? withAlpha(c.gold, 0.5) : "#E9B04A" }]}
    >
      <LinearGradient
        colors={isDark ? ["rgba(232,188,132,0.28)", "rgba(232,188,132,0.12)"] : ["#FFF1C9", "#F8D178"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <MaterialCommunityIcons name="star-circle" size={22} color={isDark ? c.gold : "#B9770E"} />
      <Text style={type.ui(14.5, "extrabold", isDark ? c.ink : "#4A2B05")}>{shown.toLocaleString("en-IN")}</Text>
    </PressableScale>
  );
}

/**
 * Home header — delivery location and account actions on top, then the festival greeting badge, the
 * "Zeevan delivers in …" headline (or a personal greeting) and the info chips, over a warm gradient with
 * quiet animated ornaments.
 */
export default function StoreHeader({
  signedIn,
  firstName,
  avatarUrl,
  hasUnread = false,
  points = 0,
  badge,
  ornament = "none",
  accent,
  eyebrow,
  title,
  chips = [],
  locationLabel,
  locationKind,
  locationText,
  signInLabel = "Sign in",
  extendTop = 0,
  onPressLocation,
  onPressRewards,
  onPressProfile,
  onPressSignIn,
}) {
  const { c, type, shadow, gutter, isDark } = useStoreTheme();
  const { width } = useWindowDimensions();
  const [height, setHeight] = useState(250);
  const badgeAccent = accent || c.goldText;

  return (
    <View onLayout={(e) => setHeight(Math.round(e.nativeEvent.layout.height))}>
      <View pointerEvents="none" style={[styles.art, { top: -extendTop, height: height + extendTop }]}>
        <HeaderArt ornament={ornament} isDark={isDark} width={width} height={height + extendTop} />
      </View>

      <View style={{ paddingHorizontal: gutter }}>
        <View style={styles.topBar}>
          <Pressable
            onPress={onPressLocation}
            style={styles.location}
            accessibilityRole="button"
            accessibilityLabel={STORE_HEADER.a11y.location(locationText)}
          >
            <View
              style={[
                styles.pin,
                { backgroundColor: withAlpha(c.card, isDark ? 0.16 : 0.78), borderColor: withAlpha(isDark ? c.gold : c.brand, isDark ? 0.26 : 0.14) },
              ]}
            >
              <Ionicons name="location" size={17} color={isDark ? c.gold : c.brand} />
            </View>
            <View style={styles.locationText}>
              <View style={styles.locationLabelRow}>
                <Text style={type.eyebrow(c.inkSoft, 9.5)} numberOfLines={1}>
                  {locationKind ? `${locationLabel} · ${locationKind}` : locationLabel}
                </Text>
                <Ionicons name="chevron-down" size={12} color={c.inkSoft} />
              </View>
              <Text style={type.ui(15, "bold", c.ink)} numberOfLines={1}>
                {locationText}
              </Text>
            </View>
          </Pressable>

          <View style={styles.actions}>
            {signedIn ? (
              <RewardsPill points={points} onPress={onPressRewards} />
            ) : (
              <PressableScale
                onPress={onPressSignIn}
                accessibilityRole="button"
                accessibilityLabel={signInLabel}
                style={[styles.signIn, shadow.soft, { backgroundColor: c.brand }]}
              >
                <Text style={type.ui(13.5, "extrabold", c.onBrand, { letterSpacing: 0.2 })}>{signInLabel}</Text>
              </PressableScale>
            )}
            <Avatar name={firstName} avatarUrl={avatarUrl} signedIn={signedIn} hasUnread={hasUnread} onPress={onPressProfile} />
          </View>
        </View>

        <View style={styles.greeting}>
          {badge ? <FestivalBadge label={badge.label} countdown={badge.countdown} ornament={ornament} accent={badgeAccent} /> : null}
          <Animated.Text
            entering={FadeInDown.delay(80).duration(460)}
            style={[type.ui(15.5, "semibold", c.inkSoft), styles.eyebrow]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
          >
            {eyebrow}
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(150).duration(520)}
            style={type.display(38, { ls: -1, lh: 42 })}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            maxFontSizeMultiplier={1.2}
            accessibilityRole="header"
          >
            {title}
          </Animated.Text>
        </View>
      </View>

      {chips.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={[styles.chips, { paddingHorizontal: gutter }]}
        >
          {chips.map((chip, i) => (
            <InfoChip key={chip.key} icon={chip.icon} label={chip.label} index={i} />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  art: { position: "absolute", left: 0, right: 0 },
  topBar: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 46 },
  location: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 10 },
  pin: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth },
  locationText: { flex: 1, minWidth: 0, gap: 1 },
  locationLabelRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  greeting: { marginTop: 14, gap: 1 },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    height: 30,
    paddingLeft: 8,
    paddingRight: 12,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 8,
  },
  badgeDot: { width: 3, height: 3, borderRadius: 1.5, opacity: 0.7 },
  eyebrow: { marginBottom: -2 },
  chipScroll: { marginTop: 12, flexGrow: 0 },
  chips: { flexDirection: "row", alignItems: "center", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 28,
    paddingHorizontal: 11,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rewards: {
    height: 42,
    paddingHorizontal: 13,
    borderRadius: 21,
    borderWidth: 1.2,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    overflow: "hidden",
  },
  signIn: { height: 42, paddingHorizontal: 16, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  avatarWrap: { width: 42, height: 42, borderRadius: 21 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFill: { alignItems: "center", justifyContent: "center" },
  unreadDot: { position: "absolute", top: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
});
