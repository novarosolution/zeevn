import React, { useMemo } from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ADMIN_NAV_ICON_IMAGES } from "../../content/adminNav";
import { useTheme } from "../../context/ThemeContext";
import { getAdminChrome } from "../../theme/adminLayout";

/**
 * Premium nav glyph — generated icon image with Ionicons fallback.
 */
export default function AdminNavIcon({
  imageKey,
  icon,
  tone,
  size = 36,
  active = false,
  compact = false,
}) {
  const { colors: c, isDark } = useTheme();
  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
  const source = imageKey ? ADMIN_NAV_ICON_IMAGES[imageKey] : null;
  const dim = compact ? Math.max(28, size - 6) : size;
  const radius = Math.round(dim * 0.28);

  return (
    <View
      style={[
        styles.well,
        {
          width: dim,
          height: dim,
          borderRadius: radius,
          backgroundColor: active ? "rgba(232,200,90,0.16)" : chrome.paper,
          borderColor: active ? chrome.linkOnBorder : chrome.line,
        },
        tone && !source
          ? { backgroundColor: `${tone}18`, borderColor: `${tone}44` }
          : null,
        Platform.OS === "web" && active ? styles.wellActiveWeb : null,
      ]}
    >
      {source ? (
        <Image source={source} style={{ width: dim - 4, height: dim - 4, borderRadius: radius - 2 }} />
      ) : (
        <Ionicons
          name={icon || "ellipse-outline"}
          size={Math.round(dim * 0.48)}
          color={active ? chrome.goldBright : tone || chrome.inkSoft}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  well: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  wellActiveWeb: {
    boxShadow: "0 2px 10px rgba(169,119,46,0.22)",
  },
});
