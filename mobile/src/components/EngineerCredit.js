import React from "react";
import { Linking, Platform, StyleSheet, Text } from "react-native";
import { APP_ENGINEER_CREDIT } from "../content/appContent";
import { fonts, typography } from "../theme/tokens";

/** “Created by …” footer credit with external studio link. */
export default function EngineerCredit({ style, textStyle, linkStyle }) {
  const prefix = String(APP_ENGINEER_CREDIT?.prefix || "Created by ").trimEnd();
  const name = String(APP_ENGINEER_CREDIT?.name || "").trim();
  const url = String(APP_ENGINEER_CREDIT?.url || "").trim();

  if (!name || !url) return null;

  const openUrl = () => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Text style={[styles.line, style, textStyle]}>
      {prefix}{" "}
      <Text
        style={[styles.link, linkStyle]}
        onPress={openUrl}
        accessibilityRole="link"
        accessibilityLabel={`${prefix} ${name}`}
      >
        {name}
      </Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  line: {
    fontSize: typography.caption,
    fontFamily: fonts.medium,
    ...Platform.select({ web: { cursor: "default" }, default: {} }),
  },
  link: {
    fontFamily: fonts.bold,
    textDecorationLine: Platform.OS === "web" ? "underline" : "none",
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
});
