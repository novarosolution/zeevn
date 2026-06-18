import React, { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useKankregLayout } from "../theme/kankregBreakpoints";
import Animated, { FadeInLeft, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import SectionReveal from "../components/motion/SectionReveal";
import useReducedMotion from "../hooks/useReducedMotion";
import { motionDuration, staggerDelay } from "../theme/motion";
import KankregScrollPage from "../components/kankreg/KankregScrollPage";

import BottomNavBar from "../components/BottomNavBar";
import AuthGateShell from "../components/AuthGateShell";
import CustomerScreenShell from "../components/CustomerScreenShell";
import KankregCustomerPageHeader from "../components/kankreg/KankregCustomerPageHeader";
import { useAuth } from "../context/AuthContext";
import { useLiveSocket } from "../context/LiveSocketContext";
import { useTheme } from "../context/ThemeContext";
import { fetchMySupportThread, sendMySupportMessage } from "../services/userService";
import {
  customerPanel,
  customerScrollFill} from "../theme/screenLayout";
import { SUPPORT_EMAIL_DISPLAY, SUPPORT_SCREEN } from "../content/appContent";
import { ALCHEMY } from "../theme/customerAlchemy";
import { fonts, icon, radius, spacing, typography } from "../theme/tokens";
import PremiumEmptyState from "../components/ui/PremiumEmptyState";
import PremiumErrorBanner from "../components/ui/PremiumErrorBanner";
import PremiumInput from "../components/ui/PremiumInput";
import PremiumButton from "../components/ui/PremiumButton";
import PremiumCard from "../components/ui/PremiumCard";
import SkeletonBlock from "../components/ui/SkeletonBlock";
import NativeCard from "../components/native/NativeCard";
import { FIGMA } from "../theme/figmaApp";

function buildSupportContactLinks() {
  return [
    {
      key: "chat",
      icon: "chatbubble-ellipses",
      title: SUPPORT_SCREEN.liveChatTitle,
      description: SUPPORT_SCREEN.contactChatSub,
      accent: "gold",
      actionType: "scroll"},
    {
      key: "email",
      icon: "mail",
      title: "Email",
      description: SUPPORT_SCREEN.contactEmailSub,
      accent: "navy",
      actionType: "link",
      url: `mailto:${SUPPORT_EMAIL_DISPLAY}`},
  ].filter(Boolean);
}

export default function SupportScreen({ navigation }) {
  const { isXs, isSm } = useKankregLayout();
  const isCompactWeb = Platform.OS === "web" && (isXs || isSm);
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
      setError(err.message || "Unable to load support chat.");
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

  const { on: onLiveEvent } = useLiveSocket();
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    return onLiveEvent("support:thread", ({ thread: incoming }) => {
      if (incoming) setThread(incoming);
    });
  }, [isAuthenticated, onLiveEvent]);

  const handleSend = async () => {
    const text = String(message || "").trim();
    if (!text) return;
    try {
      setSending(true);
      setError("");
      const updated = await sendMySupportMessage(token, text);
      setThread(updated || null);
      setMessage("");
      setToast("Sent");
    } catch (err) {
      setError(err.message || "Unable to send message.");
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
    if (link.actionType === "link" && link.url) {
      try {
        const can = await Linking.canOpenURL(link.url);
        if (can) await Linking.openURL(link.url);
      } catch (_err) { /* ignore */ }
    }
  }, []);

  const isNativeApp = Platform.OS !== "web";

  if (isAuthLoading) {
    return <AuthGateShell navigation={navigation} />;
  }
  if (!isAuthenticated) {
    return <AuthGateShell signedOut navigation={navigation} />;
  }

  return (
    <CustomerScreenShell style={styles.screen}>
      <KeyboardAvoidingView
        style={customerScrollFill}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
      <KankregScrollPage
        scrollVariant="inner"
        style={customerScrollFill}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <KankregCustomerPageHeader
          eyebrow={SUPPORT_SCREEN.pageEyebrow}
          title={SUPPORT_SCREEN.pageTitle}
          subtitle={SUPPORT_SCREEN.pageSubtitle}
          navigation={navigation}
          showHairline={!isNativeApp}
        />
        <SectionReveal preset="fade-up" delay={20}>
          <View style={[styles.contactGrid, isNativeApp && styles.nativeContactGrid]}>
            {buildSupportContactLinks().map((link) => {
              if (isNativeApp) {
                const palette = getContactPalette(link.accent, c, isDark);
                return (
                  <NativeCard key={link.key} style={styles.nativeContactCard}>
                    <Pressable
                      onPress={() => handleContactPress(link)}
                      style={styles.nativeContactInner}
                    >
                      <View style={[styles.contactIconWrap, { backgroundColor: palette.bg, borderColor: palette.border }]}>
                        <Ionicons name={link.icon} size={icon.md} color={palette.icon} />
                      </View>
                      <View style={styles.nativeContactText}>
                        <Text style={styles.contactTitle}>{link.title}</Text>
                        <Text style={styles.contactDescription} numberOfLines={2}>{link.description}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={FIGMA.inkFaint} />
                    </Pressable>
                  </NativeCard>
                );
              }
              const palette = getContactPalette(link.accent, c, isDark);
              return (
                <PremiumCard
                  key={link.key}
                  onPress={() => handleContactPress(link)}
                  goldAccent={link.accent === "gold"}
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
                      {link.actionType === "scroll" ? "Open chat" : "Reach out"}
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color={palette.icon} />
                  </View>
                </PremiumCard>
              );
            })}
          </View>
        </SectionReveal>
        <SectionReveal preset="fade-up" delay={40}>
        <View style={styles.panel}>
          {Platform.OS === "web" ? (
            <View style={styles.headerRow}>
              <View style={styles.titleRow}>
                <View style={styles.titleIconWrap}>
                  <Ionicons name="headset-outline" size={icon.lg} color={c.secondary} />
                </View>
                <Text style={styles.title}>{SUPPORT_SCREEN.liveChatTitle}</Text>
              </View>
              <PremiumButton
                label="Refresh"
                iconLeft="refresh-outline"
                variant="ghost"
                size="sm"
                onPress={loadThread}
              />
            </View>
          ) : null}
          {error ? (
            <View style={styles.bannerWrap}>
              <PremiumErrorBanner severity="error" message={error} compact />
            </View>
          ) : null}
          {thread ? (
            <Text style={styles.metaText}>
              Ticket status: {thread.status || "open"} • Last update:{" "}
              {thread.lastMessageAt ? new Date(thread.lastMessageAt).toLocaleString() : "N/A"}
            </Text>
          ) : null}
        </View>
        </SectionReveal>
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
          <View style={styles.panel}>
            {(thread?.messages || []).length === 0 ? (
              <PremiumEmptyState
                iconName="chatbubbles-outline"
                title="Start the conversation"
                description="Tell our team how we can help. We typically reply within a few hours."
                compact
              />
            ) : (
              (thread?.messages || []).map((item, index) => {
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
                      {isAdmin ? "Admin" : "You"} •{" "}
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                    </Text>
                    <Text style={styles.messageText}>{item.message}</Text>
                  </Animated.View>
                );
              })
            )}
            <View style={styles.composerWrap}>
              <PremiumInput
                label="Your message"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={3}
                iconLeft="chatbox-ellipses-outline"
              />
            </View>
            <PremiumButton
              label={sending ? "Sending…" : "Send message"}
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
              {Platform.OS !== "web" ? (
                <Text style={styles.faqEyebrow}>{SUPPORT_SCREEN.pageEyebrow}</Text>
              ) : null}
              <Text style={styles.faqHeading}>{SUPPORT_SCREEN.faqTitle}</Text>
            </View>
            {SUPPORT_SCREEN.faqs.map((item, idx) => {
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
                    <Text style={styles.faqQuestion}>{item.q}</Text>
                    <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={18} color={c.textSecondary} />
                  </View>
                  {isOpen ? <Text style={styles.faqAnswer}>{item.a}</Text> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </SectionReveal>
</KankregScrollPage>
      </KeyboardAvoidingView>
      {toast ? (
        <View style={[styles.toastWrap, { bottom: 24 + insets.bottom }, styles.peNone]}>
          <View style={styles.toast}>
            <Ionicons name="checkmark-circle" size={18} color={isDark ? c.accentGold : ALCHEMY.gold} />
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
      icon: "#1FA855"};
  }
  if (accent === "navy") {
    return {
      bg: isDark ? "rgba(124, 164, 255, 0.16)" : "rgba(28, 51, 103, 0.08)",
      border: "rgba(28, 51, 103, 0.22)",
      icon: isDark ? "#A8C2FF" : "#1C3367"};
  }
  return {
    bg: c.primarySoft,
    border: c.primaryBorder,
    icon: c.secondary};
}

function createSupportStyles(c, shadowPremium, isDark, layoutFlags = {}) {
  const { isCompactWeb = false } = layoutFlags;
  return StyleSheet.create({
  screen: {
    flex: 1},
  nativeContactGrid: {
    paddingHorizontal: FIGMA.gutter,
    gap: 10,
  },
  nativeContactCard: {
    marginBottom: 0,
  },
  nativeContactInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
  },
  nativeContactText: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1},
  titleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: c.primarySoft,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    alignItems: "center",
    justifyContent: "center"},
  panel: {
    ...customerPanel(c, shadowPremium, isDark),
    marginBottom: spacing.md + 2,
    overflow: Platform.OS === "web" ? "visible" : "hidden",
    ...Platform.select({
      web: {
        borderRadius: radius.xxl,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: isDark ? "rgba(52, 211, 153, 0.14)" : "rgba(22, 69, 51, 0.1)"},
      default: {}})},
  bannerWrap: {
    marginTop: spacing.sm},
  composerWrap: {
    marginTop: spacing.sm},
  sendBtnSpacer: {
    marginTop: spacing.sm},
  headerRow: {
    flexDirection: "row",
    alignItems: isCompactWeb ? "flex-start" : "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    flexWrap: isCompactWeb ? "wrap" : "nowrap"},
  title: {
    color: c.textPrimary,
    fontSize: typography.h2 + 1,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.3},
  metaText: {
    marginTop: spacing.xs,
    color: c.textSecondary,
    fontSize: typography.overline + 1,
    fontFamily: fonts.bold},
  refreshBtn: {
    gap: 5,
    backgroundColor: c.primarySoft,
    ...Platform.select({
      web: {
        boxShadow: isDark ? "0 8px 18px rgba(0,0,0,0.24)" : "0 8px 16px rgba(22, 69, 51, 0.09)"},
      default: {}})},
  refreshBtnText: {
    color: c.primary,
    fontSize: typography.caption,
    fontFamily: fonts.bold},
  messageBubble: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.xs + 2,
    ...Platform.select({
      web: {
        boxShadow: isDark
          ? "0 10px 22px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.03)"
          : "0 8px 18px rgba(22, 69, 51, 0.08), inset 0 1px 0 rgba(255,255,255,0.82)"},
      default: {}})},
  adminBubble: {
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft},
  userBubble: {
    borderColor: isDark ? c.border : ALCHEMY.pillInactive,
    backgroundColor: isDark ? c.surfaceMuted : ALCHEMY.cardBg},
  adminBubbleAlign: {
    alignSelf: "flex-start",
    maxWidth: "88%",
    borderBottomLeftRadius: radius.sm},
  userBubbleAlign: {
    alignSelf: "flex-end",
    maxWidth: "88%",
    borderBottomRightRadius: radius.sm},
  messageAuthor: {
    color: c.textSecondary,
    fontSize: typography.overline,
    fontFamily: fonts.bold,
    marginBottom: 2},
  messageText: {
    color: c.textPrimary,
    fontSize: typography.caption,
    fontFamily: fonts.regular,
    lineHeight: 18},
  contactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm + 2,
    marginBottom: spacing.md},
  contactCard: {
    flexGrow: 1,
    flexBasis: 220,
    minWidth: 180,
    maxWidth: "100%"},
  contactIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm},
  contactTitle: {
    color: c.textPrimary,
    fontSize: typography.body,
    fontFamily: fonts.extrabold,
    marginBottom: 4},
  contactDescription: {
    color: c.textSecondary,
    fontSize: typography.caption,
    fontFamily: fonts.regular,
    lineHeight: 18,
    marginBottom: spacing.sm},
  contactCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6},
  contactCtaText: {
    fontSize: typography.caption,
    fontFamily: fonts.extrabold,
    letterSpacing: 0.3},
  faqWrap: {
    ...customerPanel(c, shadowPremium, isDark),
    marginBottom: spacing.md,
    ...Platform.select({
      web: {
        borderRadius: radius.xxl},
      default: {}})},
  faqHeader: {
    marginBottom: spacing.sm},
  faqEyebrow: {
    color: isDark ? c.accentGold : ALCHEMY.gold,
    fontSize: typography.overline,
    fontFamily: fonts.extrabold,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 4},
  faqHeading: {
    color: c.textPrimary,
    fontSize: typography.h2 + 2,
    fontFamily: fonts.extrabold},
  faqRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.divider,
    paddingVertical: spacing.sm + 2},
  faqRowOpen: {
    backgroundColor: isDark ? "rgba(52, 211, 153, 0.05)" : "rgba(199, 154, 58, 0.04)",
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    marginHorizontal: -spacing.sm},
  faqRowHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm},
  faqQuestion: {
    flex: 1,
    color: c.textPrimary,
    fontSize: typography.body,
    fontFamily: fonts.bold},
  faqAnswer: {
    marginTop: spacing.xs,
    color: c.textSecondary,
    fontSize: typography.caption,
    fontFamily: fonts.regular,
    lineHeight: 20},
  toastWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center"},
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.xxl,
    backgroundColor: isDark ? "rgba(20, 16, 12, 0.96)" : "rgba(28, 25, 23, 0.92)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? c.accentGold : ALCHEMY.gold,
    ...Platform.select({
      web: {
        boxShadow: "0 18px 38px rgba(0,0,0,0.32)"},
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.32,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8}})},
  toastText: {
    color: "#FFFDF6",
    fontSize: typography.caption,
    fontFamily: fonts.bold,
    letterSpacing: 0.2},
  peNone: {
    pointerEvents: "none"}});
}
