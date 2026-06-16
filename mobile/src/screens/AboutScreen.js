import React, { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet } from "react-native";
import CustomerScreenShell from "../components/CustomerScreenShell";
import BottomNavBar from "../components/BottomNavBar";
import KankregScrollPage from "../components/kankreg/KankregScrollPage";
import { KankregGrainOverlay, KankregPageWrap } from "../components/kankreg/KankregPageChrome";
import KankregCustomerPageHeader from "../components/kankreg/KankregCustomerPageHeader";
import KankregAnimatedSection from "../components/kankreg/KankregAnimatedSection";
import AboutPageLayout from "../components/about/AboutPageLayout";
import AboutPageStory from "../components/about/AboutPageStory";
import { DEFAULT_HOME_VIEW_CONFIG, getHomeViewConfig } from "../services/productService";
import { resolveAboutPageDisplay } from "../utils/homeViewMedia";
import { ABOUT_PAGE_ANIM, ABOUT_PAGE_HEADER } from "../content/aboutPageContent";
import { useKankregLayout } from "../theme/kankregBreakpoints";
import { KANKREG_PAGE_SECTION_GAP } from "../theme/kankregScreenStyles";
import { customerScrollFill } from "../theme/screenLayout";

export default function AboutScreen({ navigation }) {
  const { isMd, showMobileWebTabBar } = useKankregLayout();
  const craftRef = useRef(null);
  const [aboutSection, setAboutSection] = useState(DEFAULT_HOME_VIEW_CONFIG.aboutSection);

  useEffect(() => {
    let cancelled = false;
    getHomeViewConfig()
      .then((config) => {
        if (!cancelled && config?.aboutSection) {
          setAboutSection(config.aboutSection);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const about = resolveAboutPageDisplay(aboutSection);

  return (
    <CustomerScreenShell>
      {Platform.OS === "web" ? <KankregGrainOverlay /> : null}
      <KankregScrollPage scrollVariant="page" style={customerScrollFill}>
        <KankregPageWrap style={styles.wrap}>
          <KankregAnimatedSection index={ABOUT_PAGE_ANIM.header} preset="fade-up" immediate>
            <KankregCustomerPageHeader
              eyebrow={about?.eyebrow || ABOUT_PAGE_HEADER.eyebrow}
              title={about?.title || ABOUT_PAGE_HEADER.title}
              subtitle={about?.pageLead || undefined}
              navigation={navigation}
              showBack={Platform.OS !== "web" || !isMd}
              index={1}
              showHairline={false}
            />
          </KankregAnimatedSection>

          {about ? (
            <AboutPageLayout about={about} navigation={navigation} craftRef={craftRef}>
              <AboutPageStory about={about} />
            </AboutPageLayout>
          ) : null}
        </KankregPageWrap>
      </KankregScrollPage>
      {(Platform.OS !== "web" || showMobileWebTabBar) && <BottomNavBar />}
    </CustomerScreenShell>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: KANKREG_PAGE_SECTION_GAP,
    paddingBottom: 8,
  },
});
