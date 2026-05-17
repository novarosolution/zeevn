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
  const { semanticPalette } = useTheme();
  const gutter = useHorizontalPagePadding();

  const bgColor = background === "bgDeep" ? semanticPalette.bgDeep : semanticPalette.bg;
  const headerVariant = background === "bgDeep" ? "dark" : "light";

  const bottomPad = customerScrollPaddingBottom(insets);

  const contentPadStyle = useMemo(
    () => ({
      paddingHorizontal: gutter,
      paddingBottom: bottomPad,
      width: "100%",
      alignSelf: "center",
      maxWidth: CUSTOMER_PAGE_MAX_WIDTH,
      ...Platform.select({ web: { flexGrow: 1 }, default: {} }),
    }),
    [bottomPad, gutter]
  );

  const body = (
    <>
      {title ? (
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
      ) : null}
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
        <View style={[styles.flex, contentPadStyle, contentContainerStyle]}>{body}</View>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[contentPadStyle, contentContainerStyle]}
          refreshControl={refreshControl}
          keyboardShouldPersistTaps="handled"
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
});

const Screen = memo(ScreenBase);

export default Screen;
