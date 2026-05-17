import React, { memo, useMemo } from "react";
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import ProductImage from "../../ui/ProductImage";
import { Ionicons } from "@expo/vector-icons";
import Card from "../../ui/Card";
import SectionHeader from "../../ui/SectionHeader";
import { useTheme } from "../../../context/ThemeContext";
import { PRODUCT_SCREEN } from "../../../content/appContent";
import { fonts } from "../../../theme/tokens";

const COPY = PRODUCT_SCREEN.rich;

function RitualCard({ ritual, semanticPalette, cardWidth }) {
  const imageUri = String(ritual?.image || "").trim();
  const recipeUrl = String(ritual?.recipeUrl || "").trim();

  const openRecipe = () => {
    if (!recipeUrl) return;
    void Linking.openURL(recipeUrl);
  };

  return (
    <Card
      padding="none"
      style={{ width: cardWidth, borderWidth: StyleSheet.hairlineWidth, borderColor: semanticPalette.line }}
      contentStyle={{ padding: 0, overflow: "hidden" }}
    >
      {imageUri ? (
        <ProductImage uri={imageUri} style={{ width: "100%", height: 120 }} contentFit="cover" transition={180} lazy />
      ) : null}
      <View style={{ padding: 16, gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Ionicons name={ritual.icon || "sunny-outline"} size={22} color={semanticPalette.accent} />
          <Text style={{ flex: 1, fontFamily: fonts.medium, fontSize: 17, color: semanticPalette.ink }} numberOfLines={2}>
            {ritual.title}
          </Text>
        </View>
        {ritual.description ? (
          <Text style={{ fontFamily: fonts.regular, fontSize: 14, lineHeight: 14 * 1.55, color: semanticPalette.inkSoft }}>
            {ritual.description}
          </Text>
        ) : null}
        {recipeUrl ? (
          <Pressable onPress={openRecipe} hitSlop={8} accessibilityRole="link">
            <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: semanticPalette.accent }}>{COPY.ritualCta}</Text>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

function UsageRitualsBase({ rituals = [], gutter = 0 }) {
  const { width } = useWindowDimensions();
  const { semanticPalette } = useTheme();
  const list = (rituals || []).filter((r) => r?.title || r?.description);
  const isPhone = width < 768;
  const isDesktop = width >= 1024;
  const cardWidth = isPhone ? Math.min(280, Math.round(width * 0.72)) : isDesktop ? undefined : "47%";

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          marginHorizontal: gutter ? -gutter : 0,
          backgroundColor: "rgba(200,169,126,0.06)",
          paddingVertical: 40,
          paddingHorizontal: 24,
        },
        grid: {
          flexDirection: "row",
          flexWrap: isPhone ? "nowrap" : "wrap",
          gap: 16,
        },
        gridCell: {
          width: isPhone ? cardWidth : isDesktop ? "31.5%" : cardWidth,
          minWidth: isPhone ? cardWidth : 0,
        },
      }),
    [cardWidth, gutter, isDesktop, isPhone, semanticPalette.accentSoft]
  );

  if (!list.length) return null;

  const cards = list.map((ritual, idx) => (
    <View key={`${ritual.title}-${idx}`} style={styles.gridCell}>
      <RitualCard ritual={ritual} semanticPalette={semanticPalette} cardWidth={isPhone ? cardWidth : "100%"} />
    </View>
  ));

  return (
    <View style={styles.section}>
      <SectionHeader overline={COPY.usageOverline} title={COPY.usageTitle} subtitle={COPY.usageSubtitle || undefined} />
      {isPhone ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.grid}>
          {cards}
        </ScrollView>
      ) : (
        <View style={styles.grid}>{cards}</View>
      )}
    </View>
  );
}

const UsageRituals = memo(UsageRitualsBase);

export default UsageRituals;
