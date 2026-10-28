import React, { memo, useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { ADMIN_FONT, useAdminChrome } from "../../theme/adminLayout";

/** Admin loading indicator: small spinner and a plain caption. Same props as the shop's PremiumLoader. */
function AdminLoaderBase({ size = "md", caption, hint, inline = false, color, style }) {
  const chrome = useAdminChrome();
  const styles = useMemo(() => createStyles(chrome, inline, size), [chrome, inline, size]);

  return (
    <View style={[styles.wrap, style]} accessibilityRole="progressbar" accessibilityLabel={caption || "Loading"}>
      <ActivityIndicator size={size === "sm" || inline ? "small" : "large"} color={color || chrome.goldDeep} />
      {caption ? (
        <Text style={styles.caption} numberOfLines={2}>
          {caption}
        </Text>
      ) : null}
      {hint ? (
        <Text style={styles.hint} numberOfLines={3}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

function createStyles(chrome, inline, size) {
  return StyleSheet.create({
    wrap: {
      flexDirection: inline ? "row" : "column",
      alignItems: "center",
      justifyContent: "center",
      gap: inline ? 8 : 10,
      paddingVertical: inline ? 0 : size === "sm" ? 16 : 32,
    },
    caption: { fontSize: size === "sm" ? 13 : 14, color: chrome.inkSoft, fontFamily: ADMIN_FONT.medium, textAlign: "center" },
    hint: { fontSize: 12, color: chrome.inkFaint, fontFamily: ADMIN_FONT.regular, textAlign: "center", maxWidth: 320 },
  });
}

export default memo(AdminLoaderBase);
