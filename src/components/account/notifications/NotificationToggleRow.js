import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PremiumSwitch from "../../ui/PremiumSwitch";
import { useTheme } from "../../../context/ThemeContext";
import { fonts } from "../../../theme/tokens";

function NotificationToggleRowBase({ label, helper, value, onValueChange, locked = false, isFirst = false }) {
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const disabled = locked;

  return (
    <View
      style={[
        styles.row,
        {
          borderTopWidth: isFirst ? 0 : StyleSheet.hairlineWidth,
          borderTopColor: semanticPalette.lineSoft,
          paddingVertical: SPACING.md,
        },
      ]}
    >
      <View style={{ flex: 1, minWidth: 0, paddingRight: SPACING.md }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }}>{label}</Text>
          {locked ? <Ionicons name="lock-closed" size={14} color={semanticPalette.inkMuted} /> : null}
        </View>
        {helper ? (
          <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.small.fontSize, color: semanticPalette.inkMuted, marginTop: 4 }}>
            {helper}
          </Text>
        ) : null}
      </View>
      <PremiumSwitch value={Boolean(value)} onValueChange={onValueChange} disabled={disabled} locked={locked} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

const NotificationToggleRow = memo(NotificationToggleRowBase);
export default NotificationToggleRow;
