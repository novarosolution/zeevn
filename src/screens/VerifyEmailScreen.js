import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import AuthShell from "../components/auth/AuthShell";
import Button from "../components/ui/Button";
import { AUTH_SCREEN } from "../content/appContent";
import { verifyEmailWithTokenRequest } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { FONT_DISPLAY_SEMI } from "../theme/customerAlchemy";
import { fonts } from "../theme/tokens";

const copy = AUTH_SCREEN.verifyEmail;

export default function VerifyEmailScreen({ navigation }) {
  const route = useRoute();
  const { updateStoredUser, refreshProfile, token: authToken } = useAuth();
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  const email = String(route.params?.email || "").trim();
  const verifyToken = String(route.params?.token || "").trim();

  useEffect(() => {
    if (!email || !verifyToken) {
      setStatus("error");
      setMessage(copy.missingParams);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await verifyEmailWithTokenRequest({ email, token: verifyToken });
        if (cancelled) return;
        if (data?.user) {
          await updateStoredUser(data.user);
          if (authToken) {
            try {
              await refreshProfile({ force: true });
            } catch {
              /* profile refresh is best-effort */
            }
          }
        }
        setStatus("success");
        setMessage(data?.message || copy.success);
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setMessage(err?.message || copy.error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authToken, email, refreshProfile, updateStoredUser, verifyToken]);

  return (
    <AuthShell
      navigation={navigation}
      formTitle={status === "loading" ? copy.title : status === "success" ? copy.successTitle : copy.errorTitle}
      formSubtitle={status === "loading" ? copy.subtitle : message}
      bareForm
    >
      <View style={{ alignItems: "center", gap: SPACING.lg, paddingVertical: SPACING.md }}>
        {status === "loading" ? (
          <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkMuted }}>
            {copy.verifying}
          </Text>
        ) : null}
        {status !== "loading" ? (
          <Button
            label={status === "success" ? copy.goToProfile : copy.backToLogin}
            variant="primary"
            size="lg"
            fullWidth
            onPress={() =>
              status === "success"
                ? navigation.navigate("Profile", { screen: "AccountProfile" })
                : navigation.navigate("Login")
            }
          />
        ) : null}
      </View>
    </AuthShell>
  );
}
