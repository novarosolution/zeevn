import React, { useCallback, useMemo, useRef } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "../../context/ThemeContext";
import HomeSectionHeader from "./HomeSectionHeader";
import { spacing } from "../../theme/tokens";
import { homeType } from "../../styles/typography";
import { spacing as homeSpacing } from "../../styles/spacing";

function MilkBottleIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 3h4m-3 0v3.2l-1.6 1.8A4 4 0 0 0 8.4 10v7.2A2.8 2.8 0 0 0 11.2 20h1.6a2.8 2.8 0 0 0 2.8-2.8V10c0-.76-.28-1.5-.8-2.04L13.2 6.2V3"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function getCategoryIcon(item, color) {
  const key = String(item?.key || "").toLowerCase();
  switch (key) {
    case "staples":
      return <Ionicons name="basket-outline" size={22} color={color} />;
    case "oils":
      return <Ionicons name="water-outline" size={22} color={color} />;
    case "spices":
      return <Ionicons name="flame-outline" size={22} color={color} />;
    case "dairy":
      return <MilkBottleIcon color={color} />;
    case "sweets":
      return <Ionicons name="ice-cream-outline" size={22} color={color} />;
    case "dryfruits":
      return <Ionicons name="nutrition-outline" size={22} color={color} />;
    case "beverages":
    case "drinks":
      return <Ionicons name="wine-outline" size={22} color={color} />;
    case "wellness":
      return <Ionicons name="leaf-outline" size={22} color={color} />;
    default:
      return <Ionicons name={item?.icon || "ellipse-outline"} size={22} color={color} />;
  }
}

function CategoryTile({ item, compact, onPress, columns, isDesktop }) {
  const { colors: c, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(c, isDark, compact, columns, isDesktop),
    [c, isDark, compact, columns, isDesktop]
  );
  const scale = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  const animateTo = useCallback(
    (nextScale, nextBg) => {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: nextScale,
          duration: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bgAnim, {
          toValue: nextBg,
          duration: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    },
    [bgAnim, scale]
  );

  const tileBg = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [c.surface, c.surfaceAlt || (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)")],
  });
  const circleBg = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(200,169,126,0.12)", "rgba(200,169,126,0.17)"],
  });

  const handlePress = useCallback(async () => {
    if (Platform.OS === "ios") {
      try {
        await Haptics.selectionAsync();
      } catch {
        // no-op fallback if haptics are unavailable
      }
    }
    onPress?.(item);
  }, [item, onPress]);

  return (
    <View style={styles.tileCell}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={handlePress}
          onPressIn={() => animateTo(0.97, 1)}
          onPressOut={() => animateTo(1, 0)}
          style={({ hovered }) => [hovered && Platform.OS === "web" ? styles.tileHovered : null]}
          accessibilityRole="button"
          accessibilityLabel={`Browse ${item.label}`}
        >
          {({ pressed, hovered }) => (
            <Animated.View
              style={[
                styles.tile,
                hovered && Platform.OS === "web" ? styles.tileHovered : null,
                pressed ? styles.tilePressed : null,
                { backgroundColor: tileBg },
              ]}
            >
              <Animated.View style={[styles.iconCircle, { backgroundColor: circleBg }]}>
                {getCategoryIcon(item, c.ink || c.textPrimary)}
              </Animated.View>
              <Text style={styles.label} numberOfLines={2}>
                {item.label}
              </Text>
            </Animated.View>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function HomeCategoryGrid({
  categories = [],
  overline = "",
  title = "Shop by category",
  viewAllLabel = "View all",
  onPressCategory,
  onPressViewAll,
}) {
  const { width } = useWindowDimensions();
  const compact = width < 420;
  const isTablet = width >= 600;
  const isDesktop = width >= 1024;
  const columns = isDesktop ? 8 : 4;
  const { colors: c, isDark } = useTheme();
  const displayOverline = "EXPLORE THE PANTRY";
  const styles = useMemo(
    () => createStyles(c, isDark, compact, columns, isDesktop, isTablet),
    [c, isDark, compact, columns, isDesktop, isTablet]
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.editorialOverlineRow}>
        <View style={styles.editorialSquare} />
        <Text style={styles.editorialOverline} numberOfLines={1}>
          {displayOverline}
        </Text>
      </View>
      <HomeSectionHeader overline="" title={title} onSeeAll={onPressViewAll} seeAllLabel={viewAllLabel} />
      <View style={styles.grid}>
        {categories.slice(0, 8).map((item) => (
          <CategoryTile
            key={item.key}
            item={item}
            compact={compact}
            columns={columns}
            isDesktop={isDesktop}
            onPress={onPressCategory}
          />
        ))}
      </View>
    </View>
  );
}

function createStyles(c, isDark, compact, columns, isDesktop, isTablet) {
  const gap = isTablet ? 14 : 10;
  return StyleSheet.create({
    wrap: {
      marginBottom: spacing.lg,
    },
    editorialOverlineRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: homeSpacing.xs,
      marginBottom: homeSpacing.md,
    },
    editorialSquare: {
      width: 4,
      height: 4,
      backgroundColor: c.accent || c.rating || "#C8A97E",
    },
    editorialOverline: {
      fontSize: 11,
      fontFamily: homeType.overline.fontFamily,
      letterSpacing: 1.4,
      color: c.accent || c.rating || "#C8A97E",
      textTransform: "uppercase",
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -(gap / 2),
    },
    tileCell: {
      width: `${100 / columns}%`,
      paddingHorizontal: gap / 2,
      paddingVertical: gap / 2,
    },
    tile: {
      minHeight: compact ? 108 : 116,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.line || (isDark ? "rgba(255,255,255,0.14)" : "rgba(100,116,139,0.18)"),
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: homeSpacing.md,
      paddingHorizontal: spacing.xs,
      ...Platform.select({
        web: {
          transition: "transform 120ms ease, opacity 120ms ease, background-color 120ms ease",
          cursor: "pointer",
        },
        default: {},
      }),
    },
    tilePressed: {
      opacity: 0.97,
    },
    tileHovered: {
      opacity: 0.98,
      ...Platform.select({
        web: {
          transform: [{ scale: 1.03 }],
        },
        default: {},
      }),
    },
    iconCircle: {
      width: 48,
      height: 48,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: homeSpacing.md,
    },
    label: {
      fontSize: 13,
      fontFamily: homeType.uiMedium.fontFamily,
      color: c.ink || c.textPrimary,
      textAlign: "center",
      lineHeight: Math.round(13 * 1.4),
    },
  });
}
