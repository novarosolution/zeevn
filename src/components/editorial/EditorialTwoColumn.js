import React from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";

/**
 * Editorial section: image + prose, stacks on narrow viewports.
 */
export default function EditorialTwoColumn({ title, body, image, imageFirst = true }) {
  const { width } = useWindowDimensions();
  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();
  const stacked = width < 768;

  const imageBlock = (
    <View
      style={{
        flex: stacked ? undefined : 1,
        width: stacked ? "100%" : undefined,
        aspectRatio: 4 / 3,
        borderRadius: RADII.lg,
        overflow: "hidden",
        backgroundColor: semanticPalette.surfaceAlt,
      }}
    >
      {image ? (
        <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      ) : null}
    </View>
  );

  const proseBlock = (
    <View style={{ flex: stacked ? undefined : 1, justifyContent: "center", gap: SPACING.md }}>
      <Text
        style={{
          fontFamily: TYPE.serifFamily,
          ...TYPE.h2,
          color: semanticPalette.ink,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: fonts.regular,
          fontSize: TYPE.bodyLg.fontSize,
          lineHeight: TYPE.bodyLg.lineHeight * 1.6,
          color: semanticPalette.inkSoft,
        }}
      >
        {body}
      </Text>
    </View>
  );

  return (
    <View
      style={{
        flexDirection: stacked ? "column" : "row",
        gap: SPACING["2xl"],
        marginBottom: SPACING["3xl"],
        alignItems: stacked ? "stretch" : "center",
      }}
    >
      {imageFirst ? (
        <>
          {imageBlock}
          {proseBlock}
        </>
      ) : (
        <>
          {proseBlock}
          {imageBlock}
        </>
      )}
    </View>
  );
}
