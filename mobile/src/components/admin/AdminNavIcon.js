import React, { useMemo } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ADMIN_NAV_ICON_IMAGES } from "../../content/adminNav";
import { useTheme } from "../../context/ThemeContext";
import { getAdminChrome } from "../../theme/adminLayout";

/** Sidebar / tool glyph — Ionicons first; image only if a key is passed. */
export default function AdminNavIcon({
  imageKey,
  icon,
  tone,
  size = 36,
  active = false,
  compact = false,
  onInk = false,
}) {
  const { colors: c, isDark } = useTheme();
  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
  const source = imageKey ? ADMIN_NAV_ICON_IMAGES[imageKey] : null;
  const dim = compact ? Math.max(28, size - 4) : size;
  const radius = Math.round(dim * 0.26);
  const idle = tone || (onInk ? "rgba(246, 241, 228, 0.55)" : chrome.inkSoft);

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
    <View style={[styles.well, { width: dim, height: dim }]}>
      <Ionicons
        name={icon || "ellipse-outline"}
        size={Math.round(dim * 0.58)}
        color={active ? chrome.goldBright : idle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  imageWrap: {
    overflow: "hidden",
  },
  well: {
    alignItems: "center",
    justifyContent: "center",
  },
});
