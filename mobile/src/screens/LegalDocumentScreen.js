import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import CustomerScreenShell from "../components/CustomerScreenShell";
import BottomNavBar from "../components/BottomNavBar";
import KankregScrollPage from "../components/kankreg/KankregScrollPage";
import { KankregPageWrap } from "../components/kankreg/KankregPageChrome";
import KankregCustomerPageHeader from "../components/kankreg/KankregCustomerPageHeader";
import SectionReveal from "../components/motion/SectionReveal";
import { LEGAL_PAGES } from "../content/appContent";
import { useTheme } from "../context/ThemeContext";
import { getKankregSurfaces } from "../theme/kankregWeb";
import { useKankregLayout } from "../theme/kankregBreakpoints";
import { fonts, layout, radius, spacing, typography } from "../theme/tokens";
import { customerScrollFill } from "../theme/screenLayout";
import GoldHairline from "../components/ui/GoldHairline";
import { StoreLegal } from "../components/store/entry";
import { shadowStyleForPlatform } from "../theme/shadowPlatform";

const DOC_BY_ROUTE = {
  Privacy: "privacy",
  Terms: "terms",
};

export default function LegalDocumentScreen({ navigation, route }) {
  const { colors: c, isDark, shadowPremium } = useTheme();
  const { isMd, showMobileWebTabBar } = useKankregLayout();
  const docKey = DOC_BY_ROUTE[route.name] || "privacy";
  const doc = LEGAL_PAGES[docKey];
  const surfaces = getKankregSurfaces(isDark, c);
  const styles = useMemo(() => createStyles(surfaces, isDark, shadowPremium), [surfaces, isDark, shadowPremium]);

  if (Platform.OS !== "web") {
    return <StoreLegal navigation={navigation} doc={doc} icon={docKey === "terms" ? "document-text-outline" : "shield-checkmark-outline"} />;
  }

  return (
    <CustomerScreenShell>
      <KankregScrollPage scrollVariant="page" style={customerScrollFill}>
        <KankregPageWrap style={styles.wrap}>
          <KankregCustomerPageHeader
            eyebrow={doc.eyebrow}
            title={doc.title}
            subtitle={doc.updated}
            navigation={navigation}
            showBack={Platform.OS !== "web" || !isMd}
            showHairline
          />

          <SectionReveal preset="fade-up" delay={0}>
            <View style={styles.proseCard}>
              <Text style={styles.intro}>{doc.intro}</Text>
              <GoldHairline marginVertical={spacing.md} />
              {doc.sections.map((section, idx) => (
                <View key={section.title} style={idx > 0 ? styles.sectionGap : null}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionBody}>{section.body}</Text>
                </View>
              ))}
            </View>
          </SectionReveal>
        </KankregPageWrap>
      </KankregScrollPage>
      {(Platform.OS !== "web" || showMobileWebTabBar) && <BottomNavBar />}
    </CustomerScreenShell>
  );
}

function createStyles(surfaces, isDark, shadowPremium) {
  return StyleSheet.create({
    wrap: {
      paddingBottom: spacing.lg,
    },
    proseCard: {
      width: "100%",
      maxWidth: Math.min(layout.maxContentWidth, 760),
      alignSelf: "center",
      backgroundColor: surfaces.card,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: surfaces.border,
      padding: spacing.xl,
      ...shadowStyleForPlatform(shadowPremium),
    },
    intro: {
      fontSize: typography.body + 1,
      lineHeight: 26,
      color: surfaces.textSoft,
    },
    sectionGap: {
      marginTop: spacing.lg,
    },
    sectionTitle: {
      fontFamily: fonts.semibold,
      fontSize: typography.body + 1,
      color: surfaces.text,
      marginBottom: spacing.xs,
    },
    sectionBody: {
      fontSize: typography.body,
      lineHeight: typography.body * 1.65,
      color: surfaces.textSoft,
    },
  });
}
