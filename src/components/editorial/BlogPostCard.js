import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import Card from "../ui/Card";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";

export default function BlogPostCard({ post, onPress, compact = false }) {
  const { semanticPalette, TYPE, SPACING } = useTheme();

  return (
    <Card onPress={onPress} padding="none" style={{ flex: 1, minWidth: compact ? 0 : 220 }}>
      <View style={{ aspectRatio: 16 / 10, backgroundColor: semanticPalette.surfaceAlt }}>
        {post.cover ? <Image source={post.cover} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} /> : null}
      </View>
      <View style={{ padding: SPACING.md, gap: SPACING.sm }}>
        <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.caption.fontSize, color: semanticPalette.inkMuted }}>
          {post.date} · {post.readingMinutes} min read
        </Text>
        <Text
          numberOfLines={compact ? 2 : 3}
          style={{ fontFamily: TYPE.serifFamily, ...TYPE.h4, color: semanticPalette.ink }}
        >
          {post.title}
        </Text>
        {!compact ? (
          <Text numberOfLines={2} style={{ fontFamily: fonts.regular, fontSize: TYPE.small.fontSize, color: semanticPalette.inkSoft }}>
            {post.excerpt}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
