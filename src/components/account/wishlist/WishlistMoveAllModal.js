import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import { WISHLIST_SCREEN, fillPlaceholders } from "../../../content/appContent";
import { useTheme } from "../../../context/ThemeContext";
import { FONT_DISPLAY_SEMI } from "../../../theme/customerAlchemy";
import { fonts } from "../../../theme/tokens";

const copy = WISHLIST_SCREEN.moveAllModal;

export default function WishlistMoveAllModal({ visible, total, inStock, outOfStock, busy, onCancel, onConfirm }) {
  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        style={{ flex: 1, justifyContent: "center", padding: SPACING.lg, backgroundColor: "rgba(14,14,14,0.42)" }}
        onPress={onCancel}
      >
        <Pressable onPress={(e) => e.stopPropagation?.()}>
          <Card padding="lg" style={{ maxWidth: 420, width: "100%", alignSelf: "center", borderRadius: RADII.lg }}>
            <Text style={{ fontFamily: FONT_DISPLAY_SEMI, fontSize: TYPE.h3.fontSize, color: semanticPalette.ink }}>{copy.title}</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkMuted, marginTop: SPACING.sm }}>
              {fillPlaceholders(copy.bodyTemplate, { inStock: String(inStock), total: String(total) })}
            </Text>
            {outOfStock > 0 ? (
              <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.small.fontSize, color: semanticPalette.inkSoft, marginTop: SPACING.sm }}>
                {fillPlaceholders(copy.outOfStockNote, { count: String(outOfStock) })}
              </Text>
            ) : null}
            <View style={{ flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.lg }}>
              <Button label={copy.cancel} variant="ghost" size="md" style={{ flex: 1 }} onPress={onCancel} disabled={busy} />
              <Button
                label={busy ? copy.adding : copy.confirm}
                variant="primary"
                size="md"
                style={{ flex: 1 }}
                loading={busy}
                onPress={onConfirm}
              />
            </View>
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
