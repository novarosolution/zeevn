import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useStoreTheme } from "../../theme/storefront";

/**
 * Storefront bottom sheet — slides up over a dimmed backdrop, drag the handle/header to dismiss.
 * Built on `Modal` + core `Animated` so it needs no gesture-root setup.
 */
export default function BottomSheet({ visible, onClose, title, subtitle, children, footer, maxHeightRatio = 0.86 }) {
  const { c, r, type, shadow } = useStoreTheme();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const translateY = useRef(new Animated.Value(screenH)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 26,
        stiffness: 250,
        mass: 0.9,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdrop, translateY]);

  const animateOut = useCallback(
    (done) => {
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, {
          toValue: screenH,
          duration: 230,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) done?.();
      });
    },
    [backdrop, translateY, screenH]
  );

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.setValue(screenH);
      const id = requestAnimationFrame(animateIn);
      return () => cancelAnimationFrame(id);
    }
    animateOut(() => setMounted(false));
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 90 || g.vy > 0.9) {
          closeRef.current?.();
        } else {
          Animated.spring(translateY, { toValue: 0, damping: 22, stiffness: 260, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim, opacity: backdrop }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            shadow.float,
            {
              backgroundColor: c.card,
              maxHeight: screenH * maxHeightRatio,
              borderTopLeftRadius: r.xxl,
              borderTopRightRadius: r.xxl,
              paddingBottom: Math.max(insets.bottom, 12),
              transform: [{ translateY }],
            },
          ]}
        >
          <View {...panResponder.panHandlers}>
            <View style={styles.handleWrap}>
              <View style={[styles.handle, { backgroundColor: c.lineStrong }]} />
            </View>
            {title ? (
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text style={type.display(22, { semi: true })} numberOfLines={1}>
                    {title}
                  </Text>
                  {subtitle ? (
                    <Text style={[type.ui(13, "medium", c.inkMute), styles.subtitle]} numberOfLines={2}>
                      {subtitle}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={onClose}
                  hitSlop={10}
                  style={[styles.close, { backgroundColor: c.soft }]}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Ionicons name="close" size={18} color={c.inkSoft} />
                </Pressable>
              </View>
            ) : null}
          </View>

          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.body}
          >
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  sheet: { width: "100%", overflow: "hidden" },
  handleWrap: { alignItems: "center", paddingTop: 10, paddingBottom: 6 },
  handle: { width: 42, height: 4.5, borderRadius: 3 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
    gap: 12,
  },
  headerText: { flex: 1, minWidth: 0 },
  subtitle: { marginTop: 2 },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  body: { paddingHorizontal: 20, paddingBottom: 8, paddingTop: 4 },
  footer: { paddingHorizontal: 20, paddingTop: 8 },
});
