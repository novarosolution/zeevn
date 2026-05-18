import React from "react";
import { View } from "react-native";
import Screen from "../../components/ui/Screen";
import Button from "../../components/ui/Button";
import AppFooter from "../../components/AppFooter";
import EditorialHero from "../../components/editorial/EditorialHero";
import EditorialTwoColumn from "../../components/editorial/EditorialTwoColumn";
import PressLogosStrip from "../../components/editorial/PressLogosStrip";
import HomeStatsStrip from "../../components/home/HomeStatsStrip";
import HomeTestimonials from "../../components/home/HomeTestimonials";
import { ABOUT_PAGE, EDITORIAL_PRESS_LOGOS } from "../../content/editorialContent";
import { useTheme } from "../../context/ThemeContext";
import useRouteMeta from "../../hooks/useRouteMeta";

export default function AboutScreen({ navigation }) {
  useRouteMeta("about");
  const { SPACING, colors, isDark } = useTheme();

  return (
    <Screen navigation={navigation} title="About" breadcrumbLabel="About">
      <EditorialHero kicker={ABOUT_PAGE.kicker} headline={ABOUT_PAGE.headline} subline={ABOUT_PAGE.subline} />
      {ABOUT_PAGE.sections.map((section) => (
        <EditorialTwoColumn
          key={section.key}
          title={section.title}
          body={section.body}
          image={section.image}
          imageFirst={section.imageFirst}
        />
      ))}
      <HomeStatsStrip c={colors} isDark={isDark} />
      <HomeTestimonials c={colors} isDark={isDark} />
      <PressLogosStrip logos={EDITORIAL_PRESS_LOGOS} />
      <View style={{ marginBottom: SPACING["2xl"] }}>
        <Button label={ABOUT_PAGE.ctaLabel} variant="primary" size="lg" onPress={() => navigation.navigate("Home")} />
      </View>
      <AppFooter webTight />
    </Screen>
  );
}
