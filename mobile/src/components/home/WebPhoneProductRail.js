import React, { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInRight } from "react-native-reanimated";
import { HomeCatalogGridCard } from "./HomeCatalogProductViews";
import { SHOP_SCREEN_UI } from "../../content/appContent";
import { ZEEVAN_PRODUCT_LINES, matchProductLine } from "../../content/zeevanCatalogContent";
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

const RAIL_GAP = 12;

function LineTabs({ active, onChange, counts }) {
  const { pageGutterClamp } = useKankregLayout();
  const tabs = [
    { key: "all", label: "All", icon: "grid-outline" },
    ...ZEEVAN_PRODUCT_LINES.map((l) => ({ key: l.key, label: l.shopPill || l.label, icon: l.icon })),
  ].filter((t) => t.key === "all" || (counts[t.key] || 0) > 0);

  if (tabs.length <= 2) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.tabs, { paddingHorizontal: pageGutterClamp }]}
    >
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={({ pressed }) => [styles.tab, pressed && { opacity: 0.8 }]}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={t.label}
          >
            <Ionicons
              name={t.icon || "leaf-outline"}
              size={20}
              color={on ? ZEEVAN_GREEN.deep : KANKREG_PALETTE.inkFaint}
            />
            <Text style={[styles.tabLabel, on && styles.tabLabelOn]} numberOfLines={1}>
              {t.label}
            </Text>
            <View style={[styles.tabRule, on && styles.tabRuleOn]} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/**
 * Phone-web horizontal product rail — Anveshan-style: optional line tabs,
 * 2-up cards, progress track with prev / next arrows.
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
  cardWidth,
  limit = 10,
  lineTabs = false,
  centerTitle = false,
}) {
  const { pageGutterClamp, width } = useKankregLayout();
  const reduceMotion = useReducedMotion();
  const scrollRef = useRef(null);
  const offsetRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [tab, setTab] = useState("all");

  /** Two full cards + a peek of the third, like the reference grid. */
  const resolvedCardWidth = useMemo(() => {
    if (cardWidth) return cardWidth;
    const usable = Math.max(280, Math.min(width, 520) - pageGutterClamp * 2);
    return Math.round((usable - RAIL_GAP) / 2.18);
  }, [cardWidth, width, pageGutterClamp]);

  const counts = useMemo(() => {
    if (!lineTabs) return {};
    const out = {};
    ZEEVAN_PRODUCT_LINES.forEach((l) => {
      out[l.key] = products.filter((p) => matchProductLine(p, l.key)).length;
    });
    return out;
  }, [lineTabs, products]);

  const list = useMemo(() => {
    const base = lineTabs && tab !== "all" ? products.filter((p) => matchProductLine(p, tab)) : products;
    return base.slice(0, limit);
  }, [products, lineTabs, tab, limit]);

  if (!products.length) return null;

  const step = resolvedCardWidth + RAIL_GAP;

  const onScroll = (e) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    offsetRef.current = contentOffset.x;
    const max = Math.max(1, contentSize.width - layoutMeasurement.width);
    setProgress(Math.min(1, Math.max(0, contentOffset.x / max)));
  };

  const nudge = (dir) => {
    const next = Math.max(0, offsetRef.current + dir * step * 2);
    scrollRef.current?.scrollTo({ x: next, animated: true });
  };

  const changeTab = (key) => {
    setTab(key);
    offsetRef.current = 0;
    setProgress(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  };

  return (
    <SectionReveal preset="fade-up" style={styles.reveal}>
      <View style={styles.wrap}>
        <View
          style={[
            styles.head,
            centerTitle && styles.headCenter,
            { paddingHorizontal: pageGutterClamp },
          ]}
        >
          <View style={[styles.headCopy, centerTitle && styles.headCopyCenter]}>
            <Text style={[styles.title, centerTitle && styles.titleCenter]}>{title}</Text>
            {kicker ? (
              <Text style={[styles.kicker, centerTitle && styles.kickerCenter]}>{kicker}</Text>
            ) : null}
          </View>
          {typeof onViewAll === "function" && !centerTitle ? (
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

        {lineTabs ? <LineTabs active={tab} onChange={changeTab} counts={counts} /> : null}

        {list.length ? (
          <ScrollView
            key={lineTabs ? tab : "rail"}
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={step}
            snapToAlignment="start"
            contentContainerStyle={[styles.rail, { paddingHorizontal: pageGutterClamp }]}
          >
            {list.map((item, idx) => {
              const flags = getProductCardFlags(item, SHOP_SCREEN_UI.card.comingSoonNoteFallback);
              const card = (
                <View style={[styles.card, { width: resolvedCardWidth }]}>
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
                  style={styles.cardAnim}
                >
                  {card}
                </Animated.View>
              );
            })}
          </ScrollView>
        ) : (
          <Text style={[styles.empty, { paddingHorizontal: pageGutterClamp }]}>
            Nothing in this line yet — check back soon.
          </Text>
        )}

        {list.length > 2 ? (
          <View style={[styles.footerRow, { paddingHorizontal: pageGutterClamp }]}>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.max(16, progress * 100)}%` }]} />
            </View>
            <View style={styles.arrows}>
              <Pressable
                onPress={() => nudge(-1)}
                style={({ pressed }) => [styles.arrow, pressed && styles.arrowPressed]}
                accessibilityRole="button"
                accessibilityLabel="Previous products"
                hitSlop={6}
              >
                <Ionicons name="chevron-back" size={16} color={ZEEVAN_GREEN.deep} />
              </Pressable>
              <Pressable
                onPress={() => nudge(1)}
                style={({ pressed }) => [styles.arrow, pressed && styles.arrowPressed]}
                accessibilityRole="button"
                accessibilityLabel="Next products"
                hitSlop={6}
              >
                <Ionicons name="chevron-forward" size={16} color={ZEEVAN_GREEN.deep} />
              </Pressable>
            </View>
          </View>
        ) : null}

        {typeof onViewAll === "function" && centerTitle ? (
          <Pressable
            onPress={onViewAll}
            style={({ pressed }) => [
              styles.viewAll,
              styles.viewAllCenter,
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel={viewAllLabel}
          >
            <Text style={styles.viewAllText}>{viewAllLabel}</Text>
          </Pressable>
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
  headCenter: {
    justifyContent: "center",
  },
  headCopy: {
    flex: 1,
    gap: 2,
  },
  headCopyCenter: {
    alignItems: "center",
  },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: 22,
    lineHeight: 28,
    color: KANKREG_PALETTE.ink,
    letterSpacing: -0.3,
  },
  titleCenter: {
    textAlign: "center",
    fontSize: 24,
    lineHeight: 30,
    color: ZEEVAN_GREEN.deep,
  },
  kicker: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: KANKREG_PALETTE.inkSoft,
  },
  kickerCenter: {
    textAlign: "center",
  },
  viewAll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: ZEEVAN_GREEN.deep,
    marginTop: 2,
  },
  viewAllCenter: {
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 4,
  },
  viewAllText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  tabs: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  tab: {
    alignItems: "center",
    gap: 4,
    paddingTop: 4,
    paddingHorizontal: 10,
    minWidth: 64,
  },
  tabLabel: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    lineHeight: 14,
    color: KANKREG_PALETTE.inkFaint,
  },
  tabLabelOn: {
    fontFamily: fonts.semibold,
    color: ZEEVAN_GREEN.deep,
  },
  tabRule: {
    marginTop: 4,
    height: 3,
    width: "100%",
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  tabRuleOn: {
    backgroundColor: ZEEVAN_GREEN.base,
  },
  rail: {
    gap: RAIL_GAP,
    paddingVertical: 2,
    alignItems: "stretch",
  },
  cardAnim: {
    flexShrink: 0,
  },
  card: {
    flexShrink: 0,
    flexGrow: 1,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: KANKREG_PALETTE.inkSoft,
    paddingVertical: spacing.md,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 2,
  },
  track: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(36,68,36,0.1)",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: ZEEVAN_GREEN.base,
  },
  arrows: {
    flexDirection: "row",
    gap: 8,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ZEEVAN_GREEN.border,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowPressed: {
    backgroundColor: ZEEVAN_GREEN.soft,
  },
});
