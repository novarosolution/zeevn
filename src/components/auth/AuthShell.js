import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BrandWordmark from "../BrandWordmark";
import CustomerScreenShell from "../CustomerScreenShell";
import { AUTH_SCREEN } from "../../content/appContent";
import { useTheme } from "../../context/ThemeContext";
import { COLORS } from "../../styles/designSystem";
import { FONT_DISPLAY_SEMI } from "../../theme/customerAlchemy";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, spacing } from "../../theme/tokens";
import { WEB_Z_INDEX, webDecorLayer, webElevatedLayer } from "../../theme/web";
import { headingA11yProps } from "../../utils/a11y";
import { pointerEventsProp } from "../../utils/pointerEventsStyle";

const SPLIT_BREAKPOINT = 768;
const PHONE_BANNER_HEIGHT = 220;
const FORM_MAX_WIDTH = 420;
const FORM_COLUMN_MAX_WIDTH = 480;

function FooterAuthLink({ children, onPress, hint }) {
  const [hover, setHover] = useState(false);
  const { semanticPalette, TYPE } = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityHint={hint}
      onPress={onPress}
      onHoverIn={() => Platform.OS === "web" && setHover(true)}
      onHoverOut={() => Platform.OS === "web" && setHover(false)}
    >
      <Text
        style={{
          fontFamily: fonts.medium,
          fontSize: TYPE.small.fontSize,
          lineHeight: TYPE.small.lineHeight,
          color: semanticPalette.ink,
          ...Platform.select({
            web: {
              textDecorationLine: hover ? "underline" : "none",
              textDecorationColor: semanticPalette.ink,
            },
            default: {},
          }),
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}

function SkipToContentLink({ onPress, label }) {
  const { semanticPalette, TYPE } = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={({ focused }) => [
        styles.skipLink,
        focused && styles.skipLinkFocused,
        Platform.OS === "web" && styles.skipLinkWeb,
      ]}
    >
      <Text
        style={{
          fontFamily: fonts.semibold,
          fontSize: TYPE.caption.fontSize,
          color: semanticPalette.ink,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function EditorialPane({ split, leftPane, heroImageUri, heroBannerA11y }) {
  const overline = `■ ${leftPane.overline}`;
  return (
    <View
      style={[
        styles.editorialShell,
        split ? styles.editorialSplit : styles.editorialStacked,
        webDecorLayer(0),
      ]}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      {...(Platform.OS === "web" ? { dataSet: { zvDecor: "true" } } : {})}
    >
      <Image
        source={{ uri: heroImageUri }}
        style={[StyleSheet.absoluteFill, styles.editorialHeroImage]}
        contentFit="cover"
        accessibilityLabel={heroBannerA11y}
        accessible
        {...(Platform.OS === "web" ? { alt: heroBannerA11y } : { accessibilityRole: "image" })}
        {...pointerEventsProp("none")}
      />
      <LinearGradient
        colors={["rgba(200,169,126,0.10)", "transparent"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.35, y: 0.65 }}
        style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}
      />
      <LinearGradient
        colors={["rgba(14,23,41,0.2)", "rgba(14,23,41,0.88)"]}
        locations={[0.15, 1]}
        style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}
      />

      <View style={[styles.editorialInner, split ? styles.editorialInnerSplit : styles.editorialInnerStacked]}>
        <View style={styles.editorialBrand}>
          <BrandWordmark fontSizeOverride={28} color={COLORS.inkInverse} />
          <Text style={styles.editorialSubline}>{AUTH_SCREEN.layout.wordmarkSubline}</Text>
        </View>

        <View style={styles.editorialQuoteBlock}>
          <Text style={styles.editorialOverline}>{overline}</Text>
          <Text style={styles.editorialHeadline}>{leftPane.headline}</Text>
          <Text style={styles.editorialSubcopy}>{leftPane.subline}</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Shared auth layout — split editorial + form on tablet+, stacked on phone.
 *
 * @param {'login' | 'register' | 'forgot' | 'reset'} variant
 */
export default function AuthShell({
  variant,
  navigation,
  children,
  formTitle,
  formSubtitle,
  footerLabel,
  footerLinkLabel,
  footerLinkOnPress,
  showBackLink = true,
  bareForm = false,
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const split = width >= SPLIT_BREAKPOINT;
  const copy = AUTH_SCREEN[variant] ?? AUTH_SCREEN.login;
  const leftPane = copy.leftPane;
  const layout = AUTH_SCREEN.layout;
  const shared = AUTH_SCREEN.shared;

  const resolvedTitle = formTitle ?? copy.formTitle;
  const resolvedSubtitle = formSubtitle ?? copy.formSubtitle;
  const resolvedFooterLabel = footerLabel ?? copy.footerLabel;
  const resolvedFooterLink = footerLinkLabel ?? copy.footerLink;

  const shellStyles = useMemo(
    () =>
      StyleSheet.create({
        kav: customerScrollFill,
        scrollContent: {
          flexGrow: 1,
          ...Platform.select({
            web: { minHeight: "100vh" },
            default: {},
          }),
        },
        row: {
          flexDirection: split ? "row" : "column",
          width: "100%",
          flex: Platform.OS === "web" && split ? 1 : undefined,
          ...Platform.select({
            web: split ? { minHeight: "100vh", position: "relative", zIndex: 0 } : {},
            default: {},
          }),
        },
        formCol: {
          width: split ? "40%" : "100%",
          maxWidth: split ? FORM_COLUMN_MAX_WIDTH : undefined,
          flexGrow: split ? 1 : undefined,
          flexShrink: split ? 0 : undefined,
          ...webElevatedLayer(WEB_Z_INDEX.authForm),
          backgroundColor: semanticPalette.bg,
          paddingHorizontal: split ? spacing.xxl : spacing.lg,
          paddingTop: split ? 0 : spacing.xl,
          paddingBottom: Math.max(insets.bottom, spacing.xl),
          justifyContent: split ? "center" : "flex-start",
          ...Platform.select({
            web: split ? { minHeight: "100vh" } : {},
            default: {},
          }),
        },
        formInner: {
          width: "100%",
          maxWidth: FORM_MAX_WIDTH,
          alignSelf: "center",
          ...webElevatedLayer(WEB_Z_INDEX.authInteractive),
        },
        mainContent: {
          width: "100%",
          ...webElevatedLayer(WEB_Z_INDEX.authInteractive + 1),
        },
        backLink: {
          alignSelf: "flex-start",
          marginBottom: SPACING.lg,
          paddingVertical: SPACING.xs,
        },
        backLinkText: {
          fontFamily: fonts.semibold,
          fontSize: TYPE.micro.fontSize,
          lineHeight: TYPE.micro.lineHeight,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: semanticPalette.inkSoft,
        },
        formTitle: {
          fontFamily: TYPE.serifFamily,
          ...TYPE.h1,
          color: semanticPalette.ink,
        },
        formSubtitle: {
          marginTop: SPACING.sm,
          marginBottom: SPACING.lg,
          fontFamily: fonts.regular,
          ...TYPE.body,
          color: semanticPalette.inkSoft,
          maxWidth: FORM_MAX_WIDTH,
        },
        footerLeadRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: 6,
          marginTop: SPACING.xl,
        },
        footerLead: {
          fontFamily: fonts.regular,
          fontSize: TYPE.small.fontSize,
          lineHeight: TYPE.small.lineHeight,
          color: semanticPalette.inkSoft,
        },
      }),
    [TYPE, SPACING, insets.bottom, semanticPalette, split]
  );

  const focusMain = () => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const el = document.getElementById("auth-main-content");
      el?.focus?.();
      el?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }
  };

  const footerPress =
    footerLinkOnPress ??
    (() => {
      if (variant === "login") navigation.navigate("Register");
      else navigation.navigate("Login");
    });

  return (
    <CustomerScreenShell variant="auth" topAccent={false}>
      <KeyboardAvoidingView style={shellStyles.kav} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={shellStyles.scrollContent}
        >
          <View style={shellStyles.row}>
            <EditorialPane
              split={split}
              leftPane={leftPane}
              heroImageUri={layout.heroImageUri}
              heroBannerA11y={layout.heroBannerA11y}
            />

            <View
              style={shellStyles.formCol}
              {...(Platform.OS === "web" ? { dataSet: { zvElevated: "true" } } : {})}
            >
              <View style={shellStyles.formInner}>
                {split && showBackLink ? (
                  <Pressable
                    style={shellStyles.backLink}
                    accessibilityRole="link"
                    accessibilityLabel={shared.backToHome}
                    onPress={() => navigation.navigate("Home")}
                  >
                    <Text style={shellStyles.backLinkText}>← {shared.backToHome}</Text>
                  </Pressable>
                ) : null}

                <SkipToContentLink onPress={focusMain} label="Skip to form" />

                <View
                  nativeID="auth-main-content"
                  accessibilityRole="main"
                  style={shellStyles.mainContent}
                  {...(Platform.OS === "web" ? { tabIndex: -1, dataSet: { zvElevated: "true" } } : {})}
                >
                  {!bareForm ? (
                    <>
                      <Text {...headingA11yProps(1)} style={shellStyles.formTitle}>
                        {resolvedTitle}
                      </Text>
                      {resolvedSubtitle ? (
                        <Text style={shellStyles.formSubtitle}>{resolvedSubtitle}</Text>
                      ) : null}
                    </>
                  ) : null}

                  {children}
                </View>

                {!bareForm && resolvedFooterLabel && resolvedFooterLink ? (
                  <View style={shellStyles.footerLeadRow}>
                    <Text style={shellStyles.footerLead}>{resolvedFooterLabel}</Text>
                    <FooterAuthLink onPress={footerPress} hint={resolvedFooterLink}>
                      {resolvedFooterLink} →
                    </FooterAuthLink>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </CustomerScreenShell>
  );
}

const styles = StyleSheet.create({
  skipLink: {
    position: "absolute",
    left: -9999,
    top: 8,
    zIndex: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  skipLinkWeb: Platform.select({
    web: {
      position: "relative",
      left: 0,
      opacity: 0,
      marginBottom: spacing.sm,
    },
    default: {},
  }),
  skipLinkFocused: Platform.select({
    web: { opacity: 1, outlineWidth: 2, outlineColor: COLORS.accent },
    default: { opacity: 1 },
  }),
  editorialShell: {
    backgroundColor: COLORS.bgDeep,
    position: "relative",
    overflow: "hidden",
  },
  editorialSplit: {
    width: "60%",
    minHeight: 520,
  },
  editorialStacked: {
    width: "100%",
    height: PHONE_BANNER_HEIGHT,
  },
  editorialHeroImage: {
    opacity: 0.45,
  },
  editorialInner: {
    flex: 1,
    justifyContent: "space-between",
    ...Platform.select({
      web: { position: "relative", zIndex: 1 },
      default: { zIndex: 1 },
    }),
  },
  editorialInnerSplit: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
  },
  editorialInnerStacked: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  editorialBrand: {
    gap: spacing.xs,
  },
  editorialSubline: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 8,
    textTransform: "uppercase",
    color: COLORS.accent,
  },
  editorialQuoteBlock: {
    gap: spacing.xl,
    maxWidth: 440,
    alignSelf: "flex-start",
    ...Platform.select({
      web: { marginTop: "auto", paddingBottom: spacing.xl },
      default: { marginTop: spacing.md },
    }),
  },
  editorialOverline: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: COLORS.accent,
  },
  editorialHeadline: {
    fontFamily: FONT_DISPLAY_SEMI,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "500",
    color: COLORS.inkInverse,
  },
  editorialSubcopy: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.inkInverseSoft,
    maxWidth: 360,
  },
});
