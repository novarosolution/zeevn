import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { STORE_HEADER } from "../../content/storefrontContent";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { useCountUp } from "./HomeMotion";
import PressableScale from "./PressableScale";

function InfoChip({ chip, accent }) {
  const { c, type, isDark } = useStoreTheme();
  const festival = chip.kind === "festival";
  const tint = isDark ? c.gold : c.brandAlt;
  return (
    <View
      accessible
      accessibilityLabel={chip.label}
      style={[
        styles.chip,
        festival && styles.chipFestival,
        {
          backgroundColor: withAlpha(c.card, isDark ? 0.85 : 0.92),
          borderColor: festival
            ? withAlpha(accent, isDark ? 0.42 : 0.34)
            : withAlpha(isDark ? c.gold : c.brand, isDark ? 0.24 : 0.14),
        },
      ]}
    >
      {festival ? (
        <Ionicons name="sparkles" size={14} color={accent} />
      ) : (
        <MaterialCommunityIcons name={chip.icon} size={14} color={tint} />
      )}
      <Text
        style={type.ui(12, festival ? "extrabold" : "bold", festival ? accent : c.inkSoft, festival ? { letterSpacing: 0.2 } : null)}
        numberOfLines={1}
      >
        {chip.label}
      </Text>
    </View>
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

export default function StoreHeader({
  signedIn,
  firstName,
  avatarUrl,
  hasUnread = false,
  points = 0,
  ornament = "none",
  locationText,
  locationKind = "",
  locationLabel = STORE_HEADER.deliveringTo,
  chips = [],
  accent,
  extendTop = 0,
  onPressLocation,
  onPressRewards,
  onPressProfile,
  onPressSignIn,
}) {
  const { c, type, shadow, gutter, isDark } = useStoreTheme();
  const chipAccent = accent || c.goldText;
  void ornament;
  void extendTop;

  return (
    <View>
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
              <Text style={type.ui(16.5, "extrabold", c.ink)} numberOfLines={1}>
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
                style={[styles.signIn, shadow.soft, { backgroundColor: c.brand }]}
                accessibilityRole="button"
                accessibilityLabel={STORE_HEADER.signIn}
              >
                <Text style={type.ui(13.5, "extrabold", c.onBrand)}>{STORE_HEADER.signIn}</Text>
              </PressableScale>
            )}
            <Avatar
              name={firstName}
              avatarUrl={avatarUrl}
              signedIn={signedIn}
              hasUnread={hasUnread}
              onPress={signedIn ? onPressProfile : onPressSignIn}
            />
          </View>
        </View>
      </View>

      {chips.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.chips, { paddingHorizontal: gutter }]}
          style={styles.chipScroll}
        >
          {chips.map((chip) => (
            <InfoChip key={chip.key} chip={chip} accent={chipAccent} />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 46 },
  location: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 10 },
  pin: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth },
  locationText: { flex: 1, minWidth: 0, gap: 1 },
  locationLabelRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
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
  chipFestival: { height: 30, paddingLeft: 8, paddingRight: 12, borderRadius: 15 },
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
