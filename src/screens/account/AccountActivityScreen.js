import React, { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AccountLayout from "../../components/account/AccountLayout";
import Card from "../../components/ui/Card";
import { ACCOUNT_PROFILE_SCREEN } from "../../content/appContent";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";
import { fetchAccountActivity } from "../../services/userService";

const copy = ACCOUNT_PROFILE_SCREEN.activityScreen;

const LABELS = {
  sign_in: "Signed in",
  profile_update: "Profile updated",
  password_change: "Password changed",
  email_change_requested: "Email change requested",
  phone_change: "Phone updated",
  phone_otp_sent: "Phone verification sent",
  verification_sent: "Verification email sent",
  deletion_requested: "Account deletion requested",
  session_revoked: "Session revoked",
};

function formatWhen(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "";
  }
}

export default function AccountActivityScreen() {
  const { token } = useAuth();
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await fetchAccountActivity(token);
      setEvents(Array.isArray(data?.events) ? data.events : []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <AccountLayout activeSection="profile" pageTitle={copy.title} pageSubtitle={copy.subtitle}>
      <ScrollView contentContainerStyle={{ paddingBottom: SPACING.xxl, gap: SPACING.md }}>
        {loading ? (
          <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkMuted }}>Loading…</Text>
        ) : events.length === 0 ? (
          <Card padding="lg">
            <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkSoft }}>{copy.empty}</Text>
          </Card>
        ) : (
          events.map((ev, idx) => (
            <Card key={`${ev.type}-${ev.at}-${idx}`} padding="md">
              <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }}>
                {LABELS[ev.type] || ev.type}
              </Text>
              {ev.detail ? (
                <Text style={{ marginTop: 4, fontFamily: fonts.regular, fontSize: TYPE.small.fontSize, color: semanticPalette.inkSoft }}>
                  {ev.detail}
                </Text>
              ) : null}
              <Text style={{ marginTop: 6, fontFamily: fonts.regular, fontSize: TYPE.caption.fontSize, color: semanticPalette.inkMuted }}>
                {formatWhen(ev.at)}
              </Text>
            </Card>
          ))
        )}
      </ScrollView>
    </AccountLayout>
  );
}
