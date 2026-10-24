import React, { Children, Fragment, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MapView from "react-native-maps";
import { etaFromQuote } from "../../services/deliveryService";
import { validMapCoord } from "../../services/locationService";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { formatDeliveryLocationParts } from "../../utils/deliveryLocationLabel";
import Glass from "./Glass";
import PressableScale from "./PressableScale";

/**
 * Building blocks shared by every place / address screen (editor, first-run confirm, map picker, checkout): the delivery
 * pin, a static map card with glass controls on it, the delivery-time chip and the grouped form rows. Native only.
 */

/* ---------------------------------------------------------------------------------------------- the pin */

const PIN = 34;
/** The tail tucks 4 pt under the disc. */
const pinTail = (size) => Math.round(size * 0.3);
/** Height of the default pin: place its box so its bottom-centre (the tip) sits on the coordinate. */
export const PIN_HEIGHT = PIN + pinTail(PIN) - 4;

/** The delivery pin: an olive disc with a white eye and a short tail. The tip is the bottom-centre of the box. */
export function PinGlyph({ size = PIN }) {
  const { c, isDark } = useStoreTheme();
  const tail = pinTail(size);
  const rim = isDark ? "#18200C" : "#FFFFFF";
  return (
    <View style={{ width: size, height: size + tail - 4, alignItems: "center" }} pointerEvents="none">
      <View style={[styles.pinHead, { width: size, height: size, borderRadius: size / 2, backgroundColor: c.brand, borderColor: rim }]}>
        <View style={{ width: size * 0.34, height: size * 0.34, borderRadius: size * 0.17, backgroundColor: rim }} />
      </View>
      <View style={[styles.pinTail, { borderTopColor: c.brand, borderTopWidth: tail, borderLeftWidth: tail * 0.5, borderRightWidth: tail * 0.5 }]} />
    </View>
  );
}

/* ---------------------------------------------------------------------------------------------- map card */

/** A few faint streets for the card when there is no pin yet. */
function MapArt() {
  const { c } = useStoreTheme();
  const line = withAlpha(c.ink, 0.06);
  return (
    <>
      <View style={[styles.artH, { backgroundColor: line, top: "30%", height: 14, transform: [{ rotate: "-11deg" }] }]} />
      <View style={[styles.artH, { backgroundColor: line, top: "66%", height: 10, transform: [{ rotate: "7deg" }] }]} />
      <View style={[styles.artV, { backgroundColor: line, left: "28%", width: 12, transform: [{ rotate: "13deg" }] }]} />
      <View style={[styles.artV, { backgroundColor: line, left: "70%", width: 9, transform: [{ rotate: "-7deg" }] }]} />
    </>
  );
}

/**
 * A map picture of a place with the delivery pin on it (the map is centred on the coordinate, so a plain view at the
 * centre is exact and cheaper than a Marker). Without coordinates it shows soft streets and a faded pin. Pass
 * `onPress` to make the whole card a button; `children` (glass controls, chips) are laid over it. `inset` reserves a
 * strip along the bottom for those controls: Apple's "Maps · Legal" mark rides above it and the pin centres in the rest.
 */
export function MapThumb({ latitude, longitude, height = 150, inset = 0, onPress, accessibilityLabel, style, children }) {
  const { c, isDark } = useStoreTheme();
  const has = validMapCoord(latitude) && validMapCoord(longitude);
  const region = useMemo(
    () => (has ? { latitude: Number(latitude), longitude: Number(longitude), latitudeDelta: 0.007, longitudeDelta: 0.007 } : null),
    [has, latitude, longitude]
  );
  const content = (
    <>
      {has ? (
        <MapView
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          region={region}
          mapPadding={{ top: 0, left: 0, right: 0, bottom: inset }}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
          liteMode={Platform.OS === "android"}
          showsPointsOfInterest={false}
          showsCompass={false}
          userInterfaceStyle={isDark ? "dark" : "light"}
        />
      ) : (
        <LinearGradient colors={[c.soft, c.softStrong]} style={StyleSheet.absoluteFill}>
          <MapArt />
        </LinearGradient>
      )}
      <View style={[styles.pinAnchor, { paddingBottom: inset }]} pointerEvents="none">
        <View style={{ opacity: has ? 1 : 0.5, transform: [{ translateY: -PIN_HEIGHT / 2 }] }}>
          <PinGlyph />
        </View>
      </View>
      {children}
    </>
  );
  const frame = [{ height, backgroundColor: c.soft, overflow: "hidden" }, style];
  if (!onPress) return <View style={frame}>{content}</View>;
  return (
    <PressableScale onPress={onPress} scaleTo={0.992} lite accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={frame}>
      {content}
    </PressableScale>
  );
}

/** A small glass control for laying over a map: icon + label, or icon alone (a round button) when there is no label. */
export function GlassPill({ icon, label, onPress, loading = false, accessibilityLabel, active = false, size = 38, style }) {
  const { c, type } = useStoreTheme();
  const body = (
    <Glass
      material="thin"
      radius={size / 2}
      lift={size > 38}
      style={{ height: size }}
      contentStyle={[styles.glassPillBody, { height: size }, label ? styles.glassPillLabelled : { width: size }]}
    >
      {loading ? <ActivityIndicator size="small" color={c.brand} /> : <Ionicons name={icon} size={17} color={active ? c.brand : c.ink} />}
      {label ? (
        <Text style={type.ui(13.5, "bold", c.ink)} numberOfLines={1}>
          {label}
        </Text>
      ) : null}
    </Glass>
  );
  if (!onPress) return <View style={style}>{body}</View>;
  return (
    <PressableScale
      onPress={onPress}
      disabled={loading}
      scaleTo={0.94}
      lite
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      style={style}
    >
      {body}
    </PressableScale>
  );
}

/* ---------------------------------------------------------------------------------------------- chips + text */

/** Small tinted status pill. tone: brand (olive) · danger · gold. */
export function StatusChip({ icon, label, tone = "brand", style }) {
  const { c, type } = useStoreTheme();
  const [bg, fg] = { brand: [c.brandSoft, c.brand], danger: [c.dangerSoft, c.danger], gold: [c.goldSoft, c.goldText] }[tone] || [c.brandSoft, c.brand];
  return (
    <View style={[styles.chip, { backgroundColor: bg }, style]}>
      {icon ? <Ionicons name={icon} size={14} color={fg} /> : null}
      <Text style={type.ui(12, "bold", fg)} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/**
 * "2.4 km · 1 hour" for a serviceable place, the reason in red for one outside the delivery area. Nothing without a quote.
 * `fromShop` words the distance as "2.4 km from shop".
 */
export function DeliveryChip({ quote, fromShop = false, style }) {
  if (!quote) return null;
  if (quote.serviceable === false) {
    return <StatusChip icon="alert-circle" tone="danger" label={quote.message || "Outside delivery area"} style={style} />;
  }
  const distance = quote.distanceLabel && fromShop ? `${quote.distanceLabel} from shop` : quote.distanceLabel;
  const text = [distance, etaFromQuote(quote)].filter(Boolean).join(" · ");
  return text ? <StatusChip icon="bicycle" label={text} style={style} /> : null;
}

/**
 * Street and place lines for a saved or detected place, without the repeats GPS labels carry
 * ("Gandhinagar" over "Gandhinagar 382421" becomes "Gandhinagar" over "382421").
 */
export function placeLines(address, fallback = "") {
  const parts = formatDeliveryLocationParts(address, fallback);
  const title = parts.street || "";
  let detail = parts.detail || "";
  if (title && detail.toLowerCase().startsWith(title.toLowerCase())) {
    detail = detail.slice(title.length).replace(/^[\s·,–-]+/, "");
  }
  return { title, detail, empty: Boolean(parts.empty) };
}

/* ---------------------------------------------------------------------------------------------- grouped form */

/** One rounded card of form rows, hairline-separated and inset (the iOS grouped-form look). */
export function FormGroup({ children, style }) {
  const { c, r, shadow } = useStoreTheme();
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View style={[shadow.soft, { backgroundColor: c.card, borderRadius: r.xl }, style]}>
      <View style={{ borderRadius: r.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: c.line, overflow: "hidden" }}>
        {items.map((child, i) => (
          <Fragment key={child.key ?? i}>
            {i > 0 ? <View style={[styles.rule, { backgroundColor: c.line }]} /> : null}
            {child}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

/** Two fields side by side in one row of a FormGroup, split by a hairline. Give each `style={{ flex: 1 }}`. */
export function FormPair({ children }) {
  const { c } = useStoreTheme();
  const [first, second] = Children.toArray(children);
  return (
    <View style={styles.pair}>
      {first}
      <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: c.line }} />
      {second}
    </View>
  );
}

/**
 * A row of a FormGroup: small label over the value. The label turns olive while it has focus and red on error (the
 * message sits under the value). Tapping anywhere on the row focuses the input.
 */
export function FormField({ label, value, onChangeText, error, style, inputRef, onFocus, onBlur, ...inputProps }) {
  const { c, type } = useStoreTheme();
  const [focused, setFocused] = useState(false);
  const input = useRef(null);
  const accent = error ? c.danger : focused ? c.brand : c.inkMute;
  return (
    <Pressable
      accessible={false}
      onPress={() => input.current?.focus()}
      style={[styles.field, focused && { backgroundColor: withAlpha(c.brand, 0.05) }, style]}
    >
      <Text style={type.ui(11.5, "bold", accent, { letterSpacing: 0.3 })} numberOfLines={1}>
        {label}
      </Text>
      <TextInput
        {...inputProps}
        ref={(node) => {
          input.current = node;
          if (typeof inputRef === "function") inputRef(node);
        }}
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel={label}
        placeholderTextColor={c.inkMute}
        selectionColor={c.brand}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[type.ui(16, "semibold", c.ink), styles.input]}
      />
      {error ? <Text style={type.ui(12, "medium", c.danger)}>{error}</Text> : null}
    </Pressable>
  );
}

/** A tappable row for a FormGroup of actions: tinted icon, label, chevron (or a spinner while it works). */
export function ActionRow({ icon, label, onPress, loading = false, accessibilityLabel }) {
  const { c, type } = useStoreTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={loading}
      scaleTo={0.985}
      lite
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      style={styles.actionRow}
    >
      <View style={[styles.actionIcon, { backgroundColor: c.brandSoft }]}>
        {loading ? <ActivityIndicator size="small" color={c.brand} /> : <Ionicons name={icon} size={18} color={c.brand} />}
      </View>
      <Text style={[type.ui(15, "bold", c.ink), styles.actionLabel]} numberOfLines={1}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={c.inkMute} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pinHead: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    shadowColor: "#1A2216",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  pinTail: { width: 0, height: 0, marginTop: -4, borderLeftColor: "transparent", borderRightColor: "transparent" },
  pinAnchor: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  artH: { position: "absolute", left: -20, right: -20 },
  artV: { position: "absolute", top: -20, bottom: -20 },
  glassPillBody: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  glassPillLabelled: { paddingHorizontal: 14 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", height: 26, paddingHorizontal: 10, borderRadius: 13 },
  rule: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  pair: { flexDirection: "row", alignItems: "stretch" },
  field: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 9, minHeight: 60, gap: 1 },
  input: { paddingVertical: 2, minHeight: 24 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, minHeight: 54 },
  actionIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionLabel: { flex: 1, minWidth: 0 },
});
