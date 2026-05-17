import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, useWindowDimensions, View } from "react-native";
import AccountLayout from "../../components/account/AccountLayout";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import SectionHeader from "../../components/ui/SectionHeader";
import Toast from "../../components/ui/Toast";
import NotificationChannelTabs from "../../components/account/notifications/NotificationChannelTabs";
import NotificationToggleRow from "../../components/account/notifications/NotificationToggleRow";
import NotificationPrefsSaveBar from "../../components/account/notifications/NotificationPrefsSaveBar";
import { NOTIFICATION_PREFS_SCREEN } from "../../content/appContent";
import { hapticSaveSuccess } from "../../utils/accountHaptics";
import { ACCOUNT_NESTED } from "../../navigation/accountRoutes";
import { useTheme } from "../../context/ThemeContext";
import { loadNotificationPrefs, notificationPrefsSnapshot, saveNotificationPrefs } from "../../utils/notificationPrefs";

const copy = NOTIFICATION_PREFS_SCREEN;

const CATEGORY_META = [
  { key: "orderUpdates", locked: true },
  { key: "delivery" },
  { key: "offers" },
  { key: "memberDrops" },
  { key: "recipe" },
  { key: "backInStock" },
  { key: "wishlistPriceDrops" },
  { key: "surveys" },
];

export default function AccountNotificationPrefsScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isPhone = width < 768;
  const { SPACING } = useTheme();

  const [prefs, setPrefs] = useState(null);
  const [activeChannel, setActiveChannel] = useState("email");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const savedSnapshotRef = useRef("");

  const channels = useMemo(() => {
    const list = [
      { key: "email", label: copy.channels.email },
      { key: "sms", label: copy.channels.sms },
      { key: "whatsapp", label: copy.channels.whatsapp },
    ];
    if (Platform.OS === "ios" || Platform.OS === "android") {
      list.push({ key: "push", label: copy.channels.push });
    }
    return list;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadNotificationPrefs();
      if (cancelled) return;
      setPrefs(loaded);
      savedSnapshotRef.current = notificationPrefsSnapshot(loaded);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (channels.length && !channels.some((c) => c.key === activeChannel)) {
      setActiveChannel(channels[0].key);
    }
  }, [activeChannel, channels]);

  const dirty = useMemo(() => {
    if (!prefs) return false;
    return notificationPrefsSnapshot(prefs) !== savedSnapshotRef.current;
  }, [prefs]);

  const setChannelPref = (channelKey, categoryKey, value) => {
    if (categoryKey === "orderUpdates") return;
    setPrefs((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channelKey]: {
          ...prev.channels[channelKey],
          [categoryKey]: value,
        },
      },
    }));
  };

  const setPrivacy = (key, value) => {
    setPrefs((prev) => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value,
      },
    }));
  };

  const handleSave = useCallback(async () => {
    if (!prefs || !dirty) return;
    try {
      setSaving(true);
      const saved = await saveNotificationPrefs(prefs);
      setPrefs(saved);
      savedSnapshotRef.current = notificationPrefsSnapshot(saved);
      hapticSaveSuccess();
      setToast({ visible: true, message: copy.savedToast });
    } catch {
      /* noop */
    } finally {
      setSaving(false);
    }
  }, [dirty, prefs]);

  const goDeleteAccount = () => {
    navigation.navigate(ACCOUNT_NESTED.AccountProfile, { openDeleteAccount: true });
  };

  if (!prefs) {
    return (
      <AccountLayout
        navigation={navigation}
        activeKey={ACCOUNT_NESTED.NotificationPrefs}
        activeSection="notifications"
        pageTitle={copy.pageTitle}
        pageSubtitle={copy.pageSubtitle}
      />
    );
  }

  const channelPrefs = prefs.channels[activeChannel] || {};

  return (
    <AccountLayout
      navigation={navigation}
      activeKey={ACCOUNT_NESTED.NotificationPrefs}
      activeSection="notifications"
      pageTitle={copy.pageTitle}
      pageSubtitle={copy.pageSubtitle}
    >
      <Toast visible={toast.visible} message={toast.message} onDismiss={() => setToast({ visible: false, message: "" })} />

      <View style={{ paddingBottom: isPhone && dirty ? 88 : 0 }}>
        <NotificationChannelTabs channels={channels} activeKey={activeChannel} onChange={setActiveChannel} />

        <Card padding="md" style={{ marginTop: SPACING.md }}>
          {CATEGORY_META.map((meta, idx) => {
            const catCopy = copy.categories[meta.key];
            const locked = meta.locked || catCopy?.locked;
            return (
              <NotificationToggleRow
                key={meta.key}
                isFirst={idx === 0}
                label={catCopy?.label}
                helper={catCopy?.helper}
                locked={locked}
                value={meta.key === "orderUpdates" ? true : Boolean(channelPrefs[meta.key])}
                onValueChange={(v) => setChannelPref(activeChannel, meta.key, v)}
              />
            );
          })}
        </Card>

        <View style={{ marginTop: SPACING.xl }}>
          <SectionHeader overline={copy.privacy.overline} title={copy.privacy.title} showActionChevron={false} />
          <Card padding="md">
            <NotificationToggleRow
              isFirst
              label={copy.privacy.personalized.label}
              helper={copy.privacy.personalized.helper}
              value={prefs.privacy.personalizedRecommendations}
              onValueChange={(v) => setPrivacy("personalizedRecommendations", v)}
            />
            <NotificationToggleRow
              label={copy.privacy.marketingPartners.label}
              value={prefs.privacy.shareWithMarketingPartners}
              onValueChange={(v) => setPrivacy("shareWithMarketingPartners", v)}
            />
            <View style={{ marginTop: SPACING.md, gap: SPACING.sm }}>
              <Button
                label={copy.privacy.downloadData}
                variant="ghost"
                size="md"
                fullWidth
                onPress={() => setToast({ visible: true, message: copy.dataExportToast })}
              />
              <Button label={copy.privacy.deleteAccount} variant="ghost" size="md" fullWidth onPress={goDeleteAccount} />
            </View>
          </Card>
        </View>

        {!isPhone ? (
          <NotificationPrefsSaveBar dirty={dirty} saving={saving} onSave={handleSave} sticky={false} />
        ) : null}
      </View>

      {isPhone ? <NotificationPrefsSaveBar dirty={dirty} saving={saving} onSave={handleSave} sticky /> : null}
    </AccountLayout>
  );
}
