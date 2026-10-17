import React from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import StoreGlyph from "./StoreGlyph";

/**
 * Renders a content-config icon:
 *  `{ glyph: "ghee" }` Zeevan range glyph · `{ ion: "name" }` Ionicons · `{ mci: "name" }` MaterialCommunityIcons.
 * `active` tints glyph bodies (used by the category tabs).
 */
export default function StoreIcon({ icon, size = 22, color, active = false, style }) {
  if (!icon) return null;
  if (icon.glyph) return <StoreGlyph name={icon.glyph} size={size} color={color} active={active} />;
  if (icon.mci) {
    return <MaterialCommunityIcons name={icon.mci} size={size} color={color} style={style} />;
  }
  return <Ionicons name={icon.ion} size={size} color={color} style={style} />;
}
