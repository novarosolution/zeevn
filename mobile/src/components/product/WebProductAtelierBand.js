import React from "react";
import { Platform, View } from "react-native";

/** Native — atelier band is web-only. */
export default function WebProductAtelierBand() {
  if (Platform.OS !== "web") return null;
  return <View />;
}
