import React, { memo, useMemo } from "react";
import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import ProductImage from "../../ui/ProductImage";
import { useTheme } from "../../../context/ThemeContext";
import { pointerEventsProp } from "../../../utils/pointerEventsStyle";

function LifestyleBleedBase({ imageUri, caption, gutter = 0 }) {
  const { width } = useWindowDimensions();
  const { semanticPalette } = useTheme();
  const uri = String(imageUri || "").trim();
  const isDesktop = width >= 1024;
  const aspect = isDesktop ? 16 / 9 : 4 / 5;
  const cap = String(caption || "").trim();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        bleed: {
          marginHorizontal: gutter ? -gutter : 0,
          alignSelf: "stretch",
          overflow: "hidden",
          backgroundColor: semanticPalette.bgDeep,
        },
        image: { width: "100%", aspectRatio: aspect },
        captionWrap: {
          position: "absolute",
          left: 16,
          bottom: 16,
          maxWidth: "80%",
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 6,
          backgroundColor: "rgba(0,0,0,0.4)",
          ...Platform.select({
            web: { backdropFilter: "blur(8px)" },
            default: {},
          }),
        },
        caption: {
          fontFamily: "System",
          fontSize: 11,
          letterSpacing: 0.12 * 11,
          textTransform: "uppercase",
          color: semanticPalette.inkInverseSoft,
        },
      }),
    [aspect, gutter, semanticPalette]
  );

  if (!uri) return null;

  return (
    <View style={styles.bleed}>
      <ProductImage uri={uri} style={styles.image} contentFit="cover" transition={240} lazy />
      {cap ? (
        <View style={styles.captionWrap} {...pointerEventsProp("none")}>
          <Text style={styles.caption}>{cap}</Text>
        </View>
      ) : null}
    </View>
  );
}

const LifestyleBleed = memo(LifestyleBleedBase);

export default LifestyleBleed;
