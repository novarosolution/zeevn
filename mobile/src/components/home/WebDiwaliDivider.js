import React from "react";
import { Platform, View } from "react-native";

export default function WebDiwaliDivider() {
  if (Platform.OS !== "web") return null;
  return <View />;
}
