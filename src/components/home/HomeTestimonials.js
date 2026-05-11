import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { fonts, icon, layout, lineHeight, radius, spacing, typography } from "../../theme/tokens";
import { ALCHEMY, FONT_DISPLAY, HERITAGE } from "../../theme/customerAlchemy";
import { HOME_TESTIMONIALS } from "../../content/appContent";
import useReducedMotion from "../../hooks/useReducedMotion";
import useGsapReveal from "../../hooks/useGsapReveal";

function StarRow({ rating = 5, color }) {
  const stars = Array.from({ length: 5 });
  return (
    <View style={styles.starRow}>
      {stars.map((_, idx) => (
        <Ionicons
          key={idx}
          name={idx < rating ? "star" : "star-outline"}
          size={icon.xs - 1}
          color={color}
        />
      ))}
    </View>
  );
}

function Avatar({ name, isDark }) {
  const initial = String(name || "?").trim().slice(0, 1).toUpperCase();
  return (
    <View
      style={[
        styles.avatar,
        {
          backgroundColor: isDark ? "rgba(185, 28, 28, 0.14)" : ALCHEMY.goldSoft,
          borderColor: isDark ? "rgba(220, 38, 38, 0.4)" : "rgba(63, 63, 70, 0.16)",
        },
      ]}
    >
      <Text style={[styles.avatarInitial, { color: isDark ? ALCHEMY.goldBright : ALCHEMY.brown }]}>
        {initial}
      </Text>
    </View>
  );
}

export default function HomeTestimonials({ c, isDark }) {
  const reduced = useReducedMotion();
  const { width: windowWidth } = useWindowDimensions();
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const sliderRef = useRef(null);
  const [sliderWidth, setSliderWidth] = useState(0);
  const items = HOME_TESTIMONIALS.items;
  const isMultiColumn = windowWidth >= 900;
  const { ref: revealRef } = useGsapReveal({ preset: "fade-up", start: "top 88%", reducedMotion: reduced });

  const goTo = useCallback(
    (index, animated = true) => {
      const next = ((index % items.length) + items.length) % items.length;
      setActive(next);
      if (sliderWidth > 0) {
        sliderRef.current?.scrollTo({ x: next * sliderWidth, animated });
      }
    },
    [items.length, sliderWidth]
  );

  useEffect(() => {
    if (isMultiColumn) return undefined;
    if (reduced || hovered || items.length < 2) return undefined;
    const t = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % items.length;
        if (sliderWidth > 0) {
          sliderRef.current?.scrollTo({ x: next * sliderWidth, animated: true });
        }
        return next;
      });
    }, 5200);
    return () => clearInterval(t);
  }, [reduced, hovered, items.length, sliderWidth, isMultiColumn]);

  const card = (item, idx) => (
    <View
      key={item.key}
      style={[
        styles.card,
        isMultiColumn ? styles.cardGridCell : { width: sliderWidth || "100%" },
        {
          borderColor: isDark ? "rgba(220, 38, 38, 0.22)" : "rgba(63, 63, 70, 0.14)",
          backgroundColor: isDark ? c.surfaceOverlay : ALCHEMY.cardBg,
        },
      ]}
    >
      <LinearGradient
        colors={[HERITAGE.amberMid, HERITAGE.ring, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.cardSheen, styles.peNone]}
      />
      <View style={styles.cardHeader}>
        <Avatar name={item.name} isDark={isDark} />
        <View style={styles.cardHeaderText}>
          <Text style={[styles.cardName, { color: c.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.cardCity, { color: c.textMuted }]} numberOfLines={1}>
            {item.city}
          </Text>
        </View>
        <StarRow rating={item.rating} color={isDark ? HERITAGE.amberBright : HERITAGE.amberMid} />
      </View>
      <Text style={[styles.cardQuote, { color: c.textSecondary }]} numberOfLines={6}>
        &ldquo;{item.quote}&rdquo;
      </Text>
    </View>
  );

  return (
    <View
      ref={revealRef}
      style={styles.section}
      {...(Platform.OS === "web"
        ? {
            onMouseEnter: () => setHovered(true),
            onMouseLeave: () => setHovered(false),
          }
        : {})}
    >
      <Text style={[styles.overline, { color: c.textMuted }]}>
        {HOME_TESTIMONIALS.overline}
      </Text>
      <Text style={[styles.title, { color: c.textPrimary }]}>
        {HOME_TESTIMONIALS.title}
      </Text>

      {isMultiColumn ? (
        <View style={styles.grid}>{items.map((item, idx) => card(item, idx))}</View>
      ) : (
        <View
          style={styles.sliderShell}
          onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
        >
          <ScrollView
            ref={sliderRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate={Platform.OS === "ios" ? "fast" : 0.97}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => {
              const pageW = e.nativeEvent.layoutMeasurement.width || sliderWidth || 1;
              const current = Math.round(e.nativeEvent.contentOffset.x / pageW);
              setActive(Math.max(0, Math.min(current, items.length - 1)));
            }}
          >
            {items.map((item, idx) => card(item, idx))}
          </ScrollView>
          {items.length > 1 ? (
            <View style={styles.dots}>
              {items.map((_, idx) => (
                <Pressable
                  key={`tdot-${idx}`}
                  onPress={() => goTo(idx)}
                  hitSlop={10}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: idx === active }}
                  accessibilityLabel={`Go to testimonial ${idx + 1}`}
                  style={({ pressed }) => [styles.dotHit, pressed ? { opacity: 0.85 } : null]}
                >
                  <View
                    style={[
                      styles.dot,
                      idx === active
                        ? {
                            backgroundColor: isDark ? HERITAGE.amberBright : HERITAGE.amberMid,
                            transform: [{ scale: 1.2 }],
                          }
                        : {
                            backgroundColor: isDark
                              ? "rgba(255, 252, 248, 0.32)"
                              : "rgba(63, 63, 70, 0.32)",
                          },
                    ]}
                  />
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
    marginBottom: spacing.xl,
  },
  overline: {
    fontSize: typography.overline + 1,
    fontFamily: fonts.extrabold,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: Platform.OS === "web" ? typography.h2 + 2 : typography.h2,
    lineHeight: Platform.OS === "web" ? 36 : 32,
    fontFamily: FONT_DISPLAY,
    letterSpacing: -0.4,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: "row",
    gap: spacing.md,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  sliderShell: {
    width: "100%",
  },
  card: {
    position: "relative",
    overflow: "hidden",
    borderRadius: radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 2,
    borderTopColor: HERITAGE.amberMid,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg + 2,
    ...Platform.select({
      ios: {
        shadowColor: "#18181B",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.07,
        shadowRadius: 16,
      },
      android: { elevation: 2 },
      web: {
        boxShadow: "0 12px 28px rgba(24, 24, 27, 0.07), inset 0 1px 0 rgba(255,255,255,0.92)",
      },
      default: {},
    }),
  },
  cardGridCell: {
    flexBasis: 320,
    flexGrow: 1,
    maxWidth: 380,
  },
  cardSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    opacity: 0.18,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm + 2,
  },
  cardHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  cardName: {
    fontFamily: fonts.bold,
    fontSize: typography.bodySmall + 1,
    letterSpacing: 0.05,
  },
  cardCity: {
    fontFamily: fonts.medium,
    fontSize: typography.caption,
    marginTop: 2,
  },
  cardQuote: {
    fontFamily: fonts.medium,
    fontSize: typography.body - 1,
    lineHeight: lineHeight.body + 2,
    letterSpacing: 0.1,
  },
  starRow: {
    flexDirection: "row",
    gap: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  avatarInitial: {
    fontFamily: FONT_DISPLAY,
    fontSize: 18,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: spacing.md,
  },
  dotHit: {
    padding: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  peNone: {
    pointerEvents: "none",
  },
});
