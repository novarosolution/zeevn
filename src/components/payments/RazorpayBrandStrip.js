import React, { memo, useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { useTheme } from "../../context/ThemeContext";
import { fonts, typography } from "../../theme/tokens";

/**
 * Tiny row of brand pills (UPI, Visa, MC, RuPay, Wallets) we surface beneath
 * the "Pay online" card so customers immediately recognise the rails Razorpay
 * supports. Pure presentational; no interaction.
 */
function RazorpayBrandStripBase({ brands, selected, compact }) {
  const { colors: c, isDark } = useTheme();
  const styles = useMemo(() => createStyles(c, isDark, selected), [c, isDark, selected]);
  const items = brands && brands.length > 0 ? brands : ["UPI", "Visa", "MC", "RuPay", "Wallets"];

  return (
    <View style={[styles.row, compact ? styles.rowCompact : null]}>
      {items.map((label) => (
        <View key={label} style={styles.chip}>
          <Text style={styles.chipText}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

function createStyles(c, isDark, selected) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 10,
    },
    rowCompact: {
      marginTop: 6,
      gap: 4,
    },
    chip: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: selected
        ? isDark
          ? c.primaryBorder
          : ALCHEMY.gold
        : isDark
        ? "rgba(255, 255, 255, 0.16)"
        : "rgba(63, 63, 70, 0.18)",
      backgroundColor: selected
        ? isDark
          ? "rgba(220, 38, 38, 0.14)"
          : "rgba(255, 244, 219, 0.95)"
        : isDark
        ? "rgba(255, 255, 255, 0.04)"
        : "rgba(255, 251, 244, 0.96)",
      ...Platform.select({
        web: { transition: "background-color 180ms ease, border-color 180ms ease" },
        default: {},
      }),
    },
    chipText: {
      fontFamily: fonts.bold,
      fontSize: typography.overline - 1,
      letterSpacing: 0.6,
      color: selected ? (isDark ? ALCHEMY.goldBright : ALCHEMY.brown) : c.textMuted,
    },
  });
}

const RazorpayBrandStrip = memo(RazorpayBrandStripBase);

export default RazorpayBrandStrip;
