import React, { useCallback, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Screen from "../components/ui/Screen";
import { DEV_DEBUG_UI } from "../content/appContent";
import { useTheme } from "../context/ThemeContext";
import { supportsBackdropFilter, supportsCssFeature } from "../utils/webViewport";

const REQUIRED_KEY = "zeevan-debug";

function readSnapshot() {
  if (Platform.OS !== "web" || typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }
  const vv = window.visualViewport;
  const doc = document.documentElement;
  const touchPoints = Number(navigator.maxTouchPoints || 0);
  return {
    userAgent: String(navigator.userAgent || ""),
    windowSize: `${window.innerWidth} x ${window.innerHeight}`,
    docSize: `${doc.clientWidth} x ${doc.clientHeight}`,
    viewportSize: vv ? `${Math.round(vv.width)} x ${Math.round(vv.height)}` : DEV_DEBUG_UI.unavailable,
    dpr: String(window.devicePixelRatio || 1),
    touch: touchPoints > 0 || "ontouchstart" in window,
    supportsBackdrop: supportsBackdropFilter(),
    supportsDvh: supportsCssFeature("height", "100dvh"),
    supportsLvh: supportsCssFeature("height", "100lvh"),
    supportsVhVar: Boolean(doc.style.getPropertyValue("--app-vh")),
  };
}

export default function DevDebugScreen({ route, navigation }) {
  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();
  const routeKey = String(route?.params?.key || "");
  const [snapshot, setSnapshot] = useState(() => readSnapshot());
  const unlocked = routeKey === REQUIRED_KEY;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { gap: SPACING.lg, paddingBottom: SPACING["2xl"] },
        card: {
          borderRadius: RADII.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: semanticPalette.line,
          backgroundColor: semanticPalette.surface,
          padding: SPACING.md,
          gap: SPACING.sm,
        },
        title: {
          fontSize: TYPE.h3.fontSize,
          lineHeight: TYPE.h3.lineHeight,
          color: semanticPalette.ink,
          fontFamily: TYPE.serifFamily,
        },
        label: {
          fontSize: TYPE.caption.fontSize,
          lineHeight: TYPE.caption.lineHeight,
          color: semanticPalette.inkMuted,
          fontFamily: TYPE.bodyFamily,
        },
        value: {
          fontSize: TYPE.small.fontSize,
          lineHeight: TYPE.small.lineHeight,
          color: semanticPalette.ink,
          fontFamily: TYPE.bodyFamily,
        },
        row: {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: semanticPalette.line,
          paddingBottom: SPACING.xs,
          gap: 2,
        },
        btn: {
          alignSelf: "flex-start",
          borderRadius: 999,
          borderWidth: 1,
          borderColor: semanticPalette.line,
          backgroundColor: semanticPalette.surfaceAlt,
          paddingHorizontal: SPACING.md,
          paddingVertical: SPACING.xs,
        },
        btnText: {
          color: semanticPalette.ink,
          fontSize: TYPE.caption.fontSize,
          fontFamily: TYPE.bodyFamily,
        },
      }),
    [RADII.md, SPACING, TYPE, semanticPalette]
  );

  const refresh = useCallback(() => setSnapshot(readSnapshot()), []);
  const yn = useCallback((v) => (v ? DEV_DEBUG_UI.yes : DEV_DEBUG_UI.no), []);

  if (!unlocked) {
    return (
      <Screen navigation={navigation} title={DEV_DEBUG_UI.routeTitle} breadcrumbLabel="">
        <View style={styles.card}>
          <Text style={styles.title}>{DEV_DEBUG_UI.lockedTitle}</Text>
          <Text style={styles.value}>{DEV_DEBUG_UI.lockedBody}</Text>
          <Text style={styles.label}>{`${DEV_DEBUG_UI.keyLabel}: ${routeKey || DEV_DEBUG_UI.missing}`}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen navigation={navigation} title={DEV_DEBUG_UI.routeTitle} breadcrumbLabel="">
      <ScrollView contentContainerStyle={styles.wrap}>
        <View style={styles.card}>
          <Text style={styles.title}>{DEV_DEBUG_UI.snapshotTitle}</Text>
          <Pressable onPress={refresh} style={styles.btn} accessibilityRole="button" accessibilityLabel={DEV_DEBUG_UI.refresh}>
            <Text style={styles.btnText}>{DEV_DEBUG_UI.refresh}</Text>
          </Pressable>
          <View style={styles.row}>
            <Text style={styles.label}>{DEV_DEBUG_UI.ua}</Text>
            <Text style={styles.value}>{snapshot?.userAgent || DEV_DEBUG_UI.unavailable}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{DEV_DEBUG_UI.windowSize}</Text>
            <Text style={styles.value}>{snapshot?.windowSize || DEV_DEBUG_UI.unavailable}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{DEV_DEBUG_UI.docSize}</Text>
            <Text style={styles.value}>{snapshot?.docSize || DEV_DEBUG_UI.unavailable}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{DEV_DEBUG_UI.viewportSize}</Text>
            <Text style={styles.value}>{snapshot?.viewportSize || DEV_DEBUG_UI.unavailable}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{DEV_DEBUG_UI.dpr}</Text>
            <Text style={styles.value}>{snapshot?.dpr || DEV_DEBUG_UI.unavailable}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{DEV_DEBUG_UI.touch}</Text>
            <Text style={styles.value}>{yn(snapshot?.touch)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{DEV_DEBUG_UI.supportsBackdrop}</Text>
            <Text style={styles.value}>{yn(snapshot?.supportsBackdrop)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{DEV_DEBUG_UI.supportsDvh}</Text>
            <Text style={styles.value}>{yn(snapshot?.supportsDvh)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{DEV_DEBUG_UI.supportsLvh}</Text>
            <Text style={styles.value}>{yn(snapshot?.supportsLvh)}</Text>
          </View>
          <View>
            <Text style={styles.label}>{DEV_DEBUG_UI.supportsVhVar}</Text>
            <Text style={styles.value}>{yn(snapshot?.supportsVhVar)}</Text>
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>{DEV_DEBUG_UI.notesTitle}</Text>
          <Text style={styles.value}>{DEV_DEBUG_UI.notesBody}</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

