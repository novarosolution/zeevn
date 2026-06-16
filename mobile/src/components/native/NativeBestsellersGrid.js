import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { FIGMA } from "../../theme/figmaApp";
import { spacing } from "../../theme/tokens";
import { platformShadow } from "../../theme/shadowPlatform";
import NativeProductCard from "./NativeProductCard";
import { getProductCardFlags } from "../../utils/productAvailability";
import { SHOP_SCREEN_UI } from "../../content/appContent";

const gridShadow = platformShadow({
  ios: {
    shadowColor: "#3D2A12",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
  },
  android: { elevation: 2 },
});

const gridShadowDark = platformShadow({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
  },
  android: { elevation: 4 },
});

/** Premium 2-up product grid for home bestsellers */
export default function NativeBestsellersGrid({ products, onProductPress, onAddToCart }) {
  const { isDark } = useTheme();
  const items = Array.isArray(products) ? products : [];
  if (Platform.OS === "web" || !items.length) return null;

  return (
    <View
      style={[
        styles.shell,
        isDark ? gridShadowDark : gridShadow,
        isDark
          ? {
              backgroundColor: "rgba(255,255,255,0.03)",
              borderColor: "rgba(52, 211, 153, 0.2)",
            }
          : {
              borderColor: FIGMA.line,
            },
      ]}
    >
      {!isDark ? (
        <LinearGradient
          colors={["rgba(255,253,248,0.98)", FIGMA.card]}
          style={StyleSheet.absoluteFillObject}
        />
      ) : (
        <LinearGradient
          colors={["rgba(52, 211, 153, 0.08)", "rgba(255,255,255,0.02)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      <View style={styles.grid}>
        {items.map((item, idx) => {
          const flags = getProductCardFlags(item, SHOP_SCREEN_UI.card.comingSoonNoteFallback);
          return (
          <View key={item.id} style={styles.cell}>
            <NativeProductCard
              product={item}
              index={idx}
              category={item.category || item.homeSection}
              isOutOfStock={flags.isOutOfStock}
              isComingSoon={flags.isComingSoon}
              comingSoonNote={flags.comingSoonNote}
              isFeatured={idx === 0}
              onPress={() => onProductPress?.(item)}
              onAddToCart={() => onAddToCart?.(item)}
            />
          </View>
        );})}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    marginHorizontal: FIGMA.gutter,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    padding: 11,
    paddingTop: 13,
    marginBottom: spacing.xs,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 11,
  },
  cell: {
    width: "47.8%",
    minWidth: 0,
  },
});
