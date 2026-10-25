import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useDeliveryLocation } from "../../context/DeliveryLocationContext";
import { validMapCoord } from "../../services/locationService";
import { EASE_IN_OUT, EASE_OUT } from "../../theme/motion";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { DeliveryChip, GlassPill, MapThumb, PinGlyph, placeLines } from "./AddressKit";
import { GlassDock } from "./Glass";
import PressableScale from "./PressableScale";
import { Button, Card, Rise } from "./StoreKit";
import StoreWordmark from "./StoreWordmark";

const PLATE = 212;
const RINGS = 4;

const COPY = {
  searching: { eyebrow: "Delivery zone", title: "Finding you…", body: "Scanning nearby streets for the best delivery experience." },
  found: { eyebrow: "Location found", title: "Confirm your spot", body: "We pinned your area for faster delivery and curated picks." },
  error: { eyebrow: "Unable to locate", title: "Turn on location", body: "Allow location access or enter your address manually." },
};

/** One ring of the radar, swelling out from the pin and fading. */
function RadarRing({ index }) {
  const { c } = useStoreTheme();
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(
      index * 560,
      withRepeat(withSequence(withTiming(1, { duration: 2300, easing: EASE_OUT }), withTiming(0, { duration: 0 })), -1, false)
    );
  }, [index, progress]);
  const style = useAnimatedStyle(() => ({
    opacity: (1 - progress.value) * 0.5,
    transform: [{ scale: 0.3 + progress.value * 0.75 }],
  }));
  return <Animated.View style={[styles.ring, { borderColor: c.gold }, style]} />;
}

/** The slow beam sweeping round the plate (constant speed, so linear is the right curve). */
function Sweep() {
  const { c } = useStoreTheme();
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 2800, easing: Easing.linear }), -1, false);
  }, [rotation]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <LinearGradient
        colors={[withAlpha(c.gold, 0), withAlpha(c.gold, 0.26), withAlpha(c.gold, 0)]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.beam}
      />
    </Animated.View>
  );
}

/** Searching (radar and a bobbing pin), error (a dimmed pin with a warning) and found-without-coordinates (a calm halo). */
function RadarPlate({ phase }) {
  const { c, shadow } = useStoreTheme();
  const reduced = useReducedMotion();
  const live = phase === "searching" && !reduced;
  const bob = useSharedValue(0);
  useEffect(() => {
    if (!live) {
      bob.value = withTiming(0, { duration: 180 });
      return;
    }
    bob.value = withRepeat(withSequence(withTiming(-6, { duration: 820, easing: EASE_IN_OUT }), withTiming(0, { duration: 820, easing: EASE_IN_OUT })), -1, false);
  }, [live, bob]);
  const pinStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));

  return (
    <View style={styles.stage}>
      <View style={[styles.plateShadow, shadow.card, { backgroundColor: c.card }]}>
        <View style={[styles.plate, { borderColor: c.goldLine }]}>
          {live ? (
            <>
              {Array.from({ length: RINGS }).map((_, i) => (
                <RadarRing key={i} index={i} />
              ))}
              <Sweep />
            </>
          ) : (
            <View style={[styles.halo, { backgroundColor: withAlpha(c.gold, 0.12), borderColor: withAlpha(c.gold, 0.3) }]} />
          )}
          <Animated.View style={[styles.pin, pinStyle]}>
            <View style={{ opacity: phase === "error" ? 0.45 : 1 }}>
              <PinGlyph size={46} />
            </View>
          </Animated.View>
        </View>
      </View>
      {phase === "error" ? (
        <View style={[styles.badge, { backgroundColor: c.dangerSoft, borderColor: c.card }]}>
          <Ionicons name="alert" size={17} color={c.danger} />
        </View>
      ) : null}
    </View>
  );
}

/** The detected place on a map, with a round "search again" button over it. */
function FoundMap({ snippet, onRetry }) {
  const { c, r, shadow } = useStoreTheme();
  return (
    <Animated.View entering={FadeIn.duration(260).easing(EASE_OUT)} style={[shadow.card, { backgroundColor: c.card, borderRadius: r.xxl }]}>
      <View style={[styles.mapClip, { borderRadius: r.xxl, borderColor: c.line }]}>
        <MapThumb latitude={snippet.latitude ?? snippet.lat} longitude={snippet.longitude ?? snippet.lng} height={236}>
          <View style={styles.mapCorner} pointerEvents="box-none">
            <GlassPill icon="refresh" onPress={onRetry} accessibilityLabel="Search again" />
          </View>
        </MapThumb>
      </View>
    </Animated.View>
  );
}

/** "Delivering to": the street, the area and how fast we reach it. */
function DeliveringTo({ snippet, quote }) {
  const { c, type } = useStoreTheme();
  const { title, detail } = placeLines(snippet, snippet.label);
  return (
    <Card style={styles.place}>
      <View style={styles.placeHead}>
        <View style={[styles.tick, { backgroundColor: c.brandSoft }]}>
          <Ionicons name="checkmark" size={15} color={c.brand} />
        </View>
        <Text style={type.eyebrow(c.goldText, 10.5)}>Delivering to</Text>
      </View>
      <Text style={type.ui(19, "bold", c.ink, { letterSpacing: -0.3 })} numberOfLines={2}>
        {title || snippet.label}
      </Text>
      {detail ? (
        <Text style={type.ui(14, "medium", c.inkMute)} numberOfLines={2}>
          {detail}
        </Text>
      ) : null}
      {quote ? <DeliveryChip quote={quote} style={styles.placeChip} /> : null}
    </Card>
  );
}

/** A quiet text button with an icon, for the two ways round the automatic location. */
function TextAction({ icon, label, onPress }) {
  const { c, type } = useStoreTheme();
  return (
    <PressableScale scaleTo={0.96} lite onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.action}>
      <Ionicons name={icon} size={17} color={c.brand} />
      <Text style={type.ui(14, "bold", c.brand)} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

/**
 * First-run "Confirm your spot": a map (or the radar while we look), what we found, and one button to confirm it. The
 * detection logic lives in `FindLocationScreen`; this is only the view.
 */
export default function StoreFindLocation({ phase = "searching", snippet, errorMessage, onConfirm, onRetry, onOpenMap, onManual }) {
  const { c, type, gutter } = useStoreTheme();
  const insets = useSafeAreaInsets();
  const { quote } = useDeliveryLocation();
  const [dockH, setDockH] = useState(160);
  const copy = COPY[phase] || COPY.searching;
  const body = phase === "error" && errorMessage ? errorMessage : copy.body;
  const found = phase === "found" && snippet;
  const hasCoords = found && validMapCoord(snippet.latitude ?? snippet.lat) && validMapCoord(snippet.longitude ?? snippet.lng);

  return (
    <View style={[styles.screen, { backgroundColor: c.page }]}>
      <LinearGradient colors={[c.washGradient[0], c.washGradient[1], c.page]} locations={[0, 0.45, 1]} style={styles.wash} pointerEvents="none" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 74, paddingBottom: dockH + 24, paddingHorizontal: gutter }]}
      >
        <Rise>{hasCoords ? <FoundMap snippet={snippet} onRetry={onRetry} /> : <RadarPlate phase={phase} />}</Rise>

        <Rise index={1} style={styles.copy}>
          <Text style={type.eyebrow(c.goldText, 11)}>{copy.eyebrow}</Text>
          <Text style={[type.display(32, { ls: -0.8, lh: 38 }), styles.centred]} accessibilityRole="header">
            {copy.title}
          </Text>
          <Text style={[type.ui(14.5, "medium", c.inkSoft), styles.centred, styles.body]}>{body}</Text>
        </Rise>

        {found ? (
          <Rise index={2}>
            <DeliveringTo snippet={snippet} quote={quote} />
          </Rise>
        ) : null}
      </ScrollView>

      <View style={[styles.brand, { top: insets.top + 14 }]} pointerEvents="none">
        <StoreWordmark size={30} />
      </View>

      <View style={styles.dock} onLayout={(e) => setDockH(e.nativeEvent.layout.height)}>
        <GlassDock>
          {found ? (
            <Button label="Confirm location" onPress={onConfirm} />
          ) : phase === "error" ? (
            <Button label="Try again" onPress={onRetry} />
          ) : (
            <View style={[styles.locating, { backgroundColor: c.soft }]} accessibilityRole="progressbar" accessibilityLabel="Locating you">
              <ActivityIndicator size="small" color={c.brand} />
              <Text style={type.ui(15, "bold", c.inkSoft)}>Locating you…</Text>
            </View>
          )}
          <View style={styles.actions}>
            <TextAction icon="map-outline" label="Select on map" onPress={onOpenMap} />
            <TextAction icon="create-outline" label="Enter address manually" onPress={onManual} />
          </View>
        </GlassDock>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  wash: { position: "absolute", top: 0, left: 0, right: 0, height: 460 },
  content: { flexGrow: 1, justifyContent: "center", gap: 22 },
  brand: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  copy: { alignItems: "center", gap: 8 },
  centred: { textAlign: "center" },
  body: { maxWidth: 310 },
  stage: { alignSelf: "center", width: PLATE + 20, height: PLATE + 20, alignItems: "center", justifyContent: "center" },
  plateShadow: { width: PLATE, height: PLATE, borderRadius: PLATE / 2 },
  plate: { flex: 1, borderRadius: PLATE / 2, borderWidth: StyleSheet.hairlineWidth * 2, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  ring: { position: "absolute", width: PLATE - 28, height: PLATE - 28, borderRadius: (PLATE - 28) / 2, borderWidth: 1.5 },
  beam: { position: "absolute", width: "50%", height: "100%", left: "50%" },
  halo: { position: "absolute", width: PLATE - 46, height: PLATE - 46, borderRadius: (PLATE - 46) / 2, borderWidth: 1 },
  pin: { alignItems: "center", justifyContent: "center", marginTop: -8 },
  badge: { position: "absolute", top: 24, right: 24, width: 34, height: 34, borderRadius: 17, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  mapClip: { overflow: "hidden", borderWidth: StyleSheet.hairlineWidth },
  mapCorner: { position: "absolute", top: 12, right: 12 },
  place: { gap: 3 },
  placeHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  tick: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  placeChip: { marginTop: 8 },
  dock: { position: "absolute", left: 0, right: 0, bottom: 0 },
  locating: { height: 54, borderRadius: 27, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  actions: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 22, marginTop: 6 },
  action: { flexDirection: "row", alignItems: "center", gap: 7, minHeight: 44 },
});
