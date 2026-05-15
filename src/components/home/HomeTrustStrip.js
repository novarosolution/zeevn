import React from "react";
import { Platform, Pressable, Text, useWindowDimensions, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { HOME_TRUST_STRIP } from "../../content/appContent";

/**
 * Trust row under the hero (native animation; web scroll-spy uses nativeID home-trust).
 */
export default function HomeTrustStrip({
  forwardedRef,
  styles,
  c,
  isDark,
  reducedMotion,
}) {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isStacked = width < 360;

  return (
    <Animated.View
      ref={forwardedRef}
      nativeID="home-trust"
      style={styles.trustSectionWrap}
      entering={Platform.OS === "web" || reducedMotion ? undefined : FadeInDown.delay(100).duration(480)}
    >
      <View style={[styles.trustStrip, isDark ? styles.trustStripDark : null]}>
        <View style={[styles.trustStripInner, isStacked ? styles.trustStripInnerStacked : null]}>
          {HOME_TRUST_STRIP.map((item, idx) => (
            <React.Fragment key={item.key}>
              {idx > 0 ? (
                <View
                  style={[
                    styles.trustDivider,
                    isStacked ? styles.trustDividerStacked : null,
                    isDark ? styles.trustDividerDark : styles.trustDividerLight,
                  ]}
                />
              ) : null}
              <Pressable
                onPress={item.route ? () => navigation.navigate(item.route) : undefined}
                style={({ pressed }) => [
                  styles.trustCell,
                  isStacked ? styles.trustCellStacked : null,
                  pressed ? styles.trustCellPressed : null,
                ]}
                accessibilityRole={item.route ? "button" : undefined}
                accessibilityLabel={`${item.label}. ${item.supporting || item.support || ""}`.trim()}
              >
                <View style={styles.trustIconBadge}>
                  <Ionicons name={item.icon} size={22} color={c.textSecondary} />
                </View>
                <Text
                  style={[styles.trustCellLabel, { color: c.textPrimary }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  allowFontScaling={false}
                >
                  {item.label}
                </Text>
                <Text
                  style={[styles.trustCellSupport, { color: c.textMuted }]}
                  numberOfLines={2}
                  allowFontScaling={false}
                >
                  {item.supporting || item.support}
                </Text>
              </Pressable>
            </React.Fragment>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}
