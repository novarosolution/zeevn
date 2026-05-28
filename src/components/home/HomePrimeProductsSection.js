import React, { memo, useCallback, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Platform, Pressable, Text, View } from "react-native";
import ProductCard from "../ProductCard";
import {
  HOME_PRIME_SECTION,
  formatPrimeSectionCount,
} from "../../content/homePrimeSection";
import { useTheme } from "../../context/ThemeContext";
import useWebLiteMode from "../../hooks/useWebLiteMode";
import {
  createHomePrimeProductsStyles,
  getPrimeGridColumns,
} from "./homePrimeProductsStyles";

function buildProductRows(items, columnCount) {
  const cols = Math.max(1, columnCount);
  const rows = [];
  for (let i = 0; i < items.length; i += cols) {
    rows.push(items.slice(i, i + cols));
  }
  return rows;
}

function PrimeProductGrid({
  items,
  columnCount,
  cardWidth,
  gridGap,
  cardStyle,
  styles,
  navigation,
  getItemQuantity,
  onAddToCart,
  onRemoveFromCart,
}) {
  const rows = useMemo(() => buildProductRows(items, columnCount), [items, columnCount]);
  const isOutOfStock = useCallback(
    (item) => item?.inStock === false || Number(item?.stockQty || 0) <= 0,
    []
  );

  return (
    <View style={styles.grid}>
      {rows.map((rowItems, rowIdx) => (
        <View
          key={`prime-grid-row-${rowIdx}`}
          style={[
            styles.gridRow,
            { gap: gridGap, marginBottom: rowIdx < rows.length - 1 ? gridGap : 0 },
          ]}
        >
          {rowItems.map((item, colIdx) => {
            const index = rowIdx * columnCount + colIdx;
            return (
              <View
                key={String(item?.id ?? `prime-item-${index}`)}
                style={[styles.gridCell, { width: cardWidth, maxWidth: cardWidth }]}
              >
                <View style={styles.cellFrame}>
                  <ProductCard
                    index={index}
                    isOutOfStock={isOutOfStock(item)}
                    product={item}
                    onPress={() => navigation.navigate("Product", { productId: item.id })}
                    quantity={getItemQuantity(item.id)}
                    onAddToCart={(meta) => onAddToCart(item, meta)}
                    onRemoveFromCart={() => onRemoveFromCart(item.id)}
                    variant="grid"
                    compact={cardStyle !== "comfortable"}
                    editorial={cardStyle === "comfortable"}
                    showEta={cardStyle === "comfortable"}
                    railHover={Platform.OS === "web"}
                  />
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/**
 * Prime Products — premium home block with gradient shell, editorial header,
 * and a view-based product grid (no nested scroll; parent ScrollView owns scroll).
 */
function HomePrimeProductsSection({
  title,
  products = [],
  navigation,
  getItemQuantity,
  onAddToCart,
  onRemoveFromCart,
  cardStyle = "compact",
  numColumns,
  gridGap = 14,
  cardWidth = 160,
  windowWidth = 390,
}) {
  const { colors: c, isDark } = useTheme();
  const webLite = useWebLiteMode();
  const styles = useMemo(
    () => createHomePrimeProductsStyles(c, isDark, windowWidth),
    [c, isDark, windowWidth]
  );

  const sectionTitle =
    String(title || HOME_PRIME_SECTION.titleFallback).trim() || HOME_PRIME_SECTION.titleFallback;

  const items = useMemo(
    () => (Array.isArray(products) ? products.filter(Boolean) : []),
    [products]
  );

  const columnCount = useMemo(
    () => getPrimeGridColumns(windowWidth, numColumns),
    [numColumns, windowWidth]
  );

  const gradientColors = useMemo(
    () =>
      isDark
        ? ["rgba(200,169,126,0.12)", "rgba(200,169,126,0.02)", "rgba(0,0,0,0)"]
        : ["rgba(200,169,126,0.14)", "rgba(255,253,251,0.6)", "rgba(255,255,255,0)"],
    [isDark]
  );

  const openSearchForSection = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    navigation.navigate("Search", {
      q: "",
      category: "",
      categoryLabel: "",
      section: sectionTitle,
    });
  }, [navigation, sectionTitle]);

  if (!items.length) {
    return null;
  }

  return (
    <View
      style={styles.wrap}
      accessibilityRole="summary"
      accessibilityLabel={`${sectionTitle}, ${formatPrimeSectionCount(items.length)}`}
      {...(Platform.OS === "web" ? { dataSet: { zvSection: "prime" } } : {})}
    >
      <View style={styles.gradientShell}>
        <LinearGradient
          colors={gradientColors}
          locations={[0, 0.45, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.inner}
        >
          <View style={styles.topRule} pointerEvents="none" />

          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <View style={styles.overlineRow}>
                <View style={styles.overlineSquare} />
                <Text style={styles.overlineText}>{HOME_PRIME_SECTION.overline}</Text>
              </View>
              <View style={styles.titleRow}>
                <Text style={styles.title} accessibilityRole="header">
                  {sectionTitle}
                </Text>
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{formatPrimeSectionCount(items.length)}</Text>
                </View>
              </View>
              <Text style={styles.subtitle}>{HOME_PRIME_SECTION.subtitle}</Text>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                onPress={openSearchForSection}
                style={({ pressed }) => [styles.seeAllBtn, pressed ? styles.seeAllPressed : null]}
                accessibilityRole="button"
                accessibilityLabel={HOME_PRIME_SECTION.seeAllA11y}
              >
                <Text style={styles.seeAllText}>{HOME_PRIME_SECTION.seeAllLabel}</Text>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={isDark ? c.accent : c.accentOnLight || c.accent}
                />
              </Pressable>
            </View>
          </View>

          <PrimeProductGrid
            items={items}
            columnCount={columnCount}
            cardWidth={cardWidth}
            gridGap={gridGap}
            cardStyle={cardStyle}
            styles={styles}
            navigation={navigation}
            getItemQuantity={getItemQuantity}
            onAddToCart={onAddToCart}
            onRemoveFromCart={onRemoveFromCart}
          />

          {!webLite ? (
            <View style={styles.footerNote} accessibilityElementsHidden>
              <Ionicons name="shield-checkmark-outline" size={16} color={c.textMuted} />
              <Text style={styles.footerNoteText}>
                Every prime pick is stocked for reliable delivery to your pincode.
              </Text>
            </View>
          ) : null}
        </LinearGradient>
      </View>
    </View>
  );
}

export default memo(HomePrimeProductsSection);
