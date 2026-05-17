import React, { memo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { fonts } from "../../../theme/tokens";

function NotificationChannelTabsBase({ channels, activeKey, onChange }) {
  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: SPACING.sm, paddingBottom: SPACING.xs }}
      accessibilityRole="tablist"
    >
      {channels.map((ch) => {
        const active = ch.key === activeKey;
        return (
          <Pressable
            key={ch.key}
            onPress={() => onChange(ch.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={({ pressed, hovered }) => [
              styles.pill,
              {
                borderRadius: RADII.pill,
                borderColor: active ? semanticPalette.accent : semanticPalette.line,
                backgroundColor: active ? semanticPalette.accentSoft : semanticPalette.surface,
              },
              hovered && Platform.OS === "web" ? { opacity: 0.92 } : null,
              pressed ? { opacity: 0.88 } : null,
            ]}
          >
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: TYPE.caption.fontSize,
                color: active ? semanticPalette.accent : semanticPalette.inkSoft,
              }}
            >
              {ch.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
});

const NotificationChannelTabs = memo(NotificationChannelTabsBase);
export default NotificationChannelTabs;
