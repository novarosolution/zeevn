import React, { useCallback, useMemo, useRef } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../context/ThemeContext";
import HomeSectionHeader from "./HomeSectionHeader";
import { fonts, getSemanticColors, radius, spacing, typography } from "../../theme/tokens";

function CategoryTile({ item, compact, onPress }) {
  const { colors: c, isDark } = useTheme();
  const semantic = getSemanticColors(c);
  const styles = useMemo(() => createStyles(c, semantic, isDark, compact), [c, semantic, isDark, compact]);
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const animateTo = useCallback(
    (nextScale, nextOpacity) => {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: nextScale,
          duration: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: nextOpacity,
          duration: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    },
    [opacity, scale]
  );

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
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        <Pressable
          onPress={handlePress}
          onPressIn={() => animateTo(0.96, 0.92)}
          onPressOut={() => animateTo(1, 1)}
          style={({ hovered }) => [styles.tile, hovered && Platform.OS === "web" ? styles.tileHovered : null]}
          accessibilityRole="button"
          accessibilityLabel={`Browse ${item.label}`}
        >
          <View style={[styles.iconCircle, { backgroundColor: item.tint || semantic.bg.glass }]}>
            <Ionicons name={item.icon} size={compact ? 18 : 20} color={isDark ? c.textPrimary : c.textSecondary} />
          </View>
          <Text style={styles.label} numberOfLines={2}>
            {item.label}
          </Text>
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
  const { colors: c, isDark } = useTheme();
  const semantic = getSemanticColors(c);
  const styles = useMemo(() => createStyles(c, semantic, isDark, compact), [c, semantic, isDark, compact]);

  return (
    <View style={styles.wrap}>
      <HomeSectionHeader overline={overline} title={title} onSeeAll={onPressViewAll} seeAllLabel={viewAllLabel} />
      <View style={styles.grid}>
        {categories.slice(0, 8).map((item) => (
          <CategoryTile key={item.key} item={item} compact={compact} onPress={onPressCategory} />
        ))}
      </View>
    </View>
  );
}

function createStyles(c, semantic, isDark, compact) {
  return StyleSheet.create({
    wrap: {
      marginBottom: spacing.lg,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -4,
    },
    tileCell: {
      width: "25%",
      paddingHorizontal: 4,
      paddingVertical: 4,
    },
    tile: {
      minHeight: compact ? 100 : 108,
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(100,116,139,0.18)",
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      ...Platform.select({
        web: {
          transition: "transform 120ms ease, opacity 120ms ease, box-shadow 120ms ease",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          cursor: "pointer",
        },
        default: {},
      }),
    },
    tileHovered: {
      ...Platform.select({
        web: {
          boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
        },
        default: {},
      }),
    },
    iconCircle: {
      width: compact ? 46 : 52,
      height: compact ? 46 : 52,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.xs + 2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(100,116,139,0.14)",
    },
    label: {
      fontSize: compact ? 11 : 13,
      fontFamily: fonts.medium,
      color: c.textPrimary,
      textAlign: "center",
      letterSpacing: 0.1,
      lineHeight: compact ? 14 : typography.bodySmall + 4,
    },
  });
}
