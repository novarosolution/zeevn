import React, { useMemo } from "react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SectionHeader, ScrollFadeUp } from "./editorial";
import GoldHairline from "../ui/GoldHairline";
import { resolveCommunityDisplay } from "../../utils/homeViewMedia";
import { FONT_HEADING, FONT_BODY, FONT_BODY_SEMIBOLD } from "../../theme/typographyRoles";
import {
  GOLD_HAIRLINE_EDITORIAL,
  HOME_SPACE,
  HOME_TYPE,
  homeEditorialInk,
  homeEditorialMuted,
} from "../../theme/homeEditorial";
import { KANKREG_CHROME, KANKREG_PALETTE } from "../../theme/kankregWeb";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { useTheme } from "../../context/ThemeContext";
import { fonts, icon, radius } from "../../theme/tokens";
import { PRODUCT_HERO_BLURHASH } from "../../utils/image";
import { resolveImageSource } from "../../utils/mediaSource";
import ProgressiveImage from "../ui/ProgressiveImage";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";
import { getHomePhoneBleed } from "../../utils/homeSectionBleed";

const POST_CARD_WIDTH = 252;
const POST_MEDIA_ASPECT = 4 / 5;
const POST_GAP = 18;
const COMMUNITY_CARD_CLASS = "kankreg-community-post-card";

if (Platform.OS === "web") {
  injectWebCssOnce(
    "kankreg-community-premium",
    `.${COMMUNITY_CARD_CLASS} {
  transition: transform 0.28s cubic-bezier(0.2, 0.7, 0.3, 1), box-shadow 0.28s ease;
}
.${COMMUNITY_CARD_CLASS}:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(60, 45, 20, 0.07), 0 26px 52px -14px rgba(80, 60, 25, 0.22) !important;
}
@media (prefers-reduced-motion: reduce) {
  .${COMMUNITY_CARD_CLASS}:hover { transform: none !important; }
}`
  );
}

function CommunityTag({ label, variant, isDark }) {
  const isCustomer = variant === "customer";
  return (
    <View
      style={[
        styles.tag,
        isCustomer && styles.tagCustomer,
        isDark && !isCustomer && styles.tagDark,
      ]}
    >
      <View style={[styles.tagDot, isCustomer && styles.tagDotCustomer]} />
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

function CommunityPostCard({ post, isDark, index, cardWidth, phone = false }) {
  const ink = homeEditorialInk(isDark);
  const muted = homeEditorialMuted(isDark);
  const isReel = post.type === "reel" || post.type === "recipe";
  const isCustomer = post.type === "customer";
  const imageSource = resolveImageSource(post.image);

  return (
    <ScrollFadeUp index={index} delay={index * 60} preset="fade-up">
      <View
        className={Platform.OS === "web" ? COMMUNITY_CARD_CLASS : undefined}
        style={[
          styles.post,
          { width: cardWidth },
          phone && styles.postPhone,
          isDark && styles.postDark,
        ]}
      >
        <LinearGradient
          colors={
            isDark
              ? ["rgba(42, 117, 89, 0.16)", "transparent"]
              : ["rgba(42, 117, 89, 0.24)", "transparent"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.postTopAccent}
          pointerEvents="none"
        />
        <View style={[styles.media, isDark && styles.mediaDark]}>
          {imageSource ? (
            Platform.OS === "web" ? (
              <ProgressiveImage
                source={post.image}
                alt={post.author?.subtitle || post.tag || "Community post"}
                style={styles.mediaImage}
                contentFit="cover"
                contentPosition="top center"
                priority="low"
                width={504}
                recyclingKey={post.id || post.key}
                rounded={0}
              />
            ) : (
              <Image
                source={imageSource}
                style={styles.mediaImage}
                contentFit="cover"
                contentPosition="top center"
                transition={300}
                placeholder={{ blurhash: PRODUCT_HERO_BLURHASH }}
                cachePolicy="memory-disk"
                recyclingKey={post.id || post.key}
              />
            )
          ) : (
            <View style={[styles.mediaImage, styles.mediaFallback]} />
          )}
          <LinearGradient
            colors={[
              "rgba(8, 6, 4, 0.12)",
              "transparent",
              "transparent",
              "rgba(8, 6, 4, 0.62)",
            ]}
            locations={[0, 0.35, 0.58, 1]}
            style={styles.mediaScrim}
            pointerEvents="none"
          />
          <CommunityTag label={post.tag} variant={post.type} isDark={isDark} />
          {isReel ? (
            <>
              <View style={styles.playBtn} pointerEvents="none">
                <Ionicons name="play" size={18} color={KANKREG_PALETTE.ink} style={styles.playIcon} />
              </View>
              {post.views ? (
                <View style={styles.views} pointerEvents="none">
                  <Ionicons name="eye-outline" size={12} color="#F8EFDC" />
                  <Text style={styles.viewsText}>{post.views}</Text>
                </View>
              ) : null}
            </>
          ) : null}
          {isCustomer && post.quote ? (
            <View style={styles.quoteWrap} pointerEvents="none">
              <Text style={styles.quoteMark}>{"\u201C"}</Text>
              <Text style={styles.quote} numberOfLines={4}>
                {post.quote}
              </Text>
            </View>
          ) : null}
          <View style={styles.mediaGoldRule} pointerEvents="none" />
        </View>
        <View style={[styles.pfoot, isDark && styles.pfootDark]}>
          <LinearGradient
            colors={
              post.author.brand ? ["#DCAC74", "#244424"] : ["#849448", "#244424"]
            }
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{post.author.avatar}</Text>
          </LinearGradient>
          <View style={styles.pfootCopy}>
            <Text style={[styles.pfootName, { color: ink }]} numberOfLines={1}>
              {post.author.name}
            </Text>
            <Text style={[styles.pfootSub, { color: muted }]} numberOfLines={1}>
              {post.author.subtitle}
            </Text>
          </View>
          {post.likes ? (
            <View style={styles.likeRow}>
              <Ionicons name="heart" size={13} color={KANKREG_PALETTE.gold} />
              <Text style={[styles.likeText, { color: muted }]}>{post.likes}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </ScrollFadeUp>
  );
}

/**
 * Instagram-style community rail — reels + customer stories.
 * Copy and posts in `communityHomeContent.js` (admin: Home View → Community).
 */
export default function HomeCommunitySection({ communitySection }) {
  const { isDark } = useTheme();
  const { width, isLg, isMobileWeb, pageGutterClamp } = useKankregLayout();
  const content = resolveCommunityDisplay(communitySection);
  const phoneLayout = width < 720;
  const bleed = getHomePhoneBleed({ isMobileWeb, pageGutterClamp });

  const postCardWidth = useMemo(() => {
    if (phoneLayout) return Math.round(width * 0.86);
    return POST_CARD_WIDTH;
  }, [phoneLayout, width]);

  const postGap = phoneLayout ? 12 : POST_GAP;

  if (Platform.OS !== "web" || !content) return null;

  const { eyebrow, title, subtitle, instagram, posts } = content;

  const openInstagram = () => {
    const url = instagram.url || `https://instagram.com/${instagram.handle}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <ScrollFadeUp index={2}>
      <View
        nativeID="home-community"
        style={[
          styles.section,
          phoneLayout && styles.sectionPhone,
          bleed.outer,
          isDark && styles.sectionDark,
        ]}
      >
        <LinearGradient
          colors={
            isDark
              ? ["rgba(42, 117, 89, 0.05)", "transparent", "rgba(60, 98, 72, 0.04)"]
              : ["rgba(42, 117, 89, 0.09)", "transparent", "rgba(60, 98, 72, 0.04)"]
          }
          locations={[0, 0.5, 1]}
          style={styles.sectionWash}
          pointerEvents="none"
        />

        <View style={[styles.head, bleed.inner, isLg && styles.headDesktop]}>
          <View style={styles.headCopy}>
            <SectionHeader
              eyebrow={eyebrow}
              title={title}
              kicker={subtitle}
              align={isLg ? "left" : phoneLayout ? "left" : "center"}
              flush
            />
          </View>
          <View
            style={[
              styles.instagramCard,
              phoneLayout && styles.instagramCardPhone,
              isDark && styles.instagramCardDark,
            ]}
          >
            <View style={styles.instagramIconWrap}>
              <Ionicons name="logo-instagram" size={icon.md} color={KANKREG_PALETTE.gold} />
            </View>
            <View style={styles.instagramCopy}>
              <Text style={[styles.handleName, { color: homeEditorialInk(isDark) }]}>
                {instagram.displayHandle}
              </Text>
              <Text style={[styles.handleFollowers, { color: homeEditorialMuted(isDark) }]}>
                {instagram.followersLabel}
              </Text>
            </View>
            <Pressable
              onPress={openInstagram}
              accessibilityRole="link"
              accessibilityLabel={`Follow ${instagram.displayHandle} on Instagram`}
              style={({ hovered, pressed }) => [
                styles.followBtn,
                hovered && Platform.OS === "web" ? styles.followBtnHover : null,
                pressed && styles.followBtnPressed,
              ]}
            >
              <Text style={styles.followLabel}>{instagram.followLabel}</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.railMeta, bleed.inner]}>
          <GoldHairline
            {...GOLD_HAIRLINE_EDITORIAL.subtle}
            marginVertical={0}
            style={{ flex: 1, opacity: 0.5 }}
          />
          <Text style={[styles.railMetaText, { color: homeEditorialMuted(isDark) }]}>
            {posts.length} {posts.length === 1 ? "story" : "stories"}
          </Text>
          <GoldHairline
            {...GOLD_HAIRLINE_EDITORIAL.subtle}
            marginVertical={0}
            style={{ flex: 1, opacity: 0.5 }}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate={Platform.OS === "ios" ? "fast" : 0.98}
          snapToInterval={postCardWidth + postGap}
          snapToAlignment="start"
          disableIntervalMomentum
          contentContainerStyle={[styles.rowContent, bleed.railPad]}
          style={[styles.row, phoneLayout && styles.rowPhone]}
        >
          {posts.map((post, idx) => (
            <View
              key={post.id}
              style={[
                styles.postWrap,
                { width: postCardWidth, marginRight: postGap },
                idx === posts.length - 1 && styles.postWrapLast,
              ]}
            >
              <CommunityPostCard
                post={post}
                isDark={isDark}
                index={idx}
                cardWidth={postCardWidth}
                phone={phoneLayout}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollFadeUp>
  );
}

const postShadow = Platform.select({
  web: {
    boxShadow:
      "0 2px 4px rgba(60, 45, 20, 0.04), 0 16px 40px -16px rgba(80, 60, 25, 0.14)",
  },
  ios: {
    shadowColor: "#19140f",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  android: { elevation: 4 },
  default: {},
});

const styles = StyleSheet.create({
  section: {
    width: "100%",
    paddingVertical: HOME_SPACE.xl + 4,
    paddingHorizontal: HOME_SPACE.lg + 4,
    borderRadius: radius.xl + 4,
    backgroundColor: KANKREG_CHROME.cream,
    borderWidth: 1,
    borderColor: "rgba(31, 92, 71, 0.18)",
    borderTopWidth: 3,
    borderTopColor: "rgba(31, 92, 71, 0.78)",
    overflow: "hidden",
    position: "relative",
    ...Platform.select({
      web: {
        boxShadow:
          "inset 0 1px 0 rgba(255, 255, 255, 0.92), 0 28px 64px -36px rgba(80, 60, 25, 0.14)",
      },
      default: {},
    }),
  },
  sectionPhone: {
    paddingHorizontal: HOME_SPACE.md,
    paddingVertical: HOME_SPACE.lg + 6,
    borderRadius: radius.xl + 6,
  },
  sectionDark: {
    backgroundColor: "rgba(24, 21, 19, 0.68)",
    borderColor: "rgba(42, 117, 89, 0.14)",
    borderTopColor: "rgba(42, 117, 89, 0.5)",
  },
  sectionWash: {
    ...StyleSheet.absoluteFillObject,
  },
  head: {
    gap: HOME_SPACE.lg,
    marginBottom: HOME_SPACE.md,
    zIndex: 1,
  },
  headDesktop: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  headCopy: {
    flex: 1,
    minWidth: 0,
  },
  instagramCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: HOME_SPACE.sm + 2,
    paddingVertical: HOME_SPACE.sm + 2,
    paddingHorizontal: HOME_SPACE.md,
    borderRadius: radius.lg + 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(31, 92, 71, 0.24)",
    backgroundColor: "rgba(255, 253, 248, 0.78)",
    flexShrink: 0,
    ...Platform.select({
      web: { backdropFilter: "blur(8px)" },
      default: {},
    }),
  },
  instagramCardPhone: {
    width: "100%",
    alignSelf: "stretch",
  },
  instagramCardDark: {
    backgroundColor: "rgba(24, 21, 19, 0.55)",
    borderColor: "rgba(42, 117, 89, 0.2)",
  },
  instagramIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31, 92, 71, 0.1)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(31, 92, 71, 0.2)",
  },
  instagramCopy: {
    gap: 2,
    minWidth: 0,
    flex: 1,
  },
  handleName: {
    fontFamily: FONT_BODY_SEMIBOLD,
    fontSize: HOME_TYPE.kicker,
    lineHeight: HOME_TYPE.body.lineHeight,
    letterSpacing: -0.15,
  },
  handleFollowers: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  followBtn: {
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: KANKREG_CHROME.buttonAccent,
    ...Platform.select({
      web: {
        cursor: "pointer",
        transition: "transform 0.2s ease, opacity 0.2s ease",
        boxShadow: "0 8px 20px -10px rgba(166, 124, 55, 0.55)",
      },
      default: {},
    }),
  },
  followBtnHover: {
    ...Platform.select({
      web: { transform: [{ translateY: -1 }] },
      default: {},
    }),
  },
  followBtnPressed: {
    opacity: 0.9,
  },
  followLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: KANKREG_CHROME.onAccent,
    letterSpacing: 0.2,
  },
  railMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: HOME_SPACE.md,
    marginBottom: HOME_SPACE.md + 2,
    zIndex: 1,
  },
  railMetaText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    flexShrink: 0,
  },
  row: {
    width: "100%",
    zIndex: 1,
  },
  rowPhone: {
    marginHorizontal: 0,
  },
  rowContent: {
    paddingBottom: HOME_SPACE.md,
    paddingTop: HOME_SPACE.xs,
  },
  postWrap: {},
  postWrapLast: {
    marginRight: 16,
  },
  post: {
    borderRadius: radius.lg + 6,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(31, 92, 71, 0.16)",
    backgroundColor: KANKREG_PALETTE.card,
    ...postShadow,
  },
  postPhone: {
    borderRadius: radius.xl + 4,
    borderWidth: 1,
    borderColor: "rgba(31, 92, 71, 0.22)",
    ...Platform.select({
      web: {
        boxShadow:
          "inset 0 1px 0 rgba(255, 253, 248, 0.9), 0 8px 28px -10px rgba(80, 60, 25, 0.2)",
      },
      default: {},
    }),
  },
  postDark: {
    backgroundColor: "#181513",
    borderColor: "#3f3933",
  },
  postTopAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    zIndex: 4,
  },
  media: {
    width: "100%",
    aspectRatio: POST_MEDIA_ASPECT,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#1a1410",
  },
  mediaDark: {
    backgroundColor: "#0e0c0a",
  },
  mediaImage: {
    ...StyleSheet.absoluteFillObject,
  },
  mediaFallback: {
    backgroundColor: KANKREG_PALETTE.paper2,
  },
  mediaScrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  mediaGoldRule: {
    position: "absolute",
    left: HOME_SPACE.md,
    right: HOME_SPACE.md,
    bottom: 0,
    height: 1,
    backgroundColor: "rgba(42, 117, 89, 0.4)",
    zIndex: 2,
  },
  tag: {
    position: "absolute",
    top: HOME_SPACE.sm + 2,
    left: HOME_SPACE.sm + 2,
    zIndex: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: "rgba(27, 48, 34, 0.82)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(42, 117, 89, 0.28)",
    ...Platform.select({
      web: { backdropFilter: "blur(8px)" },
      default: {},
    }),
  },
  tagCustomer: {
    backgroundColor: "rgba(35, 90, 64, 0.72)",
  },
  tagDark: {
    backgroundColor: "rgba(18, 12, 6, 0.7)",
  },
  tagDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: KANKREG_PALETTE.goldBright,
  },
  tagDotCustomer: {
    backgroundColor: "#9ee0b8",
  },
  tagText: {
    fontFamily: fonts.semibold,
    fontSize: 9.5,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: "rgba(255, 249, 236, 0.92)",
  },
  playBtn: {
    position: "absolute",
    top: "50%",
    left: "50%",
    zIndex: 3,
    width: 48,
    height: 48,
    marginTop: -24,
    marginLeft: -24,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 253, 248, 0.94)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(31, 92, 71, 0.2)",
    ...Platform.select({
      web: { boxShadow: "0 10px 28px rgba(0, 0, 0, 0.28)" },
      default: {},
    }),
  },
  playIcon: {
    marginLeft: 2,
  },
  views: {
    position: "absolute",
    right: HOME_SPACE.sm + 2,
    bottom: HOME_SPACE.sm + 2,
    zIndex: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: "rgba(8, 6, 4, 0.45)",
  },
  viewsText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: "#F8EFDC",
  },
  quoteWrap: {
    position: "absolute",
    left: HOME_SPACE.md,
    right: HOME_SPACE.md,
    bottom: HOME_SPACE.md,
    zIndex: 3,
    gap: 2,
  },
  quoteMark: {
    fontFamily: FONT_HEADING,
    fontSize: 28,
    lineHeight: 24,
    color: "rgba(42, 117, 89, 0.75)",
  },
  quote: {
    fontFamily: FONT_BODY,
    fontSize: 14,
    lineHeight: 19,
    fontStyle: "italic",
    color: "#FBF4E4",
    ...Platform.select({
      web: { textShadow: "0 2px 10px rgba(0, 0, 0, 0.45)" },
      default: {},
    }),
  },
  pfoot: {
    flexDirection: "row",
    alignItems: "center",
    gap: HOME_SPACE.sm,
    paddingVertical: HOME_SPACE.sm + 4,
    paddingHorizontal: HOME_SPACE.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KANKREG_PALETTE.lineSoft,
    backgroundColor: KANKREG_PALETTE.card,
  },
  pfootDark: {
    backgroundColor: "#181513",
    borderTopColor: "#3f3933",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: FONT_BODY_SEMIBOLD,
    fontSize: 12,
    color: "#FFF9EC",
  },
  pfootCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  pfootName: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    lineHeight: 15,
  },
  pfootSub: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    lineHeight: 13,
  },
  likeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  likeText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
});
