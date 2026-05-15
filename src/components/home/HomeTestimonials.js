import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { fonts, icon, layout, spacing } from "../../theme/tokens";
import { ALCHEMY, FONT_DISPLAY } from "../../theme/customerAlchemy";
import { HOME_TESTIMONIALS } from "../../content/appContent";
import useGsapReveal from "../../hooks/useGsapReveal";
import useReducedMotion from "../../hooks/useReducedMotion";
import { homeType } from "../../styles/typography";
import { spacing as homeSpacing } from "../../styles/spacing";

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

export default function HomeTestimonials({ c, isDark, carouselBottomPadding = 24 }) {
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const { ref: revealRef } = useGsapReveal({ preset: "fade-up", start: "top 88%", reducedMotion: reduced });
  const items = HOME_TESTIMONIALS.items || [];
  const isWebGrid = Platform.OS === "web" && width >= 1024;
  const mobileCardWidth = useMemo(() => Math.max(280, Math.min(360, width - 72)), [width]);
  const titleSize = width >= 1024 ? 44 : width >= 640 ? 36 : 28;
  const titleLine = width >= 1024 ? 50 : width >= 640 ? 42 : 33;

  return (
    <View ref={revealRef} style={styles.section}>
      <View style={styles.overlineRow}>
        <View style={[styles.overlineDot, { backgroundColor: c.rating }]} />
        <Text style={[styles.overline, { color: c.textMuted }]}>{HOME_TESTIMONIALS.overline}</Text>
      </View>
      <Text style={[styles.title, { color: c.textPrimary, fontSize: titleSize, lineHeight: titleLine, letterSpacing: -(titleSize * 0.02) }]}>
        {HOME_TESTIMONIALS.title}
      </Text>

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
          contentContainerStyle={[styles.mobileRow, { paddingBottom: carouselBottomPadding }]}
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
        accessibilityLabel={HOME_TESTIMONIALS.readMoreCta}
      >
        <Text style={[styles.readMoreText, { color: c.primary }]}>{HOME_TESTIMONIALS.readMoreCta}</Text>
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
    marginBottom: Platform.OS === "web" ? 72 : 56,
  },
  overlineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: homeSpacing.xs,
    marginBottom: homeSpacing.sm,
  },
  overlineDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  overline: {
    fontSize: 11,
    fontFamily: homeType.overline.fontFamily,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 0,
  },
  title: {
    fontFamily: homeType.display.fontFamily,
    textAlign: "center",
    marginBottom: Platform.OS === "web" ? 24 : 20,
    fontWeight: "500",
  },
  grid: {
    flexDirection: "row",
    gap: homeSpacing.base,
  },
  mobileRow: {
    paddingRight: homeSpacing.base,
    gap: homeSpacing.md,
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
    marginBottom: homeSpacing.sm,
  },
  quoteText: {
    fontFamily: homeType.uiRegular.fontFamily,
    fontSize: 16,
    lineHeight: Math.round(16 * 1.5),
    letterSpacing: 0,
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
    fontFamily: homeType.uiMedium.fontFamily,
    fontSize: 14,
    lineHeight: 18,
  },
  city: {
    fontFamily: homeType.uiRegular.fontFamily,
    fontSize: 12,
    lineHeight: 17,
    marginTop: homeSpacing.xs,
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: homeSpacing.xs,
    flexShrink: 0,
  },
  readMoreLink: {
    marginTop: homeSpacing.base,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: homeSpacing.xs,
  },
  readMoreText: {
    fontFamily: homeType.uiSemibold.fontFamily,
    fontSize: 13,
    lineHeight: Math.round(13 * 1.4),
  },
});
