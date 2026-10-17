import React from "react";
import { Platform, View } from "react-native";

export default function WebWhyChooseSection() {
  if (Platform.OS !== "web") return null;
  return <View />;
}
