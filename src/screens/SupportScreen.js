import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import Animated, { FadeInLeft, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MotionScrollView from "../components/motion/MotionScrollView";
import SectionReveal from "../components/motion/SectionReveal";
import useReducedMotion from "../hooks/useReducedMotion";
import { motionDuration, staggerDelay } from "../theme/motion";
import AppFooter from "../components/AppFooter";
import BottomNavBar from "../components/BottomNavBar";
import AuthGateShell from "../components/AuthGateShell";
import CustomerScreenShell from "../components/CustomerScreenShell";
import ScreenPageHeader from "../components/ScreenPageHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { fetchMySupportThread, sendMySupportMessage } from "../services/userService";
import {
  customerInnerPageScrollContent,
  customerPanel,
  customerScrollFill,
} from "../theme/screenLayout";
import { SUPPORT_EMAIL_DISPLAY, SUPPORT_SCREEN } from "../content/appContent";
import { ALCHEMY } from "../theme/customerAlchemy";
import { fonts, icon, radius, spacing, typography } from "../theme/tokens";
import PremiumEmptyState from "../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../components/ui/PremiumErrorBanner";
import PremiumInput from "../components/ui/PremiumInput";
import PremiumButton from "../components/ui/PremiumButton";
import PremiumCard from "../components/ui/PremiumCard";
import SkeletonBlock from "../components/ui/SkeletonBlock";

function buildSupportContactLinks() {
  return [
    {
      key: "chat",
      icon: "chatbubble-ellipses",
      title: SUPPORT_SCREEN.liveChatTitle,
      description: SUPPORT_SCREEN.contactChatSub,
      accent: "gold",
      actionType: "scroll",
    },
    {
      key: "email",
      icon: "mail",
      title: SUPPORT_SCREEN.contactEmailTitle,
      description: SUPPORT_SCREEN.contactEmailSub,
      accent: "navy",
      actionType: "link",
      url: `mailto:${SUPPORT_EMAIL_DISPLAY}`,
    },
    {
      key: "whatsapp",
      icon: "logo-whatsapp",
      title: SUPPORT_SCREEN.contactWhatsAppTitle,
      description: SUPPORT_SCREEN.contactWhatsAppSub,
      accent: "green",
      actionType: "link",
      url: SUPPORT_SCREEN.whatsappUrl,
    },
  ];
}

export default function SupportScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isCompactWeb = Platform.OS === "web" && width < 760;
  const { colors: c, shadowPremium, isDark } = useTheme();
  const styles = useMemo(
    () => createSupportStyles(c, shadowPremium, isDark, { isCompactWeb }),
    [c, shadowPremium, isDark, isCompactWeb]
  );
  const insets = useSafeAreaInsets();
  const { isAuthenticated, token, isAuthLoading } = useAuth();
  const reducedMotion = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [thread, setThread] = useState(null);
  const [message, setMessage] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [toast, setToast] = useState("");
  const scrollRef = useRef(null);
  const chatSectionYRef = useRef(0);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      navigation.navigate("Login");
    }
  }, [isAuthLoading, isAuthenticated, navigation]);

  const loadThread = useCallback(async () => {
    const startedAt = Date.now();
    try {
      setLoading(true);
      setError("");
      const data = await fetchMySupportThread(token);
      setThread(data || null);
    } catch (err) {
      setError(err.message || SUPPORT_SCREEN.loadErrorFallback);
    } finally {
      const elapsed = Date.now() - startedAt;
      const minimumLoaderMs = 320;
      if (elapsed < minimumLoaderMs) {
        await new Promise((resolve) => setTimeout(resolve, minimumLoaderMs - elapsed));
      }
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return;
    loadThread();
  }, [isAuthLoading, isAuthenticated, loadThread]);

  const handleSend = async () => {
    const text = String(message || "").trim();
    if (!text) return;
    try {
      setSending(true);
      setError("");
      const updated = await sendMySupportMessage(token, text);
      setThread(updated || null);
      setMessage("");
      setToast(SUPPORT_SCREEN.sentToast);
    } catch (err) {
      setError(err.message || SUPPORT_SCREEN.sendErrorFallback);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleContactPress = useCallback(async (link) => {
    if (link.actionType === "scroll") {
      scrollRef.current?.scrollTo?.({
        y: Math.max(0, chatSectionYRef.current - spacing.lg),
        animated: true,
      });
      return;
    }
    if (link.actionType === "link" && link.url) {
      try {
        const can = await Linking.canOpenURL(link.url);
        if (can) await Linking.openURL(link.url);
      } catch (_err) { /* ignore */ }
    }
  }, []);

  if (isAuthLoading || !isAuthenticated) {
    return <AuthGateShell />;
  }

  return (
    <CustomerScreenShell style={styles.screen}>
      <KeyboardAvoidingView
        style={customerScrollFill}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
      <MotionScrollView
        ref={scrollRef}
        style={customerScrollFill}
        contentContainerStyle={customerInnerPageScrollContent(insets)}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenPageHeader
          navigation={navigation}
          title={SUPPORT_SCREEN.pageTitle}
          subtitle={SUPPORT_SCREEN.pageHeaderSubtitle}
          right={
            Platform.OS !== "web" ? (
              <PremiumButton
                label={SUPPORT_SCREEN.refreshCta}
                iconLeft="refresh-outline"
                variant="ghost"
                size="sm"
                onPress={loadThread}
              />
            ) : undefined
          }
        />
        <SectionReveal preset="fade-up" delay={20}>
          <View style={styles.contactGrid}>
            {buildSupportContactLinks().map((link) => {
              const palette = getContactPalette(link.accent, c, isDark);
              return (
                <PremiumCard
                  key={link.key}
                  onPress={() => handleContactPress(link)}
                  goldAccent={link.accent === "gold"}
                  variant={link.accent === "gold" ? "accent" : "panel"}
                  padding="lg"
                  style={styles.contactCard}
                  accessibilityLabel={`${link.title} — ${link.description}`}
                >
                  <View style={[styles.contactIconWrap, { backgroundColor: palette.bg, borderColor: palette.border }]}>
                    <Ionicons name={link.icon} size={icon.lg} color={palette.icon} />
                  </View>
                  <Text style={styles.contactTitle}>{link.title}</Text>
                  <Text style={styles.contactDescription} numberOfLines={2}>{link.description}</Text>
                  <View style={styles.contactCta}>
                    <Text style={[styles.contactCtaText, { color: palette.icon }]}>
                      {link.actionType === "scroll" ? SUPPORT_SCREEN.openChatCta : SUPPORT_SCREEN.reachOutCta}
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color={palette.icon} />
                  </View>
                </PremiumCard>
              );
            })}
          </View>
        </SectionReveal>
        {error ? (
          <SectionReveal preset="fade-up" delay={40}>
            <View style={styles.bannerWrap}>
              <PremiumErrorBanner severity="error" message={error} compact />
            </View>
          </SectionReveal>
        ) : null}
        {loading ? (
          <View style={styles.panel}>
            <SkeletonBlock height={18} width="38%" style={{ marginBottom: spacing.sm }} />
            <SkeletonBlock height={64} radius={radius.xl} style={{ marginBottom: spacing.xs, alignSelf: "flex-start", width: "78%" }} />
            <SkeletonBlock height={48} radius={radius.xl} style={{ marginBottom: spacing.xs, alignSelf: "flex-end", width: "62%" }} />
            <SkeletonBlock height={56} radius={radius.xl} style={{ marginBottom: spacing.sm, alignSelf: "flex-start", width: "70%" }} />
            <SkeletonBlock height={88} radius={radius.xl} style={{ marginTop: spacing.sm }} />
            <SkeletonBlock height={44} width="44%" radius={radius.xl} style={{ marginTop: spacing.sm }} />
          </View>
        ) : (
          <SectionReveal preset="fade-up" delay={120}>
          <View
            style={styles.panel}
            onLayout={(event) => {
              chatSectionYRef.current = event.nativeEvent.layout.y;
            }}
          >
            {thread ? (
              <View style={styles.threadMetaRow}>
                <View style={[styles.metaPill, styles.metaPillPrimary]}>
                  <Ionicons name="pulse-outline" size={14} color={c.primary} />
                  <Text style={[styles.metaPillText, { color: c.primary }]}>Status: {thread.status || "open"}</Text>
                </View>
                <View style={styles.metaPill}>
                  <Ionicons name="time-outline" size={14} color={c.textSecondary} />
                  <Text style={styles.metaPillText}>
                    {thread.lastMessageAt
                      ? new Date(thread.lastMessageAt).toLocaleString()
                      : SUPPORT_SCREEN.lastUpdateUnavailable}
                  </Text>
                </View>
              </View>
            ) : null}
            {(thread?.messages || []).length === 0 ? (
              <PremiumEmptyState
                iconName="chatbubbles-outline"
                title={SUPPORT_SCREEN.emptyThreadTitle}
                description={SUPPORT_SCREEN.emptyThreadDescription}
                compact
              />
            ) : (
              <View style={styles.messageStream}>
                {(thread?.messages || []).map((item, index) => {
                  const isAdmin = item.senderRole === "admin";
                  const enterFrom = reducedMotion
                    ? undefined
                    : isAdmin
                      ? FadeInLeft.delay(staggerDelay(index, { initialDelay: 60, gap: 70 })).duration(motionDuration.base)
                      : FadeInRight.delay(staggerDelay(index, { initialDelay: 60, gap: 70 })).duration(motionDuration.base);
                  return (
                    <Animated.View
                      key={`${index}-${item.createdAt || ""}`}
                      entering={enterFrom}
                      style={[
                        styles.messageBubble,
                        isAdmin ? styles.adminBubble : styles.userBubble,
                        isAdmin ? styles.adminBubbleAlign : styles.userBubbleAlign,
                      ]}
                    >
                      <Text style={styles.messageAuthor}>
                        {isAdmin ? SUPPORT_SCREEN.authorAdmin : SUPPORT_SCREEN.authorYou} •{" "}
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                      </Text>
                      <Text style={styles.messageText}>{item.message}</Text>
                    </Animated.View>
                  );
                })}
              </View>
            )}
            <View style={styles.composerWrap}>
              <View style={styles.composerHeader}>
                <Text style={styles.composerTitle}>{SUPPORT_SCREEN.composerTitle}</Text>
                <Text style={styles.composerHint}>{SUPPORT_SCREEN.composerHint}</Text>
              </View>
              <PremiumInput
                label={SUPPORT_SCREEN.composerLabel}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={3}
                iconLeft="chatbox-ellipses-outline"
              />
            </View>
            <PremiumButton
              label={sending ? SUPPORT_SCREEN.sendingCta : SUPPORT_SCREEN.sendCta}
              iconRight="paper-plane"
              variant="primary"
              size="md"
              fullWidth
              loading={sending}
              disabled={sending}
              onPress={handleSend}
              style={styles.sendBtnSpacer}
            />
          </View>
          </SectionReveal>
        )}
        <SectionReveal preset="fade-up" delay={100}>
          <View style={styles.faqWrap}>
            <View style={styles.faqHeader}>
                <Text style={styles.faqEyebrow}>{SUPPORT_SCREEN.faqEyebrow}</Text>
                <Text style={styles.faqHeading}>{SUPPORT_SCREEN.faqHeading}</Text>
            </View>
            {(SUPPORT_SCREEN.faqs || []).map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <TouchableOpacity
                  key={item.q}
                  activeOpacity={0.85}
                  onPress={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                  style={[styles.faqRow, isOpen ? styles.faqRowOpen : null]}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}
                  accessibilityLabel={item.q}
                >
                  <View style={styles.faqRowHead}>
                    <View style={styles.faqLead}>
                      <View style={styles.faqIconWrap}>
                        <Ionicons name="sparkles-outline" size={14} color={ALCHEMY.gold} />
                      </View>
                      <Text style={styles.faqQuestion}>{item.q}</Text>
                    </View>
                    <View style={styles.faqChevronWrap}>
                      <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={18} color={c.textSecondary} />
                    </View>
                  </View>
                  {isOpen ? <Text style={styles.faqAnswer}>{item.a}</Text> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </SectionReveal>
        <AppFooter webTight={Platform.OS === "web"} />
      </MotionScrollView>
      </KeyboardAvoidingView>
      {toast ? (
        <View style={[styles.toastWrap, { bottom: 24 + insets.bottom }, styles.peNone]}>
          <View style={styles.toast}>
            <Ionicons name="checkmark-circle" size={18} color={ALCHEMY.gold} />
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      ) : null}
      <BottomNavBar />
    </CustomerScreenShell>
  );
}

function getContactPalette(accent, c, isDark) {
  if (accent === "green") {
    return {
      bg: isDark ? "rgba(37, 211, 102, 0.14)" : "rgba(37, 211, 102, 0.12)",
      border: "rgba(37, 211, 102, 0.32)",
      icon: "#1FA855",
    };
  }
  if (accent === "navy") {
    return {
      bg: isDark ? "rgba(124, 164, 255, 0.16)" : "rgba(28, 51, 103, 0.08)",
      border: "rgba(28, 51, 103, 0.22)",
      icon: isDark ? "#A8C2FF" : "#1C3367",
    };
  }
  return {
    bg: c.primarySoft,
    border: c.primaryBorder,
    icon: c.secondary,
  };
}

function createSupportStyles(c, shadowPremium, isDark, layoutFlags = {}) {
  const { isCompactWeb = false } = layoutFlags;
  return StyleSheet.create({
  screen: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  titleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: c.primarySoft,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  panel: {
    ...customerPanel(c, shadowPremium, isDark),
    marginBottom: spacing.md + 2,
    overflow: Platform.OS === "web" ? "visible" : "hidden",
    ...Platform.select({
      web: {
        borderRadius: radius.xxl,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: isDark ? "rgba(220, 38, 38, 0.14)" : "rgba(63, 63, 70, 0.1)",
      },
      default: {},
    }),
  },
  bannerWrap: {
    marginTop: spacing.sm,
  },
  composerWrap: {
    marginTop: spacing.sm,
  },
  composerHeader: {
    marginBottom: spacing.sm,
  },
  composerTitle: {
    color: c.textPrimary,
    fontSize: typography.body,
    fontFamily: fonts.extrabold,
  },
  composerHint: {
    marginTop: 3,
    color: c.textSecondary,
    fontSize: typography.caption,
    fontFamily: fonts.regular,
    lineHeight: 18,
  },
  sendBtnSpacer: {
    marginTop: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: isCompactWeb ? "flex-start" : "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    flexWrap: isCompactWeb ? "wrap" : "nowrap",
  },
  title: {
    color: c.textPrimary,
    fontSize: typography.h2 + 1,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.3,
  },
  metaText: {
    marginTop: spacing.xs,
    color: c.textSecondary,
    fontSize: typography.overline + 1,
    fontFamily: fonts.bold,
  },
  threadMetaRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? c.border : "rgba(63, 63, 70, 0.14)",
    backgroundColor: isDark ? c.surfaceMuted : "rgba(255,255,255,0.72)",
  },
  metaPillPrimary: {
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft,
  },
  metaPillText: {
    color: c.textSecondary,
    fontSize: typography.caption,
    fontFamily: fonts.bold,
  },
  refreshBtn: {
    gap: 5,
    backgroundColor: c.primarySoft,
    ...Platform.select({
      web: {
        boxShadow: isDark ? "0 8px 18px rgba(0,0,0,0.24)" : "0 8px 16px rgba(24, 24, 27, 0.09)",
      },
      default: {},
    }),
  },
  refreshBtnText: {
    color: c.primary,
    fontSize: typography.caption,
    fontFamily: fonts.bold,
  },
  messageBubble: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.xs + 2,
    ...Platform.select({
      web: {
        boxShadow: isDark
          ? "0 10px 22px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.03)"
          : "0 8px 18px rgba(24, 24, 27, 0.08), inset 0 1px 0 rgba(255,255,255,0.82)",
      },
      default: {},
    }),
  },
  adminBubble: {
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft,
  },
  userBubble: {
    borderColor: isDark ? c.border : ALCHEMY.pillInactive,
    backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.cardBg,
  },
  adminBubbleAlign: {
    alignSelf: "flex-start",
    maxWidth: "88%",
    borderBottomLeftRadius: radius.sm,
  },
  userBubbleAlign: {
    alignSelf: "flex-end",
    maxWidth: "88%",
    borderBottomRightRadius: radius.sm,
  },
  messageStream: {
    marginBottom: spacing.sm,
  },
  messageAuthor: {
    color: c.textSecondary,
    fontSize: typography.overline,
    fontFamily: fonts.bold,
    marginBottom: 2,
  },
  messageText: {
    color: c.textPrimary,
    fontSize: typography.caption,
    fontFamily: fonts.regular,
    lineHeight: 18,
  },
  contactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  contactCard: {
    flexGrow: 1,
    flexBasis: 220,
    minWidth: 180,
    maxWidth: "100%",
  },
  contactIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  contactTitle: {
    color: c.textPrimary,
    fontSize: typography.body,
    fontFamily: fonts.extrabold,
    marginBottom: 4,
  },
  contactDescription: {
    color: c.textSecondary,
    fontSize: typography.caption,
    fontFamily: fonts.regular,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  contactCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contactCtaText: {
    fontSize: typography.caption,
    fontFamily: fonts.extrabold,
    letterSpacing: 0.3,
  },
  faqWrap: {
    ...customerPanel(c, shadowPremium, isDark),
    marginBottom: spacing.md,
    ...Platform.select({
      web: {
        borderRadius: radius.xxl,
      },
      default: {},
    }),
  },
  faqHeader: {
    marginBottom: spacing.sm,
  },
  faqEyebrow: {
    color: ALCHEMY.gold,
    fontSize: typography.overline,
    fontFamily: fonts.extrabold,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  faqHeading: {
    color: c.textPrimary,
    fontSize: typography.h2 + 2,
    fontFamily: fonts.extrabold,
  },
  faqRow: {
    marginTop: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? c.border : "rgba(63, 63, 70, 0.12)",
    borderRadius: radius.xl,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm + 2,
    backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.56)",
  },
  faqRowOpen: {
    backgroundColor: isDark ? "rgba(220, 38, 38, 0.05)" : "rgba(255, 248, 235, 0.86)",
    borderColor: isDark ? "rgba(248, 113, 113, 0.18)" : "rgba(185, 28, 28, 0.12)",
  },
  faqRowHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  faqLead: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  faqIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isDark ? "rgba(255, 214, 102, 0.12)" : "rgba(255, 243, 214, 0.92)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? "rgba(255, 214, 102, 0.18)" : "rgba(185, 28, 28, 0.08)",
  },
  faqChevronWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.86)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? c.border : "rgba(63, 63, 70, 0.1)",
  },
  faqQuestion: {
    flex: 1,
    color: c.textPrimary,
    fontSize: typography.body,
    fontFamily: fonts.bold,
  },
  faqAnswer: {
    marginTop: spacing.sm,
    color: c.textSecondary,
    fontSize: typography.caption,
    fontFamily: fonts.regular,
    lineHeight: 20,
    paddingLeft: 38,
  },
  toastWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.xxl,
    backgroundColor: isDark ? "rgba(20, 16, 12, 0.96)" : "rgba(28, 25, 23, 0.92)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ALCHEMY.gold,
    ...Platform.select({
      web: {
        boxShadow: "0 18px 38px rgba(0,0,0,0.32)",
      },
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.32,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
      },
    }),
  },
  toastText: {
    color: "#FFFDF6",
    fontSize: typography.caption,
    fontFamily: fonts.bold,
    letterSpacing: 0.2,
  },
  peNone: {
    pointerEvents: "none",
  },
  });
}
