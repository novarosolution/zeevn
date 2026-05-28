import React from "react";
import { Platform, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";

export default function Tooltip({ text, visible }) {
  const { semanticPalette, RADII, TYPE } = useTheme();
  if (Platform.OS !== "web" || !visible || !text) return null;
  return (
    <View
      role="tooltip"
      style={{
        position: "absolute",
        zIndex: 1000,
        backgroundColor: semanticPalette.bgDeep,
        borderRadius: RADII.sm,
        paddingHorizontal: 8,
        paddingVertical: 6,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.medium,
          fontSize: TYPE.micro.fontSize,
          lineHeight: TYPE.micro.lineHeight,
          color: semanticPalette.inkInverse,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
