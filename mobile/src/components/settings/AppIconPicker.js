import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { SETTINGS_SCREEN } from "../../content/appContent";
import {
  APP_ICON_ASSETS,
  APP_ICON_PREF,
  applyAppIcon,
  getAppIconPreference,
  isAppIconChangeSupported,
  isDynamicAppIconAvailable,
  resolveAppIconName,
  setAppIconPreference,
} from "../../services/appIconService";
import { FIGMA } from "../../theme/figmaApp";
import { fonts, radius, spacing, typography } from "../../theme/tokens";

const OPTIONS = [
  {
    key: APP_ICON_PREF.auto,
    label: "Match theme",
    hint: "Follows light / dark mode",
    preview: null,
  },
  {
    key: APP_ICON_PREF.light,
    label: "Light",
    hint: "Cream background",
    preview: APP_ICON_ASSETS.light,
  },
  {
    key: APP_ICON_PREF.dark,
    label: "Dark",
    hint: "Gold on charcoal",
    preview: APP_ICON_ASSETS.dark,
  },
];

export default function AppIconPicker({ onStatus }) {
  const { isDark, colors: c } = useTheme();
  const [pref, setPref] = useState(APP_ICON_PREF.auto);
  const [busy, setBusy] = useState(false);
  const supported = isAppIconChangeSupported();
  const nativeIconSwap = isDynamicAppIconAvailable();

  useEffect(() => {
    let cancelled = false;
    getAppIconPreference().then((stored) => {
      if (!cancelled) setPref(stored);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeIconName = useMemo(() => resolveAppIconName(pref, isDark), [pref, isDark]);

  const handleSelect = useCallback(
    async (next) => {
      if (busy || next === pref) return;
      setBusy(true);
      setPref(next);
      await setAppIconPreference(next);

      if (nativeIconSwap) {
        const result = await applyAppIcon(next, isDark);
        if (result.ok) {
          onStatus?.(
            next === APP_ICON_PREF.auto
              ? SETTINGS_SCREEN.appIconAppliedAuto
              : SETTINGS_SCREEN.appIconApplied,
            "success"
          );
        } else if (result.reason === "unavailable") {
          onStatus?.(SETTINGS_SCREEN.appIconSavedExpoGo, "success");
        } else {
          onStatus?.(SETTINGS_SCREEN.appIconFailed, "error");
        }
      } else if (!supported) {
        onStatus?.(SETTINGS_SCREEN.appIconWebHint, "info");
      } else {
        onStatus?.(SETTINGS_SCREEN.appIconSavedExpoGo, "success");
      }

      setBusy(false);
    },
    [busy, pref, supported, nativeIconSwap, isDark, onStatus]
  );

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: c.textPrimary }]}>{SETTINGS_SCREEN.appIconTitle}</Text>
      <Text style={[styles.sub, { color: c.textMuted }]}>{SETTINGS_SCREEN.appIconSub}</Text>

      <View style={styles.grid}>
        {OPTIONS.map((opt) => {
          const selected = pref === opt.key;
          const previewSource =
            opt.preview || (activeIconName === "dark" ? APP_ICON_ASSETS.dark : APP_ICON_ASSETS.light);

          return (
            <Pressable
              key={opt.key}
              disabled={busy}
              onPress={() => handleSelect(opt.key)}
              style={({ pressed }) => [
                styles.card,
                {
                  borderColor: selected ? (isDark ? c.primary : FIGMA.gold) : c.border,
                  backgroundColor: isDark ? c.surface : FIGMA.card,
                },
                selected && styles.cardSelected,
                pressed && styles.cardPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <View style={[styles.previewShell, opt.key === APP_ICON_PREF.dark && styles.previewDark]}>
                {opt.key === APP_ICON_PREF.auto ? (
                  <View style={styles.autoPreview}>
                    <Image source={APP_ICON_ASSETS.light} style={styles.autoHalf} resizeMode="cover" />
                    <Image source={APP_ICON_ASSETS.dark} style={styles.autoHalf} resizeMode="cover" />
                  </View>
                ) : (
                  <Image source={previewSource} style={styles.preview} resizeMode="contain" />
                )}
              </View>
              <Text style={[styles.cardLabel, { color: c.textPrimary }]}>{opt.label}</Text>
              <Text style={[styles.cardHint, { color: c.textMuted }]}>{opt.hint}</Text>
              {selected ? (
                <View style={styles.check}>
                  <Ionicons name="checkmark-circle" size={16} color={isDark ? c.primary : FIGMA.gold} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {!supported ? (
        <Text style={[styles.footnote, { color: c.textMuted }]}>{SETTINGS_SCREEN.appIconWebHint}</Text>
      ) : !nativeIconSwap ? (
        <Text style={[styles.footnote, { color: c.textMuted }]}>{SETTINGS_SCREEN.appIconExpoGoHint}</Text>
      ) : (
        <Text style={[styles.footnote, { color: c.textMuted }]}>
          {Platform.OS === "android" ? SETTINGS_SCREEN.appIconAndroidHint : SETTINGS_SCREEN.appIconIosHint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: typography.bodySmall,
  },
  sub: {
    fontFamily: fonts.regular,
    fontSize: typography.caption,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  card: {
    width: Platform.OS === "web" ? 108 : "30%",
    minWidth: 96,
    flexGrow: 1,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.sm,
    alignItems: "center",
    position: "relative",
  },
  cardSelected: {
    borderWidth: 1.5,
  },
  cardPressed: {
    opacity: 0.9,
  },
  previewShell: {
    width: 64,
    height: 64,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F5EFE4",
    marginBottom: spacing.xs,
  },
  previewDark: {
    backgroundColor: "#0F3D24",
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  autoPreview: {
    flexDirection: "row",
    width: "100%",
    height: "100%",
  },
  autoHalf: {
    flex: 1,
    height: "100%",
  },
  cardLabel: {
    fontFamily: fonts.semibold,
    fontSize: typography.caption,
    textAlign: "center",
  },
  cardHint: {
    fontFamily: fonts.regular,
    fontSize: 10,
    textAlign: "center",
    marginTop: 2,
  },
  check: {
    position: "absolute",
    top: 6,
    right: 6,
  },
  footnote: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.xs,
  },
});
