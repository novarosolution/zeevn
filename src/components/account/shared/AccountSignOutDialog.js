import React, { useRef } from "react";
import { Modal, Text, View } from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { ACCOUNT_UI, APP_DISPLAY_NAME, fillPlaceholders } from "../../../content/appContent";
import { fonts } from "../../../theme/tokens";
import { WEB_Z_INDEX, webDialogLayerStyle, webOverlayRootStyle, webOverlayScrimStyle } from "../../../theme/web";
import Button from "../../ui/Button";
import Card from "../../ui/Card";
import useModalA11y from "../../../hooks/useModalA11y";
import { pointerEventsProp } from "../../../utils/pointerEventsStyle";

export default function AccountSignOutDialog({ visible, busy, onCancel, onConfirm }) {
  const { semanticPalette, TYPE, SPACING, RADII, isDark } = useTheme();
  const containerRef = useRef(null);

  useModalA11y({ visible, onClose: onCancel, containerRef });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View
        ref={containerRef}
        style={[
          { flex: 1, justifyContent: "center", padding: SPACING.lg },
          webOverlayRootStyle(WEB_Z_INDEX.dialog),
        ]}
        accessibilityViewIsModal
      >
        <View
          style={[webOverlayScrimStyle(isDark), { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }]}
          {...pointerEventsProp("none")}
        />
        <Card
          padding="lg"
          style={[
            { borderRadius: RADII.lg, maxWidth: 400, width: "100%", alignSelf: "center" },
            webDialogLayerStyle(),
          ]}
        >
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
              variant="ghost"
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
