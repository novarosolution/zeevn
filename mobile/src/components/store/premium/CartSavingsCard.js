import React, { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useStoreTheme, withAlpha } from "../../../theme/storefront";
import { computeCartSavings } from "../../../utils/cartSavings";
import { formatINR, formatINRWhole } from "../../../utils/currency";
import PremiumBoundary from "./PremiumBoundary";

/**
 * "You&apos;re saving ₹X" banner for the bag. The figure is the printed-price (MRP) saving across the lines plus any coupon,
 * so it only appears when there really is a saving, and breaks down where it comes from.
 *
 * props: items (cart lines), couponDiscount (rupees), style
 */
function CartSavingsCardBase({ items, couponDiscount = 0, style }) {
  const { c, r, type, isDark } = useStoreTheme();
  const savings = useMemo(() => computeCartSavings(items, { couponDiscount }), [items, couponDiscount]);
  if (savings.total < 1) return null;

  const ink = isDark ? c.ink : "#1F3A18";
  const mute = isDark ? c.inkSoft : "#3F5A33";
  const parts = [
    savings.mrpSavings >= 1 ? `Offers ${formatINRWhole(Math.round(savings.mrpSavings))}` : "",
    savings.couponSavings >= 1 ? `Coupon ${formatINRWhole(Math.round(savings.couponSavings))}` : "",
  ].filter(Boolean);

  return (
    <View style={[styles.wrap, { borderRadius: r.xl, borderColor: withAlpha(c.brandAlt, isDark ? 0.4 : 0.3) }, style]} accessible accessibilityLabel={`You are saving ${formatINR(savings.total)} on this order`}>
      <LinearGradient
        colors={isDark ? [withAlpha(c.brand, 0.22), withAlpha(c.brand, 0.1)] : ["#EEF5DB", "#DDEBC2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.icon, { backgroundColor: isDark ? withAlpha(c.brand, 0.3) : "#FFFFFF" }]}>
        <Ionicons name="sparkles" size={20} color={c.brand} />
      </View>
      <View style={styles.text}>
        <Text style={type.display(20, { color: ink, semi: true, ls: -0.3, lh: 24 })} numberOfLines={1}>
          You&apos;re saving {formatINRWhole(Math.round(savings.total))}
          {savings.percent >= 3 ? ` · ${savings.percent}% off` : ""}
        </Text>
        {parts.length ? (
          <Text style={type.ui(12.5, "medium", mute)} numberOfLines={1}>
            {parts.join("  ·  ")}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const Memo = memo(CartSavingsCardBase);

export default function CartSavingsCard(props) {
  return (
    <PremiumBoundary name="CartSavingsCard">
      <Memo {...props} />
    </PremiumBoundary>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, overflow: "hidden" },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, minWidth: 0, gap: 2 },
});
