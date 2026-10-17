import React from "react";
import { Platform, View } from "react-native";
import AuthSplitLayout from "./AuthSplitLayout";
import AuthMobileShell from "./AuthMobileShell";
import AuthPageBackdrop from "./AuthPageBackdrop";
import SectionReveal from "../motion/SectionReveal";
import { useKankregLayout } from "../../theme/kankregBreakpoints";

/**
 * Shared Login / Register layout: page body BG + split panel on wide web, mobile card on phone.
 */
export default function AuthScreenBody({ artSubtitle, form, styles: screenStyles, mode = "login" }) {
  const { useAuthSplit, isXs } = useKankregLayout();
  const useSplit = useAuthSplit && Platform.OS === "web";
  const useMobileShell = !useSplit;

  const body = useMobileShell ? (
    <SectionReveal index={0} preset="fade-up" style={screenStyles.revealFill}>
      <AuthMobileShell artSubtitle={artSubtitle} mode={mode}>
        {form}
      </AuthMobileShell>
    </SectionReveal>
  ) : (
    <AuthSplitLayout artSubtitle={artSubtitle} mode={mode}>
      <SectionReveal index={1} preset="fade-up" style={screenStyles.revealFill}>
        <View
          style={[
            screenStyles.card,
            screenStyles.cardWebInline,
            isXs && screenStyles.cardWebStack,
          ]}
        >
          {form}
        </View>
      </SectionReveal>
    </AuthSplitLayout>
  );

  return <AuthPageBackdrop>{body}</AuthPageBackdrop>;
}
