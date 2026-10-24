import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAdminChrome } from "../../theme/adminLayout";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts } from "../../theme/tokens";

const OPEN_MS = 280;
const CLOSE_MS = 200;
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);

/**
 * Slide-over panel. A right-hand drawer on desktop, a full-height sheet rising from the bottom on a phone-width
 * window. Keeps its content mounted while the exit animation plays. Escape and the backdrop close it.
 */
export default function AdminDrawer({
  visible,
  onClose,
  title,
  eyebrow,
  subtitle,
  headerRight,
  footer,
  width = 560,
  scroll = true,
  children,
}) {
  const chrome = useAdminChrome();
  const { width: winW, height: winH } = useWindowDimensions();
  const asSheet = winW < 760;
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const styles = useMemo(() => createStyles(chrome), [chrome]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, { toValue: 1, duration: OPEN_MS, easing: EASE_OUT, useNativeDriver: Platform.OS !== "web" }).start();
      return undefined;
    }
    Animated.timing(progress, { toValue: 0, duration: CLOSE_MS, easing: Easing.bezier(0.4, 0, 1, 1), useNativeDriver: Platform.OS !== "web" }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
    return undefined;
  }, [visible, progress]);

  if (!mounted) return null;

  const panelWidth = asSheet ? winW : Math.min(width, winW - 24);
  const slide = progress.interpolate({ inputRange: [0, 1], outputRange: [asSheet ? winH : panelWidth, 0] });
  const Body = scroll ? ScrollView : View;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: progress }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close panel" />
        </Animated.View>
        <Animated.View
          style={[
            styles.panel,
            asSheet ? styles.panelSheet : styles.panelSide,
            asSheet ? { height: winH - 24, transform: [{ translateY: slide }] } : { width: panelWidth, transform: [{ translateX: slide }] },
          ]}
        >
          <View style={styles.head}>
            <View style={styles.headCopy}>
              {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={styles.subtitle} numberOfLines={2}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            {headerRight}
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={({ hovered, pressed }) => [styles.close, hovered && styles.closeHover, pressed && styles.closePressed]}
            >
              <Ionicons name="close" size={18} color={chrome.inkSoft} />
            </Pressable>
          </View>
          <Body style={styles.body} {...(scroll ? { contentContainerStyle: styles.bodyInner, keyboardShouldPersistTaps: "handled", showsVerticalScrollIndicator: false } : null)}>
            {scroll ? children : <View style={styles.bodyInner}>{children}</View>}
          </Body>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    root: { flex: 1, justifyContent: "flex-end", alignItems: "flex-end" },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(20, 24, 16, 0.42)" },
    panel: {
      backgroundColor: chrome.canvas,
      overflow: "hidden",
      ...Platform.select({ web: { boxShadow: "-24px 0 64px -24px rgba(20,24,16,0.45)" }, default: {} }),
    },
    panelSide: { height: "100%", borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: chrome.line },
    panelSheet: { width: "100%", borderTopLeftRadius: 22, borderTopRightRadius: 22 },
    head: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      paddingHorizontal: 22,
      paddingTop: 18,
      paddingBottom: 14,
      backgroundColor: chrome.card,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.line,
    },
    headCopy: { flex: 1, minWidth: 0 },
    eyebrow: {
      fontSize: 10.5,
      letterSpacing: 0.7,
      textTransform: "uppercase",
      color: chrome.goldDeep,
      fontFamily: fonts.semibold,
      marginBottom: 3,
    },
    title: { fontFamily: FONT_HEADING, fontSize: 22, lineHeight: 26, letterSpacing: -0.4, color: chrome.ink },
    subtitle: { marginTop: 4, fontSize: 12.5, lineHeight: 17, color: chrome.inkFaint, fontFamily: fonts.regular },
    close: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({ web: { cursor: "pointer", transition: "background-color 100ms ease-out" }, default: {} }),
    },
    closeHover: { backgroundColor: chrome.rowHover },
    closePressed: { transform: [{ scale: 0.95 }] },
    body: { flex: 1 },
    bodyInner: { padding: 20, gap: 14 },
    footer: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: chrome.card,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: chrome.line,
    },
  });
}
