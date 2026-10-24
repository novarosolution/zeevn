import React, { useCallback, useMemo, useRef, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAdminChrome } from "../../theme/adminLayout";
import { getAdminTone } from "../../theme/adminTones";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";

/**
 * Overflow ("⋯") menu. Items: `{ key, label, icon?, onPress, danger?, disabled? }` or `{ divider: true }`.
 * Popover beside the button on desktop, bottom sheet on a phone-width window.
 */
export default function AdminMenu({ items = [], icon = "ellipsis-horizontal", title = "More actions", width = 210, align = "right", size = 30 }) {
  const chrome = useAdminChrome();
  const { isDark } = useTheme();
  const { width: winW, height: winH } = useWindowDimensions();
  const asSheet = winW < 760;
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const styles = useMemo(() => createStyles(chrome), [chrome]);
  const red = getAdminTone("red", isDark);

  const close = useCallback(() => setOpen(false), []);
  const openMenu = useCallback(() => {
    const node = ref.current;
    if (!asSheet && node && typeof node.getBoundingClientRect === "function") {
      const r = node.getBoundingClientRect();
      setAnchor({ x: r.left, y: r.top, w: r.width, h: r.height });
      setOpen(true);
    } else if (!asSheet && node && typeof node.measureInWindow === "function") {
      node.measureInWindow((x, y, w, h) => {
        setAnchor({ x, y, w, h });
        setOpen(true);
      });
    } else {
      setAnchor(null);
      setOpen(true);
    }
  }, [asSheet]);

  let popover = null;
  if (open && !asSheet && anchor) {
    let left = align === "right" ? anchor.x + anchor.w - width : anchor.x;
    left = Math.max(8, Math.min(left, winW - width - 8));
    const estimatedHeight = items.length * 38 + 12;
    const flip = winH - (anchor.y + anchor.h) < estimatedHeight + 16 && anchor.y > estimatedHeight;
    popover = flip ? { left, width, bottom: winH - anchor.y + 6 } : { left, width, top: anchor.y + anchor.h + 6 };
  }

  return (
    <View>
      <Pressable
        ref={ref}
        onPress={openMenu}
        accessibilityRole="button"
        accessibilityLabel={title}
        {...(Platform.OS === "web" ? { title } : null)}
        style={({ hovered, pressed }) => [
          styles.trigger,
          { width: size, height: size, borderRadius: Math.round(size * 0.3) },
          (hovered || open) && styles.triggerHover,
          pressed && styles.triggerPressed,
        ]}
      >
        <Ionicons name={icon} size={16} color={chrome.inkSoft} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
        <Pressable style={[styles.backdrop, asSheet && styles.backdropDim]} onPress={close} accessibilityLabel="Close menu">
          <Pressable onPress={() => {}} style={[styles.menu, asSheet ? styles.sheet : [styles.popover, popover]]}>
            {asSheet ? <View style={styles.grabber} /> : null}
            {items.map((item, index) =>
              item.divider ? (
                <View key={`d-${index}`} style={styles.divider} />
              ) : (
                <Pressable
                  key={item.key ?? index}
                  disabled={item.disabled}
                  onPress={() => {
                    setOpen(false);
                    item.onPress?.();
                  }}
                  accessibilityRole="menuitem"
                  style={({ hovered, pressed }) => [styles.item, hovered && styles.itemHover, pressed && styles.itemPressed, item.disabled && styles.itemDisabled]}
                >
                  {item.icon ? <Ionicons name={item.icon} size={16} color={item.danger ? red.fg : chrome.inkSoft} /> : null}
                  <Text style={[styles.itemText, item.danger && { color: red.fg }]} numberOfLines={1}>
                    {item.label}
                  </Text>
                </Pressable>
              )
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    trigger: {
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "transparent",
      ...Platform.select({ web: { cursor: "pointer", transition: "background-color 100ms ease-out, border-color 100ms ease-out" }, default: {} }),
    },
    triggerHover: { backgroundColor: chrome.rowHover, borderColor: chrome.line },
    triggerPressed: { transform: [{ scale: 0.95 }] },
    backdrop: { flex: 1 },
    backdropDim: { backgroundColor: "rgba(20, 24, 16, 0.42)", justifyContent: "flex-end" },
    menu: { backgroundColor: chrome.card, borderWidth: StyleSheet.hairlineWidth, borderColor: chrome.line, padding: 6 },
    popover: {
      position: "absolute",
      borderRadius: 14,
      ...Platform.select({ web: { boxShadow: "0 18px 44px -12px rgba(20,24,16,0.32), 0 2px 6px rgba(20,24,16,0.08)" }, default: {} }),
    },
    sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 22 },
    grabber: { alignSelf: "center", width: 38, height: 4, borderRadius: 2, backgroundColor: chrome.line, marginTop: 4, marginBottom: 8 },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: chrome.line, marginVertical: 5 },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderRadius: 9,
      ...Platform.select({ web: { cursor: "pointer", transition: "background-color 90ms ease-out" }, default: {} }),
    },
    itemHover: { backgroundColor: chrome.rowHover },
    itemPressed: { backgroundColor: chrome.paper },
    itemDisabled: { opacity: 0.45 },
    itemText: { flex: 1, fontSize: 13.5, color: chrome.ink, fontFamily: fonts.medium },
  });
}
