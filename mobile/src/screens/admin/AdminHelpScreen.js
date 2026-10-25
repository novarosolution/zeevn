import React, { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ADMIN_GATE } from "../../content/adminContent";
import { ADMIN_HELP } from "../../content/adminHelp";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminButton from "../../components/admin/AdminButton";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { ADMIN_FONT, adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { radius, spacing } from "../../theme/tokens";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

export default function AdminHelpScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium, compact), [chrome, c, shadowPremium, compact]);
  const [sectionKey, setSectionKey] = useState(compact ? "" : ADMIN_HELP.sections[0].key);

  useEffect(() => {
    if (!compact && !sectionKey) setSectionKey(ADMIN_HELP.sections[0].key);
  }, [compact, sectionKey]);

  const section = ADMIN_HELP.sections.find((item) => item.key === sectionKey) || null;

  const open = (name) => {
    if (name) navigation.navigate(name);
  };

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.gatePanel}>
              <PremiumErrorBanner severity="warning" title={ADMIN_GATE.title} message={ADMIN_GATE.message} />
              <AdminButton label={ADMIN_GATE.backHome} variant="primary" onPress={() => navigateCustomerRoute(navigation, "Home")} style={styles.gateCta} />
            </View>
          </SectionReveal>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

  const renderSectionRow = (item) => {
    const on = item.key === sectionKey;
    return (
      <Pressable
        key={item.key}
        onPress={() => setSectionKey(item.key)}
        style={({ pressed }) => [styles.sectionRow, on && styles.sectionOn, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
        accessibilityLabel={item.title}
      >
        <Text style={[styles.sectionTitle, on && styles.sectionTitleOn]}>{item.title}</Text>
      </Pressable>
    );
  };

  const renderStep = (step, index) => (
    <View key={`${step.route}-${index}`} style={styles.step}>
      <Pressable
        onPress={() => open(step.route)}
        style={({ pressed }) => [styles.stepMain, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={step.title}
      >
        <Text style={styles.stepTitle}>{step.title}</Text>
        {step.body ? <Text style={styles.stepBody}>{step.body}</Text> : null}
      </Pressable>
      {step.also ? (
        <AdminButton label={step.also.label} variant="ghost" size="sm" onPress={() => open(step.also.route)} />
      ) : null}
    </View>
  );

  const stepsPanel = section ? (
    <View style={styles.stepsCol}>
      {compact ? <AdminButton label="Sections" icon="arrow-back" variant="ghost" size="sm" onPress={() => setSectionKey("")} /> : null}
      <Text style={styles.detailTitle}>{section.title}</Text>
      {section.intro ? <Text style={styles.intro}>{section.intro}</Text> : null}
      <View style={styles.steps}>{section.steps.map(renderStep)}</View>
    </View>
  ) : null;

  const listPanel = <View style={styles.list}>{ADMIN_HELP.sections.map(renderSectionRow)}</View>;

  return (
    <AdminScreenShell style={styles.screen}>
      {compact && section ? (
        <KankregAdminShell navigation={navigation} route={route} title={ADMIN_HELP.title} subtitle={ADMIN_HELP.subtitle}>
          <ScrollView style={customerScrollFill} contentContainerStyle={styles.phoneSteps} keyboardShouldPersistTaps="handled">
            {stepsPanel}
          </ScrollView>
        </KankregAdminShell>
      ) : (
        <KankregScrollPage scrollVariant="admin" showFooter={false} style={customerScrollFill} keyboardShouldPersistTaps="handled">
          <KankregAdminShell navigation={navigation} route={route} title={ADMIN_HELP.title} subtitle={ADMIN_HELP.subtitle}>
            <View style={[styles.panel, !compact && styles.panelSplit]}>
              {compact ? (
                listPanel
              ) : (
                <View style={styles.split}>
                  <View style={styles.left}>{listPanel}</View>
                  <View style={styles.right}>{stepsPanel}</View>
                </View>
              )}
            </View>
          </KankregAdminShell>
        </KankregScrollPage>
      )}
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium, compact) {
  return StyleSheet.create({
    screen: { flex: 1, width: "100%", alignSelf: "center", maxWidth: "100%" },
    panel: { ...adminShellContent(), gap: spacing.sm },
    panelSplit: { flex: 1, minHeight: 0 },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    split: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 16,
      ...Platform.select({ web: { minHeight: 480 }, default: {} }),
    },
    left: { width: 260, flexShrink: 0 },
    right: { flex: 1, minWidth: 0 },
    list: {
      backgroundColor: chrome.card,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      overflow: "hidden",
    },
    sectionRow: {
      paddingHorizontal: 16,
      paddingVertical: 13,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
      borderLeftWidth: 3,
      borderLeftColor: "transparent",
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    sectionOn: { backgroundColor: chrome.paper, borderLeftColor: chrome.goldDeep },
    sectionTitle: { fontSize: 14, color: chrome.ink, fontFamily: ADMIN_FONT.semibold },
    sectionTitleOn: { color: chrome.ink },
    pressed: { opacity: 0.82 },
    stepsCol: { gap: 10 },
    phoneSteps: { paddingBottom: 24, gap: 10 },
    detailTitle: { fontSize: 20, color: chrome.ink, fontFamily: ADMIN_FONT.bold },
    intro: { fontSize: 14, lineHeight: 21, color: chrome.inkSoft, fontFamily: ADMIN_FONT.regular },
    steps: {
      backgroundColor: chrome.card,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      overflow: "hidden",
    },
    step: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
    },
    stepMain: { gap: 4, ...Platform.select({ web: { cursor: "pointer" }, default: {} }) },
    stepTitle: { fontSize: 15, color: chrome.ink, fontFamily: ADMIN_FONT.semibold },
    stepBody: { fontSize: 13.5, lineHeight: 20, color: chrome.inkSoft, fontFamily: ADMIN_FONT.regular },
  });
}
