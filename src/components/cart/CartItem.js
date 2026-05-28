import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "../ui/Card";
import CartItemThumb from "./CartItemThumb";
import { useTheme } from "../../context/ThemeContext";
import { CART_DRAWER_UI } from "../../content/appContent";
import { fonts } from "../../theme/tokens";
import { formatINR } from "../../utils/currency";

/**
 * Shared cart line row for CartScreen and CartDrawer.
 */
function CartItemBase({
  item,
  onDecrease,
  onIncrease,
  onRemove,
  onMoveToWishlist,
  showLineTotal = true,
  style,
}) {
  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();
  const removeLabel = CART_DRAWER_UI.removeLineA11y;

  return (
    <Card padding="md" style={[{ marginBottom: SPACING.md }, style]}>
      <View style={{ flexDirection: "row", gap: SPACING.md }}>
        <CartItemThumb uri={item.image || ""} width={80} height={100} borderRadius={RADII.sm} semanticPalette={semanticPalette} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View
            style={
              showLineTotal
                ? { flexDirection: "row", justifyContent: "space-between", gap: SPACING.sm }
                : undefined
            }
          >
            <Text
              style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.ink, flex: 1 }}
              numberOfLines={2}
            >
              {item.name}
            </Text>
            {showLineTotal ? (
              <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }}>
                {formatINR(item.price * item.quantity)}
              </Text>
            ) : null}
          </View>
          {item.variantLabel ? (
            <Text
              style={{
                marginTop: 4,
                fontFamily: fonts.medium,
                fontSize: TYPE.caption.fontSize,
                color: semanticPalette.inkMuted,
              }}
            >
              {item.variantLabel}
            </Text>
          ) : null}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: SPACING.sm }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: semanticPalette.line,
                borderRadius: RADII.pill,
              }}
            >
              <Pressable
                style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                onPress={() => onDecrease?.(item)}
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
              >
                <Ionicons name="remove" size={18} color={semanticPalette.ink} />
              </Pressable>
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  minWidth: 24,
                  textAlign: "center",
                  color: semanticPalette.ink,
                }}
              >
                {item.quantity}
              </Text>
              <Pressable
                style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                onPress={() => onIncrease?.(item)}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
              >
                <Ionicons name="add" size={18} color={semanticPalette.ink} />
              </Pressable>
            </View>
            <Pressable
              onPress={() => onRemove?.(item)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={removeLabel}
            >
              <Ionicons name="trash-outline" size={20} color={semanticPalette.inkMuted} />
            </Pressable>
          </View>
          {onMoveToWishlist ? (
            <Pressable onPress={() => onMoveToWishlist?.(item)} hitSlop={8} accessibilityRole="button">
              <Text
                style={{
                  marginTop: SPACING.xs,
                  fontFamily: fonts.semibold,
                  fontSize: TYPE.caption.fontSize,
                  color: semanticPalette.accent,
                }}
              >
                {CART_DRAWER_UI.moveToWishlist}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const CartItem = memo(CartItemBase);

export default CartItem;
