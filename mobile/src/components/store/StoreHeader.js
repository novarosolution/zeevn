import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { STORE_BRAND, STORE_HEADER } from "../../content/storefrontContent";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { useCountUp } from "./HomeMotion";
import PressableScale from "./PressableScale";

function Avatar({ name, avatarUrl, onPress, signedIn, hasUnread }) {
  const { c, type } = useStoreTheme();
  const initial = String(name || "").trim().charAt(0).toUpperCase();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={hasUnread ? STORE_HEADER.a11y.accountUnread : STORE_HEADER.a11y.account}
      style={styles.avatarWrap}
    >
      <View
        style={[
          styles.avatar,
          { backgroundColor: c.card, borderColor: signedIn ? c.gold : withAlpha(c.brand, 0.14) },
        ]}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : signedIn && initial ? (
          <LinearGradient colors={[c.brandAlt, c.brand]} style={[StyleSheet.absoluteFill, styles.avatarFill]}>
            <Text style={type.display(15, { color: c.onBrand, ls: 0 })}>{initial}</Text>
          </LinearGradient>
        ) : (
          <Ionicons name="person-outline" size={17} color={c.ink} />
        )}
      </View>
      {hasUnread ? <View style={[styles.unreadDot, { backgroundColor: c.danger, borderColor: c.card }]} /> : null}
    </PressableScale>
  );
}

function RewardsPill({ points, onPress }) {
  const { c, type, isDark } = useStoreTheme();
  const shown = useCountUp(points);
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={STORE_HEADER.a11y.rewards(Number(points).toLocaleString("en-IN"))}
      style={[
        styles.rewards,
        {
          backgroundColor: isDark ? withAlpha("#0F2418", 0.55) : withAlpha("#FFFFFF", 0.82),
          borderColor: isDark ? withAlpha(c.gold, 0.4) : c.goldLine,
        },
      ]}
    >
      <MaterialCommunityIcons name="star-circle" size={15} color={isDark ? c.gold : c.goldText} />
      <Text style={type.ui(12.5, "bold", isDark ? c.ink : c.goldText, { letterSpacing: -0.2 })} maxFontSizeMultiplier={1.15} numberOfLines={1}>
        {shown.toLocaleString("en-IN")}
      </Text>
    </PressableScale>
  );
}

function NearbyPill({ label }) {
  const { c, type, isDark } = useStoreTheme();
  const text = label || STORE_HEADER.nearby;
  return (
    <View
      style={[
        styles.nearby,
        {
          backgroundColor: isDark ? withAlpha("#FFFFFF", 0.1) : withAlpha("#FFFFFF", 0.72),
          borderColor: isDark ? withAlpha("#FFFFFF", 0.14) : withAlpha("#FFFFFF", 0.95),
        },
      ]}
      accessible
      accessibilityLabel={text}
    >
      <Ionicons name="bicycle" size={15} color={isDark ? c.gold : c.brand} />
      <Text style={type.ui(12.5, "semibold", c.inkSoft)} maxFontSizeMultiplier={1.1} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function AddressRow({ kind, street, empty, onPress }) {
  const { c, type } = useStoreTheme();
  const place = (kind || STORE_HEADER.locationLabel).toUpperCase();
  const line = empty ? STORE_HEADER.locationFallback : street;
  return (
    <PressableScale
      scaleTo={0.98}
      lite
      onPress={onPress}
      style={styles.address}
      accessibilityRole="button"
      accessibilityLabel={STORE_HEADER.a11y.location(`${place} ${line}`)}
    >
      <Ionicons name="location" size={15} color={c.ink} />
      <Text style={[type.ui(13.5, "semibold", c.ink, { letterSpacing: -0.1 }), styles.addressText]} numberOfLines={1}>
        <Text style={type.ui(13.5, "bold", c.ink)}>{place}</Text>
        {` · ${line}`}
      </Text>
      <Ionicons name="chevron-down" size={16} color={c.inkMute} />
    </PressableScale>
  );
}

export default function StoreHeader({
  signedIn,
  firstName,
  greeting,
  avatarUrl,
  hasUnread = false,
  points = 0,
  ornament = "none",
  locationText,
  locationStreet,
  locationDetail = "",
  locationEmpty = false,
  locationKind = "",
  locationMeta = "",
  nearbyLabel = "",
  outOfArea = false,
  locationLabel = STORE_HEADER.locationLabel,
  chips = [],
  accent,
  extendTop = 0,
  onPressLocation,
  onPressRewards,
  onPressProfile,
  onPressSignIn,
}) {
  const { c, type, gutter } = useStoreTheme();
  void greeting;
  void ornament;
  void extendTop;
  void locationLabel;
  void locationDetail;
  void chips;
  void accent;
  const name = String(firstName || "").trim();
  const street = locationStreet || locationText || STORE_HEADER.locationFallback;
  const eta = locationMeta;
  const spoken = outOfArea
    ? STORE_HEADER.etaOutside
    : eta
      ? `${STORE_HEADER.etaIn(STORE_BRAND.name)} ${eta}`
      : locationEmpty
        ? STORE_HEADER.locationFallback
        : "Getting your delivery time";

  return (
    <View style={{ paddingHorizontal: gutter, gap: 8 }}>
      <View style={styles.hero}>
        <View style={styles.etaBlock}>
          {outOfArea ? (
            <Text
              style={type.ui(16, "bold", c.danger, { letterSpacing: -0.2 })}
              accessibilityRole="header"
              accessibilityLabel={spoken}
            >
              {STORE_HEADER.etaOutside}
            </Text>
          ) : eta ? (
            <>
              <Text style={type.ui(13, "medium", c.inkMute, { letterSpacing: 0.15 })} numberOfLines={1}>
                {STORE_HEADER.etaIn(STORE_BRAND.name)}
              </Text>
              <View style={styles.etaRow}>
                <Text
                  style={[type.display(34, { ls: -1, lh: 38 }), styles.etaTime]}
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                  accessibilityRole="header"
                  accessibilityLabel={spoken}
                >
                  {eta}
                </Text>
                {!locationEmpty ? <NearbyPill label={nearbyLabel} /> : null}
              </View>
            </>
          ) : (
            <Text style={type.ui(16, "bold", c.ink, { letterSpacing: -0.2 })} accessibilityLabel={spoken}>
              {spoken}
            </Text>
          )}
        </View>
        <View style={styles.actions}>
          {signedIn ? (
            <RewardsPill points={points} onPress={onPressRewards} />
          ) : (
            <PressableScale
              onPress={onPressSignIn}
              style={[styles.signIn, { backgroundColor: c.brand }]}
              accessibilityRole="button"
              accessibilityLabel={STORE_HEADER.signIn}
            >
              <Text style={type.ui(13, "bold", c.onBrand)} maxFontSizeMultiplier={1.15} numberOfLines={1}>
                {STORE_HEADER.signIn}
              </Text>
            </PressableScale>
          )}
          <Avatar
            name={name}
            avatarUrl={avatarUrl}
            signedIn={signedIn}
            hasUnread={hasUnread}
            onPress={signedIn ? onPressProfile : onPressSignIn}
          />
        </View>
      </View>

      <AddressRow kind={locationKind} street={street} empty={locationEmpty} onPress={onPressLocation} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  etaBlock: { flex: 1, minWidth: 0, gap: 2 },
  etaRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 38 },
  etaTime: { flexShrink: 1 },
  nearby: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 2 },
  address: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 32,
    paddingRight: 2,
  },
  addressText: { flex: 1, minWidth: 0 },
  rewards: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth + 0.5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  signIn: { height: 32, paddingHorizontal: 14, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  avatarWrap: { width: 36, height: 36, borderRadius: 18 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  avatarFill: { alignItems: "center", justifyContent: "center" },
  unreadDot: { position: "absolute", top: 0, right: 0, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
});
