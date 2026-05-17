import React, { useRef } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import { ACCOUNT_PROFILE_SCREEN } from "../../../content/appContent";
import { useTheme } from "../../../context/ThemeContext";
import { FONT_DISPLAY_SEMI } from "../../../theme/customerAlchemy";
import { fonts } from "../../../theme/tokens";
import useModalA11y from "../../../hooks/useModalA11y";

const copy = ACCOUNT_PROFILE_SCREEN.conflictModal;

export default function ProfileConflictModal({ visible, busy, onCancel, onRefresh, onOverwrite }) {
  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();
  const containerRef = useRef(null);
  useModalA11y({ visible, onClose: onCancel, containerRef });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        ref={containerRef}
        style={{ flex: 1, justifyContent: "center", padding: SPACING.lg, backgroundColor: "rgba(14,14,14,0.42)" }}
        onPress={onCancel}
      >
        <Pressable onPress={(e) => e.stopPropagation?.()} accessibilityViewIsModal>
          <Card padding="lg" style={{ maxWidth: 420, width: "100%", alignSelf: "center", borderRadius: RADII.lg }}>
            <Text style={{ fontFamily: FONT_DISPLAY_SEMI, fontSize: TYPE.h3.fontSize, color: semanticPalette.ink }}>{copy.title}</Text>
            <Text style={{ marginTop: SPACING.sm, fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkSoft }}>
              {copy.body}
            </Text>
            <View style={{ flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.lg }}>
              <Button label={copy.cancel} variant="ghost" size="md" style={{ flex: 1 }} onPress={onCancel} disabled={busy} />
              <Button label={copy.refresh} variant="secondary" size="md" style={{ flex: 1 }} onPress={onRefresh} disabled={busy} />
              <Button label={copy.overwrite} variant="primary" size="md" style={{ flex: 1 }} loading={busy} onPress={onOverwrite} />
            </View>
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
