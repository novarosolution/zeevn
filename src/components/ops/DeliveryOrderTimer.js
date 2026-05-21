import React from "react";
import { Text } from "react-native";
import useElapsedTimer from "../../hooks/useElapsedTimer";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";

/** Compact elapsed timer for delivery order rows. */
export default function DeliveryOrderTimer({ startedAt }) {
  const { semanticPalette, TYPE } = useTheme();
  const { label } = useElapsedTimer(startedAt);

  return (
    <Text
      style={{
        fontFamily: TYPE.serifFamily,
        fontSize: TYPE.body.fontSize,
        color: semanticPalette.accent,
      }}
    >
      {label}
    </Text>
  );
}
