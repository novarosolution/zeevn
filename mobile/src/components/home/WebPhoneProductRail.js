import React, { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { HomeCatalogGridCard } from "./HomeCatalogProductViews";
import { SHOP_SCREEN_UI } from "../../content/appContent";
import { getProductCardFlags } from "../../utils/productAvailability";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { KANKREG_PALETTE, ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts, spacing } from "../../theme/tokens";
import SectionReveal from "../motion/SectionReveal";
import useReducedMotion from "../../hooks/useReducedMotion";

const homeGridStyles = StyleSheet.create({
  productGridWrap: {},
  productGridCell: {},
  productListRow: {},
});

/**
 * Phone-web horizontal product rail — Anveshan-style + staggered card enter.
 */
export default function WebPhoneProductRail({
  title,
  kicker,
  products = [],
  navigation,
  getItemQuantity,
  onAdd,
  onRemove,
  onViewAll,
  viewAllLabel = "View all",
  cardWidth = 156,
  limit = 10,
}) {
  const { pageGutterClamp } = useKankregLayout();
  const reduceMotion = useReducedMotion();
  const scrollRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const list = products.slice(0, limit);
  if (!list.length) return null;

  const onScroll = (e) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const max = Math.max(1, contentSize.width - layoutMeasurement.width);
    setProgress(Math.min(1, Math.max(0, contentOffset.x / max)));
  };

  return (
    <SectionReveal preset="fade-up" style={styles.reveal}>
      <View style={styles.wrap}>
        <View style={[styles.head, { paddingHorizontal: pageGutterClamp }]}>
          <View style={styles.headCopy}>
            <Text style={styles.title}>{title}</Text>
            {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
          </View>
          {typeof onViewAll === "function" ? (
            <Pressable
              onPress={onViewAll}
              style={({ pressed }) => [styles.viewAll, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
              accessibilityRole="button"
              accessibilityLabel={viewAllLabel}
            >
              <Text style={styles.viewAllText}>{viewAllLabel}</Text>
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          contentContainerStyle={[styles.rail, { paddingHorizontal: pageGutterClamp }]}
        >
          {list.map((item, idx) => {
            const flags = getProductCardFlags(item, SHOP_SCREEN_UI.card.comingSoonNoteFallback);
            const card = (
              <View style={[styles.card, { width: cardWidth }]}>
                <HomeCatalogGridCard
                  idx={idx}
                  item={item}
                  variant="editorial"
                  compact
                  navigation={navigation}
                  quantity={getItemQuantity(item.id)}
                  styles={homeGridStyles}
                  isOutOfStock={flags.isOutOfStock}
                  isComingSoon={flags.isComingSoon}
                  comingSoonNote={flags.comingSoonNote}
                  onAddToCart={() => onAdd(item)}
                  onRemoveFromCart={() => onRemove(item.id)}
                />
              </View>
            );
            if (reduceMotion || idx > 4) {
              return <React.Fragment key={item.id}>{card}</React.Fragment>;
            }
            return (
              <Animated.View
                key={item.id}
                entering={FadeInRight.springify().delay(60 + idx * 55).damping(17).mass(0.85)}
              >
                {card}
              </Animated.View>
            );
          })}
        </ScrollView>

        {list.length > 2 ? (
          <View style={[styles.track, { marginHorizontal: pageGutterClamp }]}>
            <View style={[styles.fill, { width: `${Math.max(16, progress * 100)}%` }]} />
          </View>
        ) : null}
      </View>
    </SectionReveal>
  );
}

const styles = StyleSheet.create({
  reveal: { width: "100%" },
  wrap: {
    width: "100%",
    gap: 10,
    paddingVertical: spacing.xs,
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: 22,
    lineHeight: 28,
    color: KANKREG_PALETTE.ink,
    letterSpacing: -0.3,
  },
  kicker: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: KANKREG_PALETTE.inkSoft,
  },
  viewAll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: ZEEVAN_GREEN.deep,
    marginTop: 2,
  },
  viewAllText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  rail: {
    gap: 12,
    paddingVertical: 2,
  },
  card: {
    flexShrink: 0,
  },
  track: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(36,68,36,0.1)",
    overflow: "hidden",
    marginTop: 2,
  },
  fill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: ZEEVAN_GREEN.base,
  },
});
