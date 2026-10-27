import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { STORE_COMMON, STORE_PRODUCT } from "../../content/storefrontContent";
import { useCart } from "../../context/CartContext";
import { useStoreTheme } from "../../theme/storefront";
import { formatINRWhole } from "../../utils/currency";
import { productToCartLine } from "../../utils/productCart";
import { productImageSource } from "../../utils/storefront";
import { isProductPurchasable } from "../../utils/productAvailability";
import AddControl from "./AddControl";
import BottomSheet from "./BottomSheet";
import PressableScale from "./PressableScale";

const VariantSheetContext = createContext({ open: () => {} });

/** Opens the size picker for a product — one sheet instance per screen, not per card. */
export function useVariantSheet() {
  return useContext(VariantSheetContext);
}

function VariantSheet({ product, visible, onClose }) {
  const { c, r, type } = useStoreTheme();
  const { addToCart, removeFromCart, getItemQuantity } = useCart();

  const variants = Array.isArray(product?.variants) ? product.variants.filter((v) => v?.label) : [];
  const imageSource = product ? productImageSource(product, 72) : null;
  const purchasable = product ? isProductPurchasable(product) : false;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={product?.name || STORE_PRODUCT.options.title}
      subtitle={STORE_PRODUCT.options.title}
      footer={
        <PressableScale
          onPress={onClose}
          style={[styles.done, { backgroundColor: c.brand, borderRadius: r.lg }]}
          accessibilityRole="button"
          accessibilityLabel={STORE_COMMON.done}
        >
          <Text style={type.ui(15, "extrabold", c.onBrand, { letterSpacing: 0.4 })}>{STORE_COMMON.done}</Text>
        </PressableScale>
      }
    >
      <View style={styles.list}>
        {variants.map((variant) => {
          const quantity = product ? getItemQuantity(product.id, variant.label) : 0;
          return (
            <View
              key={variant.label}
              style={[styles.row, { borderColor: quantity > 0 ? c.brandAlt : c.line, backgroundColor: c.cardSoft, borderRadius: r.lg }]}
            >
              <View style={[styles.thumb, { backgroundColor: c.well, borderColor: c.line }]}>
                {imageSource ? (
                  <Image source={imageSource} style={StyleSheet.absoluteFill} contentFit="contain" />
                ) : null}
              </View>
              <View style={styles.rowText}>
                <Text style={type.ui(15.5, "bold", c.ink)} numberOfLines={1}>
                  {variant.label}
                </Text>
                {variant.tag ? (
                  <View style={[styles.tag, { backgroundColor: c.goldSoft }]}>
                    <Text style={type.ui(10.5, "extrabold", c.goldText, { letterSpacing: 0.4 })}>{variant.tag}</Text>
                  </View>
                ) : null}
                <Text style={[type.ui(16, "extrabold", c.ink), styles.price]}>{formatINRWhole(variant.price)}</Text>
              </View>
              <AddControl
                quantity={quantity}
                state={purchasable ? "ready" : "sold"}
                label={`${product?.name || "product"} ${variant.label}`}
                onAdd={() => addToCart(productToCartLine(product, variant.label))}
                onRemove={() => removeFromCart(product.id, variant.label)}
              />
            </View>
          );
        })}
      </View>
    </BottomSheet>
  );
}

export function VariantSheetProvider({ children }) {
  const [product, setProduct] = useState(null);
  const [visible, setVisible] = useState(false);

  const open = useCallback((next) => {
    setProduct(next);
    setVisible(true);
  }, []);
  const close = useCallback(() => setVisible(false), []);
  const value = useMemo(() => ({ open }), [open]);

  return (
    <VariantSheetContext.Provider value={value}>
      {children}
      <VariantSheet product={product} visible={visible} onClose={close} />
    </VariantSheetContext.Provider>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10, paddingBottom: 6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderWidth: 1,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  rowText: { flex: 1, minWidth: 0, gap: 3 },
  tag: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  price: { marginTop: 1 },
  done: { height: 50, alignItems: "center", justifyContent: "center" },
});
