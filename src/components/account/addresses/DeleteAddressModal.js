import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import { ADDRESSES_SCREEN } from "../../../content/appContent";
import { useTheme } from "../../../context/ThemeContext";
import { FONT_DISPLAY_SEMI } from "../../../theme/customerAlchemy";
import { fonts } from "../../../theme/tokens";
import { formatAddressLines, tagLabel } from "../../../utils/savedAddresses";

const copy = ADDRESSES_SCREEN.deleteModal;

export default function DeleteAddressModal({ visible, address, busy, onCancel, onConfirm }) {
  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();
  const preview = address ? formatAddressLines(address).slice(0, 2).join(" · ") : "";
  const tag = address ? tagLabel(address) : "";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        style={{ flex: 1, justifyContent: "center", padding: SPACING.lg, backgroundColor: "rgba(14,14,14,0.42)" }}
        onPress={onCancel}
      >
        <Pressable onPress={(e) => e.stopPropagation?.()}>
          <Card padding="lg" style={{ maxWidth: 420, width: "100%", alignSelf: "center", borderRadius: RADII.lg }}>
            <Text style={{ fontFamily: FONT_DISPLAY_SEMI, fontSize: TYPE.h3.fontSize, color: semanticPalette.ink }}>
              {copy.title}
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkMuted, marginTop: SPACING.sm }}>
              {ADDRESSES_SCREEN.deleteModal.body}
            </Text>
            {address ? (
              <View
                style={{
                  marginTop: SPACING.md,
                  padding: SPACING.md,
                  borderRadius: RADII.md,
                  backgroundColor: semanticPalette.surfaceAlt,
                }}
              >
                <Text style={{ fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1.2, color: semanticPalette.accent }}>
                  {tag}
                </Text>
                {address.fullName ? (
                  <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.ink, marginTop: 4 }}>
                    {address.fullName}
                  </Text>
                ) : null}
                <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.small.fontSize, color: semanticPalette.inkSoft, marginTop: 4 }}>
                  {preview}
                </Text>
              </View>
            ) : null}
            <View style={{ flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.lg }}>
              <Button label={copy.cancel} variant="ghost" size="md" style={{ flex: 1 }} onPress={onCancel} disabled={busy} />
              <Button
                label={busy ? ADDRESSES_SCREEN.deleteModal.deleting : copy.confirm}
                variant="destructive"
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
