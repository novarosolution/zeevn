import React from "react";
import { Image } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import StoreGlyph from "./StoreGlyph";

/**
 * Renders a content-config icon:
 *  `{ image }` 4K PNG · `{ glyph: "ghee" }` range glyph · `{ ion }` Ionicons · `{ mci }` MaterialCommunityIcons.
 * `active` tints glyph bodies (used by the category tabs).
 */
export default function StoreIcon({ icon, size = 22, color, active = false, style }) {
  if (!icon) return null;
  if (icon.image) {
    return (
      <Image
        source={icon.image}
        style={[{ width: size, height: size, tintColor: icon.tint === false ? undefined : color }, style]}
        resizeMode={icon.cover ? "cover" : "contain"}
        accessibilityIgnoresInvertColors
      />
    );
  }
  if (icon.glyph) return <StoreGlyph name={icon.glyph} size={size} color={color} active={active} />;
  if (icon.mci) {
    return <MaterialCommunityIcons name={icon.mci} size={size} color={color} style={style} />;
  }
  return <Ionicons name={icon.ion} size={size} color={color} style={style} />;
}
