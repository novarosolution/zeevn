import React from "react";
import { Platform, View } from "react-native";
import AuthSplitLayout from "./AuthSplitLayout";
import AuthMobileShell from "./AuthMobileShell";
import AuthPageBackdrop from "./AuthPageBackdrop";
import SectionReveal from "../motion/SectionReveal";
import { useKankregLayout } from "../../theme/kankregBreakpoints";

/**
 * Shared Login / Register layout: page backdrop + split panel on wide web, hero + form on phones.
 * `navigation` feeds the Sign in / Create account switch the phone hero draws.
 */
export default function AuthScreenBody({ artSubtitle, form, styles: screenStyles, mode = "login", navigation }) {
  const { useAuthSplit, isXs } = useKankregLayout();
  const useSplit = useAuthSplit && Platform.OS === "web";

  const body = useSplit ? (
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
  ) : (
    <AuthMobileShell mode={mode} navigation={navigation}>
      {form}
    </AuthMobileShell>
  );

  return <AuthPageBackdrop>{body}</AuthPageBackdrop>;
}
