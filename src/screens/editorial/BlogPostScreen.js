import React, { useMemo } from "react";
import { Platform, Share, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/ui/Screen";
import Button from "../../components/ui/Button";
import AppFooter from "../../components/AppFooter";
import BlogPostCard from "../../components/editorial/BlogPostCard";
import { getBlogPost, getRelatedPosts } from "../../content/editorialContent";
import { useTheme } from "../../context/ThemeContext";
import useRouteMeta from "../../hooks/useRouteMeta";
import { fonts, icon } from "../../theme/tokens";

export default function BlogPostScreen({ navigation, route }) {
  const slug = route?.params?.slug;
  const post = useMemo(() => getBlogPost(slug), [slug]);
  const related = useMemo(() => getRelatedPosts(slug, 3), [slug]);

  useRouteMeta("blogPost", {
    title: post?.title,
    slug: post?.slug,
  });

  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();

  if (!post) {
    return (
      <Screen navigation={navigation} title="Journal">
        <Text style={{ fontFamily: fonts.regular, color: semanticPalette.inkMuted }}>Post not found.</Text>
      </Screen>
    );
  }

  const share = async (channel) => {
    const url = Platform.OS === "web" && typeof window !== "undefined" ? window.location.href : `https://zeevan.com/blog/${post.slug}`;
    const message = `${post.title} — Zeevan Journal`;
    try {
      if (channel === "copy") {
        if (Platform.OS === "web" && navigator?.clipboard) {
          await navigator.clipboard.writeText(url);
        }
        return;
      }
      await Share.share({ message: `${message}\n${url}`, title: post.title });
    } catch {
      /* cancelled */
    }
  };

  return (
    <Screen
      navigation={navigation}
      title={post.title}
      breadcrumbLabel="Journal"
      contentContainerStyle={{ maxWidth: 720, alignSelf: "center", width: "100%" }}
    >
      <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.small.fontSize, color: semanticPalette.inkMuted, marginBottom: SPACING.xl }}>
        {post.author} · {post.date} · {post.readingMinutes} min read
      </Text>
      <View
        style={{
          aspectRatio: 16 / 9,
          borderRadius: RADII.lg,
          overflow: "hidden",
          marginBottom: SPACING["2xl"],
          backgroundColor: semanticPalette.surfaceAlt,
        }}
      >
        <Image source={post.cover} style={StyleSheet.absoluteFill} contentFit="cover" />
      </View>
      {post.body.map((paragraph, i) => (
        <Text
          key={`p-${i}`}
          style={{
            fontFamily: fonts.regular,
            fontSize: TYPE.bodyLg.fontSize,
            lineHeight: TYPE.bodyLg.lineHeight * 1.6,
            color: semanticPalette.inkSoft,
            marginBottom: SPACING.lg,
          }}
        >
          {paragraph}
        </Text>
      ))}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginVertical: SPACING["2xl"] }}>
        <Button
          variant="ghost"
          size="sm"
          label="Share"
          iconLeft={<Ionicons name="share-outline" size={icon.sm} color={semanticPalette.ink} />}
          onPress={() => share("native")}
        />
        <Button
          variant="ghost"
          size="sm"
          label="Copy link"
          iconLeft={<Ionicons name="link-outline" size={icon.sm} color={semanticPalette.ink} />}
          onPress={() => share("copy")}
        />
      </View>

      {related.length > 0 ? (
        <View style={{ marginBottom: SPACING["2xl"] }}>
          <Text style={{ fontFamily: TYPE.serifFamily, ...TYPE.h3, color: semanticPalette.ink, marginBottom: SPACING.lg }}>
            Related stories
          </Text>
          <View style={{ gap: SPACING.lg }}>
            {related.map((item) => (
              <BlogPostCard key={item.slug} post={item} compact onPress={() => navigation.navigate("BlogPost", { slug: item.slug })} />
            ))}
          </View>
        </View>
      ) : null}
      <AppFooter webTight />
    </Screen>
  );
}
