import React from "react";
import { Platform, View } from "react-native";

/** Native — strip is web-only above the site footer. */
export default function WebCertificationsStrip() {
  if (Platform.OS !== "web") return null;
  return <View />;
}
