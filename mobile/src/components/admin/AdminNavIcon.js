import React, { useMemo } from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ADMIN_NAV_ICON_IMAGES } from "../../content/adminNav";
import { useTheme } from "../../context/ThemeContext";
import { getAdminChrome } from "../../theme/adminLayout";

/**
 * Premium nav glyph — generated icon image with Ionicons fallback.
 * Image icons already include a white rounded tile, so we avoid a double frame.
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
  const dim = compact ? Math.max(28, size - 4) : size;
  const radius = Math.round(dim * 0.26);

  if (source) {
    return (
      <View
        style={[
          styles.imageWrap,
          {
            width: dim,
            height: dim,
            borderRadius: radius,
          },
          active && styles.imageWrapActive,
          Platform.OS === "web" && active ? styles.wellActiveWeb : null,
        ]}
      >
        <Image
          source={source}
          style={{ width: dim, height: dim, borderRadius: radius }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.well,
        {
          width: dim,
          height: dim,
          borderRadius: radius,
          backgroundColor: active ? "rgba(232,200,90,0.16)" : isDark ? chrome.paper : "#F7F7F7",
          borderColor: active ? chrome.linkOnBorder : chrome.line,
        },
        tone ? { backgroundColor: `${tone}14`, borderColor: `${tone}40` } : null,
        Platform.OS === "web" && active ? styles.wellActiveWeb : null,
      ]}
    >
      <Ionicons
        name={icon || "ellipse-outline"}
        size={Math.round(dim * 0.48)}
        color={active ? chrome.goldBright : tone || chrome.inkSoft}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  imageWrap: {
    overflow: "hidden",
    ...Platform.select({
      web: {
        boxShadow: "0 1px 2px rgba(25,20,15,0.04), 0 8px 18px -12px rgba(25,20,15,0.16)",
      },
      default: {},
    }),
  },
  imageWrapActive: {
    ...Platform.select({
      web: {
        boxShadow: "0 2px 10px rgba(85,107,50,0.28)",
      },
      default: {},
    }),
  },
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
