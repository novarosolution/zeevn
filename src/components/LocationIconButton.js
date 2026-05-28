import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { ACCOUNT_NESTED } from "../navigation/accountRoutes";
import { WEB_HEADER_UI } from "../content/appContent";
import { HERITAGE } from "../theme/customerAlchemy";
import { fonts, icon, semanticRadius, spacing, typography } from "../theme/tokens";
import { WEB_Z_INDEX } from "../theme/web";

function formatDefaultAddressSummary(addr) {
  const line1 = String(addr?.line1 || "").trim();
  const city = String(addr?.city || "").trim();
  if (line1 && city) return `${line1}, ${city}`;
  return line1 || city || "";
}

/**
 * Compact location control — neutral chrome; brass dot when address line missing;
 * web popover for current default address when line1 present.
 */
export default function LocationIconButton({ navigation, navigationRef, size = icon.md }) {
  const { colors: c, isDark } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const line1 = String(user?.defaultAddress?.line1 || "").trim();
  const hasUsableAddress = Boolean(line1);
  const showBrassDot = isAuthenticated && !hasUsableAddress;

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverBox, setPopoverBox] = useState({ top: 0, left: 0, width: 260 });
  const wrapRef = useRef(null);

  const addressSummary = useMemo(() => formatDefaultAddressSummary(user?.defaultAddress), [user?.defaultAddress]);

  const navigateDest = useCallback(
    (dest, nestedScreen) => {
      if (navigationRef?.isReady?.() && typeof navigationRef.navigate === "function") {
        if (nestedScreen) {
          navigationRef.navigate(dest, { screen: nestedScreen });
        } else {
          navigationRef.navigate(dest);
        }
        return;
      }
      if (nestedScreen) {
        navigation?.navigate?.(dest, { screen: nestedScreen });
      } else {
        navigation?.navigate?.(dest);
      }
    },
    [navigation, navigationRef]
  );

  const openManage = useCallback(() => {
    setPopoverOpen(false);
    navigateDest(isAuthenticated ? "Profile" : "Login", isAuthenticated ? ACCOUNT_NESTED.Addresses : undefined);
  }, [isAuthenticated, navigateDest]);

  const onPress = useCallback(() => {
    if (!isAuthenticated) {
      navigateDest("Login");
      return;
    }
    if (!hasUsableAddress) {
      navigateDest("Profile", ACCOUNT_NESTED.Addresses);
      return;
    }
    if (Platform.OS === "web") {
      setPopoverOpen((o) => !o);
      return;
    }
    navigateDest("Profile", ACCOUNT_NESTED.Addresses);
  }, [hasUsableAddress, isAuthenticated, navigateDest]);

  useEffect(() => {
    if (!popoverOpen || Platform.OS !== "web" || typeof document === "undefined") return undefined;
    const onDoc = (e) => {
      const t = e?.target;
      const node = wrapRef.current;
      const pop = document.getElementById("location-popover-root");
      if (node && typeof node.contains === "function" && t && node.contains(t)) return;
      if (pop && typeof pop.contains === "function" && t && pop.contains(t)) return;
      setPopoverOpen(false);
    };
    document.addEventListener("mousedown", onDoc, true);
    return () => document.removeEventListener("mousedown", onDoc, true);
  }, [popoverOpen]);

  useEffect(() => {
    if (!popoverOpen || Platform.OS !== "web") return;
    const node = wrapRef.current;
    if (!node || typeof node.measureInWindow !== "function") return;
    requestAnimationFrame(() => {
      node.measureInWindow((x, y, _w, h) => {
        setPopoverBox({
          top: y + h + 8,
          left: Math.max(8, x - 40),
          width: 280,
        });
      });
    });
  }, [popoverOpen]);

  useEffect(() => {
    if (!popoverOpen || Platform.OS !== "web" || typeof window === "undefined") return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setPopoverOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [popoverOpen]);

  const a11y =
    !isAuthenticated
      ? WEB_HEADER_UI.locationNoAddressHint
      : hasUsableAddress
        ? `${WEB_HEADER_UI.locationWithAddressHint}: ${addressSummary}`
        : WEB_HEADER_UI.locationNoAddressHint;

  const border = isDark ? "rgba(255,255,255,0.14)" : "rgba(148,163,184,0.35)";
  const surfaceAlt = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)";

  return (
    <View ref={wrapRef} collapsable={false} style={styles.wrap}>
      <Pressable
        onPress={onPress}
        style={({ hovered, pressed }) => [
          styles.hit,
          {
            borderColor: border,
            backgroundColor: surfaceAlt,
          },
          hovered && Platform.OS === "web" ? { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" } : null,
          pressed && { opacity: 0.88 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={a11y}
        hitSlop={8}
      >
        <View style={styles.inner}>
          <Ionicons name="location-outline" size={size} color={c.textPrimary} />
          {showBrassDot ? <View style={[styles.dot, { backgroundColor: HERITAGE.brass, borderColor: c.surface }]} /> : null}
        </View>
      </Pressable>
      {popoverOpen && Platform.OS === "web" && hasUsableAddress ? (
        <View
          nativeID="location-popover-root"
          style={[
            styles.popover,
            {
              top: popoverBox.top,
              left: popoverBox.left,
              width: popoverBox.width,
              backgroundColor: c.surface,
              borderColor: border,
            },
          ]}
        >
          <Text style={[styles.popTitle, { color: c.textMuted, fontFamily: fonts.semibold }]}>Current delivery</Text>
          <Text style={[styles.popAddr, { color: c.textPrimary, fontFamily: fonts.regular }]} numberOfLines={3}>
            {addressSummary || "—"}
          </Text>
          <Pressable
            onPress={openManage}
            style={({ pressed, hovered }) => [
              styles.manageBtn,
              { borderColor: border },
              hovered && { backgroundColor: surfaceAlt },
              pressed && { opacity: 0.9 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={WEB_HEADER_UI.locationManageAction}
          >
            <Text style={{ color: c.textPrimary, fontFamily: fonts.semibold, fontSize: typography.bodySmall }}>
              {WEB_HEADER_UI.locationManageAction}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    alignSelf: "center",
  },
  hit: {
    borderRadius: semanticRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      web: {
        cursor: "pointer",
        transition: "background 0.18s ease, border-color 0.18s ease",
      },
      default: {},
    }),
  },
  inner: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  popover: {
    position: "fixed",
    zIndex: WEB_Z_INDEX.dropdown,
    borderRadius: semanticRadius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.sm,
    ...Platform.select({
      web: {
        boxShadow: "0 16px 40px rgba(15, 23, 42, 0.14), 0 4px 12px rgba(15, 23, 42, 0.08)",
        transform: "translateZ(0)",
        willChange: "transform",
      },
      default: {},
    }),
  },
  popTitle: {
    fontSize: typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  popAddr: {
    fontSize: typography.bodySmall,
    lineHeight: Math.round((typography.bodySmall + 2) * 1.35),
  },
  manageBtn: {
    marginTop: spacing.xs,
    alignSelf: "flex-start",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: semanticRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      web: { cursor: "pointer" },
      default: {},
    }),
  },
});
