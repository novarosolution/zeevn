import { Platform, StyleSheet } from "react-native";
import { semanticRadius, spacing } from "./tokens";

export function createButtonStyles(c, isDark) {
  return {
    primary: {
      borderRadius: semanticRadius.full,
      backgroundColor: c.primary,
      borderWidth: 1,
      borderTopWidth: 2,
      borderColor: c.primaryDark,
      paddingVertical: 13,
      paddingHorizontal: spacing.lg,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      ...Platform.select({
        web: {
          boxShadow: "0 14px 26px rgba(62, 40, 12, 0.24), inset 0 1px 0 rgba(255,255,255,0.2)",
          transitionProperty: "transform, box-shadow, background-color, border-color",
          transitionDuration: "180ms",
          minHeight: 46,
        },
        ios: {
          shadowColor: c.shadow,
          shadowOffset: { width: 0, height: 7 },
          shadowOpacity: isDark ? 0.3 : 0.2,
          shadowRadius: 14,
        },
        android: { elevation: isDark ? 4 : 3 },
      }),
    },
    secondary: {
      borderRadius: semanticRadius.full,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderTopWidth: 1.5,
      borderColor: c.border,
      paddingVertical: 12,
      paddingHorizontal: spacing.lg,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      ...Platform.select({
        web: {
          boxShadow: "0 10px 20px rgba(24, 24, 27, 0.11), inset 0 1px 0 rgba(255,255,255,0.94)",
          transitionProperty: "transform, box-shadow, background-color, border-color",
          transitionDuration: "180ms",
          minHeight: 44,
        },
        default: {},
      }),
    },
    subtle: {
      borderRadius: semanticRadius.control,
      backgroundColor: c.surfaceMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      paddingVertical: 9,
      paddingHorizontal: spacing.md,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 6,
      ...Platform.select({
        web: {
          boxShadow: "0 6px 12px rgba(24, 24, 27, 0.08), inset 0 1px 0 rgba(255,255,255,0.78)",
          transitionProperty: "transform, box-shadow, background-color, border-color",
          transitionDuration: "180ms",
          minHeight: 40,
        },
        default: {},
      }),
    },
    textPrimary: {
      color: c.onPrimary,
      fontWeight: "700",
    },
    textSecondary: {
      color: c.textPrimary,
      fontWeight: "700",
    },
  };
}
