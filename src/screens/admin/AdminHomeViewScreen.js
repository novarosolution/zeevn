import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AppFooter from "../../components/AppFooter";
import CustomerScreenShell from "../../components/CustomerScreenShell";
import AdminBackLink from "../../components/admin/AdminBackLink";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchAdminHomeView, updateAdminHomeView } from "../../services/adminService";
import { adminPanel } from "../../theme/adminLayout";
import MotionScrollView from "../../components/motion/MotionScrollView";
import { adminInnerPageScrollContent, customerScrollFill } from "../../theme/screenLayout";
import { fonts, radius, spacing, typography } from "../../theme/tokens";
import { ADMIN_HOME_VIEW_COPY, HOME_VIEW_DEFAULTS } from "../../content/appContent";
import PremiumInput from "../../components/ui/PremiumInput";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumChip from "../../components/ui/PremiumChip";
import PremiumCard from "../../components/ui/PremiumCard";

function Section({ label, hint, children, styles }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
      {children}
    </View>
  );
}

function QuickLinkRow({ title, subtitle, icon, onPress, styles, c }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.linkRow,
        hovered && Platform.OS === "web" ? { backgroundColor: c.surfaceMuted } : null,
        pressed ? { opacity: 0.88 } : null,
      ]}
    >
      <View style={[styles.linkIconWrap, { backgroundColor: c.primarySoft, borderColor: c.primaryBorder }]}>
        <Ionicons name={icon} size={20} color={c.primaryDark} />
      </View>
      <View style={styles.linkTextCol}>
        <Text style={[styles.linkTitle, { color: c.textPrimary }]}>{title}</Text>
        <Text style={[styles.linkSubtitle, { color: c.textSecondary }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
    </Pressable>
  );
}

export default function AdminHomeViewScreen({ navigation }) {
  const { colors: c, shadowPremium } = useTheme();
  const styles = useMemo(() => createAdminHomeViewStyles(c, shadowPremium), [c, shadowPremium]);
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const copy = ADMIN_HOME_VIEW_COPY;
  const [heroTitle, setHeroTitle] = useState(HOME_VIEW_DEFAULTS.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(HOME_VIEW_DEFAULTS.heroSubtitle);
  const [primeSectionTitle, setPrimeSectionTitle] = useState(HOME_VIEW_DEFAULTS.primeSectionTitle);
  const [productTypeTitle, setProductTypeTitle] = useState(HOME_VIEW_DEFAULTS.productTypeTitle);
  const [showPrimeSection, setShowPrimeSection] = useState(true);
  const [showHomeSections, setShowHomeSections] = useState(true);
  const [showProductTypeSections, setShowProductTypeSections] = useState(true);
  const [productCardStyle, setProductCardStyle] = useState("compact");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setError("");
      const data = await fetchAdminHomeView(token);
      setHeroTitle(data.heroTitle || HOME_VIEW_DEFAULTS.heroTitle);
      setHeroSubtitle(data.heroSubtitle || HOME_VIEW_DEFAULTS.heroSubtitle);
      setPrimeSectionTitle(data.primeSectionTitle || HOME_VIEW_DEFAULTS.primeSectionTitle);
      setProductTypeTitle(data.productTypeTitle || HOME_VIEW_DEFAULTS.productTypeTitle);
      setShowPrimeSection(data.showPrimeSection !== false);
      setShowHomeSections(data.showHomeSections !== false);
      setShowProductTypeSections(data.showProductTypeSections !== false);
      setProductCardStyle(data.productCardStyle === "comfortable" ? "comfortable" : "compact");
    } catch (err) {
      setError(err.message || "Unable to load home view settings.");
    }
  }, [token]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadSettings();
  }, [user, loadSettings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await updateAdminHomeView(token, {
        heroTitle: heroTitle.trim(),
        heroSubtitle: heroSubtitle.trim(),
        primeSectionTitle: primeSectionTitle.trim(),
        productTypeTitle: productTypeTitle.trim(),
        showPrimeSection,
        showHomeSections,
        showProductTypeSections,
        productCardStyle,
      });
      setSuccess("Storefront saved.");
    } catch (err) {
      setError(err.message || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (user && !user.isAdmin) {
    return (
      <CustomerScreenShell style={styles.screen} variant="admin">
        <View style={[styles.panel, { margin: spacing.lg }]}>
          <PremiumErrorBanner
            severity="warning"
            title="Admin access required"
            message="This account does not have admin privileges."
          />
          <PremiumButton label="Back to Home" variant="primary" onPress={() => navigation.navigate("Home")} style={styles.gateCta} />
        </View>
      </CustomerScreenShell>
    );
  }

  return (
    <CustomerScreenShell style={styles.screen} variant="admin">
      <MotionScrollView
        style={customerScrollFill}
        contentContainerStyle={adminInnerPageScrollContent(insets)}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.panel}>
          <AdminBackLink navigation={navigation} />
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
          {error ? (
            <View style={styles.bannerSpacer}>
              <PremiumErrorBanner severity="error" message={error} onClose={() => setError("")} compact />
            </View>
          ) : null}
          {success ? (
            <View style={styles.bannerSpacer}>
              <PremiumErrorBanner severity="success" message={success} onClose={() => setSuccess("")} compact />
            </View>
          ) : null}

          <Section label={copy.heroSection} hint={copy.heroHint} styles={styles}>
            <View style={styles.fieldGap}>
              <PremiumInput label="Hero title" value={heroTitle} onChangeText={setHeroTitle} iconLeft="sparkles-outline" />
            </View>
            <View style={styles.fieldGap}>
              <PremiumInput
                label="Hero subtitle"
                value={heroSubtitle}
                onChangeText={setHeroSubtitle}
                multiline
                numberOfLines={3}
                iconLeft="text-outline"
              />
            </View>
          </Section>

          <Section label={copy.sectionTitles} hint={copy.sectionTitlesHint} styles={styles}>
            <View style={styles.fieldGap}>
              <PremiumInput
                label="Prime section title"
                value={primeSectionTitle}
                onChangeText={setPrimeSectionTitle}
                placeholder="e.g. Prime Products"
                iconLeft="layers-outline"
              />
            </View>
            <View style={styles.fieldGap}>
              <PremiumInput
                label="Product type strip title"
                value={productTypeTitle}
                onChangeText={setProductTypeTitle}
                placeholder="e.g. Shop by category"
                iconLeft="grid-outline"
              />
            </View>
          </Section>

          <Section label={copy.visibilitySection} hint={copy.visibilityHint} styles={styles}>
            <PremiumCard
              padding="md"
              interactive
              onPress={() => setShowPrimeSection((current) => !current)}
              goldAccent={showPrimeSection}
              style={styles.toggleCard}
            >
              <Text style={[styles.toggleBtnText, { color: c.textPrimary }]}>
                {showPrimeSection ? "Show prime section: ON" : "Show prime section: OFF"}
              </Text>
              <Text style={[styles.toggleDetail, { color: c.textSecondary }]}>
                Controls the main prime section on Home.
              </Text>
            </PremiumCard>

            <PremiumCard
              padding="md"
              interactive
              onPress={() => setShowHomeSections((current) => !current)}
              goldAccent={showHomeSections}
              style={styles.toggleCard}
            >
              <Text style={[styles.toggleBtnText, { color: c.textPrimary }]}>
                {showHomeSections ? "Show home sections: ON" : "Show home sections: OFF"}
              </Text>
              <Text style={[styles.toggleDetail, { color: c.textSecondary }]}>
                Shows section-based groups on Home.
              </Text>
            </PremiumCard>

            <PremiumCard
              padding="md"
              interactive
              onPress={() => setShowProductTypeSections((current) => !current)}
              goldAccent={showProductTypeSections}
              style={styles.toggleCard}
            >
              <Text style={[styles.toggleBtnText, { color: c.textPrimary }]}>
                {showProductTypeSections ? "Show product types: ON" : "Show product types: OFF"}
              </Text>
              <Text style={[styles.toggleDetail, { color: c.textSecondary }]}>
                Shows the product type strip on Home.
              </Text>
            </PremiumCard>
          </Section>

          <Section label={copy.cardLayoutSection} hint={copy.cardLayoutHint} styles={styles}>
            <View style={styles.row}>
              <PremiumChip
                label="Compact"
                tone="gold"
                size="md"
                selected={productCardStyle === "compact"}
                onPress={() => setProductCardStyle("compact")}
                style={styles.modeChip}
              />
              <PremiumChip
                label="Comfortable"
                tone="gold"
                size="md"
                selected={productCardStyle === "comfortable"}
                onPress={() => setProductCardStyle("comfortable")}
                style={styles.modeChip}
              />
            </View>
          </Section>

          <Section label={copy.quickLinks} hint={null} styles={styles}>
            <View style={[styles.linkStack, { borderColor: c.border }]}>
              <QuickLinkRow
                title={copy.linkProductsTitle}
                subtitle={copy.linkProductsSubtitle}
                icon="cube-outline"
                onPress={() => navigation.navigate("AdminProducts")}
                styles={styles}
                c={c}
              />
              <View style={[styles.linkDivider, { backgroundColor: c.border }]} />
              <QuickLinkRow
                title={copy.linkAddProductTitle}
                subtitle={copy.linkAddProductSubtitle}
                icon="add-circle-outline"
                onPress={() => navigation.navigate("AdminAddProduct")}
                styles={styles}
                c={c}
              />
            </View>
          </Section>

          <PremiumButton
            label={saving ? "Saving…" : "Save storefront settings"}
            variant="primary"
            size="lg"
            onPress={handleSave}
            disabled={saving}
            loading={saving}
            fullWidth
          />
        </View>
        <AppFooter />
      </MotionScrollView>
    </CustomerScreenShell>
  );
}

function createAdminHomeViewStyles(c, shadowPremium) {
  return StyleSheet.create({
    screen: {
      flex: 1,
    },
    panel: {
      ...adminPanel(c, shadowPremium),
    },
    gateCta: {
      marginTop: spacing.md,
      alignSelf: "flex-start",
    },
    toggleCard: {
      marginBottom: spacing.sm,
    },
    modeChip: {
      flex: 1,
    },
    title: {
      color: c.textPrimary,
      fontSize: typography.h2,
      fontFamily: fonts.extrabold,
      letterSpacing: -0.35,
    },
    subtitle: {
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
      color: c.textSecondary,
      fontSize: typography.bodySmall,
      lineHeight: 20,
      fontFamily: fonts.medium,
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionLabel: {
      color: c.textPrimary,
      fontSize: typography.bodySmall,
      fontFamily: fonts.extrabold,
      letterSpacing: 0.35,
      textTransform: "uppercase",
      marginBottom: spacing.xs,
    },
    sectionHint: {
      color: c.textMuted,
      fontSize: typography.caption,
      lineHeight: 17,
      fontFamily: fonts.medium,
      marginBottom: spacing.sm,
    },
    bannerSpacer: {
      marginBottom: spacing.sm,
    },
    fieldGap: {
      marginBottom: spacing.sm,
    },
    toggleBtnText: {
      fontWeight: "700",
      fontSize: typography.bodySmall,
      fontFamily: fonts.bold,
    },
    toggleDetail: {
      marginTop: 4,
      fontSize: typography.caption,
      fontFamily: fonts.medium,
      lineHeight: 16,
    },
    row: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    linkStack: {
      borderRadius: radius.lg,
      borderWidth: 1,
      overflow: "hidden",
    },
    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: c.surface,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    linkIconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      alignItems: "center",
      justifyContent: "center",
    },
    linkTextCol: {
      flex: 1,
      minWidth: 0,
    },
    linkTitle: {
      fontSize: typography.bodySmall,
      fontFamily: fonts.bold,
    },
    linkSubtitle: {
      marginTop: 2,
      fontSize: typography.caption,
      fontFamily: fonts.medium,
      lineHeight: 16,
    },
    linkDivider: {
      height: StyleSheet.hairlineWidth,
      marginLeft: spacing.md + 44 + spacing.md,
    },
  });
}
