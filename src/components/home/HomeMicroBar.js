import React from "react";
import { Pressable, Text } from "react-native";
import { ArrowRight } from "lucide-react-native";
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
  reducedMotion = false,
}) {
  if (!visible) return null;

  const content = (
    <>
      <Animated.View>
        <Text style={styles.stickyBagText}>{`${totalItems} items`}</Text>
        <Text style={styles.stickyBagAmount}>{formatINRWhole(totalAmount)}</Text>
      </Animated.View>
      <Pressable
        onPress={onViewBag}
        style={({ pressed }) => [styles.stickyBagCta, pressed ? styles.stickyBagCtaPressed : null]}
        accessibilityRole="button"
        accessibilityLabel={isAuthenticated ? "View bag" : "Sign in to view bag"}
      >
        <Text style={styles.stickyBagCtaText}>View bag</Text>
        <ArrowRight size={14} color={accentColor} />
      </Pressable>
    </>
  );

  if (reducedMotion) {
    return <Animated.View style={styles.stickyBagBar}>{content}</Animated.View>;
  }

  return (
    <Animated.View entering={FadeInDown.duration(260)} exiting={FadeOutDown.duration(220)} style={styles.stickyBagBar}>
      {content}
    </Animated.View>
  );
}
