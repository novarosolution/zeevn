import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { SectionHeader } from "./editorial";
import { HomeCatalogGridCard, HomeCatalogViewAllLink } from "./HomeCatalogProductViews";
import WebPhoneProductRail from "./WebPhoneProductRail";
import CatalogGridReveal from "../kankreg/CatalogGridReveal";
import { matchProductLine } from "../../content/zeevanCatalogContent";
import { SHOP_SCREEN_UI } from "../../content/appContent";
import { getProductCardFlags } from "../../utils/productAvailability";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { spacing } from "../../theme/tokens";
import SectionReveal from "../motion/SectionReveal";

/**
 * “Products in Focus” — filtered line strip (ghee / tel / …).
 * Phone: shared horizontal rail; desktop: grid.
 */
export default function WebLineFocusSection({
  lineKey,
  eyebrow = "Products in focus",
  title,
  kicker,
  products = [],
  navigation,
  getItemQuantity,
  onAdd,
  onRemove,
  homeGridStyles,
  compact,
  limit = 4,
}) {
  const { isMobileWeb } = useKankregLayout();
  const list = useMemo(
    () => products.filter((p) => matchProductLine(p, lineKey)).slice(0, isMobileWeb ? 8 : limit),
    [products, lineKey, limit, isMobileWeb]
  );
  if (!list.length) return null;

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
        onViewAll={() => navigation.navigate("Shop", shopParams)}
        cardWidth={156}
        limit={8}
      />
    );
  }

  return (
    <SectionReveal preset="fade-up" style={styles.reveal}>
      <View style={styles.wrap}>
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          kicker={kicker}
          right={
            <HomeCatalogViewAllLink
              label="View all"
              onPress={() => navigation.navigate("Shop", shopParams)}
            />
          }
        />
        <CatalogGridReveal
          immediateFirst={Math.min(list.length, 4)}
          staggerInitialDelay={40}
        >
          {list.map((item, idx) => {
            const flags = getProductCardFlags(item, SHOP_SCREEN_UI.card.comingSoonNoteFallback);
            return (
              <HomeCatalogGridCard
                key={item.id}
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
            );
          })}
        </CatalogGridReveal>
      </View>
    </SectionReveal>
  );
}

const styles = StyleSheet.create({
  reveal: { width: "100%" },
  wrap: {
    width: "100%",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
});
