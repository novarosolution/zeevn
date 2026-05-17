import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "../ui/Button";
import { useTheme } from "../../context/ThemeContext";
import { fonts, icon } from "../../theme/tokens";

export default function OpsPagination({ page, pageCount, onPageChange, totalLabel }) {
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const safePage = Math.max(1, Math.min(page, pageCount || 1));

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: SPACING.md,
        gap: SPACING.md,
      }}
    >
      {totalLabel ? (
        <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.caption.fontSize, color: semanticPalette.inkMuted }}>
          {totalLabel}
        </Text>
      ) : (
        <View />
      )}
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
        <Button
          variant="ghost"
          size="sm"
          label=""
          iconLeft={<Ionicons name="chevron-back" size={icon.sm} color={semanticPalette.ink} />}
          disabled={safePage <= 1}
          onPress={() => onPageChange(safePage - 1)}
          accessibilityLabel="Previous page"
        />
        <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.small.fontSize, color: semanticPalette.ink }}>
          {safePage} / {pageCount || 1}
        </Text>
        <Button
          variant="ghost"
          size="sm"
          label=""
          iconLeft={<Ionicons name="chevron-forward" size={icon.sm} color={semanticPalette.ink} />}
          disabled={safePage >= (pageCount || 1)}
          onPress={() => onPageChange(safePage + 1)}
          accessibilityLabel="Next page"
        />
      </View>
    </View>
  );
}
