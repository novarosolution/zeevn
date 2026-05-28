import React, { useEffect, useRef } from "react";
import { Modal as RNModal, Platform, Pressable, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export default function Drawer({
  visible = false,
  children,
  style,
  testID,
  edge = "right",
  width = 360,
  onClose,
  accessibilityLabel = "Drawer",
}) {
  const { semanticPalette, SHADOWS } = useTheme();
  const panelRef = useRef(null);

  useEffect(() => {
    if (Platform.OS !== "web" || !visible) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
      if (event.key !== "Tab" || !panelRef.current) return;
      const nodes = panelRef.current.querySelectorAll(
        'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
      );
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, visible]);

  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close drawer"
        style={{
          flex: 1,
          backgroundColor: "rgba(14,23,41,0.35)",
          justifyContent: edge === "left" ? "flex-start" : "flex-end",
          alignItems: edge === "left" ? "flex-start" : "flex-end",
        }}
      >
        <Pressable
          ref={panelRef}
          testID={testID}
          onPress={(event) => event.stopPropagation()}
          accessibilityRole="dialog"
          accessibilityLabel={accessibilityLabel}
          style={[
            {
              width,
              maxWidth: "92%",
              height: "100%",
              backgroundColor: semanticPalette.surface,
              padding: 16,
              ...SHADOWS.popover,
            },
            style,
          ]}
          {...(Platform.OS === "web" ? { role: "dialog", "aria-modal": true } : {})}
        >
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
