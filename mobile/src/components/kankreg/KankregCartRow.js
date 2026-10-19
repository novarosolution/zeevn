import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { KANKREG_PALETTE, ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { FONT_HEADING, FONT_PRICE } from "../../theme/typographyRoles";
import { formatINR } from "../../utils/currency";
import { getProductThumbImageUri } from "../../utils/image";
import ProgressiveProductImage from "../ui/ProgressiveProductImage";
import { CART_UI, fillProductScreen } from "../../content/appContent";
import { fonts, spacing } from "../../theme/tokens";

/** Premium cart line — refined thumb, soft qty stepper, clear line total. */
export default function KankregCartRow({
  item,
  index = 0,
  onDecrease,
  onIncrease,
  onRemove,
  embedded = false,
  showDivider = false,
}) {
  const { colors: c, isDark } = useTheme();
  const styles = useMemo(() => createStyles(c, isDark), [c, isDark]);
  const grad = ["#F5EAD8", "#EBE2D0", "#E4D8C4"];
  const unitPrice = Number(item?.price) || 0;
  const qty = Math.max(1, Number(item?.quantity) || 1);
  const lineTotal = unitPrice * qty;
  const variant = String(item?.variantLabel || item?.unit || "").trim();
  const imageUri = item?.image ? String(item.image) : "";
  const thumbPreview = getProductThumbImageUri(imageUri);
  const inkIcon = isDark ? "rgba(250,248,244,0.75)" : ZEEVAN_GREEN.deep;

  return (
    <View style={[styles.row, embedded && styles.rowEmbedded, showDivider && styles.rowDivider]}>
      <View style={styles.topRow}>
        <View style={styles.thumbWrap}>
          {imageUri ? (
            <ProgressiveProductImage
              uri={imageUri}
              previewUri={thumbPreview}
              style={styles.thumbImage}
              contentFit="contain"
              priority="normal"
              rounded={14}
            />
          ) : (
            <LinearGradient colors={grad} style={styles.thumbGrad} />
          )}
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={2}>
              {item?.name}
            </Text>
            <Text style={styles.lineTotal}>{formatINR(lineTotal)}</Text>
          </View>
          {variant ? (
            <View style={styles.variantPill}>
              <Text style={styles.variantText} numberOfLines={1}>
                {variant}
              </Text>
            </View>
          ) : null}
          <Text style={styles.unitHint}>
            {fillProductScreen(CART_UI.unitPrice, { price: formatINR(unitPrice) })}
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <View style={styles.qtyPill}>
          <Pressable
            onPress={onDecrease}
            style={({ pressed }) => [styles.qtyBtn, pressed && styles.qtyBtnPressed]}
            hitSlop={8}
            accessibilityLabel="Decrease quantity"
          >
            <Ionicons name="remove" size={16} color={inkIcon} />
          </Pressable>
          <Text style={styles.qtyNum}>{qty}</Text>
          <Pressable
            onPress={onIncrease}
            style={({ pressed }) => [styles.qtyBtn, pressed && styles.qtyBtnPressed]}
            hitSlop={8}
            accessibilityLabel="Increase quantity"
          >
            <Ionicons name="add" size={16} color={inkIcon} />
          </Pressable>
        </View>
        {onRemove ? (
          <Pressable
            onPress={onRemove}
            style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.65 }]}
            hitSlop={8}
            accessibilityLabel={CART_UI.removeItem}
          >
            <Text style={styles.removeText}>{CART_UI.removeItem}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(c, isDark) {
  return StyleSheet.create({
    row: {
      flexDirection: "column",
      gap: 14,
      paddingVertical: 14,
      paddingHorizontal: 14,
      marginBottom: 12,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? c.border : "rgba(36, 68, 36, 0.1)",
      backgroundColor: isDark ? c.surface : "#FFFEFA",
      overflow: "hidden",
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 8px 24px rgba(0,0,0,0.2)"
            : "0 10px 28px -18px rgba(36, 68, 36, 0.18)",
        },
        default: {},
      }),
    },
    rowEmbedded: {
      marginBottom: 0,
      borderRadius: 0,
      borderWidth: 0,
      backgroundColor: "transparent",
      paddingHorizontal: 16,
      paddingVertical: 16,
      ...Platform.select({
        web: { boxShadow: "none" },
        default: {},
      }),
    },
    rowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(36, 68, 36, 0.1)",
      marginBottom: 0,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 14,
      width: "100%",
    },
    thumbWrap: {
      width: 80,
      height: 80,
      borderRadius: 14,
      overflow: "hidden",
      flexShrink: 0,
      borderWidth: 1,
      borderColor: isDark ? "rgba(220,172,116,0.28)" : "rgba(220, 172, 116, 0.35)",
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : KANKREG_PALETTE.paper2,
    },
    thumbImage: {
      width: "100%",
      height: "100%",
    },
    thumbGrad: {
      flex: 1,
    },
    body: {
      flex: 1,
      minWidth: 0,
      gap: 6,
      paddingTop: 2,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
      width: "100%",
    },
    name: {
      flex: 1,
      minWidth: 0,
      fontFamily: FONT_HEADING,
      fontSize: 16,
      lineHeight: 22,
      color: isDark ? c.textPrimary : KANKREG_PALETTE.ink,
      letterSpacing: -0.2,
    },
    variantPill: {
      alignSelf: "flex-start",
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(92, 104, 52, 0.08)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? c.border : "rgba(92, 104, 52, 0.14)",
    },
    variantText: {
      fontFamily: fonts.semibold,
      fontSize: 11,
      color: isDark ? c.textSecondary : KANKREG_PALETTE.inkSoft,
      letterSpacing: 0.2,
    },
    unitHint: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: isDark ? c.textMuted : KANKREG_PALETTE.inkFaint,
    },
    actionsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      paddingTop: 2,
    },
    qtyPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      padding: 3,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: isDark ? "rgba(168,184,108,0.35)" : ZEEVAN_GREEN.border,
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : ZEEVAN_GREEN.soft,
    },
    qtyBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : KANKREG_PALETTE.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.1)" : ZEEVAN_GREEN.border,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    qtyBtnPressed: {
      opacity: 0.8,
      backgroundColor: isDark ? "rgba(168,184,108,0.18)" : "rgba(85, 107, 50, 0.18)",
    },
    qtyNum: {
      minWidth: 28,
      textAlign: "center",
      fontFamily: fonts.bold,
      fontSize: 14,
      color: isDark ? c.textPrimary : KANKREG_PALETTE.ink,
    },
    removeBtn: {
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    removeText: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: isDark ? c.textMuted : KANKREG_PALETTE.inkFaint,
      letterSpacing: 0.15,
      textDecorationLine: "underline",
      textDecorationColor: isDark ? "rgba(255,255,255,0.25)" : "rgba(138, 132, 104, 0.45)",
    },
    lineTotal: {
      flexShrink: 0,
      fontFamily: FONT_PRICE,
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? c.textPrimary : ZEEVAN_GREEN.deep,
      letterSpacing: -0.25,
      textAlign: "right",
      paddingTop: 2,
    },
  });
}
