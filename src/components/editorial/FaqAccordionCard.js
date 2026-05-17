import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "../ui/Card";
import { useTheme } from "../../context/ThemeContext";
import { fonts, icon } from "../../theme/tokens";

export default function FaqAccordionCard({ item, helpfulPrompt, defaultOpen = false }) {
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  const [helpful, setHelpful] = useState(null);

  return (
    <Card padding="md" style={{ marginBottom: SPACING.md }}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={({ pressed }) => [{ flexDirection: "row", alignItems: "flex-start", gap: SPACING.sm }, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }}>{item.q}</Text>
        </View>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={icon.sm} color={semanticPalette.inkMuted} />
      </Pressable>
      {open ? (
        <View style={{ marginTop: SPACING.md }}>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: TYPE.bodyLg.fontSize,
              lineHeight: TYPE.bodyLg.lineHeight * 1.6,
              color: semanticPalette.inkSoft,
            }}
          >
            {item.a}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: SPACING.md,
              marginTop: SPACING.lg,
              paddingTop: SPACING.md,
              borderTopWidth: Platform.OS === "web" ? 0 : StyleSheet.hairlineWidth,
              borderTopColor: semanticPalette.line,
            }}
          >
            <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.caption.fontSize, color: semanticPalette.inkMuted }}>
              {helpfulPrompt}
            </Text>
            <Pressable
              onPress={() => setHelpful("yes")}
              accessibilityRole="button"
              accessibilityLabel="Yes, helpful"
              style={({ pressed, hovered }) => [
                {
                  padding: SPACING.sm,
                  borderRadius: 999,
                  backgroundColor: helpful === "yes" ? semanticPalette.accentSoft : semanticPalette.surfaceAlt,
                },
                hovered && Platform.OS === "web" ? { opacity: 0.9 } : null,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Ionicons
                name={helpful === "yes" ? "thumbs-up" : "thumbs-up-outline"}
                size={icon.sm}
                color={semanticPalette.ink}
              />
            </Pressable>
            <Pressable
              onPress={() => setHelpful("no")}
              accessibilityRole="button"
              accessibilityLabel="No, not helpful"
              style={({ pressed, hovered }) => [
                {
                  padding: SPACING.sm,
                  borderRadius: 999,
                  backgroundColor: helpful === "no" ? semanticPalette.surfaceAlt : semanticPalette.surfaceAlt,
                },
                hovered && Platform.OS === "web" ? { opacity: 0.9 } : null,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Ionicons
                name={helpful === "no" ? "thumbs-down" : "thumbs-down-outline"}
                size={icon.sm}
                color={semanticPalette.inkMuted}
              />
            </Pressable>
          </View>
        </View>
      ) : null}
    </Card>
  );
}
