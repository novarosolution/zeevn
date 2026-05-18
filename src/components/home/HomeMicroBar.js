import React from "react";
import { Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { formatINRWhole } from "../../utils/currency";

/**
 * Sticky “view bag” bar shown after scrolling past the hero when the cart has items.
 */
export default function HomeMicroBar({
  visible,
  totalItems,
  totalAmount,
  styles,
  accentColor,
  isAuthenticated,
  onViewBag,
}) {
  if (!visible) return null;

  return (
    <Animated.View entering={FadeInDown.duration(260)} exiting={FadeOutDown.duration(220)} style={styles.stickyBagBar}>
      <Text style={styles.stickyBagText}>{`${totalItems} items · ${formatINRWhole(totalAmount)}`}</Text>
      <Pressable
        onPress={onViewBag}
        style={({ pressed }) => [styles.stickyBagCta, pressed ? styles.stickyBagCtaPressed : null]}
        accessibilityRole="button"
        accessibilityLabel={isAuthenticated ? "View bag" : "Sign in to view bag"}
      >
        <Text style={styles.stickyBagCtaText}>View Bag</Text>
        <Ionicons name="arrow-forward" size={14} color={accentColor} />
      </Pressable>
    </Animated.View>
  );
}
