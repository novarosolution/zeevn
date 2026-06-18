import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { CART_UI } from "../../content/appContent";
import { fonts, spacing } from "../../theme/tokens";

/** Premium coupon row — flex input row + applied status line. */
export default function KankregCartCouponStrip({
  value,
  onChangeText,
  onApply,
  appliedLabel,
  placeholder = CART_UI.couponPlaceholder,
}) {
  const { colors: c, isDark } = useTheme();
  const styles = useMemo(() => createStyles(isDark, c), [isDark, c]);

  return (
    <View style={styles.shell}>
      <View style={styles.mainRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="pricetag-outline" size={16} color={isDark ? c.primaryBright : KANKREG_PALETTE.goldDeep} />
        </View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={styles.placeholderColor}
          autoCapitalize="characters"
          returnKeyType="done"
          onSubmitEditing={onApply}
          style={styles.input}
        />
        <Pressable
          onPress={onApply}
          style={({ pressed, hovered }) => [
            styles.applyBtn,
            Platform.OS === "web" && hovered && styles.applyBtnHover,
            pressed && styles.applyBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={CART_UI.couponApply}
        >
          <Text style={styles.applyText}>{CART_UI.couponApply}</Text>
        </Pressable>
      </View>
      {appliedLabel ? (
        <View style={styles.appliedRow}>
          <Ionicons name="checkmark-circle" size={14} color={KANKREG_PALETTE.green} />
          <Text style={styles.applied} numberOfLines={1}>
            {appliedLabel}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function createStyles(isDark, c) {
  const bg = isDark ? c.surfaceMuted : "#FFFEFA";
  const border = isDark ? "rgba(52, 211, 153, 0.25)" : "rgba(31, 92, 71, 0.35)";
  const text = isDark ? c.textPrimary : KANKREG_PALETTE.ink;
  const placeholderColor = isDark ? c.textMuted : KANKREG_PALETTE.inkFaint;

  return {
    ...StyleSheet.create({
      shell: {
        flexDirection: "column",
        gap: 8,
        padding: spacing.sm + 2,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: isDark ? c.border : KANKREG_PALETTE.line,
        borderTopWidth: 2,
        borderTopColor: isDark ? "rgba(52, 211, 153, 0.45)" : KANKREG_PALETTE.gold,
        backgroundColor: bg,
        width: "100%",
      },
      mainRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        width: "100%",
      },
      iconWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isDark ? "rgba(52, 211, 153, 0.12)" : "rgba(31, 92, 71, 0.1)",
        flexShrink: 0,
      },
      input: {
        flex: 1,
        minWidth: 0,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: border,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === "web" ? 10 : 9,
        fontFamily: fonts.medium,
        fontSize: 12,
        color: text,
        backgroundColor: isDark ? c.surface : KANKREG_PALETTE.card,
      },
      applyBtn: {
        flexShrink: 0,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: isDark ? c.primaryBorder : KANKREG_PALETTE.gold,
        backgroundColor: isDark ? "rgba(52, 211, 153, 0.12)" : "rgba(31, 92, 71, 0.1)",
      },
      applyBtnHover: {
        backgroundColor: isDark ? "rgba(52, 211, 153, 0.18)" : "rgba(31, 92, 71, 0.16)",
      },
      applyBtnPressed: {
        opacity: 0.88,
      },
      applyText: {
        fontFamily: fonts.bold,
        fontSize: 11,
        color: isDark ? c.primaryBright : KANKREG_PALETTE.goldDeep,
        letterSpacing: 0.3,
      },
      appliedRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        width: "100%",
        paddingHorizontal: 2,
      },
      applied: {
        flex: 1,
        minWidth: 0,
        fontFamily: fonts.semibold,
        fontSize: 11,
        color: KANKREG_PALETTE.green,
      },
    }),
    placeholderColor,
  };
}
