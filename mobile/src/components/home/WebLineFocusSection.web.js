import React, { useMemo } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HomeCatalogGridCard } from "./HomeCatalogProductViews";
import WebPhoneProductRail from "./WebPhoneProductRail";
import { WebPillLink, WebSectionHead } from "./webPremiumParts";
import { ZEEVAN_PRODUCT_LINES, matchProductLine } from "../../content/zeevanCatalogContent";
import { getHomeLineImage } from "../../content/homeLineImages";
import { SHOP_SCREEN_UI } from "../../content/appContent";
import { WEB_HOME_PREMIUM } from "../../content/webHomeContent";
import { getProductCardFlags } from "../../utils/productAvailability";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { WP } from "../../theme/webPremium";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts } from "../../theme/tokens";
import SectionReveal from "../motion/SectionReveal";

const COLUMNS = 4;

/** Closing tile of a short product row — photo, "Explore all …" and a gold arrow — so the row always fills the width. */
function ExploreTile({ line, title, span, onPress }) {
  const thumb = getHomeLineImage(line?.key);
  return (
    <Pressable
      onPress={onPress}
      className="zv-tile"
      style={[styles.exploreTile, { flex: span }]}
      accessibilityRole="link"
      accessibilityLabel={`${WEB_HOME_PREMIUM.focus.cta}: ${title}`}
    >
      {thumb ? (
        <Image source={thumb} className="zv-tile-img" style={styles.exploreImg} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: WP.green.deep }]} />
      )}
      <View style={styles.exploreShade} pointerEvents="none" />
      <View style={styles.exploreBody}>
        <View style={styles.exploreCopy}>
          <Text style={styles.exploreEyebrow}>{(line?.description || "Zeevan").toUpperCase()}</Text>
          <Text style={styles.exploreTitle} numberOfLines={3}>
            {`Explore all ${line?.label || title}`}
          </Text>
        </View>
        <View className="zv-tile-arrow" style={styles.exploreArrow}>
          <Ionicons name="arrow-forward" size={20} color={WP.gold.ink} />
        </View>
      </View>
    </Pressable>
  );
}

/**
 * “Products in Focus” — filtered line strip (ghee / tel / …).
 * Phone: shared horizontal rail; desktop: a four-up row that a closing "Explore all" tile completes.
 */
export default function WebLineFocusSection({
  lineKey,
  eyebrow = WEB_HOME_PREMIUM.focus.eyebrow,
  title,
  kicker,
  products = [],
  navigation,
  getItemQuantity,
  onAdd,
  onRemove,
  homeGridStyles,
  compact,
  limit = COLUMNS,
}) {
  const { isMobileWeb } = useKankregLayout();
  const list = useMemo(
    () => products.filter((p) => matchProductLine(p, lineKey)).slice(0, isMobileWeb ? 8 : limit),
    [products, lineKey, limit, isMobileWeb]
  );
  if (!list.length) return null;

  const line = ZEEVAN_PRODUCT_LINES.find((l) => l.key === lineKey);
  const shopParams = {
    pill:
      lineKey === "ghee"
        ? "Ghee"
        : lineKey === "tel"
          ? "Tel"
          : lineKey === "masala"
            ? "Masala"
            : lineKey === "honey"
              ? "Honey"
              : title,
  };
  const openLine = () => navigation.navigate("Shop", shopParams);

  if (isMobileWeb) {
    return (
      <WebPhoneProductRail
        title={title}
        kicker={kicker}
        products={list}
        navigation={navigation}
        getItemQuantity={getItemQuantity}
        onAdd={onAdd}
        onRemove={onRemove}
        onViewAll={openLine}
        cardWidth={156}
        limit={8}
      />
    );
  }

  const filler = Math.max(0, COLUMNS - list.length);

  return (
    <SectionReveal preset="fade-up" style={styles.reveal}>
      <View style={styles.wrap}>
        <WebSectionHead
          eyebrow={eyebrow}
          title={title}
          kicker={kicker}
          action={<WebPillLink label={WEB_HOME_PREMIUM.focus.cta} onPress={openLine} />}
        />
        <View style={styles.row}>
          {list.map((item, idx) => {
            const flags = getProductCardFlags(item, SHOP_SCREEN_UI.card.comingSoonNoteFallback);
            return (
              <View key={item.id} style={styles.cell}>
                <HomeCatalogGridCard
                  idx={idx}
                  item={item}
                  variant="editorial"
                  compact={compact}
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
          })}
          {filler > 0 ? <ExploreTile line={line} title={title} span={filler} onPress={openLine} /> : null}
        </View>
      </View>
    </SectionReveal>
  );
}

const styles = StyleSheet.create({
  reveal: { width: "100%" },
  wrap: { width: "100%", gap: 32 },
  row: { width: "100%", flexDirection: "row", alignItems: "stretch", gap: 20 },
  cell: { flex: 1, minWidth: 0 },
  exploreTile: {
    minWidth: 0,
    minHeight: 360,
    borderRadius: WP.radius.tile,
    overflow: "hidden",
    backgroundColor: WP.green.deep,
    ...Platform.select({ web: { boxShadow: WP.shadow.card, cursor: "pointer" }, default: {} }),
  },
  exploreImg: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  exploreShade: {
    ...StyleSheet.absoluteFillObject,
    ...Platform.select({
      web: {
        backgroundImage:
          "linear-gradient(0deg, rgba(16,24,12,0.9) 0%, rgba(16,24,12,0.5) 42%, rgba(16,24,12,0.12) 100%)",
      },
      default: { backgroundColor: "rgba(16,24,12,0.45)" },
    }),
  },
  exploreBody: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 14,
    padding: 28,
  },
  exploreCopy: { flex: 1, minWidth: 0, gap: 8 },
  exploreEyebrow: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 2.4, color: WP.gold.bright },
  exploreTitle: {
    fontFamily: FONT_HEADING,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.5,
    color: WP.cream,
  },
  exploreArrow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({ web: { backgroundImage: WP.gradient.gold }, default: { backgroundColor: WP.gold.base } }),
  },
});
