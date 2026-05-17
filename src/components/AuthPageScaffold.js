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
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppFooter from "./AppFooter";
import BrandWordmark from "./BrandWordmark";
import CustomerScreenShell from "./CustomerScreenShell";
import PageHeader from "./ui/PageHeader";
import Button from "./ui/Button";
import { APP_CONTENT_AUTH } from "../content/appContent";
import { useTheme } from "../context/ThemeContext";
import { FONT_DISPLAY } from "../theme/customerAlchemy";
import { adminScrollPaddingBottom, customerScrollFill } from "../theme/screenLayout";
import { fonts, icon } from "../theme/tokens";

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
              textDecorationColor: semanticPalette.accent,
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

const SPLIT_BREAKPOINT = 768;

/**
 * Auth split layout + shared chrome (editorial panel, wordmark header, sale-only alerts).
 *
 * @param {'signIn' | 'signUp' | 'forgot'} variant
 */
export default function AuthPageScaffold({
  variant = "signIn",
  navigation,
  children,
  showOAuthRow = true,
  showGuestLink,
  titleOverride,
  subtitleOverride,
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const editorial = APP_CONTENT_AUTH.layout;
  const copy = APP_CONTENT_AUTH[variant];
  const split = width >= SPLIT_BREAKPOINT;
  const noopOAuth = () => {};

  const styles = useMemo(
    () =>
      StyleSheet.create({
        shell: { flex: 1 },
        kav: customerScrollFill,
        scrollContent: {
          flexGrow: 1,
          ...Platform.select({
            web: { minHeight: "100%" },
            default: {},
          }),
          paddingBottom: adminScrollPaddingBottom(insets),
        },
        row: {
          flexDirection: split ? "row" : "column",
          width: "100%",
          ...Platform.select({
            web: split ? { flex: 1, minHeight: "calc(100vh - 80px)" } : {},
            default: {},
          }),
        },
        railImage: {
          width: split ? "60%" : "100%",
          backgroundColor: semanticPalette.bgDeep,
          minHeight: split ? 520 : 180,
          position: "relative",
          overflow: "hidden",
        },
        railImageFill: {
          ...StyleSheet.absoluteFillObject,
        },
        railScrim: {
          ...StyleSheet.absoluteFillObject,
        },
        railQuoteWrap: {
          ...StyleSheet.absoluteFillObject,
          justifyContent: "center",
          paddingHorizontal: SPACING["2xl"],
          paddingVertical: SPACING.xl,
        },
        railOverline: {
          fontFamily: fonts.semibold,
          ...TYPE.overline,
          color: semanticPalette.accent,
          marginBottom: SPACING.sm,
        },
        railQuote: {
          fontFamily: FONT_DISPLAY,
          fontSize: split ? TYPE.h2.fontSize : TYPE.h3.fontSize,
          lineHeight: split ? TYPE.h2.lineHeight : TYPE.h3.lineHeight,
          letterSpacing: TYPE.h2.letterSpacing,
          color: semanticPalette.inkInverse,
          maxWidth: 420,
        },
        railAttr: {
          marginTop: SPACING.md,
          fontFamily: fonts.medium,
          fontSize: TYPE.small.fontSize,
          lineHeight: TYPE.small.lineHeight,
          color: semanticPalette.inkInverseMuted,
        },
        formCol: {
          width: split ? "40%" : "100%",
          flexGrow: split ? 1 : undefined,
          backgroundColor: semanticPalette.bg,
          paddingHorizontal: SPACING.xl,
          paddingTop: split ? SPACING["3xl"] : SPACING.lg,
          paddingBottom: SPACING["2xl"],
          justifyContent: "flex-start",
        },
        formInner: {
          width: "100%",
          maxWidth: 420,
          alignSelf: "center",
        },
        formTitle: {
          marginTop: SPACING.base,
          fontFamily: TYPE.serifFamily,
          ...TYPE.h1,
          color: semanticPalette.ink,
        },
        formSubtitle: {
          marginTop: SPACING.sm,
          marginBottom: SPACING.base,
          fontFamily: fonts.regular,
          ...TYPE.body,
          color: semanticPalette.inkSoft,
          maxWidth: 420,
        },
        dividerWrap: {
          flexDirection: "row",
          alignItems: "center",
          gap: SPACING.sm,
          marginVertical: SPACING.base,
        },
        dividerHairline: {
          flex: 1,
          height: StyleSheet.hairlineWidth,
          backgroundColor: semanticPalette.line,
        },
        dividerLabel: {
          fontFamily: fonts.semibold,
          ...TYPE.micro,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          color: semanticPalette.inkMuted,
        },
        oauthStack: {
          gap: SPACING.sm,
          width: "100%",
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
          color: semanticPalette.inkMuted,
        },
        guestLink: {
          marginTop: SPACING.md,
          textAlign: "center",
          fontFamily: fonts.medium,
          fontSize: TYPE.small.fontSize,
          color: semanticPalette.inkMuted,
        },
      }),
    [TYPE, SPACING, insets, semanticPalette, split]
  );

  const socialHints =
    copy.oauthUnavailableHint ||
    APP_CONTENT_AUTH.signIn.oauthUnavailableHint ||
    "Unavailable";

  return (
    <CustomerScreenShell style={styles.shell} variant="auth">
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.row}>
            <View
              style={styles.railImage}
              accessibilityLabel={editorial.heroBannerA11y}
              accessible
              {...(Platform.OS !== "web" ? { accessibilityRole: "image" } : {})}
            >
              <Image
                source={{ uri: editorial.heroImageUri }}
                style={styles.railImageFill}
                contentFit="cover"
              />
              <LinearGradient
                colors={["rgba(14,23,41,0.05)", "rgba(14,23,41,0.75)", "rgba(14,23,41,0.92)"]}
                locations={[0, 0.45, 1]}
                style={styles.railScrim}
              />
              <View style={[styles.railQuoteWrap, { pointerEvents: "none" }]}>
                <Text style={styles.railOverline}>{editorial.heroOverline}</Text>
                <Text style={styles.railQuote}>{editorial.heroQuote}</Text>
                <Text style={styles.railAttr}>{editorial.heroQuoteAttribution}</Text>
              </View>
            </View>

            <View style={styles.formCol}>
              <View style={styles.formInner}>
                <PageHeader
                  brandSlot={
                    <BrandWordmark
                      sizeKey={split ? "headerDefault" : "headerCompact"}
                      color={semanticPalette.ink}
                    />
                  }
                />
                <Text style={styles.formTitle} accessibilityRole="header">
                  {titleOverride ?? copy.title}
                </Text>
                <Text style={styles.formSubtitle}>{subtitleOverride ?? copy.subtitle}</Text>

                {children}

                {showOAuthRow ? (
                  <>
                    <View style={styles.dividerWrap} accessibilityRole="text">
                      <View style={styles.dividerHairline} />
                      <Text style={styles.dividerLabel}>{copy.dividerContinueWith}</Text>
                      <View style={styles.dividerHairline} />
                    </View>

                    <View style={styles.oauthStack}>
                      <Button
                        variant="secondary"
                        size="lg"
                        fullWidth
                        label={copy.googleCta}
                        onPress={noopOAuth}
                        iconLeft={
                          <Ionicons name="logo-google" size={icon.md} color={semanticPalette.ink} />
                        }
                        accessibilityHint={socialHints}
                      />
                      <Button
                        variant="secondary"
                        size="lg"
                        fullWidth
                        label={copy.appleCta}
                        onPress={noopOAuth}
                        iconLeft={
                          <Ionicons name="logo-apple" size={icon.md} color={semanticPalette.ink} />
                        }
                        accessibilityHint={socialHints}
                      />
                    </View>
                  </>
                ) : null}

                {variant === "signIn" ? (
                  <View style={styles.footerLeadRow}>
                    <Text style={styles.footerLead}>{copy.footerLeadNew}</Text>
                    <FooterAuthLink
                      hint={copy.footerNavigateRegisterHint}
                      onPress={() => navigation.navigate("Register")}
                    >
                      {copy.footerLinkNew}
                    </FooterAuthLink>
                  </View>
                ) : variant === "signUp" ? (
                  <View style={styles.footerLeadRow}>
                    <Text style={styles.footerLead}>{copy.footerLeadExisting}</Text>
                    <FooterAuthLink
                      hint={copy.footerNavigateLoginHint}
                      onPress={() => navigation.navigate("Login")}
                    >
                      {copy.footerLinkExisting}
                    </FooterAuthLink>
                  </View>
                ) : (
                  <View style={styles.footerLeadRow}>
                    <Text style={styles.footerLead}>{copy.footerLeadRemembered}</Text>
                    <FooterAuthLink
                      hint={copy.footerNavigateLoginHint}
                      onPress={() => navigation.navigate("Login")}
                    >
                      {copy.footerLinkSignIn}
                    </FooterAuthLink>
                  </View>
                )}

                {(showGuestLink ?? variant === "signIn") && variant === "signIn" ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={APP_CONTENT_AUTH.signIn.guestCta}
                    accessibilityHint={APP_CONTENT_AUTH.signIn.guestNavigateHint}
                    onPress={() => navigation.navigate("Home")}
                  >
                    <Text style={styles.guestLink}>{APP_CONTENT_AUTH.signIn.guestCta}</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>

          <View style={{ marginTop: SPACING.xl, paddingHorizontal: SPACING.xl, width: "100%", maxWidth: 900, alignSelf: "center" }}>
            <AppFooter webTight={Platform.OS === "web"} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </CustomerScreenShell>
  );
}

/** @deprecated Use `../components/auth/AuthFormMessage` */
export { default as AuthFormMessage } from "./auth/AuthFormMessage";
