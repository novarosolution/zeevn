import React from "react";
import { View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

/**
 * Embedded map for contact page (web).
 */
export default function ContactMap({ embedUrl, style }) {
  const { RADII, semanticPalette } = useTheme();

  if (!embedUrl) return null;

  return (
    <View
      style={[
        {
          borderRadius: RADII.lg,
          overflow: "hidden",
          height: 220,
          backgroundColor: semanticPalette.surfaceAlt,
        },
        style,
      ]}
    >
      <iframe
        title="Studio location"
        src={embedUrl}
        style={{ border: 0, width: "100%", height: "100%" }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </View>
  );
}
