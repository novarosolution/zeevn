import React, { memo } from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "../../ui/Card";
import IconGhostButton from "../shared/IconGhostButton";
import { PAYMENT_SCREEN, fillPlaceholders } from "../../../content/appContent";
import { useTheme } from "../../../context/ThemeContext";
import { fonts, icon } from "../../../theme/tokens";

const copy = PAYMENT_SCREEN;

function UpiRowBase({ upi, onDelete }) {
  const { semanticPalette, TYPE, SPACING } = useTheme();

  return (
    <Card padding="md">
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.md }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: semanticPalette.surfaceAlt,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="phone-portrait-outline" size={icon.md} color={semanticPalette.accent} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.caption.fontSize, color: semanticPalette.inkMuted }}>
            {upi.provider}
          </Text>
          <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.ink, marginTop: 2 }}>
            {fillPlaceholders(copy.maskedUpiTemplate, { masked: upi.masked })}
          </Text>
        </View>
        <IconGhostButton name="trash-outline" onPress={onDelete} accessibilityLabel={copy.deleteUpiA11y} />
      </View>
    </Card>
  );
}

const UpiRow = memo(UpiRowBase);
export default UpiRow;
