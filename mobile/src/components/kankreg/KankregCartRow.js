import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { FONT_BODY_SEMIBOLD, FONT_PRICE } from "../../theme/typographyRoles";
import { formatINR } from "../../utils/currency";
import { getProductThumbImageUri } from "../../utils/image";
import ProgressiveProductImage from "../ui/ProgressiveProductImage";
import { CART_UI, fillProductScreen } from "../../content/appContent";
import { fonts, spacing } from "../../theme/tokens";
import { platformShadow } from "../../theme/shadowPlatform";

/** Premium cart line — product thumb, qty stepper, line total. */
export default function KankregCartRow({
  item,
  index = 0,
  onDecrease,
  onIncrease,
  onRemove,
}) {
  const { colors: c, isDark } = useTheme();
  const styles = useMemo(() => createStyles(c, isDark), [c, isDark]);
  const grad = ["#f5ead0", "#ebe2d0", "#e8dcc8"];
  const unitPrice = Number(item?.price) || 0;
  const qty = Math.max(1, Number(item?.quantity) || 1);
  const lineTotal = unitPrice * qty;
  const variant = String(item?.variantLabel || item?.unit || "").trim();
  const imageUri = item?.image ? String(item.image) : "";
  const thumbPreview = getProductThumbImageUri(imageUri);

  return (
    <View style={styles.row}>
      <View style={styles.accentBar} pointerEvents="none" />
      <View style={styles.thumbWrap}>
        {imageUri ? (
          <ProgressiveProductImage
            uri={imageUri}
            previewUri={thumbPreview}
            style={styles.thumbImage}
            contentFit="cover"
            priority="normal"
            rounded={12}
          />
        ) : (
          <LinearGradient colors={grad} style={styles.thumbGrad} />
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {item?.name}
        </Text>
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

        <View style={styles.qtyRow}>
          <View style={styles.qtyPill}>
            <Pressable
              onPress={onDecrease}
              style={({ pressed }) => [styles.qtyBtn, pressed && styles.qtyBtnPressed]}
              hitSlop={6}
              accessibilityLabel="Decrease quantity"
            >
              <Ionicons name="remove" size={15} color="#fff" />
            </Pressable>
            <Text style={styles.qtyNum}>{qty}</Text>
            <Pressable
              onPress={onIncrease}
              style={({ pressed }) => [styles.qtyBtn, pressed && styles.qtyBtnPressed]}
              hitSlop={6}
              accessibilityLabel="Increase quantity"
            >
              <Ionicons name="add" size={15} color="#fff" />
            </Pressable>
          </View>
          {onRemove ? (
            <Pressable
              onPress={onRemove}
              style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.7 }]}
              hitSlop={8}
              accessibilityLabel={CART_UI.removeItem}
            >
              <Ionicons name="trash-outline" size={14} color={isDark ? c.textMuted : KANKREG_PALETTE.inkFaint} />
              <Text style={styles.removeText}>{CART_UI.removeItem}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.priceCol}>
        <Text style={styles.lineTotal}>{formatINR(lineTotal)}</Text>
      </View>
    </View>
  );
}

function createStyles(c, isDark) {
  const cardBg = isDark ? c.surface : "#FFFEFA";
  const border = isDark ? c.border : KANKREG_PALETTE.line;

  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      padding: 12,
      marginBottom: 12,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
      backgroundColor: cardBg,
      overflow: "hidden",
      ...platformShadow({
        web: {
          boxShadow: isDark
            ? "0 10px 28px rgba(0,0,0,0.22)"
            : "0 8px 22px rgba(22, 69, 51, 0.07), inset 0 1px 0 rgba(255,255,255,0.92)",
        },
        ios: {
          shadowColor: "#3D2A12",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.14 : 0.07,
          shadowRadius: 12,
        },
        android: { elevation: 3 },
      }),
    },
    accentBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: isDark ? "rgba(52, 211, 153, 0.55)" : KANKREG_PALETTE.gold,
    },
    thumbWrap: {
      width: 72,
      height: 72,
      borderRadius: 12,
      overflow: "hidden",
      flexShrink: 0,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(52, 211, 153, 0.2)" : "rgba(31, 92, 71, 0.22)",
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
      paddingTop: 2,
    },
    name: {
      fontFamily: FONT_BODY_SEMIBOLD,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "600",
      color: isDark ? c.textPrimary : KANKREG_PALETTE.ink,
      letterSpacing: -0.2,
    },
    variantPill: {
      alignSelf: "flex-start",
      marginTop: 5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(31, 92, 71, 0.08)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? c.border : "rgba(31, 92, 71, 0.15)",
    },
    variantText: {
      fontFamily: fonts.semibold,
      fontSize: 10,
      color: isDark ? c.textSecondary : KANKREG_PALETTE.inkSoft,
      letterSpacing: 0.3,
    },
    unitHint: {
      marginTop: 4,
      fontFamily: fonts.regular,
      fontSize: 10,
      color: isDark ? c.textMuted : KANKREG_PALETTE.inkFaint,
    },
    qtyRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 10,
    },
    qtyPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 4,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(25, 20, 15, 0.04)",
    },
    qtyBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: isDark ? KANKREG_PALETTE.ink : KANKREG_PALETTE.ink,
      alignItems: "center",
      justifyContent: "center",
    },
    qtyBtnPressed: {
      opacity: 0.85,
    },
    qtyNum: {
      minWidth: 24,
      textAlign: "center",
      fontFamily: fonts.bold,
      fontSize: 13,
      color: isDark ? c.textPrimary : KANKREG_PALETTE.ink,
    },
    removeBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
    removeText: {
      fontFamily: fonts.semibold,
      fontSize: 10,
      color: isDark ? c.textMuted : KANKREG_PALETTE.inkFaint,
      letterSpacing: 0.2,
    },
    priceCol: {
      flexShrink: 0,
      alignItems: "flex-end",
      paddingTop: 2,
    },
    lineTotal: {
      fontFamily: FONT_PRICE,
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? c.textPrimary : KANKREG_PALETTE.ink,
      letterSpacing: -0.2,
    },
  });
}
