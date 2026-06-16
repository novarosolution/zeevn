import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { FIGMA, figmaCardShell, figmaTextPrimary } from "../../theme/figmaApp";
import { useTheme } from "../../context/ThemeContext";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { fonts, spacing } from "../../theme/tokens";
import { platformShadow } from "../../theme/shadowPlatform";

import { buildNativeCategoryTiles } from "../../utils/homeCategories";

const tileShadow = platformShadow({
  ios: {
    shadowColor: "#3D2A12",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  android: { elevation: 3 },
});

const stripShadow = platformShadow({
  ios: {
    shadowColor: "#3D2A12",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  android: { elevation: 1 },
});

export default function NativeCategoryRow({ categories, products, onPress }) {
  const { isDark, colors: c } = useTheme();
  const { isMobileWeb, pageGutterClamp } = useKankregLayout();
  const stripGutter = isMobileWeb ? pageGutterClamp : FIGMA.gutter;
  const safeProducts = Array.isArray(products) ? products : [];
  const tiles = useMemo(() => {
    if (Array.isArray(categories) && categories.length) return categories;
    return buildNativeCategoryTiles(safeProducts, { max: 6 });
  }, [categories, safeProducts]);

  if (Platform.OS === "web" && !isMobileWeb) return null;

  return (
    <View
      style={[
        styles.strip,
        { marginHorizontal: stripGutter },
        figmaCardShell(isDark),
        stripShadow,
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {tiles.map((cat) => {
          const tileColors = isDark && cat.colorsDark ? cat.colorsDark : cat.colors;
          return (
            <Pressable
              key={cat.key}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              onPress={() => onPress?.(cat.label)}
            >
              <View
                style={[
                  styles.tile,
                  tileShadow,
                  isDark && { borderColor: c.primaryBorder, backgroundColor: c.surface },
                ]}
              >
                <LinearGradient
                  colors={tileColors}
                  start={{ x: 0.32, y: 0.18 }}
                  end={{ x: 0.72, y: 0.88 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View
                  style={[
                    styles.iconRing,
                    {
                      borderColor: `${cat.accent}${isDark ? "55" : "33"}`,
                      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,253,248,0.55)",
                    },
                  ]}
                >
                  <Ionicons
                    name={cat.icon}
                    size={26}
                    color={isDark ? (cat.accent || "#C4D088") : (cat.accent || "#5C6834")}
                  />
                </View>
              </View>
              <Text style={[styles.label, figmaTextPrimary(isDark)]}>{cat.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    borderRadius: 18,
    paddingVertical: 14,
    marginBottom: spacing.xs,
  },
  content: {
    paddingHorizontal: 14,
    gap: 12,
  },
  item: {
    width: 80,
    alignItems: "center",
  },
  itemPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  tile: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FIGMA.line,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: FIGMA.card,
  },
  tileDark: {
    borderColor: "rgba(168, 184, 108, 0.18)",
    backgroundColor: "#181513",
  },
  iconRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    marginTop: 8,
    fontFamily: fonts.semibold,
    fontSize: 10,
    textAlign: "center",
    letterSpacing: 0.1,
  },
});
