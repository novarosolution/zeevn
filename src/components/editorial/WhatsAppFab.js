import React from "react";
import { Linking, Platform, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { pointerEventsNativeOnly, withPointerEventsStyle } from "../../utils/pointerEventsStyle";

const WHATSAPP_GREEN = "#25D366";

/**
 * Circular floating WhatsApp action (bottom-right).
 */
export default function WhatsAppFab({ url, accessibilityLabel, bottomOffset = 0 }) {
  const insets = useSafeAreaInsets();
  const { SPACING } = useTheme();

  if (!url) return null;

  return (
    <View
      style={withPointerEventsStyle(
        {
          position: "absolute",
          right: SPACING.lg,
          bottom: Math.max(insets.bottom, SPACING.lg) + bottomOffset,
          zIndex: 40,
        },
        "box-none"
      )}
      {...pointerEventsNativeOnly("box-none")}
    >
      <Pressable
        onPress={() => void Linking.openURL(url)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || "Chat on WhatsApp"}
        style={({ pressed, hovered }) => [
          {
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: WHATSAPP_GREEN,
            alignItems: "center",
            justifyContent: "center",
            ...Platform.select({
              web: {
                boxShadow: "0 8px 24px rgba(14, 23, 41, 0.18)",
                cursor: "pointer",
                transition: "transform 0.15s ease",
              },
              default: {
                shadowColor: "#0E1729",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.18,
                shadowRadius: 12,
                elevation: 6,
              },
            }),
          },
          hovered && Platform.OS === "web" ? { transform: [{ scale: 1.04 }] } : null,
          pressed ? { opacity: 0.92, transform: [{ scale: 0.96 }] } : null,
        ]}
      >
        <Ionicons name="logo-whatsapp" size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
