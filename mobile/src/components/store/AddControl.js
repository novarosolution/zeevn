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
  const height = compact ? 32 : 36;

  if (state === "sold") {
    return (
      <View style={[styles.pill, { height, backgroundColor: c.soft }]}>
        <Text style={type.ui(11.5, "bold", c.inkMute, { letterSpacing: 0.3 })}>Sold out</Text>
      </View>
    );
  }

  if (state === "soon") {
    return (
      <View style={[styles.pill, { height, backgroundColor: c.goldSoft, borderColor: c.gold, borderWidth: 1 }]}>
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
            style={[styles.filled, { height, backgroundColor: c.brand }]}
            accessibilityRole="button"
            accessibilityLabel={`${quantity} of ${label} in bag. Change options`}
          >
            <Ionicons name="checkmark" size={14} color={c.onBrand} />
            <Text style={type.ui(12.5, "extrabold", c.onBrand, { letterSpacing: 0.3 })}>{quantity} added</Text>
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
          style={[styles.add, { height, borderColor: c.brandAlt, backgroundColor: c.brandSoft }]}
          accessibilityRole="button"
          accessibilityLabel={`Choose size for ${label}`}
        >
          <Text style={type.ui(13.5, "extrabold", c.brand, { letterSpacing: 0.9 })}>ADD</Text>
        </PressableScale>
      </Animated.View>
    );
  }

  if (quantity > 0) {
    return (
      <Animated.View entering={FadeIn.duration(140)} style={[styles.stepper, { height, backgroundColor: c.brand }]}>
        <Pressable
          onPress={() => {
            hapticTap();
            onRemove?.();
          }}
          hitSlop={8}
          style={styles.stepBtn}
          accessibilityRole="button"
          accessibilityLabel={`Remove one ${label}`}
        >
          <Ionicons name="remove" size={17} color={c.onBrand} />
        </Pressable>
        <Text style={[type.ui(14.5, "extrabold", c.onBrand), styles.qty]}>{quantity}</Text>
        <Pressable
          onPress={() => {
            hapticTap();
            onAdd?.();
          }}
          hitSlop={8}
          style={styles.stepBtn}
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
        style={[styles.add, { height, borderColor: c.brandAlt, backgroundColor: c.brandSoft }]}
        accessibilityRole="button"
        accessibilityLabel={`Add ${label} to bag`}
      >
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
  pill: {
    minWidth: 74,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
