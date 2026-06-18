import React from "react";
import { Platform, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { HOME_PAGE_LABELS, HOME_TRUST_STRIP } from "../../content/appContent";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { icon } from "../../theme/tokens";

/**
 * Trust row under the hero (native animation; web scroll-spy uses nativeID home-trust).
 */
export default function HomeTrustStrip({
  forwardedRef,
  styles,
  trustVisualDense,
  c,
  isDark,
  reducedMotion,
}) {
  return (
    <Animated.View
      ref={forwardedRef}
      nativeID="home-trust"
      style={styles.trustSectionWrap}
      entering={Platform.OS === "web" || reducedMotion ? undefined : FadeInDown.delay(100).duration(480)}
    >
      <Text style={[styles.trustSectionEyebrow, { color: isDark ? c.accentGold : ALCHEMY.gold }]} numberOfLines={1}>
        {HOME_PAGE_LABELS.trustOverline}
      </Text>
      <View
        style={[
          styles.trustStrip,
          isDark ? styles.trustStripDark : styles.trustStripInk,
        ]}
      >
        {!isDark ? null : (
        <LinearGradient
          colors={
            isDark
              ? ["rgba(31, 92, 71, 0.07)", "rgba(18, 16, 14, 0.35)", "rgba(8, 6, 5, 0.55)"]
              : ["rgba(255, 254, 252, 0.97)", "rgba(240, 248, 244, 0.65)", "rgba(255, 253, 249, 0.92)"]
          }
          locations={[0, 0.42, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.trustStripAmbient, styles.peNone]}
        />
        )}
        <View style={styles.trustStripInner}>
          {HOME_TRUST_STRIP.map((item, idx) => (
            <React.Fragment key={item.key}>
              {idx > 0 ? (
                <View style={[styles.trustDivider, isDark ? styles.trustDividerDark : styles.trustDividerLight]} />
              ) : null}
              <View style={styles.trustCell}>
                <View
                  style={[styles.trustIconBadge, isDark ? styles.trustIconBadgeDark : styles.trustIconBadgeLight]}
                >
                  <Ionicons
                    name={item.icon}
                    size={trustVisualDense ? icon.sm : icon.sm + 2}
                    color={isDark ? c.accentGold : KANKREG_PALETTE.goldBright}
                  />
                </View>
                <Text
                  style={[
                    styles.trustCellLabel,
                    trustVisualDense && styles.trustCellLabelDense,
                    { color: isDark ? c.textPrimary : KANKREG_PALETTE.paper },
                  ]}
                  numberOfLines={2}
                  adjustsFontSizeToFit={trustVisualDense}
                  minimumFontScale={0.85}
                >
                  {item.label}
                </Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}
