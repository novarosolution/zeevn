import React, { memo, useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts } from "../../theme/tokens";
import { useTheme } from "../../context/ThemeContext";
import { headingA11yProps } from "../../utils/a11y";

/**
 * Two-row editorial header: back + breadcrumb, then optional kicker + serif title.
 * Pass hideBackButton on root tab stacks.
 *
 * When `brandSlot` is set (e.g. auth wordmark), row 1 becomes that slot only — no back chevron.
 */
function PageHeaderBase({
  navigation,
  title,
  breadcrumbLabel,
  kicker,
  hideBackButton = false,
  onBack,
  rightActions,
  variant = "light",
  brandSlot,
  headingLevel = 1,
}) {
  const { semanticPalette, TYPE, SPACING, isDark } = useTheme();

  const canGoBack = typeof navigation?.canGoBack === "function" && navigation.canGoBack();
  const showBack = !hideBackButton && canGoBack;

  const isDarkSurface = variant === "dark" && !isDark;
  const ink = isDark
    ? semanticPalette.ink
    : isDarkSurface
      ? semanticPalette.inkInverse
      : semanticPalette.ink;
  const muted = isDark
    ? semanticPalette.inkMuted
    : isDarkSurface
      ? semanticPalette.inkInverseMuted
      : semanticPalette.inkSoft;
  const soft = isDark
    ? semanticPalette.inkSoft
    : isDarkSurface
      ? semanticPalette.inkInverseSoft
      : semanticPalette.inkSoft;

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (canGoBack) navigation.goBack();
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          width: "100%",
          paddingBottom: SPACING.md,
          gap: SPACING.sm,
          ...Platform.select({
            web: {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: isDark ? semanticPalette.line : semanticPalette.lineSoft,
              marginBottom: SPACING.xs,
            },
            default: {},
          }),
        },
        brandRow: {
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: SPACING.xs,
        },
        row1: {
          flexDirection: "row",
          alignItems: "center",
          gap: SPACING.sm,
          minHeight: 28,
        },
        backHit: {
          width: 36,
          height: 36,
          alignItems: "center",
          justifyContent: "center",
          marginLeft: Platform.OS === "web" ? -6 : -4,
          ...Platform.select({
            web: { cursor: "pointer", borderRadius: 999, transition: "background-color 160ms ease, box-shadow 160ms ease" },
            default: {},
          }),
        },
        backHitHover: {
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(14,23,41,0.05)",
        },
        backHitFocus: {
          ...Platform.select({
            web: { boxShadow: isDark ? "0 0 0 2px rgba(200,169,126,0.28)" : "0 0 0 2px rgba(200,169,126,0.25)" },
            default: {},
          }),
        },
        crumb: {
          flex: 1,
          minWidth: 0,
          fontFamily: fonts.medium,
          fontSize: TYPE.caption.fontSize,
          lineHeight: TYPE.caption.lineHeight,
          letterSpacing: Platform.OS === "web" ? 1.1 : 1.4,
          textTransform: "uppercase",
          color: muted,
        },
        actions: {
          flexDirection: "row",
          alignItems: "center",
          gap: SPACING.xs,
          flexShrink: 0,
        },
        kicker: {
          fontFamily: fonts.semibold,
          ...TYPE.overline,
          color: soft,
          marginBottom: 2,
        },
        title: {
          fontFamily: TYPE.serifFamily,
          ...TYPE.h1,
          color: ink,
        },
      }),
    [TYPE, SPACING, ink, isDark, muted, semanticPalette.line, semanticPalette.lineSoft, soft]
  );

  if (brandSlot) {
    const showSecondRow = Boolean(title || kicker);
    return (
      <View style={styles.root}>
        <View style={styles.brandRow}>{brandSlot}</View>
        {showSecondRow ? (
          <View>
            {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
            {title ? (
              <Text style={styles.title} {...headingA11yProps(headingLevel)}>
                {title}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.row1}>
        {showBack ? (
          <Pressable
            onPress={handleBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed, hovered, focused }) => [
              styles.backHit,
              hovered && Platform.OS === "web" ? styles.backHitHover : null,
              focused && Platform.OS === "web" ? styles.backHitFocus : null,
              pressed ? { opacity: 0.75 } : null,
            ]}
          >
            <Ionicons name="chevron-back" size={24} color={ink} />
          </Pressable>
        ) : null}
        {breadcrumbLabel ? (
          <Text style={styles.crumb} numberOfLines={1}>
            {breadcrumbLabel}
          </Text>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        {rightActions ? <View style={styles.actions}>{rightActions}</View> : null}
      </View>
      <View>
        {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
        {title ? (
          <Text style={styles.title} {...headingA11yProps(headingLevel)}>
            {title}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const PageHeader = memo(PageHeaderBase);

export default PageHeader;
