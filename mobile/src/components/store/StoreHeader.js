import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import PressableScale from "./PressableScale";

function InfoChip({ icon, label }) {
  const { c, type } = useStoreTheme();
  return (
    <View style={[styles.chip, { backgroundColor: withAlpha(c.card, 0.78), borderColor: withAlpha(c.brand, 0.14) }]}>
      <MaterialCommunityIcons name={icon} size={14} color={c.brandAlt} />
      <Text style={type.ui(12, "bold", c.inkSoft)} numberOfLines={1}>
        {label}
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
      accessibilityLabel={hasUnread ? "Your account, new notifications" : "Your account"}
      style={[shadow.soft, styles.avatarWrap]}
    >
      <View style={[styles.avatar, { backgroundColor: c.card, borderColor: withAlpha(c.brand, 0.14) }]}>
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

/**
 * Home greeting block — eyebrow + big first name, info chips, rewards / account buttons
 * and the delivery-location row. Sits on the festival gradient.
 */
export default function StoreHeader({
  signedIn,
  firstName,
  avatarUrl,
  hasUnread = false,
  points,
  eyebrow,
  title,
  chips = [],
  locationKind,
  locationText,
  onPressLocation,
  onPressRewards,
  onPressProfile,
  onPressSignIn,
}) {
  const { c, type, shadow, gutter } = useStoreTheme();

  return (
    <View style={[styles.wrap, { paddingHorizontal: gutter }]}>
      <View style={styles.top}>
        <View style={styles.greeting}>
          <Text style={type.ui(15, "semibold", c.inkSoft)} numberOfLines={1}>
            {eyebrow}
          </Text>
          <Text
            style={type.display(30, { ls: -0.7, lh: 34 })}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            accessibilityRole="header"
          >
            {title}
          </Text>
          {chips.length ? (
            <View style={styles.chips}>
              {chips.map((chip) => (
                <InfoChip key={chip.key} icon={chip.icon} label={chip.label} />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          {signedIn ? (
            <PressableScale
              onPress={onPressRewards}
              accessibilityRole="button"
              accessibilityLabel={`Zeevan rewards, ${points} points`}
              style={[styles.rewards, shadow.soft, { backgroundColor: c.card, borderColor: c.gold }]}
            >
              <MaterialCommunityIcons name="star-circle" size={22} color={c.gold} />
              <Text style={type.ui(14.5, "extrabold", c.ink)}>{points}</Text>
            </PressableScale>
          ) : (
            <PressableScale
              onPress={onPressSignIn}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              style={[styles.signIn, shadow.soft, { backgroundColor: c.brand }]}
            >
              <Text style={type.ui(13.5, "extrabold", c.onBrand, { letterSpacing: 0.2 })}>Sign in</Text>
            </PressableScale>
          )}
          <Avatar name={firstName} avatarUrl={avatarUrl} signedIn={signedIn} hasUnread={hasUnread} onPress={onPressProfile} />
        </View>
      </View>

      <Pressable
        onPress={onPressLocation}
        style={[styles.location, { backgroundColor: withAlpha(c.card, 0.72), borderColor: withAlpha(c.brand, 0.12) }]}
        accessibilityRole="button"
        accessibilityLabel={`Delivery location ${locationText}`}
      >
        <View style={[styles.locGlyph, { backgroundColor: c.brandSoft }]}>
          <Ionicons name="location" size={14} color={c.brand} />
        </View>
        <Text style={[type.ui(14, "regular", c.ink), styles.locationText]} numberOfLines={1}>
          {locationKind ? <Text style={type.ui(13.5, "extrabold", c.ink, { letterSpacing: 0.35 })}>{`${locationKind.toUpperCase()}  ·  `}</Text> : null}
          {locationText}
        </Text>
        <Ionicons name="chevron-down" size={15} color={c.inkSoft} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  top: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  greeting: { flex: 1, minWidth: 0, gap: 2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: "100%",
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 2 },
  rewards: {
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 21,
    borderWidth: 1.2,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  signIn: { height: 42, paddingHorizontal: 16, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  avatarWrap: { width: 42, height: 42, borderRadius: 21 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFill: { alignItems: "center", justifyContent: "center" },
  unreadDot: { position: "absolute", top: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  location: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  locGlyph: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  locationText: { flex: 1, flexShrink: 1 },
});
