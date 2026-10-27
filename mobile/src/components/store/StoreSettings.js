import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from "react-native-reanimated";
import { SETTINGS_SCREEN } from "../../content/appContent";
import { useStoreTheme } from "../../theme/storefront";
import {
  APP_ICON_ASSETS,
  APP_ICON_PREF,
  applyAppIcon,
  getAppIconPreference,
  isDynamicAppIconAvailable,
  resolveAppIconName,
  setAppIconPreference,
} from "../../services/appIconService";
import { STORE_PROFILE, STORE_SETTINGS } from "../../content/storefrontContent";
import PressableScale from "./PressableScale";
import StoreBanner from "./StoreBanner";
import StoreScreen from "./StoreScreen";
import { Button, Card, Group, Rise, Row, SectionLabel, Segmented } from "./StoreKit";

const ICON_OPTIONS = [
  { key: APP_ICON_PREF.auto, label: STORE_SETTINGS.appIconOptions.auto },
  { key: APP_ICON_PREF.light, label: STORE_SETTINGS.appIconOptions.light },
  { key: APP_ICON_PREF.dark, label: STORE_SETTINGS.appIconOptions.dark },
];

function IconTile({ option, selected, previewSource, onPress, disabled }) {
  const { c, r, type, shadow } = useStoreTheme();
  const pop = useSharedValue(1);
  const wasSelected = React.useRef(selected);

  useEffect(() => {
    if (selected && !wasSelected.current) {
      pop.value = withSequence(withSpring(1.07, { damping: 9, stiffness: 420 }), withSpring(1, { damping: 14, stiffness: 300 }));
    }
    wasSelected.current = selected;
  }, [selected, pop]);

  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const isAuto = option.key === APP_ICON_PREF.auto;

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.95}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={STORE_SETTINGS.appIconA11y(option.label)}
      style={styles.tileWrap}
    >
      <Animated.View
        style={[
          styles.tile,
          selected ? shadow.card : shadow.soft,
          {
            backgroundColor: c.card,
            borderColor: selected ? c.brand : c.line,
            borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
            borderRadius: r.xl,
          },
          popStyle,
        ]}
      >
        <View style={[styles.preview, { borderRadius: 18, backgroundColor: c.soft }]}>
          {isAuto ? (
            <View style={styles.split}>
              <Image source={APP_ICON_ASSETS.light} style={styles.half} contentFit="cover" />
              <Image source={APP_ICON_ASSETS.dark} style={styles.half} contentFit="cover" />
            </View>
          ) : (
            <Image source={previewSource} style={styles.full} contentFit="cover" />
          )}
        </View>
        <Text style={type.ui(13, selected ? "extrabold" : "semibold", selected ? c.brand : c.inkSoft)} numberOfLines={1}>
          {option.label}
        </Text>
        {selected ? (
          <View style={[styles.check, { backgroundColor: c.brand }]}>
            <Ionicons name="checkmark" size={13} color={c.onBrand} />
          </View>
        ) : null}
      </Animated.View>
    </PressableScale>
  );
}

function AppIconChooser({ onStatus }) {
  const { isDark } = useStoreTheme();
  const [pref, setPref] = useState(APP_ICON_PREF.auto);
  const [busy, setBusy] = useState(false);
  const nativeSwap = isDynamicAppIconAvailable();

  useEffect(() => {
    let cancelled = false;
    getAppIconPreference().then((stored) => {
      if (!cancelled) setPref(stored);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeName = useMemo(() => resolveAppIconName(pref, isDark), [pref, isDark]);

  const choose = useCallback(
    async (next) => {
      if (busy || next === pref) return;
      setBusy(true);
      setPref(next);
      await setAppIconPreference(next);
      if (nativeSwap) {
        const result = await applyAppIcon(next, isDark);
        if (result.ok) onStatus?.(next === APP_ICON_PREF.auto ? SETTINGS_SCREEN.appIconAppliedAuto : SETTINGS_SCREEN.appIconApplied, "success");
        else if (result.reason === "unavailable") onStatus?.(SETTINGS_SCREEN.appIconSavedExpoGo, "success");
        else onStatus?.(SETTINGS_SCREEN.appIconFailed, "error");
      } else {
        onStatus?.(SETTINGS_SCREEN.appIconSavedExpoGo, "success");
      }
      setBusy(false);
    },
    [busy, pref, nativeSwap, isDark, onStatus]
  );

  return (
    <View style={styles.tiles}>
      {ICON_OPTIONS.map((option) => (
        <IconTile
          key={option.key}
          option={option}
          selected={pref === option.key}
          disabled={busy}
          previewSource={option.key === APP_ICON_PREF.auto ? null : APP_ICON_ASSETS[option.key] || (activeName === "dark" ? APP_ICON_ASSETS.dark : APP_ICON_ASSETS.light)}
          onPress={() => choose(option.key)}
        />
      ))}
    </View>
  );
}

/**
 * Native Settings: appearance switch, app icon picker, alerts and sign out. (Orders, address and profile live on the
 * Profile page, one tap away — they are not repeated here.)
 * notices — [{ id, tone, message }] shown as dismissible banners at the top.
 */
export default function StoreSettings({
  navigation,
  mode,
  onMode,
  notices = [],
  onDismissNotice,
  onIconStatus,
  onEnableNotifications,
  notificationsLabel,
  signedIn,
  onSignOut,
  signingOut,
  version,
}) {
  const { c, type } = useStoreTheme();
  const go = (name) => () => navigation.navigate(name);

  return (
    <StoreScreen title={STORE_SETTINGS.title} navigation={navigation}>
      {notices.map((notice) => (
        <StoreBanner key={notice.id} tone={notice.tone} message={notice.message} onClose={() => onDismissNotice?.(notice.id)} />
      ))}

      <Rise index={0}>
        <SectionLabel>{STORE_SETTINGS.appearance}</SectionLabel>
        <Segmented options={STORE_PROFILE.appearance.options} value={mode} onChange={onMode} />
      </Rise>

      <Rise index={1}>
        <SectionLabel>{STORE_SETTINGS.appIcon}</SectionLabel>
        <Card padded>
          <AppIconChooser onStatus={onIconStatus} />
        </Card>
      </Rise>

      <Rise index={2}>
        <SectionLabel>{STORE_SETTINGS.alerts}</SectionLabel>
        <Group>
          <Row
            icon="notifications-outline"
            title={STORE_SETTINGS.push.title}
            subtitle={STORE_SETTINGS.push.body}
            trailing={notificationsLabel}
            onPress={onEnableNotifications}
          />
          <Row icon="mail-unread-outline" title={STORE_SETTINGS.inbox} onPress={go("Notifications")} />
        </Group>
      </Rise>

      {signedIn ? (
        <Rise index={3}>
          <Button label={STORE_PROFILE.signOut} icon="log-out-outline" tone="danger" onPress={onSignOut} loading={signingOut} />
        </Rise>
      ) : null}

      <Rise index={4}>
        <Text style={[type.ui(12.5, "medium", c.inkMute), styles.version]}>{STORE_PROFILE.version(version)}</Text>
      </Rise>
    </StoreScreen>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: "row", gap: 10 },
  tileWrap: { flex: 1 },
  tile: { alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 6 },
  preview: { width: 64, height: 64, overflow: "hidden" },
  full: { width: "100%", height: "100%" },
  split: { flex: 1, flexDirection: "row" },
  half: { flex: 1, height: "100%" },
  check: { position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  version: { textAlign: "center", marginTop: 4 },
});
