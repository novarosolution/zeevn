import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Screen from "../../components/ui/Screen";
import AppFooter from "../../components/AppFooter";
import BlogPostCard from "../../components/editorial/BlogPostCard";
import { BLOG_POSTS } from "../../content/editorialContent";
import { useTheme } from "../../context/ThemeContext";
import useRouteMeta from "../../hooks/useRouteMeta";
import { fonts } from "../../theme/tokens";

export default function BlogIndexScreen({ navigation }) {
  useRouteMeta("blog");
  const { width } = useWindowDimensions();
  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();

  const featured = useMemo(() => BLOG_POSTS.find((p) => p.featured) || BLOG_POSTS[0], []);
  const rest = useMemo(() => BLOG_POSTS.filter((p) => p.slug !== featured?.slug), [featured?.slug]);

  const cols = width >= 1100 ? 3 : width >= 640 ? 2 : 1;

  return (
    <Screen navigation={navigation} breadcrumbLabel="Journal">
      {featured ? (
        <Pressable
          onPress={() => navigation.navigate("BlogPost", { slug: featured.slug })}
          style={({ pressed }) => [{ marginBottom: SPACING["2xl"], opacity: pressed ? 0.94 : 1 }]}
          accessibilityRole="button"
        >
          <View style={{ borderRadius: RADII.lg, overflow: "hidden", minHeight: 280 }}>
            <Image source={featured.cover} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient
              colors={["transparent", "rgba(14,23,41,0.85)"]}
              style={[StyleSheet.absoluteFill, { justifyContent: "flex-end", padding: SPACING.xl }]}
            >
              <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.caption.fontSize, color: semanticPalette.inkInverseMuted }}>
                Featured · {featured.readingMinutes} min
              </Text>
              <Text style={{ fontFamily: TYPE.serifFamily, ...TYPE.h2, color: semanticPalette.inkInverse, marginTop: SPACING.sm }}>
                {featured.title}
              </Text>
              <Text
                numberOfLines={2}
                style={{
                  fontFamily: fonts.regular,
                  fontSize: TYPE.body.fontSize,
                  color: semanticPalette.inkInverseSoft,
                  marginTop: SPACING.sm,
                }}
              >
                {featured.excerpt}
              </Text>
            </LinearGradient>
          </View>
        </Pressable>
      ) : null}

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: SPACING.lg,
          marginBottom: SPACING["2xl"],
        }}
      >
        {rest.map((post) => (
          <View
            key={post.slug}
            style={{
              width: cols === 1 ? "100%" : cols === 2 ? "48%" : "31%",
              flexGrow: 1,
              minWidth: Platform.OS === "web" ? 200 : 160,
            }}
          >
            <BlogPostCard post={post} onPress={() => navigation.navigate("BlogPost", { slug: post.slug })} />
          </View>
        ))}
      </View>
      <AppFooter webTight />
    </Screen>
  );
}
