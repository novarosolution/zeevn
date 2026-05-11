import React, { memo, useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { fonts, radius } from "../../theme/tokens";
import { FONT_DISPLAY } from "../../theme/customerAlchemy";
import { useTheme } from "../../context/ThemeContext";
import { formatINRWhole } from "../../utils/currency";

const SIZE_TOKENS = {
  sm: { price: 18, mrp: 11, save: 9, gap: 6 },
  md: { price: 22, mrp: 12, save: 10, gap: 8 },
  lg: { price: 28, mrp: 13, save: 11, gap: 10 },
  xl: { price: 34, mrp: 14, save: 12, gap: 12 },
};

/**
 * Display-font price tag with optional line-through MRP and a green save
 * chip. Used in cart line items, cart totals, product CTA, order tiles.
 */
function PriceTagBase({
  price,
  mrp,
  size = "md",
  alignVertical = false,
  showSaveChip = true,
  goldTinted,
  style,
}) {
  const { colors: c, isDark } = useTheme();
  const tokens = SIZE_TOKENS[size] || SIZE_TOKENS.md;
  const styles = useMemo(
    () => createStyles(c, isDark, tokens, alignVertical, goldTinted),
    [c, isDark, tokens, alignVertical, goldTinted]
  );

  const safePrice = Number(price);
  const safeMrp = Number(mrp);
  const showMrp = Number.isFinite(safeMrp) && safeMrp > safePrice;
  const saveAmount = showMrp ? safeMrp - safePrice : 0;

  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.price} numberOfLines={1}>
        {formatINRWhole(safePrice || 0)}
      </Text>
      {showMrp ? (
        <View style={styles.subRow}>
          <Text style={styles.mrp} numberOfLines={1}>
            {formatINRWhole(safeMrp)}
          </Text>
          {showSaveChip && saveAmount > 0 ? (
            <View style={styles.saveChip}>
              <Text style={styles.saveText} numberOfLines={1}>
                Save {formatINRWhole(saveAmount)}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(c, isDark, t, alignVertical, goldTinted) {
  return StyleSheet.create({
    wrap: {
      flexDirection: alignVertical ? "column" : "column",
      alignItems: "flex-start",
      gap: 4,
    },
    price: {
      fontFamily: FONT_DISPLAY,
      fontSize: t.price,
      lineHeight: t.price + 4,
      letterSpacing: -0.5,
      color: goldTinted ? (isDark ? c.primaryBright : c.primaryDark) : c.textPrimary,
      ...Platform.select({
        web: { fontSize: t.price + 2, lineHeight: t.price + 6 },
        default: {},
      }),
    },
    subRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
    },
    mrp: {
      fontFamily: fonts.medium,
      fontSize: t.mrp,
      color: c.textMuted,
      textDecorationLine: "line-through",
    },
    saveChip: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(148, 163, 184, 0.3)" : "rgba(100, 116, 139, 0.22)",
      backgroundColor: isDark ? "rgba(148, 163, 184, 0.16)" : "rgba(100, 116, 139, 0.1)",
    },
    saveText: {
      fontFamily: fonts.extrabold,
      fontSize: t.save,
      letterSpacing: 0.2,
      color: isDark ? c.primaryBright : c.primaryDark,
    },
  });
}

const PriceTag = memo(PriceTagBase);

export default PriceTag;
