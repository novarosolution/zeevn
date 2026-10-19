import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn } from "react-native-reanimated";
import { STORE_CARD } from "../../content/storefrontContent";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import PressableScale from "./PressableScale";
import { hapticTap } from "../../utils/haptics";

/**
 * A brand-green pill with a soft coloured shadow. `outer` carries the shadow (iOS needs a solid fill on the
 * view that casts it) and the gradient is clipped inside it.
 */
function Pill({ height, minWidth, children, style }) {
  const { isDark } = useStoreTheme();
  const colors = isDark ? ["#CFE08F", "#9DB45B"] : ["#3F6231", "#244424"];
  return (
    <View
      style={[
        styles.outer,
        { height, minWidth, borderRadius: height / 2, backgroundColor: colors[1], shadowColor: colors[1], shadowOpacity: isDark ? 0.3 : 0.26 },
        style,
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.inner, { borderRadius: height / 2 }]}
      >
        <LinearGradient
          pointerEvents="none"
          colors={[withAlpha("#FFFFFF", isDark ? 0.24 : 0.2), withAlpha("#FFFFFF", 0)]}
          style={styles.sheen}
        />
        {children}
      </LinearGradient>
    </View>
  );
}

/**
 * Cart control used on every product tile.
 *  - `ready`  → green ADD pill, morphing into a [− qty +] stepper
 *  - `options`→ ADD opens the size picker; shows “n added” once something is in the bag
 *  - `sold` / `soon` → inert status pill
 * `block` stretches the control across its container (narrow tiles stack it under the price).
 */
export default function AddControl({
  quantity = 0,
  state = "ready",
  mode = "stepper",
  onAdd,
  onRemove,
  onOpenOptions,
  compact = false,
  block = false,
  label = "product",
}) {
  const { c, type } = useStoreTheme();
  const height = compact ? 33 : 36;
  const minWidth = compact ? 68 : 78;
  const textColor = c.onBrand;
  const fill = block ? styles.block : null;

  if (state === "sold") {
    return (
      <View style={[styles.status, fill, { height, backgroundColor: c.soft }]}>
        <Text style={type.ui(11.5, "bold", c.inkMute, { letterSpacing: 0.3 })}>{STORE_CARD.soldOut}</Text>
      </View>
    );
  }

  if (state === "soon") {
    return (
      <View style={[styles.status, fill, { height, backgroundColor: c.goldSoft, borderColor: withAlpha(c.gold, 0.7), borderWidth: 1 }]}>
        <Text style={type.ui(11.5, "extrabold", c.goldText, { letterSpacing: 0.6 })}>{STORE_CARD.soon}</Text>
      </View>
    );
  }

  const addLabel = (
    <>
      <Ionicons name="add" size={compact ? 15 : 16} color={textColor} />
      <Text style={type.ui(compact ? 12.5 : 13.5, "extrabold", textColor, { letterSpacing: 0.8 })}>{STORE_CARD.add}</Text>
    </>
  );

  if (mode === "options") {
    const open = () => {
      hapticTap();
      onOpenOptions?.();
    };
    if (quantity > 0) {
      return (
        <Animated.View entering={FadeIn.duration(140)} style={fill}>
          <PressableScale
            onPress={open}
            style={fill}
            accessibilityRole="button"
            accessibilityLabel={STORE_CARD.a11y.changeOptions(quantity, label)}
          >
            <Pill height={height} minWidth={minWidth}>
              <View style={styles.row}>
                <Ionicons name="checkmark" size={14} color={textColor} />
                <Text style={type.ui(12.5, "extrabold", textColor, { letterSpacing: 0.3 })}>
                  {compact ? quantity : STORE_CARD.added(quantity)}
                </Text>
              </View>
            </Pill>
          </PressableScale>
        </Animated.View>
      );
    }
    return (
      <Animated.View entering={FadeIn.duration(140)} style={fill}>
        <PressableScale onPress={open} style={fill} accessibilityRole="button" accessibilityLabel={STORE_CARD.a11y.chooseSize(label)}>
          <Pill height={height} minWidth={minWidth}>
            <View style={styles.row}>{addLabel}</View>
          </Pill>
        </PressableScale>
      </Animated.View>
    );
  }

  if (quantity > 0) {
    return (
      <Animated.View entering={FadeIn.duration(140)} style={fill}>
        <Pill height={height} minWidth={compact ? 84 : 96}>
          <View style={styles.stepper}>
            <Pressable
              onPress={() => {
                hapticTap();
                onRemove?.();
              }}
              hitSlop={8}
              style={[styles.stepBtn, compact && styles.stepBtnCompact]}
              accessibilityRole="button"
              accessibilityLabel={STORE_CARD.a11y.removeOne(label)}
            >
              <Ionicons name="remove" size={17} color={textColor} />
            </Pressable>
            <Text style={[type.ui(compact ? 13.5 : 14.5, "extrabold", textColor), styles.qty]}>{quantity}</Text>
            <Pressable
              onPress={() => {
                hapticTap();
                onAdd?.();
              }}
              hitSlop={8}
              style={[styles.stepBtn, compact && styles.stepBtnCompact]}
              accessibilityRole="button"
              accessibilityLabel={STORE_CARD.a11y.addOne(label)}
            >
              <Ionicons name="add" size={17} color={textColor} />
            </Pressable>
          </View>
        </Pill>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(140)} style={fill}>
      <PressableScale
        onPress={() => {
          hapticTap();
          onAdd?.();
        }}
        style={fill}
        accessibilityRole="button"
        accessibilityLabel={STORE_CARD.a11y.addToBag(label)}
      >
        <Pill height={height} minWidth={minWidth}>
          <View style={styles.row}>{addLabel}</View>
        </Pill>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  block: { alignSelf: "stretch" },
  outer: {
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 9,
    elevation: 3,
  },
  inner: { flex: 1, overflow: "hidden", alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  sheen: { position: "absolute", top: 0, left: 0, right: 0, height: "64%" },
  row: { flexDirection: "row", alignItems: "center", gap: 3 },
  stepper: { flex: 1, alignSelf: "stretch", flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: -8 },
  stepBtn: { width: 30, height: "100%", alignItems: "center", justifyContent: "center" },
  stepBtnCompact: { width: 27 },
  qty: { minWidth: 20, textAlign: "center" },
  status: {
    minWidth: 74,
    paddingHorizontal: 12,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
