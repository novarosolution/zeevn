import React, { memo } from "react";
import { Platform, Text, View } from "react-native";
import { srOnlyStyle } from "../../utils/a11y";

/**
 * Screen-reader live region (polite by default). Re-announce when `message` changes.
 */
function LiveRegionBase({ message = "", politeness = "polite" }) {
  const text = String(message || "").trim();
  if (!text) return null;

  if (Platform.OS === "web") {
    return (
      <div role="status" aria-live={politeness} aria-atomic="true" style={srOnlyStyle}>
        {text}
      </div>
    );
  }

  return (
    <View style={srOnlyStyle} accessibilityLiveRegion={politeness} accessible>
      <Text accessible accessibilityRole="text">
        {text}
      </Text>
    </View>
  );
}

const LiveRegion = memo(LiveRegionBase);

export default LiveRegion;
