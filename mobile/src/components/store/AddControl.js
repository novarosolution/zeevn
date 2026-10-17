import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import { useStoreTheme } from "../../theme/storefront";
import PressableScale from "./PressableScale";
import { hapticTap } from "../../utils/haptics";

/**
 * Cart control used on every product tile.
 *  - `ready`  → outlined ADD, morphing into a [− qty +] stepper
 *  - `options`→ ADD opens the size picker; shows “n added” once something is in the bag
 *  - `sold` / `soon` → inert status pill
 */
export default function AddControl({
  quantity = 0,
  state = "ready",
  mode = "stepper",
  onAdd,
  onRemove,
  onOpenOptions,
  compact = false,
  label = "product",
}) {
  const { c, type } = useStoreTheme();
  const height = compact ? 33 : 36;
  const addSize = compact ? styles.addCompact : null;
  const stepperSize = compact ? styles.stepperCompact : null;
  const stepBtnSize = compact ? styles.stepBtnCompact : null;

  if (state === "sold") {
    return (
      <View style={[styles.pill, { height, backgroundColor: c.soft }]}>
        <Text style={type.ui(11.5, "bold", c.inkMute, { letterSpacing: 0.3 })}>Sold out</Text>
      </View>
    );
  }

  if (state === "soon") {
    return (
      <View style={[styles.pill, { height, backgroundColor: c.card, borderColor: c.gold, borderWidth: 1 }]}>
        <View pointerEvents="none" style={[styles.tint, { backgroundColor: c.goldSoft }]} />
        <Text style={type.ui(11.5, "extrabold", c.goldText, { letterSpacing: 0.6 })}>SOON</Text>
      </View>
    );
  }

  if (mode === "options") {
    if (quantity > 0) {
      return (
        <Animated.View entering={FadeIn.duration(140)}>
          <PressableScale
            onPress={() => {
              hapticTap();
              onOpenOptions?.();
            }}
            style={[styles.filled, addSize, { height, backgroundColor: c.brand }]}
            accessibilityRole="button"
            accessibilityLabel={`${quantity} of ${label} in bag. Change options`}
          >
            <Ionicons name="checkmark" size={14} color={c.onBrand} />
            <Text style={type.ui(12.5, "extrabold", c.onBrand, { letterSpacing: 0.3 })}>{compact ? quantity : `${quantity} added`}</Text>
          </PressableScale>
        </Animated.View>
      );
    }
    return (
      <Animated.View entering={FadeIn.duration(140)}>
        <PressableScale
          onPress={() => {
            hapticTap();
            onOpenOptions?.();
          }}
          style={[styles.add, addSize, { height, borderColor: c.brandAlt, backgroundColor: c.card }]}
          accessibilityRole="button"
          accessibilityLabel={`Choose size for ${label}`}
        >
          <View pointerEvents="none" style={[styles.tint, { backgroundColor: c.brandSoft }]} />
          <Text style={type.ui(13.5, "extrabold", c.brand, { letterSpacing: 0.9 })}>ADD</Text>
        </PressableScale>
      </Animated.View>
    );
  }

  if (quantity > 0) {
    return (
      <Animated.View entering={FadeIn.duration(140)} style={[styles.stepper, stepperSize, { height, backgroundColor: c.brand }]}>
        <Pressable
          onPress={() => {
            hapticTap();
            onRemove?.();
          }}
          hitSlop={8}
          style={[styles.stepBtn, stepBtnSize]}
          accessibilityRole="button"
          accessibilityLabel={`Remove one ${label}`}
        >
          <Ionicons name="remove" size={17} color={c.onBrand} />
        </Pressable>
        <Text style={[type.ui(compact ? 13.5 : 14.5, "extrabold", c.onBrand), styles.qty]}>{quantity}</Text>
        <Pressable
          onPress={() => {
            hapticTap();
            onAdd?.();
          }}
          hitSlop={8}
          style={[styles.stepBtn, stepBtnSize]}
          accessibilityRole="button"
          accessibilityLabel={`Add one more ${label}`}
        >
          <Ionicons name="add" size={17} color={c.onBrand} />
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(140)}>
      <PressableScale
        onPress={() => {
          hapticTap();
          onAdd?.();
        }}
        style={[styles.add, addSize, { height, borderColor: c.brandAlt, backgroundColor: c.card }]}
        accessibilityRole="button"
        accessibilityLabel={`Add ${label} to bag`}
      >
        <View pointerEvents="none" style={[styles.tint, { backgroundColor: c.brandSoft }]} />
        <Text style={type.ui(13.5, "extrabold", c.brand, { letterSpacing: 0.9 })}>ADD</Text>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  add: {
    minWidth: 78,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  // Soft brand tint over an opaque card fill, so ADD stays legible where it overlaps a photo.
  tint: { ...StyleSheet.absoluteFillObject, borderRadius: 10.5 },
  filled: {
    minWidth: 78,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  stepper: {
    minWidth: 94,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  stepBtn: { width: 30, height: "100%", alignItems: "center", justifyContent: "center" },
  qty: { minWidth: 22, textAlign: "center" },
  addCompact: { minWidth: 66, paddingHorizontal: 8 },
  stepperCompact: { minWidth: 82 },
  stepBtnCompact: { width: 27 },
  pill: {
    minWidth: 74,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
