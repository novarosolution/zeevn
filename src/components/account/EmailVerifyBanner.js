import React, { memo } from "react";
import { Text, View } from "react-native";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { ACCOUNT_PROFILE_SCREEN } from "../../content/appContent";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";

const copy = ACCOUNT_PROFILE_SCREEN.emailVerifyBanner;

function EmailVerifyBannerBase({ onSendVerification }) {
  const { semanticPalette, TYPE, SPACING } = useTheme();

  return (
    <Card padding="md" style={{ backgroundColor: semanticPalette.accentSoft, borderWidth: 0 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: SPACING.md }}>
        <Text style={{ flex: 1, minWidth: 200, fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }}>
          {copy.message}
        </Text>
        <Button label={copy.cta} variant="secondary" size="sm" onPress={onSendVerification} />
      </View>
    </Card>
  );
}

const EmailVerifyBanner = memo(EmailVerifyBannerBase);
export default EmailVerifyBanner;
