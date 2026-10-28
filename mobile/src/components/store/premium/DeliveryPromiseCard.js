import React, { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useDeliveryLocation } from "../../../hooks/useDeliveryLocation";
import { etaFromQuote } from "../../../services/deliveryService";
import { describeAreaDelivery } from "../../../utils/deliveryPromise";
import { useStoreTheme, withAlpha } from "../../../theme/storefront";
import PressableScale from "../PressableScale";
import PremiumBoundary from "./PremiumBoundary";

/**
 * Home strip that says, for the shopper's own pin, what delivery will be like: how soon, what it costs and how far.
 * It only renders from a real `/delivery/check` answer; with no location yet it turns into a one-tap "set location" prompt,
 * and outside the delivery area it says so plainly instead of promising anything.
 *
 * props: onPressLocation, style
 */
function DeliveryPromiseCardBase({ onPressLocation, style }) {
  const { c, r, type, shadow, isDark } = useStoreTheme();
  const { quote, displayLabel, savedLabel } = useDeliveryLocation();

  const state = useMemo(() => {
    if (!quote) return { kind: "unknown" };
    if (quote.serviceable === false) return { kind: "out", message: quote.message || "We don't deliver to this area yet." };
    if (quote.serviceable !== true) return { kind: "unknown" };
    const fee = describeAreaDelivery(quote);
    return {
      kind: "ok",
      eta: etaFromQuote(quote),
      title: fee?.title || "",
      body: fee?.body || "",
      distance: quote.distanceLabel || "",
      zone: quote.zoneName || "",
    };
  }, [quote]);

  if (state.kind === "unknown") {
    if (displayLabel && savedLabel) return null;
    return (
      <PressableScale
        onPress={onPressLocation}
        scaleTo={0.985}
        accessibilityRole="button"
        accessibilityLabel="Set your delivery location"
        style={[styles.card, shadow.soft, { backgroundColor: c.card, borderColor: c.line, borderRadius: r.xl }, style]}
      >
        <View style={[styles.icon, { backgroundColor: c.brandSoft }]}>
          <Ionicons name="location-outline" size={22} color={c.brand} />
        </View>
        <View style={styles.text}>
          <Text style={type.ui(15.5, "extrabold", c.ink)}>See delivery time for your address</Text>
          <Text style={type.ui(12.5, "medium", c.inkMute)}>Add your location to check timing and fees.</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.inkMute} />
      </PressableScale>
    );
  }

  if (state.kind === "out") {
    return (
      <PressableScale
        onPress={onPressLocation}
        scaleTo={0.985}
        accessibilityRole="button"
        accessibilityLabel="Change your delivery location"
        style={[styles.card, { backgroundColor: c.dangerSoft, borderColor: withAlpha(c.danger, 0.3), borderRadius: r.xl }, style]}
      >
        <View style={[styles.icon, { backgroundColor: withAlpha(c.danger, 0.14) }]}>
          <Ionicons name="alert-circle-outline" size={22} color={c.danger} />
        </View>
        <View style={styles.text}>
          <Text style={type.ui(15.5, "extrabold", c.danger)}>Outside our delivery area</Text>
          <Text style={type.ui(12.5, "medium", c.inkSoft)} numberOfLines={2}>
            {state.message}
          </Text>
        </View>
        <Text style={type.ui(13.5, "extrabold", c.danger)}>Change</Text>
      </PressableScale>
    );
  }

  const facts = [state.distance, state.zone].filter(Boolean).join(" · ");
  return (
    <PressableScale
      onPress={onPressLocation}
      scaleTo={0.985}
      accessibilityRole="button"
      accessibilityLabel={`Delivery ${state.eta || ""}. ${state.title}. Change location`}
      style={[styles.card, shadow.soft, { backgroundColor: isDark ? withAlpha(c.brand, 0.12) : c.brandSoft, borderColor: withAlpha(c.brandAlt, isDark ? 0.3 : 0.28), borderRadius: r.xl }, style]}
    >
      <View style={[styles.icon, { backgroundColor: c.card }]}>
        <MaterialCommunityIcons name="moped-outline" size={24} color={c.brand} />
      </View>
      <View style={styles.text}>
        <Text style={type.ui(15.5, "extrabold", c.ink)} numberOfLines={1}>
          {state.eta ? `Delivering in ${state.eta}` : "We deliver to you"}
        </Text>
        <Text style={type.ui(12.5, "medium", c.inkSoft)} numberOfLines={2}>
          {[state.title, facts].filter(Boolean).join(" · ")}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.inkMute} />
    </PressableScale>
  );
}

const Memo = memo(DeliveryPromiseCardBase);

export default function DeliveryPromiseCard(props) {
  return (
    <PremiumBoundary name="DeliveryPromiseCard">
      <Memo {...props} />
    </PremiumBoundary>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 13, borderWidth: StyleSheet.hairlineWidth },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, minWidth: 0, gap: 2 },
});
