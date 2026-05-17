import React, { useRef } from "react";
import { Modal, Text, View } from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { ACCOUNT_UI, APP_DISPLAY_NAME, fillPlaceholders } from "../../../content/appContent";
import { fonts } from "../../../theme/tokens";
import Button from "../../ui/Button";
import Card from "../../ui/Card";
import useModalA11y from "../../../hooks/useModalA11y";

export default function AccountSignOutDialog({ visible, busy, onCancel, onConfirm }) {
  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();
  const containerRef = useRef(null);

  useModalA11y({ visible, onClose: onCancel, containerRef });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View
        ref={containerRef}
        style={{ flex: 1, justifyContent: "center", padding: SPACING.lg, backgroundColor: "rgba(14,14,14,0.42)" }}
      >
        <Card padding="lg" style={{ borderRadius: RADII.lg, maxWidth: 400, width: "100%", alignSelf: "center" }}>
          <Text
            style={{
              fontFamily: fonts.semibold,
              fontSize: TYPE.h3.fontSize,
              lineHeight: TYPE.h3.lineHeight,
              color: semanticPalette.ink,
            }}
          >
            {fillPlaceholders(ACCOUNT_UI.signOutConfirmTitle, { brand: APP_DISPLAY_NAME })}
          </Text>
          <View style={{ flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.lg }}>
            <Button label={ACCOUNT_UI.cancelCta} variant="secondary" size="md" style={{ flex: 1 }} onPress={onCancel} disabled={busy} />
            <Button
              label={ACCOUNT_UI.signOutConfirmCta}
              variant="primary"
              size="md"
              style={{ flex: 1 }}
              loading={busy}
              onPress={onConfirm}
            />
          </View>
        </Card>
      </View>
    </Modal>
  );
}
