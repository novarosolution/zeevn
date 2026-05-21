import React, { useCallback, useMemo, useRef } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import * as Haptics from "expo-haptics";
import DecorativeExpoImage from "../ui/DecorativeExpoImage";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { useTheme } from "../../context/ThemeContext";
import { pointerEventsProp } from "../../utils/pointerEventsStyle";
import HomeSectionHeader from "./HomeSectionHeader";
import { nativeDriverEnabled } from "../../utils/motion";
import { homeType } from "../../styles/typography";
const PHONE_COLS = 4;
const TABLET_COLS = 6;
const DESKTOP_COLS = 8;
const CATEGORY_PHOTOS = {
  staples: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=240&q=70",
  oils: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=240&q=70",
  spices: "https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=240&q=70",
  dairy: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=240&q=70",
  sweets: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=240&q=70",
  dryfruits: "https://images.unsplash.com/photo-1599599810694-57a0c1d2dcb1?auto=format&fit=crop&w=240&q=70",
  beverages: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=240&q=70",
  drinks: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=240&q=70",
  wellness: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=240&q=70",
  snacks: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&w=240&q=70",
  all: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=240&q=70",
};

function CategoryArt({ categoryKey, color }) {
  const key = String(categoryKey || "").toLowerCase();
  if (key === "all") {
    return (
      <Svg width={26} height={26} viewBox="0 0 26 26" fill="none">
        <Rect x="4.5" y="4.5" width="7" height="7" rx="2" stroke={color} strokeWidth="1.4" />
        <Rect x="14.5" y="4.5" width="7" height="7" rx="2" stroke={color} strokeWidth="1.4" />
        <Rect x="4.5" y="14.5" width="7" height="7" rx="2" stroke={color} strokeWidth="1.4" />
        <Path d="M14 18h7m0 0-2.5-2.5M21 18l-2.5 2.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      </Svg>
    );
  }
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      <Circle cx="14" cy="14" r="10.2" stroke={color} strokeWidth="1.4" />
      {key === "staples" ? <Rect x="9" y="8.8" width="10" height="11.2" rx="2" stroke={color} strokeWidth="1.4" /> : null}
      {key === "oils" ? <Path d="M14 8.8c-2.4 3-3.4 4.8-3.4 6.6A3.4 3.4 0 1 0 17.4 15c0-1.8-1-3.6-3.4-6.2Z" stroke={color} strokeWidth="1.4" /> : null}
      {key === "spices" ? <Path d="M14 8.5v11m-4-6h8m-6.5-3.5 5 9" stroke={color} strokeWidth="1.4" strokeLinecap="round" /> : null}
      {key === "dairy" ? <Path d="M12 8h4m-3 0v3l-1.7 2V19a1.8 1.8 0 0 0 1.8 1.8h1.8A1.8 1.8 0 0 0 16.7 19v-6l-1.7-2V8" stroke={color} strokeWidth="1.4" strokeLinecap="round" /> : null}
      {key === "sweets" ? <Path d="M9.2 13.2h9.6M10.5 16.8h7m-6.5-7 1.7 10m3.3-10-1.7 10" stroke={color} strokeWidth="1.4" strokeLinecap="round" /> : null}
      {key === "dryfruits" ? (
        <>
          <Path d="M9.5 15.5c1.8-4 7.2-4 9 0-1.8 4-7.2 4-9 0Z" stroke={color} strokeWidth="1.4" />
          <Circle cx="14" cy="15.4" r="1.8" stroke={color} strokeWidth="1.2" />
        </>
      ) : null}
      {key === "drinks" || key === "beverages" ? <Path d="M10 9h8l-.8 5.5a3.2 3.2 0 0 1-3.2 2.8h0a3.2 3.2 0 0 1-3.2-2.8L10 9Zm4 8.4V20" stroke={color} strokeWidth="1.4" strokeLinecap="round" /> : null}
      {key === "wellness" ? <Path d="M9.8 17c4.8 0 6.4-2.8 8.4-8.2C13 9 10 12 9.8 17Zm0 0c2.5-.2 4.8 1.4 6.2 3.2" stroke={color} strokeWidth="1.4" strokeLinecap="round" /> : null}
      {key === "snacks" ? <Path d="M9.6 9.4h8.8l-1.2 9.2h-6.4l-1.2-9.2Zm2.2 4.2h4.4" stroke={color} strokeWidth="1.4" strokeLinecap="round" /> : null}
    </Svg>
  );
}

function CategoryTile({ item, compact, onPress, columns, isDesktop, isAllTile = false }) {
  const { colors: c, isDark } = useTheme();
  const isTablet = columns === TABLET_COLS;
  const tileTint = String(item?.tint || "").trim();
  const styles = useMemo(
    () => createStyles(c, isDark, compact, columns, isDesktop, isTablet),
    [c, isDark, compact, columns, isDesktop, isTablet]
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
          useNativeDriver: nativeDriverEnabled,
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
    outputRange: [c.surface, c.surfaceMuted || c.surface],
  });
  const circleBg = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [c.primarySoft, c.accentGoldSoft || c.primarySoft],
  });

  const imageUri = useMemo(() => {
    const source = String(item?.image || item?.imageUrl || "").trim();
    if (source) return source;
    return CATEGORY_PHOTOS[String(isAllTile ? "all" : item?.key || "").toLowerCase()] || "";
  }, [isAllTile, item?.image, item?.imageUrl, item?.key]);
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
          onPressIn={() => animateTo(0.96, 1)}
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
              <LinearGradient
                {...pointerEventsProp("none")}
                colors={["rgba(200,169,126,0.04)", "rgba(200,169,126,0)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.tileGradient}
              />
              <Animated.View
                style={[
                  styles.photoCircle,
                  isAllTile ? styles.allTileCircle : null,
                  tileTint ? { backgroundColor: tileTint } : { backgroundColor: circleBg },
                ]}
              >
                {imageUri ? (
                  <DecorativeExpoImage source={{ uri: imageUri }} style={styles.categoryPhoto} contentFit="cover" transition={100} />
                ) : (
                  <CategoryArt categoryKey={isAllTile ? "all" : item.key} color={c.accentOnLight || c.primary} />
                )}
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
  overline: _overline = "",
  title = "",
  viewAllLabel: _viewAllLabel = "View all",
  onPressCategory,
  onPressViewAll,
}) {
  const { width } = useWindowDimensions();
  const compact = width < 420;
  const isTablet = width >= 600;
  const isDesktop = width >= 1024;
  const columns = isDesktop ? DESKTOP_COLS : isTablet ? TABLET_COLS : PHONE_COLS;
  const maxTiles = isDesktop ? 8 : isTablet ? 12 : 8;
  const allTileInsertIndex = maxTiles > 8 ? 8 : 7;
  const { colors: c, isDark } = useTheme();
  const styles = useMemo(
    () => createStyles(c, isDark, compact, columns, isDesktop, isTablet),
    [c, isDark, compact, columns, isDesktop, isTablet]
  );
  const tiles = useMemo(() => {
    const list = Array.isArray(categories) ? categories.slice() : [];
    const visible = list.slice(0, Math.max(0, maxTiles - 1));
    const insertAt = Math.min(allTileInsertIndex, visible.length);
    visible.splice(insertAt, 0, {
      key: "__all_categories__",
      label: "All categories",
      all: true,
    });
    return visible.slice(0, maxTiles);
  }, [allTileInsertIndex, categories, maxTiles]);

  return (
    <View style={styles.wrap}>
      {title ? <HomeSectionHeader overline="" title={title} /> : null}
      <View style={styles.grid}>
        {tiles.map((item) => (
          <CategoryTile
            key={item.key}
            item={item}
            compact={compact}
            columns={columns}
            isDesktop={isDesktop}
            isAllTile={Boolean(item.all)}
            onPress={item.all ? onPressViewAll : onPressCategory}
          />
        ))}
      </View>
    </View>
  );
}

function createStyles(c, isDark, compact, columns, isDesktop, isTablet) {
  const gap = isDesktop ? 12 : isTablet ? 10 : 8;
  const circleSize = 56;
  return StyleSheet.create({
    wrap: {
      marginBottom: isTablet ? 40 : 32,
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
      position: "relative",
      aspectRatio: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.lineSoft || c.dividerSoft || c.border,
      alignItems: "center",
      justifyContent: "flex-start",
      paddingVertical: compact ? 8 : 10,
      paddingHorizontal: 6,
      backgroundColor: c.surface,
      ...Platform.select({
        web: {
          transition: "transform 120ms ease, opacity 120ms ease, background-color 120ms ease, box-shadow 120ms ease",
          cursor: "pointer",
          boxShadow: isDark ? "none" : "0 2px 8px rgba(14,23,41,0.04)",
        },
        ios: {
          shadowColor: c.shadow || "#0E0E0E",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0 : 0.04,
          shadowRadius: 6,
        },
        android: {
          elevation: isDark ? 0 : 1,
        },
        default: {},
      }),
    },
    tilePressed: {
      opacity: 0.97,
      transform: [{ scale: 0.96 }],
    },
    tileHovered: {
      opacity: 0.98,
      ...Platform.select({
        web: {
          transform: [{ scale: 1.03 }],
          boxShadow: isDark ? "none" : "0 6px 16px rgba(14,23,41,0.08)",
        },
        default: {},
      }),
    },
    photoCircle: {
      width: circleSize,
      height: circleSize,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
      marginBottom: 8,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "rgba(200,169,126,0.16)",
    },
    tileGradient: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 14,
    },
    categoryPhoto: {
      width: circleSize - 8,
      height: circleSize - 8,
      borderRadius: 999,
    },
    allTileCircle: {
      borderWidth: 1,
      borderColor: c.accentOnLight || c.primary,
      backgroundColor: c.primarySoft,
    },
    label: {
      fontSize: 12,
      fontFamily: homeType.uiMedium.fontFamily,
      color: c.textPrimary,
      textAlign: "center",
      lineHeight: 15,
      marginTop: "auto",
      marginBottom: 6,
    },
  });
}
