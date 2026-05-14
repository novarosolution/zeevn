import React from "react";
import { Platform, Pressable, Text, View } from "react-native";
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

  return (
    <Animated.View
      ref={forwardedRef}
      nativeID="home-trust"
      style={styles.trustSectionWrap}
      entering={Platform.OS === "web" || reducedMotion ? undefined : FadeInDown.delay(100).duration(480)}
    >
      <View style={[styles.trustStrip, isDark ? styles.trustStripDark : null]}>
        <View style={styles.trustStripInner}>
          {HOME_TRUST_STRIP.map((item, idx) => (
            <React.Fragment key={item.key}>
              {idx > 0 ? (
                <View style={[styles.trustDivider, isDark ? styles.trustDividerDark : styles.trustDividerLight]} />
              ) : null}
              <Pressable
                onPress={item.route ? () => navigation.navigate(item.route) : undefined}
                style={({ pressed }) => [styles.trustCell, pressed ? styles.trustCellPressed : null]}
                accessibilityRole={item.route ? "button" : undefined}
                accessibilityLabel={item.route ? `Open ${item.label}` : item.label}
              >
                <View style={styles.trustIconBadge}>
                  <Ionicons name={item.icon} size={22} color={c.textPrimary} />
                </View>
                <Text
                  style={[styles.trustCellLabel, { color: c.textPrimary }]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {item.label}
                </Text>
                <Text
                  style={[styles.trustCellSupport, { color: c.textMuted }]}
                  numberOfLines={3}
                >
                  {item.support}
                </Text>
              </Pressable>
            </React.Fragment>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}
