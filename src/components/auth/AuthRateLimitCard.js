import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import Card from "../ui/Card";
import { formatRetryCountdown } from "../../utils/authRateLimit";
import { fonts } from "../../theme/tokens";

export default function AuthRateLimitCard({ untilMs }) {
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const [remaining, setRemaining] = useState(() => Math.max(0, untilMs - Date.now()));

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, untilMs - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [untilMs]);

  if (remaining <= 0) return null;

  return (
    <View accessibilityLiveRegion="polite" style={{ marginBottom: SPACING.md }}>
      <Card
        padding={12}
        style={{
          borderWidth: 1,
          borderColor: semanticPalette.sale,
          backgroundColor: semanticPalette.surfaceAlt,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: SPACING.sm }}>
          <Ionicons name="time-outline" size={16} color={semanticPalette.sale} />
          <Text
            style={{
              flex: 1,
              fontFamily: fonts.regular,
              fontSize: TYPE.small.fontSize,
              lineHeight: TYPE.small.lineHeight,
              color: semanticPalette.ink,
            }}
          >
            Too many attempts. Try again in {formatRetryCountdown(remaining)}.
          </Text>
        </View>
      </Card>
    </View>
  );
}
