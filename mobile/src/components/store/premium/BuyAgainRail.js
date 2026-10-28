import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { useStoreTheme } from "../../../theme/storefront";
import { fetchMyOrders } from "../../../services/userService";
import { buildBuyAgainLines } from "../../../utils/orderInsights";
import { SectionHeader } from "../SectionTitle";
import MiniProductCard, { MINI_CARD_WIDTH } from "./MiniProductCard";
import PremiumBoundary from "./PremiumBoundary";

const GAP = 12;

function plural(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/**
 * "Buy again" rail for Home: what this shopper already received, matched to today's catalog (so price, stock and photos
 * are always current), staples they have ordered more than once first. Hidden for guests, for anyone with no delivered
 * orders, and whenever the orders can't be read — it never shows an error, because it is a convenience, not a feature.
 *
 * props: products (the catalog), onProductPress(product)
 */
/**
 * The products to offer again: delivered orders matched to today's catalog. Returns `[]` until orders have loaded, for
 * guests, and when nothing matches. Home calls this itself so it can leave the whole section out (no empty gap).
 */
export function useBuyAgainItems(products, { limit = 8 } = {}) {
  const { isAuthenticated, token } = useAuth();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setOrders(null);
      return undefined;
    }
    let alive = true;
    fetchMyOrders(token)
      .then((list) => {
        if (alive) setOrders(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (alive) setOrders([]);
      });
    return () => {
      alive = false;
    };
  }, [isAuthenticated, token]);

  return useMemo(() => {
    if (!orders || !Array.isArray(products) || !products.length) return [];
    const byId = new Map(products.map((p) => [String(p.id), p]));
    return buildBuyAgainLines(orders, { limit: limit + 4 })
      .map((line) => {
        const product = byId.get(line.productId);
        return product ? { product, caption: line.times > 1 ? `Bought ${plural(line.times, "time")}` : "Ordered before" } : null;
      })
      .filter(Boolean)
      .slice(0, limit);
  }, [orders, products, limit]);
}

/**
 * "Buy again" rail for Home: what this shopper already received, matched to today's catalog (so price, stock and photos
 * are always current), staples they have ordered more than once first. Hidden when there is nothing to show — it never
 * shows an error, because it is a convenience, not a feature.
 *
 * props: items (from `useBuyAgainItems`), onProductPress(product)
 */
function BuyAgainRailBase({ items, onProductPress }) {
  const { gutter } = useStoreTheme();

  const renderItem = useCallback(
    ({ item }) => <MiniProductCard product={item.product} caption={item.caption} onPress={() => onProductPress?.(item.product)} />,
    [onProductPress]
  );
  const keyExtractor = useCallback((item) => String(item.product.id), []);

  if (!Array.isArray(items) || !items.length) return null;

  return (
    <View style={styles.block}>
      <SectionHeader eyebrow="Your favourites" title="Buy again" caption="Back in stock, one tap to the bag." />
      <FlatList
        horizontal
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={MINI_CARD_WIDTH + GAP}
        snapToAlignment="start"
        contentContainerStyle={[styles.content, { paddingHorizontal: gutter }]}
        initialNumToRender={3}
        windowSize={5}
      />
    </View>
  );
}

const Memo = memo(BuyAgainRailBase);

export default function BuyAgainRail(props) {
  return (
    <PremiumBoundary name="BuyAgainRail">
      <Memo {...props} />
    </PremiumBoundary>
  );
}

const styles = StyleSheet.create({
  block: { gap: 14 },
  content: { gap: GAP, paddingVertical: 4, alignItems: "flex-start" },
});
