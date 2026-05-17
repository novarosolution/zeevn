import React from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "../../ui/Card";
import { WISHLIST_SCREEN } from "../../../content/appContent";
import { useTheme } from "../../../context/ThemeContext";
import { FONT_DISPLAY_SEMI } from "../../../theme/customerAlchemy";
import { fonts } from "../../../theme/tokens";

const copy = WISHLIST_SCREEN;

export default function WishlistSortModal({ visible, activeSort, onSelect, onClose }) {
  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(14,14,14,0.38)" }} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation?.()}>
          <Card
            padding="lg"
            style={{
              borderTopLeftRadius: RADII.lg,
              borderTopRightRadius: RADII.lg,
              ...Platform.select({ web: { maxWidth: 400, alignSelf: "center", width: "100%", marginBottom: 24, borderRadius: RADII.lg }, default: {} }),
            }}
          >
            <Text style={{ fontFamily: FONT_DISPLAY_SEMI, fontSize: TYPE.h3.fontSize, color: semanticPalette.ink, marginBottom: SPACING.md }}>
              {copy.sortTitle}
            </Text>
            {copy.sortOptions.map((opt, idx) => {
              const active = activeSort === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => {
                    onSelect(opt.id);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: SPACING.md,
                      borderTopWidth: idx === 0 ? 0 : StyleSheet.hairlineWidth,
                      borderTopColor: semanticPalette.lineSoft,
                    },
                    pressed ? { opacity: 0.85 } : null,
                  ]}
                >
                  <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }}>{opt.label}</Text>
                  {active ? <Ionicons name="checkmark" size={20} color={semanticPalette.accent} /> : null}
                </Pressable>
              );
            })}
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
