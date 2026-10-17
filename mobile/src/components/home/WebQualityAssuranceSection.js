import React from "react";
import { Platform, View } from "react-native";

/** Native — section is web-only. */
export default function WebQualityAssuranceSection() {
  if (Platform.OS !== "web") return null;
  return <View />;
}
