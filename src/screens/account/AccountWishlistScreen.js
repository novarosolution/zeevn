import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Text, View, useWindowDimensions } from "react-native";
import AccountLayout from "../../components/account/AccountLayout";
import ProductCard from "../../components/ProductCard";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Toast from "../../components/ui/Toast";
import WishlistMoveAllModal from "../../components/account/wishlist/WishlistMoveAllModal";
import WishlistSortModal from "../../components/account/wishlist/WishlistSortModal";
import WishlistTrendingStrip from "../../components/account/wishlist/WishlistTrendingStrip";
import { WISHLIST_SCREEN, fillPlaceholders } from "../../content/appContent";
import { ACCOUNT_NESTED } from "../../navigation/accountRoutes";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { useTheme } from "../../context/ThemeContext";
import { getProducts } from "../../services/productService";
import { fonts } from "../../theme/tokens";
import { sortWishlistProducts } from "../../utils/wishlistSort";

const copy = WISHLIST_SCREEN;

export default function AccountWishlistScreen({ navigation }) {
  const { ids, add: addToWishlist } = useWishlist();
  const { addToCart, removeFromCart, cartItems } = useCart();
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const { width } = useWindowDimensions();

  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("recent");
  const [sortOpen, setSortOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveBusy, setMoveBusy] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", actionLabel: "", onAction: null });
  const undoRef = useRef(null);

  const numCols = width >= 1100 ? 4 : width >= 768 ? 3 : 2;
  const gap = SPACING.md;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getProducts();
        if (!cancelled) setCatalog(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setCatalog([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const wishProducts = useMemo(() => {
    const idSet = new Set(ids.map(String));
    const matched = catalog.filter((p) => idSet.has(String(p.id)));
    return sortWishlistProducts(matched, sort, ids);
  }, [catalog, ids, sort]);

  const trendingProducts = useMemo(() => {
    const wishSet = new Set(ids.map(String));
    return catalog.filter((p) => p?.inStock !== false && !wishSet.has(String(p.id))).slice(0, 8);
  }, [catalog, ids]);

  const pageSubtitle = useMemo(() => {
    const n = wishProducts.length;
    if (n === 0) return copy.subtitleEmpty;
    if (n === 1) return copy.subtitleOne;
    return fillPlaceholders(copy.subtitleTemplate, { count: String(n) });
  }, [wishProducts.length]);

  const getQty = useCallback(
    (productId) => {
      const row = cartItems.find((i) => String(i.id) === String(productId));
      return row ? Number(row.quantity || 0) : 0;
    },
    [cartItems]
  );

  const inStockItems = useMemo(() => wishProducts.filter((p) => p?.inStock !== false), [wishProducts]);
  const outOfStockCount = wishProducts.length - inStockItems.length;

  const runMoveAll = useCallback(() => {
    inStockItems.forEach((p) => addToCart(p));
    setMoveModalOpen(false);
  }, [addToCart, inStockItems]);

  const handleMoveAllPress = () => {
    if (!wishProducts.length) return;
    if (inStockItems.length === 0) {
      Alert.alert(copy.moveAllModal.title, copy.moveAllModal.allOutOfStock);
      return;
    }
    if (outOfStockCount > 0) {
      setMoveModalOpen(true);
      return;
    }
    runMoveAll();
  };

  const handleWishlistToggle = useCallback(
    (productId, isNowSaved) => {
      if (isNowSaved) return;
      if (undoRef.current) clearTimeout(undoRef.current);
      setToast({
        visible: true,
        message: copy.removedToast,
        actionLabel: copy.undoToastAction,
        onAction: () => {
          addToWishlist(productId);
          setToast((t) => ({ ...t, visible: false }));
        },
      });
    },
    [addToWishlist]
  );

  const cellStyle = useMemo(
    () => ({
      width: width >= 768 ? `${96 / numCols}%` : "48%",
      flexGrow: 1,
      minWidth: 140,
      maxWidth: width >= 1100 ? 280 : "48%",
    }),
    [numCols, width]
  );

  return (
    <AccountLayout
      navigation={navigation}
      activeKey={ACCOUNT_NESTED.Wishlist}
      activeSection="wishlist"
      pageTitle={copy.pageTitle}
      pageSubtitle={pageSubtitle}
    >
      <Toast
        visible={toast.visible}
        message={toast.message}
        actionLabel={toast.actionLabel}
        onAction={toast.onAction}
        onDismiss={() => setToast((t) => ({ ...t, visible: false }))}
        durationMs={4500}
      />

      <WishlistMoveAllModal
        visible={moveModalOpen}
        total={wishProducts.length}
        inStock={inStockItems.length}
        outOfStock={outOfStockCount}
        busy={moveBusy}
        onCancel={() => !moveBusy && setMoveModalOpen(false)}
        onConfirm={() => {
          setMoveBusy(true);
          runMoveAll();
          setMoveBusy(false);
        }}
      />

      <WishlistSortModal visible={sortOpen} activeSort={sort} onSelect={setSort} onClose={() => setSortOpen(false)} />

      {wishProducts.length > 0 ? (
        <View style={{ flexDirection: "row", justifyContent: "flex-end", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.md }}>
          <Button label={copy.moveAllCta} variant="secondary" size="sm" onPress={handleMoveAllPress} />
          <Button label={copy.sortCta} variant="ghost" size="sm" onPress={() => setSortOpen(true)} />
        </View>
      ) : null}

      {loading ? (
        <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkMuted }}>{copy.loading}</Text>
      ) : wishProducts.length === 0 ? (
        <>
          <EmptyState
            iconName="heart-outline"
            title={copy.empty.title}
            description={copy.empty.description}
            ctaLabel={copy.empty.cta}
            onCtaPress={() => navigation.navigate("Home")}
          />
          <WishlistTrendingStrip
            products={trendingProducts}
            navigation={navigation}
            getQty={getQty}
            onAddToCart={addToCart}
            onRemoveFromCart={removeFromCart}
          />
        </>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap }}>
          {wishProducts.map((product, index) => (
            <View key={String(product.id)} style={cellStyle}>
              <ProductCard
                product={product}
                index={index}
                isOutOfStock={product.inStock === false}
                onPress={() => navigation.navigate("Product", { productId: String(product.id) })}
                quantity={getQty(product.id)}
                onAddToCart={() => addToCart(product)}
                onRemoveFromCart={() => removeFromCart(product.id)}
                onWishlistToggle={handleWishlistToggle}
                variant="grid"
                editorial={width >= 600}
              />
            </View>
          ))}
        </View>
      )}
    </AccountLayout>
  );
}
