import React, { memo, useMemo } from "react";
import { Platform, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import {
  CUSTOMER_PAGE_MAX_WIDTH,
  customerScrollPaddingBottom,
} from "../../theme/screenLayout";
import PageHeader from "./PageHeader";

function useHorizontalPagePadding() {
  const { width } = useWindowDimensions();
  const { SPACING } = useTheme();
  if (width >= 1024) return SPACING["4xl"];
  if (width >= 768) return SPACING["2xl"];
  return SPACING.lg;
}

/**
 * Safe-area page scaffold with semantic bg, responsive gutters (20 / 32 / 56),
 * scroll padding that clears the floating bottom nav, and optional PageHeader.
 */
function ScreenBase({
  children,
  title,
  navigation,
  background = "bg",
  noScroll = false,
  refreshControl,
  breadcrumbLabel,
  kicker,
  headerRight,
  hideHeaderBackButton,
  onHeaderBack,
  contentContainerStyle,
  scrollViewProps,
  accessibilityLabel,
}) {
  const insets = useSafeAreaInsets();
  const { semanticPalette, colors, isDark } = useTheme();
  const gutter = useHorizontalPagePadding();

  const bgColor = background === "bgDeep" ? semanticPalette.bgDeep : colors.background;
  /** PageHeader `variant` controls inverse ink on light-mode hero bands only. */
  const headerVariant = background === "bgDeep" && !isDark ? "dark" : "light";

  const bottomPad = customerScrollPaddingBottom(insets);

  const contentPadStyle = useMemo(
    () => ({
      paddingHorizontal: gutter,
      paddingBottom: bottomPad,
      width: "100%",
      alignSelf: "center",
      maxWidth: CUSTOMER_PAGE_MAX_WIDTH,
      ...Platform.select({
        web: noScroll ? { minHeight: 0 } : { flexGrow: 1 },
        default: {},
      }),
    }),
    [bottomPad, gutter, noScroll]
  );

  const headerBlock =
    title || breadcrumbLabel || kicker || headerRight ? (
      <PageHeader
        navigation={navigation}
        title={title}
        breadcrumbLabel={breadcrumbLabel}
        kicker={kicker}
        hideBackButton={hideHeaderBackButton}
        onBack={onHeaderBack}
        rightActions={headerRight}
        variant={headerVariant}
        headingLevel={1}
      />
    ) : null;

  const body = noScroll ? (
    <>
      {headerBlock}
      <View style={styles.noScrollBody}>{children}</View>
    </>
  ) : (
    <>
      {headerBlock}
      {children}
    </>
  );

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: bgColor }]}
      edges={["top", "left", "right"]}
      accessibilityLabel={accessibilityLabel || title}
    >
      {noScroll ? (
        <View
          style={[
            styles.flex,
            styles.noScrollHost,
            contentPadStyle,
            contentContainerStyle,
          ]}
        >
          {body}
        </View>
      ) : (
        <ScrollView
          style={[styles.flex, Platform.OS === "web" ? styles.webPageScroll : null]}
          contentContainerStyle={[contentPadStyle, contentContainerStyle]}
          refreshControl={refreshControl}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={Platform.OS === "web"}
          {...scrollViewProps}
        >
          {body}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  noScrollHost: Platform.select({
    web: {
      minHeight: 0,
      overflow: "hidden",
      flexDirection: "column",
    },
    default: {
      minHeight: 0,
      flexDirection: "column",
    },
  }),
  noScrollBody: {
    flex: 1,
    minHeight: 0,
    width: "100%",
  },
  webPageScroll: Platform.select({
    web: {
      minHeight: 0,
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
      touchAction: "pan-y",
    },
    default: {},
  }),
});

const Screen = memo(ScreenBase);

export default Screen;
