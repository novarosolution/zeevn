import React, { useMemo } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Screen from "../ui/Screen";
import MotionScrollView from "../motion/MotionScrollView";
import BottomNavBar from "../BottomNavBar";
import AccountShell from "./AccountShell";
import { useTheme } from "../../context/ThemeContext";
import { ACCOUNT_UI } from "../../content/appContent";
import { accountSectionForScreen, navigateToAccount } from "../../navigation/accountRoutes";
import {
  customerInnerPageScrollContent,
  customerScrollPaddingBottom,
  customerScrollPaddingTop,
} from "../../theme/screenLayout";

/**
 * Account page wrapper — scroll shell + `AccountShell` nav chrome.
 * Prefer `activeSection` when adding new screens; `activeKey` maps nested screen names.
 */
export default function AccountLayout({
  navigation,
  activeKey,
  activeSection,
  sectionTitle,
  pageTitle,
  pageSubtitle,
  headerRight,
  hidePageHeader = false,
  children,
}) {
  const insets = useSafeAreaInsets();
  const { SPACING } = useTheme();

  const resolvedSection = activeSection || accountSectionForScreen(activeKey);
  const resolvedTitle = pageTitle || sectionTitle;

  const subtitle = useMemo(() => {
    if (pageSubtitle) return pageSubtitle;
    return ACCOUNT_UI.sectionSubtitles?.[resolvedSection] || "";
  }, [pageSubtitle, resolvedSection]);

  return (
    <View style={{ flex: 1, width: "100%" }}>
      <Screen navigation={navigation} noScroll background="bg" contentContainerStyle={{ flex: 1, paddingHorizontal: 0 }}>
        <MotionScrollView
          style={{ flex: 1 }}
          contentContainerStyle={customerInnerPageScrollContent(insets, {
            paddingHorizontal: SPACING.lg,
            paddingTop: customerScrollPaddingTop(insets, { nativeMin: SPACING.xs, webMin: SPACING.sm }),
            paddingBottom: customerScrollPaddingBottom(insets),
          })}
          showsVerticalScrollIndicator={false}
        >
          <AccountShell
            navigation={navigation}
            activeSection={resolvedSection}
            pageTitle={resolvedTitle}
            pageSubtitle={subtitle}
            headerRight={headerRight}
            hidePageHeader={hidePageHeader}
          >
            {children}
          </AccountShell>
        </MotionScrollView>
      </Screen>
      <BottomNavBar />
    </View>
  );
}

AccountLayout.navigateToAccount = navigateToAccount;
