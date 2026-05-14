import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { fonts, icon, layout, lineHeight, spacing, typography } from "../../theme/tokens";
import { ALCHEMY, FONT_DISPLAY } from "../../theme/customerAlchemy";
import { HOME_TESTIMONIALS } from "../../content/appContent";
import useGsapReveal from "../../hooks/useGsapReveal";
import useReducedMotion from "../../hooks/useReducedMotion";

function StarRow({ rating = 5, color }) {
  return (
    <View style={styles.starRow}>
      {Array.from({ length: 5 }).map((_, idx) => (
        <Ionicons key={idx} name={idx < rating ? "star" : "star-outline"} size={11} color={color} />
      ))}
    </View>
  );
}

function Avatar({ item, c, isDark }) {
  const initials = String(item?.name || "?")
    .split(" ")
    .map((part) => String(part || "").trim().slice(0, 1).toUpperCase())
    .join("")
    .slice(0, 2);

  if (item?.avatar) {
    return <Image source={{ uri: item.avatar }} style={styles.avatarImg} contentFit="cover" transition={120} />;
  }

  return (
    <View
      style={[
        styles.avatar,
        {
          borderColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(100,116,139,0.24)",
          backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(248,250,252,0.92)",
        },
      ]}
    >
      <Text style={[styles.avatarInitial, { color: c.textPrimary }]}>{initials || "?"}</Text>
    </View>
  );
}

function TestimonialCard({ item, c, isDark, webGrid = false }) {
  return (
    <Pressable
      style={({ hovered, pressed }) => [
        styles.card,
        webGrid ? styles.cardGridCell : null,
        {
          borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(63,63,70,0.18)",
          backgroundColor: c.surface,
        },
        hovered && Platform.OS === "web" ? styles.cardHover : null,
        pressed ? styles.cardPressed : null,
      ]}
      accessibilityRole="article"
      accessibilityLabel={`${item.name} from ${item.city}: ${item.quote}`}
    >
      <Text style={styles.quoteGlyph}>“</Text>
      <Text style={[styles.quoteText, { color: c.textPrimary }]} numberOfLines={6}>
        {item.quote}
      </Text>
      <View style={[styles.divider, { backgroundColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(100,116,139,0.2)" }]} />
      <View style={styles.metaRow}>
        <Avatar item={item} c={c} isDark={isDark} />
        <View style={styles.metaTextWrap}>
          <Text style={[styles.name, { color: c.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.city, { color: c.textMuted }]} numberOfLines={1}>
            {item.city}
          </Text>
        </View>
        <StarRow rating={item.rating} color={isDark ? ALCHEMY.goldBright : ALCHEMY.gold} />
      </View>
    </Pressable>
  );
}

export default function HomeTestimonials({ c, isDark }) {
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const { ref: revealRef } = useGsapReveal({ preset: "fade-up", start: "top 88%", reducedMotion: reduced });
  const items = HOME_TESTIMONIALS.items || [];
  const isWebGrid = Platform.OS === "web" && width >= 1024;
  const mobileCardWidth = useMemo(() => Math.max(280, Math.min(360, width - 72)), [width]);

  return (
    <View ref={revealRef} style={styles.section}>
      <Text style={[styles.overline, { color: c.textMuted }]}>{HOME_TESTIMONIALS.overline}</Text>
      <Text style={[styles.title, { color: c.textPrimary }]}>{HOME_TESTIMONIALS.title}</Text>

      {isWebGrid ? (
        <View style={styles.grid}>
          {items.slice(0, 3).map((item) => (
            <TestimonialCard key={item.key} item={item} c={c} isDark={isDark} webGrid />
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          snapToInterval={mobileCardWidth + spacing.sm}
          decelerationRate={Platform.OS === "ios" ? "fast" : 0.97}
          disableIntervalMomentum
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mobileRow}
        >
          {items.map((item) => (
            <View key={item.key} style={{ width: mobileCardWidth }}>
              <TestimonialCard item={item} c={c} isDark={isDark} />
            </View>
          ))}
        </ScrollView>
      )}

      <Pressable
        onPress={() => navigation.navigate("Reviews")}
        style={({ pressed }) => [styles.readMoreLink, pressed ? { opacity: 0.76 } : null]}
        accessibilityRole="button"
        accessibilityLabel="Read more stories"
      >
        <Text style={[styles.readMoreText, { color: c.primary }]}>Read more stories</Text>
        <Ionicons name="chevron-forward" size={icon.xs} color={c.primary} />
      </Pressable>
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
    letterSpacing: 1.5,
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
  },
  mobileRow: {
    paddingRight: spacing.md,
    gap: spacing.sm,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    minHeight: 250,
    ...Platform.select({
      web: {
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        boxShadow: "0 2px 10px rgba(24,24,27,0.05)",
      },
      default: {},
    }),
  },
  cardGridCell: {
    flex: 1,
    minWidth: 0,
  },
  cardHover: {
    ...Platform.select({
      web: {
        transform: [{ translateY: -2 }],
        boxShadow: "0 10px 22px rgba(24,24,27,0.08)",
      },
      default: {},
    }),
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ translateY: -2 }],
  },
  quoteGlyph: {
    fontFamily: FONT_DISPLAY,
    fontSize: 40,
    lineHeight: 42,
    color: ALCHEMY.gold,
    opacity: 0.4,
    marginBottom: 8,
  },
  quoteText: {
    fontFamily: FONT_DISPLAY,
    fontSize: 16,
    lineHeight: Math.round(16 * 1.55),
    letterSpacing: 0.05,
    marginBottom: spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatarImg: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  avatarInitial: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  metaTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 18,
  },
  city: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: lineHeight.caption,
    marginTop: 1,
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
    flexShrink: 0,
  },
  readMoreLink: {
    marginTop: spacing.md,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  readMoreText: {
    fontFamily: fonts.semibold,
    fontSize: typography.bodySmall,
  },
});
