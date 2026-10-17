import React from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

/** Renders `{ ion: "name" }` (Ionicons) or `{ mci: "name" }` (MaterialCommunityIcons) from content config. */
export default function StoreIcon({ icon, size = 22, color, style }) {
  if (!icon) return null;
  if (icon.mci) {
    return <MaterialCommunityIcons name={icon.mci} size={size} color={color} style={style} />;
  }
  return <Ionicons name={icon.ion} size={size} color={color} style={style} />;
}
