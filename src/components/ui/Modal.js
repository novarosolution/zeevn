import React, { useEffect, useRef } from "react";
import { Modal as RNModal, Platform, Pressable, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export default function Modal({
  visible,
  onClose,
  children,
  accessibilityLabel = "Modal dialog",
  closeOnBackdrop = true,
}) {
  const { semanticPalette, RADII, SHADOWS } = useTheme();
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
    <RNModal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        onPress={closeOnBackdrop ? onClose : undefined}
        accessibilityRole="button"
        accessibilityLabel="Close modal"
        style={{
          flex: 1,
          backgroundColor: "rgba(14,23,41,0.45)",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <Pressable
          ref={panelRef}
          onPress={(event) => event.stopPropagation()}
          accessibilityRole="dialog"
          accessibilityLabel={accessibilityLabel}
          style={{
            width: "100%",
            maxWidth: 520,
            borderRadius: RADII.lg,
            backgroundColor: semanticPalette.surface,
            padding: 16,
            ...SHADOWS.popover,
          }}
          {...(Platform.OS === "web" ? { role: "dialog", "aria-modal": true } : {})}
        >
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
